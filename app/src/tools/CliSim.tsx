import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CircleIcon } from '@phosphor-icons/react'

type Task = { id: string; desc: string; test: RegExp; out: string }
type Platform = { key: string; name: string; prompt: string; tasks: Task[]; help: string[] }
export interface Scenario { title: string; brief: string; platforms: Platform[] }

export const SCENARIOS: Record<string, Scenario> = {
  'ip-dasar': {
    title: 'Beri alamat IP ke sebuah interface',
    brief: 'Interface pertama router harus mendapat 192.168.1.1/24 dan dinyalakan. Ketik perintahnya di terminal.',
    platforms: [
      { key: 'cisco', name: 'Cisco IOS', prompt: 'R1(config)#', help: ['interface g0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown'],
        tasks: [
          { id: 'int', desc: 'Masuk ke mode interface', test: /^int(erface)?\s+\S+/i, out: 'R1(config-if)#' },
          { id: 'ip', desc: 'Pasang IP 192.168.1.1 mask 255.255.255.0', test: /^ip\s+addr(ess)?\s+192\.168\.1\.1\s+255\.255\.255\.0/i, out: '% alamat diterapkan' },
          { id: 'up', desc: 'Nyalakan interface', test: /^no\s+shut(down)?/i, out: '%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up' },
        ] },
      { key: 'mikrotik', name: 'MikroTik RouterOS', prompt: '[admin@MikroTik] >', help: ['/ip address add address=192.168.1.1/24 interface=ether1', '/interface enable ether1'],
        tasks: [
          { id: 'ip', desc: 'Tambahkan address 192.168.1.1/24 ke ether1', test: /^\/?ip\s+address\s+add\s+.*address=192\.168\.1\.1\/24.*interface=ether1/i, out: 'address ditambahkan' },
          { id: 'up', desc: 'Pastikan ether1 aktif', test: /^\/?interface\s+(enable|set)\s+.*ether1/i, out: 'ether1 enabled' },
        ] },
      { key: 'linux', name: 'Linux (iproute2)', prompt: 'root@srv:~#', help: ['ip addr add 192.168.1.1/24 dev eth0', 'ip link set eth0 up'],
        tasks: [
          { id: 'ip', desc: 'Tambahkan 192.168.1.1/24 ke eth0', test: /^ip\s+a(ddr)?\s+add\s+192\.168\.1\.1\/24\s+dev\s+\S+/i, out: '' },
          { id: 'up', desc: 'Naikkan interface', test: /^ip\s+l(ink)?\s+set\s+\S+\s+up/i, out: '' },
        ] },
    ],
  },
  'vlan': {
    title: 'Buat VLAN 10 dan jadikan satu port sebagai access',
    brief: 'VLAN 10 bernama SERVER, lalu port pertama dipakai host di VLAN itu.',
    platforms: [
      { key: 'cisco', name: 'Cisco IOS', prompt: 'SW1(config)#', help: ['vlan 10', 'name SERVER', 'interface f0/1', 'switchport mode access', 'switchport access vlan 10'],
        tasks: [
          { id: 'vlan', desc: 'Buat VLAN 10', test: /^vlan\s+10$/i, out: 'SW1(config-vlan)#' },
          { id: 'name', desc: 'Beri nama SERVER', test: /^name\s+SERVER/i, out: '' },
          { id: 'int', desc: 'Masuk ke interface port', test: /^int(erface)?\s+\S+/i, out: 'SW1(config-if)#' },
          { id: 'mode', desc: 'Set mode access', test: /^sw(itchport)?\s+mode\s+access/i, out: '' },
          { id: 'acc', desc: 'Masukkan port ke VLAN 10', test: /^sw(itchport)?\s+access\s+vlan\s+10/i, out: '' },
        ] },
      { key: 'mikrotik', name: 'MikroTik RouterOS', prompt: '[admin@MikroTik] >', help: ['/interface bridge vlan add bridge=bridge1 vlan-ids=10 untagged=ether2', '/interface bridge port set [find interface=ether2] pvid=10'],
        tasks: [
          { id: 'vlan', desc: 'Daftarkan VLAN 10 di bridge', test: /^\/?interface\s+bridge\s+vlan\s+add\s+.*vlan-ids=10/i, out: 'vlan entry ditambahkan' },
          { id: 'pvid', desc: 'Set PVID port ke 10', test: /^\/?interface\s+bridge\s+port\s+set\s+.*pvid=10/i, out: 'pvid diterapkan' },
        ] },
      { key: 'linux', name: 'Linux', prompt: 'root@srv:~#', help: ['ip link add link eth0 name eth0.10 type vlan id 10', 'ip link set eth0.10 up'],
        tasks: [
          { id: 'add', desc: 'Buat sub-interface VLAN 10', test: /^ip\s+link\s+add\s+link\s+\S+\s+name\s+\S+\s+type\s+vlan\s+id\s+10/i, out: '' },
          { id: 'up', desc: 'Naikkan sub-interface', test: /^ip\s+link\s+set\s+\S+\.10\s+up/i, out: '' },
        ] },
    ],
  },
  'diagnosa': {
    title: 'Diagnosa "tidak bisa internet" secara berlapis',
    brief: 'Jalankan perintah pemeriksaan dari layer bawah ke atas. Tidak ada urutan yang salah, tapi lengkapi semuanya.',
    platforms: [
      { key: 'linux', name: 'Linux', prompt: 'user@pc:~$', help: ['ip link', 'ip addr', 'ip route', 'ping 8.8.8.8', 'dig google.com'],
        tasks: [
          { id: 'l1', desc: 'L1/L2: apakah interface UP?', test: /^ip\s+l(ink)?\b/i, out: '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP' },
          { id: 'l3a', desc: 'L3: apakah punya IP?', test: /^ip\s+a(ddr)?\b/i, out: 'inet 192.168.1.50/24 scope global eth0' },
          { id: 'l3b', desc: 'L3: apakah ada default route?', test: /^ip\s+r(oute)?\b/i, out: 'default via 192.168.1.1 dev eth0' },
          { id: 'icmp', desc: 'Uji jangkauan ke luar tanpa DNS', test: /^ping\s+(8\.8\.8\.8|1\.1\.1\.1)/i, out: '64 bytes from 8.8.8.8: icmp_seq=1 ttl=115 time=18.2 ms' },
          { id: 'dns', desc: 'L7: apakah resolusi nama jalan?', test: /^(dig|nslookup|host)\s+\S+/i, out: 'google.com. 300 IN A 142.250.4.100' },
        ] },
      { key: 'cisco', name: 'Cisco IOS', prompt: 'R1#', help: ['show ip interface brief', 'show ip route', 'ping 8.8.8.8', 'show ip arp'],
        tasks: [
          { id: 'int', desc: 'Ringkasan status semua interface', test: /^sh(ow)?\s+ip\s+int(erface)?\s+br(ief)?/i, out: 'Gi0/0  192.168.1.1  YES manual up  up' },
          { id: 'route', desc: 'Periksa tabel routing', test: /^sh(ow)?\s+ip\s+route/i, out: 'S*  0.0.0.0/0 [1/0] via 203.0.113.1' },
          { id: 'arp', desc: 'Periksa tetangga L2', test: /^sh(ow)?\s+ip\s+arp/i, out: 'Internet 192.168.1.50  0  aabb.cc00.0100  ARPA' },
          { id: 'ping', desc: 'Uji jangkauan', test: /^ping\s+\S+/i, out: '!!!!! Success rate is 100 percent (5/5)' },
        ] },
      { key: 'mikrotik', name: 'MikroTik RouterOS', prompt: '[admin@MikroTik] >', help: ['/interface print', '/ip address print', '/ip route print', '/ping 8.8.8.8'],
        tasks: [
          { id: 'int', desc: 'Status interface', test: /^\/?interface\s+print/i, out: '0  R ether1  ether  1500' },
          { id: 'addr', desc: 'Daftar alamat', test: /^\/?ip\s+address\s+print/i, out: '0  192.168.1.1/24  192.168.1.0  ether1' },
          { id: 'route', desc: 'Tabel routing', test: /^\/?ip\s+route\s+print/i, out: '0 A S  0.0.0.0/0  203.0.113.1  1' },
          { id: 'ping', desc: 'Uji jangkauan', test: /^\/?ping\s+\S+/i, out: 'SEQ HOST  SIZE TTL TIME\n  0 8.8.8.8  56 115 18ms' },
        ] },
    ],
  },
}

export default function CliSim({ scenario = 'ip-dasar' }: { scenario?: string }) {
  const sc = SCENARIOS[scenario] || SCENARIOS['ip-dasar']
  const [pi, setPi] = useState(0)
  const p = sc.platforms[pi]
  const [lines, setLines] = useState<{ t: 'in' | 'out' | 'err'; s: string }[]>([])
  const [done, setDone] = useState<Set<string>>(new Set())
  const [val, setVal] = useState('')
  const [hint, setHint] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setLines([]); setDone(new Set()); setVal(''); setHint(false) }, [pi, scenario])
  useEffect(() => { boxRef.current?.scrollTo({ top: 1e6 }) }, [lines])

  function run() {
    const cmd = val.trim()
    if (!cmd) return
    setVal('')
    const out: { t: 'in' | 'out' | 'err'; s: string }[] = [{ t: 'in', s: `${p.prompt} ${cmd}` }]
    const hitTask = p.tasks.find(t => t.test.test(cmd))
    if (hitTask) {
      if (hitTask.out) out.push({ t: 'out', s: hitTask.out })
      setDone(d => new Set(d).add(hitTask.id))
    } else if (/^(\?|help)$/i.test(cmd)) {
      out.push({ t: 'out', s: p.help.map(h => '  ' + h).join('\n') })
    } else if (/^(cls|clear)$/i.test(cmd)) {
      setLines([]); return
    } else {
      out.push({ t: 'err', s: '% perintah tidak dikenali di simulator ini. Ketik ? untuk melihat contoh' })
    }
    setLines(l => [...l, ...out])
  }

  const all = done.size === p.tasks.length
  return (
    <div className="cli">
      <div className="cli-head">
        <div className="cli-tabs">
          {sc.platforms.map((pl, i) => (
            <button key={pl.key} onClick={() => setPi(i)} className={`cli-tab ${i === pi ? 'on' : ''}`}>{pl.name}</button>
          ))}
        </div>
        <button className="cli-hint-btn" onClick={() => setHint(h => !h)}>{hint ? 'Sembunyikan contoh' : 'Butuh contoh?'}</button>
      </div>
      <div className="cli-brief"><b>{sc.title}</b><span>{sc.brief}</span></div>
      <div className="cli-tasks">
        {p.tasks.map(t => (
          <div key={t.id} className={`cli-task ${done.has(t.id) ? 'ok' : ''}`}>
            <i>{done.has(t.id) ? <CheckIcon size={13} aria-hidden="true" /> : <CircleIcon size={11} aria-hidden="true" />}</i>{t.desc}
          </div>
        ))}
      </div>
      {hint && <pre className="cli-help">{p.help.join('\n')}</pre>}
      <div className="cli-term" ref={boxRef}>
        {lines.length === 0 && <div className="cli-ph">Ketik perintah lalu tekan Enter. Ketik <b>?</b> kalau macet.</div>}
        {lines.map((l, i) => <div key={i} className={`cli-l ${l.t}`}>{l.s}</div>)}
        <div className="cli-in">
          <span className="cli-prompt">{p.prompt}</span>
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
            spellCheck={false} autoComplete="off" aria-label="Perintah" />
        </div>
      </div>
      {all && <div className="cli-win pop">Semua langkah selesai di {p.name}. Coba tab platform lain: perintahnya beda, logikanya sama.</div>}
    </div>
  )
}
