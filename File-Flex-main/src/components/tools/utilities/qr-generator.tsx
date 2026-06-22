'use client'

import * as React from "react"
import QRCode from "qrcode"
import { Download, ImageDown, FileCode2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob } from "@/lib/file-utils"
import { cn } from "@/lib/utils"

type Ecc = "L" | "M" | "Q" | "H"

const SIZE_OPTIONS = [128, 256, 512] as const

export default function QrGenerator() {
  const { toast } = useToast()
  const [text, setText] = React.useState("https://fileflex.app")
  const [size, setSize] = React.useState<number>(256)
  const [ecc, setEcc] = React.useState<Ecc>("M")
  const [fg, setFg] = React.useState("#000000")
  const [bg, setBg] = React.useState("#ffffff")

  const [dataUrl, setDataUrl] = React.useState("")
  const [svgString, setSvgString] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Debounced regeneration on any input change.
  React.useEffect(() => {
    const value = text.trim()
    if (!value) {
      setDataUrl("")
      setSvgString("")
      setLoading(false)
      return
    }
    setLoading(true)
    const handle = setTimeout(() => {
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: ecc,
        color: { dark: fg, light: bg },
      })
        .then((url) => setDataUrl(url))
        .then(() =>
          QRCode.toString(value, {
            type: "svg",
            margin: 2,
            errorCorrectionLevel: ecc,
            color: { dark: fg, light: bg },
          })
        )
        .then((svg) => setSvgString(svg))
        .catch((e: Error) => {
          toast({
            title: "Could not generate QR code",
            description: e.message,
            variant: "destructive",
          })
          setDataUrl("")
          setSvgString("")
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [text, size, ecc, fg, bg, toast])

  const downloadPng = async () => {
    if (!dataUrl) return
    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const safe = text.trim().slice(0, 40).replace(/[^a-z0-9-_]+/gi, "_") || "qr"
      downloadBlob(blob, `${safe || "qr"}.png`)
    } catch (e) {
      toast({ title: "Download failed", description: (e as Error).message, variant: "destructive" })
    }
  }

  const downloadSvg = () => {
    if (!svgString) return
    const safe = text.trim().slice(0, 40).replace(/[^a-z0-9-_]+/gi, "_") || "qr"
    const blob = new Blob([svgString], { type: "image/svg+xml" })
    downloadBlob(blob, `${safe || "qr"}.svg`)
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-text">Content (text or URL)</Label>
            <Textarea
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com"
              className="min-h-[96px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qr-size">Size</Label>
              <Select
                value={String(size)}
                onValueChange={(v) => setSize(Number(v))}
              >
                <SelectTrigger id="qr-size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} × {s} px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-ecc">Error correction</Label>
              <Select value={ecc} onValueChange={(v) => setEcc(v as Ecc)}>
                <SelectTrigger id="qr-ecc" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">L · 7%</SelectItem>
                  <SelectItem value="M">M · 15%</SelectItem>
                  <SelectItem value="Q">Q · 25%</SelectItem>
                  <SelectItem value="H">H · 30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qr-fg">Foreground</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="qr-fg"
                  type="color"
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                  className="h-9 w-14 cursor-pointer p-1"
                  aria-label="Foreground color"
                />
                <code className="font-mono text-sm text-muted-foreground">{fg}</code>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-bg">Background</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="qr-bg"
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-9 w-14 cursor-pointer p-1"
                  aria-label="Background color"
                />
                <code className="font-mono text-sm text-muted-foreground">{bg}</code>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={downloadPng} disabled={!dataUrl}>
              <ImageDown className="size-4" /> Download PNG
            </Button>
            <Button type="button" variant="outline" onClick={downloadSvg} disabled={!svgString}>
              <FileCode2 className="size-4" /> Download SVG
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col">
          <div
            className={cn(
              "relative flex flex-1 items-center justify-center rounded-xl border bg-muted/30 p-6",
              "min-h-[280px]"
            )}
          >
            {loading && !dataUrl ? (
              <Spinner label="Generating…" />
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt="QR code preview"
                className="max-h-[360px] w-auto rounded-md"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <Download className="size-8 opacity-40" />
                <span>Enter content to generate a QR code.</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Preview updates live as you type.
          </p>
        </div>
      </div>
    </Card>
  )
}
