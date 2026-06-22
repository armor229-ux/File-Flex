'use client'

import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import JSZip from "jszip"
import { FileText, Images, RotateCcw } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/file-utils"

// Set once, using the installed version for a guaranteed worker match.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

type ExtractedImage = {
  width: number
  height: number
  data: Uint8Array | Uint8ClampedArray
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas-to-blob conversion failed"))
        else resolve(blob)
      },
      "image/png"
    )
  })
}

function imageToCanvas(img: ExtractedImage): HTMLCanvasElement {
  const { width, height, data } = img
  if (!width || !height) throw new Error("Image has zero dimensions")
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get a 2D canvas context")

  // Always allocate a fresh ArrayBuffer-backed Uint8ClampedArray so the
  // ImageData constructor (which requires Uint8ClampedArray<ArrayBuffer>, not
  // <ArrayBufferLike>) is satisfied under TS 5.7+ strict typing.
  const total = width * height
  const rgba = new Uint8ClampedArray(new ArrayBuffer(total * 4))
  if (data.length === total * 4) {
    // Already RGBA; copy as-is.
    rgba.set(data)
  } else if (data.length === total * 3) {
    // RGB → expand to RGBA.
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i]
      rgba[j + 1] = data[i + 1]
      rgba[j + 2] = data[i + 2]
      rgba[j + 3] = 255
    }
  } else {
    throw new Error(
      `Unsupported image format (${data.length} bytes for ${width}×${height})`
    )
  }

  const imageData = new ImageData(rgba, width, height)
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function isExtractedImage(value: unknown): value is ExtractedImage {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.width === "number" &&
    typeof v.height === "number" &&
    (v.data instanceof Uint8Array || v.data instanceof Uint8ClampedArray)
  )
}

export default function PdfExtractImages() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const [results, setResults] = useState<ResultFile[] | null>(null)
  const [message, setMessage] = useState("")

  const reset = () => {
    setFile(null)
    setResults(null)
    setMessage("")
    setProgress(0)
    setProgressLabel("")
  }

  const run = async (f: File) => {
    setProcessing(true)
    setProgress(0)
    setProgressLabel("")
    try {
      const data = new Uint8Array(await f.arrayBuffer())
      // Hold onto the loading task so we can call destroy() on it (the proper
      // API per pdfjs-dist types — PDFDocumentProxy itself has no destroy()).
      const loadingTask = pdfjsLib.getDocument({ data })
      const pdf = await loadingTask.promise
      const total = pdf.numPages
      const collected: { name: string; blob: Blob }[] = []
      let counter = 0

      for (let i = 1; i <= total; i++) {
        setProgressLabel(`Extracting page ${i} of ${total}…`)
        const page = await pdf.getPage(i)
        const ops = await page.getOperatorList()
        const { fnArray, argsArray } = ops
        const OPS = pdfjsLib.OPS

        for (let k = 0; k < fnArray.length; k++) {
          const fn = fnArray[k]
          // pdfjs's OPS enum (v6) exposes paintImageXObject and
          // paintInlineImageXObject. paintJpegXObject was merged into
          // paintImageXObject in earlier versions, so we don't need it here.
          const isObj = fn === OPS.paintImageXObject
          const isInline = fn === OPS.paintInlineImageXObject
          if (!isObj && !isInline) continue

          try {
            const args = argsArray[k] as unknown[] | undefined
            let img: ExtractedImage | null = null

            if (isInline) {
              const arg = args?.[0]
              if (isExtractedImage(arg)) img = arg
            } else {
              const name = args?.[0]
              if (typeof name !== "string") continue
              // page.objs.get(name) returns Promise<unknown> | null when no
              // callback is passed; awaiting gives the resolved object.
              const promise = page.objs.get(name) as Promise<unknown> | null
              if (!promise) continue
              const resolved = await promise
              if (isExtractedImage(resolved)) img = resolved
            }
            if (!img) continue

            const canvas = imageToCanvas(img)
            const blob = await canvasToBlob(canvas)
            counter += 1
            collected.push({
              name: `image-p${i}-${counter}.png`,
              blob,
            })

            // Free canvas memory between images.
            canvas.width = 0
            canvas.height = 0
          } catch {
            // Per-image failure: skip silently and continue.
          }
        }

        setProgress(Math.round((i / total) * 100))
        await page.cleanup()
      }

      await loadingTask.destroy()

      if (collected.length === 0) {
        toast({
          title: "No images found",
          description:
            "This PDF may contain only vector graphics or encrypted content.",
        })
        setResults(null)
      } else {
        let outFiles: ResultFile[]
        let msg: string
        if (collected.length === 1) {
          outFiles = [{ name: collected[0].name, blob: collected[0].blob }]
          msg = `Extracted 1 image (${formatBytes(collected[0].blob.size)}).`
        } else {
          const zip = new JSZip()
          for (const c of collected) zip.file(c.name, c.blob)
          const zipBlob = await zip.generateAsync({ type: "blob" })
          outFiles = [{ name: "pdf-images.zip", blob: zipBlob }]
          const totalSize = collected.reduce((s, c) => s + c.blob.size, 0)
          msg = `Extracted ${collected.length} images (${formatBytes(
            totalSize
          )} total).`
        }
        setResults(outFiles)
        setMessage(msg)
        toast({
          title: "Extraction complete",
          description: `${collected.length} image${
            collected.length === 1 ? "" : "s"
          } extracted.`,
        })
      }
    } catch (e) {
      const err = e as Error
      toast({
        title: "Extraction failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setProgress(0)
      setProgressLabel("")
    }
  }

  const handleFiles = (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (f.type !== "application/pdf") {
      toast({
        title: "Not a PDF",
        description: "Please choose a .pdf file.",
        variant: "destructive",
      })
      return
    }
    setFile(f)
    setResults(null)
    setMessage("")
    void run(f)
  }

  if (results) {
    return (
      <Card className="p-5 sm:p-6">
        <ResultPanel files={results} onReset={reset} message={message} />
      </Card>
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        {!file ? (
          <FileDropzone
            accept="application/pdf"
            onFiles={handleFiles}
            label="Drop a PDF here or click to browse"
            hint="Extracts raster images embedded in the PDF."
            disabled={processing}
          />
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              {!processing && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="size-4" /> Change
                </Button>
              )}
            </div>

            {processing && (
              <div className="flex flex-col gap-2">
                <Spinner label={progressLabel || "Extracting…"} />
                <Progress value={progress} />
              </div>
            )}

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Images className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Extracts raster images embedded in the PDF. Vector graphics and
                some encrypted PDFs may yield nothing.
              </span>
            </p>
          </>
        )}
      </div>
    </Card>
  )
}
