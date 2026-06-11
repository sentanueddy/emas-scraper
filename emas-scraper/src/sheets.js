// ============================================================
//  Penulisan ke Google Sheet (service account)
// ============================================================
import { google } from 'googleapis';
import { nowWIB } from './util.js';

export async function writeToSheet({ credentialsPath, spreadsheetId, sheetName, rows }) {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const values = [
    [`Harga Buyback Emas 1 gram — diperbarui: ${nowWIB()}`],
    [],
    ['Brand', 'Harga Jual (1g)', 'Buyback (1g)', 'Waktu'],
    ...rows,
  ];

  // Bersihkan area lama dulu supaya tidak ada sisa baris usang.
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A1:Z100`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}
