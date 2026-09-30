import * as XLSX from 'xlsx-js-style';

type ExcelCellStyle = {
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number };
  fill?: { fgColor: { rgb: string } };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
  numFmt?: string;
};

const BORDER_COLOR = 'D9E2F3';
const HEADER_FILL = '1F4E78';
const HEADER_TEXT = 'FFFFFF';
const SUBHEADER_FILL = 'D9EAF7';
const ALT_ROW_FILL = 'F7FAFC';

export function styleWorksheet(
  ws: XLSX.WorkSheet,
  headerRow = 0,
  options: { filter?: boolean; freezeHeader?: boolean } = {},
) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const headerStyle: ExcelCellStyle = {
    font: { bold: true, color: { rgb: HEADER_TEXT }, sz: 11 },
    fill: { fgColor: { rgb: HEADER_FILL } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: BORDER_COLOR } },
      bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
      left: { style: 'thin', color: { rgb: BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: BORDER_COLOR } },
    },
  };

  const bodyBorder = {
    top: { style: 'thin', color: { rgb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
    left: { style: 'thin', color: { rgb: BORDER_COLOR } },
    right: { style: 'thin', color: { rgb: BORDER_COLOR } },
  };

  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRow, c })] as any;
    if (cell) cell.s = headerStyle;
  }

  for (let r = headerRow + 1; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as any;
      if (!cell) continue;
      cell.s = {
        alignment: { vertical: 'top', wrapText: true },
        border: bodyBorder,
        ...(r % 2 === 0 ? { fill: { fgColor: { rgb: ALT_ROW_FILL } } } : {}),
      };
    }
  }

  if (options.filter !== false) {
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  // Supported by Excel-compatible writers as a frozen header hint.
  if (options.freezeHeader !== false) {
    (ws as any)['!freeze'] = { xSplit: 0, ySplit: headerRow + 1 };
  }

  ws['!rows'] = ws['!rows'] || [];
  ws['!rows'][headerRow] = { hpt: 30 };
}

export function styleSummaryWorksheet(ws: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:B1');
  const header = ws['A1'] as any;
  if (header) {
    header.s = {
      font: { bold: true, color: { rgb: HEADER_TEXT }, sz: 11 },
      fill: { fgColor: { rgb: HEADER_FILL } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  for (let r = 1; r <= range.e.r; r += 1) {
    const label = ws[XLSX.utils.encode_cell({ r, c: 0 })] as any;
    const value = ws[XLSX.utils.encode_cell({ r, c: 1 })] as any;
    if (label) {
      label.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: SUBHEADER_FILL } },
        alignment: { vertical: 'center', wrapText: true },
      };
    }
    if (value) {
      value.s = {
        alignment: { vertical: 'center', wrapText: true },
        ...(r % 2 === 0 ? { fill: { fgColor: { rgb: ALT_ROW_FILL } } } : {}),
      };
    }
  }
  ws['!rows'] = ws['!rows'] || [];
  ws['!rows'][0] = { hpt: 30 };
}

export function styleCurrencyColumns(ws: XLSX.WorkSheet, columnIndexes: number[], firstDataRow = 1) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (const c of columnIndexes) {
    for (let r = firstDataRow; r <= range.e.r; r += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as any;
      if (cell) cell.z = '#,##0';
    }
  }
}
