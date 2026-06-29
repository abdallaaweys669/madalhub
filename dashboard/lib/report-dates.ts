export function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function defaultDateRange() {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth() - 5, 1);
  return { from: formatDateInput(from), to: formatDateInput(to) };
}

export const DATE_PRESETS = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "6mo", months: 6 },
  { label: "YTD", ytd: true },
] as const;

export function rangeFromPreset(preset: (typeof DATE_PRESETS)[number]) {
  const end = new Date();
  let start: Date;
  if ("ytd" in preset) {
    start = new Date(end.getFullYear(), 0, 1);
  } else if ("months" in preset) {
    start = new Date(end.getFullYear(), end.getMonth() - (preset.months - 1), 1);
  } else {
    start = new Date(end);
    start.setDate(start.getDate() - preset.days);
  }
  return { from: formatDateInput(start), to: formatDateInput(end) };
}
