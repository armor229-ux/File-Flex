'use client'

import * as React from "react"
import { Lock, ShieldCheck } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { encryptPdf } from "@/lib/qpdf"

export default function PdfPassword() {
  const [file, setFile] = React.useState<File | null>(null)
  const [userPw, setUserPw] = React.useState("")
  const [ownerPw, setOwnerPw] = React.useState("")
  const [allowPrint, setAllowPrint] = React.useState(false)
  const [allowCopy, setAllowCopy] = React.useState(false)
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

  const onProtect = async () => {
    if (!file) return
    if (userPw.length < 1) {
      toast({ title: "Enter a password", variant: "destructive" })
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const input = new Uint8Array(await file.arrayBuffer())
      const encrypted = await encryptPdf(input, {
        userPassword: userPw,
        ownerPassword: ownerPw || undefined,
        allowPrint,
        allowCopy,
      })
      setResult([
        {
          name: "protected.pdf",
          blob: new Blob([encrypted as BlobPart], { type: "application/pdf" }),
        },
      ])
      toast({
        title: "PDF protected (AES-256)",
        description: "A password is now required to open it.",
      })
    } catch (e) {
      toast({
        title: "Encryption failed",
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
    setUserPw("")
    setOwnerPw("")
    setAllowPrint(false)
    setAllowCopy(false)
  }

  if (result) {
    return (
      <ResultPanel
        files={result}
        onReset={reset}
        message="Your encrypted PDF is ready. Any PDF reader will ask for the password before opening it."
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
          hint="Your file is encrypted in your browser — nothing is uploaded."
          disabled={busy}
        />

        {file && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">Ready to encrypt.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Change file
              </Button>
            </div>

            <div className="flex max-w-md flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-pw">
                  User password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-pw"
                  type="password"
                  value={userPw}
                  onChange={(e) => setUserPw(e.target.value)}
                  placeholder="Required to open the file"
                  autoComplete="new-password"
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  Anyone opening the PDF must enter this password.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="owner-pw">Owner password (optional)</Label>
                <Input
                  id="owner-pw"
                  type="password"
                  value={ownerPw}
                  onChange={(e) => setOwnerPw(e.target.value)}
                  placeholder="Defaults to the user password"
                  autoComplete="new-password"
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  Used to change permissions later. Leave blank to use the user password.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="allow-print" className="text-sm font-medium">
                      Allow printing
                    </Label>
                    <p className="text-xs text-muted-foreground">Off by default.</p>
                  </div>
                  <Switch
                    id="allow-print"
                    checked={allowPrint}
                    onCheckedChange={setAllowPrint}
                    disabled={busy}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="allow-copy" className="text-sm font-medium">
                      Allow copying text &amp; graphics
                    </Label>
                    <p className="text-xs text-muted-foreground">Off by default.</p>
                  </div>
                  <Switch
                    id="allow-copy"
                    checked={allowCopy}
                    onCheckedChange={setAllowCopy}
                    disabled={busy}
                  />
                </div>
              </div>

              <Button onClick={onProtect} disabled={busy} className="w-fit">
                <Lock className="size-4" /> Encrypt PDF (AES-256)
              </Button>
            </div>
          </>
        )}

        {busy && <Spinner label="Encrypting with qpdf (WebAssembly)…" />}

        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          <p>
            Tested in Chrome PDF viewer, Adobe Acrobat, and Preview. The file will
            require the password to open. Encryption is real AES-256 via qpdf
            (WebAssembly) — not a fake lock.
          </p>
        </div>
      </div>
    </Card>
  )
}
