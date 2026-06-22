'use client'

import * as React from "react"
import Papa from "papaparse"
import { Copy, Download, FileSpreadsheet, RotateCcw } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob } from "@/lib/file-utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function JsonToCsv() {
  const { toast } = useToast()
  const [mode, setMode] = React.useState<"upload" | "type">("upload")
  const [file, setFile] = React.useState<File | null>(null)
  const [typed, setTyped] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const onFiles = (incoming: File[]) => {
    setFile(incoming[0] ?? null)
    setResult(null)
  }

  const reset = () => {
    setFile(null)
    setTyped("")
    setResult(null)
  }

  const convert = async () => {
    let text: string
    if (mode === "upload") {
      if (!file) {
        toast({
          title: "No file selected",
          description: "Please upload a .json file first.",
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
        description: "Please enter or upload some JSON first.",
      })
      return
    }

    setBusy(true)
    setResult(null)
    try {
      const data: unknown = JSON.parse(text)
      if (!Array.isArray(data)) {
        throw new Error("Top-level JSON must be an array of objects.")
      }
      const rows = data as unknown[]
      if (
        rows.length > 0 &&
        rows.some((r) => typeof r !== "object" || r === null || Array.isArray(r))
      ) {
        throw new Error("Every element of the JSON array must be an object.")
      }
      const csv = Papa.unparse(rows as Record<string, unknown>[])
      setResult(csv)
      toast({
        title: "Converted",
        description: `${rows.length} row${rows.length === 1 ? "" : "s"} → CSV`,
      })
    } catch (e) {
      toast({
        title: "Conversion failed",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (result === null) {
      toast({ title: "Nothing to copy", variant: "destructive" })
      return
    }
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast({ title: "CSV copied to clipboard" })
      setTimeout(() => setCopied(false), 1200)
    } catch (e) {
      toast({
        title: "Copy failed",
        description: (e as Error).message,
        variant: "destructive",
      })
    }
  }

  const download = () => {
    if (result === null) {
      toast({ title: "Nothing to download", variant: "destructive" })
      return
    }
    const blob = new Blob([result], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "data.csv")
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "upload" | "type")}
        >
          <TabsList>
            <TabsTrigger value="upload">Upload .json</TabsTrigger>
            <TabsTrigger value="type">Type JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <FileDropzone
              accept=".json,application/json"
              onFiles={onFiles}
              label="Drop a .json file"
              hint="An array of objects — parsed entirely in your browser"
              disabled={busy}
            />
            {file && (
              <p className="mt-2 text-xs text-muted-foreground">
                Loaded: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </TabsContent>
          <TabsContent value="type" className="mt-4">
            <Label htmlFor="json-input" className="sr-only">
              JSON to convert
            </Label>
            <Textarea
              id="json-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={
                '[\n  { "name": "Ada", "age": 36 },\n  { "name": "Grace", "age": 85 }\n]'
              }
              className="min-h-[240px] font-mono text-sm"
              disabled={busy}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {typed.length.toLocaleString()} characters
            </p>
          </TabsContent>
        </Tabs>

        {result === null && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={convert} disabled={busy}>
              <FileSpreadsheet className="size-4" /> Convert
            </Button>
            {busy && <Spinner label="Converting…" />}
            {(file || typed) && (
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Clear
              </Button>
            )}
          </div>
        )}

        {result !== null && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="csv-out" className="text-sm font-medium">
                CSV output
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={copy}>
                  <Copy className="size-4" /> {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={download}>
                  <Download className="size-4" /> Download .csv
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="size-4" /> Start over
                </Button>
              </div>
            </div>
            <Textarea
              id="csv-out"
              readOnly
              value={result}
              className="min-h-[280px] font-mono text-xs"
            />
          </div>
        )}
      </div>
    </Card>
  )
}
