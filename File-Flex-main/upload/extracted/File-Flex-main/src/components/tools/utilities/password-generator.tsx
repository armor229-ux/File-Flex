'use client'

import * as React from "react"
import { Copy, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const LOWER = "abcdefghijklmnopqrstuvwxyz"
const NUMS = "0123456789"
const SYMS = "!@#$%^&*()-_=+[]{};:,.<>?/"
const SIMILAR = new Set("il1IO0o".split(""))

interface Options {
  length: number
  upper: boolean
  lower: boolean
  numbers: boolean
  symbols: boolean
  excludeSimilar: boolean
}

function buildCharset(opts: Options): string {
  let s = ""
  if (opts.upper) s += UPPER
  if (opts.lower) s += LOWER
  if (opts.numbers) s += NUMS
  if (opts.symbols) s += SYMS
  if (opts.excludeSimilar) {
    s = s
      .split("")
      .filter((c) => !SIMILAR.has(c))
      .join("")
  }
  return s
}

/** Uniform random integer in [0, max) using crypto.getRandomValues with rejection sampling. */
function secureRandomInt(max: number): number {
  if (max <= 0) return 0
  const limit = Math.floor(0xffffffff / max) * max
  const buf = new Uint32Array(1)
  let r = 0
  do {
    crypto.getRandomValues(buf)
    r = buf[0]
  } while (r >= limit)
  return r % max
}

function generatePassword(opts: Options): string {
  const charset = buildCharset(opts)
  if (charset.length === 0) return ""
  const out: string[] = []
  for (let i = 0; i < opts.length; i++) {
    out.push(charset[secureRandomInt(charset.length)])
  }
  return out.join("")
}

interface Strength {
  score: number
  label: string
  bar: string
}

function computeStrength(pw: string, opts: Options): Strength {
  if (!pw) return { score: 0, label: "—", bar: "bg-muted-foreground/30" }
  const charsets =
    (opts.upper ? 1 : 0) +
    (opts.lower ? 1 : 0) +
    (opts.numbers ? 1 : 0) +
    (opts.symbols ? 1 : 0)
  const raw = pw.length * Math.max(1, charsets)
  // Calibrate so a 20-char password with 4 charsets scores 100 (Strong).
  const score = Math.min(100, Math.round((raw / 80) * 100))
  if (score >= 80) return { score, label: "Strong", bar: "bg-emerald-500" }
  if (score >= 55) return { score, label: "Good", bar: "bg-blue-500" }
  if (score >= 35) return { score, label: "Fair", bar: "bg-yellow-500" }
  return { score, label: "Weak", bar: "bg-red-500" }
}

function CopyButton({ value, label = "Copy", size = "sm" }: { value: string; label?: string; size?: "sm" | "default" }) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={!value}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          toast({ title: "Copied to clipboard" })
          setTimeout(() => setCopied(false), 1200)
        } catch (e) {
          toast({ title: "Copy failed", description: (e as Error).message, variant: "destructive" })
        }
      }}
    >
      <Copy className="size-4" /> {copied ? "Copied!" : label}
    </Button>
  )
}

interface ToggleRowProps {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}

function ToggleRow({ id, label, hint, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-3 py-2.5">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function PasswordGenerator() {
  const [opts, setOpts] = React.useState<Options>({
    length: 20,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  })
  const [password, setPassword] = React.useState("")
  const [history, setHistory] = React.useState<string[]>([])

  const regenerate = React.useCallback(() => {
    const pw = generatePassword(opts)
    setPassword(pw)
    if (pw) {
      setHistory((h) => [pw, ...h.filter((x) => x !== pw)].slice(0, 5))
    }
  }, [opts])

  // Auto-generate on mount and whenever the toggle options change.
  // Length changes intentionally require pressing "Generate".
  React.useEffect(() => {
    regenerate()
  }, [
    opts.upper,
    opts.lower,
    opts.numbers,
    opts.symbols,
    opts.excludeSimilar,
  ])

  const strength = computeStrength(password, opts)
  const noCharset =
    !opts.upper && !opts.lower && !opts.numbers && !opts.symbols

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-6">
        {/* Output */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="pw-output" className="text-base">
              Generated password
            </Label>
            <div className="flex items-center gap-2">
              <CopyButton value={password} />
              <Button type="button" size="sm" onClick={regenerate} disabled={noCharset}>
                <RefreshCw className="size-4" /> Generate
              </Button>
            </div>
          </div>
          <div className="relative">
            <input
              id="pw-output"
              readOnly
              value={password}
              placeholder="Click Generate…"
              aria-label="Generated password"
              className="w-full rounded-lg border bg-muted/40 px-4 py-4 font-mono text-lg tracking-wide break-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {/* Strength meter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Strength
              </span>
              <span
                className={cn(
                  "font-medium",
                  strength.label === "Strong" && "text-emerald-500",
                  strength.label === "Good" && "text-blue-500",
                  strength.label === "Fair" && "text-yellow-500",
                  strength.label === "Weak" && "text-red-500"
                )}
              >
                {strength.label} · {strength.score}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full transition-all", strength.bar)}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
          {noCharset && (
            <p className="text-xs text-destructive">
              Enable at least one character set to generate a password.
            </p>
          )}
        </div>

        {/* Length */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw-length">Length</Label>
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm tabular-nums">
              {opts.length}
            </span>
          </div>
          <Slider
            id="pw-length"
            min={6}
            max={64}
            step={1}
            value={[opts.length]}
            onValueChange={(v) => setOpts((o) => ({ ...o, length: v[0] ?? o.length }))}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>6</span>
            <span>64</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Character sets</p>
          <ToggleRow
            id="opt-upper"
            label="Uppercase (A–Z)"
            hint="ABCD…"
            checked={opts.upper}
            onCheckedChange={(v) => setOpts((o) => ({ ...o, upper: v }))}
          />
          <ToggleRow
            id="opt-lower"
            label="Lowercase (a–z)"
            hint="abcd…"
            checked={opts.lower}
            onCheckedChange={(v) => setOpts((o) => ({ ...o, lower: v }))}
          />
          <ToggleRow
            id="opt-numbers"
            label="Numbers (0–9)"
            hint="0123…"
            checked={opts.numbers}
            onCheckedChange={(v) => setOpts((o) => ({ ...o, numbers: v }))}
          />
          <ToggleRow
            id="opt-symbols"
            label="Symbols (!@#$…)"
            hint="!@#$%^&*"
            checked={opts.symbols}
            onCheckedChange={(v) => setOpts((o) => ({ ...o, symbols: v }))}
          />
          <ToggleRow
            id="opt-similar"
            label="Exclude similar characters"
            hint="Skip i, l, 1, I, O, 0, o"
            checked={opts.excludeSimilar}
            onCheckedChange={(v) => setOpts((o) => ({ ...o, excludeSimilar: v }))}
          />
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent passwords</p>
            <ul className="space-y-1.5">
              {history.map((h, i) => (
                <li
                  key={`${h}-${i}`}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                >
                  <code className="min-w-0 flex-1 truncate font-mono text-sm">{h}</code>
                  <CopyButton value={h} label="" size="sm" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}
