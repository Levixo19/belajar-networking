# 23.3 — API Platform Cisco

> **Prasyarat:** `15-otomasi/02-data-dan-api`, `15-otomasi/03-python-jaringan`, `23-jalur-vendor/02-sd-access-sd-wan`, `19-mikrotik/07-monitoring-scripting`
> **Tujuan:** Anda bisa memanggil API Catalyst Center (Intent API) dan Meraki Dashboard API dari Python dengan `requests` secara benar (autentikasi token, timeout, verifikasi TLS, pagination, penanganan 401 dan 429), menjelaskan peran NSO dan RESTCONF-nya, menyebut cara login ke Catalyst SD-WAN Manager, dan membandingkan semuanya dengan MikroTik REST API v7.

---

## 1. Pengantar: Label Pendalaman

⚠️ **Label pendalaman.** Modul ini membahas API produk Cisco tertentu. Isinya **tidak diuji** di CCNA, Network+, maupun MTCNA. CCNA hanya menguji konsep REST, JSON, dan perbedaan pendekatan controller-based; produk dan endpoint di bawah ini adalah bahan untuk jalur CCNP Enterprise/Automation (ENAUTO) dan pekerjaan sehari-hari.

Modul 15.2 dan 15.3 sudah mengajarkan REST, JSON, dan Python. Di sini Anda menerapkannya pada tiga platform nyata, plus satu perbandingan dengan perangkat yang Anda kenal dari Tahap 19:

| Platform | Jenis | Yang dikendalikan | Autentikasi |
|---|---|---|---|
| **Catalyst Center** (Intent API) | Controller on-premise | Jaringan kampus, SD-Access, inventori, assurance | Token dari Basic Auth, header `X-Auth-Token` |
| **Meraki Dashboard API** | Cloud | Organisasi, network, switch, AP, firewall Meraki | API key sebagai `Authorization: Bearer` |
| **NSO** | Orkestrator multi-vendor | Layanan dan konfigurasi perangkat via model YANG | Basic/token pada RESTCONF |
| **Catalyst SD-WAN Manager** | Controller SD-WAN | Templat, kebijakan, status edge | Sesi/JWT |
| **MikroTik RouterOS v7** | Per perangkat | Satu router | HTTP Basic |

---

## 2. Analogi

API bisa dibayangkan sebagai **loket pelayanan** gedung pemerintahan. Anda tidak masuk ke ruang kerja pegawai (CLI di tiap perangkat); Anda datang ke loket, menunjukkan **tanda pengenal** (token), menyerahkan formulir terstruktur (JSON), dan menerima jawaban terstruktur. Loket punya **jam antrean** (rate limit), **halaman berkas** yang diserahkan sedikit demi sedikit (pagination), dan **masa berlaku kartu** (token expiry). Loket Catalyst Center ada di gedung Anda sendiri, loket Meraki ada di cloud, dan loket MikroTik ada langsung di setiap perangkat.

---

## 3. Catalyst Center Intent API

**Catalyst Center** (dulu Cisco DNA Center) memiliki API yang dikelompokkan dalam tiga arah: **Intent API** (northbound, REST dengan JSON untuk menemukan dan mengendalikan jaringan), **Events and Notifications** (eastbound, reaksi otomatis terhadap peristiwa), dan **Integration API** (westbound, misalnya ke sistem ITSM). Dokumentasi Cisco menyebut lebih dari seribu operasi API. Modul ini fokus pada Intent API.

Prinsip "intent": Anda menyatakan **hasil yang diinginkan** (misalnya "provision perangkat ini ke site ini"), bukan perintah CLI. Banyak operasi bersifat **asinkron**: API mengembalikan `taskId`, lalu Anda memantau lewat endpoint task sampai selesai.

### Autentikasi

1. Kirim `POST /dna/system/api/v1/auth/token` dengan **HTTP Basic Auth** (username dan password).
2. Balasan JSON berisi token (kunci `Token`).
3. Untuk semua panggilan berikutnya, kirim header **`X-Auth-Token: <token>`**.
4. Token berlaku **60 menit**. Setelah itu API membalas `401 Unauthorized` dan Anda harus meminta token baru.

Dokumentasi juga menyebut opsi enkripsi AES-256 untuk kredensial pada API token pada versi yang lebih baru; periksa versi Catalyst Center Anda.

### Contoh Python: login dan daftar perangkat

```python
import os
import requests

BASE = os.environ["CATC_URL"]            # misalnya https://catc.example.local
USER = os.environ["CATC_USER"]
PASS = os.environ["CATC_PASS"]
CA = os.environ.get("CATC_CA_BUNDLE", True)   # jalur sertifikat CA internal, atau True

def get_token(session):
    r = session.post(
        f"{BASE}/dna/system/api/v1/auth/token",
        auth=(USER, PASS),
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["Token"]

def list_devices(session, token, page=500):
    """Mengambil semua perangkat dengan offset dan limit."""
    headers = {"X-Auth-Token": token, "Accept": "application/json"}
    offset = 1            # periksa di referensi API versi Anda: sebagian endpoint mulai dari 1
    hasil = []
    while True:
        r = session.get(
            f"{BASE}/dna/intent/api/v1/network-device",
            headers=headers,
            params={"offset": offset, "limit": page},
            timeout=30,
        )
        r.raise_for_status()
        data = r.json().get("response", [])
        hasil.extend(data)
        if len(data) < page:
            break
        offset += page
    return hasil

with requests.Session() as s:
    s.verify = CA
    tok = get_token(s)
    for d in list_devices(s, tok):
        print(d.get("hostname"), d.get("managementIpAddress"), d.get("softwareVersion"))
```

Catatan yang menentukan benar atau tidaknya skrip:

- **Jangan** menonaktifkan verifikasi sertifikat (`verify=False`) di produksi. Pakai bundel CA internal. Catalyst Center sering memakai sertifikat yang ditandatangani CA perusahaan, dan itu cukup dengan `verify="/path/ca.pem"`.
- **Selalu beri `timeout`**. `requests` tidak punya timeout bawaan, sehingga skrip bisa menggantung selamanya.
- **Kredensial lewat variabel lingkungan atau vault**, bukan ditulis di berkas yang masuk Git.
- Respons Intent API biasanya berbentuk `{"response": ..., "version": ...}`. Ambil `response`.
- **Pagination**: banyak endpoint daftar memakai `offset` dan `limit` dengan batas jumlah bawaan (laporan komunitas Cisco menyebut 500 untuk daftar perangkat). Selalu loop sampai halaman terakhir. Urutan data bisa berubah antar-panggilan, sehingga ada kemungkinan duplikat bila inventori berubah di tengah pengambilan; deduplikasi dengan `id`.
- **Penanganan 401**: bila status 401, minta token baru satu kali lalu ulangi.

Untuk produksi pertimbangkan **SDK resmi** `dnacentersdk` (Python) yang membungkus autentikasi dan pagination.

---

## 4. Meraki Dashboard API

**Meraki Dashboard API** adalah API REST di cloud Meraki, dengan **base URL `https://api.meraki.com/api/v1`** (bisa berbeda per wilayah). Hierarkinya: organisasi, network, perangkat, lalu fitur (VLAN, SSID, port). Layanan dikelompokkan menjadi CONFIGURE, MONITOR, dan LIVE TOOLS (uji ping dan sejenisnya dari perangkat).

### Autentikasi

- Hasilkan **API key** di dashboard: *Organization* lalu *API & Webhooks*, tab *API keys and access*. Satu identitas boleh punya hingga dua key aktif sehingga rotasi aman.
- API v1 memakai header **`Authorization: Bearer <API_KEY>`**. Header `X-Cisco-Meraki-API-Key` adalah gaya v0 yang sudah usang.
- Perlakukan key seperti kata sandi: simpan di variabel lingkungan atau vault.

### Rate limit

- **10 permintaan per detik per organisasi**, dibagi untuk semua aplikasi yang memakai organisasi itu, ditambah burst (10 permintaan ekstra pada detik pertama, maksimal 30 dalam 2 detik).
- **100 permintaan per detik per alamat IP sumber**.
- Bila terlampaui, API membalas **429** dengan header **`Retry-After`**. Skrip yang benar menunggu sejumlah detik itu, bukan mengulang secepatnya.

### Pagination

Parameter `perPage`, `startingAfter`, dan `endingBefore`. Respons menyertakan header **`Link`** (hingga empat tautan: `first`, `prev`, `next`, `last`). `requests` mengurai header ini ke `response.links`.

### Redirect 302

API Meraki dapat mengalihkan (302) ke server lain. Klien HTTP umumnya membuang header `Authorization` saat pindah host demi keamanan; dokumentasi Meraki menyarankan agar klien tetap membawanya (di curl `--location-trusted`). Pustaka resmi menanganinya untuk Anda.

### Contoh Python: daftar perangkat satu organisasi

```python
import os
import time
import requests

BASE = "https://api.meraki.com/api/v1"
KEY = os.environ["MERAKI_API_KEY"]
ORG = os.environ["MERAKI_ORG_ID"]
HEADERS = {"Authorization": f"Bearer {KEY}", "Accept": "application/json"}

def get(session, url, params=None):
    """GET dengan pengulangan ketika kena rate limit (429)."""
    for _ in range(5):
        r = session.get(url, headers=HEADERS, params=params, timeout=30)
        if r.status_code == 429:
            jeda = int(r.headers.get("Retry-After", "1"))
            time.sleep(jeda)
            continue
        r.raise_for_status()
        return r
    raise RuntimeError("terus terkena rate limit")

def semua_halaman(session, url, params=None):
    """Mengikuti header Link rel=next sampai habis."""
    hasil = []
    r = get(session, url, params)
    hasil.extend(r.json())
    while "next" in r.links:
        r = get(session, r.links["next"]["url"])
        hasil.extend(r.json())
    return hasil

with requests.Session() as s:
    devices = semua_halaman(s, f"{BASE}/organizations/{ORG}/devices", {"perPage": 1000})
    for d in devices:
        print(d["serial"], d.get("model"), d.get("name") or "(tanpa nama)")
```

Catatan: batas `perPage` maksimum berbeda-beda per endpoint, jadi baca referensi API endpoint yang dipakai. Memanggil URL dari header `Link` apa adanya lebih aman daripada menyusun sendiri `startingAfter`. Pustaka resmi `meraki` (Python) menyediakan retry otomatis dan parameter `total_pages`; untuk monitoring terus-menerus, Cisco menyarankan webhook atau action batch daripada polling intensif.

---

## 5. NSO Secara Singkat

**Cisco NSO (Network Services Orchestrator)** berbeda dari Catalyst Center dan Meraki: ia adalah orkestrator **multi-vendor** untuk **layanan** jaringan, bukan konsol satu keluarga produk. Konsep kuncinya:

- **Model YANG** mendefinisikan layanan (misalnya "VPN pelanggan": parameter site, VRF, antarmuka) dan data perangkat.
- **NED (Network Element Driver)** menerjemahkan model NSO ke komunikasi dengan perangkat nyata: CLI, NETCONF, RESTCONF, atau antarmuka proprietari. Berkat NED, satu layanan bisa dikirim ke perangkat Cisco, Juniper, dan lain-lain.
- **CDB** (configuration database) menyimpan konfigurasi dan layanan.
- **Transaksi**: perubahan layanan diterapkan secara atomik ke banyak perangkat; bila ada yang gagal, semuanya digulung balik. Ini mirip semangat `commit` dan `rollback` di Junos (modul 23.1), tetapi pada skala jaringan.

NSO menyediakan **RESTCONF** (RFC 8040) di northbound: operasi CRUD lewat HTTP pada data berbasis YANG. Ciri khasnya adalah media type `application/yang-data+json` dan path di bawah `/restconf/data/`.

```python
import os, requests

NSO = os.environ["NSO_URL"]       # mis. https://nso.example.local:8888
r = requests.get(
    f"{NSO}/restconf/data/tailf-ncs:devices/device",
    auth=(os.environ["NSO_USER"], os.environ["NSO_PASS"]),
    headers={"Accept": "application/yang-data+json"},
    timeout=20,
    verify=os.environ.get("NSO_CA", True),
)
r.raise_for_status()
for dev in r.json()["tailf-ncs:device"]:
    print(dev["name"], dev.get("address"))
```

Pola kerja operator NSO: tulis layanan satu kali, buat instansi per pelanggan lewat RESTCONF atau CLI NSO, lalu NSO menghitung selisih konfigurasi (dry-run) dan menerapkannya. Pembahasan lengkap (paket layanan, FASTMAP) berada di luar modul ini; lihat dokumentasi NSO.

---

## 6. Catalyst SD-WAN Manager (Sekilas)

API Manager memakai dua mekanisme autentikasi, menurut dokumentasi DevNet:

- **Berbasis JWT** (tersedia sejak rilis 20.18.1, direkomendasikan): `POST /jwt/login` mengembalikan token akses dan token XSRF sekaligus, dan token dapat diperbarui lewat `POST /jwt/refresh`.
- **Berbasis sesi** (lama): `POST /j_security_check` dengan form-encoded credentials menghasilkan cookie `JSESSIONID`; lalu `GET /dataservice/client/token` untuk token XSRF, yang dikirim sebagai header `X-XSRF-TOKEN` pada permintaan POST berikutnya. Sesi kedaluwarsa setelah 30 menit tidak aktif atau 24 jam maksimum, dengan batas 100 sesi bersamaan; lakukan `POST /logout` ketika selesai.

Perhatikan pola serupa dengan Catalyst Center: token awal dari kredensial, token dikirim di header, token habis masa berlaku.

---

## 7. Perbandingan dengan MikroTik REST API v7

RouterOS v7 punya REST API sejak v7.1beta4 sebagai pembungkus JSON dari console API. Akses lewat `https://<router>/rest` (layanan `www-ssl`; `www` HTTP tersedia di v7.9 ke atas dan hanya patut untuk lab terisolasi). Autentikasi **HTTP Basic** dengan akun RouterOS yang sama.

| Operasi | HTTP | Padanan CLI |
|---|---|---|
| Baca | `GET /rest/ip/address` | `print` |
| Buat | `PUT /rest/ip/address` | `add` |
| Ubah | `PATCH /rest/ip/address/*1` | `set` |
| Hapus | `DELETE /rest/ip/address/*1` | `remove` |
| Perintah | `POST /rest/ping` | perintah apa saja |

```python
import os, requests

R = os.environ["ROS_HOST"]
AUTH = (os.environ["ROS_USER"], os.environ["ROS_PASS"])
CA = os.environ.get("ROS_CA", True)
base = f"https://{R}/rest"

# baca
alamat = requests.get(f"{base}/ip/address", auth=AUTH, verify=CA, timeout=10).json()

# buat
baru = requests.put(f"{base}/ip/address", auth=AUTH, verify=CA, timeout=10,
                    json={"address": "10.9.9.1/24", "interface": "ether2"}).json()

# ubah (id berbentuk *N)
requests.patch(f"{base}/ip/address/{baru['.id']}", auth=AUTH, verify=CA, timeout=10,
               json={"comment": "dibuat via REST"}).raise_for_status()
```

Perbedaan dan persamaan:

| Aspek | Catalyst Center | Meraki | MikroTik v7 |
|---|---|---|---|
| Lokasi API | Controller on-premise | Cloud | Pada setiap router |
| Autentikasi | Basic untuk dapat token, lalu `X-Auth-Token` | `Authorization: Bearer` (API key) | Basic setiap permintaan |
| Masa berlaku | Token 60 menit | Key sampai dicabut | Tidak ada token |
| Pagination | `offset` / `limit` | `perPage` + header `Link` | Filter dan `.proplist`, tidak ada pagination sebagaimana di dua lainnya |
| Rate limit | Tidak terdokumentasi di halaman autentikasi | 10 req/s per organisasi, 429 + `Retry-After` | Tidak ada pembatasan khusus; timeout perintah 60 detik |
| Cakupan | Ratusan perangkat | Ribuan perangkat | Satu perangkat |
| Skema nilai | JSON bertipe | JSON bertipe | Nilai dikembalikan sebagai string |

Jadi pola umumnya sama: HTTPS, JSON, kredensial rahasia, timeout, verifikasi TLS. Bedanya pada lokasi API (satu pusat vs per perangkat) dan mekanisme token.

---

## 8. Kesalahan Umum

❌ `requests.post(..., verify=False)` dibiarkan di skrip produksi. Ini membuka celah man-in-the-middle. Gunakan `verify="ca.pem"`.

❌ Tidak memakai `timeout`. Skrip menggantung bila server tidak merespons.

❌ Menanam token atau API key di kode, lalu mengunggahnya ke Git. Simpan di variabel lingkungan atau vault, dan rotasi key yang bocor.

❌ Mengabaikan pagination: hanya mengambil halaman pertama, sehingga inventori tampak lebih sedikit dari kenyataan.

❌ Mengulang permintaan secepatnya saat 429 dari Meraki. Baca `Retry-After`.

❌ Menyusun URL halaman berikutnya sendiri, padahal API sudah menyediakan header `Link`.

❌ Menyimpan token Catalyst Center tanpa menangani 401. Setelah 60 menit skrip panjang gagal di tengah jalan.

✅ Bungkus panggilan dalam fungsi kecil (login, get dengan retry, iterator halaman), dan catat status HTTP dalam log tanpa menuliskan rahasia.

---

## 9. Ringkasan

- **Catalyst Center Intent API**: `POST /dna/system/api/v1/auth/token` (Basic) menghasilkan token; kirim `X-Auth-Token`; berlaku 60 menit; 401 berarti login ulang.
- **Pagination Catalyst Center** memakai `offset` dan `limit`; loop sampai halaman habis dan waspadai urutan yang berubah.
- **Meraki**: base URL `https://api.meraki.com/api/v1`, header `Authorization: Bearer`, 10 req/s per organisasi, 429 dengan `Retry-After`, pagination via `perPage` dan header `Link`.
- **NSO**: orkestrator layanan berbasis YANG dan NED, atomik lintas perangkat, RESTCONF dengan `application/yang-data+json`.
- **Catalyst SD-WAN Manager**: JWT (sejak 20.18.1) atau sesi `j_security_check` plus token XSRF.
- **MikroTik v7**: `/rest`, Basic Auth, GET/PUT/PATCH/DELETE/POST untuk print/add/set/remove/perintah.
- Selalu: TLS terverifikasi, `timeout`, rahasia di luar kode, penanganan 401 dan 429.

---

## 10. Latihan

1. Urutkan langkah memanggil Intent API Catalyst Center dari nol sampai mendapat daftar perangkat, termasuk metode HTTP, header, dan endpoint autentikasi.
2. Skrip yang sudah berjalan 90 menit tiba-tiba menerima `401` dari Catalyst Center padahal kredensial benar. Apa penyebabnya dan bagaimana skrip seharusnya menanganinya?
3. Skrip Meraki mendapat balasan `429` dengan `Retry-After: 3`. Tuliskan potongan Python yang menanganinya, dan jelaskan mengapa mengulang langsung adalah kesalahan.
4. Sebuah organisasi Meraki punya 12.000 perangkat. Bagaimana skrip Anda mengambil semuanya, dan apa yang dipakai untuk menentukan halaman berikutnya?
5. Apa beda `Authorization: Bearer` pada Meraki v1 dan `X-Auth-Token` pada Catalyst Center dari sisi cara memperoleh kredensialnya?
6. Sebutkan peran NED dan model YANG di NSO, dan jelaskan mengapa NSO cocok untuk jaringan multi-vendor.
7. Pada MikroTik v7, tulis permintaan HTTP (metode dan path) untuk: membaca semua alamat IP, membuat alamat baru, mengubah komentar alamat berid `*3`, dan menghapusnya.
8. Dalam skrip Python, sebutkan tiga praktik yang wajib agar panggilan API aman dan tidak menggantung.

<details>
<summary>Jawaban</summary>

1. (1) `POST https://<catc>/dna/system/api/v1/auth/token` dengan HTTP Basic Auth (username:password). (2) Ambil nilai `Token` dari JSON balasan. (3) `GET https://<catc>/dna/intent/api/v1/network-device` dengan header `X-Auth-Token: <token>`. (4) Ambil daftar dari kunci `response`, loop `offset` dan `limit` sampai habis.
2. Token Catalyst Center hanya berlaku **60 menit**, setelah itu API membalas 401. Skrip harus menangkap 401, meminta token baru dengan login ulang, lalu mengulang permintaan yang gagal satu kali. Bila 401 terulang, hentikan dan laporkan (kemungkinan kredensial atau izin berubah).
3. 
   ```python
   r = session.get(url, headers=H, timeout=30)
   if r.status_code == 429:
       time.sleep(int(r.headers.get("Retry-After", "1")))
       r = session.get(url, headers=H, timeout=30)
   ```
   Mengulang langsung hanya menambah beban, tetap kena 429, dan bisa memperpanjang pembatasan untuk seluruh aplikasi yang berbagi organisasi (limit 10 req/s per organisasi dibagi bersama). `Retry-After` memberi tahu berapa detik harus menunggu.
4. Gunakan `perPage` sebesar yang diizinkan endpoint dan ikuti header **`Link`** dengan `rel="next"` (di `requests`: `r.links["next"]["url"]`) sampai tidak ada lagi `next`. Pustaka resmi menyediakan `total_pages=-1` atau `"all"` untuk melakukannya otomatis.
5. Catalyst Center: Anda menukar username dan password (Basic Auth) dengan **token yang kedaluwarsa dalam 60 menit**. Meraki: Anda membuat **API key** tetap di dashboard (maksimum dua key aktif per identitas), dikirim sebagai Bearer tiap permintaan, dan berlaku sampai Anda mencabutnya.
6. **Model YANG** mendefinisikan layanan dan data perangkat secara netral vendor. **NED** menerjemahkan model itu menjadi komunikasi southbound spesifik tiap perangkat (CLI, NETCONF, RESTCONF, dll.). Karena layanan ditulis sekali di model dan NED mengurus bahasa perangkat, satu layanan bisa diterapkan ke vendor berbeda, dengan transaksi yang menggulung balik semuanya bila satu perangkat gagal.
7. Baca: `GET /rest/ip/address`. Buat: `PUT /rest/ip/address` dengan JSON `{"address":"10.9.9.1/24","interface":"ether2"}`. Ubah: `PATCH /rest/ip/address/*3` dengan `{"comment":"..."}`. Hapus: `DELETE /rest/ip/address/*3`. Semua lewat HTTPS dengan Basic Auth.
8. (a) Verifikasi TLS dengan CA yang benar, bukan `verify=False`. (b) `timeout` pada setiap permintaan. (c) Kredensial dan token dari variabel lingkungan atau vault, tidak ditulis di kode dan tidak masuk log. Tambahan: tangani 401/429 dan paginasi.

</details>

---

## 11. Sumber

- Cisco DevNet, Catalyst Center: Authentication (endpoint token, `X-Auth-Token`, 60 menit): https://developer.cisco.com/docs/catalyst-center/authentication/
- Cisco DevNet, Catalyst Center API overview (Intent, Events, Integration API): https://developer.cisco.com/docs/catalyst-center/
- Cisco DevNet, Meraki Dashboard API v1, pengenalan: https://developer.cisco.com/meraki/api-v1/introduction/
- Cisco DevNet, Meraki Authorization (Bearer, key, redirect 302): https://developer.cisco.com/meraki/api-v1/authorization/
- Cisco DevNet, Meraki Pagination (`perPage`, `startingAfter`, `Link`): https://developer.cisco.com/meraki/api-v1/pagination/
- Cisco DevNet, Meraki Rate Limit (10 req/s per organisasi, 429, `Retry-After`): https://developer.cisco.com/meraki/api-v1/rate-limit/
- Cisco DevNet, Catalyst SD-WAN Manager API: Authentication (JWT dan sesi): https://developer.cisco.com/docs/sdwan/authentication/
- Cisco DevNet, NSO: https://developer.cisco.com/docs/nso/
- Cisco NSO Documentation, RESTCONF API: https://nso-docs.cisco.com/guides/nso-6.5/development/core-concepts/northbound-apis/restconf-api
- Cisco NSO Documentation, NED Overview: https://nso-docs.cisco.com/neds
- RFC 8040, RESTCONF Protocol: https://www.rfc-editor.org/rfc/rfc8040
- MikroTik, RouterOS REST API: https://help.mikrotik.com/docs/spaces/ROS/pages/47579162/REST+API
- Python Requests: https://requests.readthedocs.io

---

**Berikutnya:** `21-ekosistem-profesi/01-peta-ekosistem` — dari spesialisasi vendor ke peta besar profesi: bagaimana semua keterampilan ini bertemu dalam karier.
