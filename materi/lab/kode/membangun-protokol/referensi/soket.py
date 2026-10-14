# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.1 (REFERENSI): socket UDP/TCP dasar dan klien HTTP/1.1 mentah.

Tidak ada library HTTP di sini: klien menulis request sebagai teks, mengirimnya lewat
socket TCP, lalu mengurai respons byte demi byte (status line, header, body dengan
Content-Length, chunked, atau "baca sampai koneksi ditutup").
"""

from __future__ import annotations

import socket
import struct
from dataclasses import dataclass, field


# --- UDP ------------------------------------------------------------------------

def udp_echo_sekali(sock: socket.socket) -> tuple[str, int]:
    """Terima SATU datagram lalu kirim balik isinya ke pengirim. Kembalikan alamat
    pengirim. (Contoh yang sudah jadi, juga di starter.)"""
    data, alamat = sock.recvfrom(65535)
    sock.sendto(data, alamat)
    return alamat


def udp_kirim_terima(host: str, port: int, data: bytes, timeout: float = 1.0, ulang: int = 3) -> bytes:
    """Kirim datagram dan tunggu balasan. UDP tidak menjamin apa pun, jadi aplikasi
    sendiri yang memasang timeout dan mencoba ulang. Lempar TimeoutError bila semua
    percobaan habis."""
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.settimeout(timeout)
        for _ in range(ulang):
            s.sendto(data, (host, port))
            try:
                balasan, _ = s.recvfrom(65535)
                return balasan
            except socket.timeout:
                continue
    raise TimeoutError(f"tidak ada balasan dari {host}:{port} setelah {ulang} percobaan")


# --- TCP dan framing ------------------------------------------------------------

def terima_tepat(sock: socket.socket, n: int) -> bytes:
    """Baca TEPAT n byte. recv() boleh mengembalikan lebih sedikit dari yang diminta,
    jadi kita ulangi. Lempar ConnectionError bila koneksi ditutup di tengah jalan."""
    potongan = bytearray()
    while len(potongan) < n:
        b = sock.recv(n - len(potongan))
        if not b:
            raise ConnectionError(f"koneksi ditutup setelah {len(potongan)} dari {n} byte")
        potongan += b
    return bytes(potongan)


def kirim_pesan(sock: socket.socket, data: bytes) -> None:
    """Framing panjang-awalan: 4 byte panjang (big-endian) lalu isi pesan.
    TCP adalah byte stream tanpa batas pesan, jadi batas itu kita buat sendiri."""
    sock.sendall(struct.pack("!I", len(data)) + data)


def terima_pesan(sock: socket.socket) -> bytes:
    (panjang,) = struct.unpack("!I", terima_tepat(sock, 4))
    return terima_tepat(sock, panjang)


def tcp_echo_layani(sock_dengar: socket.socket) -> int:
    """Terima SATU koneksi, lalu gemakan setiap pesan (berframing) sampai klien menutup
    koneksi. Kembalikan jumlah pesan yang digemakan."""
    koneksi, _ = sock_dengar.accept()
    jumlah = 0
    with koneksi:
        while True:
            try:
                pesan = terima_pesan(koneksi)
            except ConnectionError:
                return jumlah
            kirim_pesan(koneksi, pesan)
            jumlah += 1


# --- HTTP/1.1 mentah ------------------------------------------------------------

@dataclass
class ResponsHTTP:
    versi: str
    status: int
    alasan: str
    header: dict[str, str] = field(default_factory=dict)  # nama header huruf kecil
    body: bytes = b""


def buat_request_get(host: str, path: str = "/", header_tambahan: dict[str, str] | None = None) -> bytes:
    baris = [f"GET {path} HTTP/1.1", f"Host: {host}", "User-Agent: lab07-belajar-networking/1.0",
             "Accept: */*", "Connection: close"]
    for k, v in (header_tambahan or {}).items():
        baris.append(f"{k}: {v}")
    return ("\r\n".join(baris) + "\r\n\r\n").encode("ascii")


def _dekode_chunked(data: bytes) -> bytes:
    """Transfer-Encoding: chunked (RFC 9112 bagian 7.1): <ukuran-hex>[;ext]\\r\\n<data>\\r\\n ...
    diakhiri chunk berukuran 0 (boleh diikuti trailer)."""
    keluar = bytearray()
    pos = 0
    while True:
        akhir_baris = data.index(b"\r\n", pos)
        ukuran = int(data[pos:akhir_baris].split(b";")[0].strip(), 16)
        pos = akhir_baris + 2
        if ukuran == 0:
            return bytes(keluar)
        if pos + ukuran + 2 > len(data):
            raise ValueError("chunk terpotong")
        keluar += data[pos:pos + ukuran]
        pos += ukuran
        if data[pos:pos + 2] != b"\r\n":
            raise ValueError("chunk tidak diakhiri CRLF")
        pos += 2


def urai_respons_http(mentah: bytes) -> ResponsHTTP:
    """Urai respons HTTP/1.1 lengkap (koneksi sudah ditutup server)."""
    pisah = mentah.find(b"\r\n\r\n")
    if pisah < 0:
        raise ValueError("header HTTP tidak lengkap")
    baris = mentah[:pisah].decode("iso-8859-1").split("\r\n")
    versi, status, *alasan = baris[0].split(" ", 2)
    if not versi.startswith("HTTP/"):
        raise ValueError(f"status line tidak sah: {baris[0]!r}")
    header: dict[str, str] = {}
    for b in baris[1:]:
        nama, _, nilai = b.partition(":")
        nama = nama.strip().lower()
        nilai = nilai.strip()
        header[nama] = f"{header[nama]}, {nilai}" if nama in header else nilai
    sisa = mentah[pisah + 4:]
    if "chunked" in header.get("transfer-encoding", "").lower():
        body = _dekode_chunked(sisa)
    elif "content-length" in header:
        n = int(header["content-length"])
        if len(sisa) < n:
            raise ValueError(f"body terpotong: {len(sisa)} dari {n} byte")
        body = sisa[:n]
    else:
        body = sisa
    return ResponsHTTP(versi, int(status), alasan[0] if alasan else "", header, body)


def http_get(host: str, port: int = 80, path: str = "/", timeout: float = 5.0) -> ResponsHTTP:
    """GET memakai socket TCP mentah. Karena request memakai 'Connection: close', kita
    cukup membaca sampai server menutup koneksi, lalu mengurai semuanya."""
    with socket.create_connection((host, port), timeout=timeout) as s:
        tampil_host = host if port == 80 else f"{host}:{port}"
        s.sendall(buat_request_get(tampil_host, path))
        potongan = []
        while True:
            b = s.recv(65536)
            if not b:
                break
            potongan.append(b)
    return urai_respons_http(b"".join(potongan))
