# Cheatsheet: MikroTik RouterOS

> Rujukan cepat perintah RouterOS (CLI). Bisa juga lewat WinBox/WebFig (GUI). Untuk MTCNA & kerja ISP.

---

## Dasar & Navigasi

```
/                         ke root menu
..                        naik satu level
/interface print          tampilkan (print) item di menu
?                         bantuan; Tab autocomplete
/system reboot            reboot
/system shutdown          matikan
/export                   tampilkan config sebagai teks (untuk backup/Git) ★
/export file=konfig       simpan ke file konfig.rsc
/system backup save name=bkp    backup biner (lengkap)
```

## Manajemen & Keamanan Router

```
/user set admin password=KATA_SANDI
/user add name=operator password=xxx group=full
/ip service print                       daftar layanan (telnet/ssh/www/winbox/api)
/ip service set telnet disabled=yes
/ip service set winbox address=192.168.88.0/24    batasi Winbox
/ip service set ssh port=2200
/system identity set name=R1            hostname
/system clock print                     cek waktu
/system ntp client set enabled=yes servers=id.pool.ntp.org
/system package update check-for-updates
```

## Interface & IP

```
/interface print
/ip address add address=192.168.88.1/24 interface=ether2
/ip address print
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1    default route
/ip route add dst-address=10.9.0.0/24 gateway=10.0.12.2
/ip route print
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1 distance=10   backup (AD/distance)
```

## Bridge, VLAN & Switching

```
/interface bridge add name=bridge1 vlan-filtering=no
/interface bridge port add bridge=bridge1 interface=ether2 pvid=10   access VLAN10
/interface bridge port add bridge=bridge1 interface=ether5           (trunk)
/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=bridge1,ether5 untagged=ether2
/interface bridge set bridge1 vlan-filtering=yes    ⚠️ AKTIFKAN TERAKHIR!
/interface bridge port print    (cek kolom "H" = hardware offload)
! VLAN interface (≈SVI) + inter-VLAN:
/interface vlan add name=vlan10 vlan-id=10 interface=bridge1
/ip address add address=10.0.10.1/24 interface=vlan10
! STP:
/interface bridge set bridge1 protocol-mode=rstp
```

## Firewall & NAT

```
! Filter (chain: input=ke router, forward=lewat, output=dari router):
/ip firewall filter
add chain=input connection-state=established,related action=accept
add chain=input connection-state=invalid action=drop
add chain=input src-address=192.168.88.0/24 action=accept
add chain=input action=drop                     default-deny ★
! NAT:
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade   PAT keluar ★
/ip firewall nat add chain=srcnat out-interface=ether1 action=src-nat to-addresses=203.0.113.5
/ip firewall nat add chain=dstnat protocol=tcp dst-port=80 in-interface=ether1 \
    action=dst-nat to-addresses=192.168.88.10 to-ports=80    port forward
! Address-list:
/ip firewall address-list add list=BLOKIR address=203.0.113.0/24
add chain=forward src-address-list=BLOKIR action=drop
! Mangle (mark untuk QoS/routing):
/ip firewall mangle add chain=forward action=mark-connection new-connection-mark=web ...
```

## DHCP & DNS

```
! DHCP server (cara cepat: /ip dhcp-server setup):
/ip pool add name=dhcp-pool ranges=192.168.88.10-192.168.88.254
/ip dhcp-server add name=srv1 interface=ether2 address-pool=dhcp-pool disabled=no
/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=192.168.88.1
/ip dhcp-server lease print
! DHCP client (WAN):
/ip dhcp-client add interface=ether1 disabled=no
! DNS (cache):
/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes
/ip dns static add name=server.lab address=192.168.88.10    DNS statis
```

## QoS / Queue

```
/queue simple add name=klien1 target=192.168.88.10/32 max-limit=5M/5M
/queue simple add name=burst1 target=192.168.88.20/32 max-limit=5M/5M \
    burst-limit=10M/10M burst-threshold=4M/4M burst-time=8/8
/queue type add name=pcq-dl kind=pcq pcq-classifier=dst-address pcq-rate=0
! (max-limit format: upload/download)
```

## PPPoE (ISP)

```
! Server:
/ip pool add name=pppoe ranges=10.20.0.2-10.20.0.254
/ppp profile add name=paket10 local-address=10.20.0.1 remote-address=pppoe rate-limit=3M/10M
/interface pppoe-server server add service-name=ISP interface=ether3 default-profile=paket10 disabled=no
/ppp secret add name=budi password=xxx service=pppoe profile=paket10
/ppp active print
! Client:
/interface pppoe-client add interface=ether1 user=budi password=xxx add-default-route=yes disabled=no
```

## Hotspot

```
/ip hotspot setup                          wizard
/ip hotspot user profile add name=p2jam rate-limit=2M/2M session-timeout=2h
/ip hotspot user add name=voucher01 password=abc profile=p2jam
/ip hotspot walled-garden add dst-host=*.bayar.example action=allow
/ip hotspot active print
```

## Wireless (paket lama)

```
/interface wireless security-profiles add name=aman mode=dynamic-keys \
    authentication-types=wpa2-psk wpa2-pre-shared-key="rahasia123"
/interface wireless set wlan1 mode=ap-bridge ssid="WiFi" band=2ghz-b/g/n \
    frequency=2412 security-profile=aman disabled=no
! CAPsMAN (controller):
/caps-man manager set enabled=yes
```

## VPN / Tunnel

```
! IPsec (peer/identity/policy):
/ip ipsec peer add name=B address=203.0.113.2 exchange-mode=ike2
/ip ipsec identity add peer=B auth-method=pre-shared-key secret="kunci"
/ip ipsec policy add peer=B src-address=192.168.1.0/24 dst-address=192.168.2.0/24 tunnel=yes
! WireGuard (v7+):
/interface wireguard add name=wg1 listen-port=13231
/interface wireguard peers add interface=wg1 public-key="..." allowed-address=10.99.0.2/32,192.168.2.0/24 endpoint-address=203.0.113.2 endpoint-port=13231
! EoIP:
/interface eoip add name=eoipB remote-address=203.0.113.2 tunnel-id=100
```

## Monitoring & Tools

```
/ping 8.8.8.8 count=4
/tool traceroute 8.8.8.8
/tool torch ether1                         analisis trafik live ★ (siapa makan bandwidth)
/tool sniffer quick interface=ether1       ≈tcpdump
/interface monitor-traffic ether1          rate real-time
/tool netwatch add host=8.8.8.8 interval=10s up-script="..." down-script="..."
/log print
/system logging action add name=remote target=remote remote=192.168.88.50
/snmp set enabled=yes
/tool bandwidth-test 192.168.88.1 direction=both    ⚠️ jangan di jam sibuk
```

## Scripting & Scheduler

```
/system script add name=bkp source={ /export file=("cfg-" . [/system clock get date]) }
/system script run bkp
/system scheduler add name=harian interval=1d start-time=02:00:00 on-event="/system script run bkp"
```

> [!TIP]
> `/export` (teks, untuk Git) vs `/system backup` (biner, lengkap). Torch & netwatch adalah tools diagnostik/otomasi paling berguna. Di `ip firewall filter`, chain input melindungi router; chain forward untuk trafik pelanggan.

> [!WARNING]
> **Amankan router sejak awal:** firewall input default-deny, batasi Winbox/SSH, matikan layanan tak perlu, ganti password default. RouterOS default cukup terbuka.

---

**Lihat juga:** `referensi/cheatsheet-cisco-ios.md`, `referensi/padanan-cisco-mikrotik-linux.md`, `19-mikrotik/*`
