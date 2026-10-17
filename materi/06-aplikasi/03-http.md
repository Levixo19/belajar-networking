# 06.3 HTTP dan Layanan Web

> **Prasyarat:** `05-transport/02`, `05-transport/03`
> **Tujuan:** Anda paham anatomi HTTP, perbedaan HTTP/1.1-2-3, konsep REST/JSON (dibutuhkan untuk otomasi), serta peran proxy, load balancer, dan CDN.

---

## 1. Anatomi HTTP

HTTP adalah protokol **request-response** berbasis teks (HTTP/1.x) atau biner (HTTP/2, HTTP/3).

### Request

```
GET /api/users/42?verbose=true HTTP/1.1
Host: api.example.com
User-Agent: curl/8.4.0
Accept: application/json
Authorization: Bearer eyJhbGciOi...
Connection: keep-alive

<body — kosong untuk GET>
```

```
┌─ Request line ──────────────────────────────┐
│ METHOD  PATH?QUERY  VERSION                 │
├─ Headers ───────────────────────────────────┤
│ Nama: nilai                                 │
├─ Baris kosong ──────────────────────────────┤
├─ Body (opsional) ───────────────────────────┤
└─────────────────────────────────────────────┘
```

### Response

```
HTTP/1.1 200 OK
Date: Thu, 10 Sep 2026 07:22:01 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 87
Cache-Control: max-age=300
ETag: "a1b2c3"

{"id":42,"name":"Budi","email":"budi@example.com","role":"admin"}
```

### Method

| Method | Fungsi | Idempoten? | Aman? | Punya body? |
|---|---|---|---|---|
| **GET** | Ambil resource | Ya | Ya | Tidak |
| **HEAD** | Seperti GET tanpa body | Ya | Ya | Tidak |
| **POST** | Buat resource / kirim data | Tidak | Tidak | Ya |
| **PUT** | Ganti resource seluruhnya | Ya | Tidak | Ya |
| **PATCH** | Ubah sebagian resource | Tidak | Tidak | Ya |
| **DELETE** | Hapus resource | Ya | Tidak | Kadang |
| **OPTIONS** | Tanya kemampuan (dipakai CORS preflight) | Ya | Ya | Tidak |
| **CONNECT** | Buat tunnel (proxy HTTPS) | Tidak | Tidak | - |
| **TRACE** | Echo request (sebaiknya dimatikan) | Ya | Ya | Tidak |

**Aman (safe)** = tidak mengubah state server.
**Idempoten** = melakukannya berkali-kali punya efek yang sama seperti sekali. Penting karena klien boleh mengulang request idempoten setelah timeout.

### Status Code

| Kelas | Arti | Contoh penting |
|---|---|---|
| **1xx** | Informational | `101 Switching Protocols` (WebSocket) |
| **2xx** | Sukses | `200 OK`, `201 Created`, `204 No Content`, `206 Partial Content` |
| **3xx** | Redirection | `301 Moved Permanently`, `302 Found`, `304 Not Modified`, `307/308` (mempertahankan method) |
| **4xx** | Kesalahan **klien** | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `405 Method Not Allowed`, `409 Conflict`, `413 Payload Too Large`, `429 Too Many Requests` |
| **5xx** | Kesalahan **server** | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout` |

> [!WARNING]
> **Yang perlu dikuasai network engineer:**

| Kode | Artinya bagi Anda |
|---|---|
| **401** | Belum terautentikasi (kirim kredensial) |
| **403** | Sudah terautentikasi tetapi **tidak berhak** |
| **429** | Rate limit; periksa header `Retry-After` |
| **502 Bad Gateway** | Proxy/LB tidak bisa mencapai **backend** |
| **503 Service Unavailable** | Backend ada tetapi menolak (overload/maintenance) |
| **504 Gateway Timeout** | Backend **terlalu lambat** menjawab |

> [!TIP]
> **502/504 hampir selalu masalah di sisi backend atau jaringan antara LB dan backend**, bukan di klien.

### Header yang wajib dikenal

| Header | Fungsi |
|---|---|
| **Host** | Nama virtual host; **wajib** di HTTP/1.1 |
| **Content-Type** | Tipe MIME body |
| **Content-Length** | Panjang body |
| **Transfer-Encoding: chunked** | Body dikirim bertahap tanpa panjang yang diketahui di awal |
| **Connection: keep-alive/close** | Pertahankan atau tutup koneksi TCP |
| **Cache-Control** | Aturan cache (`max-age`, `no-cache`, `private`, `immutable`) |
| **ETag / If-None-Match** | Validasi cache → `304 Not Modified` |
| **Last-Modified / If-Modified-Since** | Validasi cache berbasis waktu |
| **Authorization** | Kredensial (Basic, Bearer) |
| **Set-Cookie / Cookie** | Sesi |
| **Location** | Tujuan redirect |
| **X-Forwarded-For / Forwarded** | IP klien asli di balik proxy |
| **X-Forwarded-Proto** | Skema asli (http/https) di balik proxy TLS-terminating |
| **Strict-Transport-Security** | HSTS: paksa HTTPS |
| **Alt-Svc** | Iklankan HTTP/3 |
| **Retry-After** | Kapan boleh mencoba lagi (dengan 429/503) |

> [!WARNING]
> **`X-Forwarded-For` bisa dipalsukan klien.** Load balancer harus **menimpa**, bukan menambahkan, header ini pada hop pertama. Kalau tidak, log Anda bisa berisi IP palsu dan kontrol berbasis IP bisa dilewati.

---

## 2. Evolusi HTTP

### HTTP/1.0 (1996)
- Satu koneksi TCP per request, sangat boros
- Tidak ada header `Host` → satu IP hanya bisa melayani satu situs

### HTTP/1.1 (1997, diperbarui RFC 9110-9112 pada 2022)
- **`Host` wajib** → virtual hosting (banyak situs di satu IP)
- **Keep-alive** default → koneksi dipakai ulang
- **Chunked transfer encoding** → streaming
- **Pipelining**: mengirim beberapa request tanpa menunggu. Fitur ini **gagal dalam praktik** karena head-of-line blocking dan dukungan proxy yang buruk, sehingga praktis tidak dipakai.

> [!WARNING]
> **Head-of-line blocking HTTP/1.1:** dalam satu koneksi, response harus dikirim **berurutan**. Request lambat menahan semua request setelahnya. Solusi browser: buka **6 koneksi paralel per host**, yang boros dan tetap terbatas.

### HTTP/2 (2015, RFC 9113)
- **Biner**, bukan teks
- **Multiplexing**: banyak stream dalam satu koneksi TCP, tanpa urutan
- **HPACK**: kompresi header (header berulang seperti cookie sangat besar di HTTP/1.1)
- **Stream priority**
- **Server push**: **sudah dicabut** dari Chrome karena jarang bermanfaat dan sering merugikan

> [!WARNING]
> **Head-of-line blocking berpindah ke TCP.** Satu paket TCP hilang → semua stream berhenti. Di jaringan dengan loss, HTTP/2 bisa lebih lambat daripada HTTP/1.1 dengan 6 koneksi.

### HTTP/3 (2022, RFC 9114)
- Berjalan di atas **QUIC/UDP**
- **Tidak ada head-of-line blocking antar-stream**
- **QPACK** (adaptasi HPACK untuk QUIC)
- **0-RTT** untuk koneksi berulang
- **Connection migration**

Detail QUIC ada di `05-transport/03`.

### Perbandingan ringkas

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Transport | TCP | TCP | **QUIC/UDP** |
| Format | Teks | Biner | Biner |
| Multiplexing | Tidak | Ya | Ya |
| HOL blocking | Ya (aplikasi) | Ya (TCP) | **Tidak** |
| Kompresi header | Tidak | HPACK | QPACK |
| Enkripsi | Opsional | Praktis wajib | **Wajib** |
| Koneksi per host | 6 | 1 | 1 |

---

## 3. Cookie, Sesi, dan CORS

### Cookie

```
Server → klien:
Set-Cookie: session=abc123; Path=/; Domain=example.com;
            Max-Age=3600; Secure; HttpOnly; SameSite=Lax

Klien → server (request berikutnya):
Cookie: session=abc123
```

| Atribut | Fungsi keamanan |
|---|---|
| **Secure** | Hanya dikirim lewat HTTPS |
| **HttpOnly** | Tidak bisa dibaca JavaScript → melindungi dari XSS |
| **SameSite=Strict/Lax/None** | Membatasi pengiriman lintas situs → melindungi dari CSRF |
| **Domain / Path** | Membatasi cakupan |
| **Max-Age / Expires** | Masa berlaku |

### CORS (Cross-Origin Resource Sharing)

Browser melarang JavaScript membaca respons dari **origin berbeda** (skema + host + port) kecuali server mengizinkannya secara eksplisit.

```
Preflight (untuk request non-sederhana):
  OPTIONS /api/data HTTP/1.1
  Origin: https://app.example.com
  Access-Control-Request-Method: POST

Response:
  Access-Control-Allow-Origin: https://app.example.com
  Access-Control-Allow-Methods: GET, POST, PUT
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400
```

> [!WARNING]
> **CORS adalah kontrol di browser, bukan keamanan server.** `curl` dan skrip mengabaikannya sepenuhnya. Jangan mengandalkan CORS untuk melindungi API.

> [!WARNING]
> `Access-Control-Allow-Origin: *` bersama `Access-Control-Allow-Credentials: true` **dilarang** oleh spesifikasi dan merupakan kesalahan konfigurasi yang berbahaya.

### Caching

```
Cache-Control: max-age=3600, public          ← boleh di-cache CDN selama 1 jam
Cache-Control: private, max-age=0            ← hanya cache browser
Cache-Control: no-store                      ← jangan simpan sama sekali
Cache-Control: no-cache                      ← simpan, tapi validasi dulu tiap kali
Cache-Control: immutable, max-age=31536000   ← untuk aset ber-hash (app.a1b2c3.js)
```

**Validasi cache** menghemat banyak bandwidth:
```
Klien : GET /style.css
        If-None-Match: "a1b2c3"
Server: 304 Not Modified          ← tanpa body! Hemat seluruh file
```

---

## 4. REST dan JSON: Fondasi Otomasi Jaringan

Ini bagian yang **wajib** untuk `15-otomasi` dan untuk CCNA topik 6.5-6.7.

### Prinsip REST

**REST** (*Representational State Transfer*) memetakan operasi CRUD ke HTTP method:

| Operasi | HTTP Method | Contoh URL | Status sukses |
|---|---|---|---|
| **Create** | POST | `POST /api/interfaces` | 201 Created |
| **Read** | GET | `GET /api/interfaces/gi0-1` | 200 OK |
| **Update** | PUT / PATCH | `PUT /api/interfaces/gi0-1` | 200 / 204 |
| **Delete** | DELETE | `DELETE /api/interfaces/gi0-1` | 204 No Content |

Ciri REST:
- **Stateless**: setiap request membawa semua informasi yang dibutuhkan
- **Resource-oriented**: URL menunjuk objek, bukan aksi
- Memakai status code HTTP secara semantik
- Representasi biasanya **JSON** (dulu XML)

### JSON: struktur yang wajib dikenali

```json
{
  "hostname": "SW-ACCESS-01",
  "uptime_seconds": 8640000,
  "management_ip": "192.168.99.11",
  "is_reachable": true,
  "software_version": null,
  "interfaces": [
    {
      "name": "GigabitEthernet0/1",
      "enabled": true,
      "vlan": 10,
      "description": "PC-Finance-01",
      "counters": { "input_errors": 0, "crc": 0 }
    },
    {
      "name": "GigabitEthernet0/24",
      "enabled": true,
      "mode": "trunk",
      "allowed_vlans": [10, 20, 30]
    }
  ]
}
```

**Enam tipe data JSON:**
| Tipe | Contoh |
|---|---|
| **String** | `"SW-ACCESS-01"` (selalu tanda kutip ganda) |
| **Number** | `8640000`, `3.14`, `-5` (tanpa tanda kutip) |
| **Boolean** | `true`, `false` (huruf kecil) |
| **Null** | `null` |
| **Object** | `{ "key": value }` |
| **Array** | `[1, 2, 3]` |

> [!WARNING]
> **Kesalahan JSON yang sering (dan sering muncul di soal ujian):**
```json
❌ { 'name': 'sw1' }        ← tanda kutip TUNGGAL tidak valid
❌ { "name": "sw1", }       ← koma di akhir (trailing comma) tidak valid
❌ { name: "sw1" }          ← key harus dalam tanda kutip
❌ { "enabled": True }      ← harus huruf kecil: true
❌ // komentar              ← JSON TIDAK punya komentar
✅ { "name": "sw1", "enabled": true, "vlan": 10 }
```

### YAML: alternatif yang lebih mudah dibaca

Dipakai oleh Ansible, Kubernetes, dan Containerlab.

```yaml
hostname: SW-ACCESS-01
management_ip: 192.168.99.11
is_reachable: true
interfaces:
  - name: GigabitEthernet0/1
    enabled: true
    vlan: 10
  - name: GigabitEthernet0/24
    mode: trunk
    allowed_vlans: [10, 20, 30]
```

> [!WARNING]
> **YAML sensitif terhadap indentasi** dan **tidak boleh memakai tab**; pakai spasi saja.

### Autentikasi API

| Metode | Cara | Catatan |
|---|---|---|
| **Basic** | `Authorization: Basic base64(user:pass)` | Hati-hati: Base64 **bukan enkripsi**, jadi wajib HTTPS |
| **Bearer token** | `Authorization: Bearer <token>` | Umum; token dari login/OAuth |
| **API key** | Header khusus (`X-API-Key`) atau query param | Sederhana; jangan taruh di URL (tercatat di log) |
| **OAuth 2.0** | Alur token dengan refresh | Untuk delegasi akses |
| **mTLS** | Sertifikat klien | Paling kuat; dipakai di lingkungan zero trust |

### Contoh: REST API perangkat jaringan

```bash
# Login untuk mendapat token (contoh Cisco IOS-XE RESTCONF)
$ curl -k -X POST https://192.168.1.1/restconf/data/ \
    -H "Content-Type: application/yang-data+json" \
    -u admin:password

# GET daftar interface
$ curl -k -u admin:password \
    -H "Accept: application/yang-data+json" \
    https://192.168.1.1/restconf/data/ietf-interfaces:interfaces | jq

# Ubah deskripsi interface (PATCH)
$ curl -k -u admin:password -X PATCH \
    -H "Content-Type: application/yang-data+json" \
    -d '{"ietf-interfaces:interface":{"description":"Uplink-Core"}}' \
    https://192.168.1.1/restconf/data/ietf-interfaces:interface=GigabitEthernet1
```

```python
import requests

s = requests.Session()
s.auth = ("admin", "password")
s.verify = False        # hanya untuk lab! di produksi pakai CA yang benar
s.headers.update({"Accept": "application/yang-data+json"})

r = s.get("https://192.168.1.1/restconf/data/ietf-interfaces:interfaces")
r.raise_for_status()
for intf in r.json()["ietf-interfaces:interfaces"]["interface"]:
    print(intf["name"], intf.get("description", ""))
```

Detail lengkap otomasi di `15-otomasi/02` dan `15-otomasi/03`.

---

## 5. WebSocket, SSE, dan gRPC

| Teknologi | Arah | Transport | Untuk |
|---|---|---|---|
| **WebSocket** | Dua arah penuh | Upgrade dari HTTP (`101 Switching Protocols`) | Chat, dashboard real-time, game |
| **SSE** (Server-Sent Events) | Server → klien saja | HTTP biasa, `text/event-stream` | Notifikasi, streaming log |
| **gRPC** | Dua arah, streaming | **HTTP/2** + Protocol Buffers | RPC antar-layanan, **telemetri jaringan (gNMI)** |
| **Long polling** | Simulasi push | HTTP biasa | Fallback lama |

> [!TIP]
> **gRPC penting untuk network engineer** karena **gNMI** (gRPC Network Management Interface) adalah standar modern untuk **streaming telemetry**: perangkat mendorong data secara kontinu alih-alih di-poll SNMP (`14-monitoring-troubleshooting/03`, `15-otomasi/02`).

---

## 6. Proxy, Reverse Proxy, Load Balancer, CDN

### Forward Proxy

```
[Klien] → [Proxy] → [Internet]
```
Bertindak atas nama **klien**. Kegunaan: filtering konten, caching, anonimisasi, kontrol akses, audit.

### Reverse Proxy

```
[Internet] → [Reverse Proxy] → [Server backend]
```
Bertindak atas nama **server**. Kegunaan: TLS termination, caching, kompresi, load balancing, WAF, menyembunyikan topologi backend.

### Load Balancer: L4 vs L7

| | **L4 (Transport)** | **L7 (Application)** |
|---|---|---|
| Keputusan berdasarkan | IP + port | URL, header, cookie, method |
| Melihat isi? | Tidak | Ya |
| TLS | Passthrough atau termination | Biasanya termination |
| Kinerja | Sangat cepat | Lebih berat |
| Fitur | Sederhana | Routing berbasis path, sticky session, rewrite |
| Contoh | AWS NLB, IPVS, HAProxy mode tcp | AWS ALB, nginx, HAProxy mode http, Envoy |

### Algoritma load balancing

| Algoritma | Cara kerja |
|---|---|
| **Round robin** | Bergiliran |
| **Weighted round robin** | Bergiliran dengan bobot berbeda |
| **Least connections** | Ke server dengan koneksi paling sedikit |
| **Least response time** | Ke server tercepat |
| **IP hash** | Hash IP klien → server tetap (session affinity sederhana) |
| **Consistent hashing** | Meminimalkan perpindahan saat server ditambah/dihapus (penting untuk cache) |

### Health check: bagian terpenting

```
Passive : perhatikan error dari trafik nyata
Active  : kirim probe berkala

Level:
  L3 : ping             ← lemah, server bisa hidup tetapi aplikasi mati
  L4 : buka koneksi TCP ← lebih baik
  L7 : GET /healthz     ← TERBAIK — memeriksa aplikasi sungguhan
```

> [!WARNING]
> **Health check yang terlalu dangkal adalah penyebab umum outage.** Server yang menjawab ping tetapi database-nya mati akan tetap menerima trafik. Selalu pakai health check L7 yang memeriksa dependensi kritis.

### Contoh nginx sebagai reverse proxy + LB

```nginx
upstream backend {
    least_conn;
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 backup;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    listen 443 quic reuseport;          # HTTP/3
    server_name app.example.com;

    ssl_certificate     /etc/ssl/certs/app.crt;
    ssl_certificate_key /etc/ssl/private/app.key;
    ssl_protocols       TLSv1.2 TLSv1.3;

    add_header Alt-Svc 'h3=":443"; ma=86400';
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout    30s;
    }

    location /healthz {
        access_log off;
        return 200 "ok\n";
    }
}
```

### CDN (Content Delivery Network)

Server cache tersebar secara geografis, diarahkan lewat **anycast** atau **GeoDNS**.

```
Tanpa CDN : Pengguna Jakarta → server di Virginia → RTT 250 ms
Dengan CDN: Pengguna Jakarta → edge Jakarta → RTT 5 ms
```

Manfaat: latency jauh lebih rendah, beban origin berkurang drastis, mitigasi DDoS, TLS termination di edge.

**Konsep penting:**
- **Origin**: server asal
- **Edge / PoP**: node cache terdekat pengguna
- **Cache hit ratio**: persentase permintaan yang dilayani dari cache
- **Purge / invalidation**: menghapus konten dari cache
- **Origin shield**: lapisan cache perantara untuk melindungi origin

---

## 7. Diagnostik HTTP

```bash
# Header saja
$ curl -I https://example.com

# Verbose penuh (termasuk TLS)
$ curl -v https://example.com

# Ikuti redirect dan tampilkan setiap langkah
$ curl -ILv https://example.com

# Ukur waktu setiap fase — SANGAT BERGUNA
$ curl -o /dev/null -s -w '
dns      : %{time_namelookup}s
connect  : %{time_connect}s
tls      : %{time_appconnect}s
ttfb     : %{time_starttransfer}s
total    : %{time_total}s
code     : %{http_code}
size     : %{size_download} bytes
' https://example.com

# Paksa versi HTTP tertentu
$ curl --http1.1 -I https://example.com
$ curl --http2   -I https://example.com
$ curl --http3   -I https://example.com

# Uji virtual host tanpa mengubah DNS
$ curl -H "Host: app.example.com" http://10.0.1.10/

# Lewati resolusi DNS, tuju IP tertentu
$ curl --resolve app.example.com:443:10.0.1.10 https://app.example.com/

# POST JSON
$ curl -X POST https://api.example.com/users \
    -H 'Content-Type: application/json' \
    -d '{"name":"Budi","role":"admin"}'

# Tampilkan hanya status code
$ curl -o /dev/null -s -w '%{http_code}\n' https://example.com

# jq untuk memproses JSON
$ curl -s https://api.example.com/devices | jq '.[] | {name, ip}'
$ curl -s https://api.example.com/devices | jq -r '.[] | select(.status=="down") | .name'
```

### Membaca `curl -v`
```
* Trying 93.184.216.34:443...              ← DNS selesai, mulai TCP
* Connected to example.com port 443        ← TCP handshake selesai
* TLSv1.3 (OUT), TLS handshake, ClientHello
* TLSv1.3 (IN), TLS handshake, ServerHello
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* Server certificate:
*  subject: CN=example.com
*  expire date: Dec  1 23:59:59 2026 GMT
*  issuer: C=US; O=Let's Encrypt; CN=R3
> GET / HTTP/2                             ← request
> Host: example.com
< HTTP/2 200                               ← response
< content-type: text/html
```

### Wireshark
```
http                          ← HTTP/1.x (plaintext saja)
http2
http.response.code >= 400
http.request.method == "POST"
tls.handshake.type == 1       ← ClientHello
tls.handshake.extensions_server_name == "example.com"   ← SNI
```

> [!WARNING]
> HTTPS terenkripsi, sehingga Wireshark hanya melihat **SNI** (nama host di ClientHello) kecuali Anda punya kunci sesi (`SSLKEYLOGFILE`).

---

## 8. Streaming Video Adaptif (ABR): HLS dan DASH

Sebagian besar video yang ditonton lewat internet hari ini bukan aliran RTP real-time, melainkan **adaptive bitrate streaming (ABR)** di atas HTTP biasa. Prinsipnya sederhana. Penyedia mengodekan satu video ke beberapa bitrate dan resolusi (misalnya 0,5; 1,2; 2,5; 5 Mbps), memotong masing-masing menjadi **segmen** pendek berdurasi beberapa detik, dan menyimpannya sebagai berkas yang disajikan server web atau CDN. Pemutar mengunduh daftar varian lalu mengunduh segmen satu per satu; sambil jalan ia mengukur kecepatan unduh dan isi buffer, dan memilih varian untuk segmen berikutnya. Kalau throughput turun, ia pindah ke bitrate lebih rendah alih-alih berhenti.

Ada dua format yang dominan. **HLS (HTTP Live Streaming)** dijelaskan di RFC 8216 (Agustus 2017, kategori Informational). Ada **Master (Multivariant) Playlist** yang memuat daftar varian dengan tag `EXT-X-STREAM-INF`; atribut `BANDWIDTH` wajib dan berisi bitrate puncak segmen dalam bit per detik. Setiap varian menunjuk ke **Media Playlist** berisi urutan segmen, dengan `EXT-X-TARGETDURATION` sebagai batas atas durasi segmen. Segmen berformat MPEG-2 Transport Stream atau fragmented MP4. Pada siaran langsung, pemutar memuat ulang Media Playlist secara berkala untuk menemukan segmen baru. **MPEG-DASH** (ISO/IEC 23009-1) memakai ide yang sama dengan manifest XML bernama **MPD (Media Presentation Description)**, dan segmen berbasis ISO Base Media File Format atau MPEG-2 TS.

```
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=640x360
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000,RESOLUTION=1280x720
720p/index.m3u8
```

Pengaruhnya ke jaringan ada di empat hal. **Pertama, karena segmen hanyalah berkas HTTP, ia bisa di-cache CDN** (bagian 6): hit ratio tinggi berarti origin hanya melayani sebagian kecil permintaan. **Kedua, trafik ABR elastis dan berbuffer.** Pemutar menyimpan beberapa detik video, sehingga toleran terhadap delay dan jitter (sesuai baris "Video streaming" pada tabel kebutuhan aplikasi di `11-wan-vpn/03-qos`); ia tidak perlu prioritas ketat seperti VoIP. Cukup kelas dengan jaminan bandwidth, bukan *priority queue* yang bisa menggusur kelas lain. **Ketiga, polanya bergelombang:** pemutar mengunduh segmen secepat mungkin lalu menunggu, sehingga jalur melihat burst periodik, dan banyak penonton pada satu bottleneck saling bersaing sambil menaik-turunkan bitrate. Shaping per pelanggan akhirnya menentukan varian yang stabil di sisi pemutar. **Keempat, latensi siaran langsung ditentukan oleh durasi segmen kali jumlah segmen yang disimpan di buffer.** Contoh: segmen 6 detik dan 3 segmen di buffer berarti sekitar 18 detik di belakang siaran asli; ada ekstensi latensi rendah untuk menurunkannya.

Untuk troubleshooting, periksa dari sisi klien dengan `curl`: ambil master playlist (`curl -s https://cdn.contoh.id/video/master.m3u8`), unduh satu segmen dan lihat waktunya (`curl -o /dev/null -s -w '%{time_total} %{speed_download}\n' https://cdn.contoh.id/video/720p/seg001.ts`), dan baca header cache (`curl -I`) untuk melihat apakah segmen datang dari edge. Segmen yang butuh waktu lebih lama daripada durasinya adalah tanda throughput kurang dari bitrate varian itu.

---

## 9. Kesalahan Umum

> [!WARNING]
> **1. Mengira 502/504 adalah masalah klien.** Keduanya berarti proxy/LB bermasalah menghubungi backend.

> [!WARNING]
> **2. Mengandalkan CORS sebagai keamanan.** CORS hanya berlaku di browser; `curl` mengabaikannya.

> [!WARNING]
> **3. Mempercayai `X-Forwarded-For` dari klien.** LB harus menimpanya di hop pertama.

> [!WARNING]
> **4. Health check yang hanya ping.** Server hidup tetapi aplikasi mati tetap menerima trafik.

> [!WARNING]
> **5. Trailing comma atau tanda kutip tunggal di JSON.** Parser akan menolak.

> [!WARNING]
> **6. Menaruh API key di query string.** Tercatat di log akses, riwayat browser, dan Referer header.

> [!WARNING]
> **7. Mengira Base64 pada Basic Auth adalah enkripsi.** Itu hanya encoding, jadi tetap wajib HTTPS.

---

## 10. Ringkasan

- HTTP = request (method + path + version + headers + body) dan response (status + headers + body).
- Method **aman** tidak mengubah state; **idempoten** boleh diulang. GET/PUT/DELETE idempoten; POST/PATCH tidak.
- Status: 4xx salah klien, 5xx salah server. **502** = LB tidak bisa mencapai backend, **503** = backend menolak, **504** = backend terlalu lambat.
- HTTP/1.1: `Host` wajib, keep-alive, HOL blocking di aplikasi. HTTP/2: biner, multiplexing, HPACK, **HOL blocking berpindah ke TCP**. HTTP/3: QUIC, tanpa HOL blocking, 0-RTT.
- Cookie aman butuh `Secure`, `HttpOnly`, `SameSite`. **CORS adalah kontrol browser, bukan keamanan server.**
- **REST**: CRUD ↔ POST/GET/PUT-PATCH/DELETE, stateless, resource-oriented, JSON.
- **JSON**: 6 tipe (string, number, boolean, null, object, array); tanda kutip ganda, tanpa trailing comma, tanpa komentar.
- Autentikasi API: Basic (butuh HTTPS), **Bearer token**, API key, OAuth 2.0, mTLS.
- **gRPC/HTTP2** adalah dasar **gNMI** untuk streaming telemetry.
- Load balancer **L4** (IP+port, cepat) vs **L7** (URL/header, kaya fitur). **Gunakan health check L7.**
- **CDN** memangkas latency dengan mendekatkan konten; memakai anycast/GeoDNS.
- **ABR (HLS/DASH)** = video dipotong jadi segmen HTTP berbitrate banyak (RFC 8216: master playlist + media playlist, `BANDWIDTH` = puncak bitrate), pemutar memilih varian per segmen. Trafiknya elastis, berbuffer, bergelombang, dan sangat cocok dengan **CDN**; tidak perlu priority queue seperti VoIP.

---

## 11. Latihan

1. Apa perbedaan 401 dan 403? Apa yang harus dilakukan klien pada masing-masing?
2. Pengguna melapor situs menampilkan "502 Bad Gateway". Di mana Anda mulai mencari masalah?
3. Jelaskan mengapa HTTP/2 bisa lebih lambat daripada HTTP/1.1 pada jaringan dengan packet loss tinggi.
4. Perbaiki JSON ini: `{'device': 'sw1', "vlans": [10,20,], enabled: True,}`
5. Method HTTP mana yang idempoten, dan kenapa itu penting bagi klien yang mengalami timeout?
6. Sebuah load balancer memakai health check ping. Server backend hidup tetapi database-nya mati. Apa yang terjadi dan bagaimana memperbaikinya?
7. Kenapa `Access-Control-Allow-Origin: *` bersama `Access-Control-Allow-Credentials: true` berbahaya?
8. Anda perlu menguji apakah backend `10.0.1.10` melayani situs `app.example.com` dengan benar, tanpa mengubah DNS. Bagaimana caranya?
9. Platform video punya 2.000 penonton serentak dengan bitrate rata-rata 3 Mbps dan hit ratio CDN 90%. Hitung trafik total dari edge dan trafik yang sampai ke origin. Lalu jelaskan mengapa trafik ABR tidak sebaiknya dimasukkan ke priority queue seperti VoIP dan apa penyebab latensi siaran langsung HLS dengan segmen 6 detik dan 3 segmen di buffer.

<details>
<summary>Jawaban</summary>

1. **401 Unauthorized** berarti klien **belum terautentikasi**: kredensial tidak ada, salah, atau kedaluwarsa. Klien harus mengirimkan kredensial (respons biasanya menyertakan header `WWW-Authenticate`). **403 Forbidden** berarti klien **sudah teridentifikasi tetapi tidak berhak** mengakses resource itu. Mengirim ulang kredensial yang sama tidak akan membantu; klien perlu izin yang berbeda.

2. **502 berarti proxy/load balancer tidak bisa mendapat respons yang sah dari backend.** Mulai dari sisi LB ke belakang: (a) apakah proses backend berjalan? (`systemctl status`, `ss -tulnp`); (b) apakah LB bisa mencapai backend? (`curl` dari LB ke IP backend, cek firewall/security group/routing); (c) apakah backend crash atau kehabisan resource? (log aplikasi, OOM killer, koneksi database); (d) apakah health check menandai semua backend down? (e) apakah backend mengirim respons yang tidak valid? Klien dan jaringan internet **bukan** tempat memulai.

3. HTTP/2 memultipleks semua stream dalam **satu koneksi TCP**. TCP menjamin urutan byte untuk seluruh koneksi, sehingga satu paket yang hilang menahan semua stream sampai retransmisi tiba (head-of-line blocking di TCP). HTTP/1.1 membuka **6 koneksi TCP paralel** per host; kehilangan paket di satu koneksi hanya memblokir 1/6 trafik, sementara 5 koneksi lain terus mengalir. Karena itu pada jaringan dengan loss tinggi (seluler buruk, Wi-Fi padat), HTTP/1.1 kadang terasa lebih responsif. HTTP/3 menyelesaikan ini dengan loss recovery per stream di QUIC.

4. ```json
   {"device": "sw1", "vlans": [10, 20], "enabled": true}
   ```
   Perbaikan: tanda kutip tunggal → ganda; trailing comma setelah `20` dan setelah `True` dihapus; key `enabled` diberi tanda kutip; `True` → `true` (huruf kecil).

5. **Idempoten: GET, HEAD, PUT, DELETE, OPTIONS, TRACE.** **Tidak idempoten: POST, PATCH.**
   Ini penting karena ketika klien mengalami **timeout**, ia tidak tahu apakah request sudah diproses server atau hilang di jalan. Untuk method idempoten, klien **aman mengulangnya** karena hasil akhirnya sama. Untuk POST, mengulang bisa membuat dua resource duplikat (mis. dua pesanan). Karena itu API yang baik menyediakan **idempotency key** untuk POST, dan proxy/LB hanya boleh melakukan retry otomatis pada method idempoten.

6. Health check L3 (ping) hanya memverifikasi bahwa **host dan stack IP-nya hidup**, bukan bahwa aplikasinya berfungsi. Load balancer akan terus mengirim trafik ke server itu, dan setiap request akan gagal (500/503), sehingga sebagian pengguna mengalami error meski server lain sehat.
   **Perbaikan:** gunakan health check **L7** yang memanggil endpoint khusus (mis. `GET /healthz`) yang **memeriksa dependensi kritis**: koneksi database, cache, antrean. Endpoint mengembalikan 200 hanya jika aplikasi benar-benar siap melayani. Tambahkan juga `max_fails`/`fail_timeout` agar backend yang gagal segera dikeluarkan dari rotasi.

7. Kombinasi itu akan berarti "izinkan **situs mana pun** membaca respons ini **beserta cookie/kredensial pengguna**". Artinya, situs jahat mana pun bisa membuat request terautentikasi atas nama pengguna dan **membaca hasilnya**, mencuri data pribadi. Karena bahayanya, **spesifikasi CORS melarang** kombinasi ini: browser akan menolak respons dengan `Allow-Origin: *` jika `Allow-Credentials: true`. Yang benar: sebutkan origin secara eksplisit (`Access-Control-Allow-Origin: https://app.example.com`) dan validasi origin di sisi server terhadap daftar putih.

8. Dua cara:
   ```bash
   # (a) Override header Host — menguji virtual host routing (HTTP)
   $ curl -H "Host: app.example.com" http://10.0.1.10/

   # (b) --resolve — menguji lengkap dengan TLS & SNI yang benar (HTTPS)
   $ curl --resolve app.example.com:443:10.0.1.10 -v https://app.example.com/
   ```
   Cara (b) lebih baik untuk HTTPS karena curl tetap mengirim **SNI** dan memverifikasi sertifikat untuk `app.example.com`, sementara koneksi TCP diarahkan ke `10.0.1.10`. Cara (a) tidak cocok untuk HTTPS karena sertifikat akan dianggap tidak cocok.

9. Total dari edge = 2.000 x 3 Mbps = **6.000 Mbps = 6 Gbps**. Yang lolos ke origin = 10% (miss) x 6 Gbps = **600 Mbps**. ABR tidak perlu priority queue karena trafiknya berbasis HTTP (TCP/QUIC), elastis, dan **berbuffer**: pemutar menahan beberapa detik video dan menurunkan bitrate bila throughput turun, sehingga toleran terhadap delay dan jitter; priority queue justru bisa menggusur kelas lain dan perlu di-policing. Tempatkan di kelas dengan jaminan bandwidth (CBWFQ atau queue biasa). Latensi siaran langsung = durasi segmen x jumlah segmen di buffer = 6 s x 3 = **sekitar 18 detik** di belakang sumber, belum termasuk waktu encoding dan CDN.

</details>

---

## 12. Sumber

- RFC 9110, HTTP Semantics · RFC 9111, HTTP Caching · RFC 9112, HTTP/1.1
- RFC 9113, HTTP/2 · RFC 9114, HTTP/3 · RFC 9204, QPACK
- RFC 6265bis, Cookies (SameSite)
- RFC 8259, JSON
- RFC 8040, RESTCONF
- Cisco CCNA 200-301 v1.1, topik 6.5 (REST API: authentication, CRUD, HTTP verbs, data encoding) dan 6.7 (komponen JSON)
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/HTTP
- RFC 8216, HTTP Live Streaming (Agustus 2017, Informational): https://www.rfc-editor.org/rfc/rfc8216
- ISO/IEC 23009-1, Dynamic adaptive streaming over HTTP (DASH), Part 1: Media presentation description and segment formats: https://www.iso.org/standard/89027.html

---

**Berikutnya:** `06-aplikasi/04-tls-pki.md`. Bagaimana komunikasi diamankan.
