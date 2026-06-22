"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icons";

type CategoryIconPickerProps = {
  value: string | null;
  onChange: (icon: string | null) => void;
};

function matchesIconSearch(
  option: (typeof CATEGORY_ICON_OPTIONS)[number],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    option.label.toLowerCase().includes(q) ||
    option.ionicon.toLowerCase().includes(q)
  );
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(
    () => CATEGORY_ICON_OPTIONS.filter((option) => matchesIconSearch(option, search)),
    [search],
  );

  const showAuto = matchesIconSearch(
    { ionicon: "auto", label: "Auto", Icon: CATEGORY_ICON_OPTIONS[0].Icon },
    search,
  );

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons… e.g. music, travel, tech"
          className="pl-9"
        />
      </div>

      <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-lg border p-2 sm:grid-cols-5">
        {showAuto ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors",
              value === null
                ? "border-orange-400 bg-orange-50 text-orange-700"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted",
            )}
          >
            <span className="text-[10px] font-medium">Auto</span>
          </button>
        ) : null}

        {filteredOptions.map(({ ionicon, label, Icon }) => {
          const active = value === ionicon;
          return (
            <button
              key={ionicon}
              type="button"
              title={`${label} (${ionicon})`}
              onClick={() => onChange(ionicon)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors",
                active
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon size={18} />
              <span className="line-clamp-1 w-full text-center text-[10px] font-medium">{label}</span>
            </button>
          );
        })}

        {!showAuto && filteredOptions.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
            No icons match “{search.trim()}”. Try music, sports, or business.
          </p>
        ) : null}
      </div>
    </div>
  );
}
