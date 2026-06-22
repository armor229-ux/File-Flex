'use client'

import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { PDFDocument } from "pdf-lib"
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
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/file-utils"

// Set once, using the installed version for a guaranteed worker match.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const DPI_OPTIONS = [
  { value: "72", label: "72 DPI — screen, smallest" },
  { value: "96", label: "96 DPI — web" },
  { value: "150", label: "150 DPI — draft print" },
  { value: "200", label: "200 DPI — good print" },
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

export default function PdfCompress() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [dpi, setDpi] = useState("150")
  const [quality, setQuality] = useState(0.6)
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

  const compress = async () => {
    if (!file) return
    setProcessing(true)
    setResults(null)
    setMessage("")
    setProgress(0)
    try {
      const dpiNum = parseInt(dpi, 10)
      const scale = dpiNum / 72
      const data = new Uint8Array(await file.arrayBuffer())
      const pdf = await pdfjsLib.getDocument({ data }).promise
      const out = await PDFDocument.create()
      const total = pdf.numPages

      for (let i = 1; i <= total; i++) {
        setProgressLabel(`Rendering page ${i} of ${total}…`)
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale })
        const viewport1 = page.getViewport({ scale: 1 })

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Could not get a 2D canvas context")
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)

        await page.render({ canvasContext: ctx, viewport, canvas }).promise

        const jpgBlob = await canvasToBlob(canvas, "image/jpeg", quality)
        const jpgBytes = await jpgBlob.arrayBuffer()
        const img = await out.embedJpg(jpgBytes)
        const pageW = viewport1.width
        const pageH = viewport1.height
        const p = out.addPage([pageW, pageH])
        p.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH })

        setProgress(Math.round((i / total) * 100))
        // Free canvas memory between pages.
        canvas.width = 0
        canvas.height = 0
      }

      
      const bytes = await out.save()
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })

      const origSize = file.size
      const newSize = blob.size
      const delta =
        origSize > 0 ? Math.round((1 - newSize / origSize) * 100) : 0
      const msg =
        delta >= 0
          ? `Original ${formatBytes(origSize)} → Compressed ${formatBytes(newSize)} (${delta}% smaller)`
          : `Original ${formatBytes(origSize)} → Compressed ${formatBytes(newSize)} (${-delta}% larger — try lower DPI or quality)`

      setResults([{ name: "compressed.pdf", blob }])
      setMessage(msg)
      toast({ title: "PDF compressed", description: msg })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Compression failed",
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
            hint="Single PDF. Everything is processed in your browser — nothing is uploaded."
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
                <Label htmlFor="dpi-select">Target DPI</Label>
                <Select
                  value={dpi}
                  onValueChange={setDpi}
                  disabled={processing}
                >
                  <SelectTrigger id="dpi-select" className="w-full">
                    <SelectValue placeholder="DPI" />
                  </SelectTrigger>
                  <SelectContent>
                    {DPI_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quality-slider">JPEG quality</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {quality.toFixed(2)}
                  </span>
                </div>
                <Slider
                  id="quality-slider"
                  min={0.3}
                  max={0.9}
                  step={0.05}
                  value={[quality]}
                  onValueChange={(v) => setQuality(v[0])}
                  disabled={processing}
                  aria-label="JPEG quality"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Pages are rasterised (text becomes images) — best for image-heavy
              or scanned PDFs. Vector/text-only PDFs may not shrink.
            </p>

            {processing ? (
              <div className="flex flex-col gap-2">
                <Spinner label={progressLabel || "Compressing…"} />
                <Progress value={progress} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={compress}>Compress PDF</Button>
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
