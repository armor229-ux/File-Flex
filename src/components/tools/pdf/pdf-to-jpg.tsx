'use client'

import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import JSZip from "jszip"
import { FileText, RotateCcw } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/file-utils"

// Set once, using the installed version for a guaranteed worker match.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

type ImgFormat = "jpg" | "png"

const SCALE_OPTIONS = [
  { value: "1", label: "1× — 96 DPI" },
  { value: "2", label: "2× — 192 DPI" },
  { value: "3", label: "3× — 288 DPI" },
]

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas-to-blob conversion failed"))
        else resolve(blob)
      },
      type,
      quality
    )
  })
}

export default function PdfToJpg() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<ImgFormat>("jpg")
  const [scale, setScale] = useState("2")
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
  }

  const convert = async () => {
    if (!file) return
    setProcessing(true)
    setResults(null)
    setMessage("")
    setProgress(0)
    try {
      const scaleNum = parseInt(scale, 10) // 1, 2, 3 → 1× / 2× / 3×
      const dpi = scaleNum * 96
      const pdfjsScale = dpi / 72
      const mime = format === "jpg" ? "image/jpeg" : "image/png"
      const ext = format === "jpg" ? "jpg" : "png"

      const data = new Uint8Array(await file.arrayBuffer())
      const pdf = await pdfjsLib.getDocument({ data }).promise
      const total = pdf.numPages
      const pages: { name: string; blob: Blob }[] = []

      for (let i = 1; i <= total; i++) {
        setProgressLabel(`Rendering page ${i} of ${total}…`)
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: pdfjsScale })

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Could not get a 2D canvas context")
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)

        // JPEG has no alpha — paint a white background so transparent
        // areas render white instead of black.
        if (format === "jpg") {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        await page.render({ canvasContext: ctx, viewport, canvas }).promise

        const blob = await canvasToBlob(
          canvas,
          mime,
          format === "jpg" ? 0.92 : undefined
        )
        pages.push({ name: `page-${i}.${ext}`, blob })

        setProgress(Math.round((i / total) * 100))
        // Free canvas memory between pages.
        canvas.width = 0
        canvas.height = 0
      }

      

      let outFiles: ResultFile[]
      let msg: string
      if (pages.length === 1) {
        outFiles = [{ name: pages[0].name, blob: pages[0].blob }]
        msg = `Rendered 1 page to ${ext.toUpperCase()} (${formatBytes(
          pages[0].blob.size
        )}).`
      } else {
        const zip = new JSZip()
        for (const p of pages) zip.file(p.name, p.blob)
        const zipBlob = await zip.generateAsync({ type: "blob" })
        outFiles = [{ name: "pdf-pages.zip", blob: zipBlob }]
        msg = `Rendered ${pages.length} pages to a ZIP (${ext.toUpperCase()}, ${formatBytes(
          zipBlob.size
        )}).`
      }

      setResults(outFiles)
      setMessage(msg)
      toast({
        title: "Conversion complete",
        description: `${pages.length} page${
          pages.length === 1 ? "" : "s"
        } rendered.`,
      })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Conversion failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setProgress(0)
      setProgressLabel("")
    }
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
            hint="Each page becomes an image. Everything is processed in your browser."
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="format-select">Format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as ImgFormat)}
                  disabled={processing}
                >
                  <SelectTrigger id="format-select" className="w-full">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpg">JPG — smaller, no alpha</SelectItem>
                    <SelectItem value="png">PNG — lossless, alpha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="scale-select">Resolution</Label>
                <Select
                  value={scale}
                  onValueChange={setScale}
                  disabled={processing}
                >
                  <SelectTrigger id="scale-select" className="w-full">
                    <SelectValue placeholder="Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {processing ? (
              <div className="flex flex-col gap-2">
                <Spinner label={progressLabel || "Converting…"} />
                <Progress value={progress} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={convert}>Convert PDF</Button>
                <Button variant="outline" onClick={reset}>
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
