"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Tool } from "@/lib/tools";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const { t } = useI18n();
  const Icon = tool.icon;
  const name = t(`tools.${tool.slug}.name`);
  const desc = t(`tools.${tool.slug}.desc`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.25) }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/tools/${tool.slug}`} className="group block focus-visible:outline-none">
        <Card className="h-full gap-0 overflow-hidden p-0 transition-all hover:border-primary/40 hover:shadow-lg focus-within:border-primary/40">
          <div className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "grid size-10 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-inset ring-border/50",
                  tool.accent
                )}
              >
                <Icon className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" />
            </div>
            <h3 className="mt-4 min-h-[40px] text-base font-semibold leading-tight line-clamp-2">{name}</h3>
            <p className="mt-1 min-h-[36px] flex-1 text-sm text-muted-foreground line-clamp-2">{desc}</p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
