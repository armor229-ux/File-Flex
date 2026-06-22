'use client'

import * as React from "react"
import yaml from "js-yaml"
import { Braces, Copy, Download, RotateCcw } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob } from "@/lib/file-utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function YamlToJson() {
  const { toast } = useToast()
  const [mode, setMode] = React.useState<"upload" | "type">("upload")
  const [file, setFile] = React.useState<File | null>(null)
  const [typed, setTyped] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const onFiles = (incoming: File[]) => {
    setFile(incoming[0] ?? null)
    setResult(null)
  }

  const reset = () => {
    setFile(null)
    setTyped("")
    setResult(null)
  }

  const convert = async () => {
    let text: string
    if (mode === "upload") {
      if (!file) {
        toast({
          title: "No file selected",
          description: "Please upload a .yaml file first.",
        })
        return
      }
      try {
        text = await file.text()
      } catch (e) {
        toast({
          title: "Could not read file",
          description: (e as Error).message,
          variant: "destructive",
        })
        return
      }
    } else {
      text = typed
    }

    if (!text.trim()) {
      toast({
        title: "Nothing to convert",
        description: "Please enter or upload some YAML first.",
      })
      return
    }

    setBusy(true)
    setResult(null)
    try {
      const data: unknown = yaml.load(text)
      const json = JSON.stringify(data, null, 2)
      setResult(json)
      toast({ title: "Converted", description: "YAML → JSON" })
    } catch (e) {
      toast({
        title: "Conversion failed",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (result === null) {
      toast({ title: "Nothing to copy", variant: "destructive" })
      return
    }
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast({ title: "JSON copied to clipboard" })
      setTimeout(() => setCopied(false), 1200)
    } catch (e) {
      toast({
        title: "Copy failed",
        description: (e as Error).message,
        variant: "destructive",
      })
    }
  }

  const download = () => {
    if (result === null) {
      toast({ title: "Nothing to download", variant: "destructive" })
      return
    }
    const blob = new Blob([result], { type: "application/json;charset=utf-8" })
    downloadBlob(blob, "data.json")
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "upload" | "type")}
        >
          <TabsList>
            <TabsTrigger value="upload">Upload .yaml</TabsTrigger>
            <TabsTrigger value="type">Type YAML</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <FileDropzone
              accept=".yaml,.yml,application/x-yaml,text/yaml"
              onFiles={onFiles}
              label="Drop a .yaml file"
              hint="YAML — parsed entirely in your browser"
              disabled={busy}
            />
            {file && (
              <p className="mt-2 text-xs text-muted-foreground">
                Loaded: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </TabsContent>
          <TabsContent value="type" className="mt-4">
            <Label htmlFor="yaml-input" className="sr-only">
              YAML to convert
            </Label>
            <Textarea
              id="yaml-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={"name: FileFlex\nversion: 1\nauthors:\n  - Ada\n  - Grace"}
              className="min-h-[240px] font-mono text-sm"
              disabled={busy}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {typed.length.toLocaleString()} characters
            </p>
          </TabsContent>
        </Tabs>

        {result === null && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={convert} disabled={busy}>
              <Braces className="size-4" /> Convert
            </Button>
            {busy && <Spinner label="Converting…" />}
            {(file || typed) && (
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Clear
              </Button>
            )}
          </div>
        )}

        {result !== null && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="json-out" className="text-sm font-medium">
                JSON output
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={copy}>
                  <Copy className="size-4" /> {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={download}>
                  <Download className="size-4" /> Download .json
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="size-4" /> Start over
                </Button>
              </div>
            </div>
            <Textarea
              id="json-out"
              readOnly
              value={result}
              className="min-h-[280px] font-mono text-xs"
            />
          </div>
        )}
      </div>
    </Card>
  )
}
