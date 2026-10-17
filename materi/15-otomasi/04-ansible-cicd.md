# 15.4 Ansible, Terraform, dan CI/CD Jaringan

> **Prasyarat:** `15-otomasi/01`-`03`, `06-aplikasi/03` (YAML)
> **Tujuan:** Anda paham otomasi deklaratif dengan Ansible dan Terraform, NetBox sebagai source of truth, dan pipeline CI/CD untuk jaringan (sesuai CCNA 6.6).

---

## 1. Ansible: Otomasi Deklaratif

**Ansible** adalah alat otomasi **agentless** (tidak perlu agen di perangkat) yang memakai YAML untuk mendeskripsikan keadaan yang diinginkan.

```
Kenapa Ansible populer untuk jaringan:
  ✅ Agentless — cukup SSH/API, tidak perlu instal apa pun di perangkat
  ✅ Deklaratif — jelaskan "apa", bukan "bagaimana"
  ✅ Idempoten — jalankan berkali-kali, hasil sama
  ✅ YAML — mudah dibaca, tidak perlu ahli pemrograman
  ✅ Modul jaringan luas (Cisco, Juniper, Arista, MikroTik, dll)
  ✅ Terintegrasi dengan NetBox, Jinja2, Git
```

### Komponen Ansible

```
INVENTORY  → daftar perangkat + variabel (YAML/INI, atau dinamis dari NetBox)
PLAYBOOK   → daftar task yang dijalankan (YAML)
MODULE     → unit kerja (mis. ios_config, ios_command)
ROLE       → kumpulan task/template/variabel yang dapat dipakai ulang
COLLECTION → paket modul per vendor (cisco.ios, arista.eos)
TEMPLATE   → Jinja2 untuk konfigurasi
VAULT      → enkripsi kredensial
```

### Inventory

`inventory.yaml`:
```yaml
all:
  children:
    core:
      hosts:
        sw-core-01:
          ansible_host: 192.168.1.1
        sw-core-02:
          ansible_host: 192.168.1.2
    access:
      hosts:
        sw-access-01:
          ansible_host: 192.168.1.11
      vars:
        role: access
  vars:
    ansible_network_os: cisco.ios.ios
    ansible_connection: network_cli
    ansible_user: admin
```

### Playbook

`backup.yaml`:
```yaml
---
- name: Backup konfigurasi semua switch
  hosts: all
  gather_facts: no
  tasks:
    - name: Ambil running-config
      cisco.ios.ios_command:
        commands: show running-config
      register: config_output

    - name: Simpan ke file
      copy:
        content: "{{ config_output.stdout[0] }}"
        dest: "backups/{{ inventory_hostname }}.cfg"
      delegate_to: localhost
```

`konfig-vlan.yaml`:
```yaml
---
- name: Pastikan VLAN standar ada di semua access switch
  hosts: access
  gather_facts: no
  vars:
    vlans:
      - { id: 10, name: STAFF }
      - { id: 20, name: SERVER }
      - { id: 30, name: TAMU }
  tasks:
    - name: Konfigurasi VLAN
      cisco.ios.ios_vlans:
        config: "{{ vlans | map('combine', {'state': 'active'}) | list }}"
        state: merged        # merged = tambah/ubah, tidak hapus yang lain
```

```bash
# Jalankan
$ ansible-playbook -i inventory.yaml backup.yaml

# DRY-RUN dulu (check mode) — WAJIB untuk perubahan!
$ ansible-playbook -i inventory.yaml konfig-vlan.yaml --check --diff

# Batasi ke subset
$ ansible-playbook -i inventory.yaml konfig-vlan.yaml --limit sw-access-01
```

> [!WARNING]
> **`--check --diff` (dry-run) sebelum menerapkan adalah wajib** untuk perubahan. `--check` mensimulasikan tanpa mengubah, `--diff` menampilkan perubahan yang akan terjadi. Sama seperti `compare_config` di NAPALM.

> [!TIP]
> **`state: merged`** menambah/mengubah tanpa menghapus yang lain, sehingga idempoten dan aman. `state: replaced` mengganti seluruh bagian, `state: overridden` menghapus yang tidak disebutkan. Pahami perbedaannya sebelum memakai.

### Ansible Vault: kredensial

```bash
# Enkripsi file berisi kredensial
$ ansible-vault encrypt secrets.yaml
$ ansible-vault edit secrets.yaml
$ ansible-playbook playbook.yaml --ask-vault-pass
```

> [!WARNING]
> **JANGAN pernah menaruh kredensial plaintext di playbook atau inventory yang masuk Git.** Pakai Ansible Vault, environment variable, atau integrasi dengan vault eksternal (HashiCorp Vault, CyberArk).

### Modul dan collection jaringan

```
cisco.ios        → Cisco IOS/IOS-XE (ios_config, ios_command, ios_vlans, ios_l2_interfaces)
cisco.nxos       → Nexus
cisco.iosxr      → IOS-XR
arista.eos       → Arista
junipernetworks.junos → Juniper
community.routeros → MikroTik RouterOS
ansible.netcommon → umum (netconf, cli_config)
```

### Ansible untuk MikroTik

```yaml
---
- name: Konfigurasi MikroTik
  hosts: mikrotik
  gather_facts: no
  connection: ansible.netcommon.network_cli
  vars:
    ansible_network_os: community.routeros.routeros
  tasks:
    - name: Tambah address list
      community.routeros.command:
        commands:
          - /ip firewall address-list add list=BLOKIR address=203.0.113.0/24
```

Alternatif: modul RouterOS API (`community.routeros.api`) untuk interaksi lebih terstruktur.

---

## 2. Terraform: Infrastructure as Code

**Terraform** (HashiCorp) unggul untuk infrastruktur cloud dan yang punya API deklaratif: VPC, security group, load balancer, DNS, dan sebagian perangkat jaringan.

```
Kenapa Terraform:
  ✅ Deklaratif dengan state management
  ✅ Provider untuk hampir semua platform (AWS, Azure, GCP, Cisco, Meraki, dll)
  ✅ Plan (dry-run) yang jelas sebelum apply
  ✅ Dependency graph otomatis
  ✅ State file melacak apa yang sudah dibuat
```

### Contoh: VPC AWS

`main.tf`:
```hcl
provider "aws" {
  region = "ap-southeast-3"    # Jakarta
}

resource "aws_vpc" "utama" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "vpc-produksi" }
}

resource "aws_subnet" "publik" {
  vpc_id            = aws_vpc.utama.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-southeast-3a"
  tags = { Name = "subnet-publik" }
}

resource "aws_security_group" "web" {
  vpc_id = aws_vpc.utama.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

```bash
$ terraform init          # unduh provider
$ terraform plan          # DRY-RUN — tampilkan apa yang akan dibuat
$ terraform apply         # terapkan (setelah konfirmasi)
$ terraform destroy       # hapus semua yang dibuat
$ terraform state list    # apa yang dikelola
```

> [!WARNING]
> **`terraform plan` selalu ditampilkan sebelum `apply`** dan harus di-review, karena ia menunjukkan persis resource apa yang akan dibuat, diubah, atau dihapus. `~` = ubah, `+` = buat, `-` = hapus. Perhatikan `-` (hapus) dengan sangat cermat.

> [!WARNING]
> **Jaga state file (`terraform.tfstate`) baik-baik.** Ia melacak semua resource yang dikelola dan sering berisi data sensitif. Simpan di **remote backend** (S3, Terraform Cloud) dengan locking, jangan di laptop atau Git. Kehilangan state = Terraform "lupa" apa yang sudah dibuat.

### Ansible vs Terraform

| | **Ansible** | **Terraform** |
|---|---|---|
| Model | Prosedural + deklaratif | Deklaratif murni |
| Fokus | Konfigurasi (perangkat yang ada) | Provisioning (membuat infrastruktur) |
| State | Tanpa state (memeriksa setiap kali) | State file (melacak yang dibuat) |
| Untuk | Perangkat jaringan, server, konfigurasi | Cloud (VPC, SG), sumber daya API |
| Agentless | Ya | Ya |
| Bahasa | YAML | HCL |

> [!TIP]
> **Sering dipakai bersama (CCNA 6.6 menyebut keduanya):** Terraform membuat infrastruktur cloud (VPC, subnet, instance), lalu Ansible mengonfigurasi apa yang berjalan di dalamnya. Aturan umum: Terraform untuk "membuat/menghancurkan", Ansible untuk "mengonfigurasi".

> [!WARNING]
> **CCNA hanya mengharuskan Anda MENGENALI kapabilitas Ansible dan Terraform** (topik 6.6: "recognize the capabilities of configuration management mechanisms such as Ansible and Terraform"), bukan menguasai sintaks mendalam. Pahami: keduanya deklaratif, idempoten, dan mengelola konfigurasi/infrastruktur sebagai kode.

---

## 3. NetBox: Source of Truth

**NetBox** adalah basis data otoritatif tentang "apa yang seharusnya ada" di jaringan, bukan "apa yang ada".

```
Yang dikelola NetBox:
  - IPAM (IP Address Management) — subnet, VLAN, alamat
  - DCIM (Data Center Infrastructure) — rak, perangkat, kabel, port
  - Sirkuit dan provider
  - Tenant dan kontak
  - Konfigurasi dan device type
```

### Kenapa Source of Truth penting

```
MASALAH tanpa SoT:
  "Apa yang ada di jaringan?" → login ke perangkat satu per satu
  Dokumentasi (spreadsheet) selalu ketinggalan
  Tidak ada kebenaran tunggal

DENGAN NetBox sebagai SoT:
  NetBox = niat (apa yang seharusnya)
  Perangkat = implementasi (apa yang ada)
  Otomasi membaca dari NetBox → menerapkan ke perangkat
  Audit membandingkan perangkat vs NetBox (deteksi drift)
```

### Alur SoT-driven automation

```
1. Definisikan niat di NetBox (VLAN, subnet, konfigurasi perangkat)
2. Otomasi (Ansible/Nornir) MEMBACA dari NetBox (dynamic inventory)
3. Generate konfigurasi (Jinja2) dari data NetBox
4. Terapkan ke perangkat
5. Audit: bandingkan perangkat dengan NetBox → deteksi drift
```

```python
# Contoh: Ansible dynamic inventory dari NetBox
# inventory.netbox.yml
plugin: netbox.netbox.nb_inventory
api_endpoint: https://netbox.perusahaan.com
token: "{{ netbox_token }}"
group_by:
  - device_roles
  - sites
```

> [!TIP]
> **NetBox memisahkan NIAT dari IMPLEMENTASI.** Anda mengubah jaringan dengan mengubah NetBox (yang bisa di-review, punya API, punya riwayat), lalu otomasi menerapkannya. Perangkat menjadi "cerminan" dari NetBox, bukan sumber kebenaran sendiri. **Nautobot** adalah fork NetBox dengan fokus otomasi tambahan.

> [!WARNING]
> **NetBox hanya berguna kalau dijaga akurat.** Kalau orang mengubah perangkat langsung tanpa memperbarui NetBox, SoT menjadi bohong. Disiplin proses (semua perubahan lewat NetBox → otomasi) diperlukan, atau setidaknya audit drift berkala.

---

## 4. Git untuk Jaringan

Version control adalah fondasi otomasi jaringan modern.

```
Yang disimpan di Git:
  - Playbook Ansible, skrip Python
  - Template Jinja2
  - Konfigurasi (backup, golden config)
  - File Terraform (.tf, tetapi TIDAK state)
  - Dokumentasi as-code
  - Inventory (tanpa kredensial!)
```

### Workflow dasar

```bash
$ git clone <repo>
$ git checkout -b tambah-vlan-40      # branch untuk perubahan
# ... buat perubahan ...
$ git add .
$ git commit -m "Tambah VLAN 40 untuk IoT"
$ git push origin tambah-vlan-40
# → buat Pull Request → REVIEW → merge
```

### Kenapa Git untuk jaringan

```
✅ Riwayat — siapa mengubah apa, kapan, kenapa (commit message)
✅ Review — Pull Request sebelum perubahan diterapkan
✅ Rollback — git revert ke versi sebelumnya
✅ Kolaborasi — banyak orang, tanpa saling menimpa
✅ Diff — lihat persis apa yang berubah
✅ Branch — kembangkan perubahan tanpa memengaruhi produksi
✅ Audit trail — untuk kepatuhan
```

> [!WARNING]
> **JANGAN commit kredensial ke Git.** Gunakan `.gitignore`, Ansible Vault, git-secrets scanner, dan environment variable. Kredensial yang pernah masuk Git tetap ada di riwayat meski dihapus, jadi harus di-rotasi kalau terlanjur.

> [!TIP]
> **Backup konfigurasi ke Git** memberi Anda diff otomatis: `git diff` menunjukkan persis apa yang berubah di setiap perangkat antar-backup. Hasilnya, Anda mendapat deteksi drift dan perubahan tak terduga secara gratis.

---

## 5. CI/CD untuk Jaringan

CI/CD menerapkan praktik pengembangan software ke jaringan: perubahan diuji otomatis sebelum di-deploy.

```
┌─────────┐   push   ┌──────────────────────────────────┐   deploy   ┌─────────┐
│   Git   │─────────→│  CI/CD PIPELINE                   │───────────→│ Jaringan│
│ (niat)  │          │  1. LINT (sintaks, gaya)          │            │         │
└─────────┘          │  2. VALIDATE (Batfish, dry-run)   │            └─────────┘
                     │  3. TEST (lab: Containerlab)      │
                     │  4. REVIEW (approval gate)        │
                     │  5. DEPLOY (Ansible/Terraform)    │
                     │  6. VERIFY (pyATS, post-check)    │
                     └──────────────────────────────────┘
```

### Tahap pipeline

```
1. LINT
   - Sintaks YAML/HCL/Jinja2
   - Gaya (ansible-lint, yamllint)
   - Kebijakan (mis. tidak ada telnet)

2. VALIDATE (tanpa menyentuh produksi)
   - Batfish: analisis konfigurasi secara statis
     "Apakah host A bisa mencapai B? Apakah ada ACL konflik?
      Apakah perubahan ini memutus reachability?"
   - Ansible --check --diff / Terraform plan

3. TEST (di LAB)
   - Deploy ke Containerlab/GNS3 dengan topologi sama
   - Jalankan test konektivitas

4. REVIEW / APPROVAL GATE
   - Pull request di-review manusia
   - Persetujuan wajib sebelum produksi

5. DEPLOY
   - Ansible playbook / Terraform apply
   - Bertahap (canary → sebagian → semua)

6. VERIFY
   - pyATS/Genie: bandingkan state sebelum/sesudah
   - Post-check: apakah semua adjacency masih up? reachability OK?
   - Rollback otomatis kalau verifikasi gagal
```

> [!TIP]
> **Batfish adalah alat kunci untuk CI/CD jaringan.** Ia mem-parsing konfigurasi dan menjawab pertanyaan tentang jaringan tanpa menyentuh perangkat: reachability, ACL analysis, dampak perubahan. Ini memungkinkan "unit test" untuk konfigurasi jaringan sebelum deploy.

> [!WARNING]
> **CI/CD jaringan lebih sulit daripada software** karena: (a) tidak ada "compile error", jadi konfigurasi salah baru terlihat saat diterapkan; (b) rollback jaringan lebih berisiko (bisa memutus koneksi ke perangkat itu sendiri); (c) testing membutuhkan lab yang meniru produksi. Karena itu validasi statis (Batfish) dan testing di lab (Containerlab) sangat berharga.

### Alat CI/CD

```
GitLab CI, GitHub Actions, Jenkins, Azure DevOps
+ ansible-lint, yamllint
+ Batfish (validasi statis)
+ Containerlab (testing di lab)
+ pyATS/Genie (verifikasi)
```

### Contoh GitLab CI

```yaml
# .gitlab-ci.yml
stages: [lint, validate, test, deploy]

lint:
  stage: lint
  script:
    - yamllint .
    - ansible-lint playbooks/

validate:
  stage: validate
  script:
    - ansible-playbook -i inventory playbooks/config.yaml --check --diff

test:
  stage: test
  script:
    - containerlab deploy -t lab.clab.yaml
    - pytest tests/
    - containerlab destroy -t lab.clab.yaml

deploy:
  stage: deploy
  script:
    - ansible-playbook -i inventory playbooks/config.yaml
  when: manual        # butuh persetujuan manual
  only: [main]        # hanya dari branch main
```

> [!WARNING]
> **Pakai `when: manual` (approval gate) untuk deploy produksi.** Perubahan jaringan sebaiknya tidak di-deploy otomatis tanpa persetujuan manusia, setidaknya sampai pipeline sangat matang dan teruji. Blast radius jaringan terlalu besar untuk deploy buta.

---

## 6. Praktik Aman Otomasi Perubahan

Menggabungkan semua konsep, ini kerangka penerapan perubahan yang aman:

```
SEBELUM:
  □ Perubahan di-review (Pull Request)
  □ Backup konfigurasi saat ini
  □ Dry-run / diff / plan ditinjau
  □ Divalidasi (Batfish) — tidak memutus reachability
  □ Diuji di lab (Containerlab)
  □ Rollback plan siap
  □ Jendela pemeliharaan / persetujuan

SAAT:
  □ Deploy BERTAHAP — canary (1 perangkat) → sebagian → semua
  □ Verifikasi di setiap tahap
  □ Pantau real-time
  □ Batas konkurensi (jangan semua sekaligus)

SETELAH:
  □ Verifikasi fungsionalitas penuh (pyATS post-check)
  □ Bandingkan state sebelum/sesudah
  □ Update source of truth (NetBox)
  □ Dokumentasi
  □ Rollback otomatis kalau verifikasi gagal
```

> [!WARNING]
> **Blast radius adalah pertimbangan utama.** Otomasi bisa merusak seluruh jaringan dalam detik. Deploy **canary** (satu perangkat dulu, verifikasi, baru lanjut) membatasi dampak kalau ada masalah. Ini prinsip yang sama dengan deployment software modern.

> [!TIP]
> **Approval gate + canary + rollback otomatis** adalah tiga pengaman terpenting. Dengan ketiganya, otomasi menjadi jauh lebih aman daripada perubahan manual, sekaligus lebih cepat dan konsisten.

---

## 7. Membangun Lab Otomasi

Untuk berlatih otomasi tanpa risiko:

```
1. Containerlab (14/lab) — topologi jaringan sebagai kode (YAML)
   Image: FRR, Arista cEOS, Nokia SR Linux, Cisco (dengan lisensi)

2. GNS3 / EVE-NG — emulator dengan image vendor

3. Cisco DevNet Sandbox — lab Cisco gratis di cloud
   (IOS-XE, NX-OS, Catalyst Center, Meraki, dengan API aktif)

4. MikroTik CHR — gratis, batas 1 Mbps

5. Cloud gratis tier — AWS/Azure/GCP untuk Terraform
```

> [!TIP]
> **Cisco DevNet Sandbox** menyediakan perangkat Cisco nyata di cloud dengan API (RESTCONF, NETCONF, gNMI) yang aktif, cocok untuk berlatih otomasi tanpa hardware. Layanan ini gratis dengan akun DevNet.

Detail lab di `lab/00-setup-lab.md`.

---

## 8. Ringkasan

- **Ansible**: otomasi agentless, deklaratif, idempoten dengan YAML. Komponen: inventory, playbook, module, role, collection, Vault (kredensial). `--check --diff` (dry-run) wajib; `state: merged` aman.
- **Terraform**: IaC untuk cloud dan API deklaratif (VPC, SG, DNS); state file melacak resource (simpan di remote backend, sensitif). `terraform plan` sebelum apply, dan perhatikan `-` (hapus).
- **Ansible vs Terraform**: Terraform membuat infrastruktur, Ansible mengonfigurasi yang ada; keduanya sering dipakai bersama. CCNA hanya minta mengenali kapabilitas keduanya.
- **NetBox** sebagai **Source of Truth**: memisahkan niat (NetBox) dari implementasi (perangkat); otomasi membaca dari NetBox; audit deteksi drift. Hanya berguna kalau dijaga akurat.
- **Git** adalah fondasi: riwayat, review (PR), rollback, diff, kolaborasi. Hati-hati: jangan commit kredensial, karena riwayat menyimpannya selamanya.
- **CI/CD jaringan**: lint → validate (Batfish) → test (Containerlab) → review/approval → deploy → verify (pyATS).
- **Batfish** menganalisis konfigurasi statis (reachability, ACL, dampak perubahan) tanpa menyentuh perangkat, semacam "unit test" untuk jaringan.
- Perubahan aman: review, backup, dry-run, validasi, lab, rollback plan, deploy canary bertahap, verifikasi.
- **Blast radius**: otomasi memperbesar dampak, sehingga approval gate + canary + rollback otomatis adalah pengaman terpenting.
- Berlatih di Containerlab, Cisco DevNet Sandbox, MikroTik CHR tanpa risiko.

---

## 9. Latihan

1. Apa arti "agentless" dan kenapa itu keunggulan untuk otomasi jaringan?
2. Jelaskan perbedaan `state: merged`, `replaced`, dan `overridden` di Ansible.
3. Kapan memakai Ansible dan kapan Terraform? Bagaimana keduanya dipakai bersama?
4. Apa fungsi state file Terraform dan kenapa harus dijaga hati-hati?
5. Apa itu Source of Truth dan bagaimana NetBox memisahkan niat dari implementasi?
6. Kenapa Git penting untuk otomasi jaringan? Sebutkan empat manfaat.
7. Jelaskan tahap-tahap pipeline CI/CD jaringan dan peran Batfish di dalamnya.
8. Kenapa deploy canary + approval gate + rollback otomatis penting untuk otomasi jaringan?

<details>
<summary>Jawaban</summary>

1. **"Agentless" berarti tidak perlu menginstal software agen di perangkat yang dikelola.** Ansible terhubung lewat protokol yang sudah ada (SSH untuk perangkat jaringan, atau API/NETCONF). Ini keunggulan besar untuk jaringan karena: (a) perangkat jaringan sering tidak bisa menjalankan agen: switch/router punya OS tertutup di mana Anda tidak bisa menginstal software pihak ketiga; (b) tidak ada agen untuk dikelola, diperbarui, atau diamankan di ratusan perangkat; (c) tidak ada overhead di perangkat; (d) langsung bisa dipakai pada perangkat apa pun yang punya SSH/API tanpa persiapan. Bandingkan dengan alat berbasis agen (mis. Puppet/Chef tradisional) yang butuh agen di setiap target dan tidak praktis untuk perangkat jaringan.

2. Ketiganya mengontrol **bagaimana Ansible menangani konfigurasi yang SUDAH ADA tetapi tidak Anda sebutkan**:
   - **`merged`**: menambah/mengubah apa yang Anda sebutkan, membiarkan yang lain apa adanya. Contoh: kalau Anda mendeklarasikan VLAN 10, 20, 30 dan perangkat sudah punya VLAN 99, maka 10/20/30 ditambahkan/diperbarui dan VLAN 99 tetap ada. Ini paling aman dan idempoten.
   - **`replaced`**: mengganti konfigurasi per-resource yang Anda sebutkan menjadi persis seperti deklarasi Anda, tetapi resource lain yang tidak disebutkan dibiarkan. Contoh: kalau Anda mendeklarasikan interface Gi0/1, seluruh konfigurasi Gi0/1 diganti sesuai deklarasi (baris yang tidak ada dihapus), tetapi interface lain tidak tersentuh.
   - **`overridden`**: memaksa seluruh konfigurasi menjadi persis seperti deklarasi Anda, sehingga resource yang tidak disebutkan dihapus. Contoh: kalau Anda deklarasikan VLAN 10, 20, 30 saja, maka VLAN 99 di perangkat dihapus. Paling kuat tetapi paling berbahaya.
   Gunakan `merged` secara default; `replaced`/`overridden` hanya kalau Anda benar-benar ingin menegakkan keadaan eksak dan memahami bahwa konfigurasi lain akan dihapus. Selalu `--check --diff` dulu.

3. Gunakan **Terraform** untuk provisioning infrastruktur: membuat dan menghancurkan resource, terutama di cloud (VPC, subnet, security group, load balancer, DNS, instance) dan platform dengan API deklaratif. Terraform unggul di sini karena state management dan dependency graph-nya.
   Gunakan **Ansible** untuk konfigurasi, yaitu mengatur apa yang berjalan di dalam infrastruktur yang sudah ada: mengonfigurasi perangkat jaringan, menginstal/mengonfigurasi software di server, mengelola VLAN/ACL/routing.
   **Dipakai bersama:** alur umum adalah Terraform membuat infrastruktur (mis. VPC + instance router virtual + subnet), lalu Ansible mengonfigurasi apa yang berjalan (mis. konfigurasi FRR/routing di router virtual itu, atau aplikasi di instance). Aturan singkat: "Terraform untuk membuat/menghancurkan, Ansible untuk mengonfigurasi". Keduanya deklaratif dan idempoten, dan keduanya menyimpan definisi sebagai kode di Git.

4. **State file Terraform (`terraform.tfstate`) melacak semua resource yang dikelola Terraform.** State ini memetakan apa yang ada di konfigurasi (.tf) ke resource nyata yang sudah dibuat (dengan ID-nya). Ini memungkinkan Terraform mengetahui apa yang sudah ada, apa yang perlu diubah, dan apa yang harus dihapus saat Anda mengubah konfigurasi.
   **Harus dijaga hati-hati karena:** (a) kehilangan state = Terraform "lupa" apa yang sudah dibuat: ia akan mencoba membuat ulang resource yang sudah ada (menyebabkan duplikasi atau error), atau tidak bisa menghancurkan yang lama; (b) state sering berisi data sensitif (password, kunci, ID resource) dalam plaintext; (c) konflik kalau beberapa orang mengubah bersamaan tanpa locking. **Solusi:** simpan state di remote backend (S3 dengan DynamoDB locking, Terraform Cloud, GitLab) yang mendukung enkripsi dan locking, jangan di laptop atau di-commit ke Git. Backup state secara berkala.

5. **Source of Truth (SoT)** adalah sistem otoritatif yang menyimpan kebenaran tentang bagaimana jaringan SEHARUSNYA dikonfigurasi: niat, bukan keadaan aktual. Tanpa SoT, "kebenaran" tersebar di kepala orang, spreadsheet yang ketinggalan, dan konfigurasi perangkat yang mungkin sudah menyimpang.
   **NetBox memisahkan niat dari implementasi** dengan menjadi basis data terpusat untuk niat: IPAM (subnet, VLAN, alamat), DCIM (perangkat, rak, kabel), dan atribut lain. Alurnya: (1) Anda mendefinisikan niat di NetBox ("subnet ini ada, VLAN ini di switch ini"); (2) otomasi (Ansible/Nornir) membaca dari NetBox sebagai dynamic inventory; (3) generate konfigurasi (Jinja2) dari data NetBox; (4) terapkan ke perangkat (implementasi); (5) audit membandingkan perangkat dengan NetBox untuk mendeteksi drift.
   Dengan begitu, perangkat menjadi cerminan dari NetBox, bukan sumber kebenaran sendiri. Mengubah jaringan berarti mengubah NetBox (yang punya API, riwayat, dan bisa di-review), lalu otomasi menyinkronkannya. Hati-hati: ini hanya bekerja kalau disiplin dijaga, yaitu semua perubahan lewat NetBox, atau audit drift rutin.

6. Empat (dari banyak) manfaat: (a) **Riwayat dan audit trail**: setiap perubahan tercatat dengan siapa, kapan, dan kenapa (commit message); ini sangat dibutuhkan untuk troubleshooting ("apa yang berubah?") dan kepatuhan. (b) **Review sebelum deploy**: Pull Request memungkinkan orang lain meninjau perubahan sebelum diterapkan ke jaringan dan menangkap kesalahan. Dengan begitu, perubahan jaringan bergeser dari "langsung ketik di perangkat" menjadi proses yang ditinjau seperti kode software. (c) **Rollback**: `git revert` mengembalikan ke versi sebelumnya dengan mudah kalau perubahan bermasalah. (d) **Diff**: melihat persis apa yang berubah antar-versi (backup config di Git memberi deteksi drift gratis). Tambahan: kolaborasi tanpa saling menimpa, branching untuk mengembangkan tanpa memengaruhi produksi, dan reproduktibilitas.

7. Tahap-tahap pipeline CI/CD jaringan: (1) **Lint**: periksa sintaks YAML/HCL/Jinja2 dan gaya (ansible-lint, yamllint), plus kebijakan (mis. "tidak ada telnet"). (2) **Validate**: analisis statis tanpa menyentuh produksi (Batfish memeriksa reachability dan ACL; `ansible --check --diff` atau `terraform plan` menunjukkan perubahan). (3) **Test**: deploy ke lab (Containerlab dengan topologi yang meniru produksi) dan jalankan test konektivitas. (4) **Review/approval gate**: Pull Request ditinjau manusia, persetujuan wajib. (5) **Deploy**: Ansible/Terraform menerapkan, idealnya bertahap (canary). (6) **Verify**: pyATS/Genie membandingkan state sebelum/sesudah, post-check reachability dan adjacency; rollback otomatis kalau gagal.
   **Peran Batfish:** ia mem-parsing konfigurasi dan menjawab pertanyaan tentang jaringan tanpa menyentuh perangkat sungguhan, misalnya "Apakah host A masih bisa mencapai B setelah perubahan ini?", "Apakah ada ACL yang tumpang tindih atau tidak dapat dijangkau?", "Apakah perubahan ini memutus reachability yang penting?". Ini memungkinkan validasi statis dampak perubahan sebelum deploy, semacam "unit test" untuk konfigurasi jaringan yang menangkap kesalahan yang tidak terlihat dari sintaks saja.

8. Karena otomasi memperbesar blast radius: satu perintah bisa mengubah ratusan perangkat dalam detik, sehingga satu kesalahan bisa melumpuhkan seluruh jaringan jauh lebih cepat daripada kesalahan manual. Ketiga pengaman ini membatasi risiko itu:
   **Approval gate** memastikan manusia meninjau dan menyetujui sebelum perubahan menyentuh produksi. Pengaman ini menangkap kesalahan yang lolos dari lint/validasi dan memberi kontrol atas kapan perubahan diterapkan. Jaringan terlalu kritis untuk deploy otomatis buta.
   **Canary deploy** menerapkan perubahan ke satu perangkat (atau sebagian kecil) dulu, memverifikasinya, baru memperluas bertahap. Kalau ada masalah yang lolos testing, dampaknya terbatas pada satu perangkat, bukan seluruh jaringan, dan Anda menangkapnya sebelum menyebar.
   **Rollback otomatis** mengembalikan konfigurasi kalau verifikasi pasca-deploy gagal (mis. adjacency BGP putus, reachability hilang). Durasi outage pun berkurang dari "sampai seseorang menyadari dan memperbaikinya manual" menjadi "otomatis dalam menit". Ini terutama penting karena perubahan jaringan bisa memutus koneksi Anda sendiri ke perangkat.
   Bersama, ketiganya membuat otomasi lebih aman daripada perubahan manual, sekaligus lebih cepat, konsisten, dan teraudit.

</details>

---

## 10. Sumber

- Ansible Network Automation: https://docs.ansible.com/ansible/latest/network/
- Terraform: https://developer.hashicorp.com/terraform/docs
- NetBox: https://docs.netbox.dev/ · Nautobot: https://docs.nautobot.com/
- Batfish: https://www.batfish.org/
- Containerlab: https://containerlab.dev/
- Cisco DevNet: https://developer.cisco.com/
- Cisco CCNA 200-301 v1.1, topik 6.6 (Ansible dan Terraform)
- *Network Programmability and Automation* (O'Reilly)

---

**Berikutnya:** `15-otomasi/05-rekayasa-perangkat-lunak`. Rekayasa perangkat lunak untuk network engineer: Git, pengujian, pola desain, dan Docker.
