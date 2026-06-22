'use client'

import * as React from "react"
import * as XLSX from "xlsx"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { withExtension } from "@/lib/file-utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileSpreadsheet } from "lucide-react"

export default function CsvToExcel() {
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
      const out: ResultFile[] = []
      for (const file of files) {
        const text = await file.text()
        const wb = XLSX.read(text, { type: "string" })
        const arr = XLSX.write(wb, {
          bookType: "xlsx",
          type: "array",
        }) as ArrayBuffer
        const blob = new Blob([arr], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        out.push({ name: withExtension(file.name, "xlsx"), blob })
      }
      setResults(out)
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
          accept=".csv,text/csv"
          multiple
          onFiles={onFiles}
          label="Drop CSV files to convert"
          hint="Each CSV becomes an .xlsx workbook"
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
