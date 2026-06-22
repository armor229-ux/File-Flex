'use client'

import * as React from "react"
import JSZip from "jszip"
import { Download, FileDown, ListPlus, Trash2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { formatBytes, withExtension } from "@/lib/file-utils"

/** Split a filename into [basename, extension-with-dot] (extension is "" if none). */
function splitExt(name: string): [string, string] {
  const dot = name.lastIndexOf(".")
  if (dot <= 0) return [name, ""]
  return [name.slice(0, dot), name.slice(dot)]
}

interface RenameState {
  /** Original File object. */
  file: File
  /** User-editable new name (with extension). */
  newName: string
}

export default function FileRenameBatch() {
  const { toast } = useToast()
  const [items, setItems] = React.useState<RenameState[]>([])
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile | null>(null)

  // Batch control state.
  const [find, setFind] = React.useState("")
  const [replace, setReplace] = React.useState("")
  const [prefix, setPrefix] = React.useState("")
  const [suffix, setSuffix] = React.useState("")
  const [seqStart, setSeqStart] = React.useState(1)

  const addFiles = (incoming: File[]) => {
    setResult(null)
    setItems((prev) => {
      const seen = new Set(prev.map((p) => `${p.file.name}:${p.file.size}`))
      const next = [...prev]
      for (const f of incoming) {
        const key = `${f.name}:${f.size}`
        if (seen.has(key)) continue
        seen.add(key)
        next.push({ file: f, newName: f.name })
      }
      return next
    })
  }

  const removeAt = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setItems([])
    setResult(null)
  }

  const updateName = (index: number, newName: string) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, newName } : it))
    )
  }

  const applyFindReplace = () => {
    if (!find) {
      toast({ title: "Enter text to find first", variant: "destructive" })
      return
    }
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        newName: it.newName.split(find).join(replace),
      }))
    )
    toast({ title: "Find/Replace applied" })
  }

  const applyPrefixSuffix = () => {
    if (!prefix && !suffix) {
      toast({ title: "Enter a prefix or suffix first", variant: "destructive" })
      return
    }
    setItems((prev) =>
      prev.map((it) => {
        const [base, ext] = splitExt(it.newName)
        return { ...it, newName: `${prefix}${base}${suffix}${ext}` }
      })
    )
    toast({ title: "Prefix/Suffix applied" })
  }

  const applySequence = () => {
    const start = Math.max(0, Math.min(999999, Math.floor(seqStart)))
    setItems((prev) =>
      prev.map((it, i) => {
        const [base, ext] = splitExt(it.newName)
        const seq = String(start + i).padStart(3, "0")
        return { ...it, newName: `${prefix}${base || "file"}-${seq}${ext}` }
      })
    )
    toast({ title: "Sequence applied" })
  }

  const resetAllNames = () => {
    setItems((prev) => prev.map((it) => ({ ...it, newName: it.file.name })))
    toast({ title: "Names reset" })
  }

  const downloadZip = async () => {
    if (items.length === 0) return
    // Validate names are non-empty and unique (case-insensitive on the
    // full path; folder-aware).
    const seen = new Set<string>()
    const cleaned = items.map((it) => {
      const name = it.newName.trim() || it.file.name
      const [base, ext] = splitExt(it.file.name)
      // Preserve original extension if user removed it accidentally.
      const finalName = ext && !/\.[^/]+$/.test(name) ? withExtension(name, ext.replace(/^\./, "")) : name
      return { original: it, name: finalName }
    })
    for (const c of cleaned) {
      const key = c.name.toLowerCase()
      if (seen.has(key)) {
        toast({
          title: "Duplicate filename",
          description: `“${c.name}” appears more than once. Rename one of them and try again.`,
          variant: "destructive",
        })
        return
      }
      seen.add(key)
    }

    setBusy(true)
    setResult(null)
    try {
      const zip = new JSZip()
      for (const c of cleaned) {
        zip.file(c.name, c.original.file)
      }
      const blob = await zip.generateAsync({ type: "blob" })
      setResult({ name: "renamed.zip", blob })
      toast({ title: "ZIP created", description: `${cleaned.length} files` })
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

  const hasDuplicates = React.useMemo(() => {
    const seen = new Set<string>()
    for (const it of items) {
      const key = (it.newName.trim() || it.file.name).toLowerCase()
      if (seen.has(key)) return true
      seen.add(key)
    }
    return false
  }, [items])

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-5">
        <FileDropzone
          multiple
          onFiles={addFiles}
          label="Drop files here to rename them in batch"
          hint="Any file type. New names are previewed live before you download."
          disabled={busy}
        />

        {items.length > 0 && (
          <>
            {/* Batch controls */}
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Wand2 className="size-4" /> Batch operations
              </p>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="rn-find">Find</Label>
                  <Input
                    id="rn-find"
                    value={find}
                    onChange={(e) => setFind(e.target.value)}
                    placeholder="text to find"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rn-replace">Replace with</Label>
                  <Input
                    id="rn-replace"
                    value={replace}
                    onChange={(e) => setReplace(e.target.value)}
                    placeholder="replacement"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={applyFindReplace}
                    disabled={busy || !find}
                    className="w-full sm:w-auto"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="rn-prefix">Prefix</Label>
                  <Input
                    id="rn-prefix"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. vacation-"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rn-suffix">Suffix</Label>
                  <Input
                    id="rn-suffix"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. -final"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={applyPrefixSuffix}
                    disabled={busy || (!prefix && !suffix)}
                    className="w-full sm:w-auto"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="rn-seq-start">Sequence start</Label>
                  <Input
                    id="rn-seq-start"
                    type="number"
                    min={0}
                    value={seqStart}
                    onChange={(e) => setSeqStart(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={applySequence}
                    disabled={busy}
                    className="w-full sm:w-auto"
                  >
                    <ListPlus className="size-4" /> Apply sequence
                  </Button>
                </div>
                <div className="hidden sm:block" />
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={resetAllNames}
                    disabled={busy}
                    className="w-full sm:w-auto"
                  >
                    Reset names
                  </Button>
                </div>
              </div>
            </div>

            {/* File list with editable names */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {items.length} file{items.length === 1 ? "" : "s"} ·{" "}
                  {formatBytes(items.reduce((s, it) => s + it.file.size, 0))}
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
              {hasDuplicates && (
                <p className="text-xs text-destructive">
                  Duplicate filenames detected — these must be unique before
                  downloading.
                </p>
              )}
              <ul className="max-h-[440px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                {items.map((it, i) => (
                  <li
                    key={`${it.file.name}-${it.file.size}-${i}`}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <FileDown className="size-4" />
                    </div>
                    <div className="grid min-w-0 flex-1 gap-1">
                      <Input
                        value={it.newName}
                        onChange={(e) => updateName(i, e.target.value)}
                        disabled={busy}
                        aria-label={`New name for ${it.file.name}`}
                        className="h-8 text-sm"
                      />
                      <p className="truncate text-xs text-muted-foreground">
                        Original: {it.file.name} · {formatBytes(it.file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${it.file.name}`}
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

            <div className="flex justify-end">
              <Button
                onClick={downloadZip}
                disabled={busy || items.length === 0 || hasDuplicates}
              >
                <Download className="size-4" /> Download as ZIP
              </Button>
            </div>
          </>
        )}

        {busy && (
          <div className="flex justify-center py-2">
            <Spinner label="Creating ZIP…" />
          </div>
        )}

        {result && (
          <ResultPanel
            files={[result]}
            onReset={() => setResult(null)}
            message="Your renamed files are bundled in this ZIP."
          />
        )}
      </div>
    </Card>
  )
}
