export type ReportDocumentPayload = {
  filename: string;
  title: string;
  filterLines: string[];
  kpis: { label: string; value: string | number }[];
  breakdown?: { label: string; value: number }[];
  columns: string[];
  rows: string[][];
  footnote?: string;
};

export function downloadReportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    throw new Error("No rows to export");
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildReportHtml(payload: ReportDocumentPayload) {
  const generated = new Date().toLocaleString();
  const kpiHtml = payload.kpis
    .map(
      (k) =>
        `<div style="flex:1;min-width:120px;padding:12px;border:1px solid #eee;border-radius:8px"><div style="font-size:11px;color:#666">${k.label}</div><div style="font-size:22px;font-weight:700;margin-top:4px">${k.value}</div></div>`,
    )
    .join("");
  const breakdownHtml = (payload.breakdown ?? [])
    .map(
      (b) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${b.label}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${b.value}</td></tr>`,
    )
    .join("");
  const headHtml = payload.columns.map((c) => `<th style="text-align:left;padding:8px;border-bottom:2px solid #FF7B3F">${c}</th>`).join("");
  const bodyHtml = payload.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:12px">${cell}</td>`).join("")}</tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${payload.title}</title>
<style>@page{margin:16mm}body{font-family:system-ui,sans-serif;color:#111;padding:24px}h1{font-size:22px;margin:0 0 4px} .meta{color:#666;font-size:12px;margin-bottom:16px} .filters{font-size:12px;color:#444;margin-bottom:16px} .kpis{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0} table{border-collapse:collapse;width:100%;margin-top:12px} .section{margin-top:20px} .footnote{font-size:11px;color:#888;margin-top:12px}</style></head><body>
<h1>${payload.title}</h1>
<div class="meta">MadalHub Admin · Generated ${generated}</div>
<div class="filters">${payload.filterLines.map((l) => `<div>${l}</div>`).join("")}</div>
<div class="kpis">${kpiHtml}</div>
${breakdownHtml ? `<div class="section"><h2 style="font-size:14px;margin-bottom:8px">Breakdown</h2><table style="max-width:360px">${breakdownHtml}</table></div>` : ""}
<div class="section"><h2 style="font-size:14px;margin-bottom:8px">Directory</h2>
<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>
${payload.footnote ? `<p class="footnote">${payload.footnote}</p>` : ""}
</div></body></html>`;
}

export function printReport(payload: ReportDocumentPayload) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not open print view.");
  }

  doc.open();
  doc.write(buildReportHtml(payload));
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
}

export async function downloadReportPdf(payload: ReportDocumentPayload) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 40;

  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(payload.title, 40, y);
  y += 18;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`MadalHub Admin · ${new Date().toLocaleString()}`, 40, y);
  y += 14;

  payload.filterLines.forEach((line) => {
    doc.text(line, 40, y);
    y += 12;
  });
  y += 8;

  const kpiText = payload.kpis.map((k) => `${k.label}: ${k.value}`).join("   ·   ");
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  const wrapped = doc.splitTextToSize(kpiText, pageW - 80);
  doc.text(wrapped, 40, y);
  y += wrapped.length * 12 + 10;

  if (payload.breakdown?.length) {
    autoTable(doc, {
      startY: y,
      head: [["Breakdown", "Count"]],
      body: payload.breakdown.map((b) => [b.label, String(b.value)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [255, 123, 63] },
      margin: { left: 40, right: 40 },
      tableWidth: 220,
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
  }

  autoTable(doc, {
    startY: y,
    head: [payload.columns],
    body: payload.rows,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [255, 123, 63] },
    margin: { left: 40, right: 40 },
  });

  if (payload.footnote) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(payload.footnote, 40, finalY);
  }

  doc.save(`${payload.filename}.pdf`);
}
