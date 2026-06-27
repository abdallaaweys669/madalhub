"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PageTabs } from "@/components/admin/page-tabs";
import { VerificationCatalogTable } from "@/components/admin/verification-catalog-table";
import {
  createOrganizerType,
  createVerificationDocumentType,
  deleteOrganizerType,
  deleteVerificationDocumentType,
  listOrganizerTypes,
  listVerificationDocumentTypes,
  updateOrganizerType,
  updateVerificationDocumentType,
} from "@/lib/api";

const TABS = [
  { id: "organizer-types", label: "Organization types" },
  { id: "proof-types", label: "Proof document types" },
] as const;

export default function VerificationTypesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("organizer-types");

  const organizerApi = useMemo(
    () => ({
      list: listOrganizerTypes,
      create: createOrganizerType,
      update: updateOrganizerType,
      remove: deleteOrganizerType,
    }),
    [],
  );

  const proofApi = useMemo(
    () => ({
      list: listVerificationDocumentTypes,
      create: createVerificationDocumentType,
      update: updateVerificationDocumentType,
      remove: deleteVerificationDocumentType,
    }),
    [],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Verification types"
        description="Manage organization types and proof document options shown in the organizer verification wizard on mobile."
      />

      <PageTabs tabs={[...TABS]} active={tab} onChange={(id) => setTab(id as (typeof TABS)[number]["id"])} />

      {tab === "organizer-types" ? (
        <VerificationCatalogTable
          api={organizerApi}
          usageLabel="organizers"
          addLabel="Add organization type"
          emptyMessage="No organization types yet."
        />
      ) : (
        <VerificationCatalogTable
          api={proofApi}
          usageLabel="uploads"
          addLabel="Add proof type"
          emptyMessage="No proof document types yet."
        />
      )}
    </div>
  );
}
