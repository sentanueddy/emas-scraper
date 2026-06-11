# Emas Scraper → Google Sheets (Raspberry Pi / CasaOS)

Scraper harga **buyback emas 1 gram** (Antam, UBS, Hartadinata, Sampoerna, Pegadaian, Lotus Archi) yang berjalan sebagai container Docker di Raspberry Pi, dijadwalkan dengan cron, dan **menulis langsung ke Google Sheet** lewat service account.

Arsitektur ini (Pi *mendorong* data ke Google) tidak butuh endpoint publik, port forwarding, maupun tunnel — Pi hanya membuka koneksi keluar ke Google, jadi aman dari masalah CGNAT.

```
Raspberry Pi (CasaOS / Docker)
   └─ cron tiap jam → scrape situs emas → tulis ke Google Sheet (Sheets API)
```

---

## Prasyarat
- Raspberry Pi menyala 24/7 dengan CasaOS (atau Docker + docker-compose).
- Akun Google + satu Google Sheet kosong sebagai tujuan.

---

## Langkah 1 — Buat Service Account di Google Cloud
1. Buka https://console.cloud.google.com → buat project baru (atau pakai yang ada).
2. **APIs & Services → Library** → cari **Google Sheets API** → **Enable**.
3. **APIs & Services → Credentials → Create Credentials → Service account**.
   - Beri nama bebas (mis. `emas-writer`) → Create → Done.
4. Klik service account tadi → tab **Keys → Add key → Create new key → JSON**.
   - File JSON akan terunduh. **Simpan baik-baik** dan ganti namanya jadi `service-account.json`.
5. Catat alamat email service account (bentuknya `emas-writer@xxx.iam.gserviceaccount.com`).

## Langkah 2 — Siapkan Google Sheet tujuan
1. Buat Google Sheet baru. Tambahkan satu tab (rename) bernama persis **`Harga Emas`**.
2. Klik **Share** → tempel email service account dari Langkah 1 → beri akses **Editor** → Send.
3. Ambil **Spreadsheet ID** dari URL:
   `https://docs.google.com/spreadsheets/d/`**`INI_ID_NYA`**`/edit`

## Langkah 3 — Letakkan proyek di Pi
1. Salin folder proyek ini ke Pi (mis. via `scp`, git, atau Samba CasaOS).
2. Taruh `service-account.json` ke dalam folder `credentials/`.
3. Salin `.env.example` menjadi `.env`, lalu isi `SPREADSHEET_ID` dengan ID dari Langkah 2.

```bash
cp .env.example .env
nano .env          # isi SPREADSHEET_ID
```

## Langkah 4 — Jalankan
SSH ke Pi, masuk ke folder proyek:

```bash
docker compose up -d --build
docker compose logs -f          # lihat log scraping & status tulis ke Sheet
```

Di **CasaOS**, container `emas-scraper` akan muncul otomatis setelah perintah di atas. (Alternatif: CasaOS → App Store → Custom Install → import `docker-compose.yml`.)

Untuk uji sekali jalan tanpa menunggu jadwal:
```bash
docker compose run --rm emas-scraper node src/index.js --once
```

---

## Langkah 5 — Verifikasi & menyesuaikan selector (PENTING)
Bagian scraping tiap situs (`src/sources.js`) adalah **template awal**. URL & cara ambil angka kemungkinan perlu disesuaikan dengan HTML situs yang sebenarnya.

Gunakan mode debug untuk melihat apa yang diterima Pi:
```bash
# di dalam container:
docker compose run --rm emas-scraper npm run debug
# atau satu sumber:
docker compose run --rm emas-scraper npm run debug -- antam
```
Ini menyimpan `debug-antam.html` dkk. Buka file itu, temukan angka harga 1 gram, lalu sesuaikan fungsi `run()` sumber terkait di `src/sources.js`.

Pola yang sudah disediakan:
- `findRowOneGram($)` — mencari baris tabel yang diawali "1 gr/gram" lalu mengambil sel harga. Cocok untuk situs yang menyajikan tabel harga.
- Untuk Pegadaian sudah ada fallback heuristik (mencari teks "buyback" terdekat dengan "Rp").

Jika sebuah sumber gagal, baris-nya ditulis `ERROR` di Sheet tapi **tidak menggagalkan** sumber lain.

---

## Penjadwalan (cron)
Atur di `.env` lewat `CRON_SCHEDULE` (format: `menit jam tanggal bulan hari`):
- `0 * * * *` → tiap jam (default)
- `0 9 * * *` → tiap hari jam 09:00 WIB
- `*/30 8-17 * * 1-5` → tiap 30 menit, jam 08–17, Senin–Jumat

Setelah ubah `.env`: `docker compose up -d` (restart otomatis).

---

## Situs yang butuh headless browser
Jika `npm run debug` menunjukkan HTML **tanpa angka harga** dan ada petunjuk render JS (mis. `__NEXT_DATA__`, `id="root"`), berarti harga dimuat lewat JavaScript. Scraper HTTP biasa tak bisa membacanya. Dua opsi:
1. **Cari endpoint JSON internal** yang dipanggil situs (DevTools → Network → XHR). Sering ini cara termudah — tinggal `http.get(urlJson)`.
2. **Pakai Puppeteer + Chromium ARM** (lebih berat di Pi). Tambahkan dependensi `puppeteer` dan render halaman dulu sebelum parsing. Mulai dari satu situs saja agar ringan.

---

## Troubleshooting
- **`The caller does not have permission`** → Sheet belum di-share ke email service account, atau salah `SPREADSHEET_ID`.
- **`Unable to parse range: Harga Emas!A1`** → nama tab tidak persis `Harga Emas` (atau ubah `SHEET_NAME` di `.env`).
- **Semua sumber `ERROR`/`N/A`** → jalankan `npm run debug`, sesuaikan selector di `src/sources.js`.
- **HTTP 403 dari sebuah situs** → situs memblokir; coba sumber/halaman lain, atau opsi headless browser.

---

## Struktur proyek
```
emas-scraper/
├─ docker-compose.yml
├─ Dockerfile
├─ package.json
├─ .env.example          # salin jadi .env
├─ credentials/          # taruh service-account.json di sini
└─ src/
   ├─ index.js           # orkestrasi + cron
   ├─ sources.js         # << yang Anda sesuaikan per situs
   ├─ sheets.js          # tulis ke Google Sheet
   ├─ util.js            # http client + parser
   └─ debug.js           # alat bantu tuning selector
```
