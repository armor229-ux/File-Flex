'use client'

import * as React from "react"
import jsQR from "jsqr"
import { Camera, CameraOff, Copy, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileDropzone } from "@/components/file-dropzone"
import { Spinner } from "@/components/spinner"
import { useToast } from "@/hooks/use-toast"

/**
 * Decode a QR code from image bitmap data using jsQR.
 * Returns the decoded string or null if no QR code is found.
 */
function decodeFromImageData(imageData: ImageData): string | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  })
  return code?.data ?? null
}

function CopyButton({ value }: { value: string }) {
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
      <Copy className="size-4" /> {copied ? "Copied!" : "Copy"}
    </Button>
  )
}

function ResultBlock({ result }: { result: string }) {
  if (!result) return null
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="qr-result">Decoded text</Label>
        <CopyButton value={result} />
      </div>
      <Textarea
        id="qr-result"
        readOnly
        value={result}
        className="min-h-[120px] font-mono text-sm"
      />
    </div>
  )
}

function WebcamScanner() {
  const { toast } = useToast()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const runningRef = React.useRef(false)

  const [active, setActive] = React.useState(false)
  const [starting, setStarting] = React.useState(false)
  const [result, setResult] = React.useState("")

  const stop = React.useCallback(() => {
    runningRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setActive(false)
  }, [])

  const tick = React.useCallback(() => {
    if (!runningRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const w = video.videoWidth
      const h = video.videoHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h)
          try {
            const imageData = ctx.getImageData(0, 0, w, h)
            const decoded = decodeFromImageData(imageData)
            if (decoded) {
              setResult(decoded)
              toast({ title: "QR code detected" })
              stop()
              return
            }
          } catch {
            // getImageData can fail on cross-origin frames; safe to ignore here.
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stop, toast])

  const start = React.useCallback(async () => {
    if (active || starting) return
    setStarting(true)
    setResult("")
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.")
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((t) => t.stop())
        throw new Error("Video element not ready.")
      }
      video.srcObject = stream
      await video.play().catch(() => {
        // play() can reject if not allowed; the rAF loop still scans frames.
      })
      runningRef.current = true
      setActive(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch (e) {
      const err = e as Error
      const name = (err as DOMException)?.name
      let description = err.message
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        description = "Camera permission was denied. Please allow camera access and try again."
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        description = "No camera device was found on this machine."
      }
      toast({
        title: "Could not start camera",
        description,
        variant: "destructive",
      })
      stop()
    } finally {
      setStarting(false)
    }
  }, [active, starting, stop, tick, toast])

  // Cleanup on unmount.
  React.useEffect(() => {
    return () => {
      runningRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button onClick={start} disabled={starting}>
            <Camera className="size-4" /> {starting ? "Starting…" : "Start camera"}
          </Button>
        ) : (
          <Button variant="outline" onClick={stop}>
            <CameraOff className="size-4" /> Stop camera
          </Button>
        )}
        {starting && <Spinner label="Requesting camera…" />}
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="mx-auto block max-h-[420px] w-full object-contain"
        />
        <canvas ref={canvasRef} className="hidden" />
        {!active && (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <Camera className="size-8 opacity-40" />
            <span>Camera is off. Click “Start camera” to scan a QR code.</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Frames are processed locally in your browser — no video ever leaves your device.
      </p>

      <ResultBlock result={result} />
    </div>
  )
}

function UploadScanner() {
  const { toast } = useToast()
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState("")

  const handleFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setBusy(true)
    setResult("")
    try {
      const url = URL.createObjectURL(file)
      try {
        const img = await loadImage(url)
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) throw new Error("Could not get canvas context.")
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const decoded = decodeFromImageData(imageData)
        if (decoded) {
          setResult(decoded)
          toast({ title: "QR code decoded" })
        } else {
          toast({
            title: "No QR code found",
            description: "Try a clearer or higher-contrast image.",
            variant: "destructive",
          })
        }
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      toast({
        title: "Could not read image",
        description: (e as Error).message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        multiple={false}
        accept="image/*"
        onFiles={handleFiles}
        label="Drop a QR image here or click to browse"
        hint="PNG, JPG, GIF, WebP — decoded locally with jsQR."
        disabled={busy}
      />
      {busy && (
        <div className="flex justify-center py-2">
          <Spinner label="Scanning image…" />
        </div>
      )}
      <ResultBlock result={result} />
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

export default function QrReader() {
  const [tab, setTab] = React.useState("webcam")

  return (
    <Card className="p-5 sm:p-6">
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="webcam">
            <Camera className="size-4" /> Webcam
          </TabsTrigger>
          <TabsTrigger value="upload">
            <ImageIcon className="size-4" /> Upload image
          </TabsTrigger>
        </TabsList>

        {/* Radix Tabs unmounts inactive content by default, so leaving the
            Webcam tab triggers WebcamScanner's cleanup, which stops the
            camera stream and cancels the rAF loop. */}
        <TabsContent value="webcam">
          <WebcamScanner />
        </TabsContent>

        <TabsContent value="upload">
          <UploadScanner />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
