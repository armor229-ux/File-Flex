'use client'

import * as React from "react"
import { PDFDocument } from "pdf-lib"
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatBytes, uid } from "@/lib/file-utils"

interface ImageItem {
  id: string
  file: File
}

const ACCEPTED = "image/jpeg,image/png,image/webp"

function isJpeg(f: File): boolean {
  return (
    f.type === "image/jpeg" ||
    f.name.toLowerCase().endsWith(".jpg") ||
    f.name.toLowerCase().endsWith(".jpeg")
  )
}

function isPng(f: File): boolean {
  return f.type === "image/png" || f.name.toLowerCase().endsWith(".png")
}

function isWebp(f: File): boolean {
  return f.type === "image/webp" || f.name.toLowerCase().endsWith(".webp")
}

/** Convert a WebP (or any decodable image) file to PNG bytes via canvas. */
async function toPngBytes(file: File): Promise<ArrayBuffer> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D context is not available.")
    ctx.drawImage(img, 0, 0)
    const dataUrl = canvas.toDataURL("image/png")
    const resp = await fetch(dataUrl)
    return await resp.arrayBuffer()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function JpgToPdf() {
  const [items, setItems] = React.useState<ImageItem[]>([])
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile[] | null>(null)
  const { toast } = useToast()

  const addFiles = (files: File[]) => {
    const imgs = files.filter((f) => isJpeg(f) || isPng(f) || isWebp(f))
    if (imgs.length < files.length) {
      toast({
        title: "Only JPG, PNG, or WebP images are supported",
        description: "Unsupported files were skipped.",
        variant: "destructive",
      })
    }
    if (imgs.length === 0) return
    setItems((prev) => [...prev, ...imgs.map((f) => ({ id: uid(), file: f }))])
  }

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id))

  const moveUp = (id: string) =>
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })

  const moveDown = (id: string) =>
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
      return next
    })

  const onCreate = async () => {
    if (items.length === 0) {
      toast({ title: "Add at least one image", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const out = await PDFDocument.create()
      for (const it of items) {
        let bytes: ArrayBuffer
        if (isWebp(it.file)) {
          bytes = await toPngBytes(it.file)
          const img = await out.embedPng(bytes)
          const page = out.addPage([img.width, img.height])
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
        } else if (isJpeg(it.file)) {
          bytes = await it.file.arrayBuffer()
          const img = await out.embedJpg(bytes)
          const page = out.addPage([img.width, img.height])
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
        } else {
          bytes = await it.file.arrayBuffer()
          const img = await out.embedPng(bytes)
          const page = out.addPage([img.width, img.height])
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
        }
      }
      const saved = await out.save()
      setResult([
        { name: "images.pdf", blob: new Blob([saved as BlobPart], { type: "application/pdf" }) },
      ])
      toast({
        title: "PDF created",
        description: `${items.length} image${items.length === 1 ? "" : "s"} added.`,
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
    setItems([])
  }

  if (result) {
    return (
      <ResultPanel
        files={result}
        onReset={reset}
        message="Your image PDF is ready to download."
      />
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept={ACCEPTED}
          multiple
          onFiles={addFiles}
          label="Drop JPG, PNG, or WebP images here"
          hint="Reorder below, then combine into a single PDF."
          disabled={busy}
        />

        {items.length > 0 && (
          <ol className="flex flex-col gap-2">
            {items.map((it, i) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(it.file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${it.file.name} up`}
                    disabled={i === 0 || busy}
                    onClick={() => moveUp(it.id)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${it.file.name} down`}
                    disabled={i === items.length - 1 || busy}
                    onClick={() => moveDown(it.id)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${it.file.name}`}
                    disabled={busy}
                    onClick={() => removeItem(it.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {items.length} image{items.length === 1 ? "" : "s"} selected
          </p>
          <Button onClick={onCreate} disabled={busy || items.length === 0}>
            <ImagePlus className="size-4" /> Create PDF
          </Button>
        </div>

        {busy && <Spinner label="Building PDF…" />}
      </div>
    </Card>
  )
}
