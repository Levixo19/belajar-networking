# 15.5 Rekayasa Perangkat Lunak untuk Network Engineer

> **Prasyarat:** `15-otomasi/03-python-jaringan`, `15-otomasi/04-ansible-cicd`
> **Tujuan:** Anda bisa mengerjakan skrip otomasi seperti proyek perangkat lunak: memakai Git dengan rapi, membaca unified diff, menulis tes pytest tanpa perangkat, memakai pola adapter, idempotensi, dan retry, menangani pagination, rate limit, dan webhook, lalu mengemas alat dalam Dockerfile tanpa membocorkan kredensial.

---

## 1. Analogi Dunia Nyata

Bayangkan dua cara mengganti ban mobil. Cara pertama: mekanik bekerja sendirian, tanpa catatan, langsung di jalan raya, lalu bilang "kayaknya sudah beres". Cara kedua: bengkel dengan buku servis (siapa mengganti apa, kapan), lembar periksa dua orang sebelum mobil keluar, dan alat uji tekanan yang bisa dicoba tanpa mobil pelanggan.

Skrip otomasi yang dijalankan langsung ke router produksi adalah cara pertama. Git adalah buku servisnya, pull request adalah lembar periksa dua orang, dan pytest dengan test double adalah alat uji yang tidak butuh mobil sungguhan. Modul ini mengajarkan cara kedua.

---

## 2. Peta ke Ujian Cisco CCNA Automation 200-901 v1.1

Dokumen topik ujian resmi (Automating Networks Using Cisco Platforms v1.1, 200-901) membagi ujian menjadi enam domain: 1.0 Software Development and Design (15%), 2.0 Understanding and Using APIs (20%), 3.0 Cisco Platforms and Development (15%), 4.0 Application Deployment and Security (15%), 5.0 Infrastructure and Automation (20%), dan 6.0 Network Fundamentals (15%).

> [!WARNING]
> Ada satu catatan penomoran. Topik rekayasa perangkat lunak di modul ini tersebar di domain 1.0, 2.0, 4.0, dan 5.0. Domain 3.0 adalah platform Cisco (Meraki, Catalyst Center, RESTCONF/NETCONF di IOS XE, DevNet) dan hanya disentuh lewat praktik Cisco di bagian 9. Jangan mengandalkan peta lama yang menyebut "domain 3.0" untuk Git atau pengujian.

| Topik resmi | Bagian modul |
|---|---|
| 1.3 Konsep test-driven development | 5 |
| 1.7 Keunggulan version control; 1.8 operasi Git (clone, add/remove, commit, push/pull, branch, merge dan konflik, diff) | 3 dan 4 |
| 2.2 Pola pemakaian webhook; 2.3 batasan saat memakai API (pagination, rate limit) | 7 |
| 2.4 dan 2.5 Kode status HTTP dan troubleshooting | 7 |
| 4.5 Menulis unit test Python | 5 |
| 4.6 Membaca Dockerfile; 4.7 memakai image Docker lokal | 8 |
| 4.8 Perlindungan rahasia (secret), enkripsi, penanganan data | 8 |
| 4.12 Prinsip DevOps | 3 (pull request), 8 |
| 5.12 Menafsirkan unified diff | 4 |
| 5.13 Prinsip dan manfaat code review | 3 |
| 5.14 Menafsirkan sequence diagram yang memuat panggilan API | 7 |

> [!TIP]
> Topik 1.8.g (diff), 5.12, dan 5.14 sering keluar sebagai soal "baca gambar atau teks lalu jawab", jadi latihan membaca diff dan diagram sekuens lebih berguna daripada menghafal perintah.

---

## 3. Git: Alur Kerja Harian

**Git** menyimpan riwayat proyek sebagai rangkaian *commit*, yaitu potret seluruh berkas pada satu momen, masing-masing menunjuk commit induknya. Sebuah *branch* hanyalah penunjuk bernama ke satu commit; membuat branch hampir gratis.

### Perintah inti (topik 1.8)

```bash
git clone https://git.contoh.id/noc/netauto.git   # 1.8.a salin repo + riwayatnya
cd netauto
git switch -c fitur/ntp-baru                        # 1.8.e buat dan pindah branch
# ... edit berkas ...
git status                                          # apa yang berubah?
git diff                                            # 1.8.g isi perubahan (belum di-stage)
git add netauto/drivers.py tests/                   # 1.8.b siapkan ke staging
git commit -m "Tambah ensure_ntp yang idempoten"    # 1.8.c rekam potret
git push -u origin fitur/ntp-baru                   # 1.8.d kirim ke remote
git pull --rebase origin main                       # 1.8.d ambil perubahan terbaru
git rm config-lama.cfg                              # 1.8.b hapus dan stage penghapusan
```

Aturan commit yang baik: satu commit satu maksud, pesan menjelaskan *mengapa* (jangan cuma "update"), dan jangan menggabungkan perubahan konfigurasi dengan perubahan kode yang tidak berhubungan.

### Merge vs rebase

Misalkan `main` sudah maju sementara Anda mengerjakan branch `fitur`. Ada dua cara menyatukannya.

- **Merge** membuat *merge commit* baru dengan dua induk. Riwayat asli tetap utuh dan jujur, tetapi grafiknya bercabang.
- **Rebase** memindahkan commit branch Anda ke ujung `main` yang baru. Commit-nya dibuat ulang (hash berubah), riwayat jadi lurus.

> [!WARNING]
> **Jangan rebase branch yang sudah dipakai orang lain.** Rebase menulis ulang commit; rekan yang sudah menarik versi lama akan berurusan dengan riwayat ganda. Aturan praktis: rebase untuk merapikan branch pribadi sebelum di-push, merge untuk menyatukan ke branch bersama.

### Konflik merge (1.8.f)

Konflik muncul ketika dua branch mengubah baris yang sama. Git menandainya di berkas:

```
<<<<<<< HEAD
ntp server 10.0.0.9
=======
ntp server 10.0.0.10
>>>>>>> fitur/ntp-baru
```

Bagian atas adalah versi branch Anda saat ini, bagian bawah versi yang masuk. Langkahnya: edit berkas sampai hasil akhir benar (hapus ketiga penanda), `git add berkas`, lalu `git commit` (pada merge) atau `git rebase --continue` (pada rebase). Jalankan tes sebelum melanjutkan, karena Git hanya tahu teks, bukan makna.

### Pull request dan code review (5.13)

Di GitHub dan GitLab, perubahan tidak langsung masuk ke `main`. Anda membuka *pull request* (di GitLab disebut *merge request*): usulan untuk menggabungkan branch, lengkap dengan diff, diskusi, dan hasil pipeline CI. Manfaat code review untuk jaringan: perubahan konfigurasi dilihat dua pasang mata sebelum menyentuh produksi, kesalahan ketik yang bisa memutus link tertangkap lebih awal, pengetahuan menyebar ke tim, dan setiap perubahan punya jejak audit (siapa, kapan, mengapa).

---

## 4. Membaca Unified Diff

Unified diff adalah format yang dihasilkan `git diff` dan tampil di setiap pull request. Contoh nyata: seseorang mengubah mask Ethernet1 dan menambah server NTP.

```diff
diff --git a/r1.cfg b/r1.cfg
index 3f1a2b9..8c4d7e0 100644
--- a/r1.cfg
+++ b/r1.cfg
@@ -1,4 +1,5 @@
 hostname r1
 interface ether1
- ip address 10.0.0.1/24
+ ip address 10.0.0.1/25
 ntp server 10.0.0.9
+ntp server 10.0.0.10
```

Cara membacanya, dari atas:

1. `--- a/r1.cfg` adalah versi lama, `+++ b/r1.cfg` versi baru.
2. `@@ -1,4 +1,5 @@` adalah *hunk header*: di berkas lama hunk mulai baris 1 dan mencakup 4 baris; di berkas baru mulai baris 1 dan mencakup 5 baris. Selisih 1 baris sesuai dengan satu penambahan bersih (dua baris `+`, satu baris `-`).
3. Baris diawali spasi adalah konteks (tidak berubah), `-` dihapus, `+` ditambahkan. Mengubah sebuah baris tampil sebagai pasangan `-` lalu `+`.

Dampak operasional contoh ini: `/24` menjadi `/25` mengecilkan subnet dari 256 menjadi 128 alamat, jadi host di 10.0.0.128 ke atas kehilangan konektivitas lokal. Diff membuat risiko itu terlihat sebelum perubahan diterapkan.

---

## 5. Pengujian dengan pytest

### Mengapa menguji skrip jaringan

Skrip otomasi mengubah banyak perangkat sekaligus, jadi bug-nya juga berlipat. Padahal Anda tidak mungkin menguji ke router produksi setiap kali mengubah satu baris. Solusinya: pisahkan logika (keputusan, parsing, urutan langkah) dari I/O (SSH atau HTTP), lalu uji logikanya dengan **test double**, yaitu pengganti perangkat yang menjawab sesuai skenario.

### TDD singkat (topik 1.3)

*Test-driven development* berjalan dalam siklus pendek:

1. **Red**: tulis tes untuk perilaku yang belum ada, jalankan, pastikan gagal.
2. **Green**: tulis kode paling sederhana agar tes lulus.
3. **Refactor**: rapikan kode sambil menjaga tes tetap hijau.

Hasil sampingannya adalah himpunan tes yang menjadi jaring pengaman setiap kali Anda mengubah skrip.

### Struktur proyek contoh

```
netauto/
  netauto/__init__.py
  netauto/retry.py
  netauto/drivers.py
  netauto/pagination.py
  tests/test_netauto.py
  requirements.txt
  Dockerfile
```

Semua kode di bawah sudah dijalankan di Python 3.14 dengan pytest 9; `requests` hanya dipakai di `__main__`, sedangkan tes memakai tiruan.

`netauto/retry.py`, retry dengan exponential backoff dan jitter:

```python
import random
import time


class TransientError(Exception):
    """Kesalahan sementara: timeout, 429, 502, 503, 504."""


def retry(fn, attempts=4, base=0.5, cap=8.0, sleep=time.sleep, rng=random.random):
    """Panggil fn(); ulangi bila TransientError, dengan exponential backoff + jitter."""
    for n in range(attempts):
        try:
            return fn()
        except TransientError:
            if n == attempts - 1:
                raise
            delay = min(cap, base * 2 ** n)
            sleep(delay * rng())  # full jitter: acak antara 0 dan delay
```

Perhatikan `sleep` dan `rng` sebagai parameter. Inilah teknik membuat kode bisa diuji: waktu dan keacakan disuntikkan, sehingga tes tidak perlu menunggu dan hasilnya deterministik.

`tests/test_netauto.py` (bagian pertama):

```python
import pytest

from netauto.retry import TransientError, retry


def test_retry_sampai_berhasil_dan_jeda_membesar():
    hasil = iter([TransientError(), TransientError(), "ok"])
    jeda = []

    def fn():
        x = next(hasil)
        if isinstance(x, Exception):
            raise x
        return x

    assert retry(fn, sleep=jeda.append, rng=lambda: 1.0) == "ok"
    assert jeda == [0.5, 1.0]


def test_retry_menyerah_setelah_percobaan_habis():
    def fn():
        raise TransientError()
    with pytest.raises(TransientError):
        retry(fn, attempts=2, sleep=lambda s: None)
```

Jalankan dengan `pytest -q` dari akar proyek. Berkas bernama `test_*.py` dan fungsi bernama `test_*` ditemukan otomatis; `assert` biasa sudah cukup, pytest menampilkan nilai kedua sisi saat gagal.

### Test double untuk perangkat

Ada beberapa jenis pengganti, dan istilahnya sering dicampur:

| Jenis | Fungsi | Contoh |
|---|---|---|
| Stub | Mengembalikan jawaban tetap | Sesi yang selalu menjawab daftar alamat tertentu |
| Fake | Implementasi ringan yang bekerja | Kelas `FakeSession` yang mengantre jawaban |
| Mock | Mencatat panggilan agar bisa diperiksa | Memastikan tidak ada `PUT` saat alamat sudah ada |

Pengganti diletakkan di batas I/O: `requests.Session` atau koneksi Netmiko. Jangan menguji dengan mem-patch fungsi internal Anda sendiri; uji lewat antarmuka publik dan ganti hanya sambungan ke dunia luar.

---

## 6. Pola Desain untuk Otomasi Jaringan

### Adapter atau driver per vendor

Router Cisco, MikroTik, dan Linux menjawab dengan bentuk data berbeda, tetapi logika Anda ("pastikan alamat ini ada di interface itu") sama. Pola *adapter* membungkus tiap vendor di balik kontrak yang sama. Kode atas hanya mengenal kontraknya; menambah vendor berarti menambah satu kelas, bukan mengubah logika.

### Idempotensi

Operasi **idempoten** menghasilkan keadaan akhir yang sama walau dijalankan sekali atau sepuluh kali. Ini sifat yang membuat Ansible aman dijalankan ulang, dan Anda perlu menirunya di skrip sendiri: periksa keadaan sekarang, ubah hanya jika berbeda, laporkan apakah ada perubahan. Tanpa itu, retry yang tampak aman bisa menambah alamat ganda atau menumpuk aturan firewall.

### Retry dengan backoff

Kegagalan sementara (kode 429, 502, 503, 504, timeout) layak diulang; kegagalan permanen (401, 404, 400) tidak. Interval diperlebar secara eksponensial (0,5 detik, 1, 2, 4, dibatasi `cap`) agar server yang sedang kewalahan punya waktu pulih, dan diberi *jitter* acak agar ratusan klien tidak mencoba ulang serentak.

> [!WARNING]
> Retry hanya aman untuk operasi idempoten. Mengulang `PUT` yang menambah record tanpa memeriksa lebih dulu bisa menggandakan record bila respons pertama hilang di tengah jalan.

`netauto/drivers.py` menggabungkan ketiganya (sesi HTTP disuntikkan, jadi bisa diganti tiruan):

```python
from abc import ABC, abstractmethod

from .retry import TransientError, retry

TRANSIENT = {429, 502, 503, 504}


class Driver(ABC):
    """Kontrak yang sama untuk semua vendor. Kode atas hanya kenal kelas ini."""

    @abstractmethod
    def list_addresses(self) -> set[str]: ...

    @abstractmethod
    def add_address(self, interface: str, address: str) -> None: ...


class MikroTikRest(Driver):
    def __init__(self, session, base_url, sleep=None):
        self.s = session            # requests.Session (atau tiruannya di tes)
        self.base = base_url.rstrip("/")
        self.sleep = sleep          # None = time.sleep sungguhan

    def _call(self, method, path, **kw):
        def once():
            r = self.s.request(method, f"{self.base}{path}", timeout=5, **kw)
            if r.status_code in TRANSIENT:
                raise TransientError(r.status_code)
            r.raise_for_status()
            return r
        extra = {"sleep": self.sleep} if self.sleep else {}
        return retry(once, **extra)

    def list_addresses(self):
        rows = self._call("GET", "/rest/ip/address").json()
        return {row["address"] for row in rows}

    def add_address(self, interface, address):
        self._call("PUT", "/rest/ip/address",
                   json={"address": address, "interface": interface})


def ensure_address(driver: Driver, interface: str, address: str) -> bool:
    """Idempoten: kembalikan True hanya bila ada perubahan."""
    if address in driver.list_addresses():
        return False
    driver.add_address(interface, address)
    return True
```

Sisa `tests/test_netauto.py`, lengkap dengan test double `FakeSession`:

```python
from netauto.drivers import MikroTikRest, ensure_address


class FakeResp:
    def __init__(self, status=200, body=None, links=None):
        self.status_code, self._body, self.links = status, body, links or {}

    def json(self):
        return self._body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.status_code)


class FakeSession:
    """Test double: menjawab dari antrean, mencatat semua permintaan."""
    def __init__(self, *responses):
        self.queue, self.calls = list(responses), []

    def request(self, method, url, **kw):
        self.calls.append((method, url, kw.get("json")))
        return self.queue.pop(0)

    def get(self, url, **kw):
        return self.request("GET", url, **kw)


def test_ensure_address_idempoten():
    s = FakeSession(FakeResp(body=[{"address": "10.0.0.1/24"}]))
    d = MikroTikRest(s, "https://r1")
    assert ensure_address(d, "ether1", "10.0.0.1/24") is False
    assert [c[0] for c in s.calls] == ["GET"]          # tidak ada PUT


def test_ensure_address_menambah_dan_503_diulang():
    s = FakeSession(FakeResp(body=[]), FakeResp(status=503), FakeResp(body={}))
    d = MikroTikRest(s, "https://r1", sleep=lambda x: None)
    assert ensure_address(d, "ether1", "10.0.0.2/24") is True
    assert s.calls[2] == ("PUT", "https://r1/rest/ip/address",
                          {"address": "10.0.0.2/24", "interface": "ether1"})
    assert len(s.calls) == 3
```

Tes kedua membuktikan tiga hal sekaligus tanpa router: alamat belum ada sehingga ditambahkan, respons 503 pertama memicu pengulangan, dan isi `PUT` sesuai format REST MikroTik.

---

## 7. API REST: Pagination, Rate Limit, Webhook

### Pagination (topik 2.3)

Server jarang mengirim ribuan record sekaligus. Ia memecahnya menjadi halaman, dan klien harus terus meminta sampai habis. Ada beberapa gaya: `offset` dan `limit`, kursor (token halaman berikutnya), atau header `Link` dengan `rel="next"` (RFC 8288), yang dipakai antara lain oleh REST API GitHub. Library `requests` mengurai header itu ke `response.links`.

`netauto/pagination.py`:

```python
def fetch_all(session, url, params=None):
    """Ikuti header Link rel="next" (RFC 8288) sampai habis."""
    items = []
    while url:
        r = session.get(url, params=params, timeout=5)
        r.raise_for_status()
        items.extend(r.json())
        url = r.links.get("next", {}).get("url")
        params = None  # URL 'next' sudah memuat query-nya
    return items
```

Tesnya:

```python
from netauto.pagination import fetch_all


def test_pagination_mengikuti_link_next():
    s = FakeSession(
        FakeResp(body=[1, 2], links={"next": {"url": "https://api/x?page=2"}}),
        FakeResp(body=[3]),
    )
    assert fetch_all(s, "https://api/x") == [1, 2, 3]
    assert s.calls[1][1] == "https://api/x?page=2"
```

Kesalahan klasik: hanya membaca halaman pertama lalu mengira daftar perangkat sudah lengkap.

### Rate limit

Banyak API membatasi jumlah permintaan per satuan waktu. Bila terlampaui, server menjawab **429 Too Many Requests** (RFC 6585), sering dengan header `Retry-After` yang menyebut berapa detik harus menunggu (RFC 9110). Respons yang benar adalah menghormati `Retry-After` bila ada, dan bila tidak, memakai backoff dari bagian 6. Mengulang secepat mungkin hanya memperpanjang hukuman.

### Webhook vs polling (topik 2.2)

| | Polling | Webhook |
|---|---|---|
| Siapa memulai | Klien bertanya berkala | Server memanggil URL milik Anda saat ada kejadian |
| Latensi | Sampai satu interval | Hampir seketika |
| Beban | Banyak permintaan sia-sia | Hanya saat ada kejadian |
| Syarat | Cukup bisa keluar ke API | Anda punya endpoint HTTP yang dapat dijangkau server |
| Risiko | Kena rate limit | Perlu verifikasi pengirim (tanda tangan atau token) dan penanganan kiriman ganda |

Contoh: Webex memanggil webhook Anda saat ada pesan baru, sedangkan polling cocok untuk perangkat di balik NAT yang tidak bisa dijangkau dari luar.

### Diagram sekuens (topik 5.14)

Diagram sekuens membaca dari atas ke bawah: garis vertikal adalah pelaku, panah horizontal adalah pesan, urutan vertikal adalah urutan waktu. Panah putus-putus biasanya respons. Saat ujian, tanyakan pada diri sendiri: siapa memulai, apa isi tiap permintaan, dan kode status apa yang kembali.

---

## 8. Dependensi, Rahasia, dan Dockerfile

### Manajemen dependensi

- **venv** mengisolasi paket per proyek: `python3 -m venv .venv`, lalu `source .venv/bin/activate`.
- **requirements.txt** mengunci versi yang dipakai: `pip install -r requirements.txt`. Tulis versi persis (`requests==2.33.1`) agar build hari ini sama dengan build bulan depan.
- **pyproject.toml** adalah berkas konfigurasi modern: nama proyek, versi Python, dan daftar dependensi dalam satu tempat, dipakai jika alat Anda akan dikemas sebagai paket.
- Pisahkan dependensi tes (pytest) dari dependensi runtime agar image produksi kecil.

### Penanganan rahasia (topik 4.8)

Kredensial, token API, dan kunci privat tidak boleh masuk repositori. Alasannya sederhana: Git menyimpan semua riwayat, jadi rahasia yang pernah di-commit tetap ada di riwayat walau berkasnya dihapus kemudian.

> [!TIP]
> Baca rahasia dari environment variable atau secret manager (`os.environ["ROUTER_PASS"]`), taruh berkas `.env` di `.gitignore`, dan sediakan `.env.example` berisi nama variabel tanpa nilai.

> [!CAUTION]
> Jangan menulis `password="admin123"` di skrip, jangan menaruh token di URL yang masuk log, dan jangan menonaktifkan verifikasi TLS secara permanen demi "supaya jalan".

> [!WARNING]
> Jika rahasia terlanjur ter-commit, anggap sudah bocor: ganti (rotate) kredensialnya segera. Menghapus commit atau menulis ulang riwayat tidak menjamin tidak ada yang sempat menyalinnya.

### Dockerfile minimal (topik 4.6 dan 4.7)

Dockerfile adalah resep membuat image. Untuk alat otomasi di atas:

```dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY netauto/ netauto/
RUN useradd --create-home appuser
USER appuser
CMD ["python", "-m", "netauto"]
```

Cara membacanya baris demi baris:

- `FROM` menentukan image dasar; varian `slim` lebih kecil.
- `WORKDIR` menetapkan direktori kerja di dalam image.
- `COPY requirements.txt` dan `RUN pip install` dikerjakan sebelum menyalin kode, supaya lapisan dependensi di-cache Docker dan tidak dibangun ulang tiap kali Anda mengubah satu baris kode.
- `USER appuser` menjalankan proses tanpa hak root.
- `CMD` adalah perintah default saat kontainer dijalankan.

Rahasia tidak dimasukkan ke image (`ENV ROUTER_PASS=...` akan tersimpan di lapisan image). Berikan saat runtime:

```bash
docker build -t netauto:0.1 .
docker run --rm --env-file .env netauto:0.1
```

Berkas `__main__.py` yang dipanggil `CMD` membaca `ROUTER_USER`, `ROUTER_PASS`, dan `ROUTER_URL` dari environment, lalu memakai `MikroTikRest` di atas.

---

## 9. Praktik Tiga Platform

### Cisco (RESTCONF di IOS XE)

Topik 3.8 dan 5.10 menguji RESTCONF. Dengan DevNet Sandbox (reservasi atau always-on IOS XE; ambil host dan kredensial dari halaman sandbox), baca daftar interface:

```bash
curl -s -k -u "$SB_USER:$SB_PASS" \
  -H "Accept: application/yang-data+json" \
  "https://$SB_HOST/restconf/data/ietf-interfaces:interfaces"
```

Lalu bungkus di Python dengan pola yang sama: sesi disuntikkan, status 429 dan 5xx diulang, dan tes memakai `FakeSession` yang mengembalikan JSON hasil salinan satu respons nyata. Dengan begitu tes Anda berjalan tanpa sandbox.

### MikroTik RouterOS v7 (REST API)

REST API diperkenalkan di RouterOS v7.1beta4, aktif lewat layanan `www-ssl` (atau `www`), memakai HTTP Basic Auth dengan akun console. Pemetaan metode: `GET` untuk `print`, `PUT` untuk `add`, `PATCH` untuk `set`, `DELETE` untuk `remove`, `POST` untuk menjalankan perintah.

```bash
# daftar alamat
curl -k -u "$ROUTER_USER:$ROUTER_PASS" https://$ROUTER_URL/rest/ip/address
# tambah alamat
curl -k -u "$ROUTER_USER:$ROUTER_PASS" -X PUT https://$ROUTER_URL/rest/ip/address \
  -H "content-type: application/json" \
  --data '{"address": "192.168.111.111/24", "interface": "dummy"}'
```

> [!WARNING]
> `-k` mengabaikan verifikasi sertifikat dan hanya layak untuk lab. Di produksi, pasang sertifikat yang dipercaya. Galat REST berbentuk JSON, misalnya `{"error":404,"message":"Not Found"}`. Kelas `MikroTikRest` di bagian 6 persis memakai jalur `/rest/ip/address` ini.

### Linux (pytest dan Docker)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install pytest requests
pytest -q                      # lima tes lulus tanpa perangkat
docker build -t netauto:0.1 .  # Dockerfile bagian 8
git init && printf '.venv/\n.env\n__pycache__/\n' > .gitignore
```

---

## 10. Kesalahan Umum

1. **Menguji langsung ke perangkat produksi** karena "tidak ada waktu menulis tes". Satu salah ketik pada loop atas 200 switch lebih mahal daripada tes yang tertunda.
2. **Mem-commit kredensial** lalu hanya menghapus berkasnya. Riwayat Git tetap menyimpannya.
3. **Rebase branch bersama** sehingga rekan harus memperbaiki riwayat.
4. **Retry tanpa idempotensi**, sehingga satu `PUT` yang timeout menghasilkan dua record.
5. **Mengulang semua galat.** 401 dan 404 tidak akan membaik dengan menunggu.
6. **Hanya membaca halaman pertama** dari API berpagination.
7. **Tes yang bergantung pada waktu atau jaringan** (`time.sleep` asli, DNS asli), sehingga lambat dan kadang gagal tanpa sebab jelas.
8. **Menaruh rahasia di `ENV` Dockerfile** atau menyalin `.env` ke image.
9. **Dependensi tanpa versi** (`requests` saja), sehingga build berbeda dari hari ke hari.
10. **Salah baca diff**: mengira `-` berarti baris baru. Ingat, `-` hilang dari versi baru, `+` muncul di versi baru.

---

## 11. Ringkasan

- Perlakukan skrip otomasi sebagai perangkat lunak: Git, review, tes, dan paket yang terkunci versinya.
- Branch itu murah; merge menjaga riwayat, rebase merapikannya; jangan rebase branch bersama. Konflik diselesaikan dengan menyunting penanda `<<<<<<<`, `=======`, `>>>>>>>`.
- Unified diff: `---` lama, `+++` baru, `@@ -a,b +c,d @@` rentang baris, `-` dihapus, `+` ditambah.
- Pisahkan logika dari I/O lalu uji dengan test double; suntikkan sesi, waktu, dan keacakan.
- Pola berguna: adapter per vendor, idempotensi, retry dengan backoff dan jitter hanya untuk galat sementara.
- API: telusuri semua halaman, hormati 429 dan `Retry-After`, pilih webhook bila perlu respons cepat dan endpoint Anda terjangkau, polling bila tidak.
- Rahasia lewat environment variable, bukan Git atau image; rahasia bocor harus di-rotate.
- Peta ujian 200-901 v1.1: domain 1.0 (1.3, 1.7, 1.8), 2.0 (2.2, 2.3), 4.0 (4.5 sampai 4.8, 4.12), dan 5.0 (5.12 sampai 5.14).

---

## 12. Latihan

1. Sebutkan perbedaan utama merge dan rebase, dan kapan rebase tidak boleh dipakai.
2. Perhatikan hunk header `@@ -10,6 +10,8 @@`. Apa artinya, dan berapa selisih bersih jumlah barisnya?
3. Sebuah diff berisi baris `- ip address 10.0.0.1/24` diikuti `+ ip address 10.0.0.1/25`. Jelaskan apa yang berubah dan satu dampak operasionalnya.
4. Fungsi `retry` memakai `base=0.5`, `cap=8.0`, dan `rng` yang selalu mengembalikan 1.0. Berapa daftar jeda pada percobaan gagal ke-1 sampai ke-5 (anggap `attempts` cukup besar)?
5. Mengapa `retry` pada `PUT` yang menambah record berbahaya jika tidak idempoten, dan bagaimana `ensure_address` mengatasinya?
6. API mengembalikan 100 perangkat per halaman dan header `Link: <https://api/x?page=2>; rel="next"`. Bagaimana klien memastikan semua perangkat terambil, dan apa yang dilakukan bila menerima 429 dengan `Retry-After: 30`?
7. Kapan Anda memilih webhook dan kapan polling? Beri satu contoh masing-masing.
8. Anda tidak sengaja mem-commit token API ke repo. Langkah apa yang harus diambil, dan mengapa menghapus berkas saja tidak cukup?

<details>
<summary>Jawaban</summary>

1. **Merge** menyatukan dua branch dengan membuat merge commit berinduk dua; riwayat asli utuh tetapi bercabang. **Rebase** memindahkan commit branch Anda ke ujung branch tujuan dengan membuatnya ulang (hash berubah), sehingga riwayat lurus. Rebase tidak boleh dipakai pada branch yang sudah di-push dan dipakai orang lain, karena menulis ulang riwayat yang mereka pegang.

2. Di berkas lama hunk mulai baris 10 dan mencakup 6 baris; di berkas baru mulai baris 10 dan mencakup 8 baris. Selisih bersihnya **bertambah 2 baris** (baris yang ditambah dikurangi baris yang dihapus).

3. Baris `-` (lama) adalah `10.0.0.1/24`, baris `+` (baru) adalah `10.0.0.1/25`: mask diubah dari /24 ke /25. Subnet mengecil dari 256 ke 128 alamat, sehingga host di 10.0.0.128 ke atas tidak lagi satu subnet dengan interface ini dan kehilangan konektivitas lokal. Baris konteks tanpa tanda tidak berubah.

4. Jeda = `min(cap, base * 2**n) * 1.0` dengan n mulai 0: **0,5; 1,0; 2,0; 4,0; 8,0** detik (percobaan ke-5 menyentuh `cap` 8,0; ke-6 dan seterusnya tetap 8,0).

5. Jika respons `PUT` hilang tetapi server sudah menambah record, retry menambahkan record kedua (duplikat). `ensure_address` memeriksa dulu lewat `list_addresses`: bila alamat sudah ada, tidak ada `PUT`, sehingga operasi bersifat idempoten dan retry menjadi aman.

6. Klien mengulang `GET` mengikuti `rel="next"` (di `requests`: `response.links["next"]["url"]`) sampai tidak ada lagi tautan `next`, dan menggabungkan semua halaman. Pada 429 dengan `Retry-After: 30`, klien menunggu sekitar 30 detik sebelum mengulang permintaan yang sama, bukan mengulang segera.

7. **Webhook** bila butuh reaksi cepat dan endpoint Anda dapat dijangkau server, mis. Webex memanggil URL Anda saat ada pesan baru. **Polling** bila sumbernya tidak bisa memanggil Anda atau Anda berada di balik NAT, mis. mengecek status interface router tiap menit lewat REST API. Webhook perlu verifikasi pengirim dan penanganan kiriman ganda.

8. Segera **ganti (rotate) token** di penyedia API dan cabut yang lama; baru kemudian hapus dari kode dan pindahkan ke environment variable atau secret manager, tambahkan ke `.gitignore`. Menghapus berkas tidak cukup karena Git menyimpan semua commit lama, sehingga token masih bisa diambil dari riwayat, fork, atau klon yang sudah ada.

</details>

---

## 13. Sumber

- Cisco, CCNA Automation 200-901 v1.1 exam topics (PDF resmi): https://learningcontent.cisco.com/documents/marketing/exam-topics/200-901-CCNAAUTO_v.1.1.pdf
- Pro Git, Basic Branching and Merging: https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging
- Git, dokumentasi git-rebase: https://git-scm.com/docs/git-rebase
- Git, format diff (unified diff): https://git-scm.com/docs/diff-format
- pytest, dokumentasi: https://docs.pytest.org/en/stable/
- GitHub Docs, pagination REST API: https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api
- RFC 8288, Web Linking (header Link): https://www.rfc-editor.org/rfc/rfc8288
- RFC 6585, status 429 Too Many Requests: https://www.rfc-editor.org/rfc/rfc6585
- RFC 9110, HTTP Semantics (Retry-After): https://www.rfc-editor.org/rfc/rfc9110
- AWS Builders' Library, Timeouts, retries, and backoff with jitter: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
- MikroTik, REST API RouterOS v7: https://help.mikrotik.com/docs/spaces/ROS/pages/47579162/REST+API
- Docker, referensi Dockerfile: https://docs.docker.com/reference/dockerfile/
- Docker, best practices build: https://docs.docker.com/build/building/best-practices/
- Python, modul venv: https://docs.python.org/3/library/venv.html
- Python Packaging, menulis pyproject.toml: https://packaging.python.org/en/latest/guides/writing-pyproject-toml/
- The Twelve-Factor App, Config: https://12factor.net/config
- Cisco DevNet Sandbox: https://developer.cisco.com/site/sandbox/
- CiscoDevNet/netprog_basics (MIT, hanya dirujuk): https://github.com/CiscoDevNet/netprog_basics
- CiscoDevNet/coding-skills-sample-code (Apache-2.0, hanya dirujuk): https://github.com/CiscoDevNet/coding-skills-sample-code

---

**Berikutnya:** `16-datacenter-cloud-sdn/01-desain-dc`. Memasuki dunia data center dan cloud.
