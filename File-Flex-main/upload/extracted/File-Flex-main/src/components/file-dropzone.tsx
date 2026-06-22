"use client";

import * as React from "react";
import { UploadCloud, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here or click to browse",
  hint,
  className,
  disabled,
  enablePaste = true,
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  /** Accept pasted files via the clipboard (Ctrl/Cmd+V) while focused. */
  enablePaste?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    onFiles(multiple ? files : [files[0]]);
  };

  // Paste support: when the dropzone (or anything inside) is focused, accept
  // pasted files from the clipboard.
  const onPaste = React.useCallback(
    (e: React.ClipboardEvent) => {
      if (!enablePaste || disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const f = items[i].getAsFile();
        if (f) pasted.push(f);
      }
      if (pasted.length > 0) {
        e.preventDefault();
        onFiles(multiple ? pasted : [pasted[0]]);
      }
    },
    [enablePaste, disabled, multiple, onFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onPaste={onPaste}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dragging && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        {dragging ? <FileUp className="size-6" /> : <UploadCloud className="size-6" />}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {enablePaste && (
          <p className="mt-1 text-xs text-muted-foreground/70">
            You can also paste a file with Ctrl/Cmd+V
          </p>
        )}
      </div>
    </div>
  );
}
