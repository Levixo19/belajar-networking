# Lab 08: NetDevOps dari Nol

> **Prasyarat:** `15-otomasi/03-python-jaringan`, `15-otomasi/04-ansible-cicd`, `lab/05-lab-linux-otomasi`, `07-routing-lanjutan/04-ospf`, `14-monitoring-troubleshooting/03-observability`
> **Tujuan:** Anda membangun satu alur NetDevOps utuh di satu mesin: jaringan containerlab, NetBox sebagai source of truth, konfigurasi dari template Jinja2, verifikasi Batfish sebelum deploy, deploy Nornir dengan canary dan rollback otomatis, streaming telemetry gNMI ke Prometheus dan Grafana, serta pipeline CI bergaya GitOps.
> **Platform:** Linux (native atau VM) dengan Docker, containerlab v0.81.x, Python 3.11 ke atas. RAM 16 GB disarankan. Semua perangkat lunak gratis.
> **Format:** setiap langkah berisi TUGAS → VERIFIKASI → KRITERIA SUKSES, ditutup skenario troubleshooting dan rollback.

Modul `15-otomasi/02-data-dan-api` sampai `15-otomasi/04-ansible-cicd` memperkenalkan NETCONF, gNMI, Nornir, NetBox, Batfish, dan CI/CD sebagai konsep. Lab 05 baru menyentuh backup dengan Netmiko dan satu playbook Ansible. Lab ini menyambungkan semuanya menjadi satu rantai kerja yang sama dengan yang dipakai tim jaringan modern. Data mengalir dari source of truth ke perangkat tanpa diketik ulang oleh manusia, dan setiap perubahan diperiksa tiga kali: sebelum deploy oleh Batfish, saat deploy oleh canary dan post-check, dan sesudah deploy oleh telemetri.

> [!WARNING]
> Lab ini panjang. Kerjakan berurutan, satu langkah per sesi bila perlu. Setiap langkah menghasilkan sesuatu yang bisa Anda periksa sendiri, jadi Anda tidak perlu menyelesaikan semuanya dalam sekali duduk.

---

## 1. Gambaran Proyek

### Alur yang akan Anda bangun

```
  NetBox (data inventaris & IPAM)        policy/firewall.yml (kebijakan di Git)
             │                                        │
             └──────────── scripts/render.py (Jinja2) ┘
                                  │
                                  ▼
               build/  = konfigurasi yang DIMAKSUD, di-commit ke Git
                                  │  pull request
                                  ▼
     CI: lint → uji offline → render-check → uji Batfish (pytest + pybatfish)
                                  │  merge ke main + persetujuan manusia
                                  ▼
     scripts/deploy.py (Nornir): pre-check → canary → post-check → sisanya
                │                                       │ regresi?
                ▼                                       └──► rollback otomatis
     containerlab: 4 router FRR + 2 switch SR Linux + 3 host
                │ gNMI (push, 5 detik)        │ SNMP (poll, 30 detik)
                ▼                             ▼
              gnmic ─────────► Prometheus ◄── snmp_exporter
                                    │
                                 Grafana
```

### Topologi "jaringan produksi"

```
          r1 ------------ r2        inti (FRR, OSPF area 0)
          |  \          /  |
          |    \      /    |        biaya OSPF: link ke r1 = 10, link ke r2 = 20
          |      \  /      |
          |      /  \      |
          |    /      \    |
          r3 /          \ r4        distribusi (FRR); r3 dan r4 tidak terhubung langsung
         /  \              |
       sw1  noc1          sw2       akses L2 (Nokia SR Linux, mac-vrf)
        |                  |
        h1                srv1      host (network-multitool)
```

| Perangkat | Peran | Alamat penting | Manajemen |
|---|---|---|---|
| r1, r2 | router inti FRR | loopback 10.255.0.1 dan .2, link /31 dari 10.0.0.0/24 | 172.30.30.11, .12 |
| r3 | router distribusi FRR | gateway pengguna 10.10.10.1/24, gateway NOC 10.99.0.1/24 | 172.30.30.13 |
| r4 | router distribusi FRR | gateway server 10.20.20.1/24 | 172.30.30.14 |
| sw1, sw2 | switch akses SR Linux, murni L2 | tanpa alamat data | 172.30.30.21, .22 |
| h1 | klien pengguna | 10.10.10.10/24 | 172.30.30.31 |
| noc1 | stasiun kerja NOC | 10.99.0.10/24 | 172.30.30.32 |
| srv1 | server web (nginx 80/443, SSH 22) | 10.20.20.10/24 | 172.30.30.33 |
| gnmic, prometheus, grafana, snmp-exporter | tumpukan telemetri | | 172.30.30.41 sampai .44 |

Jalur normal h1 ke srv1 adalah r3 → r1 → r4 (biaya 10 + 10), sedangkan jalur cadangan r3 → r2 → r4 (biaya 20 + 20). Kebijakan keamanannya sederhana tetapi realistis: semua LAN internal boleh membuka web di srv1, hanya LAN NOC yang boleh SSH ke srv1.

### Mengapa campuran FRR dan SR Linux

Pilihan platform di lab ini disengaja, dan alasannya sendiri adalah pelajaran:

- **FRR** dipakai untuk semua router karena Batfish bisa memodelkan konfigurasinya (parser FRR di Batfish dipakai lewat format "Cumulus concatenated"). Tanpa model, tidak ada verifikasi pra-deploy.
- **SR Linux** dipakai untuk switch akses karena ia punya gNMI bawaan untuk streaming telemetry. FRR tidak punya server gNMI. Sebaliknya Batfish tidak memodelkan SR Linux.
- Karena switch hanya bekerja di L2, Batfish tetap bisa menyimpulkan adjacency L3 antara router dan host dari kesamaan subnet, sehingga analisis reachability tetap utuh.

Jaringan nyata hampir selalu multi-vendor seperti ini. Tidak ada satu alat yang menutup semuanya, jadi keterampilan intinya adalah tahu batas setiap alat dan menambal celahnya dengan alat lain.

### Peta berkas kode

Semua kode ada di `materi/lab/kode/netdevops/`:

```
netdevops/
├── topology/netdevops.clab.yml   topologi containerlab (jaringan + telemetri)
├── images/srv/Dockerfile         image srv1: network-multitool + iptables
├── netbox/docker-compose.override.yml   override netbox-docker (port, admin, token lab)
├── sot/seed.yml                  data awal SoT: site, prefix, perangkat, kabel
├── policy/firewall.yml           kebijakan firewall srv1 sebagai kode
├── templates/                    frr.conf.j2, srlinux.cli.j2, iptables.j2
├── scripts/
│   ├── seed_netbox.py            isi NetBox lewat API (idempoten)
│   ├── sotlib.py                 baca NetBox atau seed, klasifikasi, validasi
│   ├── render.py                 Jinja2 → build/ (+ --check untuk CI)
│   ├── tasks.py                  task Nornir: deploy, rollback, post-check
│   ├── deploy.py                 orkestrasi canary, post-check, rollback
│   ├── postcheck.py              pemeriksaan kesehatan mandiri
│   └── wait_batfish.py           tunggu layanan Batfish siap (CI)
├── tests/
│   ├── test_offline.py           uji logika kita sendiri (tanpa Batfish)
│   ├── test_batfish.py           uji pra-deploy dengan Batfish
│   └── conftest.py
├── nornir/                       config.yaml, groups.yaml, defaults.yaml
├── telemetry/                    gnmic.yml, prometheus.yml, grafana/
├── build/                        HASIL render, sengaja di-commit (GitOps)
└── .github/workflows/netdevops.yml   pipeline CI/CD
```

### Versi alat yang dipakai (diperiksa Oktober 2026)

| Alat | Versi | Catatan |
|---|---|---|
| containerlab | v0.81.0 | rilis 11 Oktober 2026 |
| FRRouting | 10.7.1, image `quay.io/frrouting/frr:containerlab-10.7.1` | image containerlab resmi FRR, sudah berisi SSH |
| Nokia SR Linux | `ghcr.io/nokia/srlinux:26.7.2` | gratis untuk lab, tunduk pada EULA Nokia |
| NetBox | v4.7.2 lewat netbox-docker 5.1.1 | netbox-docker 5.1.x khusus NetBox 4.7.x |
| pynetbox | 7.9.0 | pasangan resmi NetBox 4.7 |
| Nornir | 3.6.0, nornir-napalm 0.6.0, nornir-netmiko 1.0.1 | |
| netmiko / napalm-srlinux | 4.8.0 / 0.3.1 | napalm-srlinux memakai JSON-RPC SR Linux |
| Batfish / pybatfish | image `batfish/batfish:latest` (rilis 27 Agustus 2026) / 2026.9.17.3748 | |
| gnmic | 0.49.0 | |
| Prometheus / snmp_exporter / Grafana | v3.15.0 / v0.30.1 / 13.2.3 | |

### Kebutuhan sumber daya

Node SR Linux adalah yang terberat di topologi. NetBox (aplikasi, database PostgreSQL, cache, worker) dan Batfish (aplikasi Java) masing-masing juga membutuhkan beberapa GB RAM. Dengan 16 GB RAM semuanya bisa berjalan bersamaan dengan nyaman. Dengan 8 GB, jalankan bergantian: NetBox hanya saat merender, Batfish hanya saat menguji, lalu matikan (`docker compose stop`, `docker stop batfish`).

---

## 2. Langkah 0: Menyiapkan Mesin Lab

**TUGAS:**

1. Pasang Docker dan containerlab v0.81.x.
2. Pastikan Anda punya kunci SSH. Image FRR containerlab menyalin kunci publik host ke node, dan Nornir memakai kunci itu untuk masuk sebagai `root`.
3. Salin kode lab ke direktori kerja dan jadikan repositori Git.
4. Siapkan virtualenv Python, bangun image srv1, jalankan uji offline.

```bash
# 1. containerlab versi tertentu (cara lain: containerlab.dev/install)
bash -c "$(curl -sL https://get.containerlab.dev)" -- -v 0.81.0
containerlab version

# 2. kunci SSH (lewati bila sudah ada)
ls ~/.ssh/*.pub || ssh-keygen -t ed25519

# 3. direktori kerja = calon repositori Git
cp -r materi/lab/kode/netdevops ~/netdevops
cd ~/netdevops
git init -b main && git add . && git commit -m "Lab 08: titik awal"

# 4. Python dan image srv1
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
docker build -t netdevops/srv:local images/srv
pytest -q tests/test_offline.py
```

**VERIFIKASI:** `containerlab version` menampilkan 0.81.x. Uji offline menguji logika kita sendiri (klasifikasi SoT, render template, parser keluaran perangkat) tanpa butuh perangkat apa pun:

```
..........                                                               [100%]
10 passed
```

**KRITERIA SUKSES:** 10 uji offline lulus, image `netdevops/srv:local` ada di `docker images`, dan repositori Git punya satu commit.

> [!TIP]
> Perhatikan bahwa `build/` sudah berisi hasil render dari `sot/seed.yml`. Itu disengaja: di alur GitOps, konfigurasi yang dimaksud ikut tersimpan di Git, sehingga setiap perubahan konfigurasi terlihat sebagai diff di pull request.

---

## 3. Langkah 1: Jaringan "Produksi" dengan containerlab

Router FRR dan switch SR Linux dinyalakan tanpa konfigurasi jaringan. Itu inti "dari nol": tidak ada satu baris konfigurasi pun yang akan Anda ketik langsung di perangkat. Hanya host yang diberi alamat lewat `exec` di berkas topologi, karena host berada di luar cakupan otomasi jaringan lab ini (kecuali firewall srv1).

Potongan penting `topology/netdevops.clab.yml`:

```yaml
name: netdevops
mgmt:
  network: nd-mgmt
  ipv4-subnet: 172.30.30.0/24
topology:
  kinds:
    frr:
      image: quay.io/frrouting/frr:containerlab-10.7.1
      daemons:
        - ospfd
    nokia_srlinux:
      image: ghcr.io/nokia/srlinux:26.7.2
  nodes:
    r1: {kind: frr, mgmt-ipv4: 172.30.30.11, group: inti}
    sw1: {kind: nokia_srlinux, mgmt-ipv4: 172.30.30.21, group: akses}
    h1:
      kind: linux
      mgmt-ipv4: 172.30.30.31
      exec:
        - ip addr add 10.10.10.10/24 dev eth1
        - ip route replace default via 10.10.10.1 dev eth1
  links:
    - endpoints: ["r1:eth1", "r2:eth1"]
    - endpoints: ["r3:eth3", "sw1:e1-1"]
```

Beberapa hal yang perlu Anda pahami dari berkas ini:

- `kind: frr` adalah kind FRR bawaan containerlab. Ia menulis `frr.conf`, `daemons`, dan `vtysh.conf` ke direktori lab, mengaktifkan forwarding di namespace container, dan menyalin kunci SSH Anda. Daftar `daemons` membatasi daemon yang berjalan; `zebra`, `staticd`, `mgmtd`, dan `watchfrr` selalu jalan.
- Image `containerlab-10.7.1` menambahkan sshd, user `admin` yang login langsung ke `vtysh`, dan menghapus rute default dari jaringan manajemen agar tidak ikut teredistribusi ke IGP.
- Nama interface FRR adalah `eth1`, `eth2`, dan seterusnya (`eth0` untuk manajemen). Di SR Linux, `e1-1` pada berkas topologi berarti `ethernet-1/1`.
- Alamat manajemen statis (`mgmt-ipv4`) membuat inventaris Nornir bisa diturunkan dari NetBox secara deterministik.

**TUGAS:**

```bash
sudo containerlab deploy -t topology/netdevops.clab.yml
sudo containerlab inspect -t topology/netdevops.clab.yml
```

**VERIFIKASI:** jaringan memang masih kosong.

```bash
docker exec clab-netdevops-r1 vtysh -c "show ip route"
# hanya rute connected jaringan manajemen; belum ada OSPF

docker exec clab-netdevops-h1 ping -c 2 -W 1 10.20.20.10
# gagal: belum ada routing antara LAN pengguna dan LAN server

ssh root@clab-netdevops-r1 'vtysh -c "show version"'
# harus masuk TANPA kata sandi; inilah jalur yang dipakai Nornir

docker exec -it clab-netdevops-sw1 sr_cli
# di prompt SR Linux:  show interface brief   lalu  quit
```

**KRITERIA SUKSES:** 13 node berstatus running, ping h1 ke srv1 gagal, SSH ke `root@clab-netdevops-r1` berhasil dengan kunci.

> [!WARNING]
> Bila SSH meminta kata sandi, containerlab tidak menemukan kunci publik Anda saat deploy. Buat kunci dulu (Langkah 0), lalu `sudo containerlab deploy -t topology/netdevops.clab.yml --reconfigure`.

---

## 4. Langkah 2: NetBox sebagai Source of Truth

Modul `15-otomasi/04-ansible-cicd` menjelaskan mengapa NetBox menyimpan **niat** (apa yang seharusnya), bukan keadaan. Di langkah ini Anda mengisinya lewat API, bukan lewat klik, karena SoT yang diisi dengan tangan akan cepat berbeda dari dokumentasinya sendiri.

### Menjalankan NetBox

```bash
git clone -b release https://github.com/netbox-community/netbox-docker.git ~/netbox-docker
cp ~/netdevops/netbox/docker-compose.override.yml ~/netbox-docker/
cd ~/netbox-docker
docker compose pull
docker compose up -d
docker compose ps          # tunggu sampai service netbox berstatus healthy
```

Override lab membuka port 8000 dan membuat superuser beserta **token API v2**. Sejak NetBox v4.5 ada dua versi token. Token v2 di-hash dengan "pepper" di server sehingga teks aslinya tidak pernah tersimpan, dan dikirim dengan header `Authorization: Bearer nbt_<key>.<token>`. Token v1 (`Authorization: Token ...`) sudah usang sejak v4.6 dan dijadwalkan dihapus di NetBox v5.0. pynetbox 7.9 mengenali format v2 dari awalan `nbt_`.

```bash
export NETBOX_URL=http://localhost:8000
export NETBOX_TOKEN=nbt_lab08netdev0.0123456789abcdefghijABCDEFGHIJ0123456789
curl -s -H "Authorization: Bearer $NETBOX_TOKEN" -H "Accept: application/json" \
  "$NETBOX_URL/api/status/" | python3 -m json.tool | head -20
```

> [!WARNING]
> Sandi dan token di berkas override hanya untuk lab yang tidak terjangkau dari luar mesin Anda. Untuk NetBox sungguhan, buat token per aplikasi, aktifkan pembatasan IP klien, dan matikan opsi "write enabled" untuk token yang hanya membaca (misalnya token yang dipakai CI untuk render).

### Mengisi data

```bash
cd ~/netdevops
python scripts/seed_netbox.py
python scripts/seed_netbox.py      # jalankan lagi: harus "0 objek baru"
```

Skrip ini membuat site, peran prefix, prefix, tipe perangkat, peran perangkat, platform, perangkat, interface, alamat IP, kabel, dan sebuah custom field `ospf_cost` pada interface. Setiap objek dicari dulu sebelum dibuat, jadi skrip ini **idempoten**: menyatakan keadaan akhir, bukan urutan langkah. Ini prinsip yang sama dengan deploy konfigurasi perangkat nanti.

### Model data: apa disimpan di mana

| Jenis informasi | Contoh | Disimpan di | Alasan |
|---|---|---|---|
| Inventaris dan IPAM | perangkat, interface, alamat, kabel, prefix | NetBox | dibagi banyak tim dan alat, punya API dan riwayat perubahan |
| Parameter per objek | biaya OSPF per interface | NetBox (custom field) | melekat pada objeknya |
| Kebijakan | siapa boleh SSH ke srv1 | Git (`policy/`) | harus lewat review dan diuji Batfish |
| Cara menjangkau perangkat | user, metode koneksi | Git (`nornir/groups.yaml`) | bukan data jaringan |
| Rahasia | sandi, token | variabel lingkungan atau secret CI | tidak boleh masuk Git |

Dalam desain lab ini, peran prefix di IPAM menentukan fungsi interface. `sotlib.py` mencari prefix paling spesifik yang memuat alamat interface (seperti longest prefix match), lalu:

- prefix berperan `loopback` → interface masuk OSPF dan menjadi sumber router-id,
- prefix berperan `p2p` → interface OSPF point-to-point dengan biaya dari `ospf_cost`,
- prefix berperan `users`, `noc`, atau `servers` → LAN, diumumkan ke OSPF lewat redistribusi terkendali,
- alamat yang tidak berada di prefix mana pun → render ditolak.

Dengan aturan ini, data yang tidak konsisten (alamat di luar IPAM, IP ganda) tertangkap sebelum menjadi konfigurasi.

**VERIFIKASI:** buka `http://localhost:8000` (admin / sandi di berkas override). Periksa IPAM → Prefixes (enam prefix dengan perannya), perangkat r3 beserta interface dan IP-nya, dan tombol Trace pada interface `r3 eth3`, yang harus berakhir di `sw1 ethernet-1/1`.

**KRITERIA SUKSES:** sembilan perangkat terdaftar, setiap perangkat punya primary IPv4 di 172.30.30.0/24, dan menjalankan `seed_netbox.py` kedua kali tidak membuat objek baru.

---

## 5. Langkah 3: Dari Data ke Konfigurasi dengan Jinja2

`render.py` membaca NetBox, membangun **model niat** yang sudah diklasifikasi, lalu merender template. Potongan model niat untuk r3 (`build/intent.json`):

```json
{
  "description": "ke r1 eth2",
  "enabled": true,
  "ip": "10.0.0.3/31",
  "kind": "p2p",
  "name": "eth1",
  "ospf_cost": 10,
  "peer": "r1:eth2"
}
```

Deskripsi interface tidak diketik siapa pun: ia diturunkan dari kabel di NetBox. Bila kabel dipindah di NetBox, deskripsi di router ikut berubah pada render berikutnya.

Potongan template `templates/frr.conf.j2`:

```jinja2
frr version {{ frr_version }}
frr defaults traditional
hostname {{ dev.name }}
log stdout
service integrated-vtysh-config
!
{% for i in dev.interfaces if i.kind in ("loopback", "p2p", "lan") %}
interface {{ i.name }}
{% if i.description %}
 description {{ i.description }}
{% endif %}
 ip address {{ i.ip }}
{% if i.kind in ("loopback", "p2p") %}
 ip ospf area {{ ospf.area }}
{% endif %}
{% if i.kind == "p2p" %}
 ip ospf network point-to-point
 ip ospf cost {{ i.ospf_cost }}
{% endif %}
!
{% endfor %}
router ospf
 ospf router-id {{ dev.router_id }}
 log-adjacency-changes
{% if dev.lan_prefixes %}
 redistribute connected route-map RM-CONNECTED-KE-OSPF
{% endif %}
```

Mengapa LAN diredistribusi, bukan dimasukkan ke OSPF sebagai interface pasif? FRR modern memakai `ip ospf passive` per interface, tetapi parser FRR di Batfish belum mengenal baris itu. Bila dipakai, Batfish akan menganggap interface LAN aktif OSPF dan melaporkan baris tak dikenal. Redistribusi lewat `route-map` yang hanya meloloskan prefix LAN dimodelkan penuh oleh Batfish, dan secara operasional sama amannya karena interface LAN tidak pernah mengirim hello OSPF ke host. Ini contoh nyata bagaimana kemampuan alat verifikasi ikut membentuk desain konfigurasi.

**TUGAS:**

```bash
python scripts/render.py            # sumber: NetBox
git status                          # seharusnya bersih: NetBox = seed
python scripts/render.py --check    # mode CI: bandingkan saja
```

Hasil untuk r3 (`build/configs/r3.frr.conf`, dipotong):

```
frr version 10.7.1
frr defaults traditional
hostname r3
log stdout
service integrated-vtysh-config
!
interface eth1
 description ke r1 eth2
 ip address 10.0.0.3/31
 ip ospf area 0
 ip ospf network point-to-point
 ip ospf cost 10
!
interface eth3
 description ke sw1 ethernet-1/1
 ip address 10.10.10.1/24
!
router ospf
 ospf router-id 10.255.0.3
 log-adjacency-changes
 redistribute connected route-map RM-CONNECTED-KE-OSPF
!
ip prefix-list PL-LAN seq 10 permit 10.10.10.0/24
ip prefix-list PL-LAN seq 20 permit 10.99.0.0/24
!
route-map RM-CONNECTED-KE-OSPF permit 10
 match ip address prefix-list PL-LAN
!
```

`render.py` menghasilkan tiga keluaran dari satu model niat: konfigurasi untuk deploy (`build/configs/`), snapshot untuk Batfish (`build/batfish/`), dan inventaris Nornir (`build/inventory/hosts.yaml`). Karena ketiganya berasal dari model yang sama, yang diuji Batfish adalah persis yang akan di-deploy.

Snapshot Batfish untuk router memakai format "Cumulus concatenated": baris pertama hostname, lalu bagian `/etc/network/interfaces`, penanda `# ports.conf --`, kemudian isi `frr.conf` yang dimulai dengan `frr version`. Batfish memakai baris `frr version` sebagai penanda awal bagian FRR, itulah sebabnya template wajib dimulai dengan baris tersebut. Host dimodelkan sebagai berkas JSON (`build/batfish/hosts/*.json`) beserta aturan iptables srv1.

**VERIFIKASI:** ubah biaya OSPF `r2 eth2` menjadi 30 di UI NetBox (Interfaces → r2 eth2 → Edit → OSPF cost), render ulang, lihat diff:

```bash
python scripts/render.py && git diff --stat
git diff build/configs/r2.frr.conf
```

Diff harus menunjukkan satu baris `ip ospf cost` di `r2.frr.conf`, satu baris yang sama di `build/batfish/configs/r2.cfg`, dan satu nilai di `intent.json`. Kembalikan nilainya ke 20 di NetBox, render lagi, dan `git status` harus bersih.

**KRITERIA SUKSES:** `render.py --check` mencetak `OK: build/ sesuai dengan source of truth`, dan Anda bisa menjelaskan mengapa satu perubahan di NetBox menghasilkan tepat tiga baris diff.

> [!TIP]
> Render harus **deterministik**: urutan perangkat, interface, dan kunci JSON selalu sama. Tanpa itu, setiap render menghasilkan diff palsu dan reviewer berhenti membaca diff. `tests/test_offline.py::test_render_deterministik` menjaga sifat ini.

---

## 6. Langkah 4: Verifikasi Pra-Deploy dengan Batfish

### Mengapa "ping setelah ubah" tidak cukup

Kebiasaan lama setelah mengubah jaringan adalah ping beberapa alamat lalu menyatakan "aman". Ada tiga masalah mendasar dengan cara itu.

**Ruang yang diuji terlalu kecil.** Satu ping adalah satu titik di ruang header paket. Untuk IPv4 saja, kombinasi alamat sumber (2^32), alamat tujuan (2^32), protokol (2^8), port sumber (2^16), dan port tujuan (2^16) adalah 2^104, sekitar 2 × 10^31 kemungkinan paket. Seratus ping, seribu, sejuta: semuanya mendekati nol dibanding ruang itu. Aturan ACL yang membuka SSH untuk satu /24 yang salah tidak akan terlihat dari ping ICMP.

**Hanya keadaan saat ini yang diuji.** Ping dijalankan saat semua link hidup. Bila perubahan Anda diam-diam menghapus jalur cadangan, ping tetap sukses hari ini dan jaringan baru putus minggu depan ketika link utama gagal. Lab ini punya skenario persis seperti itu (Langkah 8, skenario A).

**Ping baru bisa dilakukan setelah perubahan diterapkan.** Artinya ia menemukan masalah sesudah pengguna merasakannya.

Edsger Dijkstra merumuskannya untuk perangkat lunak: pengujian bisa menunjukkan adanya bug, tetapi tidak bisa menunjukkan ketiadaannya. **Verifikasi** mencoba menjawab pertanyaan untuk *semua* masukan sekaligus dengan menalar model sistem, bukan dengan mencoba satu per satu.

Riset verifikasi jaringan berkembang dalam dua gelombang:

1. **Verifikasi data plane** memeriksa tabel forwarding dan ACL yang sudah ada. Header Space Analysis (Kazemian dkk., NSDI 2012) memodelkan setiap perangkat sebagai fungsi yang mengubah himpunan header, sehingga pertanyaan "paket mana dari A bisa sampai ke B" dijawab untuk seluruh himpunan sekaligus. Kelemahannya, ia butuh keadaan forwarding yang sudah terjadi.
2. **Verifikasi control plane** memprediksi data plane langsung dari konfigurasi, sebelum apa pun diterapkan. Batfish (Fogel dkk., NSDI 2015) mem-parse konfigurasi, mensimulasikan protokol routing sampai stabil, lalu menghasilkan data plane untuk dianalisis. Minesweeper (Beckett dkk., SIGCOMM 2017) mengodekan control plane sebagai formula logika agar properti bisa dibuktikan untuk banyak kondisi kegagalan.

Cara kerja Batfish secara ringkas:

```
konfigurasi vendor ──parse──► model vendor ──konversi──► model netral vendor
        ──simulasi OSPF/BGP/statik sampai titik tetap──► RIB dan FIB setiap node
        ──+ ACL/firewall──► data plane ──kueri simbolik (BDD)──► jawaban untuk SEMUA paket
```

Kueri reachability dijawab dengan Binary Decision Diagram: himpunan paket direpresentasikan secara simbolik, sehingga "apakah ada paket dari luar NOC yang diizinkan SSH ke srv1" dijawab tuntas, lengkap dengan contoh paket bila jawabannya "ada". Makalah "Lessons from the evolution of the Batfish configuration analysis tool" (SIGCOMM 2023) menceritakan perjalanan desain ini dari pengalaman memakainya di jaringan produksi.

### Batas model: apa yang TIDAK diketahui Batfish di lab ini

Verifikasi hanya sebaik modelnya. Jujurlah terhadap batas-batas ini, karena di situlah post-check dan telemetri masih dibutuhkan:

- **Baris yang tidak dikenali.** Batfish belum mengenal `log stdout`. Uji `test_semua_konfigurasi_terbaca` memakai daftar izin eksplisit (`ALLOWED_UNRECOGNIZED`) untuk baris yang diketahui aman. Setiap tambahan ke daftar itu mengurangi apa yang diuji, jadi wajib lewat review.
- **Perangkat yang tidak dimodelkan.** SR Linux tidak dimodelkan sama sekali. Batfish menyimpulkan bahwa `r3 eth3` dan `h1 eth1` bertetangga karena satu subnet. Bila mac-vrf di sw1 salah konfigurasi, Batfish tidak akan tahu; post-check dan telemetri yang akan tahu.
- **Model host iptables terbatas.** Parser iptables Batfish hanya mengenal `-p`, `-s`, `-d`, `--dport` tunggal, `--sport`, `-i`, `-o`, `-m tcp`, serta aksi ACCEPT dan DROP. Pada model host, kecocokan `-i`/`-o` diabaikan saat filter dipasang, sehingga aturan `-i lo -j ACCEPT` dimodelkan sebagai "terima semua". Karena itu `templates/iptables.j2` tidak pernah memakai `-i`. Aturan UDP dengan `-m udp` juga akan gagal di-parse.
- **Tidak ada waktu.** Batfish menghitung keadaan stabil. Konvergensi, microloop sesaat, bug perangkat lunak, dan kerusakan perangkat keras di luar jangkauannya.

### Menjalankan Batfish dan uji

```bash
docker run -d --name batfish -p 9996:9996 batfish/batfish:latest
python scripts/wait_batfish.py
pytest -v tests/test_batfish.py
```

Setiap uji adalah satu janji jaringan yang ditulis sebagai kode:

| Uji | Janji | Pertanyaan Batfish |
|---|---|---|
| `test_semua_konfigurasi_terbaca` | semua berkas ter-parse, tidak ada baris asing di luar daftar izin | `fileParseStatus`, `parseWarning` |
| `test_tidak_ada_referensi_tak_terdefinisi` | tidak ada route-map yang memanggil prefix-list hantu | `undefinedReferences` |
| `test_router_id_unik` | tidak ada router-id ganda | `assert_no_duplicate_router_ids` |
| `test_semua_adjacency_ospf_terbentuk` | setiap link p2p di SoT menghasilkan adjacency OSPF | `ospfEdges` dibanding model niat |
| `test_sesi_ospf_kompatibel` | parameter OSPF kedua ujung cocok | `ospfSessionCompatibility` |
| `test_tanpa_forwarding_loop` | tidak ada loop forwarding | `detectLoops` |
| `test_pengguna_bisa_membuka_web` | h1 ke srv1 HTTP dan HTTPS sukses | `reachability` |
| `test_pengguna_tidak_bisa_ssh_ke_server` | h1 ke srv1 SSH gagal | `reachability` |
| `test_noc_bisa_ssh_ke_server` | noc1 ke srv1 SSH sukses | `reachability` |
| `test_firewall_ssh_hanya_dari_noc` | tak satu pun alamat di luar NOC diizinkan SSH oleh filter srv1 | `searchFilters` |
| `test_firewall_tanpa_aturan_mati` | tidak ada aturan firewall yang tertutup aturan di atasnya | `filterLineReachability` |
| `test_web_tetap_jalan_bila_satu_router_inti_mati` | web tetap jalan bila r1 atau r2 mati | `fork_snapshot` + `reachability` |
| `test_tidak_ada_reachability_yang_hilang` | perubahan tidak menghilangkan flow yang tadinya sukses | `differentialReachability` |

Perhatikan perbedaan antara `test_pengguna_tidak_bisa_ssh_ke_server` dan `test_firewall_ssh_hanya_dari_noc`. Yang pertama menguji satu sumber (h1), mirip ping. Yang kedua menguji semua alamat sumber di luar prefix NOC (`0.0.0.0/0 \ 10.99.0.0/24`) terhadap filter srv1. Itulah lompatan dari pengujian ke verifikasi.

Bentuk keluaran yang diharapkan (dipotong):

```
tests/test_batfish.py::test_semua_konfigurasi_terbaca PASSED
tests/test_batfish.py::test_semua_adjacency_ospf_terbentuk PASSED
tests/test_batfish.py::test_firewall_ssh_hanya_dari_noc PASSED
tests/test_batfish.py::test_web_tetap_jalan_bila_satu_router_inti_mati[r1] PASSED
tests/test_batfish.py::test_web_tetap_jalan_bila_satu_router_inti_mati[r2] PASSED
tests/test_batfish.py::test_tidak_ada_reachability_yang_hilang SKIPPED (BF_BASELINE tidak di-set)
```

### Menjelajah secara interaktif

Uji otomatis menjaga janji, tetapi saat menyelidiki Anda akan sering bertanya langsung:

```python
from pybatfish.client.session import Session
from pybatfish.datamodel import HeaderConstraints

bf = Session(host="localhost")
bf.set_network("netdevops-lab")
bf.init_snapshot("build/batfish", name="candidate", overwrite=True)

hc = HeaderConstraints(dstIps="10.20.20.10", applications=["https"])
tr = bf.q.traceroute(startLocation="h1", headers=hc).answer().frame()
print(tr.Traces[0][0])          # jalur hop demi hop: h1 → r3 → r1 → r4 → srv1

bf.fork_snapshot("candidate", "tanpa-r1", deactivate_nodes=["r1"], overwrite=True)
tr = bf.q.traceroute(startLocation="h1", headers=hc).answer(snapshot="tanpa-r1").frame()
print(tr.Traces[0][0])          # jalur cadangan: h1 → r3 → r2 → r4 → srv1
```

**KRITERIA SUKSES:** semua uji Batfish lulus (uji differential boleh di-skip), dan Anda bisa menunjukkan jalur utama serta jalur cadangan h1 ke srv1 tanpa menyentuh satu perangkat pun.

---

## 7. Langkah 5: Deploy dengan Nornir

### Satu kerangka, tiga mesin

Nornir memberi inventaris, konkurensi, filter, dan hasil terstruktur. Pekerjaan per perangkat dilakukan "mesin" yang cocok untuk platformnya, dan setiap mesin harus bisa melakukan empat hal: membaca keadaan, menghitung diff, menerapkan, dan mengembalikan.

| Platform | Koneksi | Diff | Terapkan | Rollback |
|---|---|---|---|---|
| FRR | netmiko, SSH sebagai `root` (kunci) | `frr-reload.py --test` | `frr-reload.py --reload`, lalu `write memory` | muat ulang running-config cadangan dengan `frr-reload.py` |
| SR Linux | napalm-srlinux, JSON-RPC | `compare_config()` | `commit_config()` (driver membuat checkpoint dulu) | `rollback()` ke checkpoint |
| Host Linux (srv1) | `docker exec` | diff iptables-save vs kandidat | `iptables-restore` | `iptables-restore` cadangan |

Beberapa detail yang membuat ini aman:

- `frr-reload.py` adalah alat bawaan FRR yang membandingkan konfigurasi kandidat dengan running-config dan hanya mengirim perintah selisihnya. Sebelum apa pun diterapkan, kandidat divalidasi oleh `vtysh`; kandidat bersintaks salah ditolak tanpa mengubah router.
- Cadangan running-config diambil sebelum perubahan dan disimpan di `build/backups/<waktu>/` (diabaikan Git).
- napalm-srlinux mengemulasikan kandidat di sisi klien karena JSON-RPC SR Linux tidak punya datastore kandidat yang bertahan antar-permintaan. Konfigurasi SR Linux dimuat sebagai **merge**: menambah dan mengubah, tetapi tidak menghapus yang tidak disebut.
- `docker exec` untuk srv1 adalah jalan pintas lab. Di produksi, server biasanya dikelola tim sistem dengan alat mereka sendiri; yang penting adalah kebijakan firewall tetap berasal dari Git dan diuji Batfish.

### Canary, post-check, dan rollback

`deploy.py` menjalankan urutan berikut:

1. **Pre-check**: catat pemeriksaan mana yang sudah gagal sebelum deploy.
2. **Tahap canary** (bawaan r4): terapkan ke satu perangkat, jalankan post-check. Bila ada pemeriksaan yang tadinya lulus lalu gagal (**regresi**), rollback dan berhenti.
3. **Tahap sisanya**: terapkan ke semua perangkat lain, post-check lagi dengan aturan yang sama.
4. Bila di akhir masih ada pemeriksaan gagal yang sudah gagal sejak pre-check, deploy tidak di-rollback (rollback tidak akan menolong) dan keluar dengan kode 5 agar manusia menyelidiki.

Post-check tidak dijalankan sekali saja. Ia diulang setiap 5 detik sampai syaratnya terpenuhi atau batas `--settle` habis (bawaan 90 detik), karena OSPF butuh waktu untuk bertukar hello, membentuk adjacency, dan menyinkronkan LSDB. Memeriksa sekali tepat setelah commit akan membuat perubahan yang sah pun tampak seperti regresi sesaat, lalu di-rollback tanpa alasan.

Post-check memeriksa jumlah tetangga OSPF berstatus Full per router (dihitung dari model niat), keberadaan semua loopback dan prefix LAN di tabel routing setiap router, status port SR Linux, dan probe layanan dari sudut pandang pengguna: h1 ke srv1 port 80 dan 443 harus terbuka, h1 ke port 22 harus tertutup, noc1 ke port 22 harus terbuka. Probe ini sengaja sejajar dengan uji Batfish: Batfish membuktikan untuk semua paket, probe memastikan perangkat nyata setuju dengan model.

| Kode keluar | Arti |
|---|---|
| 0 | sukses |
| 2 | deploy gagal di sebuah perangkat (perangkat yang sudah berubah di-rollback) |
| 3 | post-check menemukan regresi (sudah di-rollback) |
| 4 | dry-run dengan `--fail-on-diff` menemukan drift |
| 5 | masih ada masalah, tetapi masalah itu sudah ada sebelum deploy |

**TUGAS:**

```bash
python scripts/deploy.py --dry-run     # rencana: diff per perangkat, tidak ada yang berubah
python scripts/deploy.py               # terapkan: pre-check, canary r4, post-check, sisanya
```

Pada deploy pertama, pre-check memang gagal hampir di semua butir (jaringan masih kosong). Itu bukan regresi, jadi tidak memicu rollback. Bentuk keluaran yang diharapkan (dipotong):

```
>>> PRE-CHECK
  [GAGAL] r1:ospf-full: 0/3 tetangga Full
  [GAGAL] r1:route 10.20.20.0/24: HILANG
  [OK ] svc:h1->srv1:22: tertutup (harus tertutup)
  ...
>>> TAHAP CANARY: r4 (terapkan)

=== r4: BERUBAH
+ interface eth1
+  description ke r1 eth3
...
>>> POST-CHECK setelah tahap canary
  [LAMA] r1:ospf-full: 0/3 tetangga Full
  ...
>>> TAHAP SISANYA: r1, r2, r3, srv1, sw1, sw2 (terapkan)
...
>>> POST-CHECK setelah tahap sisanya
  [OK ] r1:ospf-full: 3/3 tetangga Full
  [OK ] r3:route 10.20.20.0/24: ada
  [OK ] sw1:ethernet-1/2 up: up
  [OK ] svc:h1->srv1:80: terbuka (harus terbuka)
  [OK ] svc:h1->srv1:22: tertutup (harus tertutup)
  [OK ] svc:noc1->srv1:22: terbuka (harus terbuka)

Selesai tanpa masalah.
```

Laporan lengkap tiap deploy (diff, hasil pemeriksaan, kode keluar) tersimpan di `build/reports/deploy-<waktu>.json`.

**VERIFIKASI di perangkat:**

```bash
docker exec clab-netdevops-r3 vtysh -c "show ip ospf neighbor"
# dua tetangga: 10.255.0.1 lewat eth1, 10.255.0.2 lewat eth2, keduanya Full

docker exec clab-netdevops-r1 vtysh -c "show ip route ospf"
# 10.10.10.0/24, 10.99.0.0/24, 10.20.20.0/24 sebagai rute eksternal OSPF (hasil redistribusi)

docker exec -it clab-netdevops-sw2 sr_cli
#   show network-instance lan bridge-table mac-table all
#   (MAC r4 eth3 dan srv1 eth1 terpelajari di mac-vrf "lan")

docker exec clab-netdevops-h1 mtr -n -r -c 1 10.20.20.10
# hop: 10.10.10.1 → 10.0.0.2 → 10.0.0.5 → 10.20.20.10   (r3 → r1 → r4 → srv1)

docker exec clab-netdevops-h1 curl -s -o /dev/null -w "%{http_code}\n" http://10.20.20.10/
docker exec clab-netdevops-srv1 iptables -S INPUT
```

Jalur dari `mtr` harus sama dengan jalur yang Anda lihat di traceroute Batfish pada Langkah 4; artinya model dan perangkat sepakat.

**Uji idempoten:**

```bash
python scripts/deploy.py --dry-run --fail-on-diff
```

Seharusnya semua perangkat berstatus "tetap" dan kode keluar 0. Bila satu baris FRR terus muncul di diff pada setiap jalan (misalnya karena FRR menulis ulang perintah ke bentuk kanoniknya), sesuaikan template agar menulis bentuk yang sama dengan `show running-config`. Alat tidak membuat deploy idempoten dengan sendirinya: template harus ditulis dengan disiplin.

**KRITERIA SUKSES:** deploy keluar dengan kode 0, `mtr` menunjukkan jalur via r1, dry-run berikutnya tidak menunjukkan perubahan.

---

## 8. Langkah 6: Streaming Telemetry dengan gnmic, Prometheus, dan Grafana

### SNMP polling dibanding gNMI streaming

Modul `14-monitoring-troubleshooting/03-observability` dan `15-otomasi/02-data-dan-api` sudah memperkenalkan keduanya. Di sini Anda mengukur perbedaannya pada port yang sama, pada switch yang sama, pada waktu yang sama.

| Aspek | SNMP polling | gNMI streaming |
|---|---|---|
| Arah | pull: kolektor bertanya, perangkat menjawab | push: perangkat mengirim sesuai langganan |
| Transport | UDP 161 | gRPC di atas HTTP/2 dan TCP, biasanya TLS |
| Model data | MIB (SMI), mis. IF-MIB RFC 2863 dengan penghitung 64 bit `ifHCInOctets` | YANG (model native atau OpenConfig) |
| Encoding | ASN.1 BER | Protobuf atau JSON |
| Mode | interval polling | `sample` (berkala), `on-change` (saat berubah), `target-defined` |
| Beban | setiap poll memicu kerja di control plane perangkat | perangkat mengirim data yang sudah ia kumpulkan |
| Keamanan | v2c: community teks polos; v3: autentikasi dan enkripsi | TLS dan autentikasi pengguna |

Di lab ini job `snmp` Prometheus menarik IF-MIB lewat `snmp_exporter` setiap 30 detik, sedangkan SR Linux mendorong statistik interface ke gnmic setiap 5 detik. Default containerlab untuk SR Linux sudah menyalakan SNMPv2c (community `public`) dan server gNMI di jaringan manajemen, jadi tidak ada konfigurasi tambahan di switch.

### Mencoba gnmic langsung

```bash
G='docker exec -it clab-netdevops-gnmic gnmic -a 172.30.30.21:57400 -u admin -p NokiaSrl1! --skip-verify'

$G capabilities | head -20
$G get --path "/interface[name=ethernet-1/2]/oper-state"
$G subscribe --path "/interface[name=ethernet-1/2]/oper-state" --stream-mode on-change
```

Biarkan langganan on-change berjalan. Di terminal lain, matikan port lalu nyalakan lagi:

```bash
docker exec clab-netdevops-sw1 sr_cli -edc "/interface ethernet-1/2 admin-state disable"
docker exec clab-netdevops-sw1 sr_cli -edc "/interface ethernet-1/2 admin-state enable"
```

Notifikasi `down` lalu `up` muncul seketika di terminal gnmic, tanpa menunggu interval apa pun. Untuk status, on-change unggul karena perubahan dikirim saat terjadi.

### Tumpukan telemetri

- `telemetry/gnmic.yml` berlangganan `/interface[name=ethernet-1/*]/statistics` dan `/oper-state` dari sw1 dan sw2 dengan sample 5 detik, lalu menyajikannya di `:9273/metrics`. Processor `oper-state-to-int` mengubah `up`/`down` menjadi 1/0 karena Prometheus hanya menyimpan angka. Nama metrik dibentuk dari path gNMI tanpa kunci, misalnya `interface_statistics_in_octets`, dengan label `source` (nama target) dan `interface_name`.
- `telemetry/prometheus.yml` punya dua job: `gnmic` (scrape 5 detik) dan `snmp` (30 detik, lewat snmp_exporter dengan modul `if_mib`).
- Grafana diprovisikan dari berkas: sumber data dan dashboard "Lab 08 - gNMI vs SNMP" ikut versi di Git. Ini "observability sebagai kode".

> [!WARNING]
> Status oper-state di berkas gnmic sengaja memakai `sample`, bukan `on-change`. Output Prometheus gnmic membuang metrik yang tidak diperbarui dalam jangka `expiration` (bawaan 60 detik). Status yang jarang berubah dan dikirim on-change bisa "menghilang" dari Prometheus walau port baik-baik saja.

**VERIFIKASI:** buka `http://localhost:9090/targets` (tiga job berstatus UP), lalu `http://localhost:3000` dan pilih dashboard Lab 08. Di Prometheus, coba kueri:

```
irate(interface_statistics_in_octets{source="sw2"}[30s]) * 8
irate(ifHCInOctets{source="sw2"}[2m]) * 8
```

Periksa nilai label `ifName` pada hasil kueri kedua; dashboard menganggap nilainya sama dengan nama port SR Linux (`ethernet-1/2`). Bila berbeda di versi SR Linux Anda, sesuaikan variabel `port` di dashboard.

### Eksperimen: burst lima detik

Buat berkas 10 MB di srv1, lalu dari h1 unduh berulang-ulang selama 5 detik setiap 30 detik:

```bash
docker exec clab-netdevops-srv1 dd if=/dev/zero of=/usr/share/nginx/html/10m.bin bs=1M count=10
docker exec clab-netdevops-h1 sh -c \
  'for i in 1 2 3 4; do ab -q -t 5 -c 4 http://10.20.20.10/10m.bin >/dev/null; sleep 25; done'
```

Di dashboard, pilih switch `sw2` dan port `ethernet-1/2` (port menuju srv1; data unduhan masuk ke switch dari sana). Garis gNMI menunjukkan lonjakan tajam selebar kira-kira 5 detik. Garis SNMP menunjukkan gundukan rendah yang melebar.

Hitung sendiri mengapa: misalkan burst mengalir 2 Gbit/s selama 5 detik lalu diam. Penghitung byte bertambah 2 × 5 = 10 Gbit. SNMP hanya melihat selisih penghitung per 30 detik, jadi rata-rata yang tampak adalah 10 Gbit ÷ 30 detik ≈ 333 Mbit/s, sekitar seperenam puncak sebenarnya. Dengan sample 5 detik, gNMI melihat puncak hampir utuh. Di jaringan nyata, inilah bedanya antara "utilisasi link 30%, aman" dan "link penuh berkali-kali per menit sehingga ada drop".

> [!WARNING]
> Pilihan fungsi PromQL bisa menghapus perbedaan yang ingin Anda lihat. `rate(x[30s])` menghitung rata-rata per detik selama 30 detik terakhir, sehingga burst 5 detik dari gNMI pun ikut diratakan menjadi seperenamnya. Dashboard lab ini memakai `irate()`, yang hanya memakai dua sampel terakhir, sehingga resolusi setiap garis sama dengan interval datanya. Jendela kurung siku tetap harus memuat minimal dua sampel: `[30s]` cukup untuk data 5 detik, sedangkan data 30 detik butuh `[2m]` agar tidak kosong ketika satu scrape terlambat. Untuk alarm dan laporan kapasitas, `rate()` dengan jendela panjang justru yang tepat; untuk mencari burst, pakai `irate()` atau resolusi data yang lebih tinggi.

**KRITERIA SUKSES:** dashboard menampilkan kedua garis, Anda bisa menjelaskan selisih puncaknya dengan hitungan di atas, dan grafik status port menunjukkan 0 saat port dimatikan.

---

## 9. Langkah 7: Pipeline CI dan GitOps

### GitOps dan posisi lab ini

OpenGitOps merumuskan empat prinsip: keadaan yang diinginkan dinyatakan secara **deklaratif**; disimpan dengan **versi dan tidak bisa diubah diam-diam** (riwayat lengkap); **ditarik otomatis** oleh agen; dan **terus direkonsiliasi**, yaitu agen terus membandingkan keadaan nyata dengan yang diinginkan lalu menerapkannya.

Pipeline lab ini memenuhi dua prinsip pertama sepenuhnya (`build/` di Git, setiap perubahan lewat PR). Untuk dua prinsip terakhir, lab ini memakai pola yang lebih umum di dunia jaringan: CI mendorong perubahan saat merge, dan job terjadwal mendeteksi drift. Ini pendekatan push dengan rekonsiliasi berkala, bukan agen pull murni seperti yang lazim di Kubernetes. Sadari perbedaannya agar Anda tidak mengklaim lebih dari yang dibangun.

### Isi pipeline

`.github/workflows/netdevops.yml`:

| Job | Kapan | Runner | Fungsi |
|---|---|---|---|
| `lint` | PR dan push | GitHub (ubuntu-latest) | yamllint, ruff, compileall, render dari seed, uji offline |
| `render-check` | PR dari repositori sendiri | self-hosted `netdevops-lab` | `render.py --check` terhadap NetBox: `build/` harus persis hasil render SoT |
| `batfish` | PR dan push | GitHub, Batfish sebagai service container | `pytest tests/`, baseline dari cabang tujuan untuk uji differential |
| `deploy` | push ke `main` | self-hosted, environment `lab` | dry-run, lalu deploy dengan canary, post-check, rollback |
| `drift` | terjadwal 08.00 WIB dan manual | self-hosted | `deploy.py --dry-run --fail-on-diff` terhadap `main` |

Potongan job Batfish:

```yaml
  batfish:
    needs: lint
    runs-on: ubuntu-latest
    services:
      batfish:
        image: batfish/batfish:latest
        ports:
          - 9996:9996
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - name: Siapkan snapshot baseline dari cabang tujuan
        if: github.event_name == 'pull_request'
        env:
          BASE_REF: ${{ github.base_ref }}
        run: |
          mkdir -p /tmp/baseline
          if git archive "origin/${BASE_REF}" build/batfish | tar -x -C /tmp/baseline; then
            echo "BF_BASELINE=/tmp/baseline/build/batfish" >> "$GITHUB_ENV"
          fi
      - name: Uji Batfish
        env:
          IZINKAN_REACHABILITY_HILANG: >-
            ${{ contains(github.event.pull_request.labels.*.name, 'izinkan-reachability-hilang') && '1' || '0' }}
        run: pytest -v tests/ --junitxml=build/reports/batfish.xml
```

Uji differential membandingkan snapshot PR dengan snapshot `main`. Flow yang tadinya sukses lalu gagal adalah perubahan berisiko dan menggagalkan CI, kecuali PR diberi label `izinkan-reachability-hilang`. Label itu adalah persetujuan eksplisit dan tercatat: "ya, kami memang sengaja mematikan layanan ini".

### Menyiapkan repositori

1. Buat repositori GitHub privat, lalu `git remote add origin ...` dan `git push -u origin main`.
2. Settings → Environments → buat `lab`, aktifkan **Required reviewers**. Job `deploy` akan menunggu persetujuan di sini: inilah gerbang manusia yang dibahas di `15-otomasi/04-ansible-cicd`.
3. Settings → Secrets and variables → Actions: buat `NETBOX_TOKEN` (sebaiknya token baca saja) dan `SRL_PASSWORD`.
4. Settings → Actions → Runners → New self-hosted runner. Ikuti perintah pemasangan di mesin lab, beri label `netdevops-lab`. User runner harus anggota grup `docker` dan memiliki kunci SSH yang tersalin ke node FRR (deploy ulang containerlab bila perlu).
5. Buat label `izinkan-reachability-hilang` di tab Issues → Labels.

> [!WARNING]
> Runner self-hosted punya akses ke lab dan NetBox Anda. Jangan pernah menjalankan kode dari PR fork di runner itu. Job `render-check` sudah dibatasi untuk PR dari repositori sendiri, dan `deploy` hanya berjalan pada push ke `main`. Untuk repositori publik, pertimbangkan untuk tidak memakai runner self-hosted sama sekali.

### Satu perubahan dari awal sampai akhir

Skenario: r1 akan dipelihara besok, jadi lalu lintas server harus dialihkan ke r2 tanpa memutus layanan. Caranya, naikkan biaya link r1 ke r4 dari kedua ujung.

1. Di NetBox, ubah `ospf_cost` `r1 eth3` dan `r4 eth1` menjadi 50.
2. Render dan buat PR:

```bash
git switch -c alihkan-server-ke-r2
python scripts/render.py
git diff --stat            # r1 dan r4: configs, batfish/configs, intent.json
pytest -v tests/test_batfish.py      # uji lokal dulu, lebih murah daripada CI
git commit -am "Alihkan lalu lintas srv1 lewat r2 untuk pemeliharaan r1"
git push -u origin alihkan-server-ke-r2
gh pr create --fill
```

3. CI berjalan. Uji differential seharusnya melaporkan nol flow yang hilang: jalurnya berubah, reachability-nya tidak. Reviewer membaca diff `r1.frr.conf` dan `r4.frr.conf` yang masing-masing hanya satu baris.
4. Merge. Job `deploy` menunggu persetujuan environment `lab`, lalu menjalankan dry-run dan deploy dengan canary r4.
5. Verifikasi: `docker exec clab-netdevops-h1 mtr -n -r -c 1 10.20.20.10` kini menunjukkan r2 di hop kedua dan 10.0.0.9 (r4 eth2) di hop ketiga, karena r3 ke r2 ke r4 berbiaya 40 dibanding 60 lewat r1. Alamat hop r2 bisa tampil sebagai 10.0.0.6 atau 10.0.0.1: r2 punya dua jalur berbiaya sama kembali ke LAN pengguna, dan Linux secara bawaan memakai alamat interface keluar balasan ICMP sebagai alamat sumbernya. Batfish `traceroute` memberi jawaban yang sama tanpa ambiguitas ini.

Rollback niat di GitOps cukup `git revert` commit tadi, lalu ulangi alur PR. Jangan mengubah perangkat langsung: perubahan langsung akan tertangkap job drift besok pagi.

### Padanan GitLab CI

Struktur yang sama di GitLab (ringkas):

```yaml
stages: [lint, verify, deploy]

lint:
  stage: lint
  image: python:3.12
  script:
    - pip install -r requirements.txt
    - yamllint -c .yamllint.yml .
    - ruff check scripts tests
    - pytest -q tests/test_offline.py

batfish:
  stage: verify
  image: python:3.12
  services:
    - name: batfish/batfish:latest
      alias: batfish
  variables:
    BATFISH_HOST: batfish
  script:
    - pip install -r requirements.txt
    - python scripts/wait_batfish.py
    - pytest -v tests/test_batfish.py

deploy:
  stage: deploy
  tags: [netdevops-lab]
  environment: lab
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
  script:
    - python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt
    - .venv/bin/python scripts/deploy.py
```

**KRITERIA SUKSES:** satu PR melewati `lint`, `render-check`, dan `batfish`, lalu setelah merge dan persetujuan, `deploy` sukses dan jalur h1 ke srv1 berpindah ke r2.

---

## 10. Langkah 8: Troubleshooting dan Rollback

Setiap skenario di bawah meniru kesalahan yang benar-benar terjadi di tim jaringan. Kerjakan satu per satu, dan kembalikan keadaan sebelum lanjut ke skenario berikutnya (`git checkout -- build/ policy/`, kembalikan nilai di NetBox, lalu `python scripts/render.py`).

### Skenario A: salah ketik di NetBox yang tidak terlihat oleh ping

**TUGAS:** ubah IP `r2 eth3` di NetBox dari `10.0.0.8/31` menjadi `10.0.0.10/31`. Render, lalu jalankan uji Batfish.

**Yang terjadi:** `render.py` mencetak `PERINGATAN: r2:eth3 (10.0.0.10/31) dan r4:eth2 (10.0.0.9/31) beda subnet`, tetapi tetap menulis berkas. Peringatan itu mudah terlewat di antara keluaran lain. Batfish tidak bisa dilewatkan:

- `test_semua_adjacency_ospf_terbentuk` gagal: adjacency `r2 eth3` dan `r4 eth2` tidak terbentuk.
- `test_web_tetap_jalan_bila_satu_router_inti_mati[r1]` gagal: tanpa r1, r4 hanya terhubung ke r2 lewat link yang kini rusak, sehingga srv1 terisolasi.
- Sementara itu, ping h1 ke srv1 tetap sukses karena jalur utama lewat r1 tidak tersentuh.

**Pelajaran:** inilah alasan "ping setelah ubah" tidak cukup. Kesalahan ini menghapus redundansi tanpa gejala, dan baru menjadi gangguan pada hari r1 bermasalah. Perbaiki di NetBox, bukan di berkas hasil render.

### Skenario B: aturan firewall yang terlalu longgar

**TUGAS:** di `policy/firewall.yml`, ubah aturan `ssh-noc` menjadi `from: [noc, users]` dengan alasan "supaya admin bisa kerja dari mejanya". Render dan uji.

**Yang terjadi:** `test_pengguna_tidak_bisa_ssh_ke_server` dan `test_firewall_ssh_hanya_dari_noc` gagal. Uji kedua menampilkan contoh paket yang lolos, misalnya sumber di 10.10.10.0/24 ke port 22.

**Pelajaran:** kebijakan keamanan yang ditulis sebagai uji tidak bisa dilonggarkan diam-diam. Bila memang ada kebutuhan bisnis, ubahlah ujinya di PR yang sama, sehingga reviewer melihat dengan jelas bahwa janji keamanan sedang diubah.

### Skenario C: aturan mati

**TUGAS:** tambahkan aturan `{name: web-semua, proto: tcp, ports: [80], from: any}` di awal daftar aturan srv1. Render dan uji.

**Yang terjadi:** `test_firewall_tanpa_aturan_mati` gagal. Baris port 80 untuk users, noc, dan servers tidak akan pernah cocok karena sudah tertutup aturan `web-semua` di atasnya.

**Pelajaran:** aturan mati adalah tanda kebijakan yang tidak lagi dipahami pemiliknya. Di firewall produksi dengan ratusan aturan, inilah sumber "kenapa aturan saya tidak berpengaruh?".

### Skenario D: melewati pipeline, lalu rollback otomatis

Seseorang yang terburu-buru mengedit hasil render secara langsung dan men-deploy dari laptopnya, melewati PR dan Batfish.

**TUGAS:**

```bash
sed -i 's#permit 10.20.20.0/24#permit 10.20.2.0/24#' build/configs/r4.frr.conf
python scripts/deploy.py
```

**Yang terjadi:** tahap canary menerapkan konfigurasi r4 yang prefix-list-nya salah. LAN server tidak lagi diredistribusi ke OSPF. Post-check setelah canary menemukan regresi: rute `10.20.20.0/24` hilang di r1, r2, r3, dan probe h1 serta noc1 ke srv1 tertutup. Setelah menunggu sampai batas `--settle` tanpa pemulihan, `deploy.py` melakukan rollback r4 ke running-config cadangan dan keluar dengan kode 3:

```
REGRESI: r1:route 10.20.20.0/24, r2:route 10.20.20.0/24, r3:route 10.20.20.0/24, svc:h1->srv1:443, svc:h1->srv1:80, svc:noc1->srv1:22

>>> ROLLBACK: r4
  r4: dikembalikan ke konfigurasi sebelum deploy
```

Jalankan `python scripts/postcheck.py` untuk memastikan semuanya kembali hijau, lalu `git checkout -- build/`.

**Pelajaran:** canary membatasi kerusakan ke satu perangkat dan beberapa detik. Di CI, jalan pintas ini tertutup dua kali: `render-check` menolak `build/` yang tidak sama dengan hasil render NetBox, dan Batfish akan gagal pada uji reachability. Ulangi dengan `--no-rollback` untuk berlatih memperbaiki secara manual dari cadangan di `build/backups/`.

### Skenario E: drift karena perubahan langsung di perangkat

**TUGAS:** ubah biaya OSPF langsung di r1, seolah-olah seseorang "memperbaiki sebentar" saat gangguan malam hari:

```bash
docker exec clab-netdevops-r1 vtysh -c "configure terminal" -c "interface eth2" -c "ip ospf cost 100"
python scripts/deploy.py --dry-run --fail-on-diff
echo "kode keluar: $?"
```

**Yang terjadi:** dry-run menampilkan diff `ip ospf cost 100` lawan `ip ospf cost 10` pada r1 dan keluar dengan kode 4. Biaya OSPF berlaku ke arah keluar, jadi hanya arah r1 ke r3 yang berubah: r1 kini menjangkau r3 lewat r2 (10 + 20 = 30, lebih murah dari 100). Perjalanan berangkat h1 ke srv1 tetap r3 → r1 → r4, tetapi perjalanan pulang dari r4 ke LAN pengguna kini punya dua jalur berbiaya sama 40 (r4 → r2 → r3, dan r4 → r1 → r2 → r3), keduanya melewati r2. Jalurnya menjadi **asimetris**. Firewall stateful yang hanya melihat satu arah koneksi akan menjatuhkannya, dan masalah seperti ini sulit dilacak karena ping tetap sukses.

**Perbaikan:** `python scripts/deploy.py --limit r1`. Bila perubahan itu ternyata memang diperlukan, masukkan ke NetBox dan lewatkan PR. Jangan biarkan perangkat menjadi sumber kebenaran kedua.

### Skenario F: port switch mati, siapa yang tahu duluan?

**TUGAS:** buka dashboard Grafana pada `sw1`, lalu matikan port ke h1:

```bash
docker exec clab-netdevops-sw1 sr_cli -edc "/interface ethernet-1/2 admin-state disable"
python scripts/postcheck.py
python scripts/deploy.py --dry-run --limit sw1
```

**Yang terjadi:** grafik status port gNMI turun ke 0 dalam hitungan detik. Penghitung SNMP berhenti naik, tetapi baru terlihat pada scrape 30 detik berikutnya, dan SNMP tidak memberi tahu *mengapa*. Post-check gagal pada `sw1:ethernet-1/2 up` dan probe h1. Dry-run menunjukkan diff `admin-state` di sw1 karena kandidat menyatakan `enable`.

**Perbaikan:** `python scripts/deploy.py --limit sw1` mengembalikan port sesuai niat.

**Pelajaran:** Batfish tidak melihat apa pun di skenario ini karena SR Linux tidak dimodelkan dan konfigurasi di Git tidak berubah. Kegagalan di luar model ditangkap oleh post-check dan telemetri. Itulah sebabnya Batfish, post-check, dan telemetri dipakai bersama: masing-masing menangkap kegagalan yang tidak terlihat oleh yang lain.

### Dua jenis rollback

| | Rollback perangkat | Rollback niat |
|---|---|---|
| Kapan | deploy sedang berjalan dan post-check gagal | perubahan sudah sukses di-deploy, tetapi ternyata keliru |
| Caranya | otomatis oleh `deploy.py`: checkpoint SR Linux, cadangan running-config FRR, cadangan iptables | `git revert`, lalu alur PR dan deploy biasa |
| Jejak | laporan di `build/reports/` | riwayat Git dan PR |

Rollback perangkat menyelamatkan menit-menit pertama. Rollback niat menjaga agar Git, NetBox, dan perangkat tetap mengatakan hal yang sama.

**KRITERIA SUKSES:** Anda menyelesaikan keenam skenario, dan untuk tiap skenario bisa menyebut lapisan mana (render, Batfish, canary dan post-check, drift, telemetri) yang menangkapnya lebih dulu.

---

## 11. Kesalahan Umum

- **Mengedit `build/` dengan tangan.** Perubahan itu hilang pada render berikutnya dan ditolak `render-check`. Ubah NetBox atau `policy/`, lalu render.
- **Menganggap hijau di Batfish berarti jaringan pasti benar.** Batfish hanya melihat yang dimodelkan. SR Linux, baris tak dikenal, dan perilaku perangkat lunak perangkat berada di luar modelnya.
- **Menambah baris ke `ALLOWED_UNRECOGNIZED` tanpa review.** Setiap baris yang diizinkan adalah bagian konfigurasi yang tidak lagi diverifikasi.
- **Memakai `-i`/`-o`, `multiport`, atau `conntrack` di kebijakan firewall.** Model host Batfish mengabaikan atau gagal mem-parse-nya, sehingga hasil verifikasi bisa berbeda dari perilaku nyata.
- **Merge kandidat SR Linux dan berharap konfigurasi lama terhapus.** Mode merge tidak menghapus apa pun. Penghapusan harus dinyatakan eksplisit (misalnya perintah `delete`) dan diuji.
- **Token NetBox dengan hak tulis di CI.** Render hanya perlu membaca. Pakai token baca saja dan simpan sebagai secret.
- **Menjalankan PR fork di runner self-hosted.** Kode asing mendapat akses ke lab dan rahasia Anda.
- **Salah memilih fungsi atau jendela PromQL.** Jendela yang tidak memuat dua sampel menghasilkan grafik kosong yang disangka gangguan, sedangkan `rate()` dengan jendela panjang meratakan burst sehingga resolusi telemetri yang mahal terbuang.
- **Langganan on-change dengan output Prometheus tanpa memahami `expiration`.** Metrik status menghilang setelah 60 detik tanpa perubahan.
- **Menyamakan "tidak ada diff" dengan "jaringan sehat".** Drift check membandingkan konfigurasi, bukan perilaku. Port bisa mati karena kabel tanpa ada satu baris konfigurasi pun yang berubah.
- **Post-check sekali tembak tepat setelah commit.** Protokol routing belum konvergen, sehingga perubahan yang benar terlihat gagal. Beri jendela stabilisasi, tetapi tetap berbatas waktu.
- **Melewati canary pada perubahan rutin.** `--canary none` hanya wajar untuk pembangunan awal di lab. Di produksi, pilih canary dengan dampak paling kecil.

---

## 12. Konteks Indonesia

- **MikroTik di luar jangkauan Batfish.** Banyak jaringan di Indonesia, dari RT-RW-Net sampai ISP regional, berjalan di RouterOS. Daftar format yang dikenal Batfish tidak memuat RouterOS, jadi verifikasi pra-deploy seperti di Langkah 4 belum bisa dilakukan untuk perangkat MikroTik. Bagian lain alur ini tetap berlaku: NetBox sebagai SoT, template Jinja2 yang menghasilkan skrip RouterOS, deploy lewat Nornir dan Netmiko (`mikrotik_routeros`) dengan export konfigurasi sebelum dan sesudah sebagai cadangan, post-check fungsional, dan pemantauan lewat SNMP. Lihat `19-mikrotik/07-monitoring-scripting` untuk sisi RouterOS.
- **Bandwidth dan image besar.** Image SR Linux, NetBox, dan Batfish berukuran besar. Untuk kelas atau lab kampus, tarik sekali lalu bagikan lewat registry lokal atau `docker save`/`docker load`, daripada setiap peserta mengunduh dari internet.
- **Data inventaris tetap di dalam.** NetBox self-hosted menyimpan data inventaris dan alamat jaringan di infrastruktur Anda sendiri. Bagi organisasi yang terikat kebijakan internal atau regulasi penempatan data seperti PP 71/2019 (lihat `16-datacenter-cloud-sdn/04-cloud-networking`), ini lebih mudah dipertanggungjawabkan daripada spreadsheet di layanan awan publik.
- **Portofolio.** Repositori lab ini, lengkap dengan riwayat PR, laporan CI, dan dashboard, adalah bukti kerja yang jauh lebih kuat daripada daftar sertifikat. Susun sesuai panduan di `18-karier-sertifikasi/04-portofolio-interview`.
- **Bekal proyek akhir.** Babak `20-proyek-akhir/08-babak-7-kode-yang-menjaga` meminta source of truth, compliance as code, CI, dan observability sebagai kode. Semua keterampilan itu sudah Anda latih di sini.

---

## 13. Lisensi Kode dan Atribusi

- Kode orisinal lab ini (skrip, template, topologi, konfigurasi, workflow) berlisensi MIT, hak cipta Kontributor Belajar Networking, dengan header `SPDX-License-Identifier: MIT` di setiap berkas.
- `telemetry/gnmic.yml` diadaptasi dari `configs/gnmic/gnmic-config.yml` di srl-labs/srl-telemetry-lab (hak cipta Nokia, BSD-3-Clause). Header asli dipertahankan, perubahan dicatat di berkas, dan teks lisensinya ada di `LICENSES/BSD-3-Clause-Nokia.txt`.
- Pola relabel job `snmp` di `telemetry/prometheus.yml` mengikuti contoh di README prometheus/snmp_exporter (Apache-2.0).
- Alat yang dipakai (containerlab BSD-3-Clause, Batfish dan pybatfish Apache-2.0, NetBox Apache-2.0, Nornir Apache-2.0, FRR GPL-2.0) tidak disalin ke repositori; image container ditarik dari sumber resminya. Image SR Linux tunduk pada EULA Nokia dan tidak boleh didistribusikan ulang.

---

## 14. Ringkasan

| Lapisan | Alat | Menjawab pertanyaan |
|---|---|---|
| Sumber kebenaran | NetBox + `policy/` di Git | Seperti apa jaringan yang kita *maksud*? |
| Generasi | Jinja2 (`render.py`) | Konfigurasi apa yang mewujudkan niat itu? |
| Verifikasi | Batfish (pytest) | Apakah konfigurasi itu memenuhi semua janji, untuk semua paket, juga saat ada kegagalan? |
| Penerapan | Nornir + netmiko / napalm-srlinux | Bagaimana menerapkannya dengan aman, sedikit demi sedikit? |
| Validasi | post-check, canary, rollback | Apakah perangkat nyata setuju dengan model? |
| Observasi | gnmic → Prometheus → Grafana | Apa yang sedang terjadi sekarang, detik demi detik? |
| Tata kelola | Git, PR, CI, environment approval, drift job | Siapa mengubah apa, kapan, dan apakah keadaan nyata masih sama dengan Git? |

Alat-alat di lab ini akan berganti. Yang perlu Anda bawa adalah kebiasaannya: niat ditulis sebagai data, perubahan ditinjau sebagai diff, janji ditulis sebagai uji, dan setiap deploy siap dibatalkan.

---

## 15. Latihan

1. CI pada sebuah PR hijau untuk semua uji kecuali `test_web_tetap_jalan_bila_satu_router_inti_mati[r1]`. Pengirim PR menunjukkan bahwa ping h1 ke srv1 di lab sukses. Apa arti kegagalan ini, dan di mana Anda mulai mencari?
2. Tim aplikasi meminta iperf3 (TCP 5201) dari LAN pengguna ke srv1 untuk uji kinerja. Berkas apa yang Anda ubah, uji apa yang sebaiknya Anda tambahkan, dan apa yang perlu diperhatikan bila mereka kemudian juga meminta uji UDP (`iperf3 -u`)?
3. `seed_netbox.py` gagal dengan galat 403 "Authentication credentials were not provided", padahal token sudah Anda salin dari berkas override. Sebutkan tiga kemungkinan penyebab dan cara memeriksanya.
4. `deploy.py` selesai dengan kode keluar 5 dan tidak melakukan rollback. Apa artinya, dan mengapa rollback dalam situasi ini justru keputusan yang salah?
5. Seorang rekan salah mengetik nama mac-vrf di template SR Linux sehingga port h1 di sw1 tidak lagi masuk ke mac-vrf `lan`. Uji Batfish hijau. Jelaskan mengapa, dan lapisan mana yang akan menangkap masalah ini.
6. Sebuah link 1 Gbit/s menerima burst 6 detik pada kecepatan penuh, lalu diam selama sisa menit itu. Berapa utilisasi yang ditampilkan SNMP dengan polling 30 detik (asumsikan burst seluruhnya jatuh di satu interval), dan berapa yang ditampilkan gNMI dengan sample 5 detik? Mana yang lebih mungkin menjelaskan keluhan "video call patah-patah"?
7. Anda harus memilih perangkat canary untuk perubahan yang menyentuh semua router. Mengapa r4 adalah pilihan yang lebih masuk akal daripada r1 di topologi ini, dan kapan pilihan itu justru salah?
8. Job drift gagal setiap pagi di perangkat yang sama dengan diff yang sama, padahal tidak ada yang mengaku mengubahnya. Sebutkan dua kemungkinan teknis dan satu kemungkinan proses, beserta tindakan untuk masing-masing.
9. Sebuah PR menaikkan biaya OSPF sehingga lalu lintas pengguna ke server pindah ke r2. Uji differential melaporkan nol flow yang hilang, jadi CI hijau. Padahal di jaringan nyata ada firewall stateful di r1 yang wajib dilewati lalu lintas ke server. Uji Batfish apa yang seharusnya ditulis agar PR ini gagal?
10. Seorang rekan menambahkan baris standar server Linux `-A INPUT -i lo -j ACCEPT` di awal `templates/iptables.j2`. Setelah itu `test_pengguna_tidak_bisa_ssh_ke_server` dan `test_firewall_ssh_hanya_dari_noc` gagal, padahal di srv1 nyata SSH dari h1 tetap tertolak. Jelaskan perbedaan ini, dan mengapa kebalikannya (aturan DROP dengan `-i`) jauh lebih berbahaya.

<details>
<summary>Jawaban</summary>

1. Jaringan saat ini berfungsi, tetapi tidak lagi tahan terhadap kegagalan r1: tanpa r1, h1 tidak bisa mencapai srv1 lewat HTTPS. Artinya jalur cadangan lewat r2 rusak, sementara jalur utama lewat r1 utuh, sehingga ping sukses. Mulai dari `test_semua_adjacency_ospf_terbentuk` dan diff PR: cari perubahan pada link r2-r3 atau r2-r4 (alamat /31 yang tidak satu subnet, interface `shutdown`, biaya, atau prefix-list LAN). Secara interaktif, jalankan `fork_snapshot` dengan `deactivate_nodes=["r1"]` lalu `traceroute` dari h1 untuk melihat di mana paket berhenti.
2. Ubah `policy/firewall.yml`, misalnya tambah `{name: iperf, proto: tcp, ports: [5201], from: [users]}`, lalu render; NetBox tidak perlu disentuh karena ini kebijakan, bukan data inventaris. Tambahkan uji positif (h1 ke srv1 TCP 5201 sukses, dengan `HeaderConstraints(ipProtocols=["tcp"], dstPorts="5201")`) dan uji negatif yang membatasi cakupannya (`searchFilters` untuk sumber di luar `users` ke port 5201 harus kosong). Untuk UDP: iperf3 mode UDP tetap membuka kanal kontrol TCP 5201, jadi yang dibutuhkan adalah aturan TCP **dan** UDP 5201. Aturan UDP dari template aman bagi Batfish karena template tidak menulis `-m udp` (iptables-save di perangkat akan menambahkannya, dan `normalize_iptables` di `tasks.py` membuangnya sebelum membandingkan). Jangan pernah menulis `-m udp` sendiri: parser iptables Batfish hanya mengenal `-m tcp`, sehingga berkas gagal di-parse dan `test_semua_konfigurasi_terbaca` gagal.
3. (a) Variabel `NETBOX_TOKEN` tidak ter-export di shell yang menjalankan skrip; periksa `echo $NETBOX_TOKEN`. (b) Superuser dan token tidak dibuat, misalnya `SKIP_SUPERUSER` masih `true`, override tidak tersalin ke direktori netbox-docker, atau database sudah berisi user `admin` dari percobaan sebelumnya sehingga pembuatan token dilewati; periksa `docker compose logs netbox` dan halaman API Tokens di UI. (c) Format token salah: token v2 harus `nbt_<key 12 karakter>.<token 40 karakter>` dan dikirim dengan `Bearer`, bukan `Token`; uji dengan `curl` ke `/api/status/` memakai header yang benar.
4. Kode 5 berarti setelah tahap terakhir masih ada pemeriksaan yang gagal, tetapi semuanya sudah gagal sejak pre-check, jadi bukan disebabkan deploy ini. Rollback hanya mengembalikan konfigurasi yang baru diterapkan; ia tidak akan memperbaiki masalah lama, dan malah bisa membatalkan perbaikan lain yang sah. Yang benar adalah menyelidiki butir yang gagal: port fisik mati, container host berhenti, atau NetBox yang menyatakan sesuatu yang belum pernah benar di lapangan.
5. Batfish tidak memodelkan SR Linux. Ia menyimpulkan adjacency L3 antara r3 dan h1 dari kesamaan subnet, dengan asumsi bahwa lapisan L2 di antaranya bekerja. Masalah ini tertangkap oleh post-check (probe h1 ke srv1 gagal, dan sebaiknya ditambah pemeriksaan bahwa port ada di mac-vrf), canary yang me-rollback sw1, serta tabel MAC kosong yang terlihat lewat `show network-instance lan bridge-table mac-table all` atau langganan gNMI bridge-table. Pelajarannya, setiap perangkat yang tidak dimodelkan butuh pemeriksaan pasca-deploy yang spesifik.
6. Burst membawa 1 × 6 = 6 Gbit. SNMP dengan interval 30 detik menampilkan 6 ÷ 30 = 0,2 Gbit/s, sekitar 20% utilisasi. Dengan sample 5 detik, hasil gNMI bergantung pada posisi burst terhadap batas sampel: misalnya 100% lalu 20% (5 detik plus 1 detik), atau 60% lalu 60% (3 detik plus 3 detik). Dalam kasus apa pun, gNMI menunjukkan link penuh atau hampir penuh, sedangkan SNMP melaporkan link "hanya 20%". Keluhan video patah-patah lebih cocok dijelaskan oleh data gNMI: saat link penuh, antrian penuh, dan paket real-time terlambat atau dibuang. Ingat juga bahwa grafik harus memakai `irate()`; `rate()` dengan jendela 30 detik akan meratakan data gNMI kembali ke sekitar 20%.
7. Kegagalan di r4 hanya memengaruhi LAN server dan pemeriksaan langsung terlihat lewat probe ke srv1, sedangkan r1 adalah inti yang membawa jalur utama semua lalu lintas. Blast radius canary harus kecil tetapi tetap representatif. Pilihan itu salah bila perubahannya justru menyangkut fungsi yang hanya ada di r1 dan r2 (misalnya biaya link inti): canary r4 tidak akan menguji apa pun yang relevan, jadi pilih salah satu router inti dan jalankan di jam sepi.
8. Teknis: (a) template tidak idempoten; FRR menulis ulang perintah ke bentuk kanonik sehingga `frr-reload.py --test` selalu melihat selisih. Bandingkan dengan `show running-config` lalu sesuaikan template. (b) Ada proses lain yang mengubah perangkat, misalnya skrip lama di cron, alat monitoring yang menulis konfigurasi, atau containerlab yang di-deploy ulang dengan konfigurasi awal. Periksa log perangkat dan riwayat perintah. Proses: seseorang rutin mengubah langsung di perangkat tanpa PR. Pastikan semua orang tahu bahwa drift akan ditimpa, sediakan jalur darurat yang cepat lewat PR, dan batasi akses tulis langsung ke perangkat.
9. Yang harus diuji adalah jalurnya, karena reachability saja tidak cukup. Misalnya `bf.q.reachability(pathConstraints=PathConstraints(startLocation="h1", transitLocations="r1"), headers=HeaderConstraints(dstIps="10.20.20.10"), actions="SUCCESS")` harus mengembalikan flow, atau sebaliknya cari flow h1 ke srv1 yang sukses *tanpa* melewati r1 (`forbiddenLocations="r1"`) dan pastikan hasilnya kosong. Kebijakan "lalu lintas server wajib melewati firewall" adalah janji tentang jalur, dan janji itu harus ditulis sebagai uji. Reachability yang sama tidak berarti kebijakannya sama.
10. Di model host Batfish, kecocokan interface (`-i`/`-o`) dicatat terpisah dan tidak ikut menjadi kondisi aturan ketika rantai INPUT dipasang sebagai filter di interface host. Akibatnya `-i lo -j ACCEPT` dimodelkan sebagai "terima semua paket", dan karena ia berada paling atas, Batfish menyimpulkan semua sumber boleh SSH ke srv1. Di perangkat nyata aturan itu hanya cocok untuk paket yang masuk lewat loopback, sehingga SSH dari h1 tetap tertolak. Kasus ini menghasilkan alarm palsu: CI merah padahal perangkat aman, menjengkelkan tetapi tidak berbahaya. Kebalikannya jauh lebih berbahaya: aturan DROP dengan `-i` akan dimodelkan sebagai "tolak semua" untuk kecocokannya, sehingga Batfish bisa menyatakan sebuah layanan tertutup padahal di perangkat terbuka lewat interface lain. Itu rasa aman palsu. Karena itu template melarang `-i`/`-o`: setiap fitur konfigurasi yang dipakai harus berada di dalam bagian yang dimodelkan alat verifikasi, atau hasil verifikasinya harus dianggap tidak berlaku. Bila srv1 memang butuh lalu lintas loopback, izinkan dengan sumber `-s 127.0.0.0/8`, yang dimodelkan dengan benar.

</details>

---

## 16. Sumber

- containerlab, kind FRRouting: https://containerlab.dev/manual/kinds/frr/
- containerlab, kind Nokia SR Linux: https://containerlab.dev/manual/kinds/srl/
- containerlab, definisi node (exec, mgmt-ipv4, binds, privileged): https://containerlab.dev/manual/nodes/
- containerlab, instalasi: https://containerlab.dev/install/
- FRR, image containerlab (README dan Dockerfile): https://github.com/FRRouting/frr/tree/master/docker/containerlab
- FRR, dokumentasi OSPFv2: https://docs.frrouting.org/en/latest/ospfd.html
- FRR, frr-reload.py: https://github.com/FRRouting/frr/blob/master/tools/frr-reload.py
- netbox-docker: https://github.com/netbox-community/netbox-docker
- NetBox REST API dan token v2: https://github.com/netbox-community/netbox/blob/main/docs/integrations/rest-api.md
- pynetbox: https://github.com/netbox-community/pynetbox
- Nornir: https://nornir.readthedocs.io/en/latest/
- nornir_napalm: https://github.com/nornir-automation/nornir_napalm
- napalm-srlinux: https://napalm.srlinux.dev/
- Netmiko: https://github.com/ktbyers/netmiko
- Batfish: https://batfish.readthedocs.io/en/latest/
- pybatfish: https://pybatfish.readthedocs.io/en/latest/
- Batfish, contoh notebook pybatfish (Apache-2.0): https://github.com/batfish/pybatfish/tree/master/jupyter_notebooks
- Fogel dkk., "A General Approach to Network Configuration Analysis", NSDI 2015: https://www.usenix.org/conference/nsdi15/technical-sessions/presentation/fogel
- Kazemian, Varghese, McKeown, "Header Space Analysis: Static Checking for Networks", NSDI 2012: https://www.usenix.org/conference/nsdi12/technical-sessions/presentation/kazemian
- Beckett dkk., "A General Approach to Network Configuration Verification", SIGCOMM 2017: https://doi.org/10.1145/3098822.3098834
- Brown dkk., "Lessons from the evolution of the Batfish configuration analysis tool", SIGCOMM 2023: https://doi.org/10.1145/3603269.3604866
- Learn SR Linux: https://learn.srlinux.dev/
- gnmic: https://gnmic.openconfig.net/
- gnmic, output Prometheus: https://gnmic.openconfig.net/user_guide/outputs/prometheus_output/
- Spesifikasi gNMI (OpenConfig): https://github.com/openconfig/reference/blob/master/rpc/gnmi/gnmi-specification.md
- srl-labs/srl-telemetry-lab (BSD-3-Clause): https://github.com/srl-labs/srl-telemetry-lab
- Prometheus snmp_exporter: https://github.com/prometheus/snmp_exporter
- RFC 2863, The Interfaces Group MIB: https://www.rfc-editor.org/rfc/rfc2863
- Grafana, provisioning: https://grafana.com/docs/grafana/latest/administration/provisioning/
- OpenGitOps, prinsip GitOps v1.0.0: https://opengitops.dev/
- GitHub Actions, environment dan deployment protection: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- GitHub Actions, runner self-hosted: https://docs.github.com/en/actions/concepts/runners/self-hosted-runners
- GitHub Actions, penggunaan aman: https://docs.github.com/en/actions/reference/security/secure-use
- GitLab CI/CD: https://docs.gitlab.com/ci/

---

**Berikutnya:** `20-proyek-akhir/01-briefing-dan-aturan`. Proyek akhir: satu studi kasus berkelanjutan yang menguji seluruh kurikulum, termasuk babak kode yang menjaga jaringan.
