'use client'

import * as React from "react"
import { Unlock, ShieldCheck } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { decryptPdf } from "@/lib/qpdf"

export default function PdfUnlock() {
  const [file, setFile] = React.useState<File | null>(null)
  const [password, setPassword] = React.useState("")
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

  const onUnlock = async () => {
    if (!file) return
    if (!password) {
      toast({ title: "Enter the current password", variant: "destructive" })
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const input = new Uint8Array(await file.arrayBuffer())
      const decrypted = await decryptPdf(input, password)
      setResult([
        {
          name: "unlocked.pdf",
          blob: new Blob([decrypted as BlobPart], { type: "application/pdf" }),
        },
      ])
      toast({
        title: "Password removed",
        description: "The unlocked PDF no longer requires a password.",
      })
    } catch (e) {
      toast({
        title: "Could not unlock",
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
    setPassword("")
  }

  if (result) {
    return (
      <ResultPanel
        files={result}
        onReset={reset}
        message="Your unlocked PDF is ready — it opens without a password."
      />
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <FileDropzone
          accept="application/pdf"
          onFiles={onFiles}
          label="Drop a password-protected PDF here"
          hint="Your file is decrypted in your browser — nothing is uploaded."
          disabled={busy}
        />

        {file && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">Enter the password to remove.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Change file
              </Button>
            </div>

            <div className="flex max-w-md flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="unlock-pw">Current password</Label>
                <Input
                  id="unlock-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="The password you already know"
                  autoComplete="current-password"
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  You must already know the password — we never bypass encryption.
                </p>
              </div>

              <Button onClick={onUnlock} disabled={busy} className="w-fit">
                <Unlock className="size-4" /> Remove password
              </Button>
            </div>
          </>
        )}

        {busy && <Spinner label="Decrypting with qpdf (WebAssembly)…" />}

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <p>
            We never bypass passwords. You must know the password to remove it. If
            you&apos;ve forgotten it, this tool cannot help — there is no
            &quot;crack&quot;.
          </p>
        </div>
      </div>
    </Card>
  )
}
