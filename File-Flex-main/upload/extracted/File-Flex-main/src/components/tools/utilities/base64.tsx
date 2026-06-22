'use client'

import * as React from "react"
import { Copy, Download, FileDown, FileText, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob } from "@/lib/file-utils"

const DATA_URL_RE = /^data:([^;]+)?(;base64)?,([\s\S]*)$/

function CopyButton({
  value,
  label = "Copy",
}: {
  value: string
  label?: string
}) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!value}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          toast({ title: "Copied to clipboard" })
          setTimeout(() => setCopied(false), 1200)
        } catch (e) {
          toast({
            title: "Copy failed",
            description: (e as Error).message,
            variant: "destructive",
          })
        }
      }}
    >
      <Copy className="size-4" /> {copied ? "Copied!" : label}
    </Button>
  )
}

/** UTF-8 safe base64 encode for arbitrary text. */
function encodeBase64Utf8(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

/** UTF-8 safe base64 decode. Throws on invalid input. */
function decodeBase64Utf8(input: string): string {
  return decodeURIComponent(escape(atob(input)))
}

function isProbablyBase64(s: string): boolean {
  const trimmed = s.trim()
  if (!trimmed) return false
  // Allow data URLs to be considered valid base64 input for decode mode.
  if (DATA_URL_RE.test(trimmed)) return true
  // Strip any internal whitespace; valid base64 is [A-Za-z0-9+/] with optional = padding.
  const cleaned = trimmed.replace(/\s+/g, "")
  return /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) && cleaned.length % 4 === 0
}

function EncodeMode() {
  const { toast } = useToast()
  const [mode, setMode] = React.useState<"text" | "file">("text")
  const [text, setText] = React.useState("")
  const [encoded, setEncoded] = React.useState("")
  const [fileBusy, setFileBusy] = React.useState(false)
  const [fileMeta, setFileMeta] = React.useState<{ name: string; size: number } | null>(null)

  // Live encode for text mode.
  React.useEffect(() => {
    if (mode !== "text") return
    if (!text) {
      setEncoded("")
      return
    }
    try {
      setEncoded(encodeBase64Utf8(text))
    } catch (e) {
      setEncoded("")
      toast({
        title: "Could not encode text",
        description: (e as Error).message,
        variant: "destructive",
      })
    }
  }, [text, mode, toast])

  const handleFile = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setFileBusy(true)
    setEncoded("")
    setFileMeta(null)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result)
          else reject(new Error("Unexpected FileReader result."))
        }
        reader.onerror = () =>
          reject(reader.error ?? new Error("File read failed."))
        reader.readAsDataURL(file)
      })
      setEncoded(dataUrl)
      setFileMeta({ name: file.name, size: file.size })
    } catch (e) {
      toast({
        title: "Could not read file",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setFileBusy(false)
    }
  }

  const downloadTxt = () => {
    if (!encoded) return
    const blob = new Blob([encoded], { type: "text/plain;charset=utf-8" })
    const name = fileMeta?.name
      ? `${fileMeta.name}.b64.txt`
      : "encoded.txt"
    downloadBlob(blob, name)
  }

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "file")}>
      <TabsList>
        <TabsTrigger value="text">
          <FileText className="size-4" /> Text
        </TabsTrigger>
        <TabsTrigger value="file">
          <FileDown className="size-4" /> File
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="b64-encode-text">Text to encode</Label>
          <Textarea
            id="b64-encode-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text to encode…"
            className="min-h-[140px] font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="b64-encode-out">Base64 output</Label>
            <div className="flex items-center gap-2">
              <CopyButton value={encoded} />
              <Button
                size="sm"
                onClick={downloadTxt}
                disabled={!encoded}
                variant="outline"
              >
                <Download className="size-4" /> .txt
              </Button>
            </div>
          </div>
          <Textarea
            id="b64-encode-out"
            readOnly
            value={encoded}
            placeholder="Base64 string will appear here…"
            className="min-h-[140px] break-all font-mono text-xs"
          />
        </div>
      </TabsContent>

      <TabsContent value="file" className="space-y-4">
        <FileDropzone
          multiple={false}
          onFiles={handleFile}
          label="Drop a file to encode as base64"
          hint="The file is read as a data URL — large files will produce very long strings."
          disabled={fileBusy}
        />
        {fileBusy && (
          <div className="flex justify-center py-2">
            <Spinner label="Reading file…" />
          </div>
        )}
        {fileMeta && encoded && (
          <p className="text-xs text-muted-foreground">
            Encoded {fileMeta.name} ({fileMeta.size.toLocaleString()} bytes) →{" "}
            {encoded.length.toLocaleString()} base64 chars.
          </p>
        )}
        {encoded && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="b64-encode-file-out">Base64 data URL</Label>
              <div className="flex items-center gap-2">
                <CopyButton value={encoded} />
                <Button size="sm" onClick={downloadTxt} variant="outline">
                  <Download className="size-4" /> .txt
                </Button>
              </div>
            </div>
            <Textarea
              id="b64-encode-file-out"
              readOnly
              value={encoded}
              className="min-h-[160px] break-all font-mono text-xs"
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

function DecodeMode() {
  const { toast } = useToast()
  const [input, setInput] = React.useState("")
  const [decodedText, setDecodedText] = React.useState("")
  const [decodedError, setDecodedError] = React.useState<string | null>(null)
  const [dataUrlInfo, setDataUrlInfo] = React.useState<{
    mime: string
    isBase64: boolean
    raw: string
  } | null>(null)

  // Live decode: try as text; also detect a data URL.
  React.useEffect(() => {
    const value = input.trim()
    if (!value) {
      setDecodedText("")
      setDecodedError(null)
      setDataUrlInfo(null)
      return
    }
    const dataMatch = DATA_URL_RE.exec(value)
    if (dataMatch) {
      const mime = dataMatch[1] || "application/octet-stream"
      const isBase64 = Boolean(dataMatch[2])
      const raw = dataMatch[3] ?? ""
      setDataUrlInfo({ mime, isBase64, raw })
      // If it's a base64 data URL, try to decode the payload as UTF-8 text as a
      // best-effort preview (will fail for binary payloads — that's fine).
      if (isBase64) {
        try {
          const text = decodeBase64Utf8(raw)
          // Heuristic: if the decoded payload has many control characters, treat
          // it as binary and skip the text preview.
          const controlCount = Array.from(text.slice(0, 1000)).filter(
            (c) => c.charCodeAt(0) < 9 || (c.charCodeAt(0) > 13 && c.charCodeAt(0) < 32)
          ).length
          if (controlCount > 50) {
            setDecodedText("")
            setDecodedError(null)
          } else {
            setDecodedText(text)
            setDecodedError(null)
          }
        } catch {
          setDecodedText("")
          setDecodedError(null)
        }
      } else {
        // URL-encoded data URL payload — show as text directly.
        try {
          setDecodedText(decodeURIComponent(raw))
          setDecodedError(null)
        } catch {
          setDecodedText(raw)
          setDecodedError(null)
        }
      }
      return
    }

    setDataUrlInfo(null)
    if (!isProbablyBase64(value)) {
      setDecodedText("")
      setDecodedError("Input is not valid base64 (length must be a multiple of 4 and contain only A–Z, a–z, 0–9, +, /, =).")
      return
    }
    try {
      setDecodedText(decodeBase64Utf8(value.replace(/\s+/g, "")))
      setDecodedError(null)
    } catch (e) {
      setDecodedText("")
      setDecodedError((e as Error).message || "Invalid base64 input.")
    }
  }, [input])

  const downloadAsFile = async () => {
    const value = input.trim()
    if (!value) return
    const dataMatch = DATA_URL_RE.exec(value)
    try {
      if (dataMatch) {
        const mime = dataMatch[1] || "application/octet-stream"
        const isBase64 = Boolean(dataMatch[2])
        const raw = dataMatch[3] ?? ""
        let blob: Blob
        if (isBase64) {
          const bin = atob(raw)
          const len = bin.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
          blob = new Blob([bytes as BlobPart], { type: mime })
        } else {
          blob = new Blob([decodeURIComponent(raw)], { type: mime })
        }
        const ext = mimeToExt(mime)
        downloadBlob(blob, `decoded.${ext}`)
        toast({ title: "File downloaded", description: `decoded.${ext}` })
      } else {
        const cleaned = value.replace(/\s+/g, "")
        const bin = atob(cleaned)
        const len = bin.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
        const blob = new Blob([bytes as BlobPart], { type: "application/octet-stream" })
        downloadBlob(blob, "decoded.bin")
        toast({ title: "Binary file downloaded", description: "decoded.bin" })
      }
    } catch (e) {
      toast({
        title: "Could not decode as file",
        description: (e as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="b64-decode-in">Base64 input</Label>
        <Textarea
          id="b64-decode-in"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a base64 string or data: URL…"
          className="min-h-[140px] break-all font-mono text-xs"
        />
      </div>

      {decodedError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {decodedError}
        </p>
      )}

      {dataUrlInfo && (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Data URL detected.</span>{" "}
            MIME: <code className="font-mono">{dataUrlInfo.mime}</code> ·{" "}
            {dataUrlInfo.isBase64 ? "base64-encoded" : "URL-encoded"} payload.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="b64-decode-out">Decoded text</Label>
          <div className="flex items-center gap-2">
            <CopyButton value={decodedText} label="Copy text" />
            <Button
              size="sm"
              variant="outline"
              onClick={downloadAsFile}
              disabled={!input}
            >
              <Download className="size-4" /> Download as file
            </Button>
          </div>
        </div>
        <Textarea
          id="b64-decode-out"
          readOnly
          value={decodedText}
          placeholder={
            dataUrlInfo && !decodedText
              ? "Binary payload — use “Download as file” to save it."
              : "Decoded text will appear here…"
          }
          className="min-h-[140px] font-mono text-sm"
        />
      </div>
    </div>
  )
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/html": "html",
    "text/csv": "csv",
    "application/json": "json",
    "application/xml": "xml",
    "application/zip": "zip",
    "application/x-gzip": "gz",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "video/mp4": "mp4",
  }
  return map[mime.toLowerCase()] ?? "bin"
}

export default function Base64Tool() {
  const [tab, setTab] = React.useState<"encode" | "decode">("encode")

  return (
    <Card className="p-5 sm:p-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "encode" | "decode")}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="encode">
            <Lock className="size-4" /> Encode
          </TabsTrigger>
          <TabsTrigger value="decode">
            <Unlock className="size-4" /> Decode
          </TabsTrigger>
        </TabsList>
        <TabsContent value="encode">
          <EncodeMode />
        </TabsContent>
        <TabsContent value="decode">
          <DecodeMode />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
