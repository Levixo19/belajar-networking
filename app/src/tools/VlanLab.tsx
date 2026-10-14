import { useState } from 'react'
import { DesktopIcon } from '@phosphor-icons/react'

const VLANS = [
  { id: 10, name: 'STAF', cls: 'v1' },
  { id: 20, name: 'TAMU', cls: 'v2' },
  { id: 30, name: 'SERVER', cls: 'v3' },
]
const HOSTS = ['PC-1', 'PC-2', 'PC-3', 'PC-4', 'PC-5', 'PC-6']

export default function VlanLab() {
  const [vlan, setVlan] = useState<number[]>([10, 10, 20, 20, 30, 10])
  const [a, setA] = useState<number | null>(null)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [routing, setRouting] = useState(false)

  function tapHost(i: number) {
    if (a === null) { setA(i); setResult(null); return }
    if (a === i) { setA(null); return }
    const same = vlan[a] === vlan[i]
    const ok = same || routing
    setResult({
      ok,
      msg: same
        ? `${HOSTS[a]} dan ${HOSTS[i]} sama-sama di VLAN ${vlan[a]}, jadi frame cukup lewat switch, tidak perlu router.`
        : routing
          ? `Beda VLAN (${vlan[a]} → ${vlan[i]}), tapi inter-VLAN routing aktif: paket naik ke router, dirutekan, lalu turun lagi.`
          : `${HOSTS[a]} di VLAN ${vlan[a]}, ${HOSTS[i]} di VLAN ${vlan[i]}. Switch tidak akan meneruskan, karena beda VLAN = beda domain broadcast.`,
    })
    setA(null)
  }

  return (
    <div className="vl">
      <div className="vl-head">
        <div>
          <div className="vl-title">Lab VLAN</div>
          <div className="vl-desc">Ubah VLAN tiap port, lalu klik dua PC untuk menguji apakah mereka bisa saling ping.</div>
        </div>
        <label className="vl-sw">
          <input type="checkbox" checked={routing} onChange={e => { setRouting(e.target.checked); setResult(null) }} />
          <span>Inter-VLAN routing</span>
        </label>
      </div>

      <div className="vl-stage">
        {routing && <div className="vl-router">Router / SVI<span>router-on-a-stick</span></div>}
        <div className="vl-switch">Switch<span>6 port access</span></div>
        <div className="vl-ports">
          {HOSTS.map((h, i) => {
            const v = VLANS.find(x => x.id === vlan[i])!
            return (
              <div key={h} className={`vl-port ${v.cls} ${a === i ? 'sel' : ''}`}>
                <button className="vl-host" onClick={() => tapHost(i)}>
                  <span className="vl-pc"><DesktopIcon size={18} aria-hidden="true" /></span>{h}
                  <em>10.0.{vlan[i]}.{i + 1}</em>
                </button>
                <div className="vl-pick">
                  {VLANS.map(x => (
                    <button key={x.id} onClick={() => { setVlan(p => p.map((q, j) => j === i ? x.id : q)); setResult(null) }}
                      className={`vl-vbtn ${x.cls} ${vlan[i] === x.id ? 'on' : ''}`} title={`VLAN ${x.id}: ${x.name}`}>{x.id}</button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={`vl-out ${result ? (result.ok ? 'ok' : 'no') : ''}`}>
        {result ? <><b>{result.ok ? 'Ping berhasil' : 'Ping gagal: request timed out'}</b> {result.msg}</>
          : a !== null ? <>Sumber: <b>{HOSTS[a]}</b> (VLAN {vlan[a]}). Sekarang pilih tujuannya.</>
            : <>Klik satu PC sebagai sumber, lalu satu lagi sebagai tujuan.</>}
      </div>

      <div className="vl-legend">
        {VLANS.map(v => <span key={v.id} className={`vl-tag ${v.cls}`}>VLAN {v.id} · {v.name}</span>)}
        <span className="vl-note">Tanpa router, VLAN adalah dinding yang tidak bisa ditembus frame.</span>
      </div>
    </div>
  )
}
