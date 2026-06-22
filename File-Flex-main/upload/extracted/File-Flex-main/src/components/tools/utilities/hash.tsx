'use client'

import * as React from "react"
import SparkMD5 from "spark-md5"
import { Copy, FileText, Hash as HashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/file-utils"

type Algo = "MD5" | "SHA-1" | "SHA-256" | "SHA-512"

const ALGOS: Algo[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"]

async function sha(algo: "SHA-1" | "SHA-256" | "SHA-512", data: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function md5FromText(text: string): string {
  return SparkMD5.hash(text)
}

function md5FromBuffer(buf: ArrayBuffer): string {
  const spark = new SparkMD5.ArrayBuffer()
  spark.append(buf)
  return spark.end()
}

interface HashRowProps {
  algo: Algo
  value: string
}

function HashRow({ algo, value }: HashRowProps) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          {algo}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!value}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value)
              setCopied(true)
              toast({ title: `${algo} hash copied` })
              setTimeout(() => setCopied(false), 1200)
            } catch (e) {
              toast({ title: "Copy failed", description: (e as Error).message, variant: "destructive" })
            }
          }}
        >
          <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed">
          {value || "—"}
        </code>
      </div>
    </div>
  )
}

export default function HashTool() {
  const { toast } = useToast()
  const [text, setText] = React.useState("")
  const [textHashes, setTextHashes] = React.useState<Record<Algo, string>>({
    MD5: "",
    "SHA-1": "",
    "SHA-256": "",
    "SHA-512": "",
  })

  const [file, setFile] = React.useState<File | null>(null)
  const [fileHashes, setFileHashes] = React.useState<Record<Algo, string>>({
    MD5: "",
    "SHA-1": "",
    "SHA-256": "",
    "SHA-512": "",
  })
  const [fileLoading, setFileLoading] = React.useState(false)

  // Live (debounced) hashing for text mode.
  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (!text) {
        setTextHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" })
        return
      }
      const md5 = md5FromText(text)
      const enc = new TextEncoder().encode(text)
      Promise.all([
        sha("SHA-1", enc),
        sha("SHA-256", enc),
        sha("SHA-512", enc),
      ])
        .then(([s1, s256, s512]) => {
          setTextHashes({
            MD5: md5,
            "SHA-1": s1,
            "SHA-256": s256,
            "SHA-512": s512,
          })
        })
        .catch(() => {
          // surfaced via toast in callers; keep quiet here
        })
    }, 250)
    return () => clearTimeout(handle)
  }, [text])

  const handleFile = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setFileLoading(true)
    setFileHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" })
    try {
      const buf = await f.arrayBuffer()
      const md5 = md5FromBuffer(buf)
      const [s1, s256, s512] = await Promise.all([
        sha("SHA-1", buf),
        sha("SHA-256", buf),
        sha("SHA-512", buf),
      ])
      setFileHashes({
        MD5: md5,
        "SHA-1": s1,
        "SHA-256": s256,
        "SHA-512": s512,
      })
    } catch (e) {
      setFile(null)
      setFileHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" })
      toast({
        title: "Failed to hash file",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setFileLoading(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <Tabs defaultValue="text" className="gap-4">
        <TabsList>
          <TabsTrigger value="text">
            <FileText className="size-4" /> Text
          </TabsTrigger>
          <TabsTrigger value="file">
            <HashIcon className="size-4" /> File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hash-text">Text to hash</Label>
            <Textarea
              id="hash-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type text…"
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ALGOS.map((a) => (
              <HashRow key={a} algo={a} value={textHashes[a]} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          {!file ? (
            <FileDropzone
              multiple={false}
              onFiles={handleFile}
              label="Drop a file to hash"
              hint="MD5, SHA-1, SHA-256 and SHA-512 — computed locally in your browser."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setFileHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" })
                  }}
                >
                  Change file
                </Button>
              </div>

              {fileLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner label="Hashing file…" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ALGOS.map((a) => (
                    <HashRow key={a} algo={a} value={fileHashes[a]} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
