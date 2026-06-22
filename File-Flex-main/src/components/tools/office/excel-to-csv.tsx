'use client'

import * as React from "react"
import * as XLSX from "xlsx"
import JSZip from "jszip"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { withoutExtension } from "@/lib/file-utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileSpreadsheet } from "lucide-react"

interface CsvEntry {
  name: string
  content: string
}

export default function ExcelToCsv() {
  const { toast } = useToast()
  const [files, setFiles] = React.useState<File[]>([])
  const [busy, setBusy] = React.useState(false)
  const [results, setResults] = React.useState<ResultFile[] | null>(null)

  const onFiles = (incoming: File[]) => {
    setFiles(incoming)
    setResults(null)
  }

  const reset = () => {
    setFiles([])
    setResults(null)
  }

  const convert = async () => {
    if (files.length === 0) return
    setBusy(true)
    setResults(null)
    try {
      const csvs: CsvEntry[] = []
      for (const file of files) {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: "array" })
        const sheetNames = wb.SheetNames
        const base = withoutExtension(file.name)
        if (sheetNames.length <= 1) {
          const sheet = wb.Sheets[sheetNames[0]]
          const csv = XLSX.utils.sheet_to_csv(sheet)
          csvs.push({ name: `${base}.csv`, content: csv })
        } else {
          for (const sn of sheetNames) {
            const sheet = wb.Sheets[sn]
            const csv = XLSX.utils.sheet_to_csv(sheet)
            const safe = sn.replace(/[\\/:*?"<>|]+/g, "_").trim() || "sheet"
            csvs.push({ name: `${base}-${safe}.csv`, content: csv })
          }
        }
      }

      if (csvs.length === 1) {
        const c = csvs[0]
        setResults([
          {
            name: c.name,
            blob: new Blob([c.content], { type: "text/csv;charset=utf-8" }),
          },
        ])
      } else {
        const zip = new JSZip()
        for (const c of csvs) zip.file(c.name, c.content)
        const blob = await zip.generateAsync({ type: "blob" })
        setResults([{ name: "csvs.zip", blob }])
      }
    } catch (e) {
      const err = e as Error
      toast({
        title: "Conversion failed",
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
        <FileDropzone
          accept=".xlsx,.xls"
          multiple
          onFiles={onFiles}
          label="Drop Excel files to convert"
          hint="Each sheet becomes a CSV — bundled into a zip when there are multiple"
          disabled={busy}
        />

        {files.length > 0 && !results && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={convert} disabled={busy}>
              <FileSpreadsheet className="size-4" /> Convert {files.length} file
              {files.length === 1 ? "" : "s"}
            </Button>
            {busy && <Spinner label="Converting…" />}
            <Button variant="ghost" onClick={reset} disabled={busy}>
              Clear
            </Button>
          </div>
        )}

        {results && <ResultPanel files={results} onReset={reset} />}
      </div>
    </Card>
  )
}
