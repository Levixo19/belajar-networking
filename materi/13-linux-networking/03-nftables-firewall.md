# 13.3 nftables: Firewall Linux Modern

> **Prasyarat:** `13-linux-networking/01`, `09-nat-acl-firewall/03`
> **Tujuan:** Anda bisa membangun firewall Linux lengkap dengan nftables, memahami netfilter, dan memakai connection tracking.

> > [!NOTE]
> > **nftables menggantikan iptables** sebagai firewall default di distribusi modern (Debian 10+, RHEL 8+, Ubuntu 20.04+). iptables masih ada tetapi kini sering menjadi wrapper di atas nftables.

---

## 1. Arsitektur Netfilter

**Netfilter** adalah kerangka di kernel Linux yang memproses paket di titik-titik tertentu (**hook**).

```
                    ┌─────────────┐
Paket masuk ──────→ │ PREROUTING  │ ──→ keputusan routing
                    └─────────────┘         │
                              ┌─────────────┴──────────────┐
                         untuk host ini?           untuk diteruskan?
                              │                            │
                       ┌──────┴──────┐             ┌───────┴──────┐
                       │   INPUT     │             │   FORWARD    │
                       └──────┬──────┘             └───────┬──────┘
                              │                            │
                        proses lokal                       │
                              │                            │
                       ┌──────┴──────┐                     │
                       │   OUTPUT    │                     │
                       └──────┬──────┘                     │
                              └────────────┬───────────────┘
                                    ┌───────┴──────┐
                                    │ POSTROUTING  │ ──→ keluar
                                    └──────────────┘
```

| Hook | Kapan | Untuk |
|---|---|---|
| **prerouting** | Sebelum keputusan routing | DNAT, mangle awal |
| **input** | Paket **untuk host ini** | Melindungi host |
| **forward** | Paket **melewati host** | Melindungi jaringan (router) |
| **output** | Paket **dari host ini** | Membatasi trafik keluar host |
| **postrouting** | Setelah keputusan routing | SNAT/masquerade |

> [!TIP]
> **Ini konsep yang sama dengan chain di MikroTik** (yang memang berbasis netfilter Linux): input, forward, output, prerouting, postrouting.

---

## 2. Struktur nftables

Berbeda dari iptables, nftables punya hierarki yang lebih bersih:

```
TABLE (family: ip / ip6 / inet / arp / bridge / netdev)
  └── CHAIN (type: filter / nat / route; hook: input/forward/...)
        └── RULE (match → action)
```

| Family | Untuk |
|---|---|
| **inet** | IPv4 **dan** IPv6 sekaligus (direkomendasikan) |
| ip | IPv4 saja |
| ip6 | IPv6 saja |
| bridge | Frame layer 2 di bridge |
| netdev | Ingress paling awal (untuk filtering DoS efisien) |

> [!TIP]
> **Gunakan family `inet`.** Satu aturan berlaku untuk IPv4 dan IPv6, sehingga Anda terhindar dari kesalahan umum "lupa firewall IPv6".

---

## 3. Firewall Lengkap: Contoh untuk Server

`/etc/nftables.conf`:
```
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    # Set untuk daftar alamat (efisien)
    set admin_ips {
        type ipv4_addr
        elements = { 192.168.99.10, 192.168.99.20 }
    }
    set blocked {
        type ipv4_addr
        flags dynamic, timeout
    }

    chain input {
        type filter hook input priority 0; policy drop;

        # Koneksi yang sudah ada
        ct state established,related accept
        ct state invalid drop

        # Loopback
        iif lo accept

        # ICMP (jangan blokir total!)
        ip protocol icmp icmp type { echo-request, echo-reply, destination-unreachable, time-exceeded } limit rate 10/second accept
        ip6 nexthdr icmpv6 icmpv6 type { echo-request, echo-reply, destination-unreachable, time-exceeded, packet-too-big, nd-neighbor-solicit, nd-neighbor-advert, nd-router-advert } accept

        # SSH — hanya dari admin, dengan proteksi brute force
        tcp dport 22 ip saddr @admin_ips accept
        tcp dport 22 ct state new limit rate 5/minute accept
        tcp dport 22 ct state new add @blocked { ip saddr timeout 1h } drop

        # Layanan publik
        tcp dport { 80, 443 } accept

        # Log dan drop sisanya
        limit rate 5/minute log prefix "DROP-INPUT: "
        drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
        ct state established,related accept
        ct state invalid drop
        # (server biasa tidak meneruskan; router akan menambah aturan di sini)
    }

    chain output {
        type filter hook output priority 0; policy accept;
        # Untuk hardening ketat, ubah ke policy drop dan whitelist tujuan
    }
}
```

```bash
$ sudo nft -f /etc/nftables.conf         # muat
$ sudo nft -c -f /etc/nftables.conf      # cek sintaks tanpa memuat
$ sudo systemctl enable --now nftables   # persisten
```

> [!WARNING]
> **`policy drop` pada chain input adalah default-deny yang benar.** Tetapi hati-hati: JANGAN memuat konfigurasi dengan `policy drop` dari jarak jauh sebelum memastikan aturan SSH benar, karena Anda akan langsung terkunci. Selalu uji sintaks dengan `-c` dulu, dan sediakan mekanisme rollback.

---

## 4. Perintah nftables

```bash
# Lihat ruleset
$ sudo nft list ruleset
$ sudo nft list ruleset inet
$ sudo nft list table inet filter
$ sudo nft -a list ruleset               # dengan handle (untuk menghapus)

# Tambah aturan
$ sudo nft add rule inet filter input tcp dport 8080 accept

# Sisipkan di posisi tertentu
$ sudo nft insert rule inet filter input position 0 ip saddr 10.0.0.5 accept

# Hapus aturan (butuh handle)
$ sudo nft -a list chain inet filter input     # lihat handle
$ sudo nft delete rule inet filter input handle 12

# Set dinamis (untuk blacklist otomatis)
$ sudo nft add element inet filter blocked '{ 203.0.113.5 }'
$ sudo nft list set inet filter blocked

# Counter
$ sudo nft list ruleset | grep -A1 counter

# Flush (hati-hati!)
$ sudo nft flush ruleset                 # ⚠️ menghapus SEMUA
$ sudo nft flush chain inet filter input
```

---

## 5. NAT dengan nftables

```
table ip nat {
    chain prerouting {
        type nat hook prerouting priority -100;
        # DNAT / port forwarding
        iifname "eth0" tcp dport 443 dnat to 10.0.0.10:443
        iifname "eth0" tcp dport 33890 dnat to 10.0.0.20:3389
    }

    chain postrouting {
        type nat hook postrouting priority 100;
        # SNAT / masquerade
        oifname "eth0" masquerade
        # atau alamat tetap:
        # oifname "eth0" ip saddr 10.0.0.0/24 snat to 203.0.113.1
    }
}
```

> [!WARNING]
> **Untuk NAT bekerja, IP forwarding harus aktif:**
```bash
$ sudo sysctl -w net.ipv4.ip_forward=1
```

---

## 6. Connection Tracking (conntrack)

Netfilter melacak state setiap koneksi, dan inilah yang membuatnya **stateful**.

```bash
# Lihat koneksi yang dilacak
$ sudo conntrack -L
$ sudo conntrack -L -p tcp --dport 443
$ sudo conntrack -L -s 192.168.1.50

# Statistik
$ sudo conntrack -S
$ cat /proc/sys/net/netfilter/nf_conntrack_count
$ cat /proc/sys/net/netfilter/nf_conntrack_max

# Hapus koneksi
$ sudo conntrack -D -s 192.168.1.50
$ sudo conntrack -F                       # flush semua

# Pantau secara real-time
$ sudo conntrack -E
```

**State koneksi:**
```
new         → paket pertama koneksi baru
established → bagian dari koneksi yang ada
related     → koneksi terkait (data FTP, ICMP error)
invalid     → tidak cocok state mana pun → SELALU DROP
untracked   → sengaja dikecualikan (notrack, untuk kinerja)
```

> [!WARNING]
> **Tabel conntrack bisa penuh** pada server sibuk atau saat serangan → koneksi baru dibuang.
```bash
# Perbesar dan sesuaikan timeout
$ sudo sysctl -w net.netfilter.nf_conntrack_max=262144
$ sudo sysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=86400
```

> [!WARNING]
> **Default timeout TCP established Linux adalah 5 hari**, sangat boros pada router sibuk. Turunkan ke 1 hari atau kurang.

> [!TIP]
> **Untuk trafik volume sangat tinggi yang tidak butuh state** (mis. DNS server yang sangat sibuk), gunakan `notrack` di prerouting untuk melewati conntrack dan menghemat sumber daya:
```
chain raw_prerouting {
    type filter hook prerouting priority -300;
    udp dport 53 notrack
}
```

---

## 7. Fitur Lanjutan nftables

### Set dan Map

```
# Set — daftar yang efisien
set ports_web { type inet_service; elements = { 80, 443, 8080 } }
tcp dport @ports_web accept

# Map — pemetaan (mis. port → tujuan NAT)
map port_forward {
    type inet_service : ipv4_addr . inet_service
    elements = { 443 : 10.0.0.10 . 443, 8080 : 10.0.0.11 . 80 }
}
dnat to tcp dport map @port_forward
```

### Rate limiting dan blacklist dinamis

```
# Anti brute force SSH — blacklist otomatis
set ssh_blacklist { type ipv4_addr; flags dynamic, timeout; timeout 1h; }

chain input {
    tcp dport 22 ip saddr @ssh_blacklist drop
    tcp dport 22 ct state new \
        add @ssh_blacklist { ip saddr limit rate over 5/minute } drop
    tcp dport 22 ct state new accept
}
```

> [!TIP]
> **Ini setara address-list dinamis di MikroTik:** blacklist otomatis dengan timeout.

### Verdict maps (jump berdasarkan kondisi)

```
tcp dport vmap { 22 : jump ssh_chain, 80 : jump web_chain, 443 : jump web_chain }
```

---

## 8. nftables untuk Router

```
#!/usr/sbin/nft -f
flush ruleset

define WAN = "eth0"
define LAN = "eth1"
define LAN_NET = 192.168.1.0/24

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        ct state established,related accept
        ct state invalid drop
        iif lo accept
        ip protocol icmp limit rate 10/second accept
        icmpv6 type { nd-neighbor-solicit, nd-neighbor-advert, nd-router-advert, echo-request, packet-too-big } accept
        iifname $LAN accept                      # LAN boleh akses router
        iifname $WAN drop                        # WAN tidak boleh akses router
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
        ct state established,related accept
        ct state invalid drop
        iifname $LAN oifname $WAN accept         # LAN ke internet
        ct status dnat accept                    # trafik port forwarding
        # LAN ke LAN diblokir default (segmentasi)
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}

table ip nat {
    chain prerouting {
        type nat hook prerouting priority -100;
        iifname $WAN tcp dport 443 dnat to 192.168.1.10:443
    }
    chain postrouting {
        type nat hook postrouting priority 100;
        oifname $WAN masquerade
    }
}
```

```bash
$ sudo sysctl -w net.ipv4.ip_forward=1
$ echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-router.conf
$ sudo nft -f /etc/nftables.conf
```

---

## 9. iptables: Masih Anda Temui

Banyak sistem, dokumentasi, dan skrip lama memakai iptables. Anda perlu bisa membacanya.

```bash
# Lihat aturan
$ sudo iptables -L -n -v
$ sudo iptables -t nat -L -n -v
$ sudo iptables -S                       # format perintah

# Tabel: filter (default), nat, mangle, raw
# Chain: INPUT, FORWARD, OUTPUT, PREROUTING, POSTROUTING

# Contoh aturan
$ sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
$ sudo iptables -A INPUT -i lo -j ACCEPT
$ sudo iptables -A INPUT -p tcp --dport 22 -s 192.168.99.0/24 -j ACCEPT
$ sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
$ sudo iptables -P INPUT DROP             # policy default

# NAT
$ sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE
$ sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j DNAT --to 10.0.0.10:443

# Simpan (Debian/Ubuntu)
$ sudo iptables-save > /etc/iptables/rules.v4

# Konversi ke nftables
$ sudo iptables-save | sudo iptables-restore-translate -f /dev/stdin
```

| iptables | nftables |
|---|---|
| `-A INPUT` | `add rule inet filter input` |
| `-m state --state ESTABLISHED` | `ct state established` |
| `-j ACCEPT/DROP` | `accept`/`drop` |
| `-P INPUT DROP` | `policy drop` |
| tabel + chain terpisah per family | family `inet` untuk IPv4+IPv6 |
| ipset | set bawaan |

> [!TIP]
> **Untuk sistem baru, pakai nftables.** Pelajari iptables secukupnya untuk membaca sistem dan skrip lama.

---

## 10. Alternatif Frontend: firewalld dan UFW

Untuk kesederhanaan, banyak distro menyediakan frontend di atas nftables.

### firewalld (RHEL, Fedora)

```bash
$ sudo firewall-cmd --state
$ sudo firewall-cmd --get-active-zones
$ sudo firewall-cmd --zone=public --add-service=https --permanent
$ sudo firewall-cmd --zone=public --add-port=8080/tcp --permanent
$ sudo firewall-cmd --zone=public --add-source=192.168.99.0/24 --permanent
$ sudo firewall-cmd --reload
$ sudo firewall-cmd --list-all
```

**Konsep zona**, mirip zona firewall enterprise:
```
public   : tidak dipercaya (default)
internal : jaringan internal
trusted  : semua diizinkan
dmz      : untuk server publik
drop     : buang semua tanpa balasan
```

### UFW (Ubuntu)

```bash
$ sudo ufw status verbose
$ sudo ufw default deny incoming
$ sudo ufw default allow outgoing
$ sudo ufw allow from 192.168.99.0/24 to any port 22
$ sudo ufw allow 443/tcp
$ sudo ufw limit 22/tcp                   # rate limit built-in
$ sudo ufw enable
```

> [!TIP]
> **UFW dan firewalld cukup untuk server sederhana.** Untuk router dan aturan kompleks, tulis nftables langsung.

---

## 11. Troubleshooting Firewall Linux

```bash
# 1. Apakah paket mencapai host?
$ sudo tcpdump -ni eth0 host 1.2.3.4 and port 443

# 2. Aturan mana yang kena? (tambahkan counter dan log)
$ sudo nft list ruleset | grep -B2 counter
$ sudo journalctl -k -f | grep "DROP-INPUT"

# 3. Apakah koneksi dilacak dengan benar?
$ sudo conntrack -L -d 1.2.3.4

# 4. Traceroute dari dalam
$ sudo nft add rule inet filter input tcp dport 443 counter log prefix "DEBUG443: " accept

# 5. Nonaktifkan sementara untuk isolasi masalah (HATI-HATI di produksi!)
$ sudo nft flush ruleset       # ⚠️ hanya kalau ada cara memulihkan!
```

### Masalah umum

| Gejala | Penyebab |
|---|---|
| Semua trafik masuk diblokir | `policy drop` tanpa aturan accept yang benar |
| SSH terputus setelah memuat aturan | Lupa mengizinkan port 22 / SSH sesi yang ada |
| NAT tidak bekerja | `ip_forward=0`; aturan masquerade salah interface |
| Balasan tidak masuk | Lupa `ct state established,related accept` |
| IPv6 tidak terlindungi | Aturan hanya di family `ip`, bukan `inet` |
| Koneksi baru ditolak saat sibuk | conntrack penuh |
| Aturan tampak benar tetapi tidak jalan | Urutan salah; family salah; priority chain |

> [!WARNING]
> **Kesalahan #1: lupa `ct state established,related accept`.** Tanpa itu, koneksi keluar berhasil tetapi balasannya diblokir, sama seperti lupa "established" di ACL Cisco.

---

## 12. XDP: Menjatuhkan Paket Sebelum Netfilter

Semua hook netfilter di bagian 1 baru bekerja setelah driver kartu jaringan selesai membangun `sk_buff` untuk setiap paket. Pada serangan volumetrik, biaya alokasi `sk_buff` dan perjalanan paket lewat stack sudah mahal, bahkan kalau aturan `drop` di nftables menjatuhkannya satu langkah kemudian. **XDP (eXpress Data Path)** menjawab masalah itu dengan hook yang lebih awal: program **eBPF** dijalankan di jalur terima driver, terhadap paket mentah, **sebelum kernel mengalokasikan `sk_buff`**. Program itu lebih dulu diperiksa oleh verifier kernel sebelum boleh dimuat, jadi tidak bisa membuat kernel crash atau berputar tanpa henti.

Setiap program XDP selesai dengan satu verdict:

| Verdict | Arti |
|---|---|
| `XDP_PASS` | Teruskan ke stack kernel biasa (lalu netfilter, routing, dan seterusnya) |
| `XDP_DROP` | Buang paket di driver |
| `XDP_TX` | Pantulkan paket keluar lewat interface yang sama |
| `XDP_REDIRECT` | Kirim ke interface lain, CPU lain, atau socket AF_XDP |
| `XDP_ABORTED` | Tanda kesalahan program; paket dibuang |

Ada tiga mode pemasangan. **Native (driver)** menjalankan program di dalam driver NIC dan memberi performa penuh, tetapi driver harus mendukung XDP. **Generic (skb)** berjalan di kernel setelah `sk_buff` dibuat, jadi bisa dipakai di driver apa pun untuk belajar atau menguji, namun keuntungan performanya hilang. **Offload** memuat program ke hardware atau firmware NIC. Dengan `ip link`, mode dipilih lewat kata kunci:

```bash
# Native, tanpa fallback: gagal jika driver tidak mendukung XDP
sudo ip link set dev eth0 xdpdrv object xdp_drop.o section xdp

# Generic: dipaksa berjalan di jalur skb (cocok untuk lab di VM)
sudo ip link set dev eth0 xdpgeneric object xdp_drop.o section xdp

# "xdp" saja = native bila bisa, otomatis jatuh ke generic bila tidak
# Lepas program
sudo ip link set dev eth0 xdp off
```

`xdp_drop.o` adalah berkas objek BPF hasil kompilasi dari C dengan `clang -target bpf`; penulisan programnya di luar cakupan modul ini. Yang perlu Anda pahami sebagai engineer jaringan adalah **kapan XDP masuk akal**: menjatuhkan lalu lintas serangan berskala besar (daftar sumber serangan disimpan di *BPF map*), membuat load balancer layer 4 yang memantulkan paket dengan `XDP_TX` atau `XDP_REDIRECT`, dan menyaring awal sebelum paket menyentuh nftables.

XDP **tidak menggantikan** nftables. Ia hanya melihat paket masuk (ingress), tidak membawa conntrack, dan state apa pun harus Anda simpan sendiri di BPF map. Firewall stateful untuk server tetap ditulis di nftables; XDP ditaruh di depannya sebagai saringan kasar yang murah. Pola pikirnya mirip tabel `raw` di MikroTik, yang juga memutuskan sebelum connection tracking, hanya saja XDP berada lebih awal lagi, di dalam driver.

Untuk aplikasi yang ingin memproses paket di user space dengan cepat (IDS, penangkap paket, atau stack jaringan khusus), `XDP_REDIRECT` bisa mengarahkan paket ke socket **AF_XDP**. Aplikasi mendaftarkan area memori bernama **UMEM** yang dibagi menjadi bingkai berukuran sama, lalu berkomunikasi dengan kernel lewat empat ring: **FILL** (aplikasi menyerahkan bingkai kosong untuk menerima), **RX** (paket diterima), **TX** (paket yang akan dikirim), dan **COMPLETION** (bingkai kirim yang sudah selesai). Program XDP memilih socket tujuan lewat map bertipe XSKMAP. Mode **zero-copy** menghindari penyalinan paket antara kernel dan aplikasi, asalkan driver mendukungnya; bila tidak, mode copy menjadi cadangan.

> [!WARNING]
> **Paket yang dijatuhkan XDP umumnya tidak muncul di `tcpdump`**, karena penangkap paket bekerja pada jalur `sk_buff` yang tidak pernah dibuat. Kalau paket "hilang tanpa jejak" di server yang memakai XDP, periksa dulu apakah ada program yang terpasang (`ip link show dev eth0`) sebelum menyalahkan nftables atau kabel. Perhatikan juga batas per driver, misalnya MTU maksimum yang boleh dipakai bersama XDP native.

---

## 13. Ringkasan

- **nftables menggantikan iptables** di distribusi modern; iptables sering menjadi wrapper di atasnya.
- **Netfilter hook**: prerouting, input, forward, output, postrouting. Konsepnya sama dengan chain MikroTik.
- Struktur: **table (family) → chain (type + hook) → rule**. **Gunakan family `inet`** agar satu aturan berlaku IPv4 dan IPv6.
- **`ct state established,related accept`** membuat firewall stateful. Jangan pernah lupa aturan ini.
- **`ct state invalid drop`** dan **`policy drop`** (default-deny) adalah dasar yang benar.
- **Jangan blokir ICMP total.** Izinkan echo, unreachable, time-exceeded, dan (untuk IPv6) NDP + packet-too-big.
- NAT: **DNAT di prerouting**, **SNAT/masquerade di postrouting**; butuh `ip_forward=1`.
- **conntrack** melacak state; tabel bisa penuh (perbesar `nf_conntrack_max`, turunkan timeout dari default 5 hari).
- **Set dinamis dengan timeout** = blacklist otomatis (setara address-list MikroTik).
- **firewalld** (zona) dan **UFW** adalah frontend sederhana; tulis nftables langsung untuk router/aturan kompleks.
- **Uji sintaks (`nft -c`) dan siapkan rollback** sebelum memuat `policy drop` dari jarak jauh, agar tidak terkunci.
- **XDP** menjalankan program eBPF di driver NIC sebelum `sk_buff` dibuat, dengan verdict `PASS`, `DROP`, `TX`, `REDIRECT`, `ABORTED`. Pasang dengan `ip link set dev X xdpdrv|xdpgeneric|xdpoffload object F section S`. Ia pra-filter murah di depan nftables, bukan penggantinya (tanpa conntrack bawaan); `AF_XDP` mengantar paket ke user space dengan UMEM dan empat ring.

---

## 14. Latihan

1. Kenapa memakai family `inet` lebih baik daripada `ip`?
2. Apa yang terjadi kalau Anda lupa `ct state established,related accept` di chain input?
3. Jelaskan lima hook netfilter dan untuk apa masing-masing.
4. Anda memuat aturan firewall dari jarak jauh dan langsung terputus. Apa yang salah dan bagaimana mencegahnya?
5. Bagaimana membuat blacklist otomatis untuk penyerang brute force SSH dengan nftables?
6. NAT tidak bekerja di router Linux Anda. Sebutkan tiga hal yang Anda periksa.
7. Server sibuk menolak koneksi baru dengan error terkait conntrack. Apa yang Anda lakukan?
8. Terjemahkan aturan iptables ini ke nftables: `iptables -A INPUT -p tcp --dport 443 -m state --state NEW,ESTABLISHED -j ACCEPT`
9. Server Linux Anda diserang banjir paket UDP dari ribuan alamat sumber dan CPU habis sebelum aturan nftables sempat berpengaruh. Jelaskan mengapa XDP lebih murah daripada `drop` di chain prerouting nftables, sebutkan kelima verdict XDP, tulis perintah memasang program secara native tanpa fallback, dan sebutkan satu hal yang tidak bisa dilakukan XDP dibanding nftables.

<details>
<summary>Jawaban</summary>

1. Karena family **`inet` memproses IPv4 dan IPv6 dengan satu set aturan**, sedangkan `ip` hanya IPv4 (dan `ip6` hanya IPv6). Dengan `inet`, Anda menulis aturan sekali dan otomatis berlaku untuk kedua protokol. Ini menghindari kesalahan paling umum: firewall IPv4 yang ketat tetapi IPv6 yang terlupa dan terbuka lebar. Karena banyak sistem modern mengaktifkan IPv6 secara default dan mengutamakannya, firewall IPv6 yang tidak dikonfigurasi adalah celah keamanan serius. Family `inet` menutup celah ini secara struktural.

2. **Koneksi keluar berhasil, tetapi balasannya diblokir**, sehingga praktis tidak ada yang bekerja. Ketika host membuat koneksi keluar (mis. `curl https://...`), paket keluar melewati chain output (biasanya `policy accept`). Tetapi paket balasan dari server masuk lewat chain input. Tanpa aturan yang mengizinkan trafik balasan, dan dengan `policy drop`, balasan itu dibuang dan koneksi macet/timeout.
   `ct state established,related accept` menyelesaikannya dengan mengizinkan paket yang merupakan bagian dari koneksi yang sudah ada (established) atau koneksi terkait (related, seperti data FTP atau ICMP error). Inilah inti firewall stateful: Anda hanya perlu mengizinkan arah inisiasi, dan balasan ditangani otomatis. Ini persis analog dengan kata kunci `established` di ACL Cisco atau `connection-state=established,related` di MikroTik.

3. **prerouting**: segera setelah paket tiba, sebelum keputusan routing. Untuk DNAT (port forwarding) dan mangle awal; keputusan di sini memengaruhi ke mana paket dirutekan. **input**: paket yang ditujukan ke host ini setelah routing memutuskan itu lokal; untuk melindungi host itu sendiri (SSH, layanan). **forward**: paket yang melewati host dari satu interface ke interface lain; untuk melindungi jaringan saat host berfungsi sebagai router. **output**: paket yang dihasilkan host ini; untuk membatasi trafik keluar host (egress filtering). **postrouting**: setelah keputusan routing, sebelum paket keluar; untuk SNAT/masquerade.

4. Kemungkinan besar Anda memuat konfigurasi dengan **`policy drop` pada chain input tanpa aturan yang mengizinkan sesi SSH Anda yang sedang berjalan**, sehingga paket balasan SSH langsung dibuang dan sesi mati. Bisa juga lupa `ct state established,related accept`.
   **Pencegahan:** (a) **uji sintaks dulu** dengan `sudo nft -c -f config.nft` (memeriksa tanpa memuat); (b) **pastikan ada aturan** `ct state established,related accept` dan aturan yang mengizinkan port 22 dari alamat Anda, sebelum `policy drop`; (c) **jadwalkan rollback otomatis**, mis. `sleep 300 && nft flush ruleset` di background yang dibatalkan kalau aturan berhasil, sehingga firewall kosong (dan Anda bisa masuk lagi) setelah 5 menit kalau terkunci; (d) uji dari sesi kedua sebelum menutup yang pertama; (e) miliki akses out-of-band (console/IPMI).

5. Dengan **set dinamis bertimeout** dan rate limiting:
   ```
   table inet filter {
       set ssh_blacklist {
           type ipv4_addr
           flags dynamic, timeout
           timeout 1h
       }
       chain input {
           type filter hook input priority 0; policy drop;
           ct state established,related accept
           iif lo accept
           # Blokir yang sudah di-blacklist (paling atas)
           tcp dport 22 ip saddr @ssh_blacklist drop
           # Kalau melebihi 5 koneksi baru per menit, masukkan ke blacklist
           tcp dport 22 ct state new \
               add @ssh_blacklist { ip saddr limit rate over 5/minute } drop
           # Koneksi baru normal diterima
           tcp dport 22 ct state new accept
       }
   }
   ```
   Cara kerjanya: alamat yang membuat lebih dari 5 koneksi SSH baru per menit otomatis ditambahkan ke set `ssh_blacklist` dan diblokir selama 1 jam. Ini setara dengan teknik address-list bertingkat di MikroTik. Untuk keamanan sesungguhnya, kombinasikan dengan kunci SSH (bukan password) dan pembatasan sumber.

6. (a) **`ip_forward`**: periksa `sysctl net.ipv4.ip_forward`; kalau 0, router tidak meneruskan paket sama sekali. Aktifkan dan buat permanen di `/etc/sysctl.d/`. (b) **Aturan masquerade/SNAT**: periksa apakah ada di chain **postrouting** dengan interface keluar yang benar (`oifname "eth0"` harus interface WAN yang sebenarnya), dan family/table yang benar (`table ip nat`). (c) **Chain forward**: periksa apakah trafik dari LAN ke WAN diizinkan (`iifname LAN oifname WAN accept`) dan `ct state established,related accept` ada untuk balasan; dengan `policy drop`, tanpa aturan accept trafik tidak akan diteruskan meski NAT benar. Tambahan: periksa routing (`ip route`), dan apakah conntrack bekerja (`conntrack -L`).

7. **Tabel conntrack penuh.** Setiap koneksi yang dilacak memakan slot di tabel dengan batas `nf_conntrack_max`. Saat penuh, koneksi baru dibuang dan muncul error seperti "nf_conntrack: table full, dropping packet".
   **Tindakan:** (a) **Periksa penyebab**: `conntrack -S` dan `conntrack -L` untuk melihat apa yang mengisi tabel; cari satu host yang membuat ribuan koneksi (P2P, malware, aplikasi bocor) atau serangan (SYN flood, port scan). (b) **Perbesar tabel**: `sysctl -w net.netfilter.nf_conntrack_max=262144` (sesuaikan dengan RAM). (c) **Turunkan timeout**: default TCP established 5 hari sangat boros; `sysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=86400`, dan perpendek timeout UDP/close-wait. (d) **Batasi koneksi per host** dengan aturan firewall. (e) Untuk trafik volume tinggi yang tidak butuh state (mis. DNS server), pakai **`notrack`** di prerouting untuk melewati conntrack. (f) Tangani host bermasalah atau serangan yang menjadi akar penyebab.

8. ```
   nft add rule inet filter input tcp dport 443 ct state new,established accept
   ```
   Catatan: `-m state --state` menjadi `ct state`; `NEW,ESTABLISHED` menjadi `new,established`; family sebaiknya `inet` (agar mencakup IPv6 juga, meski aturan asli iptables hanya IPv4; kalau ingin persis IPv4 saja, gunakan `add rule ip filter input`). Dalam praktik firewall yang baik, Anda biasanya memisahkan: `ct state established,related accept` di awal chain (untuk semua balasan), lalu `tcp dport 443 ct state new accept` untuk koneksi baru ke layanan itu.

9. Di nftables, paket sudah melewati driver, sudah dibuatkan `sk_buff`, dan sudah masuk stack sampai hook prerouting; semua biaya itu terbayar sebelum `drop`. XDP berjalan di driver **sebelum `sk_buff` dialokasikan**, sehingga paket buangan dibuang dengan biaya per paket jauh lebih kecil dan CPU tidak habis oleh paket yang akan dibuang juga. Verdict: `XDP_PASS` (teruskan ke stack), `XDP_DROP` (buang), `XDP_TX` (pantulkan keluar interface yang sama), `XDP_REDIRECT` (ke interface, CPU, atau socket AF_XDP lain), `XDP_ABORTED` (kesalahan program, paket dibuang). Perintah native tanpa fallback: `sudo ip link set dev eth0 xdpdrv object xdp_drop.o section xdp` (bila driver tidak mendukung XDP, perintah gagal alih-alih jatuh ke generic; lepas dengan `xdp off`). Yang tidak bisa dilakukan XDP: ia tidak punya **connection tracking** bawaan sehingga tidak stateful sendiri (state harus dibuat di BPF map oleh programmer), dan ia hanya melihat paket masuk. Karena itu XDP dipakai sebagai pra-filter di depan nftables, bukan penggantinya.

</details>

---

## 15. Sumber

- nftables wiki: https://wiki.nftables.org/
- `man nft`, `man conntrack`
- netfilter project: https://www.netfilter.org/
- firewalld: https://firewalld.org/
- Red Hat, *Securing Networks* (firewalld, nftables)
- eBPF Docs, Program type BPF_PROG_TYPE_XDP: https://docs.ebpf.io/linux/program-type/BPF_PROG_TYPE_XDP/
- Linux kernel documentation, AF_XDP: https://docs.kernel.org/networking/af_xdp.html
- man ip-link(8), opsi xdp, xdpdrv, xdpgeneric, xdpoffload: https://man7.org/linux/man-pages/man8/ip-link.8.html

---

**Berikutnya:** `13-linux-networking/04-layanan-jaringan-linux.md`. Menjalankan layanan jaringan (DNS, DHCP, proxy, routing) di Linux.
