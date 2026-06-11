// ============================================================
//  Helper bersama: HTTP client + util parsing
// ============================================================
import axios from 'axios';
import * as cheerio from 'cheerio';

// Client HTTP dengan header "browser" supaya tidak gampang ditolak.
// Catatan: dijalankan dari IP rumahan (Pi Anda) -> umumnya lebih jarang
// diblokir dibanding IP datacenter.
export const http = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
});

// Ambil HTML sebuah URL dan kembalikan instance cheerio ($).
export async function getHtml(url) {
  const res = await http.get(url);
  return cheerio.load(res.data);
}

// "Rp 2.531.000" / "2.531.000,00" -> 2531000 (number) | null
export function parseRupiah(str) {
  if (str == null) return null;
  let s = String(str).replace(/[^\d.,]/g, ''); // sisakan angka & pemisah
  s = s.replace(/,\d{1,2}$/, '');               // buang desimal ",00"
  s = s.replace(/[.,]/g, '');                    // buang pemisah ribuan
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Waktu lokal WIB untuk stempel "diperbarui".
export function nowWIB() {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// Helper umum: dari sebuah tabel, cari baris yang menandakan "1 gram"
// lalu kembalikan teks tiap sel pada baris itu. SESUAIKAN bila perlu.
export function findRowOneGram($, tableSelector = 'table') {
  let found = null;
  $(`${tableSelector} tr`).each((_, tr) => {
    if (found) return;
    const cells = $(tr)
      .find('td, th')
      .map((__, c) => $(c).text().trim())
      .get();
    const first = (cells[0] || '').toLowerCase();
    // cocokkan "1 gr", "1 gram", "1.0 gr", "1,0 gram"
    if (/^\s*1([.,]0+)?\s*(gr|gram)\b/.test(first)) found = cells;
  });
  return found; // array sel, atau null
}
