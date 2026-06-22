'use client'

import * as React from "react"
import JSZip from "jszip"
import { Archive, Download, FileDown, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob, formatBytes } from "@/lib/file-utils"

interface ZipEntry {
  name: string
  isDirectory: boolean
  size: number
  /** Resolved zip object for content fetching. */
  file: JSZip.JSZipObject | null
}

/**
 * Read the uncompressed size of a JSZip entry. The `_data` field is private
 * in the public type defs but exists at runtime; cast via `unknown` for
 * type-safe access without resorting to `any`.
 */
function entrySize(obj: JSZip.JSZipObject): number {
  const data = (obj as unknown as { _data?: { uncompressedSize?: number } })._data
  return data?.uncompressedSize ?? 0
}

export default function ZipExtract() {
  const { toast } = useToast()
  const [archiveName, setArchiveName] = React.useState("")
  const [entries, setEntries] = React.useState<ZipEntry[]>([])
  const [loading, setLoading] = React.useState(false)
  const [downloadingName, setDownloadingName] = React.useState<string | null>(null)

  const reset = () => {
    setArchiveName("")
    setEntries([])
    setDownloadingName(null)
  }

  const handleFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setLoading(true)
    setEntries([])
    setArchiveName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const zip = await JSZip.loadAsync(buf)
      const list: ZipEntry[] = []
      zip.forEach((relativePath, obj) => {
        list.push({
          name: relativePath,
          isDirectory: obj.dir,
          size: obj.dir ? 0 : entrySize(obj),
          file: obj.dir ? null : obj,
        })
      })
      list.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      setEntries(list)
      if (list.length === 0) {
        toast({ title: "ZIP is empty" })
      }
    } catch (e) {
      toast({
        title: "Could not read ZIP",
        description:
          (e as Error).message ||
          "The file may be corrupt, password-protected, or not a valid ZIP archive.",
        variant: "destructive",
      })
      reset()
    } finally {
      setLoading(false)
    }
  }

  const downloadEntry = async (entry: ZipEntry) => {
    if (!entry.file) return
    setDownloadingName(entry.name)
    try {
      const blob = await entry.file.async("blob")
      // Use the trailing path segment as the download filename.
      const filename = entry.name.split("/").filter(Boolean).pop() || "extracted"
      downloadBlob(blob, filename)
    } catch (e) {
      toast({
        title: "Failed to extract file",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setDownloadingName(null)
    }
  }

  const fileCount = entries.filter((e) => !e.isDirectory).length

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-5">
        {entries.length === 0 && !loading && (
          <FileDropzone
            multiple={false}
            accept=".zip,application/zip,application/x-zip-compressed"
            onFiles={handleFiles}
            label="Drop a .zip file here or click to browse"
            hint="Entries are listed and extracted one-by-one, locally in your browser."
          />
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Spinner label="Reading ZIP archive…" />
          </div>
        )}

        {entries.length > 0 && !loading && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <FolderOpen className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{archiveName}</p>
                  <p className="text-xs text-muted-foreground">
                    {fileCount} file{fileCount === 1 ? "" : "s"} ·{" "}
                    {entries.filter((e) => e.isDirectory).length} folder
                    {entries.filter((e) => e.isDirectory).length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                Choose another archive
              </Button>
            </div>

            <ul className="max-h-[460px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
              {entries.map((entry, i) => {
                const filename = entry.name.split("/").filter(Boolean).pop() || entry.name
                const depth = entry.name.split("/").filter(Boolean).length - 1
                return (
                  <li
                    key={`${entry.name}-${i}`}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                      {entry.isDirectory ? (
                        <FolderOpen className="size-4" />
                      ) : (
                        <FileDown className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{filename}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.isDirectory
                          ? "Folder"
                          : `${formatBytes(entry.size)} · ${entry.name}`}
                      </p>
                    </div>
                    {!entry.isDirectory && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadEntry(entry)}
                        disabled={downloadingName === entry.name}
                      >
                        {downloadingName === entry.name ? (
                          <Spinner />
                        ) : (
                          <>
                            <Download className="size-4" /> Download
                          </>
                        )}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Archive className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Encrypted/password-protected ZIPs are not supported. Files are
            extracted in your browser only — nothing is uploaded.
          </span>
        </div>
      </div>
    </Card>
  )
}
