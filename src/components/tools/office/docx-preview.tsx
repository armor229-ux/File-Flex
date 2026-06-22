'use client'

import * as React from "react"
import { renderAsync } from "docx-preview"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Eraser, Info } from "lucide-react"

export default function DocxPreview() {
  const { toast } = useToast()
  const previewRef = React.useRef<HTMLDivElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [rendered, setRendered] = React.useState(false)

  const onFiles = async (incoming: File[]) => {
    const f = incoming[0]
    if (!f) return
    setFile(f)
    setRendered(false)
    if (previewRef.current) previewRef.current.innerHTML = ""
    setBusy(true)
    try {
      if (!previewRef.current) return
      await renderAsync(f, previewRef.current, undefined, {
        inWrapper: true,
        breakPages: true,
        className: "docx",
      })
      setRendered(true)
    } catch (e) {
      const err = e as Error
      toast({
        title: "Preview failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const clear = () => {
    setFile(null)
    setRendered(false)
    if (previewRef.current) previewRef.current.innerHTML = ""
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept=".docx"
          onFiles={onFiles}
          label="Drop a .docx file to preview"
          hint="Rendered faithfully in your browser"
          disabled={busy}
        />

        <div className="flex flex-wrap items-center gap-3">
          {busy && <Spinner label="Rendering document…" />}
          {file && (
            <Button variant="ghost" onClick={clear} disabled={busy}>
              <Eraser className="size-4" /> Clear
            </Button>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Preview is a faithful but best-effort render of the .docx content.
        </p>

        <div
          ref={previewRef}
          aria-live="polite"
          aria-busy={busy}
          className="overflow-auto rounded-xl border bg-white p-6 text-black min-h-[400px] max-h-[600px]"
        >
          {!file && !busy && (
            <p className="text-sm text-muted-foreground">
              Your document preview will appear here.
            </p>
          )}
          {!rendered && busy && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </div>
      </div>
    </Card>
  )
}
