'use client'

import * as React from "react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { withExtension } from "@/lib/file-utils"
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
import { Crop } from "lucide-react"

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

type Aspect = "free" | "1:1" | "16:9" | "4:3"

const ASPECTS: Record<Exclude<Aspect, "free">, number> = {
  "1:1": 1,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
}

function extFor(sourceType: string): string {
  const sub = (sourceType.split("/")[1] ?? "png").toLowerCase()
  return sub === "jpeg" ? "jpg" : sub
}

function clampInt(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min
  return Math.max(min, Math.min(max, Math.round(v)))
}

export default function ImageCrop() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(
    null
  )
  const [x, setX] = React.useState(0)
  const [y, setY] = React.useState(0)
  const [w, setW] = React.useState(0)
  const [h, setH] = React.useState(0)
  const [aspect, setAspect] = React.useState<Aspect>("free")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile | null>(null)

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0]
    if (!f) return
    setFile(f)
    setResult(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    try {
      const img = await loadImage(f)
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      setNatural({ w: nw, h: nh })
      setX(0)
      setY(0)
      setW(nw)
      setH(nh)
      setAspect("free")
    } catch (e) {
      const err = e as Error
      toast({
        title: "Could not load image",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const reset = () => {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setNatural(null)
    setX(0)
    setY(0)
    setW(0)
    setH(0)
    setAspect("free")
    setResult(null)
  }

  const applyAspect = (next: Aspect) => {
    setAspect(next)
    if (!natural || next === "free") return
    const ratio = ASPECTS[next]
    // Keep current width, derive height; clamp both to image bounds.
    let newW = w > 0 ? w : natural.w
    let newH = Math.round(newW / ratio)
    if (newH > natural.h) {
      newH = natural.h
      newW = Math.round(newH * ratio)
    }
    newW = clampInt(newW, 1, natural.w)
    newH = clampInt(newH, 1, natural.h)
    setW(newW)
    setH(newH)
    setX(clampInt(x, 0, Math.max(0, natural.w - newW)))
    setY(clampInt(y, 0, Math.max(0, natural.h - newH)))
  }

  const onWidthChange = (raw: number) => {
    if (!natural) return
    let newW = clampInt(raw, 1, natural.w)
    let newH = h
    if (aspect !== "free") {
      const ratio = ASPECTS[aspect]
      newH = clampInt(Math.round(newW / ratio), 1, natural.h)
      if (newH === natural.h) {
        newW = clampInt(Math.round(newH * ratio), 1, natural.w)
      }
    }
    setW(newW)
    setH(newH)
    setX(clampInt(x, 0, Math.max(0, natural.w - newW)))
    setY(clampInt(y, 0, Math.max(0, natural.h - newH)))
  }

  const onHeightChange = (raw: number) => {
    if (!natural) return
    let newH = clampInt(raw, 1, natural.h)
    let newW = w
    if (aspect !== "free") {
      const ratio = ASPECTS[aspect]
      newW = clampInt(Math.round(newH * ratio), 1, natural.w)
      if (newW === natural.w) {
        newH = clampInt(Math.round(newW / ratio), 1, natural.h)
      }
    }
    setW(newW)
    setH(newH)
    setX(clampInt(x, 0, Math.max(0, natural.w - newW)))
    setY(clampInt(y, 0, Math.max(0, natural.h - newH)))
  }

  const onXChange = (raw: number) => {
    if (!natural) return
    const maxX = Math.max(0, natural.w - w)
    setX(clampInt(raw, 0, maxX))
  }

  const onYChange = (raw: number) => {
    if (!natural) return
    const maxY = Math.max(0, natural.h - h)
    setY(clampInt(raw, 0, maxY))
  }

  const doCrop = async () => {
    if (!file || !natural) return
    if (
      x < 0 ||
      y < 0 ||
      w <= 0 ||
      h <= 0 ||
      x + w > natural.w ||
      y + h > natural.h
    ) {
      toast({
        title: "Invalid crop region",
        description:
          "Crop must be inside the image and have a non-zero width and height.",
        variant: "destructive",
      })
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const img = await loadImage(file)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")
      ctx.drawImage(
        img,
        x,
        y,
        w,
        h,
        0,
        0,
        w,
        h
      )
      const mime = file.type || "image/png"
      const ext = extFor(mime)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, 0.92)
      )
      if (!blob) throw new Error("Could not encode image")
      setResult({
        name: `cropped-${withExtension(file.name, ext)}`,
        blob,
      })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Crop failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const previewBox =
    natural && w > 0 && h > 0
      ? {
          left: `${(x / natural.w) * 100}%`,
          top: `${(y / natural.h) * 100}%`,
          width: `${(w / natural.w) * 100}%`,
          height: `${(h / natural.h) * 100}%`,
        }
      : null

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to crop"
          hint="JPG, PNG, WebP — cropped in your browser, never uploaded"
          disabled={busy}
        />

        {file && natural && previewUrl && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Original:{" "}
              <span className="text-foreground font-medium">
                {natural.w} × {natural.h}px
              </span>
            </p>

            <div className="overflow-auto">
              <div className="relative inline-block max-w-full select-none">
                <img
                  src={previewUrl}
                  alt="Crop preview"
                  className="block max-w-full h-auto rounded-md"
                  draggable={false}
                />
                {previewBox && (
                  <div
                    className="pointer-events-none absolute border-2 border-primary bg-primary/10"
                    style={previewBox}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ic-aspect">Aspect ratio</Label>
              <Select
                value={aspect}
                onValueChange={(v) => applyAspect(v as Aspect)}
                disabled={busy}
              >
                <SelectTrigger id="ic-aspect" className="w-full">
                  <SelectValue placeholder="Aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="4:3">4:3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ic-x">X (px)</Label>
                <Input
                  id="ic-x"
                  type="number"
                  min={0}
                  max={Math.max(0, natural.w - w)}
                  value={x}
                  onChange={(e) =>
                    onXChange(parseInt(e.target.value || "0", 10))
                  }
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic-y">Y (px)</Label>
                <Input
                  id="ic-y"
                  type="number"
                  min={0}
                  max={Math.max(0, natural.h - h)}
                  value={y}
                  onChange={(e) =>
                    onYChange(parseInt(e.target.value || "0", 10))
                  }
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic-w">Width (px)</Label>
                <Input
                  id="ic-w"
                  type="number"
                  min={1}
                  max={natural.w}
                  value={w}
                  onChange={(e) =>
                    onWidthChange(parseInt(e.target.value || "0", 10))
                  }
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic-h">Height (px)</Label>
                <Input
                  id="ic-h"
                  type="number"
                  min={1}
                  max={natural.h}
                  value={h}
                  onChange={(e) =>
                    onHeightChange(parseInt(e.target.value || "0", 10))
                  }
                  disabled={busy}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Crop region: {w} × {h}px at ({x}, {y})
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={doCrop} disabled={busy}>
                <Crop className="size-4" /> Crop
              </Button>
              {busy && <Spinner label="Cropping…" />}
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
