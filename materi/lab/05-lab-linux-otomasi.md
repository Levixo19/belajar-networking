# Lab 05: Linux Networking & Otomasi

> **Prasyarat:** Tahap 13, 15, Lab 01-04
> **Platform:** Linux (native/VM/WSL2) + Python. Beberapa lab butuh sudo.
> **Format:** TUGAS → VERIFIKASI → KRITERIA SUKSES → solusi.

> [!WARNING]
> Lab ini menyentuh konfigurasi jaringan sistem. Jalankan di **VM/lab**, bukan mesin produksi. Perintah `ip netns` bersifat sementara (hilang saat reboot) — aman untuk eksperimen.

---

## Lab 5.1: iproute2 Dasar

**TUGAS:**
1. Tampilkan interface, alamat, tabel routing dengan `ip` (bukan `ifconfig` usang).
2. Tambah IP sekunder ke interface, lalu hapus.
3. Tambah rute statis lalu hapus; lihat rute default.
4. Periksa neighbor (ARP) cache.

**VERIFIKASI:** perintah menampilkan state benar; perubahan terlihat lalu bersih.

**KRITERIA SUKSES:** ✅ Nyaman dengan sintaks iproute2 modern.

<details><summary>Solusi & penjelasan</summary>

```bash
ip link show                          # interface
ip -br addr show                      # alamat (ringkas)
ip route show                         # tabel routing
ip addr add 10.0.0.99/24 dev eth0     # tambah IP sekunder
ip addr del 10.0.0.99/24 dev eth0     # hapus
ip route add 192.168.9.0/24 via 10.0.0.1
ip route del 192.168.9.0/24
ip neigh show                         # ARP/NDP cache
```
`iproute2` (`ip`) menggantikan `ifconfig`/`route`/`arp` yang usang. Perubahan runtime hilang saat reboot (untuk permanen: netplan/NetworkManager/ifupdown). Membuktikan `13-linux-networking/01`. 💡 `-br` (brief) & `-c` (color) membuat output lebih terbaca. Padanan: `ip route` ≈ `show ip route` Cisco.
</details>

---

## Lab 5.2: Simulasi Topologi dengan Network Namespaces

**TUGAS:** bangun "dua router + dua host" **hanya dengan Linux namespaces** (tanpa VM/emulator).
```
[h1] --- [r1] --- [r2] --- [h2]
```
1. Buat 4 namespace (h1, r1, r2, h2).
2. Hubungkan dengan pasangan veth.
3. Beri IP, aktifkan IP forwarding di r1/r2, tambah rute.
4. Uji: h1 ping h2 (melewati dua "router").

**VERIFIKASI:** `ip netns exec h1 ping <h2>` berhasil; `traceroute` lewat r1,r2.

**KRITERIA SUKSES:** ✅ Ping end-to-end melalui dua router tersimulasi.

<details><summary>Solusi & penjelasan</summary>

```bash
for ns in h1 r1 r2 h2; do sudo ip netns add $ns; done
# veth h1-r1
sudo ip link add h1r1 type veth peer name r1h1
sudo ip link set h1r1 netns h1;  sudo ip link set r1h1 netns r1
# veth r1-r2
sudo ip link add r1r2 type veth peer name r2r1
sudo ip link set r1r2 netns r1;  sudo ip link set r2r1 netns r2
# veth r2-h2
sudo ip link add r2h2 type veth peer name h2r2
sudo ip link set r2h2 netns r2;  sudo ip link set h2r2 netns h2
# IP + up (h1 side)
sudo ip netns exec h1 ip addr add 10.0.1.2/24 dev h1r1
sudo ip netns exec h1 ip link set h1r1 up
sudo ip netns exec r1 ip addr add 10.0.1.1/24 dev r1h1
sudo ip netns exec r1 ip addr add 10.0.12.1/24 dev r1r2
sudo ip netns exec r1 ip link set r1h1 up; sudo ip netns exec r1 ip link set r1r2 up
# ... (r2 & h2 serupa: 10.0.12.2, 10.0.2.1, 10.0.2.2) ...
# aktifkan forwarding di router
sudo ip netns exec r1 sysctl -w net.ipv4.ip_forward=1
sudo ip netns exec r2 sysctl -w net.ipv4.ip_forward=1
# rute
sudo ip netns exec h1 ip route add default via 10.0.1.1
sudo ip netns exec r1 ip route add 10.0.2.0/24 via 10.0.12.2
sudo ip netns exec r2 ip route add 10.0.1.0/24 via 10.0.12.1
sudo ip netns exec h2 ip route add default via 10.0.2.1
# uji
sudo ip netns exec h1 ping -c3 10.0.2.2
# bersihkan: for ns in h1 r1 r2 h2; do sudo ip netns del $ns; done
```
Ini membangun topologi routing **nyata** di satu mesin — inti bagaimana container/Docker/K8s bekerja (`16/05`). `ip_forward=1` menjadikan namespace sebuah "router". Membuktikan `13-linux-networking/02`. 💡 Sama seperti Lab 2.1, butuh **rute dua arah**.
</details>

---

## Lab 5.3: Bridge Linux (Switch Software)

**TUGAS:**
1. Buat bridge Linux (`br0`).
2. Hubungkan 2+ namespace ke bridge (seperti switch).
3. Uji konektivitas antar-namespace via bridge.

**VERIFIKASI:** namespace saling ping via bridge; `bridge link` / `ip link` menampilkan anggota.

**KRITERIA SUKSES:** ✅ Bridge berperilaku sebagai switch (satu broadcast domain).

<details><summary>Solusi & penjelasan</summary>

```bash
sudo ip link add br0 type bridge
sudo ip link set br0 up
# untuk tiap host: veth, satu ujung ke namespace, ujung lain ke bridge
sudo ip link add v1 type veth peer name v1b
sudo ip link set v1 netns hA
sudo ip link set v1b master br0 ; sudo ip link set v1b up
# (ulangi untuk hB dengan v2/v2b) → beri IP sama-subnet di hA,hB → ping
```
Bridge Linux = **switch software** — persis yang dipakai Docker (`docker0`), KVM/libvirt, dan RouterOS (`19/02`). Anggota bridge berada di satu broadcast domain. `bridge fdb show` menampilkan tabel MAC (seperti CAM table). Membuktikan `13-linux-networking/02` & mengaitkan `16/05` (jaringan container). 💡 Tambah `bridge vlan` untuk VLAN filtering (VLAN-aware bridge).
</details>

---

## Lab 5.4: nftables Firewall

**TUGAS:**
1. Buat tabel/chain nftables dengan kebijakan **default drop** pada input.
2. Izinkan loopback, established/related, SSH dari subnet tertentu.
3. Uji: SSH dari subnet sah OK, dari luar diblokir.

**VERIFIKASI:** `nft list ruleset`; koneksi sesuai kebijakan.

**KRITERIA SUKSES:** ✅ Firewall stateful default-deny berfungsi.

<details><summary>Solusi & penjelasan</summary>

```bash
sudo nft add table inet filter
sudo nft 'add chain inet filter input { type filter hook input priority 0; policy drop; }'
sudo nft add rule inet filter input iif lo accept
sudo nft add rule inet filter input ct state established,related accept
sudo nft add rule inet filter input ip saddr 192.168.1.0/24 tcp dport 22 accept
sudo nft list ruleset
```
Pola sama dengan firewall MikroTik (`19/03`) & konsep stateful (`12-keamanan/03`): **terima established,related dulu**, izinkan spesifik, **default drop**. `ct state` = connection tracking (stateful). nftables menggantikan iptables. Membuktikan `13-linux-networking/03`. ⚠️ Hati-hati mengunci diri via SSH — uji di konsol/VM dengan akses alternatif.
</details>

---

## Lab 5.5: Otomasi Backup Config Multi-Perangkat (Python)

**TUGAS:**
1. Siapkan 2+ perangkat lab (Cisco di GNS3, atau CHR MikroTik) dengan SSH.
2. Tulis skrip Python (Netmiko) yang login ke tiap perangkat & simpan `show run`/`export`.
3. Jalankan; verifikasi file backup terbentuk untuk semua perangkat.

**VERIFIKASI:** file `.cfg` per-perangkat berisi konfigurasi.

**KRITERIA SUKSES:** ✅ Backup semua perangkat otomatis dalam satu run.

<details><summary>Solusi & penjelasan</summary>

```python
from netmiko import ConnectHandler

perangkat = [
    {"device_type": "cisco_ios",        "host": "192.168.56.11", "username": "admin", "password": "pw"},
    {"device_type": "mikrotik_routeros","host": "192.168.56.12", "username": "admin", "password": "pw"},
]
cmd = {"cisco_ios": "show running-config", "mikrotik_routeros": "/export"}

for dev in perangkat:
    try:
        with ConnectHandler(**dev) as conn:
            out = conn.send_command(cmd[dev["device_type"]])
            fname = f"backup-{dev['host']}.cfg"
            with open(fname, "w") as f:
                f.write(out)
            print(f"OK  {fname}")
    except Exception as e:
        print(f"GAGAL {dev['host']}: {e}")
```
`pip install netmiko`. Skrip ini mendemonstrasikan otomasi multi-vendor (`15-otomasi/03`): satu skrip mem-backup Cisco & MikroTik. Tambahkan: commit ke Git (`15/04`), jadwalkan (cron), atau kirim ke penyimpanan terpusat. 💡 Kembangkan ke audit (cek baris config wajib) atau perubahan massal (hati-hati — dry-run dulu). ⚠️ Jangan hardcode password di produksi — pakai env var/vault.
</details>

---

## Lab 5.6 (Lanjutan): Ansible Playbook

**TUGAS:**
1. Buat inventory Ansible untuk perangkat lab.
2. Tulis playbook yang mengambil fakta / menerapkan konfigurasi kecil (mis. banner/VLAN).
3. Jalankan dengan `--check --diff` dulu, lalu terapkan.

**VERIFIKASI:** `--check --diff` menunjukkan perubahan; apply berhasil & idempoten (run kedua = no change).

**KRITERIA SUKSES:** ✅ Playbook idempoten; dry-run sebelum apply dipahami.

<details><summary>Solusi & penjelasan</summary>

`inventory.yaml`:
```yaml
all:
  hosts:
    r1: { ansible_host: 192.168.56.11 }
  vars:
    ansible_network_os: cisco.ios.ios
    ansible_connection: network_cli
    ansible_user: admin
    ansible_password: pw
```
`banner.yaml`:
```yaml
- hosts: all
  gather_facts: no
  tasks:
    - name: Set banner
      cisco.ios.ios_banner:
        banner: login
        text: "Akses hanya untuk yang berwenang"
        state: present
```
Jalankan: `ansible-playbook -i inventory.yaml banner.yaml --check --diff` (dry-run), lalu tanpa `--check`. Run **kedua** harus "ok=... changed=0" (**idempoten** — inti Ansible, `15/04`). ⚠️ **Selalu `--check --diff` dulu** untuk perubahan. Butuh `ansible-galaxy collection install cisco.ios`. Membuktikan otomasi deklaratif.
</details>

---

## Ringkasan Lab 05

Anda mempraktikkan: iproute2, simulasi topologi dengan namespaces (fondasi container/K8s), bridge Linux, nftables (firewall stateful), dan otomasi (Python/Netmiko + Ansible). Ini menjembatani jaringan dengan Linux & NetDevOps (Tahap 13 & 15).

> [!TIP]
> Lab 5.2 sangat berharga: memahami namespaces = memahami bagaimana Docker/Kubernetes networking (`16/05`) bekerja "di balik layar". Otomasi (5.5-5.6) adalah skill NetDevOps bernilai tinggi (`18/01`).

**Berikutnya:** `lab/06-lab-mikrotik.md`. Lab MikroTik RouterOS end-to-end.
