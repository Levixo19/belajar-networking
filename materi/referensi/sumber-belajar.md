# Sumber Belajar Lanjutan

> Referensi eksternal untuk memperdalam setiap topik. Prioritaskan sumber primer (RFC, dokumentasi vendor, standar) dan sumber yang terus diperbarui.

Halaman ini daftar pilihan yang ringkas. Daftar lengkapnya (lebih dari seribu tautan, bisa dicari dan disaring per tahap, jenis, bahasa, dan sumber, beserta lisensinya) ada di halaman **Pustaka** aplikasi ini. Setiap modul juga punya bagian "Bacaan lanjutan" untuk tahapnya sendiri.

---

## Sumber Primer (Paling Otoritatif)

- [RFC Editor](https://www.rfc-editor.org/) dan [IETF Datatracker](https://datatracker.ietf.org/): teks resmi protokol internet, status, dan errata.
- [IEEE 802 LAN/MAN Standards Committee](https://www.ieee802.org/): Ethernet, VLAN, Wi-Fi, 802.1X. Banyak standar 802 bisa diunduh gratis lewat program Get IEEE 802.
- [Dokumentasi Cisco](https://www.cisco.com/c/en/us/support/index.html): referensi perintah, panduan konfigurasi, dan desain tervalidasi (CVD).
- [Manual MikroTik RouterOS](https://manual.mikrotik.com/): dokumentasi RouterOS v7 resmi (pengganti help.mikrotik.com).
- [Linux man-pages](https://man7.org/linux/man-pages/): `ip`, `ss`, `nft`, `tcpdump`, dan kawan-kawannya.
- [NIST Computer Security Resource Center](https://csrc.nist.gov/): SP 800-207 (Zero Trust), SP 800-41 (firewall), SP 800-77 (IPsec VPN). Publikasi pemerintah AS, domain publik di AS.
- [IANA Protocol Registries](https://www.iana.org/protocols): nomor port, nomor protokol, dan alokasi alamat.

## Sertifikasi: Silabus dan Materi Resmi

- CCNA 200-301: [exam topics di Cisco Learning Network](https://learningnetwork.cisco.com/s/ccna-exam-topics) dan kursus di [Cisco Networking Academy](https://www.netacad.com/).
- [Cisco Packet Tracer](https://www.netacad.com/cisco-packet-tracer): simulator lab gratis (butuh akun NetAcad).
- [Cisco DevNet](https://developer.cisco.com/): sandbox, API, dan otomasi.
- CompTIA: [Network+ (N10-009)](https://www.comptia.org/en-us/certifications/network/) dan [Security+ (SY0-701)](https://www.comptia.org/en-us/certifications/security/).
- [Pelatihan MikroTik](https://mikrotik.com/training): outline resmi MTCNA sampai MTCINE.
- Juniper, Aruba, Fortinet, dan Palo Alto: lihat halaman pelatihan resmi masing-masing vendor (tautannya ada di Pustaka, segi "Kursus").

## Buku Rekomendasi

Buku yang tidak ditautkan di bawah ini buku berbayar; beli dari penerbitnya atau pinjam di perpustakaan, jangan dari situs PDF bajakan.

**Gratis dan terbuka:**
- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/) (Peterson dan Davie): edisi daring, CC BY 4.0. Sebagian materi kurikulum ini diadaptasi dari sini (lihat `NOTICE.md`).
- [Computer Networking: Principles, Protocols and Practice](https://www.computer-networking.info/) (Olivier Bonaventure): CC BY-SA 3.0.
- [An Introduction to Computer Networks](https://intronetworks.cs.luc.edu/) (Peter Dordal): gratis dibaca, CC BY-NC-ND.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/): pemrograman socket dengan C.

**Fondasi dan CCNA (berbayar):**
- "CCNA 200-301 Official Cert Guide", Wendell Odom (Cisco Press). Buku rujukan utama CCNA.
- "Computer Networking: A Top-Down Approach", Kurose dan Ross (Pearson). Penulisnya menyediakan [materi pendamping gratis](https://gaia.cs.umass.edu/kurose_ross/index.php).
- "TCP/IP Illustrated, Vol. 1", Stevens dan Fall. Pembedahan TCP/IP yang mendalam.
- "CompTIA Network+ Study Guide" (Sybex) atau buku Mike Meyers.

**Routing dan lanjutan:**
- "Routing TCP/IP Vol. I & II", Jeff Doyle. Rujukan routing klasik.
- "BGP in the Data Center", Dinesh Dutt (O'Reilly).
- "Network Warrior", Gary Donahue. Praktik lapangan.

**Desain dan data center:**
- "Top-Down Network Design", Priscilla Oppenheimer.
- "Data Center Fundamentals" (Cisco Press).

**Keamanan:**
- "Network Security Assessment" (O'Reilly).
- Bahan gratis dari [NIST CSRC](https://csrc.nist.gov/) dan [OWASP](https://owasp.org/), termasuk [OWASP Top Ten](https://owasp.org/www-project-top-ten/).

**Otomasi (NetDevOps):**
- "Network Programmability and Automation" (O'Reilly).
- Dokumentasi [Ansible untuk jaringan](https://docs.ansible.com/ansible/latest/network/getting_started/index.html), [Nornir](https://nornir.readthedocs.io/), dan [Netmiko](https://github.com/ktbyers/netmiko).

**Linux:**
- "Linux Networking Cookbook".
- [man-pages iproute2](https://man7.org/linux/man-pages/man8/ip.8.html) dan [wiki nftables](https://wiki.nftables.org/).

## Lab dan Praktik

- [Cisco Packet Tracer](https://www.netacad.com/cisco-packet-tracer): lab tingkat CCNA, gratis lewat NetAcad.
- [GNS3](https://www.gns3.com/) dan [EVE-NG](https://www.eve-ng.net/): emulator dengan image perangkat sungguhan.
- [Cisco Modeling Labs](https://developer.cisco.com/modeling-labs/): versi Free dibatasi 5 node.
- [Containerlab](https://containerlab.dev/): lab modern berbasis container (FRR, Arista cEOS, Nokia SR Linux).
- [Cisco DevNet Sandbox](https://devnetsandbox.cisco.com/): perangkat Cisco dan API gratis untuk dicoba.
- [MikroTik CHR](https://mikrotik.com/download): RouterOS gratis di VM (kecepatan dibatasi tanpa lisensi).
- Linux network namespaces: praktik langsung di Tahap 13 dan Lab 05.
- [Kathará](https://www.kathara.org/) dan [Mininet](https://mininet.org/): emulator jaringan berbasis container dan Linux.

## Video dan Kursus

Video cepat usang. Selalu cek tanggal unggah dan cocokkan dengan blueprint atau dokumentasi terbaru.

- [Cisco Networking Academy](https://www.netacad.com/): kursus resmi terstruktur.
- [Jeremy's IT Lab](https://www.youtube.com/@JeremysITLab): CCNA 200-301 v1.1 gratis dan lengkap. Sangat direkomendasikan.
- [Professor Messer](https://www.professormesser.com/): kursus video Network+ dan Security+ sesuai blueprint terbaru.
- [Practical Networking](https://www.practicalnetworking.net/): konsep dasar (subnetting, NAT, OSI) yang dijelaskan sangat rapi.
- [David Bombal](https://www.youtube.com/@davidbombal) dan [NetworkChuck](https://www.youtube.com/@NetworkChuck): praktis dan memotivasi. Seri CCNA lama di kanal ini mengikuti blueprint sebelum v1.1, jadi pakai untuk konsep, bukan untuk persiapan ujian.
- Kanal MikroTik berbahasa Indonesia: banyak membahas RT-RW-Net. Periksa versi RouterOS yang dipakai, karena banyak yang masih v6.
- Platform kursus (Udemy, Coursera, Pluralsight): pilih instruktur bereputasi dan kursus yang diperbarui.

## Komunitas dan Diskusi

- [Cisco Community](https://community.cisco.com/) dan [Forum MikroTik](https://forum.mikrotik.com/).
- Reddit: [r/networking](https://www.reddit.com/r/networking/), [r/ccna](https://www.reddit.com/r/ccna/), [r/mikrotik](https://www.reddit.com/r/mikrotik/).
- [NANOG](https://www.nanog.org/): komunitas operator jaringan, milis dan rekaman presentasi (BGP, ISP).
- Stack Exchange: [Network Engineering](https://networkengineering.stackexchange.com/) dan [Server Fault](https://serverfault.com/).
- Komunitas lokal: grup Telegram dan Facebook MikroTik dan jaringan Indonesia.

## Alat dan Referensi Cepat

- Kalkulator subnet: ada banyak di internet dan di halaman Alat aplikasi ini, tapi latih manual untuk ujian.
- [Wireshark](https://www.wireshark.org/): analisis paket, wajib dikuasai.
- [Subnetting Practice](https://subnettingpractice.com/): latihan subnetting berwaktu.
- BGP looking glass dan analisis routing internet nyata: [bgp.tools](https://bgp.tools/), [RIPEstat](https://stat.ripe.net/), [Hurricane Electric BGP Toolkit](https://bgp.he.net/).
- [IANA](https://www.iana.org/protocols): registri port, protokol, dan alokasi IP.
- [Sertifikasi IPv6 Hurricane Electric](https://ipv6.he.net/certification/): gratis dan praktis.

## Observability dan Monitoring

- Wireshark/tshark dan [tcpdump](https://www.tcpdump.org/): analisis paket.
- [Prometheus](https://prometheus.io/) dan [Grafana](https://grafana.com/docs/): metrik dan dashboard modern.
- NMS open source: [LibreNMS](https://www.librenms.org/), [Zabbix](https://www.zabbix.com/documentation/current/en/manual), [Observium](https://www.observium.org/).
- [The Dude](https://mikrotik.com/thedude): NMS gratis dari MikroTik.
- [ntopng](https://www.ntop.org/products/traffic-analysis/ntop/) dan kolektor NetFlow: analisis flow.

## Otomasi

- Python: [Netmiko](https://github.com/ktbyers/netmiko), [NAPALM](https://napalm.readthedocs.io/), [Nornir](https://nornir.readthedocs.io/), [Scrapli](https://github.com/carlmontanari/scrapli), [ncclient](https://github.com/ncclient/ncclient), [Scapy](https://scapy.net/), [pyATS/Genie](https://developer.cisco.com/pyats/).
- Ansible: [panduan jaringan](https://docs.ansible.com/ansible/latest/network/getting_started/index.html), koleksi `cisco.ios`, `arista.eos`, `community.routeros`.
- IaC: [Terraform](https://developer.hashicorp.com/terraform).
- Source of truth: [NetBox](https://netboxlabs.com/docs/netbox/) dan [Nautobot](https://docs.nautobot.com/).
- Validasi: [Batfish](https://batfish.org/). Lab: [Containerlab](https://containerlab.dev/). CI/CD: [GitLab CI](https://docs.gitlab.com/ci/) dan [GitHub Actions](https://docs.github.com/en/actions).

---

## Cara Belajar Efektif (saran)

1. Pahami konsep dulu (kurikulum ini). Jangan menghafal perintah tanpa paham.
2. Praktik segera di lab (Packet Tracer, CHR, Linux) dan konfigurasikan sendiri.
3. Rusak lalu perbaiki. Troubleshooting melatih pemahaman paling dalam.
4. Dokumentasikan (blog atau GitHub). Menjelaskan ke orang lain memperdalam pemahaman, dan tulisannya sekaligus jadi portofolio.
5. Baca sumber primer untuk hal yang membingungkan (RFC, dokumentasi vendor).
6. Bergabung dengan komunitas. Bertanya dan menjawab mempercepat belajar.
7. Ikuti perkembangan. Jaringan terus berevolusi (Wi-Fi 7, SDN, otomasi, cloud).

> [!TIP]
> **Kombinasi terbaik untuk pemula Indonesia:** kurikulum ini (konsep dan tiga platform), lalu Jeremy's IT Lab (video CCNA), lalu Packet Tracer dan MikroTik CHR (praktik), lalu sertifikasi (CCNA atau MTCNA), portofolio GitHub, dan komunitas. Fokus pada pemahaman dan praktik, bukan mengejar banyak sertifikat.

> [!WARNING]
> **Hati-hati dengan sumber usang atau salah.** Jaringan berubah, jadi verifikasi terhadap sumber primer dan tanggal terbaru. Kurikulum ini disusun dari blueprint dan standar terkini, tetapi selalu cek pembaruan resmi sebelum ujian.

---

**Lihat juga:** bagian "Sumber" dan "Berikutnya" di setiap modul, serta `18-karier-sertifikasi/*` (peta sertifikasi dan karier).
