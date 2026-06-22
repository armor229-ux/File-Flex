'use client'

import * as React from "react"
import { PDFDocument } from "pdf-lib"
import JSZip from "jszip"
import { Scissors } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

/** Parse a ranges string like "1-3,5,8-10" into a list of 1-based page arrays. */
function parseRanges(input: string, max: number): number[][] {
  if (!input.trim()) throw new Error("Enter at least one page or range.")
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const out: number[][] = []
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = Number(part)
      if (n < 1 || n > max) throw new Error(`Page ${n} is out of range (1–${max}).`)
      out.push([n])
    } else {
      const m = /^(\d+)\s*-\s*(\d+)$/.exec(part)
      if (!m) throw new Error(`Invalid range: "${part}".`)
      const a = Number(m[1])
      const b = Number(m[2])
      if (a < 1 || b < 1 || a > max || b > max)
        throw new Error(`Range ${part} is out of bounds (1–${max}).`)
      if (a > b) throw new Error(`Range ${part} is invalid (start greater than end).`)
      const arr: number[] = []
      for (let i = a; i <= b; i++) arr.push(i)
      out.push(arr)
    }
  }
  return out
}

export default function PdfSplit() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [ranges, setRanges] = React.useState("")
  const [splitAll, setSplitAll] = React.useState(false)
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
      setRanges("")
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

  const onSplit = async () => {
    if (!file) return
    setBusy(true)
    try {
      const src = await PDFDocument.load(await file.arrayBuffer())
      const total = src.getPageCount()

      let groups: number[][]
      if (splitAll) {
        groups = Array.from({ length: total }, (_, i) => [i + 1])
      } else {
        groups = parseRanges(ranges, total)
      }

      const parts: ResultFile[] = []
      for (let i = 0; i < groups.length; i++) {
        const out = await PDFDocument.create()
        const pages = await out.copyPages(
          src,
          groups[i].map((n) => n - 1),
        )
        pages.forEach((p) => out.addPage(p))
        const bytes = await out.save()
        parts.push({
          name: `part-${i + 1}.pdf`,
          blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        })
      }

      let outFiles: ResultFile[]
      if (parts.length === 1) {
        outFiles = parts
      } else {
        const zip = new JSZip()
        parts.forEach((p) => zip.file(p.name, p.blob))
        const blob = await zip.generateAsync({ type: "blob" })
        outFiles = [{ name: "split.zip", blob }]
      }

      setResult(outFiles)
      toast({
        title: "PDF split",
        description:
          parts.length === 1
            ? "Created 1 part."
            : `Created ${parts.length} parts, bundled as split.zip.`,
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
    setRanges("")
    setSplitAll(false)
  }

  if (result) {
    return (
      <ResultPanel
        files={result}
        onReset={reset}
        message="Your split file(s) are ready to download."
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
          hint="Split by page ranges or into individual pages."
          disabled={busy}
        />

        {busy && <Spinner label="Working…" />}

        {file && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{pageCount} pages</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={busy}
              >
                Change file
              </Button>
            </div>

            <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3">
              <Switch
                id="split-all"
                checked={splitAll}
                onCheckedChange={setSplitAll}
                disabled={busy}
              />
              <Label htmlFor="split-all" className="cursor-pointer">
                Split into individual pages (one PDF per page)
              </Label>
            </div>

            {!splitAll && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ranges">Page ranges</Label>
                <Input
                  id="ranges"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g. 1-3,5,8-10"
                  disabled={busy}
                  aria-describedby="ranges-hint"
                />
                <p id="ranges-hint" className="text-xs text-muted-foreground">
                  Use 1-based page numbers. Each range becomes one output PDF.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onSplit} disabled={busy}>
                <Scissors className="size-4" /> Split PDF
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
