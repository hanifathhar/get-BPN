# DOKUMENTASI LENGKAP REST API SISMIOP PBB & INTEGRASI BPN (BEBAS AUTENTIKASI / TANPA X-API-KEY)

Dokumentasi ini merinci arsitektur, parameter koneksi basis data Oracle SISMIOP PBB, kamus data NOP, query SQL yang digunakan, spesifikasi seluruh endpoint REST API (bebas autentikasi tanpa API Key / Token), serta contoh implementasi (cURL, JavaScript Fetch, PHP, Python).

---

## 1. Informasi Koneksi Database Oracle SISMIOP PBB

Layanan API SISMIOP PBB terhubung langsung ke basis data **Oracle Database (SISMIOP PBB)**.

| Parameter | Nilai / Konfigurasi Default |
|---|---|
| **Database Engine** | Oracle Database (SISMIOP PBB) |
| **Host IP** | `103.167.12.59` |
| **Port** | `1521` |
| **SID** | `SISMIOP` |
| **Username** | `PBB` |
| **Password** | `PBB` |
| **TNS String** | `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=103.167.12.59)(PORT=1521))(CONNECT_DATA=(SID=SISMIOP)))` |
| **Metode Akses API** | **Bebas Autentikasi (No Auth / Tanpa Header `X-API-Key` atau `Authorization`)** |
| **Format Pertukaran Data** | `application/json` |

---

## 2. Struktur Data & Kamus NOP (18 Digit)

Nomor Objek Pajak (NOP) PBB standar nasional terdiri dari **18 digit angka**:

- `KD_PROPINSI` (2 Char): Kode Propinsi (contoh: `12`)
- `KD_DATI2` (2 Char): Kode Kabupaten/Kota (contoh: `03`)
- `KD_KECAMATAN` (3 Char): Kode Kecamatan (contoh: `010`)
- `KD_KELURAHAN` (3 Char): Kode Kelurahan/Desa (contoh: `056`)
- `KD_BLOK` (3 Char): Kode Blok PBB (contoh: `004`)
- `NO_URUT` (4 Char): Nomor Urut Formulir Objek Pajak (contoh: `0058`)
- `KD_JNS_OP` (1 Char): Kode Jenis Objek Pajak (contoh: `0`)

---

## 3. Query Database Oracle SISMIOP PBB (Aktif di Sistem)

### 3.1. Query Informasi Objek & Subjek Pajak (`/api/v1/pbb/nop/:nop`)
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
WHERE A.KD_PROPINSI = :kd_propinsi
  AND A.KD_DATI2 = :kd_dati2
  AND A.KD_KECAMATAN = :kd_kecamatan
  AND A.KD_KELURAHAN = :kd_kelurahan
  AND A.KD_BLOK = :kd_blok
  AND A.NO_URUT = :no_urut
  AND A.KD_JNS_OP = :kd_jns_op;
```

### 3.2. Query Riwayat SPPT & Pembayaran (`/api/v1/pbb/sppt/:nop`)
```sql
SELECT 
  THN_PAJAK_SPPT,
  PBB_YG_HARUS_DIBAYAR_SPPT,
  STATUS_PEMBAYARAN_SPPT,
  TGL_PEMBAYARAN_SPPT,
  LUAS_BUMI_SPPT,
  LUAS_BNG_SPPT
FROM PBB.SPPT
WHERE KD_PROPINSI = :kd_propinsi
  AND KD_DATI2 = :kd_dati2
  AND KD_KECAMATAN = :kd_kecamatan
  AND KD_KELURAHAN = :kd_kelurahan
  AND KD_BLOK = :kd_blok
  AND NO_URUT = :no_urut
  AND KD_JNS_OP = :kd_jns_op
ORDER BY THN_PAJAK_SPPT DESC;
```

---

## 4. Spesifikasi Endpoint REST API SISMIOP PBB (Tanpa Auth)

### Base URL:
```text
http://103.167.12.53:3005
```

---

### 4.1. Endpoint 1: Detail Objek Pajak & Wajib Pajak

- **URL:** `/api/v1/pbb/nop/:nop`
- **Method:** `GET`
- **Header:** `Accept: application/json` *(Tanpa header auth)*
- **Path Parameter:**
  - `nop` *(String, 18 Digit)*: Nomor Objek Pajak PBB (contoh: `120301005600400580`)

#### Contoh Response Berhasil (HTTP 200 OK):
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Data Objek Pajak berhasil ditemukan.",
  "data": {
    "nop": "12.03.010.056.004-0058.0",
    "nop_raw": "120301005600400580",
    "nm_wp": "NURHASANAH NASUTION",
    "alamat_op": "JL.LINTAS SUMATERA",
    "kecamatan_op": "KEC.BATANG ANGKOLA",
    "kelurahan_op": "SORIK",
    "kota_op": "-",
    "luastanah_op": 157,
    "luasbangunan_op": 64,
    "njop_tanah_op": 12560000,
    "njop_bangunan_op": 45000000,
    "status_tunggakan": "-"
  }
}
```

---

### 4.2. Endpoint 2: Riwayat SPPT & Ketetapan PBB

- **URL:** `/api/v1/pbb/sppt/:nop`
- **Method:** `GET`
- **Path Parameter:**
  - `nop` *(String, 18 Digit)*: Nomor Objek Pajak PBB

#### Contoh Response Berhasil (HTTP 200 OK):
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Data riwayat SPPT berhasil ditemukan.",
  "total_records": 5,
  "data": [
    {
      "thn_pajak_sppt": "2026",
      "pbb_yg_harus_dibayar_sppt": 75000,
      "status_pembayaran_sppt": "1",
      "tgl_pembayaran_sppt": "2026-03-15",
      "luas_bumi_sppt": 157,
      "luas_bng_sppt": 64
    }
  ]
}
```

---

### 4.3. Endpoint 3: Informasi Zona Nilai Tanah (ZNT) & NIR

- **URL:** `/api/v1/pbb/znt/:nop`
- **Method:** `GET`
- **Path Parameter:**
  - `nop` *(String, 18 Digit)*: Nomor Objek Pajak PBB

#### Contoh Response Berhasil (HTTP 200 OK):
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "data": {
    "nop": "120301005600400580",
    "kd_znt": "AA",
    "nir": 80000
  }
}
```

---

### 4.4. Endpoint 4: Validasi Komparasi Data Bidang Tanah BPN vs PBB

- **URL:** `/api/v1/pbb/bpn-validasi`
- **Method:** `POST`
- **Header:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "nop": "120301005600400580",
    "nib": "10.01.05.02.01234",
    "nomor_hak": "M.02154",
    "luas_tanah_bpn": 157
  }
  ```

#### Contoh Response Berhasil (HTTP 200 OK):
```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Validasi komparasi bidang tanah berhasil diproses.",
  "validation_result": {
    "is_valid": true,
    "luas_match": true,
    "selisih_luas": 0,
    "data_pbb": {
      "nop": "120301005600400580",
      "nm_wp": "NURHASANAH NASUTION",
      "luas_bumi": 157
    }
  }
}
```

---

## 5. Contoh Pemanggilan (Code Examples Bebas Auth)

### 5.1. cURL
```bash
# Detail Objek Pajak NOP
curl -X GET "http://103.167.12.53:3005/api/v1/pbb/nop/120301005600400580"

# Riwayat SPPT
curl -X GET "http://103.167.12.53:3005/api/v1/pbb/sppt/120301005600400580"
```

### 5.2. JavaScript (Fetch)
```javascript
fetch("http://103.167.12.53:3005/api/v1/pbb/nop/120301005600400580")
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error("Error:", err));
```

### 5.3. PHP (cURL)
```php
<?php
$ch = curl_init("http://103.167.12.53:3005/api/v1/pbb/nop/120301005600400580");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);
?>
```

### 5.4. Python (Requests)
```python
import requests

url = "http://103.167.12.53:3005/api/v1/pbb/nop/120301005600400580"
response = requests.get(url)
print(response.json())
```
