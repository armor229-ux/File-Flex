'use client'

import * as React from "react"
import { jsPDF } from "jspdf"
import { marked } from "marked"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"

type PageSize = "a4" | "letter"

const PAGE_DIMS: Record<PageSize, { w: number; h: number }> = {
  a4: { w: 595, h: 842 },
  letter: { w: 612, h: 792 },
}

/** Decode the handful of HTML entities marked can emit. */
function unescapeHtml(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** Convert marked inline HTML to plain text, preserving image alt text. */
function stripHtml(html: string): string {
  return unescapeHtml(
    html
      .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, "$1")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote|pre|table|tr|thead|tbody)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Parse a single line of inline markdown (bold, italic, links, code) → plain text. */
function inlineText(raw: string): string {
  const html = marked.parseInline(raw) as string
  return stripHtml(html)
}

/**
 * Render markdown into a jsPDF document.
 *
 * Strategy: walk the source line by line. Lines starting with `#`…`######`
 * become headings (scaled by depth, bold). Horizontal rules become a thin
 * divider. Every other line is parsed with `marked.parseInline` so inline
 * formatting (bold, italic, links, code spans) survives as plain text, then
 * wrapped with `splitTextToSize` and paginated.
 */
function renderMarkdown(
  doc: jsPDF,
  md: string,
  baseSize: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
) {
  const maxWidth = pageWidth - margin * 2
  const pageBottom = pageHeight - margin
  let y = margin + baseSize

  const writeBlock = (text: string, size: number, bold: boolean) => {
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setFontSize(size)
    const lh = size * 1.35
    const paragraphs = text.split("\n")
    for (const para of paragraphs) {
      if (para === "") {
        if (y + lh * 0.4 > pageBottom) {
          doc.addPage()
          y = margin + size
        } else {
          y += lh * 0.4
        }
        continue
      }
      const lines = doc.splitTextToSize(para, maxWidth) as string[]
      for (const line of lines) {
        if (y > pageBottom) {
          doc.addPage()
          y = margin + size
        }
        doc.text(line, margin, y)
        y += lh
      }
    }
  }

  const sourceLines = md.split(/\r?\n/)
  for (const raw of sourceLines) {
    const line = raw.replace(/\s+$/, "")
    if (!line.trim()) {
      // paragraph gap
      if (y + baseSize * 0.5 > pageBottom) {
        doc.addPage()
        y = margin + baseSize
      } else {
        y += baseSize * 0.5
      }
      continue
    }

    // ATX-style headings: # … ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const depth = headingMatch[1].length
      const text = inlineText(headingMatch[2])
      const size = baseSize + Math.max(0, 5 - depth) * 2
      writeBlock(text, size, true)
      continue
    }

    // Horizontal rule: ---, ***, ___
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      writeBlock("────────────────────────────────", baseSize, false)
      continue
    }

    // Default: inline-format then wrap.
    writeBlock(inlineText(line), baseSize, false)
  }
}

export default function MarkdownToPdf() {
  const { toast } = useToast()
  const [mode, setMode] = React.useState<"upload" | "type">("upload")
  const [file, setFile] = React.useState<File | null>(null)
  const [typed, setTyped] = React.useState("")
  const [fontSize, setFontSize] = React.useState(12)
  const [pageSize, setPageSize] = React.useState<PageSize>("a4")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile | null>(null)

  const onFiles = (incoming: File[]) => {
    setFile(incoming[0] ?? null)
    setResult(null)
  }

  const reset = () => {
    setFile(null)
    setTyped("")
    setResult(null)
  }

  const createPdf = async () => {
    let text: string
    if (mode === "upload") {
      if (!file) {
        toast({
          title: "No file selected",
          description: "Please upload a .md file first.",
        })
        return
      }
      try {
        text = await file.text()
      } catch (e) {
        toast({
          title: "Could not read file",
          description: (e as Error).message,
          variant: "destructive",
        })
        return
      }
    } else {
      text = typed
    }

    if (!text.trim()) {
      toast({
        title: "Nothing to convert",
        description: "Please enter or upload some markdown first.",
      })
      return
    }

    setBusy(true)
    setResult(null)
    try {
      const dims = PAGE_DIMS[pageSize]
      const margin = 50
      const doc = new jsPDF({ unit: "pt", format: pageSize })
      renderMarkdown(doc, text, fontSize, margin, dims.w, dims.h)
      const blob = doc.output("blob")
      setResult({ name: "document.pdf", blob })
      toast({ title: "PDF created", description: "Your markdown PDF is ready." })
    } catch (e) {
      toast({
        title: "Something went wrong",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "upload" | "type")}
        >
          <TabsList>
            <TabsTrigger value="upload">Upload .md</TabsTrigger>
            <TabsTrigger value="type">Type Markdown</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <FileDropzone
              accept=".md,.markdown,text/markdown"
              onFiles={onFiles}
              label="Drop a .md file"
              hint="Markdown file — parsed entirely in your browser"
              disabled={busy}
            />
            {file && (
              <p className="mt-2 text-xs text-muted-foreground">
                Loaded: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </TabsContent>
          <TabsContent value="type" className="mt-4">
            <Label htmlFor="md-input" className="sr-only">
              Markdown to convert
            </Label>
            <Textarea
              id="md-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={"# Hello world\n\nType your **markdown** here…"}
              className="min-h-[240px] font-mono text-sm"
              disabled={busy}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {typed.length.toLocaleString()} characters
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="md-fontsize" className="text-xs">
              Font size
            </Label>
            <Select
              value={String(fontSize)}
              onValueChange={(v) => setFontSize(Number(v))}
              disabled={busy}
            >
              <SelectTrigger id="md-fontsize" className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 pt</SelectItem>
                <SelectItem value="12">12 pt</SelectItem>
                <SelectItem value="14">14 pt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="md-pagesize" className="text-xs">
              Page size
            </Label>
            <Select
              value={pageSize}
              onValueChange={(v) => setPageSize(v as PageSize)}
              disabled={busy}
            >
              <SelectTrigger id="md-pagesize" className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!result && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={createPdf} disabled={busy}>
              <FileText className="size-4" /> Convert to PDF
            </Button>
            {busy && <Spinner label="Building PDF…" />}
            {(file || typed) && (
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Clear
              </Button>
            )}
          </div>
        )}

        {result && <ResultPanel files={[result]} onReset={reset} />}
      </div>
    </Card>
  )
}
