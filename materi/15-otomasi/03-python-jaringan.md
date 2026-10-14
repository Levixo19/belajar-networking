# 15.3 — Python untuk Otomasi Jaringan

> **Prasyarat:** `15-otomasi/02`, dasar pemrograman membantu
> **Tujuan:** Anda bisa memakai library Python utama untuk otomasi jaringan: Netmiko, NAPALM, Nornir, ncclient, Jinja2, dan requests.

> 📌 **Python adalah bahasa dominan otomasi jaringan.** Anda tidak perlu menjadi programmer ahli — cukup menguasai dasar dan library jaringan. Modul ini fokus pada penerapan, bukan teori pemrograman.

---

## 1. Python Esensial untuk Network Engineer

Cukup kuasai ini untuk memulai:

```python
# Struktur data
device = {"host": "192.168.1.1", "user": "admin"}   # dict (mirip JSON object)
vlans = [10, 20, 30]                                  # list (mirip JSON array)

# Loop
for vlan in vlans:
    print(f"VLAN {vlan}")

# Membaca file
with open("devices.txt") as f:
    for line in f:
        print(line.strip())

# Error handling — WAJIB untuk otomasi jaringan
try:
    connection = connect(device)
except Exception as e:
    print(f"Gagal terhubung ke {device['host']}: {e}")

# Virtual environment — SELALU pakai untuk isolasi
# $ python3 -m venv venv
# $ source venv/bin/activate
# $ pip install netmiko napalm nornir
```

⚠️ **Selalu pakai virtual environment (`venv`).** Menginstal library langsung ke Python sistem menyebabkan konflik dependensi dan bisa merusak alat sistem. Setiap proyek otomasi punya `venv` sendiri.

💡 **Error handling bukan opsional di otomasi jaringan.** Perangkat bisa tidak terjangkau, kredensial salah, atau perintah gagal. Skrip tanpa `try/except` yang menyentuh 200 perangkat akan berhenti di perangkat pertama yang bermasalah — dan Anda tidak tahu mana yang berhasil.

---

## 2. Netmiko — SSH Multi-Vendor

Library paling populer untuk **CLI over SSH**. Menyederhanakan Paramiko dan menangani perbedaan vendor.

```python
from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",   # atau: mikrotik_routeros, arista_eos, juniper_junos
    "host": "192.168.1.1",
    "username": "admin",
    "password": "password",
    "secret": "enable_password",   # untuk enable mode
}

# Koneksi
conn = ConnectHandler(**device)
conn.enable()                       # masuk enable mode

# Jalankan perintah show
output = conn.send_command("show ip interface brief")
print(output)

# Perintah dengan output terstruktur (TextFSM/Genie)
interfaces = conn.send_command("show ip interface brief", use_textfsm=True)
for intf in interfaces:            # sekarang list of dict!
    print(intf["interface"], intf["status"])

# Perintah konfigurasi
config = ["interface GigabitEthernet2", "description Diubah via Netmiko", "no shutdown"]
conn.send_config_set(config)
conn.save_config()                  # write memory

conn.disconnect()
```

### Menangani banyak perangkat

```python
from netmiko import ConnectHandler
from concurrent.futures import ThreadPoolExecutor

devices = [
    {"device_type": "cisco_ios", "host": "192.168.1.1", "username": "admin", "password": "pass"},
    {"device_type": "cisco_ios", "host": "192.168.1.2", "username": "admin", "password": "pass"},
    # ... 200 perangkat
]

def backup_config(device):
    try:
        conn = ConnectHandler(**device)
        output = conn.send_command("show running-config")
        with open(f"backup-{device['host']}.txt", "w") as f:
            f.write(output)
        conn.disconnect()
        return f"OK: {device['host']}"
    except Exception as e:
        return f"GAGAL: {device['host']} - {e}"

# Paralel — jauh lebih cepat
with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(backup_config, devices)
    for r in results:
        print(r)
```

💡 **`use_textfsm=True` mengubah output CLI menjadi data terstruktur** (list of dict) — sehingga Anda tidak perlu mem-parse teks secara manual. Netmiko memakai template TextFSM dari proyek `ntc-templates`.

⚠️ **Netmiko adalah CLI scraping** — rapuh terhadap perubahan format output antar-versi. Untuk perangkat yang mendukung NETCONF/RESTCONF, itu lebih andal. Tetapi Netmiko tetap dominan karena bekerja di **semua** perangkat yang punya SSH.

### MikroTik dengan Netmiko

```python
device = {
    "device_type": "mikrotik_routeros",
    "host": "192.168.88.1",
    "username": "admin",
    "password": "password",
}
conn = ConnectHandler(**device)
print(conn.send_command("/ip address print"))
conn.send_config_set(["/ip address add address=10.0.0.1/24 interface=ether2"])
```

---

## 3. NAPALM — Abstraksi Multi-Vendor

**NAPALM** (Network Automation and Programmability Abstraction Layer with Multivendor support) memberi **API yang sama** untuk vendor berbeda.

```python
from napalm import get_network_driver

driver = get_network_driver("ios")   # atau: eos, junos, nxos, iosxr
device = driver(hostname="192.168.1.1", username="admin", password="password")
device.open()

# GETTER — data terstruktur yang SAMA di semua vendor!
facts = device.get_facts()
print(facts["hostname"], facts["os_version"], facts["uptime"])

interfaces = device.get_interfaces()
for name, data in interfaces.items():
    print(name, data["is_up"], data["description"])

# Getter lain
device.get_interfaces_counters()
device.get_arp_table()
device.get_bgp_neighbors()
device.get_lldp_neighbors()
device.get_environment()

device.close()
```

💡 **Keunggulan NAPALM: getter yang sama untuk semua vendor.** `get_bgp_neighbors()` mengembalikan struktur data yang identik apakah perangkatnya Cisco IOS, Arista EOS, atau Junos — sehingga skrip Anda portabel. Ini mengatasi kelemahan Netmiko yang output-nya berbeda per vendor.

### Konfigurasi dengan diff dan rollback

```python
device.open()

# Muat konfigurasi (merge = tambah, replace = ganti seluruhnya)
device.load_merge_candidate(filename="config-baru.txt")

# LIHAT PERUBAHAN sebelum menerapkan — sangat penting!
diff = device.compare_config()
print(diff)

if diff:
    # device.commit_config()      # terapkan
    device.discard_config()       # atau batalkan
device.close()
```

⚠️ **`compare_config()` (diff) sebelum commit adalah praktik terbaik** — Anda melihat persis apa yang akan berubah sebelum menerapkannya. NAPALM juga mendukung **rollback** ke konfigurasi sebelumnya di banyak platform.

---

## 4. Scrapli dan ncclient

### Scrapli — alternatif Netmiko yang lebih cepat

```python
from scrapli import Scrapli

device = {
    "host": "192.168.1.1",
    "auth_username": "admin",
    "auth_password": "password",
    "auth_strict_key": False,
    "platform": "cisco_iosxe",
}
with Scrapli(**device) as conn:
    response = conn.send_command("show version")
    print(response.result)
    # Parsing terstruktur
    parsed = response.textfsm_parse_output()
```

💡 **Scrapli lebih cepat dan modern daripada Netmiko**, dengan dukungan async. **scrapli-netconf** menangani NETCONF. Untuk proyek baru, banyak yang memilih Scrapli.

### ncclient — NETCONF

```python
from ncclient import manager

with manager.connect(host="192.168.1.1", port=830, username="admin",
                     password="password", hostkey_verify=False) as m:
    config = m.get_config(source="running")
    print(config)
    # edit-config + commit (transaksional) — lihat 15-otomasi/02
```

---

## 5. Jinja2 — Templating Konfigurasi

Memisahkan **template** (struktur) dari **data** (nilai) — kunci konfigurasi yang konsisten dan skalabel.

**Template `interface.j2`:**
```jinja2
{% for intf in interfaces %}
interface {{ intf.name }}
 description {{ intf.description }}
 {% if intf.mode == 'access' %}
 switchport mode access
 switchport access vlan {{ intf.vlan }}
 {% elif intf.mode == 'trunk' %}
 switchport mode trunk
 switchport trunk allowed vlan {{ intf.allowed_vlans | join(',') }}
 {% endif %}
 no shutdown
{% endfor %}
```

**Data `data.yaml`:**
```yaml
interfaces:
  - name: GigabitEthernet0/1
    description: PC-Finance
    mode: access
    vlan: 10
  - name: GigabitEthernet0/24
    description: Uplink
    mode: trunk
    allowed_vlans: [10, 20, 30]
```

**Skrip:**
```python
import yaml
from jinja2 import Environment, FileSystemLoader

# Muat data
with open("data.yaml") as f:
    data = yaml.safe_load(f)

# Render template
env = Environment(loader=FileSystemLoader("."), trim_blocks=True, lstrip_blocks=True)
template = env.get_template("interface.j2")
config = template.render(**data)
print(config)
```

**Output:**
```
interface GigabitEthernet0/1
 description PC-Finance
 switchport mode access
 switchport access vlan 10
 no shutdown
interface GigabitEthernet0/24
 description Uplink
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 no shutdown
```

💡 **Templating adalah dasar konfigurasi konsisten.** Anda menulis template sekali, lalu menghasilkan konfigurasi untuk ratusan perangkat dari data yang berbeda. Perubahan pada standar cukup diubah di template, bukan di setiap perangkat.

⚠️ **`trim_blocks` dan `lstrip_blocks`** mengontrol whitespace — tanpa itu, template menghasilkan baris kosong dan spasi yang tidak diinginkan. Selalu uji output template sebelum menerapkannya.

---

## 6. requests dan httpx — REST API

Untuk berinteraksi dengan controller (Catalyst Center, Meraki, ACI) dan RESTCONF.

```python
import requests

# Meraki Dashboard API (contoh)
API_KEY = "your-api-key"
headers = {"X-Cisco-Meraki-API-Key": API_KEY, "Content-Type": "application/json"}
base = "https://api.meraki.com/api/v1"

# GET organisasi
r = requests.get(f"{base}/organizations", headers=headers)
r.raise_for_status()
for org in r.json():
    print(org["id"], org["name"])

# RESTCONF ke perangkat
r = requests.get(
    "https://192.168.1.1/restconf/data/ietf-interfaces:interfaces",
    auth=("admin", "password"),
    headers={"Accept": "application/yang-data+json"},
    verify=False,   # HANYA lab
)
data = r.json()
```

💡 **httpx** adalah alternatif modern requests dengan dukungan async dan HTTP/2 — berguna untuk API yang lambat atau banyak request paralel. Untuk sebagian besar kasus, requests sudah cukup.

⚠️ **Jangan hard-code kredensial di skrip.** Gunakan environment variable, vault, atau file terpisah yang tidak masuk Git:
```python
import os
API_KEY = os.environ["MERAKI_API_KEY"]   # dari env var
```

---

## 7. Nornir — Framework Orkestrasi

**Nornir** adalah framework Python murni untuk otomasi jaringan — menangani **inventory, konkurensi, dan orkestrasi**, lalu memanggil Netmiko/NAPALM/Scrapli sebagai plugin.

```python
from nornir import InitNornir
from nornir_netmiko.tasks import netmiko_send_command
from nornir_utils.plugins.functions import print_result

# Inisialisasi dengan inventory
nr = InitNornir(config_file="config.yaml")

# Jalankan task di SEMUA perangkat (paralel otomatis)
result = nr.run(task=netmiko_send_command, command_string="show ip interface brief")
print_result(result)

# Filter perangkat
core = nr.filter(role="core")
core.run(task=netmiko_send_command, command_string="show ip bgp summary")
```

**Inventory `hosts.yaml`:**
```yaml
sw-access-01:
  hostname: 192.168.1.11
  platform: cisco_ios
  groups: [access]
sw-core-01:
  hostname: 192.168.1.1
  platform: cisco_ios
  groups: [core]
```

**Groups `groups.yaml`:**
```yaml
access:
  data:
    role: access
core:
  data:
    role: core
```

💡 **Nornir memberi struktur** untuk otomasi skala besar: inventory terkelola, konkurensi otomatis, filtering perangkat, dan hasil terstruktur. Ia adalah "kerangka" yang memanggil Netmiko/NAPALM sebagai "mesin". Bisa memakai NetBox sebagai sumber inventory dinamis.

---

## 8. Contoh Lengkap: Backup + Audit

Menggabungkan konsep untuk tugas nyata.

```python
#!/usr/bin/env python3
"""Backup konfigurasi + audit sederhana untuk banyak perangkat."""
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from netmiko import ConnectHandler
import yaml

def load_inventory(path):
    with open(path) as f:
        return yaml.safe_load(f)

def process_device(name, dev):
    result = {"name": name, "backup": False, "audit": []}
    try:
        conn = ConnectHandler(
            device_type=dev["platform"], host=dev["hostname"],
            username=os.environ["NET_USER"], password=os.environ["NET_PASS"],
        )
        # Backup
        config = conn.send_command("show running-config")
        os.makedirs("backups", exist_ok=True)
        with open(f"backups/{name}.cfg", "w") as f:
            f.write(config)
        result["backup"] = True

        # Audit sederhana — periksa kepatuhan standar
        if "no ip http server" not in config:
            result["audit"].append("HTTP server aktif (harus dimatikan)")
        if "service password-encryption" not in config:
            result["audit"].append("Password encryption tidak aktif")
        if "logging host" not in config:
            result["audit"].append("Tidak ada syslog terpusat")
        if "transport input telnet" in config:
            result["audit"].append("Telnet aktif (harus SSH saja)")

        conn.disconnect()
    except Exception as e:
        result["error"] = str(e)
    return result

def main():
    inventory = load_inventory("inventory.yaml")
    with ThreadPoolExecutor(max_workers=10) as ex:
        results = list(ex.map(lambda kv: process_device(*kv), inventory.items()))

    print(f"\n{'='*60}\nLaporan {datetime.now():%Y-%m-%d %H:%M}\n{'='*60}")
    for r in results:
        if r.get("error"):
            print(f"❌ {r['name']}: {r['error']}")
        else:
            status = "✅" if r["backup"] else "⚠️"
            print(f"{status} {r['name']}: backup {'OK' if r['backup'] else 'GAGAL'}")
            for issue in r["audit"]:
                print(f"     ⚠️  {issue}")

if __name__ == "__main__":
    main()
```

💡 **Skrip audit read-only seperti ini adalah titik awal yang aman** untuk otomasi — tidak mengubah apa pun, hanya membaca dan melaporkan. Bangun kepercayaan dengan tugas read-only sebelum ke perubahan.

---

## 9. Scapy — Membuat dan Menganalisis Paket

Untuk memahami protokol dan membuat paket kustom (lihat juga `12-keamanan/06`).

```python
from scapy.all import *

# Kirim paket ICMP
send(IP(dst="192.168.1.1")/ICMP())

# Uji apakah port terbuka (TCP SYN)
ans = sr1(IP(dst="192.168.1.10")/TCP(dport=443, flags="S"), timeout=2, verbose=0)
if ans and ans.haslayer(TCP) and ans[TCP].flags == "SA":
    print("Port 443 terbuka")

# Analisis paket dari capture
packets = rdpcap("capture.pcap")
for p in packets:
    if p.haslayer(DNS) and p[DNS].qr == 0:      # query DNS
        print(p[DNS].qd.qname.decode())

# ARP scan LAN (izin!)
ans, _ = srp(Ether(dst="ff:ff:ff:ff:ff:ff")/ARP(pdst="192.168.1.0/24"),
             timeout=2, verbose=0)
for _, rcv in ans:
    print(rcv[ARP].psrc, rcv[Ether].src)
```

💡 **Scapy sangat berguna untuk BELAJAR protokol** — Anda bisa membuat paket apa pun dan melihat responsnya, memahami header secara langsung. Untuk network engineer, ini alat pendidikan yang luar biasa. ⚠️ Ingat batasan hukum untuk pengujian (`12-keamanan/06`).

---

## 10. pyATS/Genie — Testing dan Validasi Cisco

Framework testing jaringan dari Cisco.

```python
from genie.testbed import load

testbed = load("testbed.yaml")
device = testbed.devices["sw-access-01"]
device.connect()

# Parsing output menjadi struktur (ribuan parser bawaan)
output = device.parse("show ip interface brief")
for intf, data in output["interface"].items():
    if data["status"] != "up":
        print(f"⚠️ {intf} status {data['status']}")

# Snapshot state untuk perbandingan sebelum/sesudah perubahan
device.learn("bgp")     # pelajari state BGP
# ... lakukan perubahan ...
# bandingkan sebelum/sesudah untuk validasi
```

💡 **pyATS/Genie unggul untuk validasi** — mengambil "snapshot" state jaringan (routing, BGP, interface) sebelum perubahan, lalu membandingkan setelahnya untuk memastikan tidak ada yang rusak. Ribuan parser bawaan mengubah output CLI Cisco menjadi struktur.

---

## 11. Praktik Terbaik Skrip Otomasi

```
✅ Virtual environment (venv) untuk setiap proyek
✅ Kredensial dari environment variable/vault, JANGAN hard-code
✅ Error handling (try/except) di setiap operasi jaringan
✅ Logging (bukan print) untuk skrip produksi
✅ Idempoten kalau memungkinkan
✅ DRY-RUN dulu — tampilkan apa yang AKAN dilakukan
✅ Diff sebelum commit (NAPALM compare_config)
✅ Mulai read-only (backup, audit) sebelum write
✅ Uji di LAB dulu, lalu subset kecil, baru semua
✅ Version control (Git) untuk skrip dan konfigurasi
✅ Konkurensi (ThreadPoolExecutor) untuk skala, dengan batas
✅ Timeout pada semua koneksi
✅ Dokumentasi (docstring, README)
```

```
❌ JANGAN hard-code password
❌ JANGAN jalankan di produksi tanpa dry-run/lab
❌ JANGAN abaikan error (skrip harus tahu perangkat mana gagal)
❌ JANGAN commit tanpa diff
❌ JANGAN buat koneksi baru berulang tanpa batas konkurensi
```

⚠️ **Blast radius:** skrip yang menyentuh 500 perangkat bisa merusak 500 perangkat. Selalu (a) uji di lab, (b) jalankan pada 1-2 perangkat dulu, (c) perluas bertahap, (d) siapkan rollback, (e) punya batas konkurensi agar tidak membanjiri jaringan atau AAA server.

---

## 12. Ringkasan

- **Python adalah bahasa dominan otomasi jaringan.** Cukup kuasai dasar + library jaringan; selalu pakai **venv** dan **error handling**.
- **Netmiko**: SSH multi-vendor (CLI scraping), `send_command`/`send_config_set`, `use_textfsm=True` untuk output terstruktur. Universal tetapi rapuh terhadap perubahan format.
- **NAPALM**: abstraksi multi-vendor dengan **getter yang sama** untuk semua vendor; **compare_config (diff) + rollback**.
- **Scrapli**: alternatif Netmiko yang lebih cepat dan modern (async). **ncclient** untuk NETCONF.
- **Jinja2**: memisahkan template dari data → konfigurasi konsisten dan skalabel; perhatikan `trim_blocks`.
- **requests/httpx**: REST API controller dan RESTCONF; **jangan hard-code kredensial**.
- **Nornir**: framework orkestrasi (inventory, konkurensi, filtering) yang memanggil Netmiko/NAPALM sebagai plugin; bisa memakai NetBox.
- **Scapy**: membuat/menganalisis paket — alat belajar protokol yang luar biasa.
- **pyATS/Genie**: testing dan validasi Cisco dengan snapshot state sebelum/sesudah.
- **Mulai read-only** (backup, audit), lalu perluas bertahap. **Dry-run, diff, lab, subset kecil** sebelum produksi.
- ⚠️ **Blast radius**: otomasi memperbesar dampak kesalahan — batasi konkurensi, uji bertahap, siapkan rollback.

---

## 13. Latihan

1. Kenapa selalu memakai virtual environment untuk proyek otomasi?
2. Apa perbedaan Netmiko dan NAPALM, dan kapan memakai masing-masing?
3. Kenapa `use_textfsm=True` berguna, dan apa keterbatasannya?
4. Jelaskan manfaat Jinja2 templating untuk konfigurasi.
5. Kenapa `compare_config()` (diff) penting sebelum menerapkan perubahan?
6. Apa peran Nornir dibanding Netmiko/NAPALM?
7. Anda menulis skrip untuk mengubah konfigurasi 300 perangkat. Sebutkan lima pengaman yang harus Anda terapkan.
8. Kenapa memulai dengan skrip read-only (backup/audit) adalah pendekatan yang bijak?

<details>
<summary>Jawaban</summary>

1. Karena **virtual environment mengisolasi dependensi per proyek**. Tanpa venv, semua library diinstal ke Python sistem, sehingga: (a) proyek berbeda yang butuh versi library berbeda **berkonflik**; (b) menginstal/mengupgrade library bisa **merusak alat sistem** yang bergantung pada Python (banyak utilitas Linux ditulis dengan Python); (c) tidak bisa mereproduksi lingkungan dengan andal di mesin lain. Dengan venv (`python3 -m venv venv; source venv/bin/activate`), setiap proyek punya set library sendiri yang terisolasi, dapat didokumentasikan (`pip freeze > requirements.txt`) dan direproduksi. Ini praktik standar Python, bukan khusus jaringan.

2. **Netmiko** adalah **CLI scraping over SSH** — ia menjalankan perintah CLI dan mengembalikan **output teks mentah** (atau terstruktur dengan TextFSM). Ia bekerja di **semua** perangkat yang punya SSH, tetapi output-nya **berbeda per vendor** dan rapuh terhadap perubahan format antar-versi.
   **NAPALM** memberi **abstraksi multi-vendor** — getter seperti `get_bgp_neighbors()` mengembalikan **struktur data yang IDENTIK** apakah perangkatnya Cisco, Arista, atau Junos, sehingga skrip Anda **portabel** antar-vendor. NAPALM juga mendukung config diff dan rollback.
   **Kapan memakai:** gunakan **Netmiko** untuk perangkat/perintah yang tidak dicakup NAPALM, tugas ad-hoc, vendor yang tidak didukung NAPALM, atau ketika Anda butuh perintah CLI spesifik. Gunakan **NAPALM** ketika Anda ingin kode portabel multi-vendor, memakai getter standar, atau butuh diff/rollback konfigurasi. Sering keduanya dipakai bersama (Nornir bisa memanggil keduanya).

3. `use_textfsm=True` **mengubah output CLI teks menjadi data terstruktur** (list of dict) menggunakan template TextFSM dari proyek `ntc-templates`. Manfaatnya: alih-alih mem-parse teks `show ip interface brief` secara manual (rawan salah, rapuh), Anda langsung mendapat `intf["interface"]`, `intf["status"]` — mudah diproses secara programatik.
   **Keterbatasan:** (a) **bergantung pada template TextFSM yang tersedia** untuk perintah dan platform itu — kalau tidak ada template, Anda kembali ke teks mentah; (b) template **rapuh terhadap perubahan format output** antar-versi software — kalau vendor mengubah format `show`, template bisa gagal parsing; (c) tidak semua perintah punya template. Untuk keandalan maksimal, perangkat yang mendukung **NETCONF/RESTCONF/gNMI** memberi data terstruktur secara native (dari model YANG) tanpa masalah parsing ini — tetapi CLI scraping + TextFSM tetap dominan karena universal.

4. **Jinja2 memisahkan struktur konfigurasi (template) dari nilai-nilai spesifik (data).** Manfaatnya: (a) **Konsistensi** — semua perangkat dihasilkan dari template yang sama, sehingga tidak ada variasi gaya atau kesalahan manual; (b) **Skalabilitas** — satu template menghasilkan konfigurasi untuk ratusan perangkat dari data yang berbeda (VLAN, alamat, deskripsi); (c) **Perubahan terpusat** — kalau standar berubah (mis. menambah baris hardening), Anda ubah **template sekali**, bukan 200 perangkat; (d) **Pemisahan tanggung jawab** — data (di YAML/NetBox) bisa dikelola terpisah dari logika (template), sering oleh tim/orang berbeda; (e) **Dapat divalidasi dan di-review** — template dan data keduanya file teks di Git. Ini fondasi Infrastructure as Code untuk konfigurasi jaringan, dan yang dipakai Ansible di baliknya.

5. Karena `compare_config()` menampilkan **persis apa yang akan berubah** sebelum perubahan diterapkan — sama seperti `git diff` sebelum commit, atau `terraform plan` sebelum apply. Manfaatnya: (a) **mencegah kejutan** — Anda melihat apakah perubahan sesuai niat, atau ada efek samping yang tidak diinginkan; (b) **menangkap kesalahan** sebelum merusak perangkat — mis. konfigurasi yang salah menghapus sesuatu yang penting; (c) **review dan persetujuan** — diff bisa ditinjau orang lain sebelum diterapkan; (d) **dokumentasi** — mencatat apa yang berubah. Di otomasi jaringan di mana satu kesalahan bisa memutus perangkat atau seluruh jaringan, **melihat diff sebelum commit adalah pengaman esensial**. NAPALM (dan NETCONF candidate datastore) mendukung ini secara native; ini salah satu alasan mereka lebih aman daripada CLI scraping buta.

6. **Nornir adalah kerangka orkestrasi**, bukan library koneksi. Ia menangani hal-hal yang berada **di sekitar** koneksi ke perangkat: (a) **inventory** — mengelola daftar perangkat, grup, dan atribut (bisa dari file YAML atau NetBox dinamis); (b) **konkurensi** — menjalankan task di banyak perangkat secara paralel dengan pengelolaan thread otomatis; (c) **filtering** — memilih subset perangkat (mis. hanya role=core); (d) **hasil terstruktur** — mengumpulkan dan menampilkan hasil dari semua perangkat.
   Untuk **koneksi dan interaksi sebenarnya**, Nornir memanggil **Netmiko, NAPALM, atau Scrapli sebagai plugin**. Jadi hubungannya: Nornir = kerangka/orkestrator ("mesin manajemen"); Netmiko/NAPALM = mesin koneksi. Tanpa Nornir, Anda harus menulis sendiri loop, threading, inventory management, dan error aggregation — Nornir menyediakan semua itu dengan struktur yang teruji, sehingga Anda fokus pada logika task.

7. (a) **Uji di lab dulu** — jalankan seluruh skrip di lingkungan lab (Containerlab/GNS3) sebelum menyentuh produksi. (b) **Dry-run / diff** — tampilkan apa yang **akan** dilakukan tanpa benar-benar menerapkannya (`compare_config`, mode simulasi), dan review outputnya. (c) **Jalankan bertahap** — mulai pada **1-2 perangkat**, verifikasi, lalu perluas ke subset kecil, baru semua; jangan langsung 300. (d) **Error handling + logging** — tangkap kegagalan per perangkat sehingga skrip tahu persis mana yang berhasil/gagal dan tidak berhenti di perangkat pertama yang bermasalah; catat semuanya. (e) **Rollback plan** — punya cara mengembalikan konfigurasi (backup sebelum perubahan, NAPALM rollback, atau NETCONF candidate/commit dengan confirm timer). Tambahan: (f) **batasi konkurensi** agar tidak membanjiri jaringan atau AAA server; (g) **kredensial dari vault**, bukan hard-code; (h) **idempotensi** agar aman dijalankan ulang; (i) jalankan di **jendela pemeliharaan** dengan pemberitahuan.

8. Karena skrip **read-only tidak dapat merusak apa pun** — ia hanya membaca dan melaporkan, sehingga risikonya minimal sambil tetap memberi nilai nyata (backup otomatis, audit kepatuhan, pengumpulan inventaris, deteksi drift). Ini pendekatan bijak karena: (a) **membangun keterampilan** dengan library (Netmiko, NAPALM, Nornir) tanpa risiko; (b) **membangun kepercayaan** — tim dan manajemen melihat otomasi bekerja dengan aman sebelum memberi izin untuk perubahan; (c) **membangun infrastruktur pendukung** — inventory, kredensial management, error handling, pola konkurensi — yang akan dipakai ulang saat beralih ke write; (d) **memberi nilai langsung** — backup dan audit sudah sangat berguna; (e) **menemukan masalah** — audit sering mengungkap perangkat yang tidak patuh standar. Setelah nyaman dengan read-only, transisi ke perubahan (dengan dry-run, diff, dan pengaman) menjadi langkah kecil dan terkelola, bukan lompatan besar yang berisiko.

</details>

---

## 14. Sumber

- Netmiko — https://github.com/ktbyers/netmiko
- NAPALM — https://napalm.readthedocs.io/
- Nornir — https://nornir.readthedocs.io/
- Scrapli — https://carlmontanari.github.io/scrapli/
- ncclient — https://ncclient.readthedocs.io/
- Jinja2 — https://jinja.palletsprojects.com/
- pyATS/Genie — https://developer.cisco.com/pyats/
- Cisco CCNA 200-301 v1.1, topik 6.6 (Ansible dan Terraform)
- *Network Programmability and Automation* (O'Reilly)
- MikroTik: librouteros, RouterOS-api (Python)

---

**Berikutnya:** `15-otomasi/04-ansible-cicd.md` — otomasi deklaratif dan CI/CD jaringan.
