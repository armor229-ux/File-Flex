'use client'

import * as React from "react"
import { jsPDF } from "jspdf"
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

export default function TextToPdf() {
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
          description: "Please upload a .txt file first.",
        })
        return
      }
      try {
        text = await file.text()
      } catch (e) {
        const err = e as Error
        toast({
          title: "Could not read file",
          description: err.message,
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
        description: "Please enter or upload some text first.",
      })
      return
    }

    setBusy(true)
    setResult(null)
    try {
      const dims = PAGE_DIMS[pageSize]
      const margin = 50
      const doc = new jsPDF({ unit: "pt", format: pageSize })
      doc.setFont("helvetica")
      doc.setFontSize(fontSize)

      const lineHeight = fontSize * 1.2
      const maxWidth = dims.w - margin * 2
      const lines = doc.splitTextToSize(text, maxWidth)

      let y = margin + fontSize
      const pageBottom = dims.h - margin

      for (const line of lines) {
        if (y > pageBottom) {
          doc.addPage()
          y = margin + fontSize
        }
        doc.text(line, margin, y)
        y += lineHeight
      }

      const blob = doc.output("blob")
      setResult({ name: "text.pdf", blob })
      toast({ title: "PDF created", description: "Your text PDF is ready." })
    } catch (e) {
      const err = e as Error
      toast({
        title: "Something went wrong",
        description: err.message,
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
            <TabsTrigger value="upload">Upload .txt</TabsTrigger>
            <TabsTrigger value="type">Type text</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <FileDropzone
              accept=".txt,text/plain"
              onFiles={onFiles}
              label="Drop a .txt file"
              hint="Plain text file — read entirely in your browser"
              disabled={busy}
            />
            {file && (
              <p className="mt-2 text-xs text-muted-foreground">
                Loaded: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </TabsContent>
          <TabsContent value="type" className="mt-4">
            <Label htmlFor="txt-input" className="sr-only">
              Text to convert
            </Label>
            <Textarea
              id="txt-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type or paste your text here…"
              className="min-h-[200px]"
              disabled={busy}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {typed.length.toLocaleString()} characters
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="txt-fontsize" className="text-xs">
              Font size
            </Label>
            <Select
              value={String(fontSize)}
              onValueChange={(v) => setFontSize(Number(v))}
              disabled={busy}
            >
              <SelectTrigger id="txt-fontsize" className="w-[110px]">
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
            <Label htmlFor="txt-pagesize" className="text-xs">
              Page size
            </Label>
            <Select
              value={pageSize}
              onValueChange={(v) => setPageSize(v as PageSize)}
              disabled={busy}
            >
              <SelectTrigger id="txt-pagesize" className="w-[130px]">
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
              <FileText className="size-4" /> Create PDF
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
