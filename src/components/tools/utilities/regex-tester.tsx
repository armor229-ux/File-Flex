'use client'

import * as React from "react"
import { AlertTriangle, Regex as RegexIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface MatchInfo {
  /** Index in the source string where the match starts. */
  index: number
  /** The full matched substring. */
  match: string
  /** Capture groups (element 0 is the full match; indices 1+ are groups). */
  groups: string[]
  /** Named capture groups (empty object if none). */
  named: Record<string, string>
}

interface RegexResult {
  matches: MatchInfo[]
  error: string | null
}

/**
 * Run a regex against the test text. Returns all matches with their indices
 * and capture groups. If the regex is invalid, returns an error string.
 *
 * If the global flag is set, all matches are returned. Otherwise only the
 * first match is returned (matching the default RegExp.exec behavior).
 */
function runRegex(
  pattern: string,
  flags: string,
  text: string
): RegexResult {
  if (!pattern) return { matches: [], error: null }
  let re: RegExp
  try {
    re = new RegExp(pattern, flags)
  } catch (e) {
    return { matches: [], error: (e as Error).message }
  }
  const matches: MatchInfo[] = []

  if (re.global) {
    // Guard against zero-length-match infinite loops.
    let lastIndex = -1
    let iterations = 0
    const maxIterations = 100000
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const index = m.index
      // Zero-length match: advance by one to avoid an infinite loop.
      if (m[0] === "" && index === lastIndex) {
        re.lastIndex++
        continue
      }
      lastIndex = index
      matches.push({
        index,
        match: m[0],
        groups: Array.from(m.slice(1)),
        named: (m.groups ?? {}) as Record<string, string>,
      })
      if (m[0] === "") re.lastIndex++
      if (++iterations >= maxIterations) {
        return {
          matches,
          error: "Stopped after 100,000 matches — refine your pattern.",
        }
      }
    }
  } else {
    const m = re.exec(text)
    if (m) {
      matches.push({
        index: m.index,
        match: m[0],
        groups: Array.from(m.slice(1)),
        named: (m.groups ?? {}) as Record<string, string>,
      })
    }
  }

  return { matches, error: null }
}

/**
 * Split the test text into segments — non-matching text and matched text — so
 * matches can be highlighted with <mark>. Uses the match indices to slice.
 */
function buildHighlightedSegments(
  text: string,
  matches: MatchInfo[]
): Array<{ text: string; isMatch: boolean; key: string }> {
  if (matches.length === 0) {
    return text ? [{ text, isMatch: false, key: "0" }] : []
  }
  const segments: Array<{ text: string; isMatch: boolean; key: string }> = []
  let cursor = 0
  let key = 0
  for (const m of matches) {
    if (m.index > cursor) {
      segments.push({
        text: text.slice(cursor, m.index),
        isMatch: false,
        key: String(key++),
      })
    }
    segments.push({
      text: m.match,
      isMatch: true,
      key: String(key++),
    })
    cursor = m.index + m.match.length
    // For zero-length matches, force advance to avoid duplicate adjacent segments.
    if (m.match === "") {
      if (cursor < text.length) {
        segments.push({
          text: text.slice(cursor, cursor + 1),
          isMatch: false,
          key: String(key++),
        })
        cursor++
      }
    }
  }
  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isMatch: false,
      key: String(key++),
    })
  }
  return segments
}

export default function RegexTester() {
  const [pattern, setPattern] = React.useState("\\b(\\w+)@(\\w+)\\.(\\w+)\\b")
  const [flags, setFlags] = React.useState("g")
  const [text, setText] = React.useState(
    "Contact me at alice@example.com or bob@test.io.\nYou can also reach admin@fileflex.app."
  )

  const result = React.useMemo(
    () => runRegex(pattern, flags, text),
    [pattern, flags, text]
  )

  const segments = React.useMemo(
    () => buildHighlightedSegments(text, result.matches),
    [text, result.matches]
  )

  const hasGroups = result.matches.some(
    (m) => m.groups.length > 0 || Object.keys(m.named).length > 0
  )

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-5">
        {/* Inputs */}
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <div className="space-y-1.5">
            <Label htmlFor="rx-pattern">Pattern</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
                /
              </span>
              <Input
                id="rx-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="\\d+"
                spellCheck={false}
                autoComplete="off"
                className="pl-7 pr-6 font-mono"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
                /
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rx-flags">Flags</Label>
            <Input
              id="rx-flags"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="g"
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rx-text">Test text</Label>
          <Textarea
            id="rx-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text to test against…"
            className="min-h-[160px] font-mono text-sm leading-relaxed"
          />
        </div>

        {/* Error or summary */}
        {result.error ? (
          <p className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span className="break-all">{result.error}</span>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <RegexIcon className="size-3.5" />
            <span>
              <span className="font-mono text-base font-semibold text-foreground">
                {result.matches.length}
              </span>{" "}
              match{result.matches.length === 1 ? "" : "s"} found
              {hasGroups && " · capture groups detected"}
            </span>
          </div>
        )}

        {/* Highlighted text */}
        <div className="space-y-1.5">
          <Label>Highlighted matches</Label>
          <pre
            aria-label="Test text with matches highlighted"
            className="max-h-[260px] min-h-[120px] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 font-mono text-sm leading-relaxed scrollbar-thin"
          >
            {segments.length === 0 ? (
              <span className="text-muted-foreground">
                Matches will appear here…
              </span>
            ) : (
              segments.map((seg) =>
                seg.isMatch ? (
                  <mark
                    key={seg.key}
                    className="rounded bg-primary/30 px-0.5 text-foreground ring-1 ring-primary/40"
                  >
                    {seg.text === "" ? "\u200B" : seg.text}
                  </mark>
                ) : (
                  <React.Fragment key={seg.key}>{seg.text}</React.Fragment>
                )
              )
            )}
          </pre>
        </div>

        {/* Match list */}
        {result.matches.length > 0 && !result.error && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Matches</p>
            <ul className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
              {result.matches.map((m, i) => (
                <li
                  key={i}
                  className="rounded-lg border bg-card px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      @ {m.index}
                    </span>
                    <code className="min-w-0 flex-1 break-all rounded bg-primary/10 px-1.5 py-0.5 font-mono text-foreground">
                      {m.match === "" ? "∅ (zero-width)" : m.match}
                    </code>
                  </div>
                  {(m.groups.length > 0 || Object.keys(m.named).length > 0) && (
                    <div className="mt-2 space-y-1">
                      {m.groups.map((g, gi) => (
                        <div
                          key={gi}
                          className="flex items-baseline gap-2 font-mono text-[11px]"
                        >
                          <span className="text-muted-foreground">
                            {`$${gi + 1}`}
                            {(() => {
                              const namedName = Object.entries(m.named).find(
                                ([, v]) => v === g
                              )?.[0]
                              return namedName ? (
                                <span className="ml-1 text-primary">
                                  {`(${namedName})`}
                                </span>
                              ) : null
                            })()}
                          </span>
                          <code className="min-w-0 flex-1 break-all text-foreground">
                            {g === "" ? "∅" : g}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick reference */}
        <details className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            Quick reference
          </summary>
          <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            <div><dt className="inline font-mono">.</dt><dd className="ml-2 inline">any char (except newline)</dd></div>
            <div><dt className="inline font-mono">\d \w \s</dt><dd className="ml-2 inline">digit / word / whitespace</dd></div>
            <div><dt className="inline font-mono">\D \W \S</dt><dd className="ml-2 inline">negated versions</dd></div>
            <div><dt className="inline font-mono">[abc]</dt><dd className="ml-2 inline">character class</dd></div>
            <div><dt className="inline font-mono">^ $</dt><dd className="ml-2 inline">start / end of line</dd></div>
            <div><dt className="inline font-mono">(x)</dt><dd className="ml-2 inline">capture group</dd></div>
            <div><dt className="inline font-mono">(?:x)</dt><dd className="ml-2 inline">non-capturing group</dd></div>
            <div><dt className="inline font-mono">(?&lt;name&gt;x)</dt><dd className="ml-2 inline">named group</dd></div>
            <div><dt className="inline font-mono">x* x+ x?</dt><dd className="ml-2 inline">quantifiers</dd></div>
            <div><dt className="inline font-mono">{`x{n}`}</dt><dd className="ml-2 inline">exactly n</dd></div>
            <div><dt className="inline font-mono">g</dt><dd className="ml-2 inline">global (all matches)</dd></div>
            <div><dt className="inline font-mono">i m s u</dt><dd className="ml-2 inline">case-insensitive / multiline / dotall / unicode</dd></div>
          </dl>
        </details>
      </div>
    </Card>
  )
}
