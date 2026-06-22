'use client'

import * as React from "react"
import { PDFDocument, degrees } from "pdf-lib"
import { RotateCw } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

const ROTATIONS = [90, 180, 270] as const

export default function PdfRotate() {
  const [file, setFile] = React.useState<File | null>(null)
  const [rotation, setRotation] = React.useState<number>(90)
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile[] | null>(null)
  const { toast } = useToast()

  const onFiles = (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Please select a PDF file", variant: "destructive" })
      return
    }
    setFile(f)
    setResult(null)
  }

  const onRotate = async () => {
    if (!file) return
    setBusy(true)
    try {
      const src = await PDFDocument.load(await file.arrayBuffer())
      src.getPages().forEach((p) => {
        const cur = p.getRotation().angle
        p.setRotation(degrees((cur + rotation) % 360))
      })
      const bytes = await src.save()
      setResult([
        { name: "rotated.pdf", blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) },
      ])
      toast({
        title: "PDF rotated",
        description: `All pages rotated ${rotation}° clockwise.`,
      })
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
    setRotation(90)
  }

  if (result) {
    return (
      <ResultPanel
        files={result}
        onReset={reset}
        message="Your rotated PDF is ready to download."
      />
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="application/pdf"
          onFiles={onFiles}
          label="Drop a PDF here or click to browse"
          hint="Every page will be rotated by the selected angle."
          disabled={busy}
        />

        {file && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  Choose a clockwise rotation angle.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Change file
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Rotation (clockwise)</Label>
              <RadioGroup
                value={String(rotation)}
                onValueChange={(v) => setRotation(Number(v))}
                className="grid grid-cols-3 gap-2"
              >
                {ROTATIONS.map((deg) => (
                  <div
                    key={deg}
                    className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <RadioGroupItem value={String(deg)} id={`rot-${deg}`} />
                    <Label htmlFor={`rot-${deg}`} className="cursor-pointer">
                      {deg}°
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-end">
              <Button onClick={onRotate} disabled={busy}>
                <RotateCw className="size-4" /> Rotate PDF
              </Button>
            </div>
          </>
        )}

        {busy && <Spinner label="Rotating pages…" />}
      </div>
    </Card>
  )
}
