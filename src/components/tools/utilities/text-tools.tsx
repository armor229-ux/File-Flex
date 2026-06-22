'use client'

import * as React from "react"
import { Copy, Download, Eraser, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob } from "@/lib/file-utils"

const LOREM_PARAGRAPHS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
]

interface Operation {
  label: string
  title: string
  fn: (input: string) => string
}

const OPERATIONS: Operation[] = [
  { label: "UPPERCASE", title: "Convert to uppercase", fn: (s) => s.toUpperCase() },
  { label: "lowercase", title: "Convert to lowercase", fn: (s) => s.toLowerCase() },
  {
    label: "Title Case",
    title: "Capitalize the first letter of every word",
    fn: (s) =>
      s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
  },
  {
    label: "Sentence case",
    title: "Capitalize the first letter of each sentence",
    fn: (s) =>
      s
        .replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (_, a, b) =>
          (a || b).toUpperCase()
        ),
  },
  {
    label: "SLUGIFY",
    title: "Make a URL-friendly slug",
    fn: (s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
  },
  {
    label: "Trim + collapse",
    title: "Trim and collapse whitespace",
    fn: (s) =>
      s
        .split("\n")
        .map((l) => l.replace(/[ \t]+/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
  },
  {
    label: "Reverse",
    title: "Reverse the entire text",
    fn: (s) => Array.from(s).reverse().join(""),
  },
  {
    label: "Dedupe lines",
    title: "Remove duplicate lines",
    fn: (s) => {
      const seen = new Set<string>()
      return s
        .split("\n")
        .filter((l) => {
          if (seen.has(l)) return false
          seen.add(l)
          return true
        })
        .join("\n")
    },
  },
  {
    label: "Sort A→Z",
    title: "Sort lines alphabetically",
    fn: (s) =>
      s
        .split("\n")
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n"),
  },
]

function computeStats(text: string) {
  const characters = text.length
  const noSpaces = text.replace(/\s/g, "").length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text === "" ? 0 : text.split("\n").length
  const sentenceMatches = text.match(/[^.!?]+[.!?]+/g)
  const sentences = sentenceMatches
    ? sentenceMatches.length
    : text.trim()
      ? 1
      : 0
  return { characters, noSpaces, words, lines, sentences }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-center">
      <div className="font-mono text-lg tabular-nums">{value.toLocaleString()}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

export default function TextTools() {
  const { toast } = useToast()
  const [text, setText] = React.useState("")
  const [loremCount, setLoremCount] = React.useState(3)
  const taRef = React.useRef<HTMLTextAreaElement>(null)

  const stats = React.useMemo(() => computeStats(text), [text])

  const apply = (op: Operation) => {
    const next = op.fn(text)
    setText(next)
    focusEnd(next)
  }

  const focusEnd = (value: string) => {
    requestAnimationFrame(() => {
      const el = taRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(value.length, value.length)
    })
  }

  const insertLorem = () => {
    const n = Math.max(1, Math.min(50, loremCount))
    const paragraphs = Array.from({ length: n }, (_, i) =>
      LOREM_PARAGRAPHS[i % LOREM_PARAGRAPHS.length]
    )
    const block = paragraphs.join("\n\n")
    const next = text ? `${text.replace(/\s+$/, "")}\n\n${block}` : block
    setText(next)
    focusEnd(next)
  }

  const copy = async () => {
    if (!text) {
      toast({ title: "Nothing to copy", variant: "destructive" })
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Copied to clipboard" })
    } catch (e) {
      toast({ title: "Copy failed", description: (e as Error).message, variant: "destructive" })
    }
  }

  const downloadTxt = () => {
    if (!text) {
      toast({ title: "Nothing to download", variant: "destructive" })
      return
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    downloadBlob(blob, "text.txt")
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="tt-input">Your text</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText("")
                  toast({ title: "Cleared" })
                }}
                disabled={!text}
              >
                <Eraser className="size-4" /> Clear
              </Button>
              <Button variant="outline" size="sm" onClick={copy} disabled={!text}>
                <Copy className="size-4" /> Copy
              </Button>
              <Button size="sm" onClick={downloadTxt} disabled={!text}>
                <Download className="size-4" /> .txt
              </Button>
            </div>
          </div>
          <Textarea
            id="tt-input"
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text here, then use the operations below…"
            className="min-h-[200px] font-mono text-sm leading-relaxed"
          />
        </div>

        {/* Operations */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Wand2 className="size-4" /> Operations
          </p>
          <div className="flex flex-wrap gap-2">
            {OPERATIONS.map((op) => (
              <Button
                key={op.label}
                variant="secondary"
                size="sm"
                title={op.title}
                onClick={() => apply(op)}
                disabled={!text}
              >
                {op.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Live stats</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Stat label="Characters" value={stats.characters} />
            <Stat label="No spaces" value={stats.noSpaces} />
            <Stat label="Words" value={stats.words} />
            <Stat label="Lines" value={stats.lines} />
            <Stat label="Sentences" value={stats.sentences} />
          </div>
        </div>

        {/* Lorem ipsum */}
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium">Lorem ipsum generator</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1.5 sm:max-w-[200px] sm:flex-1">
              <Label htmlFor="lorem-count">Paragraphs</Label>
              <Input
                id="lorem-count"
                type="number"
                min={1}
                max={50}
                value={loremCount}
                onChange={(e) => setLoremCount(Number(e.target.value))}
              />
            </div>
            <Button onClick={insertLorem} className="sm:mb-px">
              Insert
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
