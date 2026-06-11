// ============================================================
//  ENTRYPOINT — scrape semua sumber lalu tulis ke Google Sheet
//  Mode: jadwal cron (default) atau sekali jalan (--once)
// ============================================================
import 'dotenv/config';
import cron from 'node-cron';
import { SOURCES } from './sources.js';
import { writeToSheet } from './sheets.js';
import { nowWIB } from './util.js';

const {
  SPREADSHEET_ID,
  SHEET_NAME = 'Harga Emas',
  GOOGLE_CREDENTIALS = '/app/credentials/service-account.json',
  CRON_SCHEDULE = '0 * * * *', // default: tiap jam, menit ke-0
  TZ = 'Asia/Jakarta',
} = process.env;

async function scrapeAll() {
  const rows = [];
  for (const src of SOURCES) {
    try {
      const { sellPrice, buybackPrice } = await src.run();
      rows.push([src.brand, sellPrice ?? 'N/A', buybackPrice ?? 'N/A', nowWIB()]);
      console.log(`[OK]   ${src.brand.padEnd(12)} jual=${sellPrice} buyback=${buybackPrice}`);
    } catch (err) {
      rows.push([src.brand, 'N/A', 'ERROR', nowWIB()]);
      console.error(`[FAIL] ${src.brand.padEnd(12)} ${err.message}`);
    }
  }
  return rows;
}

async function job() {
  console.log(`\n=== Mulai scrape ${new Date().toISOString()} ===`);
  const rows = await scrapeAll();

  if (!SPREADSHEET_ID) {
    console.error('SPREADSHEET_ID belum di-set di .env — lewati penulisan ke Sheet.');
    return;
  }
  try {
    await writeToSheet({
      credentialsPath: GOOGLE_CREDENTIALS,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      rows,
    });
    console.log('✓ Data tertulis ke Google Sheet.');
  } catch (err) {
    console.error('✗ Gagal menulis ke Sheet:', err.message);
  }
}

if (process.argv.includes('--once')) {
  job().then(() => process.exit(0));
} else {
  console.log(`Scheduler aktif: "${CRON_SCHEDULE}" (TZ=${TZ}). Menjalankan sekali di awal...`);
  job(); // jalankan langsung sekali saat container start
  cron.schedule(CRON_SCHEDULE, job, { timezone: TZ });
}
