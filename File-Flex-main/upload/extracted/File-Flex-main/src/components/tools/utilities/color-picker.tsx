'use client'

import * as React from "react"
import { Copy, Image as ImageIcon, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface RGB {
  r: number
  g: number
  b: number
}

/** Parse a "#RRGGBB" hex string to RGB. Returns null on invalid input. */
function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const num = parseInt(h, 16)
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  }
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
        break
    }
    h *= 60
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
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
      <Copy className="size-3.5" /> {copied ? "Copied!" : label}
    </Button>
  )
}

function ColorValueRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <CopyButton value={value} />
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <code className="min-w-0 flex-1 break-all font-mono text-sm">{value}</code>
      </div>
    </div>
  )
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image."))
    img.src = url
  })
}

/**
 * Extract the 6 most common colors from an image. The image is drawn to a
 * small canvas (100×100) and pixels are quantized to the nearest 16 levels
 * per channel (4 bits), grouped, sorted by frequency, and the top 6 are
 * returned. Fully-transparent pixels are skipped.
 */
async function extractPalette(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const canvas = document.createElement("canvas")
    const targetSize = 100
    // Preserve aspect ratio while fitting into targetSize×targetSize.
    const scale = Math.min(targetSize / img.naturalWidth, targetSize / img.naturalHeight)
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) throw new Error("Could not get canvas context.")
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    const counts = new Map<string, number>()
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 128) continue // skip transparent
      // Quantize each channel to 16 levels (0, 17, 34, ..., 255).
      const r = Math.round(data[i] / 17) * 17
      const g = Math.round(data[i + 1] / 17) * 17
      const b = Math.round(data[i + 2] / 17) * 17
      const key = `${r},${g},${b}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    return sorted.slice(0, 6).map(([key]) => {
      const [r, g, b] = key.split(",").map(Number)
      return rgbToHex({ r, g, b })
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function ColorPicker() {
  const { toast } = useToast()
  const [hex, setHex] = React.useState("#1e40af")
  const [hexInput, setHexInput] = React.useState("#1e40af")
  const [palette, setPalette] = React.useState<string[]>([])
  const [busy, setBusy] = React.useState(false)

  // Sync the hex text input whenever the native picker changes.
  const onPickerChange = (value: string) => {
    setHex(value)
    setHexInput(value)
  }

  // Sync from the text input — only update the picker when valid.
  const onTextInput = (value: string) => {
    setHexInput(value)
    const rgb = hexToRgb(value)
    if (rgb) {
      setHex(rgbToHex(rgb))
    }
  }

  const rgb = React.useMemo<RGB | null>(() => hexToRgb(hex), [hex])
  const hsl = React.useMemo(() => (rgb ? rgbToHsl(rgb) : null), [rgb])

  const rgbString = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ""
  const hslString = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : ""

  const handleImage = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setBusy(true)
    setPalette([])
    try {
      const swatches = await extractPalette(file)
      if (swatches.length === 0) {
        toast({
          title: "No colors found",
          description: "Try a different image with more visible pixels.",
          variant: "destructive",
        })
      } else {
        setPalette(swatches)
        toast({ title: "Palette extracted", description: `${swatches.length} colors` })
      }
    } catch (e) {
      toast({
        title: "Could not extract palette",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-6">
        {/* Picker */}
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="cp-picker">Color</Label>
            <Input
              id="cp-picker"
              type="color"
              value={hex}
              onChange={(e) => onPickerChange(e.target.value)}
              className="h-24 w-full cursor-pointer p-1 sm:w-32"
              aria-label="Pick a color"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-hex">HEX</Label>
            <Input
              id="cp-hex"
              value={hexInput}
              onChange={(e) => onTextInput(e.target.value)}
              placeholder="#1e40af"
              className="font-mono"
            />
            <div
              className="h-3 w-full rounded-full border"
              style={{ backgroundColor: rgb ? rgbString : "transparent" }}
              aria-hidden
            />
          </div>
        </div>

        {/* Values */}
        <div className="grid gap-3 sm:grid-cols-3">
          <ColorValueRow label="HEX" value={hex.toUpperCase()} />
          <ColorValueRow label="RGB" value={rgbString} />
          <ColorValueRow label="HSL" value={hslString} />
        </div>

        {/* Palette extraction */}
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Palette className="size-4" /> Extract palette from image
          </p>
          <FileDropzone
            multiple={false}
            accept="image/*"
            onFiles={handleImage}
            label="Drop an image to extract its colors"
            hint="Downscaled to 100×100 px, quantized, top 6 colors shown."
            disabled={busy}
          />
          {busy && (
            <div className="flex justify-center py-2">
              <Spinner label="Extracting palette…" />
            </div>
          )}
          {palette.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Click a swatch to copy its HEX value.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {palette.map((swatch, i) => (
                  <Swatch key={`${swatch}-${i}`} hex={swatch} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function Swatch({ hex }: { hex: string }) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(hex)
          setCopied(true)
          toast({ title: `${hex} copied` })
          setTimeout(() => setCopied(false), 1200)
        } catch (e) {
          toast({
            title: "Copy failed",
            description: (e as Error).message,
            variant: "destructive",
          })
        }
      }}
      className={cn(
        "group flex items-center gap-2 overflow-hidden rounded-lg border bg-card text-left transition-colors hover:border-primary/50"
      )}
      aria-label={`Copy ${hex}`}
    >
      <span
        className="grid h-12 w-12 shrink-0 place-items-center"
        style={{ backgroundColor: hex }}
      >
        {copied && (
          <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white">
            Copied
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 pr-2">
        <span className="block truncate font-mono text-xs">{hex}</span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <ImageIcon className="size-3" /> Click to copy
        </span>
      </span>
    </button>
  )
}
