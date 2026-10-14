# Cheatsheet — Cisco IOS

> Rujukan cepat perintah Cisco IOS/IOS-XE untuk CCNA. Format: `mode` → perintah.
> Mode: `>` user EXEC, `#` privileged EXEC, `(config)#` global config.

---

## Mode & Navigasi

```
Router> enable                    masuk privileged EXEC (#)
Router# configure terminal        masuk global config
Router(config)# exit / end        keluar satu level / langsung ke #
Router# disable                   kembali ke user EXEC
Ctrl+Z                            keluar dari config ke #
do <cmd>                          jalankan perintah EXEC dari mode config
?                                 bantuan; <tab> autocomplete
```

## Verifikasi (show) — paling sering dipakai

```
show running-config               konfigurasi aktif (RAM)
show startup-config               konfigurasi tersimpan (NVRAM)
show ip interface brief           ringkasan IP & status semua interface ★
show interfaces [id]              detail interface (error, duplex, speed)
show interfaces status            status port switch (VLAN, duplex, speed)
show ip route                     tabel routing ★
show ip protocols                 protokol routing aktif & parameternya
show vlan brief                   VLAN & port anggota ★
show interfaces trunk             status trunk & VLAN yang diizinkan ★
show spanning-tree                info STP (root, port role/state) ★
show etherchannel summary         status EtherChannel/PortChannel
show cdp neighbors [detail]       tetangga CDP (Cisco)
show lldp neighbors               tetangga LLDP (standar)
show mac address-table            tabel MAC switch
show ip ospf neighbor             adjacency OSPF ★
show ip bgp summary               status peering BGP
show ip nat translations          tabel NAT aktif
show access-lists                 ACL & hit counter
show version                      versi IOS, uptime, hardware
```

## Konfigurasi Dasar Perangkat

```
hostname R1
enable secret KATA_SANDI          password enable (hash kuat)
service password-encryption       enkripsi password plaintext di config
banner motd #Peringatan#          banner login
no ip domain-lookup               matikan DNS lookup (hindari hang salah ketik)
ip domain-name lab.local
line console 0
 password KATA_SANDI
 login
line vty 0 4
 transport input ssh              HANYA SSH (bukan telnet)
 login local
username admin secret KATA_SANDI  user lokal
crypto key generate rsa modulus 2048   (untuk SSH)
copy running-config startup-config     simpan config (atau: write memory)
reload                            restart perangkat
```

## Interface & IP

```
interface gi0/0
 ip address 10.0.0.1 255.255.255.0
 no shutdown                      aktifkan interface ★ (default: shutdown di router)
 description ->SW1:Gi0/1
interface loopback0
 ip address 1.1.1.1 255.255.255.255
interface range fa0/1-10          konfigurasi banyak port sekaligus
```

## Switching: VLAN & Trunk

```
vlan 10
 name STAFF
interface fa0/1
 switchport mode access
 switchport access vlan 10
 switchport voice vlan 20         voice VLAN (IP phone)
interface gi0/1
 switchport mode trunk
 switchport trunk native vlan 99
 switchport trunk allowed vlan 10,20,99
! Inter-VLAN (SVI di L3 switch):
ip routing
interface vlan 10
 ip address 10.0.10.1 255.255.255.0
! Router-on-a-stick (subinterface):
interface gi0/0.10
 encapsulation dot1Q 10
 ip address 10.0.10.1 255.255.255.0
```

## STP & Keamanan L2

```
spanning-tree vlan 1 root primary       jadikan root bridge
spanning-tree vlan 1 priority 4096
interface fa0/1
 spanning-tree portfast                 port access langsung forwarding
 spanning-tree bpduguard enable         matikan port jika terima BPDU
 switchport port-security
 switchport port-security maximum 1
 switchport port-security violation shutdown
 switchport port-security mac-address sticky
! DHCP snooping & DAI:
ip dhcp snooping
ip dhcp snooping vlan 10
ip arp inspection vlan 10
interface gi0/1
 ip dhcp snooping trust
 ip arp inspection trust
```

## EtherChannel

```
interface range gi0/1-2
 channel-group 1 mode active      LACP (active/passive); PAgP=desirable/auto
interface port-channel 1
 switchport mode trunk
```

## Routing

```
! Static:
ip route 10.0.9.0 255.255.255.0 10.0.12.2
ip route 0.0.0.0 0.0.0.0 10.0.12.2        default route
ip route 10.0.9.0 255.255.255.0 10.0.13.2 10   floating static (AD=10)
! OSPF:
router ospf 1
 router-id 1.1.1.1
 network 10.0.1.0 0.0.0.255 area 0        (wildcard mask!)
 passive-interface gi0/0                  (interface tanpa hello)
interface gi0/0
 ip ospf cost 10
 ip ospf priority 100                     (pengaruhi DR/BDR)
! EIGRP:
router eigrp 100
 network 10.0.0.0 0.0.0.255
 no auto-summary
! BGP:
router bgp 65001
 neighbor 10.0.12.2 remote-as 65002
 network 10.0.1.0 mask 255.255.255.0
```

## FHRP (HSRP)

```
interface vlan 10
 standby 1 ip 10.0.10.1            virtual IP (gateway)
 standby 1 priority 110
 standby 1 preempt
```

## IP Services

```
! DHCP server:
ip dhcp excluded-address 10.0.1.1 10.0.1.10
ip dhcp pool LAN
 network 10.0.1.0 255.255.255.0
 default-router 10.0.1.1
 dns-server 8.8.8.8
interface gi0/1
 ip helper-address 10.0.5.5        DHCP relay
! NAT/PAT:
interface gi0/0
 ip nat inside
interface gi0/1
 ip nat outside
access-list 1 permit 192.168.1.0 0.0.0.255
ip nat inside source list 1 interface gi0/1 overload
ip nat inside source static tcp 192.168.1.10 80 interface gi0/1 80   port forward
! NTP:
ntp server 10.0.0.5
```

## ACL

```
! Standard (1-99):
access-list 10 permit 10.0.1.0 0.0.0.255
access-list 10 deny any
! Extended (100-199) / named:
ip access-list extended WEB
 permit tcp any host 10.0.50.10 eq 80
 deny ip any any log
interface gi0/0
 ip access-group WEB in
```

## IPv6 (ringkas)

```
ipv6 unicast-routing
interface gi0/0
 ipv6 address 2001:db8::1/64
 ipv6 address fe80::1 link-local
ipv6 route 2001:db8:9::/64 2001:db8::2
router ospfv3 1                    (atau: ipv6 router ospf)
```

## Troubleshooting

```
ping 8.8.8.8                       (extended: ping <enter> untuk opsi)
traceroute 8.8.8.8
show interfaces gi0/0              cek error, drops, duplex/speed mismatch
debug ip ospf events               (hati-hati di produksi! undebug all utk stop)
terminal monitor                   tampilkan log/debug di sesi SSH
show logging                       buffer log
```

💡 **Perintah tersering CCNA:** `show ip interface brief`, `show ip route`, `show vlan brief`, `show interfaces trunk`, `show spanning-tree`, `show ip ospf neighbor`, `show running-config`. Hafalkan `no shutdown` — interface router default mati.

⚠️ **Selalu `copy run start`** setelah konfigurasi — perubahan di RAM hilang saat reload bila belum disimpan.

---

**Lihat juga:** `referensi/cheatsheet-mikrotik.md`, `referensi/padanan-cisco-mikrotik-linux.md`
