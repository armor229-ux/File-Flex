'use client'

import * as React from "react"
import { Copy, Link2, Link2Off } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-center">
      <div className="font-mono text-lg tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

export default function UrlEncodeDecode() {
  const [tab, setTab] = React.useState<"encode" | "decode">("encode")
  const [encodeInput, setEncodeInput] = React.useState("")
  const [decodeInput, setDecodeInput] = React.useState("")
  const [decodeError, setDecodeError] = React.useState<string | null>(null)

  const encoded = React.useMemo(() => {
    if (!encodeInput) return ""
    try {
      return encodeURIComponent(encodeInput)
    } catch {
      return ""
    }
  }, [encodeInput])

  const { decoded, error } = React.useMemo(() => {
    if (!decodeInput) return { decoded: "", error: null as string | null }
    try {
      return { decoded: decodeURIComponent(decodeInput), error: null }
    } catch (e) {
      return {
        decoded: "",
        error:
          (e as Error).message ||
          "Invalid URL-encoded input — check for stray % characters.",
      }
    }
  }, [decodeInput])

  // Mirror the error into state so it can be displayed in a styled banner
  // without conflicting with the live memo.
  React.useEffect(() => {
    setDecodeError(error)
  }, [error])

  const encodeStats = React.useMemo(
    () => ({
      chars: encodeInput.length,
      encodedChars: encoded.length,
    }),
    [encodeInput, encoded]
  )

  return (
    <Card className="p-5 sm:p-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "encode" | "decode")}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="encode">
            <Link2 className="size-4" /> Encode
          </TabsTrigger>
          <TabsTrigger value="decode">
            <Link2Off className="size-4" /> Decode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encode" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url-enc-in">Text to encode</Label>
            <Textarea
              id="url-enc-in"
              value={encodeInput}
              onChange={(e) => setEncodeInput(e.target.value)}
              placeholder="Type or paste text to URL-encode…"
              className="min-h-[140px] font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <Stat label="Input chars" value={encodeStats.chars} />
            <Stat label="Encoded chars" value={encodeStats.encodedChars} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="url-enc-out">URL-encoded output</Label>
              <CopyButton value={encoded} />
            </div>
            <Textarea
              id="url-enc-out"
              readOnly
              value={encoded}
              placeholder="Encoded string will appear here…"
              className="min-h-[140px] break-all font-mono text-xs"
            />
          </div>
        </TabsContent>

        <TabsContent value="decode" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url-dec-in">URL-encoded input</Label>
            <Textarea
              id="url-dec-in"
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder="Paste a URL-encoded string to decode…"
              className="min-h-[140px] break-all font-mono text-xs"
            />
          </div>
          {decodeError && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {decodeError}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="url-dec-out">Decoded output</Label>
              <CopyButton value={decoded} />
            </div>
            <Textarea
              id="url-dec-out"
              readOnly
              value={decoded}
              placeholder="Decoded text will appear here…"
              className="min-h-[140px] font-mono text-sm"
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
