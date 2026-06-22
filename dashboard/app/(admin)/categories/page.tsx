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
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createInterest,
  deleteInterest,
  listInterests,
  updateInterest,
  type InterestRow,
} from "@/lib/api";
import { CategoryIconPicker } from "@/components/admin/category-icon-picker";
import { getCategoryIconPreview, suggestCategoryIcon } from "@/lib/category-icons";

export default function CategoriesPage() {
  const [items, setItems] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InterestRow | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InterestRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInterests();
      setItems(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const data = await listInterests();
        if (!cancelled) setItems(data.items);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load categories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setName("");
    setIcon(null);
    setDialogOpen(true);
  }

  function openEdit(row: InterestRow) {
    setEditing(row);
    setName(row.name);
    setIcon(row.icon);
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
      toast.error("Category name must be at least 2 characters");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateInterest(editing.id, { name: trimmed, icon });
        toast.success("Category updated");
      } else {
        await createInterest({ name: trimmed, icon: icon ?? undefined });
        toast.success("Category created");
      }
      setDialogOpen(false);
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function openDelete(row: InterestRow) {
    if (row.eventCount > 0) {
      toast.error(`Used by ${row.eventCount} event(s) — cannot delete`);
      return;
    }
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteInterest(deleteTarget.id);
      toast.success("Category deleted");
      setDeleteTarget(null);
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Event categories"
        description="Manage interest categories and icons shown in the mobile app (Explore tabs, onboarding chips, create event)."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus size={14} />
            Add category
          </Button>
        }
      />

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search categories…"
        className="max-w-sm"
      />

      {error ? (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          Could not load categories: {error}. Is the backend running?
        </p>
      ) : null}

      <AdminTableCard title={`${filtered.length} categor${filtered.length === 1 ? "y" : "ies"}`}>
        <TableHeader>
          <TableRow>
            <TableHead className={ADMIN_TH}>Icon</TableHead>
            <TableHead className={ADMIN_TH}>Name</TableHead>
            <TableHead className={ADMIN_TH}>Events</TableHead>
            <TableHead className={`${ADMIN_TH} text-right`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : null}

          {!loading && filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                No categories yet. Add your first one to power Explore and event creation.
              </TableCell>
            </TableRow>
          ) : null}

          {!loading
            ? filtered.map((row) => {
                const preview = getCategoryIconPreview(row.icon);
                const PreviewIcon = preview?.Icon;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        {PreviewIcon ? <PreviewIcon size={18} /> : <span className="text-xs">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant={row.eventCount > 0 ? "secondary" : "outline"}>{row.eventCount}</Badge>
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
                          disabled={row.eventCount > 0}
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
              <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Technology, Music, Sports"
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label>Icon</Label>
                <CategoryIconPicker value={icon} onChange={setIcon} />
                <p className="text-xs text-muted-foreground">
                  Same icon family as the mobile Explore tabs (Ionicons). Pick one for consistent chips everywhere.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm" showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.name}</span> will be removed from
                  Explore tabs, onboarding chips, and the create-event picker. This cannot be undone.
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
              {deleting ? "Deleting…" : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
