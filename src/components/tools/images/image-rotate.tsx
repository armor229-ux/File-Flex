'use client'

import * as React from "react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { withExtension } from "@/lib/file-utils"
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
import { RotateCw } from "lucide-react"

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

type Rotation = "90" | "180" | "270"

function extFor(sourceType: string): string {
  const sub = (sourceType.split("/")[1] ?? "png").toLowerCase()
  return sub === "jpeg" ? "jpg" : sub
}

export default function ImageRotate() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(
    null
  )
  const [rotation, setRotation] = React.useState<Rotation>("90")
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
    setRotation("90")
    setResult(null)
  }

  const doRotate = async () => {
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const img = await loadImage(file)
      const deg = parseInt(rotation, 10)
      const rad = (deg * Math.PI) / 180
      const swap = deg === 90 || deg === 270
      const outW = swap ? img.naturalHeight : img.naturalWidth
      const outH = swap ? img.naturalWidth : img.naturalHeight
      const canvas = document.createElement("canvas")
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")
      ctx.translate(outW / 2, outH / 2)
      ctx.rotate(rad)
      ctx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2
      )
      const mime = file.type || "image/png"
      const ext = extFor(mime)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, 0.92)
      )
      if (!blob) throw new Error("Could not encode image")
      setResult({
        name: `rotated-${withExtension(file.name, ext)}`,
        blob,
      })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Rotation failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const projected = natural
    ? (() => {
        const deg = parseInt(rotation, 10)
        const swap = deg === 90 || deg === 270
        return swap
          ? `${natural.h} × ${natural.w}px`
          : `${natural.w} × ${natural.h}px`
      })()
    : null

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to rotate"
          hint="JPG, PNG, WebP — rotated in your browser, never uploaded"
          disabled={busy}
        />

        {file && natural && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Original:{" "}
              <span className="text-foreground font-medium">
                {natural.w} × {natural.h}px
              </span>
            </p>

            <div className="space-y-2">
              <Label htmlFor="ir-rotation">Rotation</Label>
              <Select
                value={rotation}
                onValueChange={(v) => setRotation(v as Rotation)}
                disabled={busy}
              >
                <SelectTrigger id="ir-rotation" className="w-full">
                  <SelectValue placeholder="Rotation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90° clockwise</SelectItem>
                  <SelectItem value="180">180°</SelectItem>
                  <SelectItem value="270">270° clockwise (90° CCW)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {projected && (
              <p className="text-xs text-muted-foreground">
                Resulting size: {projected}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={doRotate} disabled={busy}>
                <RotateCw className="size-4" /> Rotate
              </Button>
              {busy && <Spinner label="Rotating…" />}
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
