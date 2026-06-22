'use client'

import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { Check, Copy, Download, FileText, RotateCcw } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob, formatBytes } from "@/lib/file-utils"

// Set once, using the installed version for a guaranteed worker match.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

export default function PdfExtractText() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const [text, setText] = useState("")
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  const reset = () => {
    setFile(null)
    setText("")
    setDone(false)
    setProgress(0)
    setProgressLabel("")
  }

  const handleFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (f.type !== "application/pdf") {
      toast({
        title: "Not a PDF",
        description: "Please choose a .pdf file.",
        variant: "destructive",
      })
      return
    }
    setFile(f)
    setText("")
    setDone(false)
    setProcessing(true)
    setProgress(0)
    try {
      const data = new Uint8Array(await f.arrayBuffer())
      const pdf = await pdfjsLib.getDocument({ data }).promise
      const total = pdf.numPages
      const pages: string[] = []

      for (let i = 1; i <= total; i++) {
        setProgressLabel(`Extracting text from page ${i} of ${total}…`)
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
          .map((it) => ("str" in it ? it.str : ""))
          .join(" ")
          .trim()
        pages.push(`--- Page ${i} ---\n\n${pageText}`)
        setProgress(Math.round((i / total) * 100))
      }

      

      const joined = pages.join("\n\n")
      setText(joined)
      setDone(true)

      const meaningful = joined.replace(/[\s\-]/g, "").length
      if (meaningful === 0) {
        toast({
          title: "No selectable text found",
          description: "This PDF may be scanned (no OCR available).",
        })
      } else {
        toast({
          title: "Text extracted",
          description: `${total} page${total === 1 ? "" : "s"} processed.`,
        })
      }
    } catch (e) {
      const err = e as Error
      toast({
        title: "Extraction failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setProgress(0)
      setProgressLabel("")
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard is not available in this browser.",
        variant: "destructive",
      })
    }
  }

  const download = () => {
    downloadBlob(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
      "extracted.txt"
    )
  }

  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        {!file ? (
          <FileDropzone
            accept="application/pdf"
            onFiles={handleFiles}
            label="Drop a PDF here or click to browse"
            hint="Extracts selectable text. Everything is processed in your browser."
            disabled={processing}
          />
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              {!processing && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="size-4" /> Change
                </Button>
              )}
            </div>

            {processing && (
              <div className="flex flex-col gap-2">
                <Spinner label={progressLabel || "Extracting…"} />
                <Progress value={progress} />
              </div>
            )}

            {done && (
              <div className="flex flex-col gap-3">
                <Textarea
                  readOnly
                  value={text}
                  aria-label="Extracted text"
                  placeholder="No text was found in this PDF."
                  className="min-h-[300px] resize-y font-mono text-xs leading-relaxed"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {charCount.toLocaleString()} characters ·{" "}
                    {wordCount.toLocaleString()} words
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copy}
                      disabled={charCount === 0}
                    >
                      {copied ? (
                        <>
                          <Check className="size-4" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-4" /> Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={download}
                      disabled={charCount === 0}
                    >
                      <Download className="size-4" /> Download .txt
                    </Button>
                    <Button size="sm" variant="ghost" onClick={reset}>
                      <RotateCcw className="size-4" /> Start over
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
