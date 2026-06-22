'use client'

import * as React from "react"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { withoutExtension } from "@/lib/file-utils"
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
import { FileSpreadsheet } from "lucide-react"

type Orientation = "portrait" | "landscape"

export default function ExcelToPdf() {
  const { toast } = useToast()
  const [files, setFiles] = React.useState<File[]>([])
  const [orientation, setOrientation] = React.useState<Orientation>("landscape")
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
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" })
        const doc = new jsPDF({
          unit: "pt",
          format: "a4",
          orientation,
        })

        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name]
          if (!sheet) continue
          const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            blankrows: false,
          })
          const head = (rows[0] ?? []).map((c) => String(c ?? ""))
          const body = rows.slice(1).map((r) =>
            (r as unknown[]).map((c) => String(c ?? ""))
          )

          autoTable(doc, {
            head: head.length > 0 ? [head] : undefined,
            body,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [30, 64, 175] },
            theme: "grid",
            margin: { top: 40, left: 20, right: 20 },
            didDrawPage: () => {
              doc.setFontSize(14)
              doc.text(`${file.name} — ${name}`, 20, 25)
            },
          })
        }

        const blob = doc.output("blob")
        out.push({
          name: `${withoutExtension(file.name)}.pdf`,
          blob,
        })
      }

      setResults(out)
      toast({
        title: "Conversion complete",
        description: `${out.length} PDF${out.length === 1 ? "" : "s"} ready.`,
      })
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
          hint="Each sheet becomes a paginated PDF table — one PDF per file"
          disabled={busy}
        />

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="xls-orientation" className="text-xs">
              Orientation
            </Label>
            <Select
              value={orientation}
              onValueChange={(v) => setOrientation(v as Orientation)}
              disabled={busy}
            >
              <SelectTrigger id="xls-orientation" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            Tables always fit to page width.
          </p>
        </div>

        {files.length > 0 && !results && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={convert} disabled={busy}>
              <FileSpreadsheet className="size-4" /> Convert{" "}
              {files.length === 1 ? "file" : `${files.length} files`}
            </Button>
            {busy && <Spinner label="Building PDFs…" />}
            <Button variant="ghost" onClick={reset} disabled={busy}>
              Clear
            </Button>
          </div>
        )}

        {results && (
          <ResultPanel
            files={results}
            onReset={reset}
            message={
              results.length === 1
                ? "Spreadsheet converted to PDF."
                : `${results.length} PDFs generated — one per spreadsheet.`
            }
          />
        )}
      </div>
    </Card>
  )
}
