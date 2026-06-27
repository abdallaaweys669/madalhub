"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrganizerRow } from "@/lib/api";
import {
  canApproveVerification,
  facebookUrl,
  instagramUrl,
  normalizeWebsiteUrl,
} from "@/lib/verification-proof";
import { ExternalLink, FileText, Globe, Link2 } from "lucide-react";

export function VerificationProofCell({
  org,
  onViewDocument,
}: {
  org: OrganizerRow;
  onViewDocument: () => void;
}) {
  if (org.proofType === "document" && org.document) {
    return (
      <div className="space-y-1">
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-0">
          Document
        </Badge>
        <p className="text-xs text-muted-foreground capitalize">{org.document.documentType}</p>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs text-primary gap-1"
          onClick={onViewDocument}
        >
          <FileText size={12} />
          View document
        </Button>
      </div>
    );
  }

  if (org.proofType === "online_presence") {
    return (
      <div className="space-y-1.5">
        <Badge variant="secondary" className="bg-sky-500/10 text-sky-700 border-0">
          Online links
        </Badge>
        <OnlineLinksList org={org} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Badge variant="destructive" className="border-0">
        No proof
      </Badge>
      <p className="text-xs text-muted-foreground">Missing document and online links</p>
    </div>
  );
}

export function OnlineLinksList({ org }: { org: OrganizerRow }) {
  const links = [
    org.profile.website
      ? { label: "Website", href: normalizeWebsiteUrl(org.profile.website) }
      : null,
    org.profile.facebook
      ? { label: "Facebook", href: facebookUrl(org.profile.facebook) }
      : null,
    org.profile.instagram
      ? { label: "Instagram", href: instagramUrl(org.profile.instagram) }
      : null,
  ].filter(Boolean) as { label: string; href: string }[];

  if (!links.length) {
    return <p className="text-xs text-muted-foreground">No links on file</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline max-w-full"
          title={link.href}
        >
          {link.label === "Website" ? <Globe size={12} /> : <Link2 size={12} />}
          <span className="truncate">{link.href.replace(/^https?:\/\//, "")}</span>
          <ExternalLink size={10} className="shrink-0 opacity-60" />
        </a>
      ))}
    </div>
  );
}

export function organizerCanApprove(org: OrganizerRow) {
  return canApproveVerification(org);
}
