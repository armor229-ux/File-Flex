'use client'

import * as React from "react"
import { PDFDocument } from "pdf-lib"
import { FileX2 } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

/** Parse a "2,5,7-9" string into a Set of 0-based page indices. */
function parsePageSet(input: string, max: number): Set<number> {
  const out = new Set<number>()
  if (!input.trim()) return out
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = Number(part)
      if (n < 1 || n > max) throw new Error(`Page ${n} is out of range (1–${max}).`)
      out.add(n - 1)
    } else {
      const m = /^(\d+)\s*-\s*(\d+)$/.exec(part)
      if (!m) throw new Error(`Invalid range: "${part}".`)
      const a = Number(m[1])
      const b = Number(m[2])
      if (a < 1 || b < 1 || a > max || b > max)
        throw new Error(`Range ${part} is out of bounds (1–${max}).`)
      if (a > b) throw new Error(`Range ${part} is invalid (start greater than end).`)
      for (let i = a; i <= b; i++) out.add(i - 1)
    }
  }
  return out
}

export default function PdfDeletePages() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [input, setInput] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile[] | null>(null)
  const { toast } = useToast()

  const onFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Please select a PDF file", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const src = await PDFDocument.load(await f.arrayBuffer())
      setFile(f)
      setPageCount(src.getPageCount())
      setInput("")
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

  const parsed = React.useMemo<{
    ok: boolean
    set?: Set<number>
    error?: string
  }>(() => {
    if (!input.trim()) return { ok: true, set: new Set<number>() }
    try {
      return { ok: true, set: parsePageSet(input, pageCount) }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }, [input, pageCount])

  const deleteCount = parsed.set?.size ?? 0
  const remaining = pageCount - deleteCount

  const onDelete = async () => {
    if (!file) return
    if (!parsed.ok || !parsed.set) {
      toast({
        title: "Fix the page list first",
        description: parsed.error,
        variant: "destructive",
      })
      return
    }
    if (parsed.set.size === 0) {
      toast({ title: "Enter at least one page to delete", variant: "destructive" })
      return
    }
    if (remaining <= 0) {
      toast({
        title: "Cannot delete every page",
        description: "Keep at least one page in the PDF.",
        variant: "destructive",
      })
      return
    }
    setBusy(true)
    try {
      const src = await PDFDocument.load(await file.arrayBuffer())
      // Remove in descending order so indices stay valid.
      const indices = Array.from(parsed.set).sort((a, b) => b - a)
      indices.forEach((i) => src.removePage(i))
      const bytes = await src.save()
      setResult([
        { name: "cleaned.pdf", blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) },
      ])
      toast({
        title: "Pages deleted",
        description: `Removed ${indices.length} page(s). ${remaining} page(s) remain.`,
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
    setPageCount(0)
    setInput("")
  }

  if (result) {
    return (
      <ResultPanel
        files={result}
        onReset={reset}
        message="Your cleaned PDF is ready to download."
      />
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="application/pdf"
          onFiles={onFiles}
          label="Drop a PDF here or click to browse"
          hint="Pick the pages you want to remove."
          disabled={busy}
        />

        {busy && <Spinner label="Loading PDF…" />}

        {file && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pageCount} pages total
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Change file
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del">Pages to delete</Label>
              <Input
                id="del"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 2,5,7-9"
                disabled={busy}
                aria-invalid={!parsed.ok}
                aria-describedby="del-hint del-status"
              />
              <p id="del-hint" className="text-xs text-muted-foreground">
                Use 1-based page numbers, separated by commas. Ranges are supported.
              </p>
              <p
                id="del-status"
                className={`text-xs ${parsed.ok ? "text-muted-foreground" : "text-destructive"}`}
              >
                {!parsed.ok
                  ? parsed.error
                  : deleteCount === 0
                    ? "No pages selected yet."
                    : `Deleting ${deleteCount} page(s) — ${remaining} will remain.`}
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={onDelete}
                disabled={busy || !parsed.ok || deleteCount === 0 || remaining <= 0}
              >
                <FileX2 className="size-4" /> Delete pages
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
