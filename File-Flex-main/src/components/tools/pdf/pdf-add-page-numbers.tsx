'use client'

import * as React from "react"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { Hash } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
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
import { useToast } from "@/hooks/use-toast"

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center"
type Format = "page-n" | "n-of-total" | "n"

const MARGIN = 30

export default function PdfAddPageNumbers() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [position, setPosition] = React.useState<Position>("bottom-center")
  const [format, setFormat] = React.useState<Format>("page-n")
  const [startAt, setStartAt] = React.useState(1)
  const [fontSize, setFontSize] = React.useState(12)
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

  const buildText = (n: number, total: number): string => {
    if (format === "page-n") return `Page ${n}`
    if (format === "n-of-total") return `${n} of ${total}`
    return `${n}`
  }

  const computePosition = (
    textWidth: number,
    pageWidth: number,
    pageHeight: number,
    size: number
  ): { x: number; y: number } => {
    switch (position) {
      case "bottom-center":
        return { x: (pageWidth - textWidth) / 2, y: MARGIN }
      case "bottom-right":
        return { x: pageWidth - MARGIN - textWidth, y: MARGIN }
      case "bottom-left":
        return { x: MARGIN, y: MARGIN }
      case "top-center":
        return { x: (pageWidth - textWidth) / 2, y: pageHeight - MARGIN - size }
    }
  }

  const onNumber = async () => {
    if (!file) return
    setBusy(true)
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer())
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const pages = pdf.getPages()
      const total = pages.length
      const safeSize = fontSize > 0 ? fontSize : 12
      pages.forEach((page, i) => {
        const num = startAt + i
        const text = buildText(num, total)
        const textWidth = font.widthOfTextAtSize(text, safeSize)
        const { x, y } = computePosition(
          textWidth,
          page.getWidth(),
          page.getHeight(),
          safeSize
        )
        page.drawText(text, {
          x,
          y,
          size: safeSize,
          font,
          color: rgb(0, 0, 0),
        })
      })
      const bytes = await pdf.save()
      setResult([
        {
          name: "numbered.pdf",
          blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        },
      ])
      toast({
        title: "Page numbers added",
        description: `${total} page${total === 1 ? "" : "s"} numbered.`,
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
    setPosition("bottom-center")
    setFormat("page-n")
    setStartAt(1)
    setFontSize(12)
  }

  if (result) {
    return (
      <Card className="p-5 sm:p-6">
        <ResultPanel
          files={result}
          onReset={reset}
          message="Your numbered PDF is ready to download."
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
          hint="Page numbers are added to every page."
          disabled={busy}
        />

        {file && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  Choose where and how to number.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Change file
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pn-position">Position</Label>
                <Select
                  value={position}
                  onValueChange={(v) => setPosition(v as Position)}
                  disabled={busy}
                >
                  <SelectTrigger id="pn-position" className="w-full">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-center">Top Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pn-format">Format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                  disabled={busy}
                >
                  <SelectTrigger id="pn-format" className="w-full">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page-n">Page N</SelectItem>
                    <SelectItem value="n-of-total">N of Total</SelectItem>
                    <SelectItem value="n">N</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pn-start">Start at</Label>
                <Input
                  id="pn-start"
                  type="number"
                  min={1}
                  value={startAt}
                  onChange={(e) =>
                    setStartAt(Math.max(1, Number(e.target.value) || 1))
                  }
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pn-size">Font size</Label>
                <Input
                  id="pn-size"
                  type="number"
                  min={6}
                  max={48}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value) || 0)}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onNumber} disabled={busy}>
                <Hash className="size-4" /> Add page numbers
              </Button>
            </div>
          </>
        )}

        {busy && <Spinner label="Adding page numbers…" />}
      </div>
    </Card>
  )
}
