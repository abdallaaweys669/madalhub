"use client";

import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  downloadReportPdf,
  printReport,
  type ReportDocumentPayload,
} from "@/lib/report-export";

type Props = {
  onExportCsv: () => void | Promise<void>;
  buildDocument: () => ReportDocumentPayload | null | Promise<ReportDocumentPayload | null>;
  csvDisabled?: boolean;
};

export function ReportExportButtons({ onExportCsv, buildDocument, csvDisabled }: Props) {
  async function handleCsv() {
    try {
      await onExportCsv();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  async function handlePrint() {
    try {
      const doc = await buildDocument();
      if (!doc) {
        toast.error("Nothing to print yet");
        return;
      }
      printReport(doc);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Print failed");
    }
  }

  async function handlePdf() {
    try {
      const doc = await buildDocument();
      if (!doc) {
        toast.error("Nothing to export yet");
        return;
      }
      await downloadReportPdf(doc);
      toast.success("PDF downloaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "PDF export failed");
    }
  }

  return (
    <div className="flex flex-wrap gap-2 lg:pb-0.5">
      <Button variant="outline" className="gap-1.5" disabled={csvDisabled} onClick={() => void handleCsv()}>
        <Download size={14} />
        CSV
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => void handlePdf()}>
        <FileText size={14} />
        PDF
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => void handlePrint()}>
        <Printer size={14} />
        Print
      </Button>
    </div>
  );
}
