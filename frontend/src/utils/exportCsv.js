import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(columns, rows) {
  const header = columns.map((col) => escapeCsvCell(col.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(row[col.key])).join(','),
  );
  return [header, ...lines].join('\n');
}

export async function shareCsvFile({ csv, filename, dialogTitle = 'Export report' }) {
  const safeName = String(filename || 'report.csv').replace(/[^\w.-]+/g, '-');
  const path = `${FileSystem.cacheDirectory}${safeName}`;
  await FileSystem.writeAsStringAsync(path, csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle });
    return { shared: true, path };
  }
  return { shared: false, path };
}
