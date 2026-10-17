# Padanan Istilah & Perintah: Cisco ↔ MikroTik ↔ Linux

> Tabel padanan lintas-platform ini menunjukkan bahwa konsep jaringan bersifat universal; yang berbeda hanya sintaks & istilahnya. Itulah inti pendekatan tiga-platform di kurikulum ini.

---

## Konsep Fundamental

| Konsep | Cisco IOS | MikroTik RouterOS | Linux |
|---|---|---|---|
| Broadcast domain L2 | VLAN + `switchport` | **bridge** (+ vlan-filtering) | `ip link add type bridge` |
| Interface L3 per-VLAN | SVI (`interface Vlan10`) | `/interface vlan` di bridge | `ip link ... type vlan` |
| Access port | `switchport access vlan 10` | port `pvid=10` (untagged) | untagged di bridge vlan |
| Trunk port | `switchport mode trunk` | port `tagged` di bridge vlan | tagged di bridge vlan |
| Virtual routing table | VRF | VRF / (routing table terpisah) | network namespace / VRF |
| Link aggregation | EtherChannel (LACP/PAgP) | bonding / bridge | bonding (802.3ad) |

## Alamat & Interface

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| Lihat IP interface | `show ip int brief` | `/ip address print` | `ip -br addr` |
| Tambah IP | `ip address 10.0.0.1 255.255.255.0` | `/ip address add address=10.0.0.1/24` | `ip addr add 10.0.0.1/24 dev x` |
| Aktifkan interface | `no shutdown` | (default aktif) `enabled=yes` | `ip link set x up` |
| Deskripsi | `description` | `comment=` | (via ifupdown/NM) |
| Loopback | `interface loopback0` | `/interface bridge` (dummy) | `ip link add lo0 type dummy` |

## Routing

| Fungsi | Cisco | MikroTik | Linux (iproute2 / FRR) |
|---|---|---|---|
| Lihat tabel routing | `show ip route` | `/ip route print` | `ip route` / `vtysh: show ip route` |
| Static route | `ip route <net> <mask> <gw>` | `/ip route add dst-address= gateway=` | `ip route add <net> via <gw>` |
| Default route | `ip route 0.0.0.0 0.0.0.0 <gw>` | `/ip route add dst-address=0.0.0.0/0 gateway=` | `ip route add default via <gw>` |
| Backup/AD | `ip route ... <AD>` | `... distance=<n>` | metric / FRR |
| OSPF | `router ospf 1` | `/routing ospf` | FRR: `router ospf` |
| BGP | `router bgp <as>` | `/routing bgp` | FRR: `router bgp` |
| Admin Distance | Administrative Distance | **distance** | (FRR) distance |

## NAT & Firewall

| Fungsi | Cisco | MikroTik | Linux (nftables) |
|---|---|---|---|
| PAT keluar | `ip nat inside source list ... overload` | srcnat `action=masquerade` | `... postrouting ... masquerade` |
| Port forward | `ip nat inside source static tcp ...` | dstnat `action=dst-nat` | `... prerouting ... dnat` |
| Filter paket | ACL (`access-list`) | `/ip firewall filter` | `nft add rule ... filter` |
| Stateful | ZBF / reflexive ACL | `connection-state=` | `ct state` |
| Trafik ke perangkat | control-plane / VTY ACL | chain `input` | chain `input` |
| Trafik transit | ACL di interface | chain `forward` | chain `forward` |
| Grup alamat | object-group | **address-list** | named set / ipset |

## Switching & STP

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| Tabel MAC | `show mac address-table` | `/interface bridge host print` | `bridge fdb show` |
| STP | `spanning-tree` (RPVST+) | `protocol-mode=rstp` | `bridge` stp / mstpd |
| Root bridge | `spanning-tree ... root primary` | bridge `priority=` | bridge priority |
| Hardware switching | ASIC (otomatis) | **hardware offload (H)** | switchdev |

## Discovery & Manajemen

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| Discovery tetangga | CDP / LLDP | MNDP / LLDP (`/ip neighbor`) | lldpd |
| SSH | `transport input ssh` | `/ip service` (ssh) | sshd |
| Waktu | `ntp server` | `/system ntp client` | systemd-timesyncd / chrony |
| SNMP | `snmp-server` | `/snmp` | snmpd |
| Syslog remote | `logging host` | `/system logging action target=remote` | rsyslog |
| Simpan config | `copy run start` | (`/export`; otomatis tersimpan) | file config |
| Config sebagai teks | `show running-config` | **`/export`** | file di /etc |

## Diagnostik

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| Ping | `ping` | `/ping` | `ping` |
| Traceroute | `traceroute` | `/tool traceroute` | `traceroute`/`mtr` |
| Analisis trafik live | NetFlow / `show` | **`/tool torch`** | `iftop`/`nload` |
| Packet capture | EPC / SPAN | `/tool sniffer` | `tcpdump` |
| Cek port listen | `show control-plane host` | `/ip service print` | `ss -tulpn` |
| Pantau + aksi | IP SLA + track | **netwatch** | script + cron |

## VPN / Tunnel

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| IPsec site-to-site | crypto map / IKEv2 | `/ip ipsec` | strongSwan |
| GRE | `interface tunnel` (gre) | `/interface gre` | `ip tunnel ... gre` |
| Tunnel L2 | L2TPv3 / VXLAN | **EoIP** / VXLAN | VXLAN / L2TPv3 |
| VPN modern | (FlexVPN) | **WireGuard** | WireGuard |
| Autentikasi pelanggan | (BRAS) | **PPPoE server** | accel-ppp |

## Wireless

| Fungsi | Cisco | MikroTik |
|---|---|---|
| Controller AP | WLC | **CAPsMAN** |
| AP terkelola | LAP (CAPWAP) | CAP |
| PTMP khusus | (Wi-Fi std) | **Nv2 (TDMA)** |

## QoS

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| Klasifikasi/marking | class-map / DSCP | mangle mark | tc filter / meta mark |
| Antrean prioritas | LLQ/CBWFQ | queue tree + priority | tc (htb/fq_codel) |
| Rate limit | policer/shaper | simple queue / queue tree | tc htb |
| Pembagian adil | WFQ | **PCQ** | fq_codel/CAKE |

> [!TIP]
> **Pelajaran utama:** setiap "fitur vendor" adalah implementasi dari konsep universal. Kalau Anda paham konsepnya (VLAN, routing, NAT, stateful firewall, QoS), Anda bisa menerapkannya di platform mana pun hanya dengan mencari sintaksnya. Inilah kenapa kurikulum ini mengajarkan konsep dulu, lalu tiga platform.

---

**Lihat juga:** ketiga cheatsheet di `referensi/`, dan bagian "Padanan istilah" di tiap modul.
