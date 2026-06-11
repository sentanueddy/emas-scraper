// ============================================================
//  SUMBER SCRAPING — satu objek per brand
// ============================================================
//
//  PENTING — BACA INI:
//  Fungsi run() di bawah adalah TEMPLATE AWAL. URL dan cara
//  mengekstrak angka HARUS Anda verifikasi terhadap HTML situs
//  yang sebenarnya, karena:
//    - struktur halaman tiap situs berbeda & bisa berubah,
//    - sebagian situs merender harga via JavaScript (lihat README
//      bagian "Situs yang butuh headless browser").
//
//  Cara cepat menyesuaikan:
//    1) jalankan:  npm run debug            (simpan HTML tiap situs)
//    2) buka file debug-<key>.html, cari angka harga 1 gram,
//    3) sesuaikan selector/logika di run() sumber terkait.
//
//  Kontrak: run() mengembalikan { sellPrice, buybackPrice }
//  (boleh null bila tidak tersedia). Lempar error bila gagal total.
// ============================================================

import { getHtml, parseRupiah, findRowOneGram } from './util.js';

export const SOURCES = [
  // ---------- ANTAM (logammulia.com) ----------
  {
    key: 'antam',
    brand: 'Antam',
    url: 'https://anekalogam.co.id/id', // VERIFIKASI
    async run() {
      const $ = await getHtml(this.url);
      // CONTOH: tabel dengan kolom [berat, harga dasar/jual, buyback].
      const row = findRowOneGram($);
      if (!row) throw new Error('Baris 1 gram tidak ditemukan (cek selector).');
      return {
        sellPrice: parseRupiah(row[1]),
        buybackPrice: parseRupiah(row[2] ?? row[1]),
      };
    },
  },

  // ---------- UBS (via Galeri 24) ----------
  {
    key: 'ubs',
    brand: 'UBS',
    url: 'https://ubslifestyle.com/fine-gold/', // VERIFIKASI (cari halaman harga UBS)
    async run() {
      const $ = await getHtml(this.url);
      const row = findRowOneGram($);
      if (!row) throw new Error('Baris 1 gram tidak ditemukan (cek selector).');
      return {
        sellPrice: parseRupiah(row[1]),
        buybackPrice: parseRupiah(row[2] ?? row[1]),
      };
    },
  },

  // ---------- HARTADINATA (EMASKU) ----------
  {
    key: 'hartadinata',
    brand: 'Hartadinata',
    url: 'https://hrtagold.id/id/gold-price', // VERIFIKASI URL halaman harga
    async run() {
      const $ = await getHtml(this.url);
      const row = findRowOneGram($);
      if (!row) throw new Error('Baris 1 gram tidak ditemukan (cek selector).');
      return {
        sellPrice: parseRupiah(row[1]),
        buybackPrice: parseRupiah(row[2] ?? row[1]),
      };
    },
  },

  // ---------- WARIS SAMPOERNA ----------
  {
    key: 'sampoerna',
    brand: 'Sampoerna',
    url: 'https://sampoernagold.com/catalog_product?edisi=classic', // VERIFIKASI URL halaman harga
    async run() {
      const $ = await getHtml(this.url);
      const row = findRowOneGram($);
      if (!row) throw new Error('Baris 1 gram tidak ditemukan (cek selector).');
      return {
        sellPrice: parseRupiah(row[1]),
        buybackPrice: parseRupiah(row[2] ?? row[1]),
      };
    },
  },

  // ---------- PEGADAIAN ----------
  {
    key: 'pegadaian',
    brand: 'Pegadaian',
    url: 'https://galeri24.co.id/harga-emas#GALERI%2024', // VERIFIKASI URL halaman harga
    async run() {
      const $ = await getHtml(this.url);
      // Pegadaian sering menampilkan harga Tabungan Emas (jual & buyback).
      // Pendekatan tabel sebagai titik awal:
      const row = findRowOneGram($);
      if (row) {
        return {
          sellPrice: parseRupiah(row[1]),
          buybackPrice: parseRupiah(row[2] ?? row[1]),
        };
      }
      // Fallback heuristik: cari teks ber-"buyback" terdekat dengan "Rp".
      const text = $('body').text().replace(/\s+/g, ' ');
      const m = text.match(/buyback[^0-9]{0,40}(Rp[\s.]*[\d.]+)/i);
      if (!m) throw new Error('Harga tidak ditemukan (cek selector).');
      return { sellPrice: null, buybackPrice: parseRupiah(m[1]) };
    },
  },

  // ---------- LOTUS ARCHI ----------
  {
    key: 'lotus',
    brand: 'Lotus Archi',
    url: 'https://lotusarchi.com/pricing/', // VERIFIKASI URL halaman harga
    async run() {
      const $ = await getHtml(this.url);
      const row = findRowOneGram($);
      if (!row) throw new Error('Baris 1 gram tidak ditemukan (cek selector).');
      return {
        sellPrice: parseRupiah(row[1]),
        buybackPrice: parseRupiah(row[2] ?? row[1]),
      };
    },
  },
];
