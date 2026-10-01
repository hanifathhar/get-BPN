# DOKUMENTASI LENGKAP REST API BPHTB (BEBAS AUTH / TANPA X-API-KEY)

Dokumentasi ini merinci arsitektur, parameter koneksi database PostgreSQL BPHTB, query SQL yang digunakan pada sistem, spesifikasi endpoint REST API, format parameter request, kamus data response, serta contoh implementasi (cURL, JavaScript Fetch, PHP, Python).

---

## 1. Informasi Sistem & Arsitektur Database BPHTB

Layanan API BPHTB mengambil data secara langsung dari basis data **PostgreSQL** BPHTB.

| Parameter | Konfigurasi / Nilai Default |
|---|---|
| **Database Engine** | PostgreSQL |
| **Host Target DB** | `192.168.1.101` (Internal) / `103.167.12.53` (via SSH Gateway) |
| **Port DB** | `5432` |
| **Nama Database** | `dbbphtb` |
| **User Database** | `postgres` |
| **Tabel Utama** | `tbl_bphtb` |
| **Metode Autentikasi API** | **Tanpa Autentikasi (No Auth / Bebas `x-api-key`)** |
| **Format Pertukaran Data** | `application/json` |

---

## 2. Query Database yang Digunakan (Aktif di Sistem)

Query PostgreSQL yang dieksekusi oleh API untuk mencari data BPHTB berdasarkan NOP dan Nomor STS / NTPD:

```sql
SELECT *,
  CASE WHEN CAST(status_bayar AS VARCHAR) = '1' THEN 'Y' ELSE 'T' END AS status,
  CASE WHEN CAST(status_bayar AS VARCHAR) = '1' THEN 'L' ELSE 'H' END AS jenisbayar
FROM tbl_bphtb
WHERE (nop = $1 OR REPLACE(REPLACE(nop, '.', ''), '-', '') = $1)
  AND (no_sts = $2 OR CAST(no_sts AS VARCHAR) = $2)
LIMIT 1;
```

### Logika Pemetaan Status Bayar & NTPD pada Kode:
- **Jika `nilai_belum_dibayar < 1` (Lunas):**
  - `STATUS`: `'Y'`
  - `JENISBAYAR`: `'L'` (Lunas)
  - `TANGGAL_PEMBAYARAN`: diambil dari kolom `tgl_skp` (format: `DD/MM/YYYY`)
  - `NTPD`: diambil dari kolom `no_sts`
- **Jika `nilai_belum_dibayar >= 1` (Belum Lunas / Hutang):**
  - `STATUS`: sesuai hasil mapping `status_bayar` (`'Y'` jika '1', `'T'` jika lainnya)
  - `JENISBAYAR`: `'H'` (Hutang) atau sesuai mapping `jenisbayar`
  - `TANGGAL_PEMBAYARAN`: diambil dari kolom `tgl_bayar` (format: `DD/MM/YYYY`)
  - `NTPD`: diambil dari kolom `no_sts`

---

## 3. Spesifikasi Endpoint REST API BPHTB

API BPHTB dapat diakses secara langsung tanpa header `X-API-Key` atau `Authorization` menggunakan method **POST** (JSON Body) maupun **GET** (Query Parameter).

### Base URL:
```text
http://<host-ip-server>:3000/api/v1/bphtb/inquiry
atau
http://<host-ip-server>:3000/api/v1/bphtb
```

---

### 3.1. Endpoint 1: Inquiry BPHTB via POST (JSON Body)

- **URL:** `/api/v1/bphtb/inquiry` (atau `/api/v1/bphtb`)
- **Method:** `POST`
- **Header:** 
  - `Content-Type: application/json`
  - *(Tanpa header autentikasi `x-api-key` / `Authorization`)*

#### Request Body (JSON):
| Parameter | Tipe | Wajib | Keterangan | Contoh |
|---|---|---|---|---|
| `nop` *(atau `NOP` / `nop_bphtb`)* | String | Ya | Nomor Objek Pajak (18 Digit) | `"120301005600400580"` |
| `ntpd` *(atau `NTPD` / `no_sts` / `NO_STS`)* | String | Ya | Nomor Transaksi Pembayaran / No STS | `"202601001"` |

#### Contoh Request Body:
```json
{
  "nop": "120301005600400580",
  "ntpd": "202601001"
}
```

---

### 3.2. Endpoint 2: Inquiry BPHTB via GET (Query Parameters)

- **URL:** `/api/v1/bphtb/inquiry` (atau `/api/v1/bphtb`)
- **Method:** `GET`
- **Query Parameters:**
  - `nop` *(atau `NOP`)*: Nomor Objek Pajak
  - `ntpd` *(atau `NTPD` / `no_sts`)*: Nomor STS / NTPD
- **Header:** *(Tanpa header autentikasi)*

#### Contoh URL:
```text
GET /api/v1/bphtb/inquiry?nop=120301005600400580&ntpd=202601001
```

---

## 4. Struktur Response & Kamus Data

### 4.1. Response Berhasil (HTTP 200 OK - Data Ditemukan)
```json
{
  "result": {
    "NOP": "120301005600400580",
    "NIK": "1203012304890001",
    "NAMA": "AHMAD SUBARJO",
    "ALAMAT": "JL. MERDEKA NO. 45",
    "KELURAHAN_OP": "PADANG BULAN",
    "KECAMATAN_OP": "MEDAN BARU",
    "KOTA_OP": "KOTA MEDAN",
    "LUASTANAH": 150,
    "LUASBANGUNAN": 120,
    "PEMBAYARAN": 0,
    "STATUS": "Y",
    "TANGGAL_PEMBAYARAN": "15/01/2026",
    "NTPD": "202601001",
    "JENISBAYAR": "L"
  }
}
```

### Kamus Data Objek `result`:
| Field | Tipe | Sumber Kolom DB | Penjelasan |
|---|---|---|---|
| `NOP` | String | `nop` | Nomor Objek Pajak (18 digit) |
| `NIK` | String | `nik` | Nomor Induk Kependudukan Wajib Pajak |
| `NAMA` | String | `nama_wp_baru` / `nama_wp` | Nama Wajib Pajak BPHTB |
| `ALAMAT` | String | `alamat_wp_baru` / `alamat_wp` / `lokasi_op` | Alamat Wajib Pajak / Lokasi OP |
| `KELURAHAN_OP` | String | `kelurahan_op` | Nama Kelurahan Objek Pajak |
| `KECAMATAN_OP` | String | `kecamatan_op` | Nama Kecamatan Objek Pajak |
| `KOTA_OP` | String | `kota_op` | Nama Kabupaten / Kota Objek Pajak |
| `LUASTANAH` | Number | `luas_bumi` | Luas tanah dalam satuan m² |
| `LUASBANGUNAN` | Number | `luas_bangunan` | Luas bangunan dalam satuan m² |
| `PEMBAYARAN` | Number | `nilai_belum_dibayar` | Nilai tagihan / sisa pembayaran |
| `STATUS` | String | `status_bayar` / kalkulasi | Status lunas: `'Y'` (Lunas), `'T'` (Belum Lunas) |
| `TANGGAL_PEMBAYARAN` | String | `tgl_skp` / `tgl_bayar` | Tanggal pembayaran format `DD/MM/YYYY` |
| `NTPD` | String | `no_sts` | Nomor Transaksi Pembayaran Daerah / No STS |
| `JENISBAYAR` | String | `jenisbayar` / kalkulasi | Jenis bayar: `'L'` (Lunas), `'H'` (Hutang) |

---

### 4.2. Response Data Tidak Ditemukan (HTTP 200 OK)
```json
{
  "result": null
}
```

### 4.3. Response Parameter Tidak Lengkap (HTTP 400 Bad Request)
```json
{
  "result": null,
  "message": "Parameter 'nop' dan 'ntpd' (Nomor STS) wajib disertakan."
}
```

### 4.4. Response Gangguan Server / Database (HTTP 500 Internal Server Error)
```json
{
  "result": null,
  "message": "Gagal terhubung ke Database PostgreSQL BPHTB..."
}
```

---

## 5. Contoh Pemanggilan (Code Examples)

### 5.1. cURL (POST)
```bash
curl -X POST "http://localhost:3000/api/v1/bphtb/inquiry" \
  -H "Content-Type: application/json" \
  -d '{
    "nop": "120301005600400580",
    "ntpd": "202601001"
  }'
```

### 5.2. cURL (GET)
```bash
curl -X GET "http://localhost:3000/api/v1/bphtb/inquiry?nop=120301005600400580&ntpd=202601001"
```

### 5.3. JavaScript (Node.js / Browser Fetch)
```javascript
const payload = {
  nop: "120301005600400580",
  ntpd: "202601001"
};

fetch("http://localhost:3000/api/v1/bphtb/inquiry", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
  .then((res) => res.json())
  .then((data) => {
    if (data.result) {
      console.log("Data BPHTB Ditemukan:", data.result);
    } else {
      console.log("Data tidak ditemukan atau error:", data.message);
    }
  })
  .catch((err) => console.error("Error:", err));
```

### 5.4. PHP (cURL)
```php
<?php
$url = "http://localhost:3000/api/v1/bphtb/inquiry";
$data = array(
    "nop" => "120301005600400580",
    "ntpd" => "202601001"
);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);
?>
```

### 5.5. Python (Requests)
```python
import requests

url = "http://localhost:3000/api/v1/bphtb/inquiry"
payload = {
    "nop": "120301005600400580",
    "ntpd": "202601001"
}

response = requests.post(url, json=payload)
data = response.json()
print(data)
```
