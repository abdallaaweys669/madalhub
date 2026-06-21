"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type FilterOption = { value: string; label: string };

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  statusLabel?: string;
  activity?: string;
  onActivityChange?: (value: string) => void;
  activityOptions?: FilterOption[];
  activityLabel?: string;
  actions?: React.ReactNode;
};

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  status,
  onStatusChange,
  statusOptions,
  statusLabel = "Status",
  activity,
  onActivityChange,
  activityOptions,
  activityLabel = "Activity",
  actions,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1 max-w-md">
          <Label htmlFor="list-search" className="sr-only">
            Search
          </Label>
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="list-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
        {statusOptions && onStatusChange && (
          <div className="w-full sm:w-44">
            <Label htmlFor="list-status" className="text-xs text-muted-foreground mb-1 block">
              {statusLabel}
            </Label>
            <select
              id="list-status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-foreground [color-scheme:light] dark:[color-scheme:dark]"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {activityOptions && onActivityChange && (
          <div className="w-full sm:w-44">
            <Label htmlFor="list-activity" className="text-xs text-muted-foreground mb-1 block">
              {activityLabel}
            </Label>
            <select
              id="list-activity"
              value={activity}
              onChange={(e) => onActivityChange(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-foreground [color-scheme:light] dark:[color-scheme:dark]"
            >
              {activityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {actions}
    </div>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ListPagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
      <span>{total.toLocaleString()} total</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
