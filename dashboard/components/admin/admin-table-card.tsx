import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

/** Fixed-layout table that fits the content area — long text truncates instead of scrolling sideways. */
export function AdminTableCard({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 overflow-hidden py-0", className)}>
      <Table className="table-fixed w-full">{children}</Table>
      {footer}
    </Card>
  );
}

export function TruncateCell({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const label = title ?? (typeof children === "string" ? children : undefined);
  return (
    <TableCell className={cn("max-w-0 truncate", className)} title={label}>
      {children}
    </TableCell>
  );
}

export const ADMIN_TH = "whitespace-nowrap px-3";

export const ADMIN_ACTIONS_TH = `${ADMIN_TH} w-[12%] text-right`;

export function AdminActionsCell({ children }: { children: ReactNode }) {
  return (
    <TableCell className="text-right px-3">
      <div className="flex items-center justify-end gap-1.5">{children}</div>
    </TableCell>
  );
}

export function AdminManageButton({
  onClick,
  label = "Manage",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 px-2.5 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
