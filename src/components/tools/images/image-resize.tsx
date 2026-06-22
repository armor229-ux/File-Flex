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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function ImageResize() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(
    null
  )
  const [width, setWidth] = React.useState<number>(0)
  const [height, setHeight] = React.useState<number>(0)
  const [lock, setLock] = React.useState(true)
  const [scale, setScale] = React.useState<number>(100)
  const [mode, setMode] = React.useState<"dim" | "pct">("dim")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile | null>(null)

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0]
    if (!f) return
    setFile(f)
    setResult(null)
    try {
      const img = await loadImage(f)
      const w = img.naturalWidth
      const h = img.naturalHeight
      setNatural({ w, h })
      setWidth(w)
      setHeight(h)
      setScale(100)
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
    setWidth(0)
    setHeight(0)
    setScale(100)
    setLock(true)
    setResult(null)
  }

  const onWidth = (v: number) => {
    setWidth(v)
    if (lock && natural && v > 0) {
      setHeight(Math.round((v / natural.w) * natural.h))
    }
  }
  const onHeight = (v: number) => {
    setHeight(v)
    if (lock && natural && v > 0) {
      setWidth(Math.round((v / natural.h) * natural.w))
    }
  }

  const doResize = async () => {
    if (!file || !natural) return
    setBusy(true)
    setResult(null)
    try {
      let w: number
      let h: number
      if (mode === "pct") {
        w = Math.max(1, Math.round((natural.w * scale) / 100))
        h = Math.max(1, Math.round((natural.h * scale) / 100))
      } else {
        w = Math.max(1, Math.round(width))
        h = Math.max(1, Math.round(height))
      }
      const img = await loadImage(file)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")
      ctx.drawImage(img, 0, 0, w, h)
      const mime = file.type || "image/png"
      const sub = (mime.split("/")[1] ?? "png").toLowerCase()
      const ext = sub === "jpeg" ? "jpg" : sub
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, undefined)
      )
      if (!blob) throw new Error("Could not encode image")
      setResult({
        name: `resized-${withExtension(file.name, ext)}`,
        blob,
      })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Resize failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const projected =
    natural && mode === "pct"
      ? `${Math.round((natural.w * scale) / 100)} × ${Math.round(
          (natural.h * scale) / 100
        )}px`
      : null

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to resize"
          hint="JPG, PNG, WebP — your image never leaves your browser"
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

            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "dim" | "pct")}
            >
              <TabsList>
                <TabsTrigger value="dim">By dimensions</TabsTrigger>
                <TabsTrigger value="pct">By percentage</TabsTrigger>
              </TabsList>

              <TabsContent value="dim" className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="ir-w">Width (px)</Label>
                    <Input
                      id="ir-w"
                      type="number"
                      min={1}
                      value={width}
                      onChange={(e) =>
                        onWidth(parseInt(e.target.value || "0", 10))
                      }
                      disabled={busy}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 pb-2">
                    <Label htmlFor="ir-lock" className="text-xs">
                      Lock ratio
                    </Label>
                    <Switch
                      id="ir-lock"
                      checked={lock}
                      onCheckedChange={setLock}
                      disabled={busy}
                      aria-label="Lock aspect ratio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ir-h">Height (px)</Label>
                    <Input
                      id="ir-h"
                      type="number"
                      min={1}
                      value={height}
                      onChange={(e) =>
                        onHeight(parseInt(e.target.value || "0", 10))
                      }
                      disabled={busy}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pct" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ir-scale">Scale: {scale}%</Label>
                  <Input
                    id="ir-scale"
                    type="number"
                    min={1}
                    max={1000}
                    value={scale}
                    onChange={(e) =>
                      setScale(parseInt(e.target.value || "100", 10))
                    }
                    disabled={busy}
                  />
                </div>
                {projected && (
                  <p className="text-xs text-muted-foreground">
                    Result: {projected}
                  </p>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={doResize} disabled={busy}>
                <Crop className="size-4" /> Resize
              </Button>
              {busy && <Spinner label="Resizing…" />}
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
