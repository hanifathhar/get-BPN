# DOKUMENTASI LENGKAP REST API SISMIOP PBB & INTEGRASI BPN

Dokumentasi ini merinci arsitektur, konfigurasi basis data Oracle SISMIOP PBB, kamus data (Data Dictionary), spesifikasi endpoint REST API, serta contoh *request* & *response*.

---

## 1. Informasi Koneksi Database

Database yang digunakan adalah **Oracle Database (SISMIOP PBB)** dengan parameter koneksi default sebagai berikut:

| Parameter | Nilai / Konfigurasi |
|---|---|
| **Host IP** | `103.167.12.59` |
| **Port** | `1521` |
| **SID** | `SISMIOP` |
| **Username** | `PBB` |
| **Password** | `PBB` |
| **TNS String** | `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=103.167.12.59)(PORT=1521))(CONNECT_DATA=(SID=SISMIOP)))` |

---

## 2. Struktur Data & Kamus NOP (18 Digit)

Nomor Objek Pajak (NOP) PBB standar nasional terdiri dari **18 digit angka** dengan struktur segmentasi:

- `KD_PROPINSI` (2 Char): Kode Propinsi
- `KD_DATI2` (2 Char): Kode Kabupaten/Kota
- `KD_KECAMATAN` (3 Char): Kode Kecamatan
- `KD_KELURAHAN` (3 Char): Kode Kelurahan/Desa
- `KD_BLOK` (3 Char): Kode Blok PBB
- `NO_URUT` (4 Char): Nomor Urut Formulir Objek Pajak
- `KD_JNS_OP` (1 Char): Kode Jenis Objek Pajak

---

## 3. Query Database yang Digunakan

```sql
SELECT 
  A.KD_PROPINSI||A.KD_DATI2||A.KD_KECAMATAN||A.KD_KELURAHAN||A.KD_BLOK||A.NO_URUT||A.KD_JNS_OP AS NOP,
  B.NM_WP,
  A.JALAN_OP as ALAMAT_OP,
  C.NM_KECAMATAN AS KECAMATAN_OP,
  D.NM_KELURAHAN AS KELURAHAN_OP,
  '' AS KOTA_OP,
  A.TOTAL_LUAS_BUMI AS LUASTANAH_OP,
  A.TOTAL_LUAS_BNG AS LUASBANGUNAN_OP,
  A.NJOP_BUMI AS NJOP_TANAH_OP,
  A.NJOP_BNG AS NJOP_BANGUNAN_OP,
  '' AS STATUS_TUNGGAKAN 
FROM PBB.DAT_OBJEK_PAJAK A 
LEFT JOIN PBB.DAT_SUBJEK_PAJAK B ON A.SUBJEK_PAJAK_ID=B.SUBJEK_PAJAK_ID
LEFT JOIN PBB.REF_KECAMATAN C ON A.KD_PROPINSI=C.KD_PROPINSI AND A.KD_DATI2=C.KD_DATI2 AND A.KD_KECAMATAN=C.KD_KECAMATAN
LEFT JOIN PBB.REF_KELURAHAN D ON A.KD_PROPINSI=D.KD_PROPINSI AND A.KD_DATI2=D.KD_DATI2 AND A.KD_KECAMATAN=D.KD_KECAMATAN AND A.KD_KELURAHAN=D.KD_KELURAHAN
WHERE A.KD_PROPINSI||A.KD_DATI2||A.KD_KECAMATAN||A.KD_KELURAHAN||A.KD_BLOK||A.NO_URUT||A.KD_JNS_OP='120301005600400580';
```

---

## 4. Daftar Endpoint REST API

- `GET /api/v1/pbb/nop/:nop`
- `GET /api/v1/pbb/sppt/:nop`
- `POST /api/v1/pbb/bpn-validasi`
- `GET /api/v1/docs/openapi.json`
