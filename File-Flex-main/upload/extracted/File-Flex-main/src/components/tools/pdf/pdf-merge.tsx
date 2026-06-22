'use client'

import * as React from "react"
import { PDFDocument } from "pdf-lib"
import { ArrowDown, ArrowUp, Layers, Trash2 } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatBytes, uid } from "@/lib/file-utils"
import { useUsageCounter, celebrate } from "@/lib/usage"

interface PdfItem {
  id: string
  file: File
}

export default function PdfMerge() {
  const [items, setItems] = React.useState<PdfItem[]>([])
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile[] | null>(null)
  const { increment } = useUsageCounter()
  const { toast } = useToast()

  const addFiles = (files: File[]) => {
    const pdfs = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    )
    if (pdfs.length < files.length) {
      toast({
        title: "Only PDF files are supported",
        description: "Non-PDF files were skipped.",
        variant: "destructive",
      })
    }
    if (pdfs.length === 0) return
    setItems((prev) => [...prev, ...pdfs.map((f) => ({ id: uid(), file: f }))])
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

  const onMerge = async () => {
    if (items.length < 2) {
      toast({ title: "Add at least two PDFs to merge", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const out = await PDFDocument.create()
      for (const it of items) {
        const src = await PDFDocument.load(await it.file.arrayBuffer())
        const pages = await out.copyPages(src, src.getPageIndices())
        pages.forEach((p) => out.addPage(p))
      }
      const bytes = await out.save()
      setResult([
        { name: "merged.pdf", blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) },
      ])
      increment(items.length)
      celebrate()
      toast({
        title: "PDF merged",
        description: `${items.length} files combined into one.`,
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
        message="Your merged PDF is ready to download."
      />
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="application/pdf"
          multiple
          onFiles={addFiles}
          label="Drop PDF files here or click to browse"
          hint="Reorder below, then merge into one file."
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
            {items.length} file{items.length === 1 ? "" : "s"} selected
          </p>
          <Button onClick={onMerge} disabled={busy || items.length < 2}>
            <Layers className="size-4" /> Merge PDFs
          </Button>
        </div>

        {busy && <Spinner label="Merging PDFs…" />}
      </div>
    </Card>
  )
}
