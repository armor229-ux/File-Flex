'use client'

import * as React from "react"
import { PDFDocument } from "pdf-lib"
import { FileText, Save } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/file-utils"

type Metadata = {
  title: string
  author: string
  subject: string
  /** Stored as a comma-separated string in the form; split on save. */
  keywords: string
  creator: string
  producer: string
}

const EMPTY: Metadata = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
}

const FIELDS: {
  key: keyof Metadata
  label: string
  shortLabel: string
  placeholder: string
}[] = [
  { key: "title", label: "Title", shortLabel: "Title", placeholder: "Document title" },
  { key: "author", label: "Author", shortLabel: "Author", placeholder: "Author name" },
  { key: "subject", label: "Subject", shortLabel: "Subject", placeholder: "Subject" },
  {
    key: "keywords",
    label: "Keywords (comma-separated)",
    shortLabel: "Keywords",
    placeholder: "report, finance, 2024",
  },
  { key: "creator", label: "Creator", shortLabel: "Creator", placeholder: "Creator app" },
  { key: "producer", label: "Producer", shortLabel: "Producer", placeholder: "Producer app" },
]

export default function PdfEditMetadata() {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [fileBytes, setFileBytes] = React.useState<Uint8Array | null>(null)
  const [current, setCurrent] = React.useState<Metadata | null>(null)
  const [form, setForm] = React.useState<Metadata>(EMPTY)
  const [busy, setBusy] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile[] | null>(null)

  const onFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Please select a PDF file", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const bytes = new Uint8Array(await f.arrayBuffer())
      const doc = await PDFDocument.load(bytes)
      const meta: Metadata = {
        title: doc.getTitle() ?? "",
        author: doc.getAuthor() ?? "",
        subject: doc.getSubject() ?? "",
        keywords: doc.getKeywords() ?? "",
        creator: doc.getCreator() ?? "",
        producer: doc.getProducer() ?? "",
      }
      setFile(f)
      setFileBytes(bytes)
      setCurrent(meta)
      setForm(meta)
      setResult(null)
    } catch (e) {
      toast({
        title: "Could not read PDF",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSave = async () => {
    if (!fileBytes) return
    setBusy(true)
    try {
      const doc = await PDFDocument.load(fileBytes)
      // pdf-lib's metadata setters require a string (or string[] for keywords);
      // pass empty strings to effectively clear a field rather than undefined.
      doc.setTitle(form.title.trim())
      doc.setAuthor(form.author.trim())
      doc.setSubject(form.subject.trim())
      const kw = form.keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      doc.setKeywords(kw)
      doc.setCreator(form.creator.trim())
      doc.setProducer(form.producer.trim())
      const bytes = await doc.save()
      setResult([
        {
          name: "metadata-edited.pdf",
          blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        },
      ])
      toast({ title: "Metadata saved", description: "Your edited PDF is ready." })
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
    setFileBytes(null)
    setCurrent(null)
    setForm(EMPTY)
  }

  if (result) {
    return (
      <Card className="p-5 sm:p-6">
        <ResultPanel
          files={result}
          onReset={reset}
          message="Your edited PDF is ready to download."
        />
      </Card>
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        {!file ? (
          <FileDropzone
            accept="application/pdf"
            onFiles={onFiles}
            label="Drop a PDF here or click to browse"
            hint="Edit the document's title, author, subject, and more."
            disabled={loading}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={busy || loading}
              >
                Change file
              </Button>
            </div>

            {current && (
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current metadata (read-only)
                </p>
                <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <div key={f.key} className="flex gap-2">
                      <dt className="w-20 shrink-0 text-muted-foreground">
                        {f.shortLabel}
                      </dt>
                      <dd className="min-w-0 truncate">
                        {current[f.key] || (
                          <span className="text-muted-foreground/70">(empty)</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`md-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`md-${f.key}`}
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    placeholder={f.placeholder}
                    disabled={busy}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={onSave} disabled={busy || loading}>
                <Save className="size-4" /> Save metadata
              </Button>
            </div>
          </>
        )}

        {(busy || loading) && (
          <Spinner
            label={loading ? "Reading PDF metadata…" : "Saving metadata…"}
          />
        )}
      </div>
    </Card>
  )
}
