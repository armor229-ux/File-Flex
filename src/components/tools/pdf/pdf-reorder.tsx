'use client'

import * as React from "react"
import { PDFDocument } from "pdf-lib"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowRightLeft, GripVertical } from "lucide-react"
import { FileDropzone } from "@/components/file-dropzone"
import { ResultPanel, type ResultFile } from "@/components/result-panel"
import { Spinner } from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

function SortablePage({ id, label }: { id: string; label: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex select-none items-center gap-2 rounded-lg border bg-card px-3 py-3 text-sm ${
        isDragging ? "opacity-70 ring-2 ring-primary" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label={`Drag page ${label} to reorder`}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-xs text-muted-foreground">Page</span>
      <span className="font-medium">{label}</span>
    </div>
  )
}

export default function PdfReorder() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [order, setOrder] = React.useState<number[]>([])
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ResultFile[] | null>(null)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const onFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Please select a PDF file", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const src = await PDFDocument.load(await f.arrayBuffer())
      const count = src.getPageCount()
      setFile(f)
      setPageCount(count)
      setOrder(Array.from({ length: count }, (_, i) => i + 1))
    } catch (e) {
      toast({
        title: "Something went wrong",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setOrder((prev) => {
      const oldIndex = prev.indexOf(Number(active.id))
      const newIndex = prev.indexOf(Number(over.id))
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const onResetOrder = () =>
    setOrder(Array.from({ length: pageCount }, (_, i) => i + 1))

  const onExport = async () => {
    if (!file) return
    setBusy(true)
    try {
      const src = await PDFDocument.load(await file.arrayBuffer())
      const out = await PDFDocument.create()
      const indices = order.map((n) => n - 1)
      const pages = await out.copyPages(src, indices)
      pages.forEach((p) => out.addPage(p))
      const bytes = await out.save()
      setResult([
        { name: "reordered.pdf", blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) },
      ])
      toast({ title: "Reordered PDF ready" })
    } catch (e) {
      toast({
        title: "Something went wrong",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setResult(null)
    setFile(null)
    setPageCount(0)
    setOrder([])
  }

  if (result) {
    return (
      <ResultPanel
        files={result}
        onReset={reset}
        message="Your reordered PDF is ready to download."
      />
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        {!file && (
          <FileDropzone
            accept="application/pdf"
            onFiles={onFiles}
            label="Drop a PDF here or click to browse"
            hint="Drag pages into any order, then export."
            disabled={busy}
          />
        )}

        {busy && <Spinner label="Loading PDF…" />}

        {file && pageCount > 0 && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pageCount} pages — drag the cards to reorder
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetOrder}
                  disabled={busy}
                >
                  Reset order
                </Button>
                <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                  Change file
                </Button>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={order.map(String)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {order.map((p) => (
                    <SortablePage key={p} id={String(p)} label={p} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex justify-end">
              <Button onClick={onExport} disabled={busy}>
                <ArrowRightLeft className="size-4" /> Apply order &amp; export
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
