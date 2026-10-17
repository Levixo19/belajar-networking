# 15.2 Format Data dan API Perangkat

> **Prasyarat:** `15-otomasi/01`, `06-aplikasi/03` (HTTP/REST/JSON)
> **Tujuan:** Anda menguasai JSON/YAML/XML, memahami REST/NETCONF/RESTCONF/gNMI, dan bisa berinteraksi dengan API perangkat (sesuai CCNA 6.5-6.7).

---

## 1. Format Data: Fondasi Otomasi

Otomasi berkomunikasi dengan **data terstruktur**, bukan output CLI yang dirancang untuk manusia.

```
CLI output (untuk manusia):
  GigabitEthernet0/1 is up, line protocol is up
  → sulit di-parse, format berubah antar-versi

Data terstruktur (untuk mesin):
  {"name": "GigabitEthernet0/1", "admin_status": "up", "oper_status": "up"}
  → mudah di-parse, konsisten, dapat divalidasi
```

### JSON (CCNA 6.7)

Format paling umum di REST API dan RESTCONF.

```json
{
  "hostname": "SW-ACCESS-01",
  "uptime_seconds": 8640000,
  "is_reachable": true,
  "software_version": null,
  "interfaces": [
    {
      "name": "GigabitEthernet0/1",
      "enabled": true,
      "vlan": 10,
      "counters": { "input_errors": 0, "crc": 0 }
    },
    {
      "name": "GigabitEthernet0/24",
      "mode": "trunk",
      "allowed_vlans": [10, 20, 30]
    }
  ]
}
```

**Enam tipe data JSON (wajib untuk CCNA):**
| Tipe | Contoh | Catatan |
|---|---|---|
| **String** | `"SW-ACCESS-01"` | Selalu tanda kutip ganda |
| **Number** | `8640000`, `3.14`, `-5` | Tanpa tanda kutip |
| **Boolean** | `true`, `false` | Huruf kecil |
| **Null** | `null` | Huruf kecil |
| **Object** | `{ "key": value }` | Pasangan key-value |
| **Array** | `[1, 2, 3]` | Daftar terurut |

> [!WARNING]
> **Kesalahan JSON yang diuji di CCNA dan sering terjadi:**
```json
❌ { 'name': 'sw1' }        ← tanda kutip TUNGGAL tidak valid
❌ { "name": "sw1", }       ← trailing comma tidak valid
❌ { name: "sw1" }          ← key harus dalam tanda kutip
❌ { "enabled": True }      ← harus huruf kecil: true
❌ // komentar              ← JSON TIDAK punya komentar
✅ { "name": "sw1", "enabled": true, "vlan": 10 }
```

> [!TIP]
> **Memvalidasi JSON:**
```bash
$ echo '{"name":"sw1"}' | python3 -m json.tool     # format + validasi
$ cat data.json | jq .                              # jq: format + query
$ jq '.interfaces[].name' data.json                 # ekstrak nilai
$ jq '.interfaces[] | select(.vlan==10)' data.json  # filter
```

### YAML

Lebih mudah dibaca manusia; dipakai Ansible, Kubernetes, Containerlab, dan file konfigurasi.

```yaml
hostname: SW-ACCESS-01
uptime_seconds: 8640000
is_reachable: true
software_version: null       # atau ~ atau kosong
interfaces:
  - name: GigabitEthernet0/1
    enabled: true
    vlan: 10
    counters:
      input_errors: 0
      crc: 0
  - name: GigabitEthernet0/24
    mode: trunk
    allowed_vlans: [10, 20, 30]
```

> [!WARNING]
> **Aturan YAML yang menjebak:**
```
- INDENTASI bermakna (seperti Python) — konsistensi wajib
- HANYA SPASI, tidak boleh TAB
- List dengan tanda hubung (-)
- Key-value dengan titik dua + spasi (key: value)
- String biasanya tanpa kutip, tetapi butuh kutip untuk karakter khusus
- Nilai seperti yes/no/on/off ditafsirkan sebagai boolean (hati-hati!)
- Komentar dengan #
```

> [!TIP]
> **Jebakan YAML klasik:** `port: 22` adalah number, tetapi `enabled: yes` menjadi boolean `true`, dan `version: 1.10` menjadi number `1.1` (nol hilang!). Untuk string yang ambigu, gunakan kutip: `version: "1.10"`.

```bash
$ python3 -c "import yaml,sys; print(yaml.safe_load(sys.stdin))" < data.yaml
$ yamllint data.yaml
```

### XML

Lebih verbose; dipakai NETCONF dan API lama.

```xml
<device>
  <hostname>SW-ACCESS-01</hostname>
  <interfaces>
    <interface>
      <name>GigabitEthernet0/1</name>
      <enabled>true</enabled>
      <vlan>10</vlan>
    </interface>
  </interfaces>
</device>
```

### Perbandingan

| | JSON | YAML | XML |
|---|---|---|---|
| Keterbacaan | Sedang | Terbaik | Buruk (verbose) |
| Verbositas | Sedang | Ringkas | Tinggi |
| Komentar | Tidak | Ya | Ya |
| Dipakai | REST, RESTCONF | Ansible, K8s, config | NETCONF |
| Tipe data | Eksplisit | Implisit (rawan ambigu) | Semua string (butuh skema) |
| Parsing | Universal | Universal | Butuh library |

> [!TIP]
> **Kapan memakai apa:** JSON untuk API dan pertukaran data mesin; YAML untuk file konfigurasi yang ditulis/dibaca manusia; XML kalau perangkat/protokol memaksanya (NETCONF).

---

## 2. REST API (CCNA 6.5)

Sudah dibahas di `06-aplikasi/03`. Ringkasan untuk otomasi jaringan.

### CRUD ↔ HTTP Verb

| Operasi | HTTP Method | Contoh |
|---|---|---|
| **Create** | POST | `POST /restconf/data/interfaces` |
| **Read** | GET | `GET /restconf/data/interfaces/gi0-1` |
| **Update** | PUT / PATCH | `PUT /restconf/data/interfaces/gi0-1` |
| **Delete** | DELETE | `DELETE /restconf/data/interfaces/gi0-1` |

### Status code penting

```
2xx → sukses (200 OK, 201 Created, 204 No Content)
4xx → kesalahan klien (400 bad request, 401 unauth, 403 forbidden, 404 not found)
5xx → kesalahan server (500, 503)
```

### Autentikasi (CCNA 6.5)

| Metode | Cara |
|---|---|
| **Basic** | `Authorization: Basic base64(user:pass)` (wajib HTTPS) |
| **Bearer token** | `Authorization: Bearer <token>` (dari login/OAuth) |
| **API key** | Header `X-API-Key` atau parameter |
| **OAuth 2.0** | Alur token dengan refresh |

> [!WARNING]
> **Base64 pada Basic Auth BUKAN enkripsi**, hanya encoding. Wajib HTTPS.

### Data encoding

REST API biasanya memakai JSON untuk body; kadang XML.

### Contoh: interaksi REST API perangkat

```bash
# Dapatkan token (contoh RESTCONF Cisco IOS-XE)
$ curl -k -u admin:password \
    -H "Accept: application/yang-data+json" \
    https://192.168.1.1/restconf/data/ietf-interfaces:interfaces

# Ubah deskripsi interface (PATCH)
$ curl -k -u admin:password -X PATCH \
    -H "Content-Type: application/yang-data+json" \
    -d '{"ietf-interfaces:interface":{"description":"Uplink-Core"}}' \
    https://192.168.1.1/restconf/data/ietf-interfaces:interface=GigabitEthernet1
```

```python
import requests
from requests.auth import HTTPBasicAuth

s = requests.Session()
s.auth = HTTPBasicAuth("admin", "password")
s.verify = False        # HANYA lab; produksi pakai CA yang benar
s.headers.update({"Accept": "application/yang-data+json"})

r = s.get("https://192.168.1.1/restconf/data/ietf-interfaces:interfaces")
r.raise_for_status()
for intf in r.json()["ietf-interfaces:interfaces"]["interface"]:
    print(intf["name"], intf.get("description", ""))
```

---

## 3. Model Interaksi Perangkat

Ada beberapa cara program berkomunikasi dengan perangkat jaringan:

| Metode | Transport | Data | Kelebihan | Kekurangan |
|---|---|---|---|---|
| **CLI scraping** (SSH) | SSH | Teks CLI | Universal, semua perangkat | Rapuh, output berubah antar-versi |
| **SNMP** | UDP 161 | ASN.1 | Universal untuk monitoring | Buruk untuk konfigurasi |
| **NETCONF** | SSH (830) | XML | Transaksional, standar | Verbose, kompleks |
| **RESTCONF** | HTTPS | JSON/XML | Mudah (HTTP+JSON) | Fitur lebih terbatas dari NETCONF |
| **gNMI** | gRPC/HTTP2 | Protobuf | Cepat, streaming telemetry | Dukungan bervariasi |

> [!TIP]
> **Untuk perangkat lama/campuran, CLI scraping (Netmiko/Scrapli) masih dominan** karena universal. Untuk perangkat modern, NETCONF/RESTCONF/gNMI memberi interaksi yang jauh lebih andal.

---

## 4. NETCONF

Protokol manajemen berbasis XML yang transaksional dan dirancang khusus untuk konfigurasi jaringan.

```
Transport : SSH port 830
Data      : XML
Model     : YANG
```

### Konsep kunci: Datastore

```
running     → konfigurasi yang sedang aktif
candidate   → konfigurasi yang sedang disiapkan (belum aktif)
startup     → konfigurasi saat boot
```

**Alur transaksional:**
```
1. lock candidate datastore
2. edit-config → ubah candidate
3. validate → periksa validitas
4. commit → candidate menjadi running (ATOMIK — semua atau tidak ada)
5. unlock
```

> [!TIP]
> **Keunggulan NETCONF: transaksi atomik.** Kalau satu bagian gagal, seluruh perubahan di-rollback, jadi tidak ada keadaan setengah jadi. Ini jauh lebih aman daripada CLI scraping yang bisa gagal di tengah dan meninggalkan konfigurasi rusak.

### Operasi NETCONF

```
<get>              ambil data operasional + konfigurasi
<get-config>       ambil konfigurasi saja
<edit-config>      ubah konfigurasi
<copy-config>      salin antar-datastore
<delete-config>    hapus
<lock>/<unlock>    kunci datastore (mencegah konflik)
<commit>           terapkan candidate (kalau didukung)
<validate>         validasi tanpa menerapkan
```

### Contoh dengan ncclient (Python)

```python
from ncclient import manager

with manager.connect(host="192.168.1.1", port=830, username="admin",
                     password="password", hostkey_verify=False) as m:
    # Ambil konfigurasi interface
    filter = """
    <filter>
      <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces"/>
    </filter>"""
    config = m.get_config(source="running", filter=filter)
    print(config)

    # Ubah konfigurasi (transaksional)
    edit = """
    <config>
      <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
        <interface>
          <name>GigabitEthernet2</name>
          <description>Diubah via NETCONF</description>
        </interface>
      </interfaces>
    </config>"""
    m.edit_config(target="candidate", config=edit)
    m.commit()
```

---

## 5. RESTCONF

**RESTCONF** [RFC 8040] adalah NETCONF yang disederhanakan menjadi REST + JSON sehingga lebih mudah dipakai.

```
Transport : HTTPS
Data      : JSON atau XML
Model     : YANG (sama dengan NETCONF)
Method    : GET, POST, PUT, PATCH, DELETE (CRUD standar)
```

### URL mengikuti struktur YANG

```
https://<perangkat>/restconf/data/<module>:<container>/<list>=<key>

Contoh:
GET /restconf/data/ietf-interfaces:interfaces/interface=GigabitEthernet1
```

```bash
# GET semua interface
$ curl -sk -u admin:password \
    -H "Accept: application/yang-data+json" \
    https://192.168.1.1/restconf/data/ietf-interfaces:interfaces | jq

# PATCH — ubah satu interface
$ curl -sk -u admin:password -X PATCH \
    -H "Content-Type: application/yang-data+json" \
    -d '{
      "ietf-interfaces:interface": {
        "name": "GigabitEthernet2",
        "description": "Uplink-Core",
        "enabled": true
      }
    }' \
    https://192.168.1.1/restconf/data/ietf-interfaces:interface=GigabitEthernet2
```

| | **NETCONF** | **RESTCONF** |
|---|---|---|
| Transport | SSH 830 | HTTPS |
| Data | XML | JSON atau XML |
| Transaksi | Penuh (candidate, commit, rollback) | Terbatas (per-request) |
| Kompleksitas | Tinggi | Rendah |
| Untuk | Konfigurasi kompleks, transaksional | Interaksi sederhana, integrasi web |

> [!TIP]
> **Gunakan RESTCONF untuk kesederhanaan** (mudah dari skrip, tool web); **NETCONF untuk transaksi kompleks** yang butuh atomicity dan rollback.

---

## 6. YANG (Model Data)

**YANG** adalah bahasa untuk memodelkan data konfigurasi dan operasional. Ia mendefinisikan struktur yang dipakai NETCONF, RESTCONF, dan gNMI.

```
Analogi: YANG adalah "skema"; XML/JSON adalah "data" yang mengikutinya.
```

**Dua sumber model YANG:**
```
STANDAR (vendor-neutral):
  - IETF (ietf-interfaces, ietf-routing)
  - OpenConfig (openconfig-interfaces, openconfig-bgp)
    → satu model untuk banyak vendor!

VENDOR (native):
  - Cisco-IOS-XE-native, Cisco-NX-OS-device
  - Junos, Arista
    → akses penuh ke fitur vendor, tetapi tidak portabel
```

> [!TIP]
> **OpenConfig adalah model YANG multi-vendor.** Tujuannya satu model konfigurasi untuk semua vendor. Kalau perangkat mendukung OpenConfig, skrip yang sama bisa mengelola Cisco, Juniper, Arista, dll. Ini impian otomasi multi-vendor.

```bash
# Lihat model YANG yang didukung perangkat
$ curl -sk -u admin:pass \
    https://192.168.1.1/restconf/data/ietf-yang-library:modules-state | jq
```

---

## 7. gNMI dan Streaming Telemetry

**gNMI** (gRPC Network Management Interface) memakai gRPC (HTTP/2 + Protobuf). Protokol ini modern, cepat, dan mendukung streaming telemetry.

```
Transport : gRPC (HTTP/2)
Data      : Protobuf (efisien) atau JSON
Model     : YANG (OpenConfig)
Keamanan  : TLS + autentikasi
```

**Operasi gNMI:**
```
Capabilities → tanya kemampuan perangkat
Get          → ambil data
Set          → ubah konfigurasi
Subscribe    → STREAMING telemetry (push kontinu!)
```

> [!TIP]
> **`Subscribe` adalah keunggulan gNMI.** Perangkat mendorong data secara kontinu (setiap detik/sub-detik) alih-alih di-poll. Ini memberi granularitas yang tidak mungkin dengan SNMP, dan menangkap microburst serta transien (lihat `14-monitoring-troubleshooting/03`).

```bash
# gnmic (client gNMI populer)
$ gnmic -a 192.168.1.1:57400 -u admin -p password --skip-verify \
    get --path "/interfaces/interface[name=GigabitEthernet1]/state"

# Subscribe (streaming telemetry)
$ gnmic -a 192.168.1.1:57400 -u admin -p password --skip-verify \
    subscribe --path "/interfaces/interface/state/counters" \
    --stream-mode sample --sample-interval 10s
```

---

## 8. Postman dan curl untuk Eksplorasi

Sebelum menulis skrip, eksplorasi API secara interaktif.

```bash
# curl untuk RESTCONF
$ curl -sk -u admin:pass \
    -H "Accept: application/yang-data+json" \
    https://192.168.1.1/restconf/data/ietf-interfaces:interfaces | jq

# Lihat header dan status
$ curl -skv -u admin:pass https://192.168.1.1/restconf/ 2>&1 | head -30
```

> [!TIP]
> **Postman** memberi GUI untuk eksplorasi API: menyimpan koleksi request, mengelola autentikasi/token, dan menampilkan respons dengan rapi. Alat ini sangat berguna untuk memahami API perangkat/controller sebelum mengotomasinya. Alternatif CLI: **HTTPie** (`http`) yang lebih ramah daripada curl.

> [!WARNING]
> **`--skip-verify`/`-k` dan `verify=False` hanya untuk lab.** Di produksi, gunakan sertifikat yang tervalidasi, karena mematikan verifikasi TLS menghilangkan perlindungan terhadap MITM.

---

## 9. Alur Kerja: Dari CLI ke API

```
1. EKSPLORASI — pahami API dengan curl/Postman
   Apa endpoint-nya? Autentikasi apa? Format data?

2. AMBIL data (GET) — pastikan bisa membaca
   Verifikasi struktur JSON/XML yang dikembalikan

3. UBAH satu perangkat (PATCH/PUT) di LAB
   Verifikasi perubahan berhasil dan tidak merusak

4. SKRIP untuk banyak perangkat
   Netmiko/ncclient/requests + loop + error handling

5. IDEMPOTEN + testing
   Ansible/Terraform untuk deklaratif, dry-run dulu

6. CI/CD
   Git → test → deploy
```

---

## 10. Ringkasan

- Otomasi berkomunikasi dengan **data terstruktur** (JSON/YAML/XML), bukan output CLI untuk manusia.
- **JSON**: 6 tipe (string, number, boolean, null, object, array); kutip ganda, tanpa trailing comma, tanpa komentar. Format REST/RESTCONF.
- **YAML**: paling mudah dibaca, indentasi bermakna (spasi, bukan tab); hati-hati, `yes`/`1.10` bisa salah ditafsirkan, jadi pakai kutip. Format Ansible/K8s/config.
- **XML**: verbose, format NETCONF.
- **REST API**: CRUD ↔ POST/GET/PUT-PATCH/DELETE; autentikasi Basic (wajib HTTPS)/Bearer/API key/OAuth; JSON encoding.
- Model interaksi: **CLI scraping** (universal, rapuh), **SNMP** (monitoring), **NETCONF** (XML, transaksional), **RESTCONF** (JSON, sederhana), **gNMI** (gRPC, streaming).
- **NETCONF**: transaksional dengan candidate datastore + commit (atomik, rollback); lebih aman daripada CLI scraping.
- **RESTCONF**: NETCONF disederhanakan menjadi REST+JSON; mudah tetapi transaksi terbatas.
- **YANG** memodelkan struktur data; **OpenConfig** adalah model multi-vendor (impian otomasi lintas vendor).
- **gNMI** dengan **Subscribe** memberi streaming telemetry granular (push, bukan poll).
- **Eksplorasi dulu dengan curl/Postman** sebelum menulis skrip. Hati-hati: `--skip-verify` hanya untuk lab.

---

## 11. Latihan

1. Perbaiki JSON ini: `{'device': 'r1', "vlans": [10,20,], enabled: True,}`
2. Kenapa `version: 1.10` di YAML bisa bermasalah, dan bagaimana memperbaikinya?
3. Petakan operasi CRUD ke HTTP method.
4. Apa keunggulan utama NETCONF dibanding CLI scraping?
5. Kapan memakai RESTCONF dan kapan NETCONF?
6. Apa itu OpenConfig dan kenapa penting untuk otomasi multi-vendor?
7. Apa keunggulan gNMI Subscribe dibanding polling SNMP?
8. Kenapa `verify=False` berbahaya di produksi?

<details>
<summary>Jawaban</summary>

1. ```json
   {"device": "r1", "vlans": [10, 20], "enabled": true}
   ```
   Perbaikan: (a) tanda kutip tunggal `'device'` → ganda `"device"`; (b) key `enabled` tanpa kutip → diberi kutip `"enabled"`; (c) trailing comma setelah `20` (dalam array) dan setelah `True` (dalam object) dihapus; (d) `True` (Python-style) → `true` (JSON huruf kecil).

2. Di YAML, `version: 1.10` ditafsirkan sebagai number floating-point, dan number `1.10` sama dengan `1.1`: nol di belakang hilang. Jadi kalau Anda memaksudkan versi software "1.10" (versi kesepuluh minor), YAML akan membacanya sebagai "1.1" (versi pertama minor). Kesalahan ini halus dan berbahaya. Masalah serupa: `port: 022` mungkin ditafsirkan oktal, dan `enabled: yes` menjadi boolean `true`.
   **Perbaikan:** paksa interpretasi sebagai string dengan tanda kutip: `version: "1.10"`. Aturan umum: untuk nilai yang harus tetap sebagai string (versi, nomor telepon, ID yang berawalan nol, nilai yes/no yang bukan boolean), selalu gunakan kutip.

3. **Create → POST**, **Read → GET**, **Update → PUT** (ganti seluruhnya) atau **PATCH** (ubah sebagian), **Delete → DELETE**. Catatan: GET aman dan idempoten (tidak mengubah); PUT dan DELETE idempoten (mengulang menghasilkan keadaan sama); POST dan PATCH tidak idempoten (mengulang bisa membuat duplikat atau efek berbeda).

4. **Transaksi atomik.** NETCONF memakai model candidate datastore + commit: Anda menyiapkan seluruh perubahan di candidate, memvalidasinya, lalu commit. Kalau ada bagian yang gagal, SELURUH perubahan di-rollback, sehingga tidak ada keadaan setengah jadi. CLI scraping mengirim perintah satu per satu; kalau koneksi putus atau satu perintah gagal di tengah, perangkat bisa tertinggal dalam konfigurasi rusak sebagian yang sulit dipulihkan. Keunggulan lain NETCONF: data terstruktur (XML dengan model YANG) yang tidak rapuh terhadap perubahan format output antar-versi software (CLI scraping harus di-parse ulang setiap kali vendor mengubah format `show`), locking untuk mencegah konflik perubahan bersamaan, dan pemisahan jelas antara data konfigurasi dan operasional.

5. Gunakan **RESTCONF** untuk kesederhanaan dan integrasi: interaksi sederhana (baca status, ubah satu-dua setting), integrasi dengan tool web/skrip yang sudah berbicara HTTP+JSON, dan ketika Anda ingin memakai curl/Postman/requests tanpa library khusus. RESTCONF memakai HTTPS + JSON yang familiar bagi developer web.
   Gunakan **NETCONF** untuk konfigurasi kompleks dan transaksional: perubahan besar yang harus atomik (semua-atau-tidak-ada), yang butuh candidate datastore + validate + commit + rollback, locking untuk mencegah konflik, dan operasi yang tidak didukung RESTCONF pada perangkat tertentu. NETCONF lebih kuat tetapi lebih kompleks (XML, library ncclient).

6. **OpenConfig** adalah sekumpulan model data YANG yang netral-vendor, dikembangkan oleh operator jaringan besar (Google, dll) untuk mendefinisikan struktur konfigurasi dan telemetri yang sama di semua vendor. Tanpa OpenConfig, setiap vendor punya model native sendiri (Cisco-IOS-XE-native, Junos, dll), sehingga skrip otomasi harus ditulis ulang untuk setiap vendor.
   **Kenapa penting:** kalau perangkat Cisco, Juniper, dan Arista sama-sama mendukung model OpenConfig (mis. `openconfig-interfaces`, `openconfig-bgp`), maka satu skrip yang sama bisa mengonfigurasi ketiganya. Inilah impian otomasi multi-vendor, yang mengurangi lock-in dan kompleksitas. Dalam praktiknya, dukungan OpenConfig bervariasi antar-vendor dan tidak selalu lengkap, sehingga sering perlu campuran model OpenConfig (untuk yang umum) dan model native (untuk fitur spesifik vendor).

7. **gNMI Subscribe memakai model PUSH**: setelah klien berlangganan sekali, perangkat mendorong data secara kontinu (setiap detik atau sub-detik) tanpa diminta lagi. **SNMP memakai model PULL**: sistem monitoring harus meminta data berulang kali pada interval (biasanya 1-5 menit), dan setiap poll membebani CPU perangkat.
   Keunggulan Subscribe: (a) **granularitas jauh lebih halus**: data setiap detik/sub-detik memungkinkan menangkap microburst dan transien yang tidak terlihat SNMP; (b) **beban perangkat lebih rendah**: subscribe sekali, bukan poll terus-menerus; (c) **efisiensi**: Protobuf lebih ringkas daripada SNMP ASN.1, dan gRPC/HTTP2 lebih efisien; (d) **skalabilitas**: mendukung ribuan metrik dari ribuan perangkat; (e) **hanya kirim perubahan** (on-change subscription) atau sampel berkala sesuai kebutuhan. Ini menjadikan gNMI dasar streaming telemetry modern, meski SNMP masih dominan karena dukungan universal.

8. `verify=False` (di requests) atau `-k`/`--skip-verify` (di curl/gnmic) mematikan verifikasi sertifikat TLS. Ini menghilangkan perlindungan mendasar terhadap man-in-the-middle: klien tidak lagi memeriksa apakah ia benar-benar berbicara dengan perangkat yang dituju atau dengan penyerang yang menyamar. Penyerang di jalur bisa mencegat koneksi, menyajikan sertifikat palsu, menangkap kredensial (username/password/token yang dikirim), dan memodifikasi konfigurasi yang dikirim ke perangkat, semuanya tanpa terdeteksi.
   Di lab ini sering diperlukan karena perangkat memakai sertifikat self-signed. Di produksi, gunakan sertifikat yang ditandatangani CA yang tepercaya (atau CA internal yang dipasang di trust store klien), dan biarkan verifikasi aktif. Kalau memakai sertifikat internal, tunjuk CA bundle-nya (`verify="/path/ca.pem"` di requests) alih-alih mematikan verifikasi sepenuhnya. Kredensial otomasi sering punya hak tinggi, jadi mengeksposnya lewat MITM bisa berarti kompromi seluruh jaringan.

</details>

---

## 12. Sumber

- RFC 8259 (JSON) · YAML spec: https://yaml.org/
- RFC 6241 (NETCONF) · RFC 8040 (RESTCONF)
- RFC 7950 (YANG 1.1)
- OpenConfig: https://www.openconfig.net/
- gNMI: https://github.com/openconfig/gnmi
- Cisco CCNA 200-301 v1.1, topik 6.5 (REST API: authentication, CRUD, HTTP verbs, data encoding) dan 6.7 (JSON)
- gnmic: https://gnmic.openconfig.net/

---

**Berikutnya:** `15-otomasi/03-python-jaringan.md`. Python untuk otomasi jaringan.
