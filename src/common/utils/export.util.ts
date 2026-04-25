import * as ExcelJS from 'exceljs';
import { Response } from 'express';
const PdfPrinter = require('pdfmake');
import { TDocumentDefinitions } from 'pdfmake/interfaces';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

export async function exportToExcel(
  res: Response,
  filename: string,
  columns: ExportColumn[],
  data: any[],
  sheetName: string = 'Data',
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  // Style the header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  worksheet.addRows(data);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}

export function exportToCSV(
  res: Response,
  filename: string,
  columns: ExportColumn[],
  data: any[],
) {
  const headers = columns.map((col) => col.header).join(',');
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      })
      .join(','),
  );

  const csvContent = `${headers}\n${rows.join('\n')}`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);

  res.status(200).send(csvContent);
}

export async function exportToPDF(
  res: Response,
  filename: string,
  columns: ExportColumn[],
  data: any[],
  title: string,
) {
  const printer = new PdfPrinter(fonts);

  const tableBody: any[][] = [];

  // Headers
  tableBody.push(
    columns.map((col) => ({ text: col.header, style: 'tableHeader' })),
  );

  // Data rows
  data.forEach((item) => {
    tableBody.push(
      columns.map((col) => {
        const val = item[col.key];
        return val !== null && val !== undefined ? String(val) : '';
      }),
    );
  });

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: title, style: 'header' },
      {
        text: `Generated on: ${new Date().toLocaleString()}`,
        style: 'subheader',
      },
      {
        table: {
          headerRows: 1,
          widths: columns.map(() => '*'),
          body: tableBody,
        },
        layout: {
          fillColor: function (rowIndex: number) {
            return rowIndex === 0 ? '#E0E0E0' : null;
          },
        },
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 12,
        italics: true,
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black',
      },
    },
    defaultStyle: {
      fontSize: 8,
    },
    pageOrientation: 'landscape',
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}
