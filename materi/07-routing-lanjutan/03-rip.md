# 07.3 — RIP

> **Prasyarat:** `07-routing-lanjutan/02`
> **Tujuan:** Anda memahami RIP sebagai contoh konkret distance vector, bisa mengonfigurasinya, dan tahu kenapa ia tidak dipakai lagi di produksi.

> 💡 **Kenapa masih mempelajari RIP?** Tiga alasan: (a) ia contoh distance vector yang paling mudah dipahami; (b) masih muncul di ujian sertifikasi; (c) Anda mungkin menemuinya di jaringan warisan. Anda **tidak** akan mendesain jaringan baru dengan RIP.

---

## 1. Karakteristik RIP

| Aspek | Nilai |
|---|---|
| Jenis | Distance vector |
| Metrik | **Hop count** (1–15; **16 = tak terjangkau**) |
| Administrative Distance | **120** |
| Update | Setiap **30 detik**, penuh (seluruh routing table) |
| Transport | **UDP port 520** (RIPng: 521) |
| Tujuan | Broadcast `255.255.255.255` (v1) / Multicast **`224.0.0.9`** (v2) |
| Algoritma | Bellman-Ford |
| Skala maksimum | 15 hop → jaringan kecil saja |

### Timer RIP

| Timer | Default | Fungsi |
|---|---|---|
| **Update** | 30 detik | Interval pengiriman routing table |
| **Invalid** | 180 detik | Tanpa update selama ini → rute ditandai tidak valid (metrik 16) |
| **Holddown** | 180 detik | Abaikan informasi baru tentang rute ini |
| **Flush** | 240 detik | Hapus rute dari tabel |

⚠️ **Konvergensi RIP bisa memakan 3–5 menit.** Ini tidak dapat diterima di jaringan modern.

---

## 2. RIPv1 vs RIPv2 vs RIPng

| | **RIPv1** | **RIPv2** | **RIPng** |
|---|---|---|---|
| RFC | 1058 | 2453 | 2080 |
| Classful/classless | **Classful** | **Classless** (VLSM ✅) | Classless |
| Subnet mask dikirim? | ❌ Tidak | ✅ Ya | ✅ Ya |
| Pengiriman | Broadcast | **Multicast 224.0.0.9** | Multicast FF02::9 |
| Autentikasi | ❌ | ✅ (plaintext/MD5) | Memakai IPsec |
| Untuk | IPv4 (usang) | IPv4 | **IPv6** |

⚠️ **RIPv1 tidak mengirimkan subnet mask** — karena itu tidak mendukung VLSM dan tidak boleh dipakai sama sekali. Kalau menemuinya di jaringan warisan, upgrade ke v2.

---

## 3. Konfigurasi

### RIPv2

```
R1(config)# router rip
R1(config-router)# version 2
R1(config-router)# no auto-summary            ← WAJIB! (lihat penjelasan di bawah)
R1(config-router)# network 192.168.1.0
R1(config-router)# network 10.0.0.0
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gi0/1
```

⚠️ **Perintah `network` di RIP memakai alamat CLASSFUL.** Anda tidak bisa menyebut subnet spesifik:
```
R1(config-router)# network 10.1.1.0
   → IOS mengubahnya secara diam-diam menjadi: network 10.0.0.0
   → RIP aktif di SEMUA interface dalam 10.0.0.0/8
```
Ini sering mengejutkan: Anda bermaksud mengaktifkan RIP di satu subnet, tetapi ia aktif di semuanya.

⚠️ **`no auto-summary` wajib.** Dengan auto-summary aktif, RIP meringkas rute ke batas classful saat melintasi batas jaringan mayor — menyebabkan routing salah pada jaringan discontiguous:
```
Dengan auto-summary:
  R1 punya 10.1.1.0/24, R2 punya 10.2.2.0/24, dipisah oleh 192.168.1.0/24
  → Keduanya mengiklankan "10.0.0.0/8"
  → Router bingung, trafik dibuang atau salah arah
```

### Autentikasi

```
R1(config)# key chain RIP-KEYS
R1(config-keychain)# key 1
R1(config-keychain-key)# key-string RahasiaKuat

R1(config)# interface gi0/1
R1(config-if)# ip rip authentication mode md5
R1(config-if)# ip rip authentication key-chain RIP-KEYS
```

### Default route
```
R1(config-router)# default-information originate
```

### RIPng (IPv6)
```
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 router rip RIPPROC
R1(config)# interface gi0/1
R1(config-if)# ipv6 rip RIPPROC enable
```
⚠️ RIPng tidak memakai perintah `network` — diaktifkan **per interface**.

### Verifikasi

```
R1# show ip route rip
R    192.168.20.0/24 [120/2] via 10.0.0.2, 00:00:12, GigabitEthernet0/1
                      │   │
                      │   └── metrik: 2 hop
                      └── AD 120

R1# show ip protocols
Routing Protocol is "rip"
  Sending updates every 30 seconds, next due in 12 seconds
  Invalid after 180 seconds, hold down 180, flushed after 240
  Redistributing: rip
  Default version control: send version 2, receive version 2
  Automatic network summarization is not in effect
  Maximum path: 4
  Routing for Networks:
    10.0.0.0
    192.168.1.0
  Distance: (default is 120)

R1# debug ip rip                 ← lihat update secara langsung
R1# undebug all
```

---

## 4. Kelemahan RIP

| Kelemahan | Dampak |
|---|---|
| **Maksimum 15 hop** | Jaringan besar tidak mungkin |
| **Metrik hanya hop count** | Jalur 2 hop × 10 Mbps dipilih daripada 3 hop × 10 Gbps |
| **Konvergensi 3–5 menit** | Tidak dapat diterima |
| **Update penuh setiap 30 detik** | Boros bandwidth |
| **Rentan loop** | Butuh split horizon, poison reverse, holddown |
| **Load balancing terbatas** | Hanya equal-cost, maksimum 4 (bisa 6) jalur |
| **Tidak ada konsep area** | Semua router bertukar semuanya |

**Contoh konkret pemilihan jalur yang buruk:**
```
Jalur A: R1 → R2 → tujuan          (2 hop, semuanya link 10 Mbps)
Jalur B: R1 → R3 → R4 → tujuan     (3 hop, semuanya link 10 Gbps)

RIP  memilih A (2 < 3)  ❌ 1000× lebih lambat
OSPF memilih B (cost jauh lebih kecil) ✅
```

---

## 5. Ringkasan

- RIP: distance vector, metrik **hop count** (maks 15), **AD 120**, UDP 520, update penuh setiap 30 detik.
- Timer: update 30, invalid 180, holddown 180, flush 240 → konvergensi 3–5 menit.
- **RIPv1 classful (jangan dipakai)**; **RIPv2 classless** dengan multicast 224.0.0.9 dan autentikasi; **RIPng** untuk IPv6, diaktifkan per interface.
- Perintah `network` memakai alamat **classful** — mengaktifkan RIP di semua interface dalam jaringan mayor itu.
- **`no auto-summary` wajib** untuk mendukung jaringan discontiguous.
- Kelemahan fatal: metrik hop count mengabaikan bandwidth, konvergensi sangat lambat, batas 15 hop.
- **Jangan pakai di jaringan baru.** Pahami untuk ujian dan jaringan warisan.

---

## 6. Latihan

1. Kenapa RIP memilih jalur dengan bandwidth rendah jika hop-nya lebih sedikit?
2. Anda mengetik `network 10.1.1.0` di RIP. Apa yang sebenarnya terjadi?
3. Kenapa `no auto-summary` diperlukan?
4. Sebuah jaringan RIP butuh 4 menit untuk pulih setelah link putus. Jelaskan dari mana angka itu berasal.
5. Sebutkan tiga alasan konkret untuk memigrasikan jaringan RIP ke OSPF.

<details>
<summary>Jawaban</summary>

1. Karena metrik RIP **hanya menghitung jumlah hop**, tanpa mempertimbangkan bandwidth, delay, atau beban link. Bagi RIP, satu hop melalui link serial 64 kbps setara dengan satu hop melalui link 100 Gbps. Ini kelemahan mendasar yang tidak bisa diperbaiki dalam desain RIP, dan menjadi alasan utama OSPF (yang memakai cost berbasis bandwidth) menggantikannya.

2. IOS **mengubahnya secara diam-diam menjadi `network 10.0.0.0`** — alamat classful dari 10.1.1.0 (kelas A). Akibatnya RIP diaktifkan pada **semua interface** yang alamatnya berada dalam `10.0.0.0/8`, bukan hanya subnet 10.1.1.0/24 yang Anda maksud. Ini bisa mengaktifkan RIP di interface yang menghadap pengguna atau pihak eksternal tanpa disadari. Mitigasi: gunakan `passive-interface default` lalu aktifkan eksplisit hanya di interface yang diinginkan.

3. Dengan **auto-summary aktif**, RIP secara otomatis meringkas rute ke batas classful ketika mengiklankannya melintasi batas jaringan mayor. Pada jaringan **discontiguous** — misalnya `10.1.1.0/24` di satu sisi dan `10.2.2.0/24` di sisi lain, dipisahkan oleh `192.168.1.0/24` — kedua router akan mengiklankan ringkasan `10.0.0.0/8` yang identik. Router penerima tidak bisa membedakan subnet mana ada di arah mana, sehingga trafik dikirim ke arah yang salah atau di-load-balance secara keliru. `no auto-summary` mempertahankan prefix asli sehingga routing benar.

4. Waktu itu berasal dari **rantai timer RIP**: setelah link putus, router yang kehilangan tetangga menunggu **invalid timer 180 detik** tanpa menerima update sebelum menandai rute sebagai tidak valid (metrik 16). Setelah itu **holddown timer 180 detik** membuatnya mengabaikan informasi baru tentang rute tersebut, dan **flush timer 240 detik** menghapusnya dari tabel. Ditambah waktu propagasi update ke router lain (setiap 30 detik per hop), total pemulihan mudah mencapai 3–5 menit. Triggered update mempercepat sebagian kasus, tetapi holddown tetap menjadi penghambat utama.

5. (a) **Metrik berbasis bandwidth** — OSPF memilih jalur berdasarkan cost yang mencerminkan kapasitas link, bukan sekadar jumlah hop, sehingga jalur yang dipilih benar-benar optimal. (b) **Konvergensi jauh lebih cepat** — hitungan detik alih-alih menit, karena LSA di-flood segera saat ada perubahan tanpa holddown timer. (c) **Skalabilitas** — tidak ada batas 15 hop, dan konsep **area** membatasi cakupan flooding serta perhitungan SPF sehingga jaringan besar tetap dapat dikelola. (d) Tambahan: OSPF mendukung autentikasi yang lebih kuat, summarization terkontrol di ABR, dan merupakan standar terbuka multi-vendor yang matang.

</details>

---

## 7. Sumber

- RFC 2453 — RIP Version 2
- RFC 2080 — RIPng for IPv6
- RFC 1058 — RIP Version 1 (historis)
- Cisco, *Configuring Routing Information Protocol*

---

**Berikutnya:** `07-routing-lanjutan/04-ospf.md` — protokol IGP yang paling penting untuk dikuasai.
