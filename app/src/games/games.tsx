import { useEffect, useMemo, useState } from 'react'
import { useGame, GameFrame, Flash, rnd, shuffle } from './shell'

/* ---------------------------------------------------------- 1. Drill subnet */
type SubQ = { ip: string; cidr: number; ask: 'net' | 'bcast' | 'hosts' | 'mask'; answer: string; opts: string[] }
function maskOf(cidr: number) {
  const m = [0, 0, 0, 0]
  for (let i = 0; i < 32; i++) if (i < cidr) m[Math.floor(i / 8)] += 128 >> (i % 8)
  return m.join('.')
}
function toInt(ip: string) { return ip.split('.').reduce((a, b) => a * 256 + Number(b), 0) }
function toIp(n: number) { return [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.') }
function makeSubQ(): SubQ {
  const cidr = 8 + rnd(23)                       // /8 – /30
  const ip = `${10 + rnd(180)}.${rnd(256)}.${rnd(256)}.${1 + rnd(254)}`
  const net = toInt(ip) & (cidr === 0 ? 0 : (-1 << (32 - cidr)) >>> 0)
  const bcast = net + Math.pow(2, 32 - cidr) - 1
  const hosts = Math.max(0, Math.pow(2, 32 - cidr) - 2)
  const ask = (['net', 'bcast', 'hosts', 'mask'] as const)[rnd(4)]
  const answer = ask === 'net' ? toIp(net) : ask === 'bcast' ? toIp(bcast) : ask === 'hosts' ? String(hosts) : maskOf(cidr)
  const wrong = new Set<string>()
  while (wrong.size < 3) {
    if (ask === 'hosts') wrong.add(String(Math.max(0, Math.pow(2, 32 - cidr + (rnd(3) - 1)) - 2)))
    else if (ask === 'mask') wrong.add(maskOf(Math.max(1, Math.min(30, cidr + rnd(5) - 2))))
    else wrong.add(toIp((ask === 'net' ? net : bcast) + (rnd(2) ? 1 : -1) * (1 + rnd(3)) * Math.pow(2, rnd(9))))
  }
  wrong.delete(answer)
  return { ip, cidr, ask, answer, opts: shuffle([answer, ...Array.from(wrong).slice(0, 3)]) }
}
const ASK_LB = { net: 'Alamat network-nya?', bcast: 'Alamat broadcast-nya?', hosts: 'Berapa host yang bisa dipakai?', mask: 'Netmask desimalnya?' }

export function SubnetDrill() {
  const g = useGame('subnet-drill')
  const [q, setQ] = useState<SubQ>(() => makeSubQ())
  const [fb, setFb] = useState<{ k: 'ok' | 'no'; t: string } | null>(null)
  useEffect(() => { if (g.running) { setQ(makeSubQ()); setFb(null) } }, [g.running])
  function answer(o: string) {
    if (o === q.answer) { g.hit(12); setFb({ k: 'ok', t: 'tepat' }) } else { g.miss(); setFb({ k: 'no', t: `jawabannya ${q.answer}` }) }
    setTimeout(() => { setQ(makeSubQ()); setFb(null) }, 620)
  }
  return (
    <GameFrame g={g} title="Drill Subnet" desc="Latihan hitung cepat sampai refleks"
      howto="Empat pilihan, 60 detik. Jawab berturut-turut tanpa salah untuk menaikkan combo.">
      <div className="gm-q">
        <span className="gm-mono gm-ip">{q.ip}/{q.cidr}</span>
        <span className="gm-ask">{ASK_LB[q.ask]}</span>
      </div>
      <div className="gm-grid2">
        {q.opts.map(o => <button key={o} onClick={() => answer(o)} className="gm-opt gm-mono" disabled={!!fb}>{o}</button>)}
      </div>
      <Flash kind={fb?.k ?? null} text={fb?.t} />
    </GameFrame>
  )
}

/* --------------------------------------------------------- 2. Biner blitz */
export function BinaryBlitz() {
  const g = useGame('biner-blitz')
  const [n, setN] = useState(() => rnd(256))
  const [mode, setMode] = useState<'d2b' | 'b2d'>('d2b')
  const [bits, setBits] = useState<number[]>(Array(8).fill(0))
  const [txt, setTxt] = useState('')
  const [fb, setFb] = useState<{ k: 'ok' | 'no'; t: string } | null>(null)
  const cur = bits.reduce((a, b, i) => a + (b ? 128 >> i : 0), 0)

  function fresh() { setN(rnd(256)); setMode(rnd(2) ? 'd2b' : 'b2d'); setBits(Array(8).fill(0)); setTxt(''); setFb(null) }
  useEffect(() => { if (g.running) fresh() }, [g.running])
  function submit() {
    const ok = mode === 'd2b' ? cur === n : Number(txt) === n
    if (ok) { g.hit(10); setFb({ k: 'ok', t: 'benar' }) } else { g.miss(); setFb({ k: 'no', t: `${n} = ${n.toString(2).padStart(8, '0')}` }) }
    setTimeout(fresh, 700)
  }
  return (
    <GameFrame g={g} title="Biner Blitz" desc="Desimal ⇄ biner sampai otomatis"
      howto="Kadang kamu diminta menyusun bit, kadang membaca bit. 60 detik, kejar rekor.">
      {mode === 'd2b' ? (
        <>
          <div className="gm-q"><span className="gm-ask">Susun</span><span className="gm-mono gm-ip">{n}</span><span className="gm-ask">dalam 8 bit</span></div>
          <div className="gm-bits">
            {bits.map((b, i) => (
              <button key={i} onClick={() => setBits(p => p.map((v, j) => j === i ? (v ? 0 : 1) : v))}
                className={`gm-bit ${b ? 'on' : ''}`} disabled={!!fb}>
                <b>{b}</b><i>{128 >> i}</i>
              </button>
            ))}
          </div>
          <div className="gm-row"><span className="gm-cur">= {cur}</span>
            <button onClick={submit} className="btn btn-primary !py-2" disabled={!!fb}>Kunci jawaban</button></div>
        </>
      ) : (
        <>
          <div className="gm-q"><span className="gm-ask">Berapa desimalnya?</span><span className="gm-mono gm-ip">{n.toString(2).padStart(8, '0')}</span></div>
          <div className="gm-row">
            <input value={txt} onChange={e => setTxt(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && submit()}
              className="gm-input gm-mono" placeholder="0-255" autoFocus disabled={!!fb} />
            <button onClick={submit} className="btn btn-primary !py-2" disabled={!!fb}>Kunci jawaban</button>
          </div>
        </>
      )}
      <Flash kind={fb?.k ?? null} text={fb?.t} />
    </GameFrame>
  )
}

/* ---------------------------------------------------------- 3. Urutkan OSI */
const LAYERS = ['Physical', 'Data Link', 'Network', 'Transport', 'Session', 'Presentation', 'Application']
export function OsiSorter() {
  const g = useGame('osi-sorter', 60)
  const [pool, setPool] = useState<string[]>([])
  const [slot, setSlot] = useState<string[]>([])
  const [fb, setFb] = useState<{ k: 'ok' | 'no'; t: string } | null>(null)
  function fresh() { setPool(shuffle(LAYERS)); setSlot([]); setFb(null) }
  useEffect(() => { if (g.running) fresh() }, [g.running])
  function place(l: string) {
    const next = [...slot, l]
    setSlot(next); setPool(p => p.filter(x => x !== l))
    if (next.length === 7) {
      const ok = next.every((x, i) => x === LAYERS[i])
      if (ok) { g.hit(40); setFb({ k: 'ok', t: 'urutan 1→7 tepat' }) } else { g.miss(); setFb({ k: 'no', t: 'ada yang tertukar' }) }
      setTimeout(fresh, 900)
    }
  }
  return (
    <GameFrame g={g} title="Urutkan OSI" desc="Dari layer 1 ke layer 7"
      howto="Klik nama layer sesuai urutan dari bawah (Physical) ke atas (Application).">
      <div className="gm-slots">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={`gm-slot ${slot[i] ? 'filled' : ''} ${fb && slot[i] !== LAYERS[i] ? 'bad' : ''}`}>
            <span className="gm-slot-n">{i + 1}</span>{slot[i] || '·'}
          </div>
        ))}
      </div>
      <div className="gm-pool">
        {pool.map(l => <button key={l} onClick={() => place(l)} className="gm-chip" disabled={!!fb}>{l}</button>)}
      </div>
      <Flash kind={fb?.k ?? null} text={fb?.t} />
    </GameFrame>
  )
}

/* ------------------------------------------------------- 4. Cocokkan port */
const PORTS: [string, number, string][] = [
  ['HTTP', 80, 'TCP'], ['HTTPS', 443, 'TCP'], ['SSH', 22, 'TCP'], ['Telnet', 23, 'TCP'],
  ['FTP kontrol', 21, 'TCP'], ['SMTP', 25, 'TCP'], ['DNS', 53, 'UDP'], ['DHCP server', 67, 'UDP'],
  ['TFTP', 69, 'UDP'], ['POP3', 110, 'TCP'], ['NTP', 123, 'UDP'], ['SNMP', 161, 'UDP'],
  ['IMAP', 143, 'TCP'], ['LDAP', 389, 'TCP'], ['SMB', 445, 'TCP'], ['Syslog', 514, 'UDP'],
  ['SMTPS submission', 587, 'TCP'], ['IMAPS', 993, 'TCP'], ['RDP', 3389, 'TCP'], ['Winbox MikroTik', 8291, 'TCP'],
]
export function PortMatch() {
  const g = useGame('port-match')
  const [q, setQ] = useState(() => PORTS[rnd(PORTS.length)])
  const [opts, setOpts] = useState<number[]>([])
  const [fb, setFb] = useState<{ k: 'ok' | 'no'; t: string } | null>(null)
  function fresh() {
    const pick = PORTS[rnd(PORTS.length)]
    const wrong = shuffle(PORTS.filter(p => p[1] !== pick[1])).slice(0, 3).map(p => p[1])
    setQ(pick); setOpts(shuffle([pick[1], ...wrong])); setFb(null)
  }
  useEffect(() => { if (g.running) fresh() }, [g.running])
  function answer(p: number) {
    if (p === q[1]) { g.hit(10); setFb({ k: 'ok', t: `${q[0]} = ${q[1]}/${q[2]}` }) }
    else { g.miss(); setFb({ k: 'no', t: `${q[0]} itu ${q[1]}/${q[2]}` }) }
    setTimeout(fresh, 640)
  }
  return (
    <GameFrame g={g} title="Tebak Port" desc="Nomor port layanan yang wajib hafal"
      howto="Satu nama layanan, empat nomor port. Pilih yang benar secepat mungkin.">
      <div className="gm-q"><span className="gm-ip">{q[0]}</span><span className="gm-ask">port berapa?</span></div>
      <div className="gm-grid4">
        {opts.map(o => <button key={o} onClick={() => answer(o)} className="gm-opt gm-mono" disabled={!!fb}>{o}</button>)}
      </div>
      <Flash kind={fb?.k ?? null} text={fb?.t} />
    </GameFrame>
  )
}

/* ------------------------------------------------- 5. CIDR ⇄ netmask cepat */
export function CidrFlash() {
  const g = useGame('cidr-flash')
  const [cidr, setCidr] = useState(24)
  const [dir, setDir] = useState<'c2m' | 'm2c'>('c2m')
  const [opts, setOpts] = useState<string[]>([])
  const [fb, setFb] = useState<{ k: 'ok' | 'no'; t: string } | null>(null)
  const answer = useMemo(() => dir === 'c2m' ? maskOf(cidr) : `/${cidr}`, [cidr, dir])
  function fresh() {
    const c = 8 + rnd(23), d = rnd(2) ? 'c2m' : 'm2c'
    const wrongC = shuffle(Array.from({ length: 23 }, (_, i) => i + 8).filter(x => x !== c)).slice(0, 3)
    setCidr(c); setDir(d as any)
    setOpts(shuffle([d === 'c2m' ? maskOf(c) : `/${c}`, ...wrongC.map(x => d === 'c2m' ? maskOf(x) : `/${x}`)]))
    setFb(null)
  }
  useEffect(() => { if (g.running) fresh() }, [g.running])
  function pick(o: string) {
    if (o === answer) { g.hit(10); setFb({ k: 'ok', t: 'benar' }) } else { g.miss(); setFb({ k: 'no', t: `harusnya ${answer}` }) }
    setTimeout(fresh, 600)
  }
  return (
    <GameFrame g={g} title="CIDR ⇄ Netmask" desc="Terjemahan prefix yang paling sering dipakai"
      howto="Diberi salah satu bentuk, pilih pasangannya. Ingat: /24 = 255.255.255.0.">
      <div className="gm-q">
        <span className="gm-mono gm-ip">{dir === 'c2m' ? `/${cidr}` : maskOf(cidr)}</span>
        <span className="gm-ask">{dir === 'c2m' ? 'netmask desimalnya?' : 'berapa prefix-nya?'}</span>
      </div>
      <div className="gm-grid2">
        {opts.map(o => <button key={o} onClick={() => pick(o)} className="gm-opt gm-mono" disabled={!!fb}>{o}</button>)}
      </div>
      <Flash kind={fb?.k ?? null} text={fb?.t} />
    </GameFrame>
  )
}
