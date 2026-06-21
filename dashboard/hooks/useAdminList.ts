"use client";

import { useCallback, useEffect, useState } from "react";
import type { ListParams, Paginated } from "@/lib/list-query";

export function useAdminList<T>(
  fetcher: (params: ListParams) => Promise<Paginated<T>>,
  options?: { defaultStatus?: string; defaultActivity?: string; limit?: number },
) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(options?.defaultStatus ?? "all");
  const [activity, setActivity] = useState(options?.defaultActivity ?? "all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = options?.limit ?? 20;

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const reload = useCallback(async () => {
    try {
      const result = await fetcher({ search, status, activity, page, limit });
      setData(result);
      setError("");
    } catch (err: unknown) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load data.");
    }
  }, [fetcher, search, status, activity, page, limit]);

  useEffect(() => {
    let cancelled = false;
    fetcher({ search, status, activity, page, limit })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Failed to load data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, search, status, activity, page, limit]);

  function onSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
    setLoading(true);
  }

  function onStatusChange(value: string) {
    setStatus(value);
    setPage(1);
    setLoading(true);
  }

  function onActivityChange(value: string) {
    setActivity(value);
    setPage(1);
    setLoading(true);
  }

  function goToPage(next: number) {
    setPage(next);
    setLoading(true);
  }

  return {
    searchInput,
    onSearchChange,
    status,
    onStatusChange,
    activity,
    onActivityChange,
    setPage: goToPage,
    data,
    loading,
    error,
    reload,
    limit,
  };
}
