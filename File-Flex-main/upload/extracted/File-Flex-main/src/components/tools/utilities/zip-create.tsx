'use client'

import * as React from "react"
import JSZip from "jszip"
import { Archive, FileDown, FileArchive, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/file-utils"

export default function ZipCreate() {
  const { toast } = useToast()
  const [files, setFiles] = React.useState<File[]>([])
  const [archiveName, setArchiveName] = React.useState("archive.zip")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile | null>(null)

  const addFiles = (incoming: File[]) => {
    setResult(null)
    setFiles((prev) => {
      const map = new Map<string, File>()
      for (const f of prev) map.set(`${f.name}:${f.size}:${f.lastModified}`, f)
      for (const f of incoming) map.set(`${f.name}:${f.size}:${f.lastModified}`, f)
      return Array.from(map.values())
    })
  }

  const removeAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setFiles([])
    setResult(null)
  }

  const sanitizeArchiveName = (name: string): string => {
    const trimmed = name.trim() || "archive.zip"
    const withExt = /\.zip$/i.test(trimmed) ? trimmed : `${trimmed}.zip`
    return withExt.replace(/[/\\]/g, "_")
  }

  const createZip = async () => {
    if (files.length === 0) {
      toast({ title: "Add at least one file first", variant: "destructive" })
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const zip = new JSZip()
      // Track used names so duplicate filenames inside the zip are auto-renamed
      // (zip.file silently overwrites on collision).
      const used = new Set<string>()
      for (const f of files) {
        let name = f.name || "file"
        if (used.has(name)) {
          const dot = name.lastIndexOf(".")
          const base = dot > 0 ? name.slice(0, dot) : name
          const ext = dot > 0 ? name.slice(dot) : ""
          let n = 1
          while (used.has(`${base} (${n})${ext}`)) n++
          name = `${base} (${n})${ext}`
        }
        used.add(name)
        zip.file(name, f)
      }
      const blob = await zip.generateAsync({ type: "blob" })
      setResult({ name: sanitizeArchiveName(archiveName), blob })
      toast({ title: "ZIP created", description: `${files.length} files archived` })
    } catch (e) {
      toast({
        title: "Failed to create ZIP",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-5">
        <FileDropzone
          multiple
          onFiles={addFiles}
          label="Drop files here to add them to the archive"
          hint="Any file type. Files are added to the ZIP as-is — never uploaded."
          disabled={busy}
        />

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
                {formatBytes(files.reduce((s, f) => s + f.size, 0))}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={busy}
              >
                <Trash2 className="size-4" /> Clear all
              </Button>
            </div>
            <ul className="max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${f.size}-${i}`}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <FileDown className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(f.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => removeAt(i)}
                    disabled={busy}
                    className="size-7"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="zip-name">Archive name</Label>
            <Input
              id="zip-name"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              placeholder="archive.zip"
              disabled={busy}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={createZip}
              disabled={busy || files.length === 0}
              className="w-full sm:w-auto"
            >
              <FileArchive className="size-4" /> Create ZIP
            </Button>
          </div>
        </div>

        {busy && (
          <div className="flex justify-center py-2">
            <Spinner label="Compressing files…" />
          </div>
        )}

        {result && (
          <ResultPanel
            files={[result]}
            onReset={() => {
              setResult(null)
            }}
            message="Your ZIP archive is ready to download."
          />
        )}

        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Archive className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Everything is compressed locally in your browser with JSZip. Nothing
            is ever uploaded.
          </span>
        </div>
      </div>
    </Card>
  )
}
