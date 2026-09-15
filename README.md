# SISMIOP PBB & BPN API Integration

Layanan REST API & Dokumentasi Interaktif untuk Integrasi Basis Data Oracle SISMIOP PBB dengan Sistem Pertanahan BPN.

## Fitur
- Query Data Objek Pajak Real-time berdasarkan NOP
- Riwayat SPPT & Status Pembayaran / Tunggakan
- Validasi Komparasi Bidang Tanah BPN vs PBB
- Dokumentasi Interaktif OpenAPI 3.0 (Swagger)

## Cara Menjalankan

1. Salin file `.env.example` menjadi `.env.local`
2. Jalankan Oracle bridge service:
   ```bash
   node oracle-bridge.js
   ```
3. Jalankan aplikasi web:
   ```bash
   npm install
   npm run dev
   ```
4. Buka di browser: `http://localhost:3000`
