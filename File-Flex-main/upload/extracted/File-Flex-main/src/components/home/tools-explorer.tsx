"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Input } from "@/components/ui/input";
import { tools, categoryOrder, type ToolCategory } from "@/lib/tools";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Filter = "All" | ToolCategory;

export function ToolsExplorer({ limit }: { limit?: number }) {
  const { t } = useI18n();
  const [filter, setFilter] = React.useState<Filter>("All");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tl) => {
      const matchesCat = filter === "All" || tl.category === filter;
      const matchesQuery =
        q === "" ||
        t(`tools.${tl.slug}.name`).toLowerCase().includes(q) ||
        t(`tools.${tl.slug}.desc`).toLowerCase().includes(q) ||
        tl.keywords.some((k) => k.includes(q));
      return matchesCat && matchesQuery;
    });
  }, [filter, query, t]);

  const list = limit ? filtered.slice(0, limit) : filtered;
  const tabs: Filter[] = ["All", ...categoryOrder];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === tab
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "All" ? t("home.allTools") : t(`categories.${tab}`)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.searchTools")}
            className="ps-9"
            aria-label={t("common.search")}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          {t("nav.noLanguagesMatch", { query }).replace("languages", "tools")}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((tl, i) => (
            <ToolCard key={tl.slug} tool={tl} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
