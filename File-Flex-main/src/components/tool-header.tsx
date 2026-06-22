"use client";

import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools";

/**
 * Shared tool header: breadcrumb + icon + H1 + intro + optional honesty note.
 * Used inside <ToolView /> so every tool page has consistent structure.
 */
export function ToolHeader({
  tool,
  note,
}: {
  tool: Tool;
  /** Override note; defaults to tool.note. */
  note?: string;
}) {
  const Icon = tool.icon;
  const honestyNote = note ?? tool.note;
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/tools" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{tool.name}</span>
      </nav>

      <div className="flex items-start gap-4">
        <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border/50", tool.accent)}>
          <Icon className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
          <p className="mt-1 text-muted-foreground">{tool.short}</p>
        </div>
      </div>

      {honestyNote && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200 dark:text-amber-200">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <p>{honestyNote}</p>
        </div>
      )}
    </div>
  );
}
