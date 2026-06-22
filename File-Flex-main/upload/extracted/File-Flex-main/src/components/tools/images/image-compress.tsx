'use client'

import * as React from "react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { formatBytes, withExtension } from "@/lib/file-utils"
import { useUsageCounter, celebrate } from "@/lib/usage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Wand2 } from "lucide-react"

type FormatKey = "keep" | "jpeg" | "png" | "webp"

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function extFor(format: FormatKey, sourceType: string): string {
  if (format === "jpeg") return "jpg"
  if (format === "png") return "png"
  if (format === "webp") return "webp"
  const m = (sourceType.split("/")[1] ?? "png").toLowerCase()
  return m === "jpeg" ? "jpg" : m
}

function mimeFor(format: FormatKey, sourceType: string): string {
  if (format === "jpeg") return "image/jpeg"
  if (format === "png") return "image/png"
  if (format === "webp") return "image/webp"
  return sourceType || "image/png"
}

export default function ImageCompress() {
  const { toast } = useToast()
  const { increment } = useUsageCounter()
  const [files, setFiles] = React.useState<File[]>([])
  const [quality, setQuality] = React.useState<number>(0.7)
  const [maxWidth, setMaxWidth] = React.useState<string>("")
  const [format, setFormat] = React.useState<FormatKey>("keep")
  const [busy, setBusy] = React.useState(false)
  const [results, setResults] = React.useState<ResultFile[] | null>(null)
  const [message, setMessage] = React.useState<string | undefined>(undefined)

  const onFiles = (incoming: File[]) => {
    setFiles(incoming)
    setResults(null)
    setMessage(undefined)
  }

  const reset = () => {
    setFiles([])
    setResults(null)
    setMessage(undefined)
    setMaxWidth("")
    setQuality(0.7)
    setFormat("keep")
  }

  const compressAll = async () => {
    if (files.length === 0) return
    setBusy(true)
    setResults(null)
    setMessage(undefined)
    try {
      const out: ResultFile[] = []
      let totalBefore = 0
      let totalAfter = 0
      for (const file of files) {
        totalBefore += file.size
        const img = await loadImage(file)
        const max =
          maxWidth.trim() === "" ? null : Math.max(1, parseInt(maxWidth, 10))
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (max && w > max) {
          h = Math.round((max / w) * h)
          w = max
        }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Canvas not supported")
        ctx.drawImage(img, 0, 0, w, h)
        const mime = mimeFor(format, file.type)
        const ext = extFor(format, file.type)
        const q = mime === "image/png" ? undefined : quality
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, mime, q)
        )
        if (!blob) throw new Error(`Could not encode ${file.name}`)
        totalAfter += blob.size
        const name = format === "keep" ? file.name : withExtension(file.name, ext)
        out.push({ name, blob })
      }
      const saved =
        totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0
      setResults(out)
      increment(out.length)
      if (out.length > 0) celebrate()
      setMessage(
        `${formatBytes(totalBefore)} → ${formatBytes(
          totalAfter
        )} · ${saved >= 0 ? saved : 0}% saved`
      )
    } catch (e) {
      const err = e as Error
      toast({
        title: "Compression failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          multiple
          onFiles={onFiles}
          label="Drop images to compress"
          hint="JPEG, PNG, or WebP — processed entirely in your browser"
          disabled={busy}
        />

        {files.length > 0 && !results && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ic-quality">Quality: {Math.round(quality * 100)}%</Label>
              <Slider
                id="ic-quality"
                min={0.3}
                max={0.95}
                step={0.05}
                value={[quality]}
                onValueChange={(v) => setQuality(v[0])}
                disabled={busy}
                aria-label="Output quality"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ic-maxw">Max width (px, optional)</Label>
              <Input
                id="ic-maxw"
                type="number"
                min={1}
                placeholder="Leave blank for no resize"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ic-format">Output format</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as FormatKey)}
                disabled={busy}
              >
                <SelectTrigger id="ic-format" className="w-full">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Keep original</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {files.length > 0 && !results && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={compressAll} disabled={busy}>
              <Wand2 className="size-4" /> Compress {files.length} image
              {files.length === 1 ? "" : "s"}
            </Button>
            {busy && <Spinner label="Compressing…" />}
            <Button variant="ghost" onClick={reset} disabled={busy}>
              Clear
            </Button>
          </div>
        )}

        {results && (
          <ResultPanel files={results} onReset={reset} message={message} />
        )}
      </div>
    </Card>
  )
}
