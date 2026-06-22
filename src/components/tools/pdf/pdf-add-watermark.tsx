'use client'

import * as React from "react"
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib"
import { Droplets } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return { r: 0.5, g: 0.5, b: 0.5 }
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255,
  }
}

export default function PdfAddWatermark() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [text, setText] = React.useState("CONFIDENTIAL")
  const [opacity, setOpacity] = React.useState(0.3)
  const [fontSize, setFontSize] = React.useState(50)
  const [angle, setAngle] = React.useState(45)
  const [color, setColor] = React.useState("#888888")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile[] | null>(null)

  const onFiles = (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Please select a PDF file", variant: "destructive" })
      return
    }
    setFile(f)
    setResult(null)
  }

  const onWatermark = async () => {
    if (!file || !text.trim()) return
    setBusy(true)
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer())
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const { r, g, b } = hexToRgb(color)
      const pages = pdf.getPages()
      const safeSize = fontSize > 0 ? fontSize : 50
      const safeText = text.trim()
      for (const page of pages) {
        const textWidth = font.widthOfTextAtSize(safeText, safeSize)
        page.drawText(safeText, {
          x: page.getWidth() / 2 - textWidth / 2,
          y: page.getHeight() / 2,
          size: safeSize,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(angle),
        })
      }
      const bytes = await pdf.save()
      setResult([
        {
          name: "watermarked.pdf",
          blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        },
      ])
      toast({
        title: "Watermark added",
        description: `Applied to ${pages.length} page${pages.length === 1 ? "" : "s"}.`,
      })
    } catch (e) {
      toast({
        title: "Something went wrong",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setResult(null)
    setFile(null)
    setText("CONFIDENTIAL")
    setOpacity(0.3)
    setFontSize(50)
    setAngle(45)
    setColor("#888888")
  }

  if (result) {
    return (
      <Card className="p-5 sm:p-6">
        <ResultPanel
          files={result}
          onReset={reset}
          message="Your watermarked PDF is ready to download."
        />
      </Card>
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="application/pdf"
          onFiles={onFiles}
          label="Drop a PDF here or click to browse"
          hint="A text watermark is stamped on every page."
          disabled={busy}
        />

        {file && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  Choose watermark text and styling.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Change file
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="wm-text">Watermark text</Label>
                <Input
                  id="wm-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="CONFIDENTIAL"
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wm-opacity">
                  Opacity: {Math.round(opacity * 100)}%
                </Label>
                <Slider
                  id="wm-opacity"
                  value={[opacity]}
                  onValueChange={(v) => setOpacity(v[0])}
                  min={0.1}
                  max={1}
                  step={0.05}
                  disabled={busy}
                  aria-label="Watermark opacity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wm-size">Font size</Label>
                <Input
                  id="wm-size"
                  type="number"
                  min={8}
                  max={300}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value) || 0)}
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wm-angle">Angle</Label>
                <Select
                  value={String(angle)}
                  onValueChange={(v) => setAngle(Number(v))}
                  disabled={busy}
                >
                  <SelectTrigger id="wm-angle" className="w-full">
                    <SelectValue placeholder="Angle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0°</SelectItem>
                    <SelectItem value="45">45°</SelectItem>
                    <SelectItem value="90">90°</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wm-color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="wm-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={busy}
                    className="h-9 w-16 p-1"
                    aria-label="Watermark color"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {color.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onWatermark} disabled={busy || !text.trim()}>
                <Droplets className="size-4" /> Add watermark
              </Button>
            </div>
          </>
        )}

        {busy && <Spinner label="Adding watermark…" />}
      </div>
    </Card>
  )
}
