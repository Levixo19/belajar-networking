# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.1 (STARTER): socket UDP/TCP dasar dan klien HTTP/1.1 mentah.

Aturan main: hanya modul `socket` dan `struct`. Dilarang memakai http.client, urllib,
requests, atau library HTTP lain di klien. Uji: pytest --impl=starter tests/test_71_soket.py
"""

from __future__ import annotations

import socket
import struct
from dataclasses import dataclass, field


# --- UDP ------------------------------------------------------------------------

def udp_echo_sekali(sock: socket.socket) -> tuple[str, int]:
    """Terima SATU datagram lalu kirim balik isinya ke pengirim. Kembalikan alamat
    pengirim. (Contoh yang sudah jadi: pelajari pola recvfrom/sendto di sini.)"""
    data, alamat = sock.recvfrom(65535)
    sock.sendto(data, alamat)
    return alamat


def udp_kirim_terima(host: str, port: int, data: bytes, timeout: float = 1.0, ulang: int = 3) -> bytes:
    """Kirim datagram dan tunggu balasan, maksimal `ulang` kali percobaan.

    TODO 7.1a:
      - buat socket AF_INET/SOCK_DGRAM (pakai `with`), pasang settimeout(timeout)
      - ulangi: sendto, lalu recvfrom; tangkap socket.timeout dan coba lagi
      - bila semua percobaan habis, lempar TimeoutError
    """
    raise NotImplementedError("TODO 7.1a: udp_kirim_terima")


# --- TCP dan framing ------------------------------------------------------------

def terima_tepat(sock: socket.socket, n: int) -> bytes:
    """Baca TEPAT n byte dari socket TCP.

    TODO 7.1b: recv(k) boleh mengembalikan KURANG dari k byte. Ulangi sampai terkumpul
    n byte. recv() yang mengembalikan b"" berarti koneksi ditutup: lempar ConnectionError.
    """
    raise NotImplementedError("TODO 7.1b: terima_tepat")


def kirim_pesan(sock: socket.socket, data: bytes) -> None:
    """TODO 7.1c: kirim 4 byte panjang (struct "!I") diikuti isi, memakai sendall()."""
    raise NotImplementedError("TODO 7.1c: kirim_pesan")


def terima_pesan(sock: socket.socket) -> bytes:
    """TODO 7.1c: baca 4 byte panjang dengan terima_tepat, lalu baca isinya."""
    raise NotImplementedError("TODO 7.1c: terima_pesan")


def tcp_echo_layani(sock_dengar: socket.socket) -> int:
    """Terima SATU koneksi (accept), gemakan setiap pesan berframing sampai klien menutup
    koneksi (terima_pesan melempar ConnectionError), lalu kembalikan jumlah pesan.

    TODO 7.1d
    """
    raise NotImplementedError("TODO 7.1d: tcp_echo_layani")


# --- HTTP/1.1 mentah ------------------------------------------------------------

@dataclass
class ResponsHTTP:
    versi: str
    status: int
    alasan: str
    header: dict[str, str] = field(default_factory=dict)  # nama header huruf kecil
    body: bytes = b""


def buat_request_get(host: str, path: str = "/", header_tambahan: dict[str, str] | None = None) -> bytes:
    """TODO 7.1e: susun request GET HTTP/1.1. Wajib: request line, header Host, dan
    'Connection: close'. Setiap baris diakhiri CRLF (\\r\\n), header diakhiri baris kosong."""
    raise NotImplementedError("TODO 7.1e: buat_request_get")


def _dekode_chunked(data: bytes) -> bytes:
    """TODO 7.1f: dekode Transfer-Encoding chunked.
    Format: <ukuran-hex>[;ekstensi]\\r\\n<data>\\r\\n ... 0\\r\\n\\r\\n"""
    raise NotImplementedError("TODO 7.1f: _dekode_chunked")


def urai_respons_http(mentah: bytes) -> ResponsHTTP:
    """TODO 7.1g: urai respons lengkap.
      1. pisahkan header dan body pada b"\\r\\n\\r\\n" (tidak ada -> ValueError)
      2. baris pertama: "HTTP/1.1 200 OK" -> versi, status (int), alasan
      3. header: nama huruf kecil; header berulang digabung dengan ", "
      4. body: chunked -> _dekode_chunked; Content-Length -> ambil tepat sepanjang itu
         (kurang -> ValueError); selain itu -> semua sisa data
    """
    raise NotImplementedError("TODO 7.1g: urai_respons_http")


def http_get(host: str, port: int = 80, path: str = "/", timeout: float = 5.0) -> ResponsHTTP:
    """TODO 7.1h: socket.create_connection, kirim request (Host = "host:port" bila port
    bukan 80), baca sampai recv() mengembalikan b"", lalu urai_respons_http."""
    raise NotImplementedError("TODO 7.1h: http_get")
