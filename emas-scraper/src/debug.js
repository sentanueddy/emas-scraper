// ============================================================
//  DEBUG — cek apakah tiap situs bisa diakses dari Pi Anda,
//  dan simpan HTML-nya agar mudah menemukan selector yang benar.
//
//  Pakai:
//    npm run debug            (semua sumber)
//    npm run debug -- antam   (satu sumber saja)
// ============================================================
import fs from 'node:fs';
import { http } from './util.js';
import { SOURCES } from './sources.js';

const only = process.argv[2];
const OUT_DIR = 'debug';
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const src of SOURCES) {
  if (only && src.key !== only) continue;
  try {
    const res = await http.get(src.url);
    const html = String(res.data);
    const file = `debug-${src.key}.html`;
    fs.writeFileSync(file, html);
    const jsHint = /__NEXT_DATA__|window\.__|id="root"|ng-app/.test(html)
      ? '  (kemungkinan render via JS — lihat README)'
      : '';
    console.log(`[${src.key}] HTTP ${res.status}, ${html.length} byte -> ${file}${jsHint}`);
  } catch (e) {
    const code = e.response ? e.response.status : '';
    console.log(`[${src.key}] GAGAL ${code} ${e.message}`);
  }
}
