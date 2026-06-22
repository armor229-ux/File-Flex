'use client'

import * as React from "react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCw } from "lucide-react"

type Format = "png" | "jpeg" | "webp"

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

export default function ImageConvert() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [format, setFormat] = React.useState<Format>("png")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile | null>(null)

  const onFiles = (incoming: File[]) => {
    setFile(incoming[0] ?? null)
    setResult(null)
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setFormat("png")
  }

  const convert = async () => {
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const img = await loadImage(file)
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)
      const mime =
        format === "jpeg"
          ? "image/jpeg"
          : format === "png"
            ? "image/png"
            : "image/webp"
      const ext = format === "jpeg" ? "jpg" : format
      const quality = format === "jpeg" ? 0.92 : undefined
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, quality)
      )
      if (!blob) throw new Error("Could not encode image")
      setResult({ name: `converted.${ext}`, blob })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Conversion failed",
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
          accept="image/png,image/jpeg,image/webp"
          onFiles={onFiles}
          label="Drop an image to convert"
          hint="PNG, JPEG, or WebP input — pick a new format"
          disabled={busy}
        />

        {file && !result && (
          <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="ic-fmt">Target format</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as Format)}
                disabled={busy}
              >
                <SelectTrigger id="ic-fmt" className="w-full">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={convert} disabled={busy}>
                <RefreshCw className="size-4" /> Convert
              </Button>
              {busy && <Spinner label="Converting…" />}
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {result && <ResultPanel files={[result]} onReset={reset} />}
      </div>
    </Card>
  )
}
