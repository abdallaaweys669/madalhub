"use client";

import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUploadPreviewKind, getUploadUrl } from "@/lib/upload-url";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  documentPath: string;
  documentType?: string;
};

export default function DocumentPreviewDialog({
  open,
  onClose,
  title,
  documentPath,
  documentType,
}: Props) {
  const url = getUploadUrl(documentPath);
  const kind = getUploadPreviewKind(documentPath);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="pr-8">{title}</DialogTitle>
          {documentType && (
            <p className="text-sm text-muted-foreground capitalize">{documentType} document</p>
          )}
        </DialogHeader>

        <div className="min-h-[240px] flex-1 overflow-auto rounded-lg border border-border bg-muted/30">
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={title} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
          )}
          {kind === "pdf" && (
            <iframe src={url} title={title} className="h-[70vh] w-full border-0 bg-background" />
          )}
          {kind === "other" && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
              <p>Preview is not available for this file type in the browser.</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 inline-flex")}
              >
                Open file <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 inline-flex")}
          >
            Open in new tab <ExternalLink size={14} />
          </a>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
