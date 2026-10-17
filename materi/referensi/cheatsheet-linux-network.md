# Cheatsheet: Linux Networking

> Rujukan cepat perintah jaringan Linux modern (iproute2, nftables, systemd, diagnostik). Untuk Tahap 13 & otomasi.

---

## iproute2 (`ip`): pengganti ifconfig/route/arp

```
ip link show                      interface (state up/down, MAC)
ip -br -c addr                    alamat IP (ringkas + warna) ★
ip addr add 10.0.0.5/24 dev eth0  tambah IP
ip addr del 10.0.0.5/24 dev eth0  hapus IP
ip link set eth0 up / down        aktif/matikan interface
ip route                          tabel routing ★
ip route add 10.9.0.0/24 via 10.0.0.1
ip route add default via 10.0.0.1
ip route del 10.9.0.0/24
ip route get 8.8.8.8              rute mana yang dipakai ke tujuan ini ★
ip neigh                          ARP/NDP cache
ip -s link show eth0              statistik (paket, error, drop)
ip link set eth0 mtu 9000         ubah MTU (jumbo)
ip addr add ... / ip -6 ...       (IPv6: ip -6 addr, ip -6 route)
```

## Network Namespaces & Virtual (lab/container)

```
ip netns add ns1                  buat namespace
ip netns list
ip netns exec ns1 <cmd>           jalankan perintah dalam namespace
ip link add veth0 type veth peer name veth1     pasangan veth
ip link set veth1 netns ns1       pindahkan ke namespace
ip link add br0 type bridge       buat bridge (switch software)
ip link set eth0 master br0       tambah interface ke bridge
bridge link                       anggota bridge
bridge fdb show                   tabel MAC bridge (≈CAM table)
ip link add vlan10 link eth0 type vlan id 10    subinterface VLAN
```

## Konfigurasi Persisten

```
# Netplan (Ubuntu modern) — /etc/netplan/*.yaml:
network:
  version: 2
  ethernets:
    eth0:
      addresses: [10.0.0.5/24]
      routes: [{to: default, via: 10.0.0.1}]
      nameservers: {addresses: [8.8.8.8]}
# terapkan: netplan apply
# NetworkManager (RHEL/Fedora): nmcli
nmcli connection show
nmcli con add type ethernet ifname eth0 ip4 10.0.0.5/24 gw4 10.0.0.1
nmcli con up <nama>
```

## Diagnostik

```
ping -c4 8.8.8.8
traceroute 8.8.8.8  /  tracepath 8.8.8.8  /  mtr 8.8.8.8    (mtr = live)
ss -tulpn                        socket/port yang listen (pengganti netstat) ★
ss -tan                          semua koneksi TCP + state
dig example.com  /  dig +short example.com  /  dig @8.8.8.8 A example.com  ★
dig -x 8.8.8.8                   reverse DNS
host example.com  /  nslookup example.com
tcpdump -ni eth0 port 443        capture paket ★
tcpdump -ni eth0 host 10.0.0.1 -w file.pcap    simpan untuk Wireshark
curl -v https://example.com      uji HTTP (verbose)
curl -I https://example.com      header saja
nc -zv host 22                   uji port terbuka (netcat)
ethtool eth0                     speed/duplex/link (fisik)
ip -s link                       error/drop counter
```

## Firewall: nftables (modern)

```
nft list ruleset                                    tampilkan semua
nft add table inet filter
nft 'add chain inet filter input { type filter hook input priority 0; policy drop; }'
nft add rule inet filter input iif lo accept
nft add rule inet filter input ct state established,related accept
nft add rule inet filter input tcp dport 22 ip saddr 192.168.1.0/24 accept
nft add rule inet filter input tcp dport {80,443} accept
nft delete rule inet filter input handle <n>
# NAT (masquerade):
nft 'add chain inet nat postrouting { type nat hook postrouting priority 100; }'
nft add rule inet nat postrouting oif eth0 masquerade
# IP forwarding (jadikan router):
sysctl -w net.ipv4.ip_forward=1
```

## iptables (lama: masih umum)

```
iptables -L -n -v                 daftar aturan
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -j DROP
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

## Layanan (systemd)

```
systemctl status/start/stop/restart <svc>     mis. sshd, nginx, named
systemctl enable <svc>            aktif saat boot
journalctl -u sshd -f             log layanan (follow)
resolvectl status                 status DNS (systemd-resolved)
```

## FRR (routing: OSPF/BGP di Linux)

```
vtysh                             masuk shell FRR (mirip Cisco IOS)
# di vtysh:
show ip route
show ip ospf neighbor
show ip bgp summary
configure terminal
 router ospf
  network 10.0.0.0/24 area 0
```

> [!TIP]
> **Perintah tersering:** `ip -br addr`, `ip route`, `ss -tulpn`, `dig +short`, `tcpdump -ni`, `ip route get`. `ss` menggantikan `netstat`; `ip` menggantikan `ifconfig`; `nft` menggantikan `iptables`.

> [!WARNING]
> Perubahan `ip`/`sysctl` bersifat **runtime** (hilang saat reboot). Untuk permanen: netplan/NetworkManager (jaringan), `/etc/sysctl.d/` (sysctl), unit systemd (nftables).

> [!TIP]
> **RouterOS berbasis Linux** — banyak konsep di sini (bridge, veth, netfilter/conntrack) identik dengan yang di balik MikroTik (`19/*`).

---

**Lihat juga:** `referensi/cheatsheet-cisco-ios.md`, `referensi/padanan-cisco-mikrotik-linux.md`, `13-linux-networking/*`
