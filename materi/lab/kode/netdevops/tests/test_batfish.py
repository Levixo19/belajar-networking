# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Uji pra-deploy dengan Batfish: konfigurasi diuji SEBELUM menyentuh perangkat.

Setiap uji adalah satu "janji" jaringan yang ditulis sebagai kode. Bedanya
dengan ping: ping memeriksa SATU paket pada SATU keadaan, sedangkan Batfish
memeriksa SEMUA paket yang cocok dengan kriteria, termasuk pada keadaan
gagal yang kita simulasikan (fork_snapshot).

Jalankan: pytest -v tests/test_batfish.py   (Batfish harus sudah berjalan)
"""
from __future__ import annotations

import os

import pytest
from pybatfish.datamodel import HeaderConstraints

# Baris yang DIKETAHUI tidak dimodelkan Batfish dan aman diabaikan.
# Setiap tambahan ke daftar ini harus lewat review: ia mengurangi apa yang diuji.
ALLOWED_UNRECOGNIZED = {"log stdout"}
SUCCESS = {"ACCEPTED", "DELIVERED_TO_SUBNET", "EXITS_NETWORK"}


def host_ip(intent: dict, name: str) -> str:
    for i in intent["devices"][name]["interfaces"]:
        if i["kind"] == "host":
            return i["ip"].split("/")[0]
    raise KeyError(name)


def prefixes_of(intent: dict, role: str) -> list[str]:
    return [p["prefix"] for p in intent["prefixes"] if p["role"] == role]


# ---------------------------------------------------------------- kebersihan
def test_semua_konfigurasi_terbaca(bf):
    status = bf.q.fileParseStatus().answer().frame()
    failed = status[status["Status"] == "FAILED"]
    assert failed.empty, f"berkas gagal di-parse:\n{failed.to_string()}"
    warns = bf.q.parseWarning(aggregateDuplicates=True).answer().frame()
    if not warns.empty:
        unexpected = warns[~warns["Text"].str.strip().isin(ALLOWED_UNRECOGNIZED)]
        assert unexpected.empty, f"baris tidak dikenali Batfish:\n{unexpected.to_string()}"


def test_tidak_ada_referensi_tak_terdefinisi(bf):
    # Misalnya route-map yang memanggil prefix-list yang tidak pernah dibuat.
    bf.asserts.assert_no_undefined_references()


def test_router_id_unik(bf):
    bf.asserts.assert_no_duplicate_router_ids()


# ---------------------------------------------------------------- routing
def test_semua_adjacency_ospf_terbentuk(bf, intent):
    devs = intent["devices"]
    expected = set()
    for name, dev in devs.items():
        if dev["platform"] != "frr":
            continue
        for i in dev["interfaces"]:
            if i["kind"] == "p2p" and i["enabled"] and i["peer"]:
                pdev, pif = i["peer"].split(":", 1)
                peer = next(x for x in devs[pdev]["interfaces"] if x["name"] == pif)
                if devs[pdev]["platform"] == "frr" and peer["enabled"]:
                    expected.add((name, i["name"]))
    edges = bf.q.ospfEdges().answer().frame()
    got = {(e.hostname, e.interface) for e in edges["Interface"]}
    missing = sorted(expected - got)
    assert not missing, f"adjacency OSPF yang seharusnya ada tetapi tidak terbentuk: {missing}"


def test_sesi_ospf_kompatibel(bf):
    bf.asserts.assert_no_incompatible_ospf_sessions()


def test_tanpa_forwarding_loop(bf):
    bf.asserts.assert_no_forwarding_loops()


# ---------------------------------------------------------------- layanan & keamanan
def test_pengguna_bisa_membuka_web(bf, intent):
    bf.asserts.assert_flows_succeed(
        startLocation="h1",
        headers=HeaderConstraints(dstIps=host_ip(intent, "srv1"), applications=["http", "https"]),
    )


def test_pengguna_tidak_bisa_ssh_ke_server(bf, intent):
    bf.asserts.assert_flows_fail(
        startLocation="h1",
        headers=HeaderConstraints(dstIps=host_ip(intent, "srv1"), applications=["ssh"]),
    )


def test_noc_bisa_ssh_ke_server(bf, intent):
    bf.asserts.assert_flows_succeed(
        startLocation="noc1",
        headers=HeaderConstraints(dstIps=host_ip(intent, "srv1"), applications=["ssh"]),
    )


def test_firewall_ssh_hanya_dari_noc(bf, intent):
    """Bukti untuk SEMUA alamat sumber, bukan hanya h1: tidak ada satu pun
    alamat di luar prefix NOC yang diizinkan SSH oleh firewall srv1."""
    noc = prefixes_of(intent, "noc")
    outside = "0.0.0.0/0 \\ " + ", ".join(noc)
    ans = bf.q.searchFilters(
        nodes="srv1",
        filters="/INPUT/",
        headers=HeaderConstraints(srcIps=outside, ipProtocols=["tcp"], dstPorts="22"),
        action="permit",
    ).answer().frame()
    assert ans.empty, f"ada sumber non-NOC yang diizinkan SSH:\n{ans.to_string()}"


def test_firewall_tanpa_aturan_mati(bf):
    # Aturan yang tidak pernah bisa cocok (tertutup aturan di atasnya) = tanda
    # kebijakan yang sudah tidak dipahami pemiliknya.
    bf.asserts.assert_filter_has_no_unreachable_lines(filters="/INPUT/")


# ---------------------------------------------------------------- ketahanan
@pytest.mark.parametrize("node", ["r1", "r2"])
def test_web_tetap_jalan_bila_satu_router_inti_mati(bf, intent, node):
    if node not in intent["devices"]:
        pytest.skip(f"{node} tidak ada di intent")
    name = f"gagal-{node}"
    bf.fork_snapshot("candidate", name, deactivate_nodes=[node], overwrite=True)
    bf.asserts.assert_flows_succeed(
        startLocation="h1",
        headers=HeaderConstraints(dstIps=host_ip(intent, "srv1"), applications=["https"]),
        snapshot=name,
    )


# ---------------------------------------------------------------- perubahan berisiko
def test_tidak_ada_reachability_yang_hilang(bf, has_baseline):
    """Bandingkan kandidat dengan baseline (konfigurasi cabang main).

    Flow yang sebelumnya SUKSES lalu GAGAL dianggap perubahan berisiko. Bila
    memang disengaja (mis. mematikan layanan lama), set
    IZINKAN_REACHABILITY_HILANG=1; di CI ini dilakukan lewat label PR.
    """
    if not has_baseline:
        pytest.skip("BF_BASELINE tidak di-set")
    diff = bf.q.differentialReachability().answer(
        snapshot="candidate", reference_snapshot="baseline"
    ).frame()
    lost = []
    for _, row in diff.iterrows():
        ref_ok = any(t.disposition in SUCCESS for t in row["Reference_Traces"])
        new_ok = any(t.disposition in SUCCESS for t in row["Snapshot_Traces"])
        if ref_ok and not new_ok:
            lost.append(str(row["Flow"]))
    gained = len(diff) - len(lost)
    print(f"flow berubah: {len(diff)} (hilang {len(lost)}, bertambah/berubah {gained})")
    if lost and os.environ.get("IZINKAN_REACHABILITY_HILANG") != "1":
        pytest.fail("reachability HILANG untuk flow berikut:\n" + "\n".join(lost[:20]))
