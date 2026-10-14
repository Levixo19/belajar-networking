# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Task Nornir untuk deploy, rollback, dan pemeriksaan Lab 08.

Tiap platform punya "mesin" berbeda di bawah Nornir:
  frr       netmiko (SSH, shell root) + frr-reload.py bawaan FRR
  srlinux   napalm-srlinux (JSON-RPC): kandidat, diff, commit, checkpoint
  linux     docker exec (jalan pintas lab untuk host; di produksi server
            biasanya dikelola tim sistem dengan alat lain)

Semua task deploy menyimpan cadangan konfigurasi SEBELUM mengubah apa pun
di host.data["_backup"], lalu menandai host.data["_applied"] = True bila
perubahan benar-benar diterapkan. rollback_host() memakai keduanya.
"""
from __future__ import annotations

import difflib
import json
import re
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from nornir.core.task import Result, Task
from nornir_napalm.plugins.tasks import napalm_configure, napalm_get, napalm_rollback

FRR_RELOAD = "/usr/lib/frr/frr-reload.py"
REMOTE_CANDIDATE = "/tmp/netdevops-candidate.conf"
REMOTE_ROLLBACK = "/tmp/netdevops-rollback.conf"
BACKUP_DIR = Path("build/backups")
LOG_LINE = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d+ ")
RUN_ID = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")


# --------------------------------------------------------------------------
# Utilitas
# --------------------------------------------------------------------------
def save_backup(host: str, suffix: str, text: str) -> Path:
    path = BACKUP_DIR / RUN_ID / f"{host}.{suffix}"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def frr_sh(conn: Any, cmd: str, timeout: int = 60) -> tuple[int, str]:
    """Jalankan perintah shell lewat netmiko dan kembalikan (exit code, output)."""
    out = conn.send_command(f"{cmd}; echo __RC=$?", read_timeout=timeout)
    m = re.search(r"__RC=(\d+)\s*$", out)
    if not m:
        return 255, out
    return int(m.group(1)), out[: m.start()].rstrip()


def frr_upload(conn: Any, text: str, path: str) -> None:
    """Unggah berkas lewat SFTP memakai sesi SSH yang sama dengan netmiko.

    remote_conn_pre adalah paramiko.SSHClient milik netmiko. Image FRR
    containerlab memasang paket openssh Alpine yang sudah menyertakan sftp-server.
    """
    sftp = conn.remote_conn_pre.open_sftp()
    try:
        with sftp.open(path, "wb") as fh:
            fh.write(text.encode("utf-8"))
    finally:
        sftp.close()


def frr_running(conn: Any) -> str:
    rc, out = frr_sh(conn, "vtysh -c 'show running-config'")
    if rc != 0:
        raise RuntimeError(f"gagal membaca running-config:\n{out}")
    # Buang "Building configuration..." dst. agar berkas bisa dimuat ulang.
    idx = out.find("frr version")
    return (out[idx:] if idx >= 0 else out).rstrip() + "\n"


def parse_reload_test(out: str) -> str:
    """Ubah keluaran 'frr-reload.py --test' menjadi diff bergaya +/-."""
    lines, mode = [], None
    for raw in out.splitlines():
        line = raw.rstrip()
        if LOG_LINE.match(line):
            continue  # baris log frr-reload, bukan bagian diff
        if line.startswith("Lines To Delete"):
            mode = "-"
            continue
        if line.startswith("Lines To Add"):
            mode = "+"
            continue
        if not line or set(line) == {"="} or mode is None:
            continue
        lines.append(f"{mode} {line}")
    return "\n".join(lines)


def frr_apply(conn: Any, text: str, remote_path: str) -> str:
    frr_upload(conn, text, remote_path)
    rc, out = frr_sh(conn, f"python3 {FRR_RELOAD} --reload --stdout {remote_path}", timeout=180)
    if rc != 0:
        raise RuntimeError(f"frr-reload --reload gagal (rc={rc}):\n{out}")
    rc, wout = frr_sh(conn, "vtysh -c 'write memory'")
    if rc != 0:
        raise RuntimeError(f"write memory gagal:\n{wout}")
    return out


def docker(container: str, args: list[str], stdin: str | None = None, timeout: int = 30) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", "exec", "-i", container, *args],
        input=stdin,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )


def normalize_iptables(text: str) -> list[str]:
    """Samakan bentuk keluaran iptables-save dan berkas hasil render."""
    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        line = re.sub(r"\s\[\d+:\d+\]$", " [0:0]", line)
        line = re.sub(r" -m (tcp|udp|icmp)\b", "", line)
        out.append(line)
    return out


# --------------------------------------------------------------------------
# Deploy
# --------------------------------------------------------------------------
def deploy_host(task: Task, dry_run: bool = True, message: str = "netdevops") -> Result:
    nos = task.host["nos"]
    candidate = Path(task.host["config"]).read_text(encoding="utf-8")
    if nos == "frr":
        return _deploy_frr(task, candidate, dry_run)
    if nos == "srlinux":
        return _deploy_srl(task, candidate, dry_run, message)
    if nos == "linux":
        return _deploy_linux(task, candidate, dry_run)
    raise ValueError(f"platform {nos} tidak dikenal")


def _deploy_frr(task: Task, candidate: str, dry_run: bool) -> Result:
    conn = task.host.get_connection("netmiko", task.nornir.config)
    backup = frr_running(conn)
    task.host.data["_backup"] = backup
    save_backup(task.host.name, "frr.conf", backup)

    frr_upload(conn, candidate, REMOTE_CANDIDATE)
    rc, out = frr_sh(conn, f"python3 {FRR_RELOAD} --test --log-level error {REMOTE_CANDIDATE}", timeout=120)
    if rc != 0:
        # vtysh menolak kandidat: sintaks salah. Tidak ada yang diterapkan.
        raise RuntimeError(f"kandidat ditolak vtysh/frr-reload (rc={rc}):\n{out}")
    diff = parse_reload_test(out)
    if diff and not dry_run:
        frr_apply(conn, candidate, REMOTE_CANDIDATE)
        task.host.data["_applied"] = True
    return Result(host=task.host, diff=diff, changed=bool(diff))


def _deploy_srl(task: Task, candidate: str, dry_run: bool, message: str) -> Result:
    got = task.run(task=napalm_get, getters=["config"], name="cadangkan konfigurasi")
    running = (got.result or {}).get("config", {}).get("running", "")
    backup = running if isinstance(running, str) else json.dumps(running, indent=2)
    task.host.data["_backup"] = backup
    save_backup(task.host.name, "srl.json", backup)

    res = task.run(
        task=napalm_configure,
        configuration=candidate,
        dry_run=dry_run,
        commit_message=message,
        name="napalm_configure (merge)",
    )
    diff = res[0].diff or ""
    if diff and not dry_run:
        task.host.data["_applied"] = True
    return Result(host=task.host, diff=diff, changed=bool(diff))


def _deploy_linux(task: Task, candidate: str, dry_run: bool) -> Result:
    container = task.host["container"]
    cur = docker(container, ["iptables-save", "-t", "filter"])
    if cur.returncode != 0:
        raise RuntimeError(f"iptables-save gagal di {container}: {cur.stderr}")
    task.host.data["_backup"] = cur.stdout
    save_backup(task.host.name, "iptables", cur.stdout)

    diff = "\n".join(
        difflib.unified_diff(
            normalize_iptables(cur.stdout), normalize_iptables(candidate), "running", "candidate", lineterm=""
        )
    )
    if diff and not dry_run:
        res = docker(container, ["iptables-restore"], stdin=candidate)
        if res.returncode != 0:
            raise RuntimeError(f"iptables-restore gagal: {res.stderr}")
        task.host.data["_applied"] = True
    return Result(host=task.host, diff=diff, changed=bool(diff))


# --------------------------------------------------------------------------
# Rollback
# --------------------------------------------------------------------------
def rollback_host(task: Task) -> Result:
    if not task.host.data.get("_applied"):
        return Result(host=task.host, result="tidak ada perubahan yang perlu dibatalkan")
    nos = task.host["nos"]
    backup = task.host.data.get("_backup", "")
    if nos == "frr":
        conn = task.host.get_connection("netmiko", task.nornir.config)
        frr_apply(conn, backup, REMOTE_ROLLBACK)
    elif nos == "srlinux":
        # Mengembalikan checkpoint yang dibuat napalm-srlinux tepat sebelum commit.
        task.run(task=napalm_rollback, name="napalm_rollback")
    elif nos == "linux":
        res = docker(task.host["container"], ["iptables-restore"], stdin=backup)
        if res.returncode != 0:
            raise RuntimeError(f"iptables-restore (rollback) gagal: {res.stderr}")
    task.host.data["_applied"] = False
    return Result(host=task.host, changed=True, result="dikembalikan ke konfigurasi sebelum deploy")


# --------------------------------------------------------------------------
# Pemeriksaan pasca-deploy (dipakai juga oleh postcheck.py)
# --------------------------------------------------------------------------
def _expected_ospf_neighbors(intent: dict[str, Any], name: str) -> int:
    devs = intent["devices"]
    count = 0
    for i in devs[name]["interfaces"]:
        if i["kind"] != "p2p" or not i["enabled"] or not i["peer"]:
            continue
        pdev, pif = i["peer"].split(":", 1)
        peer = next((x for x in devs.get(pdev, {}).get("interfaces", []) if x["name"] == pif), None)
        if peer and peer["enabled"] and devs[pdev]["platform"] == "frr":
            count += 1
    return count


def _expected_prefixes(intent: dict[str, Any]) -> list[str]:
    out = []
    for dev in intent["devices"].values():
        if dev["platform"] != "frr":
            continue
        out.append(f"{dev['router_id']}/32")
        out.extend(dev["lan_prefixes"])
    return sorted(set(out))


def _json_or_empty(text: str) -> dict[str, Any]:
    """Router yang belum dikonfigurasi menjawab dengan teks biasa, bukan JSON."""
    try:
        data = json.loads(text)
    except ValueError:
        return {}
    return data if isinstance(data, dict) else {}


def check_host(task: Task, intent: dict[str, Any]) -> Result:
    """Kembalikan daftar dict {id, ok, detail} untuk satu perangkat."""
    nos = task.host["nos"]
    checks: list[dict[str, Any]] = []
    name = task.host.name
    if nos == "frr":
        conn = task.host.get_connection("netmiko", task.nornir.config)
        expected = _expected_ospf_neighbors(intent, name)
        rc, out = frr_sh(conn, "vtysh -c 'show ip ospf neighbor json'")
        full = 0
        data = _json_or_empty(out) if rc == 0 else {}
        if data:
            nbrs = data.get("neighbors", data)
            for entries in nbrs.values():
                for e in entries if isinstance(entries, list) else [entries]:
                    state = str(e.get("nbrState") or e.get("state") or e.get("converged") or "")
                    full += state.startswith("Full")
        checks.append(
            {"id": f"{name}:ospf-full", "ok": full >= expected, "detail": f"{full}/{expected} tetangga Full"}
        )
        rc, out = frr_sh(conn, "vtysh -c 'show ip route json'")
        table = _json_or_empty(out) if rc == 0 else {}
        for pfx in _expected_prefixes(intent):
            ok = any(r.get("selected") for r in table.get(pfx, []))
            checks.append({"id": f"{name}:route {pfx}", "ok": ok, "detail": "ada" if ok else "HILANG"})
    elif nos == "srlinux":
        got = task.run(task=napalm_get, getters=["interfaces"], name="ambil status interface")
        ifs = (got.result or {}).get("interfaces", {})
        for i in intent["devices"][name]["interfaces"]:
            if i["kind"] != "bridged" or not i["enabled"]:
                continue
            up = bool(ifs.get(i["name"], {}).get("is_up"))
            checks.append({"id": f"{name}:{i['name']} up", "ok": up, "detail": "up" if up else "DOWN"})
    return Result(host=task.host, result=checks)


# Uji layanan dari sudut pandang pengguna. Harus sejalan dengan tests/test_batfish.py:
# Batfish membuktikannya untuk SEMUA paket, probe ini memastikan perangkat nyata setuju.
SERVICE_PROBES = [
    # (sumber, tujuan, port, harus_terbuka)
    ("h1", "srv1", 80, True),
    ("h1", "srv1", 443, True),
    ("h1", "srv1", 22, False),
    ("noc1", "srv1", 22, True),
]


def host_ip(intent: dict[str, Any], name: str) -> str:
    for i in intent["devices"][name]["interfaces"]:
        if i["kind"] == "host":
            return i["ip"].split("/")[0]
    raise KeyError(f"{name} tidak punya alamat host")


def service_checks(intent: dict[str, Any], clab_prefix: str = "clab-netdevops") -> list[dict[str, Any]]:
    checks = []
    for src, dst, port, must_open in SERVICE_PROBES:
        ip = host_ip(intent, dst)
        res = docker(f"{clab_prefix}-{src}", ["nc", "-z", "-w", "2", ip, str(port)], timeout=15)
        is_open = res.returncode == 0
        checks.append(
            {
                "id": f"svc:{src}->{dst}:{port}",
                "ok": is_open == must_open,
                "detail": f"{'terbuka' if is_open else 'tertutup'} (harus {'terbuka' if must_open else 'tertutup'})",
            }
        )
    return checks


def run_checks(nr: Any, intent: dict[str, Any]) -> list[dict[str, Any]]:
    targets = nr.filter(filter_func=lambda h: h.get("nos") in ("frr", "srlinux"))
    res = targets.run(task=check_host, intent=intent, name="post-check")
    checks: list[dict[str, Any]] = []
    for host, mr in res.items():
        if mr.failed:
            checks.append({"id": f"{host}:reachable", "ok": False, "detail": str(mr.exception)})
        else:
            checks.extend(mr[0].result)
    checks.extend(service_checks(intent))
    return checks
