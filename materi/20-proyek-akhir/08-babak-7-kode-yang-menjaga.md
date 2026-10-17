# 20.8 Babak 7: Kode yang Menjaga

> **Prasyarat:** `20.7`, ditambah `15` (otomasi) dan `14` (monitoring & troubleshooting)
> **Tujuan:** Mengubah 23 lokasi yang dikelola dengan tangan menjadi sesuatu yang dikelola dengan kode, dan membuat rantai dingin punya alarm yang **terbukti berbunyi** — bukan alarm yang diasumsikan berbunyi.

---

## 1. Bentuk Kerja Babak Ini

Babak ini menghasilkan **berkas yang bisa dijalankan**, bukan dokumen. Penilaiannya pun oleh mesin:

| Kriteria lulus | Cara membuktikan |
|---|---|
| Playbook idempoten | Jalankan dua kali; jalannya yang kedua harus `changed=0` |
| Skrip audit kepatuhan bekerja | Sengaja rusakkan satu perangkat → skrip keluar dengan kode ≠ 0 dan menunjuk barisnya |
| Templat menghasilkan konfigurasi sah | Konfigurasi hasil generate bisa dimuat di lab Babak 4 |
| Alarm benar-benar berbunyi | Matikan satu sensor → notifikasi sampai ≤ 5 menit, tercatat waktunya |
| Penyimpangan konfigurasi terdeteksi | Ubah satu baris di perangkat secara manual → laporan menyebutnya dalam 24 jam |

> [!NOTE]
> Mode Ujian: 4 jam. Bahasa bebas — Python + Ansible adalah jalur yang paling banyak dipakai di industri, tetapi skrip RouterOS, `netmiko`, atau `pyats` juga sah bila hasilnya memenuhi kriteria di atas.

> [!TIP]
> Kenapa babak ini penting untuk BNS secara khusus: satu engineer tidak mungkin merawat 20 TPI dengan tangan. Bukan karena malas — karena **konfigurasi yang disalin tangan pasti menyimpang**, dan penyimpangan itulah yang menjadi gangguan jam 3 pagi (Anda akan mengalaminya di Babak 8).

---

## 2. Bagian A: Sumber Kebenaran

Buat `11-otomasi/inventory/` berisi data, bukan konfigurasi. Aturannya: **setiap fakta hanya boleh ditulis satu kali di satu tempat.**

```yaml
# 11-otomasi/inventory/sites.yml
sites:
  jkt-hq:
    code: JKT
    role: hq
    ipv4_block: <<dari Babak 3>>
    ipv6_prefix: <<dari Babak 3>>
    ntp_role: <<primary|client>>
  sby-plant:
    code: SBY
    role: plant
    ipv4_block: <<...>>
    ot_zone: true
  tpi-04:
    code: TPI04
    role: tpi
    ipv4_block: <<10.72.4.0/24>>
    wan: lte
    behind_cgnat: true
    wg_peer_prefix: <<...>>
# ... 20 TPI: apakah Anda menulisnya 20 kali, atau membangkitkannya dari pola?

vlans:
  - id: 10
    name: staf
    zone: user
  - id: 70
    name: sensor-rantai-dingin
    zone: coldchain
    dhcp_lease: <<dari Babak 3>>
  # ...
```

> [!WARNING]
> Pertanyaan yang menentukan nilai Anda di bagian ini: **apakah menambah TPI ke-21 memerlukan perubahan di lebih dari satu berkas?** Kalau ya, rancangan data Anda belum benar.

---

## 3. Bagian B: Templat Konfigurasi

Dua templat minimum. Semua nilai harus datang dari inventory, tidak ada yang ditulis keras.

```jinja
{# 11-otomasi/templates/tpi-mikrotik.j2 #}
/system identity set name={{ site.code }}-RTR01
/system ntp client set enabled=yes servers={{ ntp_servers | join(',') }}
{% for v in vlans if v.id in site.vlans %}
/interface vlan add name=vlan{{ v.id }}-{{ v.name }} vlan-id={{ v.id }} interface=bridge1
/ip address add address={{ site | subnet_for(v.id) | gateway_ip }} interface=vlan{{ v.id }}-{{ v.name }}
/ip pool add name=pool-{{ v.id }} ranges={{ site | subnet_for(v.id) | dhcp_range }}
/ip dhcp-server add name=dhcp-{{ v.id }} interface=vlan{{ v.id }}-{{ v.name }} \
    address-pool=pool-{{ v.id }} lease-time={{ v.dhcp_lease }}
{% endfor %}
/interface wireguard peers add interface=wg-hq public-key="{{ hub.pubkey }}" \
    endpoint-address={{ hub.public_ip }} endpoint-port={{ hub.port }} \
    allowed-address={{ hub.allowed | join(',') }} persistent-keepalive={{ hub.keepalive }}
{# <<lengkapi: aturan firewall, MSS clamp, logging jarak jauh, penjadwal cadangan>> #}
```

```jinja
{# 11-otomasi/templates/cisco-access.j2 #}
hostname {{ site.code }}-ACC-{{ '%02d' % switch.index }}
{% for v in vlans if v.id in site.vlans %}
vlan {{ v.id }}
 name {{ v.name }}
{% endfor %}
{# <<lengkapi: port akses, port-security, portfast+bpduguard, trunk dengan native VLAN buangan, dhcp snooping, SVI manajemen, NTP, syslog, SNMPv3>> #}
```

---

## 4. Bagian C: Playbook yang Aman Dijalankan Berulang

```yaml
# 11-otomasi/playbooks/push-tpi.yml
- name: Terapkan konfigurasi standar TPI
  hosts: tpi
  gather_facts: false
  serial: <<berapa perangkat sekaligus? beri alasan>>
  tasks:
    - name: Cadangkan konfigurasi berjalan sebelum menyentuh apa pun
      # <<tugas ini wajib pertama, dan hasilnya wajib keluar dari perangkat>>

    - name: Bangkitkan konfigurasi yang diinginkan dari templat
      # <<render ke berkas lokal, jangan langsung kirim>>

    - name: Bandingkan dengan yang berjalan dan tampilkan perbedaannya
      # <<--check dan --diff harus berarti sesuatu>>

    - name: Terapkan hanya perbedaannya
      # <<idempoten: menjalankan dua kali tidak menghasilkan perubahan>>

    - name: Verifikasi setelah menerapkan
      # <<uji, bukan asumsi: terowongan hidup? NTP sinkron? sensor terjangkau?>>

    - name: Kembalikan bila verifikasi gagal
      # <<blok rescue: kembalikan cadangan lalu hentikan pekerjaan dengan jelas>>
```

**Syarat yang harus dipenuhi:**

- `--check` benar-benar tidak mengubah apa pun (uji dengan menjalankannya pada perangkat produksi lab).
- `serial` dipilih sadar — kalau 20 TPI diubah serentak dan templatnya salah, 20 lokasi mati bersamaan. Tulis alasan angka yang Anda pilih.
- Ada langkah verifikasi **setelah** perubahan, dan ada jalur kembali bila verifikasi gagal.
- Kredensial **tidak** berada di dalam repositori. Putuskan mekanismenya (vault terenkripsi, variabel lingkungan, atau pengelola rahasia) dan tulis alasannya — ini sekaligus menjawab keluhan Mbak Sari di `20.1`.

---

## 5. Bagian D: Audit Kepatuhan sebagai Kode

Ubah daftar periksa hardening Babak 6 menjadi program. Daftar periksa yang dibaca manusia akan dilewati; program tidak.

```python
#!/usr/bin/env python3
"""audit.py — memeriksa perangkat terhadap standar BNS.
Keluar dengan kode 0 bila semua lulus, 1 bila ada temuan.
Dipakai manual maupun di CI dan penjadwal harian."""
import sys

CHECKS = [
    # (id, deskripsi, tingkat, fungsi pemeriksa)
    ("H01", "Tidak ada telnet/ftp/http aktif",              "kritis", None),
    ("H02", "Password unik per perangkat (bukan seragam)",  "kritis", None),
    ("H03", "NTP dikonfigurasi dan tersinkronisasi",        "kritis", None),
    ("H04", "Syslog jarak jauh mengarah ke pengumpul pusat","tinggi", None),
    ("H05", "SNMPv3, bukan community v2c",                  "tinggi", None),
    ("H06", "Port akses: portfast + bpduguard aktif",       "tinggi", None),
    ("H07", "Native VLAN trunk bukan VLAN 1",               "tinggi", None),
    ("H08", "Port tidak terpakai dimatikan",                "sedang", None),
    ("H09", "Cadangan konfigurasi < 7 hari",                "tinggi", None),
    ("H10", "Versi perangkat lunak didukung vendor",        "sedang", None),
    # <<tambahkan sampai minimal 20, ambil dari daftar periksa Babak 6>>
]

def audit(host):
    """Kembalikan daftar temuan untuk satu host."""
    # <<kumpulkan keadaan lewat SSH/API (netmiko, RouterOS REST, napalm),
    #   lalu jalankan tiap pemeriksa. Jangan mem-parsing dengan asumsi rapuh:
    #   satu perangkat yang formatnya beda tidak boleh membuat skrip diam-diam lulus.>>
    return []

def main():
    findings = []
    for host in <<daftar host dari inventory>>:
        findings += audit(host)
    for f in findings:
        print(f"{f['tingkat'].upper():8} {f['host']:20} {f['id']} {f['deskripsi']}")
    print(f"\n{len(findings)} temuan")
    return 1 if findings else 0

if __name__ == "__main__":
    sys.exit(main())
```

> [!WARNING]
> Jebakan yang membuat skrip audit berbahaya: **kegagalan senyap.** Bila perangkat tidak bisa dihubungi, atau keluarannya tidak sesuai dugaan pemroses teks Anda, skrip tidak boleh menganggapnya "lulus". Perangkat yang tidak bisa diperiksa adalah **temuan**, bukan ketiadaan temuan. Buktikan sifat ini dengan sengaja mematikan satu perangkat lalu menjalankan skripnya.

---

## 6. Bagian E: Alur CI

```yaml
# 11-otomasi/ci/pipeline.yml (konsep; sesuaikan dengan alat yang Anda pakai)
tahap:
  - name: lint
    # <<periksa sintaks YAML/Jinja, dan validasi skema inventory:
    #   subnet tumpang tindih? VLAN ganda? TPI tanpa blok alamat?
    #   Pakai skrip pemeriksa tumpang tindih dari Babak 3 §6.1 di sini.>>
  - name: render
    # <<bangkitkan konfigurasi semua perangkat, simpan sebagai artefak>>
  - name: uji-di-lab
    # <<muat konfigurasi hasil render ke topologi lab, jalankan sebagian
    #   matriks uji terima Babak 4 secara otomatis>>
  - name: diff-produksi
    # <<tampilkan perbedaan terhadap yang berjalan — untuk dibaca manusia>>
  - name: persetujuan
    # <<gerbang manual: tidak ada perubahan produksi tanpa seseorang menekan setuju>>
  - name: terapkan
    # <<hanya untuk cabang utama, hanya di jendela perubahan yang diizinkan>>
```

Tiga sifat yang dinilai: **(a)** tahap `lint` menangkap kesalahan rencana alamat sebelum menyentuh perangkat; **(b)** ada gerbang manusia sebelum produksi; **(c)** perubahan produksi tidak bisa terjadi di luar jendela yang disepakati dengan Bu Ratna.

---

## 7. Bagian F: Observability sebagai Kode

### 7.1 Tetapkan SLO dulu, alarm kemudian

Isi tabel ini di `10-observability.md`. Angkanya milik Anda, tapi harus bisa dipertahankan.

| # | SLI (apa yang diukur) | Target | Anggaran kesalahan | Kenapa angka ini |
|---|---|---|---|---|
| S1 | Kelengkapan data suhu: proporsi interval 5 menit yang punya ≥ 1 sampel, per sensor | <<?>> | <<menit/bulan>> | batas auditor 15 menit |
| S2 | Waktu sampai alarm (dari sensor diam sampai notifikasi terkirim), persentil 95 | <<?>> | — | <<?>> |
| S3 | Ketersediaan ERP pada jam kerja | <<?>> | <<?>> | <<?>> |
| S4 | Data TPI sampai ke pusat dalam jendela tertentu | <<?>> | <<?>> | TPI boleh menyangga, tidak boleh kehilangan |
| S5 | Sinkronisasi waktu: proporsi perangkat dengan selisih < 1 detik | <<?>> | <<?>> | bukti butuh penanda waktu sah |

> [!TIP]
> Bedakan **SLI kesehatan bisnis** dari **metrik perangkat**. "CPU switch 40%" bukan SLO; "bukti suhu tidak bolong" adalah SLO. Alarm pada yang pertama membangunkan Anda tanpa alasan; alarm pada yang kedua membangunkan Anda tepat waktu.

### 7.2 Aturan alarm

Tulis sebagai kode (contoh bergaya PromQL; sesuaikan dengan alat Anda):

```yaml
groups:
  - name: rantai-dingin
    rules:
      - alert: SensorSuhuDiam
        expr: <<tidak ada sampel dari sensor selama > N menit — pakai fungsi "absent" yang benar>>
        for: <<?>>
        labels: { severity: kritis, tim: jaga }
        annotations:
          runbook: <<tautan ke runbook di §7.4>>
          summary: "Sensor {{ $labels.sensor }} di {{ $labels.lokasi }} tidak mengirim data"

      - alert: SuhuMelewatiBatas
        expr: <<suhu > -18 selama periode tertentu, dengan toleransi buka pintu>>
        # <<kenapa perlu toleransi? pintu cold storage memang dibuka tiap hari>>

      - alert: AntreanDataMenumpuk
        expr: <<kedalaman antrean di pengumpul lokal > ambang>>
        # <<gejala dini WAN bermasalah, muncul sebelum data hilang>>

      - alert: WaktuTidakSinkron
        expr: <<selisih waktu perangkat > 1 detik>>
        # <<ingat: ini akar tiket T-902>>

      - alert: CadanganGagalAtauKapasitasHabis
        expr: <<pekerjaan cadangan tidak sukses dalam 26 jam, atau kapasitas > 85%>>

      - alert: PenyimpanganKonfigurasi
        expr: <<hasil audit.py menemukan temuan kritis>>

      - alert: PemantauanMati        # <<lihat latihan nomor 4>>
        expr: <<?>>
```

### 7.3 Aturan menulis alarm yang tidak akan diabaikan

Setiap alarm harus lulus lima pertanyaan. Tuliskan jawabannya untuk masing-masing alarm Anda:

- Apakah ini **gejala** yang dirasakan pengguna/bisnis, atau sekadar penyebab yang mungkin?
- Apakah seseorang harus **bertindak sekarang**? Kalau tidak, ini laporan harian, bukan alarm.
- Siapa yang menerimanya pada jam 03:00, dan lewat jalur apa bila jaringan sedang bermasalah?
- Apa **runbook**-nya?
- Berapa kali alarm ini diperkirakan berbunyi per bulan? (Lebih dari 4 kali untuk hal yang sama = alarm Anda akan diabaikan manusia.)

### 7.4 Runbook

Minimal tiga runbook, masing-masing satu halaman, berisi: gejala · dampak bisnis · langkah pemeriksaan berurutan · kapan meningkatkan ke atasan · apa yang **tidak** boleh dilakukan. Wajib ada: **sensor suhu diam**, **satu TPI hilang kontak**, **suhu melewati batas**.

### 7.5 Uji alarm terjadwal (paling penting)

```bash
# 11-otomasi/uji-alarm.sh — dijalankan sebulan sekali, hasilnya dicatat
# 1. Catat waktu mulai
# 2. Matikan satu sensor di ruang yang disepakati (bergilir tiap bulan)
# 3. Tunggu notifikasi; catat waktu sampai notifikasi diterima
# 4. Hidupkan kembali; pastikan data tersusul tanpa celah
# 5. Simpan hasil: tanggal, sensor, waktu deteksi, lulus/gagal
```

> [!WARNING]
> Alarm yang belum pernah diuji adalah alarm yang **kemungkinan besar tidak berfungsi**. Ada banyak cara alarm gagal diam-diam: aturan yang salah tulis sehingga tidak pernah cocok, jalur notifikasi yang kedaluwarsa, penerima yang sudah resign, atau pemantauan yang melewati jaringan yang sedang mati. Di BNS, alarm yang tidak berbunyi berharga Rp 1,2 miliar per kontainer.

---

## 8. Ringkasan

- Otomasi dimulai dari **data**, bukan dari skrip. Inventory yang benar membuat templat jadi sederhana.
- Idempotensi bukan kemewahan: ia yang membuat perubahan aman dijalankan ulang saat panik.
- Perubahan serentak ke semua lokasi adalah cara tercepat memadamkan seluruh perusahaan; `serial` dan verifikasi adalah sabuk keselamatan.
- Daftar periksa keamanan yang tidak dijalankan mesin akan menjadi dokumen yang tidak dibaca siapa pun.
- Skrip audit yang menganggap "tidak bisa dihubungi" sebagai "lulus" lebih berbahaya daripada tidak ada skrip.
- Alarm dibuat dari SLO, SLO dibuat dari kebutuhan bisnis — dan seluruh rantai itu harus **diuji secara berkala**, bukan dipercaya.

---

## 9. Latihan: Menguji Kode Anda Sendiri

1. Jelaskan apa arti idempoten pada konteks konfigurasi jaringan, berikan satu contoh perintah/tugas yang **tampak** idempoten tetapi sebenarnya tidak, dan jelaskan cara Anda membuktikan playbook Anda idempoten.
2. Anda menjalankan `push-tpi.yml` ke 20 TPI, dan templatnya mengandung satu kesalahan pada aturan firewall yang memutus terowongan setelah diterapkan. Jelaskan apa yang akan terjadi pada masing-masing pilihan `serial` (semua sekaligus, 5 sekaligus, 1 sekaligus), lalu rancang mekanisme yang membuat kesalahan seperti ini **tidak mungkin** melumpuhkan lebih dari satu lokasi.
3. Kenapa alarm sebaiknya dipasang pada gejala ("data suhu tidak masuk") alih-alih pada penyebab ("tautan WAN pabrik mati")? Berikan satu kasus di BNS di mana alarm penyebab akan membangunkan Anda tanpa perlu, dan satu kasus di mana alarm penyebab akan **gagal** membangunkan Anda padahal seharusnya.
4. Siapa yang mengawasi pengawas? Rancang mekanisme yang memastikan Anda tahu bila **sistem pemantauan itu sendiri** mati, dan jelaskan kenapa mekanisme itu tidak boleh berjalan di infrastruktur yang sama.
5. Tim IT BNS memakai satu password untuk semua perangkat karena takut lupa. Rancang penggantinya yang memenuhi tiga syarat sekaligus: tim tetap bisa masuk pada jam 3 pagi, password tidak seragam, dan otomasi tetap bisa berjalan tanpa manusia. Sebutkan juga cara masuk darurat bila sistem rahasia itu sendiri tidak bisa diakses.

<details>
<summary>Jawaban</summary>

1. Idempoten berarti **menjalankan operasi yang sama berulang kali menghasilkan keadaan akhir yang sama, dan setelah jalan pertama tidak ada perubahan lagi**. Ini penting karena otomasi jaringan sering dijalankan ulang: setelah gangguan, setelah perangkat diganti, atau ketika seseorang tidak yakin apakah tadi sudah jalan. Contoh yang **tampak** idempoten tetapi tidak: `/ip firewall filter add ...` pada RouterOS — setiap kali dijalankan, aturan baru ditambahkan, sehingga sepuluh kali menjalankan menghasilkan sepuluh aturan duplikat yang urutannya bisa mengubah perilaku; padanannya di Cisco adalah menambahkan baris ACL tanpa nomor urut, atau `snmp-server community` yang menumpuk. Contoh lain yang lebih halus: tugas yang memakai `shell`/`command` untuk "memastikan" sesuatu tetapi selalu melaporkan `changed` walau tidak ada yang berubah — itu **bukan** melanggar idempotensi keadaan, tetapi merusak kemampuan Anda mendeteksi perubahan nyata, sehingga uji "jalan kedua harus `changed=0`" menjadi tidak berarti. Cara membuktikan: jalankan playbook dua kali berturut-turut pada lab dan pastikan ringkasan jalan kedua menunjukkan `changed=0` untuk semua host; lalu jalankan sekali lagi dengan `--check --diff` dan pastikan tidak ada perbedaan yang dilaporkan; terakhir, bandingkan konfigurasi berjalan sebelum dan sesudah jalan kedua (hash/diff) untuk memastikan benar-benar tidak ada yang tersentuh. Pola yang membuat idempoten: **bangkitkan keadaan yang diinginkan secara utuh, bandingkan dengan yang berjalan, terapkan hanya perbedaannya** — atau pakai modul yang memang menyatakan keadaan (bukan perintah), dan untuk aturan berurutan seperti firewall, kelola sebagai satu blok bernama yang diganti seluruhnya, bukan ditambahkan satu-satu.

2. Akibat per pilihan: **(a) semua sekaligus** — dalam beberapa detik, 20 TPI kehilangan terowongan; karena semuanya di belakang CGNAT dan satu-satunya jalur masuk Anda adalah terowongan itu sendiri, Anda **kehilangan akses ke seluruh lokasi secara serentak** dan pemulihannya memerlukan orang di 20 lokasi (yang bisa berarti perjalanan berhari-hari ke pesisir), sementara data suhu berhenti mengalir dan batas 15 menit terlewati di semua lokasi bersamaan. **(b) 5 sekaligus** — 5 lokasi mati; bila verifikasi berjalan sebelum kelompok berikutnya, kerusakan berhenti di 5; bila tidak, semuanya tetap mati, hanya lebih lambat. **(c) 1 sekaligus** — 1 lokasi mati, pekerjaan berhenti bila ada pemeriksaan, dan Anda memperbaiki templat sebelum menyentuh yang lain. Mekanisme yang membuat kesalahan ini tidak mungkin melumpuhkan lebih dari satu lokasi: **(i) lokasi kelinci percobaan** — selalu terapkan ke satu TPI yang paling mudah dijangkau secara fisik terlebih dahulu, tunggu satu periode pengamatan, baru lanjut; **(ii) `serial: 1` dengan `any_errors_fatal` dan langkah verifikasi wajib** (terowongan hidup, NTP sinkron, sensor terjangkau) yang menghentikan pekerjaan begitu satu lokasi gagal; **(iii) jaring pengaman di perangkat** — mekanisme "terapkan lalu kembalikan sendiri bila tidak dikonfirmasi": jadwalkan pemulihan otomatis konfigurasi sebelumnya beberapa menit ke depan, dan batalkan jadwal itu hanya bila Anda masih bisa masuk setelah perubahan (pola *commit confirmed*; di RouterOS bisa dengan penjadwal yang memulihkan cadangan, di perangkat lain ada mekanisme bawaan); **(iv) jalur akses cadangan yang tidak melewati jalur yang sedang diubah** — misalnya SMS/SSH lewat jalur seluler terpisah, atau setidaknya satu lokasi dengan akses fisik yang mudah; **(v) uji di lab lebih dulu**, yang justru menangkap kesalahan ini sebelum menyentuh produksi (itulah gunanya tahap `uji-di-lab` di CI). Pelajaran umum: **otomasi memperbesar kecepatan Anda, termasuk kecepatan merusak** — jadi sabuk keselamatannya harus dibangun bersamaan, bukan ditambahkan setelah kejadian pertama.

3. Karena **gejala adalah hal yang benar-benar merugikan bisnis, sedangkan penyebab hanya salah satu dari banyak jalan menuju gejala itu.** Alarm gejala menangkap semua jalan sekaligus, termasuk yang belum Anda bayangkan. Kasus di BNS di mana alarm penyebab membangunkan Anda tanpa perlu: **tautan WAN pabrik mati 3 menit pada 02:00**, sementara pengumpul lokal menyangga data dan mengirimnya saat jalur pulih — tidak ada data yang hilang, tidak ada kepatuhan yang terancam, tidak ada yang perlu dilakukan malam itu; alarm "WAN mati" membangunkan Anda untuk sesuatu yang sudah selesai sendiri, dan setelah beberapa kali, Anda akan mematikan alarm itu — lalu suatu hari mematikannya justru ketika penting. Kasus di mana alarm penyebab **gagal** membangunkan Anda: **sensor di ruang beku 2 mati karena baterainya habis pada suhu −25 °C**, atau kolam DHCP sensor habis sehingga sensor tidak mendapat alamat, atau proses pengumpul lokal berhenti, atau jam perangkat melompat sehingga data ditolak — pada semua kejadian ini **WAN sehat, perangkat jaringan sehat, semua lampu hijau**, dan alarm berbasis penyebab diam sementara bukti suhu Anda sedang bolong. Karena itu alarm utama harus: *"tidak ada sampel suhu dari sensor X selama N menit"* — gejala yang memiliki arti bisnis langsung. Alarm penyebab tetap berguna, tetapi turunkan tingkatnya: jadikan **peringatan untuk jam kerja** atau masukkan ke laporan harian, dan pakai sebagai **konteks** yang ditempelkan pada alarm gejala supaya petugas jaga tahu harus melihat ke mana. Pasangan yang ideal: alarm gejala untuk membangunkan, metrik penyebab untuk mendiagnosis.

4. Mekanismenya **pengawas mati (dead man's switch)**, yaitu kebalikan dari alarm biasa: sistem pemantauan Anda mengirim **denyut berkala** ("saya hidup, dan saya masih memeriksa") ke pihak ketiga; pihak ketiga itulah yang berbunyi **ketika denyut berhenti datang**. Dengan begitu, kegagalan pemantauan bukan lagi keadaan senyap. Denyutnya harus bermakna: bukan sekadar "prosesnya berjalan", tetapi "saya baru saja berhasil mengevaluasi aturan alarm dan membaca data sensor terakhir" — kalau tidak, pemantauan yang hidup tapi buta akan tetap mengirim denyut. Kenapa tidak boleh berjalan di infrastruktur yang sama: karena **kegagalan bersama** (correlated failure) — bila pemantauan, jaringan, listrik, virtualisasi, dan sistem notifikasi berada pada infrastruktur yang sama, satu kejadian mematikan pengamat dan yang diamati sekaligus, dan Anda tidak tahu apa pun tepat pada saat Anda paling perlu tahu. Di BNS praktisnya: layanan pengawas mati eksternal (di luar lokasi, di luar jaringan BNS) untuk denyut pemantauan pabrik dan pusat; **jalur notifikasi alternatif** yang tidak bergantung internet situs (SMS lewat modem GSM lokal, atau sirene/lampu fisik di ruang jaga produksi yang dikendalikan pengumpul lokal); catu daya cadangan untuk pengumpul lokal dan modem GSM-nya; dan satu aturan operasional: **petugas jaga wajib melihat indikator "data terakhir masuk" pada awal setiap giliran** — pemeriksaan manusia yang murah, yang menangkap kegagalan yang lolos dari semua mekanisme otomatis. Tambahkan juga uji bulanan dari §7.5 sebagai pembuktian berkala bahwa seluruh rantai ini masih hidup.

5. Rancangan penggantinya bertingkat. **(a) Autentikasi terpusat sebagai jalur utama:** semua perangkat jaringan diarahkan ke AAA terpusat (RADIUS/TACACS+ terhubung ke direktori perusahaan), sehingga setiap anggota tim masuk dengan **akunnya sendiri** — tidak ada password yang perlu diingat per perangkat, tidak ada akun bersama, dan setiap tindakan bisa dilacak ke orangnya (syarat penting untuk ISO 27001). Password jam 3 pagi bukan masalah karena yang diingat hanya satu kredensial pribadi, idealnya dengan MFA. **(b) Kredensial lokal darurat yang unik per perangkat:** tetap ada akun lokal di setiap perangkat — karena kalau AAA tidak terjangkau, Anda tidak boleh terkunci — dengan **password berbeda per perangkat yang dibangkitkan acak** dan disimpan di pengelola rahasia bersama (vault) yang bisa dibuka anggota tim yang berwenang dari ponsel; yang diingat manusia hanyalah cara membuka vault. **(c) Otomasi tanpa manusia:** playbook dan skrip audit tidak memakai password manusia, melainkan **akun layanan tersendiri** dengan hak seminimal mungkin, sebaiknya dengan **kunci SSH atau token** alih-alih password, kredensialnya diambil saat berjalan dari vault/variabel lingkungan CI (tidak pernah masuk repositori), dan diputar berkala secara otomatis. Pisahkan akun layanan **baca-saja** untuk audit dan pemantauan dari akun **tulis** untuk penerapan — sehingga kebocoran kredensial pemantauan tidak berarti kendali atas jaringan. **(d) Jalur masuk darurat bila vault sendiri tidak bisa diakses:** simpan satu set kredensial pemulihan (akun lokal perangkat inti, kunci pemulihan vault) dalam bentuk tercetak di **amplop tersegel di dua lokasi fisik terpisah** (misalnya lemari besi HQ dan pabrik), dengan prosedur: penggunaannya memerlukan dua orang, dicatat, dan **seluruh kredensial diputar segera setelah dipakai**. Lengkapi dengan akses konsol di luar jalur (out-of-band) untuk perangkat inti, sehingga kegagalan jaringan tidak membuat Anda kehilangan cara masuk. Yang membuat rancangan ini bisa diterima Mbak Sari: ia tidak perlu mengingat apa pun yang baru — ia justru mengingat **lebih sedikit** daripada sekarang.

</details>

---

## 10. Rubrik Babak 7 (120 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Inventory sebagai sumber kebenaran | 15 | Menambah TPI ke-21 hanya menyentuh satu tempat |
| Templat menghasilkan konfigurasi sah | 20 | Bisa dimuat di lab, tidak ada nilai ditulis keras |
| Playbook idempoten & aman | 25 | `changed=0` pada jalan kedua, `serial` beralasan, ada verifikasi + jalur kembali |
| Skrip audit kepatuhan | 20 | ≥ 20 pemeriksaan, kode keluar benar, tidak ada kegagalan senyap |
| Alur CI dengan gerbang manusia | 10 | Lint menangkap kesalahan rencana alamat sebelum menyentuh perangkat |
| SLO & aturan alarm | 20 | Berbasis gejala, punya runbook, perkiraan frekuensi masuk akal |
| Uji alarm terjadwal & hasilnya | 10 | Benar-benar dijalankan, waktu deteksi dicatat |

---

## 11. Sumber

- `15-otomasi/03-python-jaringan.md` sampai `05-netbox-cicd.md`
- `14-monitoring-troubleshooting/03-observability.md`, `02-tools.md`
- Dokumentasi Ansible (modul jaringan), Jinja2, netmiko/napalm, RouterOS REST API
- Google SRE Book — bab *Service Level Objectives* dan *Practical Alerting* (asal prinsip alarm berbasis gejala)
- `19-mikrotik/07-monitoring-scripting.md` — penjadwal & skrip RouterOS

---

**Berikutnya:** `20-proyek-akhir/09-babak-8-malam-panjang.md`. Pukul 22:14, ponsel Anda berbunyi.
