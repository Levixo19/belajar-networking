# Silabus Lengkap: Checklist Penguasaan

Centang setiap topik yang sudah Anda kuasai (bisa menjelaskan ke orang lain + bisa mengonfigurasi).
Ini juga **daftar isi rinci** repositori: kalau sebuah topik ada di sini, materinya ada di berkas yang disebut.
Semua jalur berkas di bawah relatif terhadap folder **`materi/`** — mis. `00-fondasi/01-apa-itu-jaringan.md`
ada di `materi/00-fondasi/01-apa-itu-jaringan.md`.

Legenda kedalaman:
`D` = Dasar (tahu apa itu) · `M` = Menengah (bisa konfigurasi) · `P` = Profesional (bisa desain & troubleshoot)

---

## TAHAP 0: FONDASI

### `00-fondasi/01-apa-itu-jaringan.md`
- [ ] D Definisi jaringan komputer, tujuan (sharing resource, komunikasi)
- [ ] D Host, node, link, interface, endpoint
- [ ] D Klien-server vs peer-to-peer
- [ ] D Skala jaringan: PAN, LAN, CAN, MAN, WAN, GAN
- [ ] D Intranet, ekstranet, internet, DMZ (istilah awal)
- [ ] D Peran perangkat: NIC, hub, switch, router, firewall, AP, WLC, load balancer, proxy, server
- [ ] D PoE (Power over Ethernet) — kenapa ada
- [ ] D SOHO vs enterprise vs data center vs cloud

### `00-fondasi/02-bit-byte-biner.md`
- [ ] D Bit, byte, nibble, word
- [ ] D Sistem bilangan: desimal, biner, heksadesimal, oktal
- [ ] D Konversi biner↔desimal↔hex (manual, cepat)
- [ ] D Operasi bitwise: AND, OR, NOT, XOR, shift
- [ ] D Kenapa jaringan pakai biner & hex (mask, MAC, IPv6)
- [ ] D Satuan: bit vs byte, kbps vs KBps, KiB vs KB, prefiks SI vs biner

### `00-fondasi/03-sinyal-bandwidth-latency.md`
- [ ] D Sinyal analog vs digital, encoding, baseband vs broadband
- [ ] D Bandwidth, throughput, goodput, kapasitas
- [ ] D Latency & 4 komponennya (propagasi, transmisi, prosesing, queuing)
- [ ] D RTT, jitter, packet loss, MTU
- [ ] D Duplex (half/full), simplex
- [ ] D Bandwidth-delay product, kenapa "cepat" ≠ "responsif"
- [ ] D Serialization delay, hitung waktu kirim paket

### `00-fondasi/04-sejarah-dan-standar.md`
- [ ] D ARPANET → NSFNET → Internet komersial
- [ ] D Badan standar: IETF (RFC), IEEE (802.x), ITU-T, ISO, IANA, ICANN, RIR
- [ ] D Proses RFC, status (Standard/Proposed/Informational/Historic)
- [ ] D Cara membaca RFC & mencari standar
- [ ] D Model bisnis internet: tier-1/2/3, IXP, transit vs peering (pengantar)

### `00-fondasi/05-topologi.md`
- [ ] D Topologi fisik: bus, ring, star, mesh, hybrid, point-to-point
- [ ] D Topologi logis vs fisik
- [ ] D Two-tier (collapsed core), three-tier, spine-leaf
- [ ] D Redundansi N+1, single point of failure
- [ ] D Star of stars, hub-and-spoke, full mesh, partial mesh

---

## TAHAP 1: MODEL REFERENSI

### `01-model-referensi/01-osi.md`
- [ ] D 7 layer OSI, nama & nomor, mnemonic
- [ ] D Fungsi tiap layer secara rinci + contoh protokol
- [ ] D PDU per layer (bit, frame, packet, segment/datagram, data)
- [ ] D Perangkat beroperasi di layer mana
- [ ] M Kenapa model berlayer (abstraksi, interoperabilitas, troubleshooting)
- [ ] M Batas layer di dunia nyata (di mana OSI tidak cocok)

### `01-model-referensi/02-tcp-ip.md`
- [ ] D Model TCP/IP 4 layer & 5 layer
- [ ] D Pemetaan OSI ↔ TCP/IP
- [ ] D Protocol stack, protocol suite, protocol data unit
- [ ] D Hourglass model (IP sebagai leher sempit)

### `01-model-referensi/03-enkapsulasi.md`
- [ ] M Enkapsulasi & dekapsulasi langkah demi langkah
- [ ] M Header, payload, trailer; overhead
- [ ] P Perjalanan lengkap satu paket: ketik URL → halaman tampil (narasi 30+ langkah)
- [ ] P Apa yang berubah di setiap hop (MAC berubah, IP tetap)
- [ ] M De-enkapsulasi di switch vs router vs host

---

## TAHAP 2: LAYER FISIK

### `02-layer-fisik/01-media-transmisi.md`
- [ ] D Copper, fiber, wireless — kelebihan/kekurangan
- [ ] D Atenuasi, noise, EMI/RFI, crosstalk (NEXT/FEXT), impedance
- [ ] D Bit rate vs baud rate, teorema Nyquist & Shannon (intuitif)

### `02-layer-fisik/02-kabel-copper.md`
- [ ] M UTP/STP/FTP/S-FTP, kategori Cat5e-Cat8 (bandwidth & jarak)
- [ ] M Pinout T568A/T568B, straight-through vs crossover vs rollover
- [ ] M Auto-MDI/MDIX, kenapa crossover jarang dipakai lagi
- [ ] M Coaxial (RG-6/RG-59), DAC/twinax
- [ ] M PoE: 802.3af/at/bt, tipe/kelas, budget daya, injector, midspan/endspan
- [ ] M Standar struktur kabel: patch panel, keystone, punch-down, TIA-568 pathway
- [ ] P Sertifikasi kabel: wiremap, length, NEXT, return loss; alat (tester, TDR)

### `02-layer-fisik/03-fiber.md`
- [ ] M Single-mode vs multimode (OS1/OS2, OM1-OM5), core size
- [ ] M Konektor: LC, SC, ST, MPO/MTP; simplex/duplex
- [ ] M Transceiver: SFP, SFP+, SFP28, QSFP+, QSFP28, QSFP-DD, OSFP
- [ ] M BiDi, CWDM/DWDM, dark fiber
- [ ] P Power budget, dB loss, insertion/return loss, OTDR, cleaning
- [ ] P Ethernet fiber standard: 1000BASE-LX/SX, 10GBASE-LR/SR, 40G/100G/400G/800G

### `02-layer-fisik/04-encoding-modulasi.md`
- [ ] D NRZ, NRZ-I, Manchester, 4B/5B, 8B/10B, 64B/66B, PAM4
- [ ] D Clock recovery, DC balance, line coding vs modulasi
- [ ] D FEC (Forward Error Correction) di link cepat

---

## TAHAP 3: DATA LINK (LAYER 2)

### `03-data-link/01-ethernet-frame-mac.md`
- [ ] M Struktur frame Ethernet II: preamble, SFD, dst MAC, src MAC, EtherType, payload, FCS
- [ ] M IEEE 802.3 vs Ethernet II; 802.2 LLC/SNAP
- [ ] M Format MAC address, OUI, unicast/multicast/broadcast bit, U/L bit
- [ ] M MTU, jumbo frame, baby giant, runt, minimum 64 byte & padding
- [ ] M CRC/FCS, error detection (bukan koreksi)
- [ ] M CSMA/CD, collision domain, half duplex, late collision; kenapa mati di era switch
- [ ] M Duplex/speed mismatch — gejala & deteksi
- [ ] M Interface error counters: CRC, input errors, collisions, late collision, runts, giants

### `03-data-link/02-switching.md`
- [ ] M MAC address table (CAM), learning, aging, flooding, forwarding, filtering
- [ ] M Unknown unicast flooding, broadcast domain
- [ ] M Store-and-forward vs cut-through vs fragment-free
- [ ] M ASIC, backplane, wire-speed, blocking vs non-blocking, oversubscription
- [ ] M Layer 2 vs layer 3 switch, multilayer switch, SVI
- [ ] P Buffer, head-of-line blocking, microburst, ingress/egress queueing

### `03-data-link/03-vlan.md`
- [ ] M Konsep VLAN, broadcast domain per VLAN
- [ ] M Access port, trunk port, 802.1Q tag (TPID, PCP, DEI, VID)
- [ ] M Native VLAN, default VLAN, VLAN 1, VLAN range normal/extended
- [ ] M ISL (historis), voice VLAN, data VLAN
- [ ] M Inter-VLAN routing: router-on-a-stick, SVI, routed port
- [ ] M DTP (Dynamic Trunking Protocol) & kenapa dimatikan
- [ ] M VTP v1/v2/v3, VTP pruning, bahaya VTP
- [ ] M Private VLAN (isolated/community/promiscuous)
- [ ] P VLAN design: satu subnet per VLAN, penomoran, dokumentasi

### `03-data-link/04-stp.md`
- [ ] M Kenapa loop L2 fatal: broadcast storm, MAC flapping, duplikasi frame
- [ ] M STP 802.1D: BPDU, bridge ID, root bridge election, path cost, port roles
- [ ] M Port state: blocking, listening, learning, forwarding, disabled
- [ ] M Timer: hello, forward delay, max age; waktu konvergensi
- [ ] M RSTP 802.1w: port role (root/designated/alternate/backup), edge port, proposal-agreement
- [ ] M PVST+, Rapid PVST+, MST 802.1s (instance, region)
- [ ] M PortFast, BPDU Guard, BPDU Filter, Root Guard, Loop Guard, UplinkFast, BackboneFast
- [ ] M UDLD, Bridge Assurance
- [ ] P Root bridge placement, load balancing per-VLAN, troubleshooting STP
- [ ] P Alternatif STP: MLAG/vPC/stacking, TRILL/SPB (historis), fabric

### `03-data-link/05-etherchannel.md`
- [ ] M Konsep link aggregation, kenapa bukan sekadar dua kabel
- [ ] M LACP 802.3ad (active/passive), PAgP (desirable/auto), static/on
- [ ] M Load balancing hash (src-mac, dst-ip, src-dst-ip, dll) & keterbatasannya
- [ ] M L2 vs L3 EtherChannel, syarat konsistensi konfigurasi
- [ ] M Troubleshooting: mismatch, suspended port, misconfig guard
- [ ] P MLAG, vPC, VSS, stackwise — agregasi lintas chassis

### `03-data-link/06-discovery-dan-l2-lain.md`
- [ ] M CDP & LLDP (LLDP-MED), informasi yang dibawa, risiko keamanan
- [ ] M PPP (LCP/NCP, autentikasi PAP/CHAP), HDLC, PPPoE
- [ ] M Frame Relay & ATM (konteks historis, kenapa perlu tahu)
- [ ] M MAC-based tunneling: pengantar VXLAN (detail di tahap 16)

---

## TAHAP 4: NETWORK LAYER (LAYER 3, IPv4)

### `04-network-layer/01-ipv4.md`
- [ ] M Format alamat IPv4, dotted decimal, 32 bit
- [ ] M Network portion vs host portion, subnet mask, prefix length
- [ ] M Kelas A/B/C/D/E (historis) & classless
- [ ] M Alamat khusus: 0.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16 (APIPA), 224/4 multicast, 255.255.255.255
- [ ] M RFC 1918 private, RFC 6598 CGNAT (100.64/10), RFC 5737 dokumentasi
- [ ] M Network address, broadcast address, usable host range
- [ ] M Unicast, broadcast, multicast, anycast
- [ ] M Header IPv4 field demi field: version, IHL, DSCP/ECN, total length, ID, flags, fragment offset, TTL, protocol, checksum, src, dst, options
- [ ] M Fragmentasi & reassembly, MTU discovery, DF bit

### `04-network-layer/02-subnetting.md`
- [ ] M Kenapa subnetting (efisiensi + isolasi broadcast)
- [ ] M Menghitung: jumlah subnet, jumlah host, mask, network ID, broadcast, range
- [ ] M Metode cepat (magic number / block size)
- [ ] M Subnetting /24, /16, /8 — 30+ contoh berlatih
- [ ] M Menentukan apakah dua IP satu subnet
- [ ] M Tabel referensi lengkap /1–/32

### `04-network-layer/03-vlsm-cidr.md`
- [ ] M VLSM: alokasi berbeda ukuran, urutan besar→kecil
- [ ] M Desain IP plan untuk topologi nyata (studi kasus)
- [ ] M CIDR, supernetting, route summarization/aggregation
- [ ] M Wildcard mask (ACL & OSPF), konversi dari subnet mask
- [ ] M /30 vs /31 untuk link point-to-point [RFC 3021]
- [ ] P Hierarchical addressing untuk summarization yang rapi

### `04-network-layer/04-arp-icmp.md`
- [ ] M ARP: request/reply, ARP cache, ARP table, aging
- [ ] M Gratuitous ARP, Proxy ARP, ARP untuk gateway
- [ ] M RARP/BOOTP (historis)
- [ ] M ICMP: struktur, tipe & kode penting (0/8 echo, 3 unreachable + kode, 5 redirect, 11 time exceeded)
- [ ] M Cara kerja `ping` dan `traceroute` (TTL & port trick), perbedaan implementasi Windows/Linux
- [ ] M Path MTU Discovery dan kenapa blokir ICMP total itu buruk
- [ ] P ICMP rate limiting, ICMP dalam troubleshooting nyata

### `04-network-layer/05-routing-dasar.md`
- [ ] M Routing table: destination, mask, next hop, interface, metric, AD
- [ ] M Longest prefix match — proses keputusan forwarding
- [ ] M Directly connected, local, static, dynamic route
- [ ] M Default route, gateway of last resort, 0.0.0.0/0
- [ ] M Administrative distance (tabel nilai default)
- [ ] M Control plane vs data plane vs management plane
- [ ] M RIB vs FIB, CEF, process switching vs fast switching
- [ ] M Recursive lookup, route resolution
- [ ] M Routing vs switching vs bridging
- [ ] M Membaca `show ip route` / `ip route show` baris demi baris
- [ ] M Asymmetric routing, black hole, routing loop

---

## TAHAP 5: TRANSPORT (LAYER 4)

### `05-transport/01-port-socket.md`
- [ ] M Port number 0-65535, well-known/registered/dynamic
- [ ] M Socket = IP + port + protokol; 5-tuple
- [ ] M Multiplexing/demultiplexing
- [ ] M Daftar port penting (lengkap di `referensi/daftar-port.md`)
- [ ] M `ss` / `netstat` membaca listening & established

### `05-transport/02-tcp.md`
- [ ] M Header TCP field demi field (seq, ack, flags, window, checksum, urgent, options)
- [ ] M Three-way handshake, ISN, SYN/ACK
- [ ] M Sequence & acknowledgment number, byte-stream semantics
- [ ] M Sliding window, flow control, window scaling, zero window
- [ ] M Retransmission, RTO, Karn's algorithm, fast retransmit, SACK
- [ ] M Delayed ACK, Nagle's algorithm, interaksi buruk keduanya
- [ ] M Teardown 4-way, half-close, RST
- [ ] M State machine lengkap (LISTEN, SYN-SENT, ESTABLISHED, FIN-WAIT, TIME-WAIT, dll)
- [ ] M TIME_WAIT: kenapa 2×MSL, masalah di server sibuk
- [ ] M Keepalive, MSS, MSS clamping
- [ ] P Head-of-line blocking, incast, SYN flood & SYN cookie

### `05-transport/03-udp-quic.md`
- [ ] M Header UDP (4 field), kesederhanaan & konsekuensinya
- [ ] M Kapan UDP lebih baik; aplikasi yang memakainya
- [ ] M UDP checksum opsional (IPv4) vs wajib (IPv6)
- [ ] M QUIC [RFC 9000]: stream, 0-RTT, connection ID, migrasi, enkripsi wajib
- [ ] M HTTP/3 di atas QUIC [RFC 9114]; kenapa lolos dari HOL blocking TCP
- [ ] M SCTP, DCCP (sekilas)

### `05-transport/04-congestion-control.md`
- [ ] M Congestion vs flow control (beda!)
- [ ] M Slow start, congestion avoidance, AIMD, cwnd, ssthresh
- [ ] M Tahoe, Reno, NewReno, CUBIC, BBR — perbedaan filosofi
- [ ] M ECN, AQM (RED, CoDel, FQ-CoDel), bufferbloat
- [ ] M MSS/MTU/PMTUD interaksi, MTU mismatch & gejalanya
- [ ] P Tuning buffer & BDP untuk link long-fat

---

## TAHAP 6: APLIKASI (LAYER 7) & LAYANAN INTI

### `06-aplikasi/01-dns.md`
- [ ] M Namespace hierarkis, root, TLD, SLD, FQDN, trailing dot
- [ ] M Resolver stub, recursive, authoritative, forwarder
- [ ] M Query iteratif vs rekursif — alur lengkap dari root
- [ ] M Record: A, AAAA, CNAME, MX, NS, PTR, SOA, TXT, SRV, CAA, ALIAS/ANAME
- [ ] M Zone file, SOA field, serial, TTL, negative caching
- [ ] M Zone transfer AXFR/IXFR, notify, primary/secondary
- [ ] M Reverse DNS, in-addr.arpa, ip6.arpa
- [ ] M Root hints, 13 root server & anycast
- [ ] M DNSSEC: DS, DNSKEY, RRSIG, chain of trust
- [ ] M DoT (853), DoH (443), DoQ, ODoH; implikasi privasi & operasional
- [ ] M EDNS0, DNS cookies, ANY/refuse, response rate limiting
- [ ] P Membangun resolver sendiri (Unbound/BIND/dnsmasq/Knot) — langkah lengkap
- [ ] P Split-horizon DNS, GeoDNS, DNS load balancing, anycast DNS
- [ ] P Troubleshooting DNS dengan `dig` (+trace, +norec, +dnssec)

### `06-aplikasi/02-dhcp.md`
- [ ] M DORA: Discover, Offer, Request, Ack; port 67/68
- [ ] M Lease, renewal T1/T2, rebinding, release, decline, inform
- [ ] M Option penting: 1, 3, 6, 15, 51, 53, 55, 66/67, 82, 121, 150
- [ ] M DHCP relay (ip helper-address), giaddr
- [ ] M Reservation, exclusion, scope, pool
- [ ] M DHCP server & client di Cisco dan Linux (Kea/dnsmasq)
- [ ] M DHCPv6 (stateful/stateless), RA interaksi, prefix delegation
- [ ] M Rogue DHCP & DHCP snooping (mitigasi detail di tahap 12)

### `06-aplikasi/03-http.md`
- [ ] M Request/response, method, status code, header, body
- [ ] M HTTP/1.0 vs 1.1: keep-alive, pipelining, chunked, Host
- [ ] M HTTP/2: binary framing, multiplexing, HPACK, server push (dan pencabutannya)
- [ ] M HTTP/3: QUIC, QPACK, Alt-Svc
- [ ] M Cookie, session, CORS, cache header (Cache-Control, ETag)
- [ ] M REST, CRUD ↔ HTTP verb, JSON encoding, status code semantics
- [ ] M WebSocket, SSE, gRPC (HTTP/2)
- [ ] P Reverse proxy, load balancer L4 vs L7, CDN, cache hierarchy

### `06-aplikasi/04-tls-pki.md`
- [ ] M Kriptografi dasar: simetris, asimetris, hash, HMAC, KDF, forward secrecy
- [ ] M TLS handshake 1.2 vs 1.3 [RFC 8446], 0-RTT
- [ ] M Cipher suite anatomy, ECDHE, AEAD (AES-GCM, ChaCha20-Poly1305)
- [ ] M Sertifikat X.509, field, SAN, chain, root/intermediate CA
- [ ] M PKI, CSR, CA, self-signed, Let's Encrypt/ACME
- [ ] M Revocation: CRL, OCSP, OCSP stapling, short-lived cert
- [ ] M SNI, ESNI/ECH, mTLS, certificate pinning
- [ ] M Kesalahan sertifikat umum & cara membaca error
- [ ] P TLS inspection/interception di enterprise — teknis & etika
- [ ] P Debug dengan `openssl s_client`, `curl -v`, `sslyze`

### `06-aplikasi/05-layanan-lain.md`
- [ ] M Email: SMTP (25/465/587), IMAP (143/993), POP3 (110/995), MIME
- [ ] M SPF, DKIM, DMARC, MTA-STS — anti-spoofing
- [ ] M FTP (aktif vs pasif!), FTPS, SFTP, TFTP
- [ ] M SSH: key exchange, autentikasi kunci, port forwarding (L/R/D), jump host
- [ ] M Telnet (dan kenapa dilarang), console, out-of-band management
- [ ] M NTP: stratum, hierarki, `ntpq`, chrony, PTP untuk presisi
- [ ] M SNMP v1/v2c/v3: OID, MIB, GET/SET/TRAP/INFORM, community vs USM
- [ ] M Syslog: facility, severity 0-7, format RFC 3164 vs 5424, relay
- [ ] M LDAP/AD, Kerberos (sekilas), RADIUS/TACACS+ (detail di tahap 12)
- [ ] M SMB/CIFS, NFS, iSCSI (detail di tahap 16)
- [ ] M RDP, VNC, mDNS/Bonjour, SSDP/UPnP, NetBIOS

---

## TAHAP 7: ROUTING LANJUTAN

### `07-routing-lanjutan/01-static-routing.md`
- [ ] M Sintaks static route (Cisco & Linux), next-hop vs exit-interface
- [ ] M Default route, host route /32, summary static
- [ ] M Floating static (AD manipulation) untuk backup
- [ ] M Recursive vs directly attached static, kegagalan recursive lookup
- [ ] M Static route dengan tracking (IP SLA)
- [ ] M Kapan static lebih baik daripada dinamis

### `07-routing-lanjutan/02-konsep-routing-dinamis.md`
- [ ] M Distance vector vs link state vs path vector
- [ ] M Metric, cost, hop count, bandwidth, delay
- [ ] M Konvergensi, count-to-infinity, split horizon, route poisoning, holddown
- [ ] M Klasifikasi: IGP vs EGP, classful vs classless, interior/exterior
- [ ] M Passive interface, authentication routing protocol

### `07-routing-lanjutan/03-rip.md`
- [ ] M RIPv1 vs RIPv2 vs RIPng, hop limit 15
- [ ] M Timer, triggered update, autentikasi
- [ ] M Konfigurasi & verifikasi, kapan (tidak) dipakai

### `07-routing-lanjutan/04-ospf.md`
- [ ] M Link state database, SPF/Dijkstra, LSA flooding
- [ ] M Router ID, hello/dead interval, neighbor states (Down→Full)
- [ ] M Network type: broadcast, point-to-point, NBMA; DR/BDR election
- [ ] M Cost & reference bandwidth, auto-cost
- [ ] M Area: backbone 0, ABR, ASBR, virtual link
- [ ] M LSA type 1-7, stub/totally stub/NSSA
- [ ] M Autentikasi, passive interface, default-information originate
- [ ] M Summarization (area range, summary-address)
- [ ] M Single-area OSPFv2 (target CCNA) → multi-area (CCNP)
- [ ] M OSPFv3 untuk IPv6
- [ ] P Tuning: SPF throttle, LSA throttle, BFD, fast hello
- [ ] P Troubleshooting adjacency (MTU, network type, area, auth, subnet mismatch)

### `07-routing-lanjutan/05-eigrp.md`
- [ ] M DUAL, successor, feasible successor, feasibility condition
- [ ] M Metric composite (bandwidth, delay, K-values), wide metric
- [ ] M Topology table, query/reply, SIA
- [ ] M Stub router, summarization, unequal-cost load balancing (variance)
- [ ] M Named mode config, EIGRP for IPv6

### `07-routing-lanjutan/06-bgp.md`
- [ ] M AS number, eBGP vs iBGP, peering, TCP 179
- [ ] M Neighbor state machine (Idle→Established)
- [ ] M Path attributes: AS_PATH, NEXT_HOP, LOCAL_PREF, MED, ORIGIN, weight, communities
- [ ] M Best path selection algorithm (urutan lengkap)
- [ ] M iBGP full-mesh problem → route reflector, confederation
- [ ] M Route filtering: prefix-list, AS-path filter, route-map
- [ ] M Multihoming, traffic engineering inbound/outbound
- [ ] M Aggregation, AS_SET, atomic aggregate
- [ ] P Internet routing table growth, bogon filtering, max-prefix
- [ ] P RPKI/ROA/ROV, MANRS, IRR, hijack & leak, `bgpq4`
- [ ] P BGP untuk data center (eBGP di spine-leaf, unnumbered), MP-BGP EVPN
- [ ] P Graceful restart, BFD, add-path, flowspec

### `07-routing-lanjutan/07-redistribusi-policy.md`
- [ ] M Redistribusi antar protokol, seed metric, metric-type
- [ ] M Bahaya: routing loop, suboptimal path, feedback; mitigasi dengan tag & filter
- [ ] M Route-map, prefix-list, distribute-list, offset-list
- [ ] M Policy-based routing (PBR), VRF-lite
- [ ] M Manipulasi administrative distance
- [ ] P Multi-protocol design, migrasi protokol tanpa downtime

### `07-routing-lanjutan/08-fhrp.md`
- [ ] M Masalah default gateway tunggal
- [ ] M HSRP v1/v2: active/standby, priority, preempt, virtual MAC/IP
- [ ] M VRRP [RFC 5798], GLBP, load sharing per-VLAN
- [ ] M Interaksi FHRP dengan STP root & first-hop security
- [ ] P Alternatif modern: anycast gateway (EVPN), MLAG

### `07-routing-lanjutan/09-multicast.md`
- [ ] M Alamat multicast, MAC multicast mapping, TTL scoping
- [ ] M IGMP v1/v2/v3, IGMP snooping, querier
- [ ] M PIM dense/sparse mode, RP, RPF, SPT/RPT, SSM
- [ ] M Aplikasi nyata: IPTV, market data, imaging

---

## TAHAP 8: IPv6

### `08-ipv6/01-dasar-ipv6.md`
- [ ] M Alasan IPv6, exhaustion IPv4, status adopsi
- [ ] M Format 128-bit, hex, aturan penyingkatan (RFC 5952)
- [ ] M Header IPv6 vs IPv4, extension header, flow label
- [ ] M Tipe alamat: GUA (2000::/3), ULA (fc00::/7), LLA (fe80::/10), multicast (ff00::/8), anycast
- [ ] M Solicited-node multicast, well-known multicast address
- [ ] M Interface ID, EUI-64 modified, privacy extension, stable-privacy
- [ ] M Prefix planning /48, /56, /64 — kenapa /64 di LAN

### `08-ipv6/02-ndp-slaac-dhcpv6.md`
- [ ] M NDP: NS, NA, RS, RA, redirect; ganti ARP
- [ ] M DAD (Duplicate Address Detection), NUD
- [ ] M SLAAC, flag A/M/O di RA, router lifetime
- [ ] M DHCPv6 stateful vs stateless, IA_NA, prefix delegation (IA_PD)
- [ ] M RDNSS di RA (RFC 8106)
- [ ] M First-hop security IPv6: RA Guard, DHCPv6 Guard, IPv6 snooping

### `08-ipv6/03-routing-transisi-ipv6.md`
- [ ] M Static route IPv6, OSPFv3, EIGRPv6, MP-BGP untuk IPv6
- [ ] M Dual stack, happy eyeballs
- [ ] M Tunneling: 6in4, 6to4, Teredo, GRE, ISATAP (mana yang masih relevan)
- [ ] M Translation: NAT64/DNS64, 464XLAT, NPTv6
- [ ] M IPv6-only network + CLAT (mobile)
- [ ] P Strategi migrasi enterprise bertahap

---

## TAHAP 9: NAT, ACL, FIREWALL

### `09-nat-acl-firewall/01-nat.md`
- [ ] M Kenapa NAT ada, inside/outside local/global terminology
- [ ] M Static NAT, dynamic NAT (pool), PAT/NAPT/masquerade
- [ ] M Port forwarding, destination NAT, hairpin/NAT loopback
- [ ] M CGNAT, NAT444, port block allocation, logging & law enforcement
- [ ] M NAT traversal: STUN, TURN, ICE, UPnP/NAT-PMP; kenapa VoIP/P2P rewel
- [ ] M NAT & FTP/SIP ALG
- [ ] M Konfigurasi di Cisco IOS dan Linux nftables/iptables
- [ ] P NAT sebagai bukan-fitur-keamanan; NAT vs IPv6

### `09-nat-acl-firewall/02-acl.md`
- [ ] M Standard vs extended vs named ACL, numbered range
- [ ] M Wildcard mask, host/any, implicit deny
- [ ] M Penempatan (inbound/outbound, dekat source/destination)
- [ ] M Urutan aturan, sequence number, editing ACL aman
- [ ] M ACL untuk VTY, ACL untuk NAT/route-map, time-based ACL
- [ ] M IPv6 ACL, perbedaan penting (jangan blokir ICMPv6!)
- [ ] M Verifikasi & troubleshooting ACL (`show access-lists`, counter, log)

### `09-nat-acl-firewall/03-firewall.md`
- [ ] M Packet filter, stateful inspection, connection table
- [ ] M Application layer gateway, proxy firewall, NGFW, IPS/IDS terintegrasi
- [ ] M Zone-based policy firewall, security level (ASA), default deny
- [ ] M DMZ, screened subnet, dual-homed, bastion host
- [ ] M nftables/iptables: table, chain, hook, ruleset, conntrack
- [ ] M UFW/firewalld, Windows Defender Firewall
- [ ] M IDS vs IPS, signature vs anomaly, Snort/Suricata, Zeek
- [ ] M WAF, DDoS scrubbing, rate limiting
- [ ] P Rule hygiene, audit, change control, fail-open vs fail-close

---

## TAHAP 10: WIRELESS

### `10-wireless/01-rf-dasar.md`
- [ ] M Gelombang, frekuensi, amplitudo, fase, panjang gelombang
- [ ] M dB, dBm, dBi, mW; aturan 3/10 dB; EIRP, path loss, free space
- [ ] M Band 2.4/5/6 GHz, channel, channel width 20/40/80/160/320 MHz
- [ ] M Non-overlapping channel 2.4 GHz (1/6/11), DFS, TPC, UNII band
- [ ] M Antena: omni, directional, patch, yagi, MIMO, polarisasi, beamforming
- [ ] M SNR, RSSI, noise floor, co-channel interference, adjacent-channel
- [ ] M Multipath, fading, reflection, absorption bahan bangunan

### `10-wireless/02-802-11.md`
- [ ] M Generasi: 802.11 a/b/g/n(Wi-Fi 4)/ac(5)/ax(6/6E)/be(7)/bn(8, dalam proses)
- [ ] M CSMA/CA, DIFS/SIFS, RTS/CTS, ACK wajib, hidden node
- [ ] M Frame 802.11: management, control, data; beacon, probe, auth, assoc
- [ ] M SSID, BSSID, ESSID, BSS/ESS/IBSS, hidden SSID (dan kesia-siaannya)
- [ ] M Asosiasi step-by-step, roaming, 802.11k/v/r
- [ ] M OFDM, OFDMA, MU-MIMO, spatial stream, MCS, guard interval
- [ ] M Wi-Fi 6: OFDMA, BSS coloring, TWT, 1024-QAM
- [ ] M Wi-Fi 7: MLO, 320 MHz, 4096-QAM, multi-RU
- [ ] M Wi-Fi 8 (802.11bn UHR): fokus reliabilitas, Multi-AP coordination
- [ ] M Airtime fairness, rate shifting, kenapa satu client lambat menyeret semua

### `10-wireless/03-keamanan-wireless.md`
- [ ] M Open, WEP (rusak), WPA/TKIP, WPA2/CCMP, WPA3/GCMP+SAE
- [ ] M 4-way handshake, PMK/PTK/GTK, KRACK
- [ ] M WPA3-Personal (SAE), WPA3-Enterprise 192-bit, OWE (Enhanced Open)
- [ ] M PSK vs 802.1X/EAP: EAP-TLS, PEAP, EAP-TTLS, EAP-FAST
- [ ] M RADIUS integration, dynamic VLAN assignment
- [ ] M Captive portal, MAB, guest network isolation
- [ ] M Serangan: evil twin, deauth, rogue AP, WPS, PMKID; deteksi & mitigasi (WIPS)

### `10-wireless/04-desain-wlan.md`
- [ ] M Arsitektur: autonomous AP, lightweight + WLC (split-MAC), CAPWAP, cloud-managed, embedded
- [ ] M AP mode: local, FlexConnect, monitor, sniffer, mesh, bridge
- [ ] M Koneksi fisik WLC/AP: access vs trunk port, LAG
- [ ] M Site survey: predictive, passive, active; heatmap; AP placement & density
- [ ] M Capacity vs coverage design, cell overlap 15-20%, minimum RSSI
- [ ] M Konfigurasi WLAN via GUI (WLAN creation, security, QoS profile, advanced)
- [ ] M Mesh, bridge, point-to-point outdoor link
- [ ] P Troubleshooting wireless: sticky client, roaming gagal, interference, spectrum analyzer
- [ ] P Seluler: LTE/5G, NR, network slicing, private 5G vs Wi-Fi

---

## TAHAP 11: WAN & VPN

### `11-wan-vpn/01-teknologi-wan.md`
- [ ] M Leased line, T1/E1/T3, SONET/SDH (historis)
- [ ] M DSL, cable/DOCSIS, GPON/FTTH, satelit (GEO vs LEO), 4G/5G WAN
- [ ] M Metro Ethernet, E-Line/E-LAN/E-Tree, VPLS
- [ ] M MPLS: label, LSP, LER/LSR, L3VPN (VRF, RD, RT), L2VPN, TE
- [ ] M Segment Routing (SR-MPLS, SRv6) — pengantar
- [ ] M SD-WAN: overlay, controller, path selection, DIA, zero-touch
- [ ] M Last mile, CPE, demarc, CIR/EIR, SLA

### `11-wan-vpn/02-tunneling-vpn.md`
- [ ] M Konsep tunnel, overlay vs underlay, MTU/MSS di tunnel
- [ ] M GRE, GRE over IPsec, IP-in-IP
- [ ] M IPsec: AH vs ESP, transport vs tunnel mode, SA, SPI
- [ ] M IKEv1 (main/aggressive, phase 1/2) vs IKEv2, DH group, PFS
- [ ] M Site-to-site, remote access (IKEv2/EAP, AnyConnect/SSL VPN)
- [ ] M DMVPN phase 1/2/3, NHRP; FlexVPN
- [ ] M WireGuard: kesederhanaan, crypto-key routing, konfigurasi lengkap
- [ ] M OpenVPN, L2TP/IPsec, PPTP (jangan dipakai)
- [ ] M VXLAN/GENEVE (detail di tahap 16), L2TPv3
- [ ] P Troubleshooting VPN: NAT-T, MTU/fragmentasi, proposal mismatch, PSK/cert

### `11-wan-vpn/03-qos.md`
- [ ] M Kenapa QoS: bandwidth, delay, jitter, loss requirement per aplikasi
- [ ] M Model: best effort, IntServ, DiffServ
- [ ] M Klasifikasi & marking: CoS 802.1p, DSCP, IP precedence, tabel PHB (EF, AF, CS)
- [ ] M Trust boundary, marking di edge
- [ ] M Queueing: FIFO, PQ, CQ, WFQ, CBWFQ, LLQ; tail drop vs WRED
- [ ] M Shaping vs policing, token bucket, CIR/PIR/Bc/Be
- [ ] M Congestion avoidance, hierarchical QoS
- [ ] M QoS untuk VoIP (RTP, 150 ms one-way, jitter buffer) & video
- [ ] M QoS wireless (WMM), QoS di cloud/SD-WAN
- [ ] P Merancang policy QoS end-to-end 4/8/12 class

---

## TAHAP 12: KEAMANAN JARINGAN

### `12-keamanan/01-konsep-keamanan.md`
- [ ] M CIA triad, AAA, non-repudiation, defense in depth, least privilege
- [ ] M Threat, vulnerability, exploit, risk, mitigation (definisi CCNA)
- [ ] M Attack surface, kill chain, MITRE ATT&CK (pengantar)
- [ ] M Threat actor, insider threat, social engineering, phishing
- [ ] M Security program: user awareness, training, physical access control

### `12-keamanan/02-serangan-l2.md`
- [ ] M MAC flooding/CAM overflow → Port Security (sticky, violation mode)
- [ ] M ARP spoofing/poisoning & MITM → Dynamic ARP Inspection
- [ ] M Rogue DHCP & starvation → DHCP Snooping (trusted port, rate limit, option 82)
- [ ] M VLAN hopping (switch spoofing, double tagging) → matikan DTP, native VLAN aman
- [ ] M STP attack → BPDU Guard, Root Guard
- [ ] M CDP/LLDP recon, MAC/IP spoofing → IP Source Guard
- [ ] M Storm control, protected port, private VLAN
- [ ] M 802.1X port-based NAC, MAB, guest VLAN, critical auth

### `12-keamanan/03-serangan-l3-l7.md`
- [ ] M IP spoofing, uRPF, BCP38 anti-spoofing
- [ ] M ICMP abuse, smurf, fraggle
- [ ] M TCP SYN flood, RST injection, session hijacking
- [ ] M DNS: cache poisoning/Kaminsky, amplification, tunneling, NXDOMAIN attack
- [ ] M DDoS: volumetric, protocol, application; amplification factor; mitigasi (RTBH, flowspec, scrubbing, anycast)
- [ ] M On-path/MITM, SSL stripping, downgrade
- [ ] M Injection, XSS, CSRF (konteks jaringan/WAF)
- [ ] M Reconnaissance: port scan, OS fingerprint, banner grabbing; deteksi

### `12-keamanan/04-aaa-identitas.md`
- [ ] M Authentication vs Authorization vs Accounting
- [ ] M Local auth, enable secret, password policy, MFA, sertifikat, biometrik
- [ ] M RADIUS (UDP 1812/1813) vs TACACS+ (TCP 49) — perbandingan detail
- [ ] M Command authorization, privilege level, RBAC, role view
- [ ] M 802.1X + RADIUS + dynamic VLAN/dACL
- [ ] M NAC, posture assessment, ISE (konsep)
- [ ] M PKI untuk perangkat jaringan, SSH key management, bastion/jump host

### `12-keamanan/05-hardening-zero-trust.md`
- [ ] M Device hardening checklist (Cisco & Linux)
- [ ] M Control plane policing, management plane protection, out-of-band mgmt
- [ ] M Secure protocols only: SSHv2, HTTPS, SNMPv3, NTP auth, syslog TLS
- [ ] M Logging, time sync, log retention, SIEM, audit trail
- [ ] M Konfigurasi backup, config drift, golden config, change control
- [ ] M Zero Trust [NIST SP 800-207]: PDP/PEP, per-request decision, asumsi breach
- [ ] M Mikrosegmentasi, SASE/SSE, ZTNA vs VPN tradisional
- [ ] M Segmentasi: VLAN, VRF, firewall zone, host-based
- [ ] P Kerangka kepatuhan: NIST CSF 2.0, PCI DSS 4.0, ISO 27001, CIS Controls v8

### `12-keamanan/06-tools-keamanan.md`
- [ ] M nmap (host discovery, port scan, NSE) — pemakaian sah/berizin
- [ ] M Wireshark/tcpdump untuk analisis insiden
- [ ] M hping3, iperf3, scapy — pengujian terkontrol
- [ ] M Vulnerability scanner (OpenVAS/Nessus), config auditing
- [ ] M Etika & legalitas: izin tertulis, scope, rules of engagement

---

## TAHAP 13: LINUX NETWORKING (PRAKTIK)

### `13-linux-networking/01-iproute2.md`
- [ ] M `ip addr/link/route/neigh/rule` — pengganti ifconfig/route/arp
- [ ] M Membaca & mengubah routing table, multiple table, policy routing
- [ ] M `ss`, `ethtool`, `nmcli`, `resolvectl`, `tc`
- [ ] M Konfigurasi persisten: NetworkManager, systemd-networkd, netplan, ifupdown
- [ ] M sysctl network tuning (forwarding, rp_filter, somaxconn, buffer)

### `13-linux-networking/02-virtual-networking.md`
- [ ] M veth pair, network namespace, bridge (brctl → ip link)
- [ ] M VLAN interface (802.1q), bonding/teaming mode, macvlan/ipvlan
- [ ] M TUN/TAP, dummy, VXLAN interface, WireGuard interface
- [ ] M Membangun topologi router+switch murni pakai namespace (lab)

### `13-linux-networking/03-nftables-firewall.md`
- [ ] M Arsitektur netfilter: hook, table, chain, priority
- [ ] M nftables syntax lengkap, set, map, counter, NAT, masquerade
- [ ] M Migrasi iptables → nftables, konteks legacy
- [ ] M conntrack, state matching, connection tracking helper
- [ ] M firewalld/UFW abstraksi

### `13-linux-networking/04-layanan-jaringan-linux.md`
- [ ] P DNS resolver: Unbound & BIND9 (config lengkap, root hints, DNSSEC, forwarder)
- [ ] P DHCP server: Kea & dnsmasq (subnet, reservation, option, logging)
- [ ] P nginx/HAProxy sebagai reverse proxy & LB (L4/L7, health check, TLS termination)
- [ ] P chrony/NTP server, stratum lokal
- [ ] P Radius: FreeRADIUS untuk 802.1X
- [ ] P Monitoring agent: node_exporter, snmpd, rsyslog/journald forwarding
- [ ] P Routing daemon Linux: FRRouting (OSPF/BGP di Linux), BIRD

---

## TAHAP 14: MONITORING & TROUBLESHOOTING

### `14-monitoring-troubleshooting/01-metodologi.md`
- [ ] P Metodologi CompTIA 7 langkah & OSI top-down/bottom-up/divide-conquer
- [ ] P Menentukan scope, membedakan gejala vs penyebab
- [ ] P Baseline & change correlation ("apa yang berubah?")
- [ ] P Dokumentasi insiden, RCA, postmortem blameless
- [ ] P Eskalasi & komunikasi saat outage

### `14-monitoring-troubleshooting/02-tools.md`
- [ ] P ping, traceroute/tracert, mtr, pathping — dan cara salah menafsirkannya
- [ ] P dig/nslookup/host, curl/wget verbose, telnet/nc port test
- [ ] P tcpdump: filter BPF lengkap, capture di titik yang tepat
- [ ] P Wireshark: display filter, follow stream, IO graph, expert info, TCP analysis
- [ ] P iperf3 (TCP/UDP, parallel, reverse), speedtest, bandwidth vs throughput
- [ ] P nmap, arp-scan, ss, netstat, ethtool, ip -s link
- [ ] P Cisco: show/debug penting, SPAN/RSPAN/ERSPAN, packet capture on-box
- [ ] P Cable tester, light meter, spectrum analyzer, loopback plug

### `14-monitoring-troubleshooting/03-observability.md`
- [ ] P SNMP polling vs streaming telemetry (gNMI/gRPC)
- [ ] P NetFlow/IPFIX/sFlow — flow record, sampling, collector
- [ ] P Syslog centralization, structured logging
- [ ] P Prometheus + node/snmp exporter + Grafana (dashboard jaringan)
- [ ] P Zabbix/LibreNMS/Observium/Netdata, alerting & threshold
- [ ] P Synthetic monitoring, RUM, SLA/SLO/SLI, error budget
- [ ] P Capacity planning & trending, 95th percentile billing

### `14-monitoring-troubleshooting/04-studi-kasus.md`
- [ ] P 15 skenario nyata dengan alur diagnosis lengkap:
      DNS lambat, duplex mismatch, MTU black hole, asymmetric routing, STP loop,
      DHCP habis, ARP conflict, sticky wireless client, BGP flap, NAT exhaustion,
      TLS cert expired, ACL salah arah, VLAN hilang di trunk, congestion vs loss,
      "internet lambat" tanpa gejala jelas

---

## TAHAP 15: OTOMASI & PROGRAMMABILITY

### `15-otomasi/01-mengapa-otomasi.md`
- [ ] P Dampak otomasi ke operasi (konsistensi, kecepatan, audit)
- [ ] P Traditional vs controller-based networking
- [ ] P Arsitektur SDN: control plane vs data plane, northbound/southbound API
- [ ] P Overlay, underlay, fabric (definisi CCNA)
- [ ] P AI/ML dalam operasi jaringan: prediktif, generatif, AIOps — dan batasnya
- [ ] P Infrastructure as Code, idempotensi, source of truth

### `15-otomasi/02-data-dan-api.md`
- [ ] P JSON (struktur, tipe, parsing), YAML, XML — dan kapan masing-masing
- [ ] P REST API: HTTP verb ↔ CRUD, status code, autentikasi (basic, token, OAuth), rate limit
- [ ] P NETCONF + YANG (datastore, candidate, commit), RESTCONF, gNMI/gRPC
- [ ] P Postman/curl untuk eksplorasi API perangkat

### `15-otomasi/03-python-jaringan.md`
- [ ] P Python esensial untuk network engineer (struktur data, file, error handling, venv)
- [ ] P Netmiko: koneksi SSH, send_command, send_config_set, TextFSM
- [ ] P NAPALM: getter, config merge/replace, diff, rollback
- [ ] P Nornir: inventory, task, parallel, plugin (netmiko/napalm/scrapli)
- [ ] P Scrapli & scrapli-netconf, ncclient
- [ ] P Jinja2 templating konfigurasi, pyATS/Genie untuk validasi
- [ ] P Scapy: membuat & mengirim paket, prototipe protokol
- [ ] P requests/httpx untuk REST API perangkat & controller

### `15-otomasi/04-ansible-cicd.md`
- [ ] P Ansible: inventory, playbook, module jaringan, ios_config, gather facts
- [ ] P Idempotensi, check mode, diff, handler, vault untuk kredensial
- [ ] P Role & collection (cisco.ios, arista.eos, junipernetworks.junos)
- [ ] P Terraform untuk jaringan & cloud (provider, state, plan/apply)
- [ ] P Git workflow: branch, PR, review; config in Git
- [ ] P CI/CD pipeline jaringan: lint → build → test (Containerlab/batfish) → deploy
- [ ] P NetBox sebagai Source of Truth, dynamic inventory
- [ ] P Praktik aman: dry run, blast radius, rollback plan, approval gate

### `15-otomasi/05-rekayasa-perangkat-lunak.md`
- [ ] P Alur Git: branch, commit, merge vs rebase, pull request, membaca unified diff
- [ ] P Pengujian: pytest, TDD singkat, test double untuk perangkat
- [ ] P Pola desain otomasi: adapter per vendor, idempotensi, retry dengan backoff
- [ ] P REST API: pagination, rate limit (429, Retry-After), webhook vs polling, diagram sekuens
- [ ] P Dockerfile minimal, venv dan dependensi, rahasia di luar repo
- [ ] P Pemetaan ke CCNA Automation 200-901 v1.1 (domain 1.0, 2.0, 4.0, 5.0)

---

## TAHAP 16: DATA CENTER, CLOUD, SDN, CONTAINER

### `16-datacenter-cloud-sdn/01-desain-dc.md`
- [ ] P 3-tier vs spine-leaf (CLOS), ToR/EoR/MoR, oversubscription ratio
- [ ] P East-west vs north-south traffic, ECMP, non-blocking fabric
- [ ] P MLAG/vPC, fabric peering, cabling & power/cooling dasar, hot/cold aisle
- [ ] P Out-of-band management network

### `16-datacenter-cloud-sdn/02-overlay-vxlan-evpn.md`
- [ ] P Kenapa overlay: VLAN 4096 limit, mobilitas, multi-tenancy
- [ ] P VXLAN: VNI, VTEP, encapsulation, MTU, flood & learn
- [ ] P BGP EVPN: route type 1-5, MAC/IP advertisement, anycast gateway, ARP suppression
- [ ] P VRF & L3VNI, multi-tenancy, distributed routing
- [ ] P GENEVE, NVGRE, STT (konteks)

### `16-datacenter-cloud-sdn/03-storage-virtualisasi.md`
- [ ] P iSCSI, FC/FCoE, NVMe-oF, zoning, multipath (dasar)
- [ ] P vSwitch, distributed switch, port group, VMkernel
- [ ] P SR-IOV, DPDK, passthrough, virtio; VRF vs VM vs container
- [ ] P Server virtualization vs containers vs VRF (definisi CCNA)

### `16-datacenter-cloud-sdn/04-cloud-networking.md`
- [ ] P Model layanan IaaS/PaaS/SaaS, shared responsibility
- [ ] P VPC/VNet: CIDR, subnet, route table, IGW/NAT GW, AZ/region
- [ ] P Security Group vs NACL vs firewall policy
- [ ] P Peering (non-transitif!), Transit Gateway / Virtual WAN / NCC
- [ ] P PrivateLink/Private Endpoint/Private Service Connect
- [ ] P Hybrid: VPN, Direct Connect/ExpressRoute/Interconnect
- [ ] P Cloud LB (NLB/ALB/GLB), cloud DNS, CDN, WAF, anycast
- [ ] P Perbandingan AWS vs Azure vs GCP untuk konsep yang sama
- [ ] P Biaya jaringan cloud (egress!), monitoring & flow logs

### `16-datacenter-cloud-sdn/05-container-kubernetes.md`
- [ ] P Docker networking: bridge, host, none, macvlan, overlay, port publish
- [ ] P Model jaringan Kubernetes: pod IP, flat network, no NAT antar pod
- [ ] P CNI: bridge, Flannel, Calico, Cilium (eBPF); kube-proxy & penggantinya
- [ ] P Service: ClusterIP, NodePort, LoadBalancer, headless; kube-dns/CoreDNS
- [ ] P Ingress (status retirement ingress-nginx) → Gateway API
- [ ] P NetworkPolicy, mikrosegmentasi pod
- [ ] P Service mesh: sidecar vs ambient, mTLS, observability
- [ ] P eBPF untuk jaringan & observability

### `16-datacenter-cloud-sdn/06-sdn.md`
- [ ] P Sejarah SDN, OpenFlow, controller (ODL/ONOS)
- [ ] P Cisco SD-Access, ACI, Catalyst Center; Meraki cloud-managed
- [ ] P Intent-based networking, assurance, closed-loop
- [ ] P White box, SONiC, DPU/smartNIC, disaggregasi

---

## TAHAP 17: DESAIN & ARSITEKTUR

### `17-desain-arsitektur/01-prinsip-desain.md`
- [ ] P Hierarchical & modular design, access/distribution/core
- [ ] P Requirement gathering, constraint, trade-off (biaya vs redundansi)
- [ ] P Availability math: 99.9% vs 99.99%, MTBF/MTTR, redundansi N+1/2N
- [ ] P Failure domain, blast radius, graceful degradation
- [ ] P Scalability, summarization boundary, konvergensi

### `17-desain-arsitektur/02-desain-per-domain.md`
- [ ] P Campus LAN design (L2 vs L3 access, routed access)
- [ ] P Branch/SOHO design, WAN edge, internet edge, DMZ
- [ ] P Data center & cloud edge, colocation, IXP
- [ ] P Remote work/hybrid: VPN vs ZTNA
- [ ] P IoT/OT network segmentation (IEC 62443 dasar)

### `17-desain-arsitektur/03-perencanaan-dokumentasi.md`
- [ ] P IP address plan (hierarkis, ringkas, ruang tumbuh) + IPAM
- [ ] P VLAN plan, naming convention, ASN & prefix planning
- [ ] P Diagram: L1/L2/L3 logical, rack elevation, cable schedule
- [ ] P Runbook, MOP, change window, rollback plan, maintenance
- [ ] P Asset inventory, lifecycle, EoL/EoS, spare & RMA
- [ ] P Dokumentasi as-code (NetBox, Git, diagram-as-code)

### `17-desain-arsitektur/04-studi-kasus-desain.md`
- [ ] P Kasus 1: kantor 50 user, 1 lokasi, budget minimal
- [ ] P Kasus 2: perusahaan 500 user, 5 cabang, VoIP + Wi-Fi + internet redundan
- [ ] P Kasus 3: data center kecil + DR site + koneksi cloud
- [ ] P Kasus 4: ISP/WISP kecil (BGP multihoming, CGNAT, RPKI)
- [ ] P Kasus 5: migrasi kampus L2 ke routed access tanpa downtime

### `17-desain-arsitektur/05-operasi-kontinuitas.md`
- [ ] P RPO, RTO, MTTR, MTBF, MTTF; menghitung availability (99,9% = 43,2 menit per bulan)
- [ ] P Hot, warm, cold site, DR di cloud; backup full/incremental/differential, aturan 3-2-1
- [ ] P Uji DR dan tabletop exercise
- [ ] P Manajemen perubahan: RFC, CAB, standard/normal/emergency change; MOP, pre/post-check, rollback
- [ ] P Siklus hidup aset (EOL/EOS, decommissioning aman), SLI/SLO, postmortem tanpa menyalahkan
- [ ] P Praktik: Cisco archive/configure replace, MikroTik safe mode dan /export, Linux etckeeper dan netplan try

---

## TAHAP 18: KARIER & SERTIFIKASI

### `18-karier-sertifikasi/01-peta-sertifikasi.md`
- [ ] Peta lengkap: CompTIA (Network+, Security+), Cisco (CCST/CCNA/CCNP/CCIE),
      Juniper (JNCIA/JNCIS), Arista, Fortinet NSE, Palo Alto PCNSA/PCNSE,
      AWS ANS, Azure AZ-700, Google PCNE, Aruba ACA/ACP, Wireshark WCNA
- [ ] Urutan yang masuk akal & biaya

### `18-karier-sertifikasi/02-peta-ccna.md`
- [ ] Pemetaan setiap topik blueprint CCNA v1.1 → file di repo ini

### `18-karier-sertifikasi/03-peta-networkplus.md`
- [ ] Pemetaan 5 domain N10-009 → file di repo ini

### `18-karier-sertifikasi/04-portofolio-interview.md`
- [ ] Portofolio: lab GitHub, blog, home lab, kontribusi
- [ ] Pertanyaan interview umum + cara menjawab (teknis & skenario)
- [ ] Jalur karier: NOC → Network Engineer → Senior/Architect → Automation/SRE
- [ ] Roadmap 12 bulan konkret

---

## TAHAP 19: MIKROTIK ROUTEROS (JALUR KHUSUS)

> Bisa dimulai setelah Tahap 4. Wajib bagi yang bekerja dengan ISP kecil,
> RT/RW-Net, hotel, atau UKM di Indonesia.

### `19-mikrotik/01-pengenalan-routeros.md`
- [ ] D Lini produk (hEX, RB, CCR, CRS, CHR), RouterOS v6 vs v7
- [ ] D Akses: WinBox (termasuk lewat MAC address), WebFig, SSH, API, REST API
- [ ] M Struktur CLI hierarkis, `print`/`add`/`set`/`remove`/`find`/`export`
- [ ] M Safe Mode (Ctrl+X) — wajib untuk perubahan jarak jauh
- [ ] M `/export` vs `/system backup`
- [ ] M Konfigurasi awal wajib & hardening dasar
- [ ] M Tabel padanan Cisco ↔ MikroTik ↔ Linux
- [ ] M Interface, IP address, static route, `distance`, `check-gateway`

### `19-mikrotik/02-bridge-vlan-switching.md`
- [ ] M Bridge sebagai switch; hardware offload dan apa yang mematikannya
- [ ] M Bridge VLAN filtering: `pvid`, `tagged`, `untagged`
- [ ] M VLAN interface langsung (router-on-a-stick)
- [ ] M `horizon` (port isolation), bridge filter
- [ ] M RSTP/MSTP di bridge, edge port, BPDU guard
- [ ] M Bonding (LACP), `l2mtu`

### `19-mikrotik/03-firewall-nat.md`
- [ ] M Arsitektur firewall: chain `input`/`forward`/`output`
- [ ] M Tabel `filter`, `nat`, `mangle`, `raw`
- [ ] M Connection tracking & connection state
- [ ] M Address list (statis dan dinamis)
- [ ] M `srcnat`/`masquerade`, `dstnat`/port forwarding, hairpin NAT
- [ ] M FastTrack dan dampaknya pada queue/mangle
- [ ] M Template firewall produksi lengkap
- [ ] P Anti port-scan, brute force protection, blackhole otomatis
- [ ] P Layer7 protocol matcher dan keterbatasannya

### `19-mikrotik/04-qos-queue-hotspot.md`
- [ ] M Simple Queue vs Queue Tree
- [ ] M PCQ (Per Connection Queue) untuk pembagian adil
- [ ] M Burst, priority, limit-at vs max-limit
- [ ] M Mangle untuk klasifikasi trafik
- [ ] P Hotspot: login page, user profile, walled garden, trial
- [ ] P User Manager (RADIUS bawaan MikroTik)
- [ ] P PPPoE server + rate-limit per pelanggan (model RT/RW-Net)

### `19-mikrotik/05-wireless-mikrotik.md`
- [ ] M Wireless (v6) vs WiFi (v7) — perbedaan menu
- [ ] M Mode: ap-bridge, station, bridge, station-pseudobridge
- [ ] M Security profile: WPA2/WPA3, PSK, EAP
- [ ] M Nstreme dan NV2 (protokol proprietary MikroTik untuk PtP/PtMP)
- [ ] M CAPsMAN — manajemen AP terpusat
- [ ] P Wireless PtP/PtMP outdoor, alignment, registration table
- [ ] P Access list & connect list

### `19-mikrotik/06-vpn-tunnel.md`
- [ ] M EoIP, GRE, IPIP
- [ ] M PPTP/L2TP (dan kenapa PPTP dilarang)
- [ ] M SSTP, OVPN
- [ ] M **WireGuard** (RouterOS v7)
- [ ] M IPsec: policy-based dan route-based
- [ ] P Site-to-site dan remote access lengkap
- [ ] P Troubleshooting VPN MikroTik

### `19-mikrotik/07-monitoring-scripting.md`
- [ ] P `/tool torch` — analisis trafik real-time
- [ ] P `/tool sniffer` — capture paket, kirim ke Wireshark (TZSP)
- [ ] P `/tool netwatch`, `/system scheduler`
- [ ] P Graphing, SNMP, The Dude
- [ ] P Bahasa skrip RouterOS: variabel, loop, kondisi, fungsi
- [ ] P REST API dan API biner untuk otomasi
- [ ] P Integrasi dengan Ansible/Python (librouteros, routeros_api)
- [ ] P Backup otomatis terjadwal + notifikasi Telegram/email

---

## TAHAP 22: JARINGAN SERVICE PROVIDER (JALUR KHUSUS)

Inti jaringan operator dan ISP, multi-vendor (Cisco IOS XR/XE, Junos, MikroTik v7, FRRouting), dengan lab containerlab/FRR yang bisa dijalankan gratis.

### `22-service-provider/01-mpls-ldp.md`
- [ ] Header label, FEC, LIB/LFIB, PHP dan explicit-null, TTL; LDP, LDP-IGP sync, session protection, MTU
### `22-service-provider/02-mpls-l3vpn.md`
- [ ] VRF, RD/RT, MP-BGP VPNv4/VPNv6, PE-CE, RR, hub-and-spoke, inter-AS option A/B/C
### `22-service-provider/03-te-segment-routing.md`
- [ ] RSVP-TE, SR-MPLS, migrasi LDP ke SR, TI-LFA, SR Policy, Flex-Algo, PCE/BGP-LS, SRv6 uSID
### `22-service-provider/04-l2vpn-carrier-ethernet.md`
- [ ] Pseudowire, VPWS, VPLS, EVPN-MPLS, MEF, QinQ/PBB, G.8032, CFM/Y.1731
### `22-service-provider/05-sp-ketersediaan-keamanan.md`
- [ ] GR/NSR, BFD, BGP PIC dan Add-Path, CoPP/LPTS, uRPF, GTSM, graceful shutdown

---

## TAHAP 23: JALUR VENDOR LANJUTAN (PENDALAMAN)

Spesialisasi sesudah Tahap 22, untuk jalur JNCIA dan lingkungan Cisco enterprise. Tidak diuji di CCNA, Network+, atau MTCNA.

### `23-jalur-vendor/01-junos.md`
- [ ] Arsitektur RE/PFE, mode operasional vs konfigurasi, candidate config, commit, commit confirmed, rollback
- [ ] Hierarki set, interface unit, routing-instance, OSPF dan BGP dasar, policy-options; perbandingan dengan IOS dan MikroTik v7
### `23-jalur-vendor/02-sd-access-sd-wan.md`
- [ ] SD-Access: underlay IS-IS, LISP + VXLAN, SGT, peran node, Catalyst Center
- [ ] Catalyst SD-WAN: Manager, Controller, Validator, WAN Edge, OMP, TLOC, kebijakan aplikasi
### `23-jalur-vendor/03-api-platform-cisco.md`
- [ ] Catalyst Center Intent API, Meraki Dashboard API, NSO; token, pagination, rate limit, contoh Python

---

## TAHAP 21: EKOSISTEM PROFESI (32 PERAN DI SEKITAR JARINGAN)

Tujuan tahap: memahami ke mana fondasi jaringan bisa membawa, apa yang benar-benar dikerjakan
tiap profesi, dan modul mana di kurikulum ini yang menjadi bekalnya. Di aplikasi, tahap ini
dilengkapi **Peta Profesi** interaktif (`/karier`): konstelasi profesi, kesiapan pribadi
berdasarkan modul yang sudah tuntas, kuis kecocokan, dan perencana perpindahan karier.

### `21-ekosistem-profesi/01-peta-ekosistem.md`
- [ ] Network engineer vs network administrator: tanggung jawab, kedalaman, jenjang
- [ ] Enam rumpun dan irisannya dengan jaringan; pola transisi karier yang umum
- [ ] Kerangka kompetensi rujukan: NICE (NIST SP 800-181), SFIA, SKKNI/BNSP, O*NET

### `21-ekosistem-profesi/02-rumpun-infrastruktur.md`
- [ ] Network architect, cloud network engineer, wireless, telekomunikasi, VoIP, data center, NOC

### `21-ekosistem-profesi/03-rumpun-keamanan.md`
- [ ] Network security engineer, cybersecurity analyst, penetration tester, security architect, incident responder

### `21-ekosistem-profesi/04-rumpun-operasi-sistem-data.md`
- [ ] SysAdmin, DBA, storage administrator, system engineer, IT operations manager

### `21-ekosistem-profesi/05-rumpun-devops-sre.md`
- [ ] DevOps engineer, SRE, cloud infrastructure engineer, automation engineer

### `21-ekosistem-profesi/06-rumpun-dukungan-lapangan.md`
- [ ] IT support/helpdesk, field network technician, hardware engineer, IT asset manager

### `21-ekosistem-profesi/07-rumpun-tata-kelola-konsultasi.md`
- [ ] IT consultant, IT auditor, disaster recovery specialist, solution architect, scrum master infrastruktur

---

## LAB & REFERENSI

### `lab/`
- [ ] `00-setup-lab.md` — pilih & pasang Packet Tracer / GNS3 / Containerlab / MikroTik CHR / Linux
- [ ] `01-lab-fondasi-switching.md` — IP dasar, VLAN, trunk, STP, EtherChannel (5 lab bergradasi)
- [ ] `02-lab-routing.md` — static, floating static, inter-VLAN, OSPF, DR/BDR, BGP (6 lab)
- [ ] `03-lab-ip-services.md` — DHCP+relay, DNS, NAT/PAT, ACL, NTP, SSH (5 lab)
- [ ] `04-lab-keamanan-wireless.md` — port security, DHCP snooping, DAI, WLAN/WLC, hardening (5 lab)
- [ ] `05-lab-linux-otomasi.md` — iproute2, namespaces, bridge, nftables, Python, Ansible (6 lab)
- [ ] `06-lab-mikrotik.md` — hardening, bridge/VLAN, NAT/DHCP, queue, PPPoE, hotspot, WireGuard (7 lab)
- > Total ±34 lab bergradasi (TUGAS → VERIFIKASI → KRITERIA SUKSES → solusi), terikat ke modul teori.

### `referensi/`
- [ ] `cheatsheet-cisco-ios.md`
- [ ] `cheatsheet-linux-network.md`
- [ ] `tabel-subnetting.md`
- [ ] `daftar-port.md`
- [ ] `glosarium.md`
- [ ] `soal-latihan.md`
- [ ] `daftar-rfc-penting.md`
- [ ] `sumber-belajar.md`
- [ ] `cheatsheet-mikrotik.md`
- [ ] `padanan-cisco-mikrotik-linux.md`

---

## PROYEK AKHIR: `20-proyek-akhir/`

> Dikerjakan **setelah** semua tahap dan lab selesai. Satu studi kasus berkelanjutan
> (**PT Bahari Nusantara Segar** — ekspor hasil laut beku, 3 situs + 20 titik pesisir,
> cold storage −25 °C, wajib merekam suhu tanpa putus). Sembilan babak, dan **tiap babak
> bentuk kerjanya berbeda** supaya tidak jadi pengulangan soal. Total **1230 poin**.

### `01-briefing-dan-aturan.md`: Briefing
- [ ] Menggali kebutuhan dari dokumen yang saling bertentangan (email, notulen, tiket, inventaris)
- [ ] Memisahkan kebutuhan asli dari solusi yang sudah dipilih orang lain
- [ ] Mengubah kebutuhan kabur menjadi kebutuhan yang bisa diuji (angka, cara ukur, konsekuensi)
- [ ] Memilih mode kerja (Santai / Ujian / Kilat) dan menyiapkan repositori 14 deliverable

### `02-babak-1-audit-warisan.md`: Forensik (120 poin)
- [ ] Menemukan ≥ 30 cacat dari config Cisco, keluaran `show`, config MikroTik, server Linux, dan proses kerja
- [ ] Mengklasifikasi temuan (keamanan/ketersediaan/kinerja/kepatuhan) dan memberi tingkat risiko
- [ ] Memetakan temuan ke tiket helpdesk yang sudah lama ditutup dengan sebab salah
- [ ] Memisahkan perbaikan yang aman siang hari dari yang wajib jendela malam

### `03-babak-2-sidang-arsitektur.md`: Penjurian & desain (130 poin)
- [ ] Menyusun matriks kriteria berbobot **sebelum** melihat proposal dan harga
- [ ] Menilai 3 proposal vendor; menyatakan kesalahan fatal sebagai kebutuhan yang gagal
- [ ] Menentukan kriteria gugur (mis. rantai dingin harus hidup saat WAN mati)
- [ ] Menulis 10 ADR lengkap dengan alternatif yang ditolak dan pemicu peninjauan
- [ ] Analisis ketahanan lokal + daftar SPOF + peta keterlacakan kebutuhan

### `04-babak-3-teka-teki-alamat.md`: Puzzle presisi (130 poin)
- [ ] VLSM di bawah tekanan: `10.64.0.0/12` dengan lubang `10.66.0.0/16` milik mitra
- [ ] Menurunkan himpunan prefix iklan minimal (4 prefix) dan membuktikan tidak ada yang lebih kecil
- [ ] Prefix terkecil yang cukup untuk 36 segmen (jebakan batas: 128 host ≠ /25)
- [ ] Rencana IPv6 dari `/48` dengan digit bermakna (region/situs/VLAN) + batasannya
- [ ] Nama perangkat, zona DNS internal, hierarki NTP, ukuran kolam & masa sewa DHCP
- [ ] Verifikasi mandiri: skrip pemeriksa tumpang tindih + 8 checksum

### `05-babak-4-bangun-di-lab.md`: Kerja tangan + uji terima (150 poin)
- [ ] Membangun topologi minimum yang mewakili semua pola (inti berpasangan, akses, OT, 2 WAN, 2 TPI, Linux)
- [ ] Mengisi kerangka config Cisco/MikroTik/Linux dari rencana sendiri
- [ ] Menjalankan 30 uji terima — 6 di antaranya **uji negatif** (membuktikan sesuatu tidak bisa terjadi)
- [ ] Mengukur waktu failover dengan menghitung paket, bukan dengan kesan
- [ ] Uji ketahanan lokal: putus WAN 20 menit, tidak boleh ada celah data

### `06-babak-5-udara-dan-gudang-beku.md`: Hitungan RF & kapasitas (110 poin)
- [ ] FSPL, EIRP, RSSI, SNR — 7 hitungan dengan 9 checksum
- [ ] Membuktikan dengan angka bahwa geometri mengalahkan daya pancar (±26 dB vs ±3-6 dB)
- [ ] Kapasitas & retensi CCTV (64 kamera → 1,38 TB/hari → NVR 7,3 TB cukup 5,3 hari)
- [ ] Jumlah AP: kapasitas vs cakupan · lebar kanal · sikap terhadap DFS · perpindahan forklift
- [ ] Bertahan di −25 °C dan kondensasi · matriks keputusan teknologi sensor · rencana survei 3 tahap

### `07-babak-6-tim-merah-tim-biru.md`: Adversarial (130 poin)
- [ ] Mengenali 10 serangan dari bukti mentah saja (DHCP liar, MAC flooding, ARP spoof, double-tag, root takeover, DNS tunneling, perintah OT tidak sah, ransomware lateral, evil twin, RA liar)
- [ ] Untuk tiap kejadian: **kenali · cegah · deteksi** (kolom ketiga yang paling sering kosong)
- [ ] Matriks zona 16 zona dengan default tolak
- [ ] Rancangan akses vendor: atas permintaan, berbatas waktu, tercakup, terekam
- [ ] Playbook respons insiden + satu keputusan sulit yang mengorbankan kepatuhan

### `08-babak-7-kode-yang-menjaga.md`: Menulis kode (120 poin)
- [ ] Inventory sebagai sumber kebenaran (menambah TPI ke-21 hanya menyentuh satu tempat)
- [ ] Templat Jinja2 untuk MikroTik & Cisco, tanpa nilai ditulis keras
- [ ] Playbook idempoten: `changed=0` pada jalan kedua, `serial` beralasan, verifikasi + jalur kembali
- [ ] Audit kepatuhan sebagai kode: ≥ 20 pemeriksaan, kode keluar benar, **tanpa kegagalan senyap**
- [ ] CI: lint rencana alamat → render → uji di lab → diff → gerbang manusia → terapkan
- [ ] SLO, aturan alarm berbasis gejala, runbook, dan **uji alarm bulanan yang benar-benar dijalankan**

### `09-babak-8-malam-panjang.md`: Simulasi jaga malam (140 poin)
- [ ] Lima tiket bercabang dengan anggaran waktu; pemeriksaan berbiaya menit; ada pengalih perhatian
- [ ] Menulis hipotesis sebelum memeriksa; memilih pemeriksaan yang membelah ruang kemungkinan
- [ ] Mengenali "sinyal penuh", "tautan up", dan "tidak ada keluhan" sebagai jebakan
- [ ] Keputusan bisnis saat bukti kepatuhan hilang 73 menit — tanpa menambal data
- [ ] Penanganan insiden: kekang sebelum bersihkan, awetkan bukti, eskalasi tepat
- [ ] Postmortem tanpa menyalahkan: garis waktu, lima kenapa sampai tingkat proses, **akar bersama**

### `10-babak-9-ruang-rapat.md`: Bisnis & komunikasi (100 poin)
- [ ] Anggaran dipotong 35%: rincian berjenjang P1/P2/P3 dengan kebutuhan yang dilayani
- [ ] Tiga penolakan potong dengan pembanding rupiah (hemat X vs paparan Y)
- [ ] Risk register dengan **pemilik risiko bernama** — dan itu bukan orang teknis
- [ ] Rencana migrasi: risiko terbesar dulu, jendela malam, rollback teruji ≤ 30 menit
- [ ] Penjelasan lima kalimat tanpa jargon + kerangka 10 slide + laporan bulanan 1 halaman
- [ ] Menjawab 8 pertanyaan tidak ramah tanpa bersikap defensif

### `11-sidang-akhir-dan-penilaian.md`: Sidang & penilaian (100 poin)
- [ ] 40 pertanyaan sidang (semuanya "kenapa keputusan Anda", bukan definisi)
- [ ] Tiga tantangan mengajar 15 menit ke orang non-teknis, dengan kata kunci yang dilarang
- [ ] Merunut satu paket data suhu dari sensor TPI sampai basis data HQ, beserta semua titik gagalnya
- [ ] Penilaian total 1230 poin + dua syarat keras (tak ada babak < 50%, Babak 8 ≥ 70)
- [ ] Peta perbaikan: babak lemah → modul yang harus diulang
- [ ] Portofolio, tiga baris CV, peta ke CCNA/Network+/MikroTik, sertifikat diri

### Tambahan modul dan lab (pendalaman)
- [ ] `07-routing-lanjutan/10-isis.md`: IS-IS (NET, L1/L2, DIS, LSP, TLV, MT, route leaking)
- [ ] `07-routing-lanjutan/11-interkoneksi-internet.md`: transit/peering, IXP dan route server, PeeringDB, IDNIC, IRR, RPKI, ekosistem Indonesia
- [ ] `19-mikrotik/08-routing-v7.md` sampai `11-crs-switching.md`: routing v7, MPLS RouterOS, User Manager/RADIUS, switching CRS
- [ ] `lab/07-lab-membangun-protokol.md`: membangun transfer andal, traceroute, mini router, distance-vector dengan Python
- [ ] `lab/08-lab-netdevops.md`: containerlab, NetBox, Nornir, Batfish, gNMI, CI/GitOps
- [ ] Bagian analitis: antrean dan Little's law (00.3), prinsip arsitektur internet (01.2), isi router (04.5), teori algoritma routing (07.2), prinsip transfer andal (05.2), higiene BGP 2026 (07.6)
