"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTableCard, ADMIN_TH } from "@/components/admin/admin-table-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryIconPicker } from "@/components/admin/category-icon-picker";
import {
  getVerificationIconPreview,
  iconDbFromPicker,
  iconPickerValueFromDb,
} from "@/lib/verification-icons";
import { suggestCategoryIcon } from "@/lib/category-icons";
import type { VerificationCatalogRow } from "@/lib/api";

type CatalogApi = {
  list: () => Promise<{ items: VerificationCatalogRow[] }>;
  create: (body: {
    name: string;
    icon?: string | null;
    sortOrder?: number;
  }) => Promise<VerificationCatalogRow>;
  update: (
    id: number,
    body: {
      name?: string;
      icon?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) => Promise<VerificationCatalogRow>;
  remove: (id: number) => Promise<{ ok: boolean }>;
};

type Props = {
  api: CatalogApi;
  usageLabel: string;
  addLabel: string;
  emptyMessage: string;
  protectedSlugs?: string[];
};

export function VerificationCatalogTable({
  api,
  usageLabel,
  addLabel,
  emptyMessage,
  protectedSlugs = ["other"],
}: Props) {
  const [items, setItems] = useState<VerificationCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VerificationCatalogRow | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VerificationCatalogRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.list();
      setItems(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.list();
        if (!cancelled) setItems(data.items);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load items");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q),
    );
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setName("");
    setIcon(null);
    setSortOrder("");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(row: VerificationCatalogRow) {
    setEditing(row);
    setName(row.name);
    setIcon(iconPickerValueFromDb(row.icon));
    setSortOrder(String(row.sortOrder));
    setIsActive(row.isActive);
    setDialogOpen(true);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!editing && !icon) {
      const suggested = suggestCategoryIcon(value);
      if (suggested) setIcon(suggested);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    const parsedSort = sortOrder.trim() === "" ? undefined : Number(sortOrder);
    if (parsedSort !== undefined && (!Number.isFinite(parsedSort) || parsedSort < 0)) {
      toast.error("Sort order must be a non-negative number");
      return;
    }

    setSaving(true);
    try {
      const iconValue = iconDbFromPicker(icon);
      if (editing) {
        await api.update(editing.id, {
          name: trimmed,
          icon: iconValue,
          sortOrder: parsedSort,
          isActive,
        });
        toast.success("Updated");
      } else {
        await api.create({
          name: trimmed,
          icon: iconValue ?? undefined,
          sortOrder: parsedSort,
        });
        toast.success("Created");
      }
      setDialogOpen(false);
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function isProtected(row: VerificationCatalogRow) {
    return protectedSlugs.includes(row.slug);
  }

  function openDelete(row: VerificationCatalogRow) {
    if (isProtected(row)) {
      toast.error(`"${row.name}" is a system type and cannot be deleted`);
      return;
    }
    if (row.usageCount > 0) {
      toast.error(`Used by ${row.usageCount} ${usageLabel} — deactivate instead`);
      return;
    }
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.remove(deleteTarget.id);
      toast.success("Deleted");
      setDeleteTarget(null);
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="max-w-sm"
        />
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus size={14} />
          {addLabel}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      ) : null}

      <AdminTableCard title={`${filtered.length} item${filtered.length === 1 ? "" : "s"}`}>
        <TableHeader>
          <TableRow>
            <TableHead className={ADMIN_TH}>Icon</TableHead>
            <TableHead className={ADMIN_TH}>Name</TableHead>
            <TableHead className={ADMIN_TH}>Slug</TableHead>
            <TableHead className={ADMIN_TH}>Order</TableHead>
            <TableHead className={ADMIN_TH}>Status</TableHead>
            <TableHead className={ADMIN_TH}>In use</TableHead>
            <TableHead className={`${ADMIN_TH} text-right`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : null}

          {!loading && filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : null}

          {!loading
            ? filtered.map((row) => {
                const preview = getVerificationIconPreview(row.icon);
                const PreviewIcon = preview?.Icon;
                const protectedRow = isProtected(row);
                return (
                  <TableRow key={row.id} className={!row.isActive ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        {PreviewIcon ? <PreviewIcon size={18} /> : <span className="text-xs">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">{row.slug}</code>
                    </TableCell>
                    <TableCell>{row.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "secondary" : "outline"}>
                        {row.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.usageCount > 0 ? "secondary" : "outline"}>
                        {row.usageCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(row)}>
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive hover:text-destructive"
                          disabled={protectedRow || row.usageCount > 0}
                          onClick={() => openDelete(row)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            : null}
        </TableBody>
      </AdminTableCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="catalog-name">Name</Label>
                <Input
                  id="catalog-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label>Icon</Label>
                <CategoryIconPicker value={icon} onChange={setIcon} />
                <p className="text-xs text-muted-foreground">
                  Ionicons preview — saved with <code>-outline</code> for the mobile app.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="catalog-sort">Sort order</Label>
                <Input
                  id="catalog-sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="Leave blank for auto"
                  inputMode="numeric"
                />
              </div>

              {editing ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={protectedSlugs.includes(editing.slug)}
                  />
                  Show in mobile verification wizard
                </label>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm" showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.name}</span> will be
                  removed from the mobile app. This cannot be undone.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
