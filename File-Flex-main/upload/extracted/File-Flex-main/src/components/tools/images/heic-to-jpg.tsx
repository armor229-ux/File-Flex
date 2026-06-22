'use client'

import * as React from "react"
import heic2any from "heic2any"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { withExtension } from "@/lib/file-utils"
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
import { Wand2 } from "lucide-react"

type Format = "jpg" | "png"

export default function HeicToJpg() {
  const { toast } = useToast()
  const [files, setFiles] = React.useState<File[]>([])
  const [format, setFormat] = React.useState<Format>("jpg")
  const [busy, setBusy] = React.useState(false)
  const [progress, setProgress] = React.useState<{
    current: number
    total: number
  } | null>(null)
  const [results, setResults] = React.useState<ResultFile[] | null>(null)

  const onFiles = (incoming: File[]) => {
    setFiles(incoming)
    setResults(null)
  }

  const reset = () => {
    setFiles([])
    setResults(null)
    setFormat("jpg")
    setProgress(null)
  }

  const convert = async () => {
    if (files.length === 0) return
    setBusy(true)
    setResults(null)
    setProgress({ current: 0, total: files.length })
    try {
      const out: ResultFile[] = []
      const toType = format === "png" ? "image/png" : "image/jpeg"
      const ext = format
      for (let i = 0; i < files.length; i++) {
        setProgress({ current: i + 1, total: files.length })
        const f = files[i]
        const result = await heic2any({ blob: f, toType, quality: 0.9 })
        const blob: Blob = Array.isArray(result) ? result[0] : result
        out.push({ name: withExtension(f.name, ext), blob })
      }
      setResults(out)
    } catch (e) {
      const err = e as Error
      toast({
        title: "HEIC conversion failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="image/heic,image/heif,.heic,.heif"
          multiple
          onFiles={onFiles}
          label="Drop HEIC/HEIF photos"
          hint="Converted entirely in your browser — nothing is uploaded"
          disabled={busy}
        />

        {files.length > 0 && !results && (
          <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="h2j-fmt">Target format</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as Format)}
                disabled={busy}
              >
                <SelectTrigger id="h2j-fmt" className="w-full">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={convert} disabled={busy}>
                <Wand2 className="size-4" /> Convert {files.length} photo
                {files.length === 1 ? "" : "s"}
              </Button>
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {busy && progress && (
          <Spinner
            label={`Converting ${progress.current} of ${progress.total}…`}
          />
        )}

        {results && <ResultPanel files={results} onReset={reset} />}
      </div>
    </Card>
  )
}
