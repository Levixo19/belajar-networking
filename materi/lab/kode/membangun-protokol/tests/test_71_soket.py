# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Uji Lab 7.1: socket UDP/TCP dan klien HTTP mentah. Semua lalu lintas di 127.0.0.1."""

import http.server
import socket
import threading

import pytest


def _thread(fungsi, *arg):
    t = threading.Thread(target=fungsi, args=arg, daemon=True)
    t.start()
    return t


# --- UDP ------------------------------------------------------------------------

def test_udp_echo_dan_kirim_terima(soket):
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as server:
        server.bind(("127.0.0.1", 0))
        port = server.getsockname()[1]
        _thread(soket.udp_echo_sekali, server)
        assert soket.udp_kirim_terima("127.0.0.1", port, b"halo udp", timeout=2.0) == b"halo udp"


def test_udp_kirim_terima_mencoba_ulang_lalu_menyerah(soket):
    # Socket yang di-bind tapi tidak pernah menjawab: seperti server yang paketnya hilang.
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as diam:
        diam.bind(("127.0.0.1", 0))
        port = diam.getsockname()[1]
        with pytest.raises(TimeoutError):
            soket.udp_kirim_terima("127.0.0.1", port, b"ping", timeout=0.1, ulang=3)
        # Tiga percobaan berarti tiga datagram sampai di server.
        diam.settimeout(0.5)
        diterima = [diam.recvfrom(100)[0] for _ in range(3)]
        assert diterima == [b"ping"] * 3


# --- TCP + framing --------------------------------------------------------------

class SoketPelit:
    """Pembungkus socket yang hanya mengembalikan paling banyak 3 byte per recv(),
    meniru TCP yang memecah aliran byte sesukanya."""

    def __init__(self, data: bytes):
        self.data = data

    def recv(self, n):
        potong, self.data = self.data[:min(n, 3)], self.data[min(n, 3):]
        return potong


def test_terima_tepat_menggabungkan_recv_pendek(soket):
    assert soket.terima_tepat(SoketPelit(b"ABCDEFGHIJ"), 7) == b"ABCDEFG"


def test_terima_tepat_koneksi_putus(soket):
    with pytest.raises(ConnectionError):
        soket.terima_tepat(SoketPelit(b"ABC"), 10)


def test_terima_pesan_dari_aliran_terpecah(soket):
    aliran = b"\x00\x00\x00\x04HALO" + b"\x00\x00\x00\x05DUNIA" + b"\x00\x00\x00\x00"
    s = SoketPelit(aliran)
    assert soket.terima_pesan(s) == b"HALO"
    assert soket.terima_pesan(s) == b"DUNIA"
    assert soket.terima_pesan(s) == b""


def test_tcp_echo_dengan_framing(soket):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as dengar:
        dengar.bind(("127.0.0.1", 0))
        dengar.listen(1)
        port = dengar.getsockname()[1]
        hasil = {}
        t = _thread(lambda: hasil.setdefault("n", soket.tcp_echo_layani(dengar)))
        pesan = [b"satu", b"", b"x" * 100_000, "salam dari Makassar".encode()]
        with socket.create_connection(("127.0.0.1", port), timeout=5) as k:
            for p in pesan:
                soket.kirim_pesan(k, p)
            for p in pesan:
                assert soket.terima_pesan(k) == p
        t.join(timeout=5)
        assert hasil["n"] == len(pesan)


# --- HTTP -----------------------------------------------------------------------

def test_buat_request_get_format(soket):
    req = soket.buat_request_get("contoh.test", "/a?b=1")
    assert req.startswith(b"GET /a?b=1 HTTP/1.1\r\n")
    assert b"\r\nHost: contoh.test\r\n" in req
    assert b"\r\nConnection: close\r\n" in req
    assert req.endswith(b"\r\n\r\n")


def test_urai_respons_content_length(soket):
    mentah = (b"HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n"
              b"Content-Length: 5\r\nX-Satu: a\r\nx-satu: b\r\n\r\nhilangSISA")
    r = soket.urai_respons_http(mentah)
    assert (r.versi, r.status, r.alasan) == ("HTTP/1.1", 404, "Not Found")
    assert r.header["content-type"] == "text/plain"
    assert r.header["x-satu"] == "a, b"
    assert r.body == b"hilan"


def test_urai_respons_chunked(soket):
    mentah = (b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n"
              b"4\r\nWiki\r\n6;ext=1\r\npedia \r\nE\r\nin \r\n\r\nchunks.\r\n0\r\n\r\n")
    r = soket.urai_respons_http(mentah)
    assert r.status == 200
    assert r.body == b"Wikipedia in \r\n\r\nchunks."


def test_urai_respons_tanpa_panjang_dibaca_sampai_tutup(soket):
    r = soket.urai_respons_http(b"HTTP/1.0 200 OK\r\nServer: kuno\r\n\r\nisi apa adanya")
    assert r.body == b"isi apa adanya"


def test_urai_respons_rusak(soket):
    with pytest.raises(ValueError):
        soket.urai_respons_http(b"HTTP/1.1 200 OK\r\nContent-Length: 10\r\n")


class _Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        body = f"path={self.path} host={self.headers['Host']}".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


def test_http_get_ke_server_lokal(soket):
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    _thread(server.serve_forever)
    try:
        port = server.server_address[1]
        r = soket.http_get("127.0.0.1", port, "/uji/lab7", timeout=5)
        assert r.status == 200
        assert r.body == f"path=/uji/lab7 host=127.0.0.1:{port}".encode()
    finally:
        server.shutdown()
        server.server_close()


def test_http_get_chunked_dari_server_mentah(soket):
    respons = (b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n"
               b"5\r\nhalo \r\n5\r\ndunia\r\n0\r\n\r\n")
    with socket.socket() as dengar:
        dengar.bind(("127.0.0.1", 0))
        dengar.listen(1)
        port = dengar.getsockname()[1]
        diterima = {}

        def layani():
            k, _ = dengar.accept()
            with k:
                req = b""
                while b"\r\n\r\n" not in req:
                    req += k.recv(4096)
                diterima["req"] = req
                for i in range(0, len(respons), 7):   # kirim sepotong-sepotong
                    k.sendall(respons[i:i + 7])

        _thread(layani)
        r = soket.http_get("127.0.0.1", port, "/", timeout=5)
    assert r.body == b"halo dunia"
    assert diterima["req"].startswith(b"GET / HTTP/1.1\r\n")
