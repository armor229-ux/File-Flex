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
import { Slider } from "@/components/ui/slider"
import { Stamp } from "lucide-react"

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

type Position =
  | "center"
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"

function extFor(sourceType: string): string {
  const sub = (sourceType.split("/")[1] ?? "png").toLowerCase()
  return sub === "jpeg" ? "jpg" : sub
}

function anchorFor(
  position: Position,
  cw: number,
  ch: number,
  margin: number
): {
  x: number
  y: number
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
} {
  switch (position) {
    case "top-left":
      return { x: margin, y: margin, textAlign: "left", textBaseline: "top" }
    case "top-right":
      return {
        x: cw - margin,
        y: margin,
        textAlign: "right",
        textBaseline: "top",
      }
    case "bottom-left":
      return {
        x: margin,
        y: ch - margin,
        textAlign: "left",
        textBaseline: "bottom",
      }
    case "bottom-right":
      return {
        x: cw - margin,
        y: ch - margin,
        textAlign: "right",
        textBaseline: "bottom",
      }
    case "center":
    default:
      return {
        x: cw / 2,
        y: ch / 2,
        textAlign: "center",
        textBaseline: "middle",
      }
  }
}

export default function ImageAddWatermark() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(
    null
  )
  const [text, setText] = React.useState("WATERMARK")
  const [fontSize, setFontSize] = React.useState(48)
  const [opacity, setOpacity] = React.useState(0.5)
  const [color, setColor] = React.useState("#FFFFFF")
  const [position, setPosition] = React.useState<Position>("center")
  const [angle, setAngle] = React.useState(0)
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile | null>(null)

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0]
    if (!f) return
    setFile(f)
    setNatural(null)
    setResult(null)
    try {
      const img = await loadImage(f)
      setNatural({ w: img.naturalWidth, h: img.naturalHeight })
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
    setNatural(null)
    setText("WATERMARK")
    setFontSize(48)
    setOpacity(0.5)
    setColor("#FFFFFF")
    setPosition("center")
    setAngle(0)
    setResult(null)
  }

  const doWatermark = async () => {
    if (!file) return
    if (!text.trim()) {
      toast({
        title: "Watermark text is empty",
        description: "Enter some text to draw as the watermark.",
        variant: "destructive",
      })
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const img = await loadImage(file)
      const cw = img.naturalWidth
      const ch = img.naturalHeight
      const canvas = document.createElement("canvas")
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")
      ctx.drawImage(img, 0, 0, cw, ch)

      const margin = Math.max(10, Math.round(fontSize / 2))
      const { x, y, textAlign, textBaseline } = anchorFor(
        position,
        cw,
        ch,
        margin
      )

      ctx.save()
      ctx.globalAlpha = opacity
      ctx.font = `${fontSize}px sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = textAlign
      ctx.textBaseline = textBaseline
      ctx.translate(x, y)
      const rad = (angle * Math.PI) / 180
      if (rad !== 0) ctx.rotate(rad)
      ctx.fillText(text, 0, 0)
      ctx.restore()

      const mime = file.type || "image/png"
      const ext = extFor(mime)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, 0.92)
      )
      if (!blob) throw new Error("Could not encode image")
      setResult({
        name: `watermarked-${withExtension(file.name, ext)}`,
        blob,
      })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Watermark failed",
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
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to watermark"
          hint="JPG, PNG, WebP — processed in your browser, never uploaded"
          disabled={busy}
        />

        {file && natural && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Image:{" "}
              <span className="text-foreground font-medium">
                {natural.w} × {natural.h}px
              </span>
            </p>

            <div className="space-y-2">
              <Label htmlFor="iw-text">Watermark text</Label>
              <Input
                id="iw-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={busy}
                placeholder="WATERMARK"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iw-size">Font size: {fontSize}px</Label>
              <Slider
                id="iw-size"
                min={12}
                max={120}
                step={1}
                value={[fontSize]}
                onValueChange={(v) => setFontSize(v[0])}
                disabled={busy}
                aria-label="Font size"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iw-opacity">
                Opacity: {Math.round(opacity * 100)}%
              </Label>
              <Slider
                id="iw-opacity"
                min={0.1}
                max={1}
                step={0.05}
                value={[opacity]}
                onValueChange={(v) => setOpacity(v[0])}
                disabled={busy}
                aria-label="Opacity"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="iw-color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="iw-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={busy}
                    className="h-9 w-16 p-1"
                    aria-label="Watermark color"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={busy}
                    className="flex-1 font-mono text-sm"
                    aria-label="Watermark color hex"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iw-angle">Angle (°)</Label>
                <Input
                  id="iw-angle"
                  type="number"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) =>
                    setAngle(
                      Math.max(
                        0,
                        Math.min(360, parseInt(e.target.value || "0", 10))
                      )
                    )
                  }
                  disabled={busy}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iw-position">Position</Label>
              <Select
                value={position}
                onValueChange={(v) => setPosition(v as Position)}
                disabled={busy}
              >
                <SelectTrigger id="iw-position" className="w-full">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom-right">Bottom right</SelectItem>
                  <SelectItem value="bottom-left">Bottom left</SelectItem>
                  <SelectItem value="top-right">Top right</SelectItem>
                  <SelectItem value="top-left">Top left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={doWatermark} disabled={busy}>
                <Stamp className="size-4" /> Add watermark
              </Button>
              {busy && <Spinner label="Watermarking…" />}
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
