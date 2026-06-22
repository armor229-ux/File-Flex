"use client";

import * as React from "react";
import { Download, FileDown, RotateCcw, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBytes } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

export interface ResultFile {
  name: string;
  blob: Blob;
  url?: string;
}

export function ResultPanel({
  files,
  onReset,
  message,
  className,
}: {
  files: ResultFile[];
  onReset?: () => void;
  message?: string;
  className?: string;
}) {
  if (files.length === 0 && !message) return null;
  return (
    <Card className={cn("gap-0 p-0", className)}>
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4 text-emerald-500" />
          {files.length > 1 ? `${files.length} files ready` : "Result ready"}
        </div>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="size-4" /> Start over
          </Button>
        )}
      </div>
      {message && (
        <p className="px-5 pt-4 text-sm text-muted-foreground">{message}</p>
      )}
      <div className="max-h-80 overflow-y-auto p-3 scrollbar-thin">
        <ul className="flex flex-col gap-2">
          {files.map((f, i) => (
            <ResultRow key={i} file={f} />
          ))}
        </ul>
      </div>
    </Card>
  );
}

function ResultRow({ file }: { file: ResultFile }) {
  const Icon = FileDown;
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(file.blob.size)}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          const a = document.createElement("a");
          const url = file.url ?? URL.createObjectURL(file.blob);
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          if (!file.url) setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        <Download className="size-4" /> Download
      </Button>
    </li>
  );
}

export function FileChip({
  name,
  size,
  onRemove,
}: {
  name: string;
  size?: number;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm">
      <span className="truncate">{name}</span>
      {size !== undefined && (
        <span className="text-xs text-muted-foreground">{formatBytes(size)}</span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="ml-1 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
