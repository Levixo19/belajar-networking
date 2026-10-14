import { useState } from 'react'
import { Fig, Box, Arrow, T, Device } from './primitives'
import { useInView } from '../lib/useInView'

/* Frame Ethernet II */
export function DgEthernetFrame() {
  const f = [
    { lb: 'Preamble', b: '7', tone: 'n' }, { lb: 'SFD', b: '1', tone: 'n' },
    { lb: 'MAC Tujuan', b: '6', tone: 'p' }, { lb: 'MAC Sumber', b: '6', tone: 'p' },
    { lb: 'Type', b: '2', tone: 'a' }, { lb: 'Payload (IP packet)', b: '46–1500', tone: 'grad' }, { lb: 'FCS', b: '4', tone: 'ok' },
  ]
  const wOf = (i: number) => [70, 40, 105, 105, 60, 240, 60][i]
  let x = 45
  return (
    <Fig title="Frame Ethernet II" sub="Angka di bawah = ukuran dalam byte" w={820} h={230}>
      {f.map((p, i) => { const w = wOf(i); const el = (
        <g key={i}>
          <Box x={x} y={50} w={w} h={52} label={p.lb} tone={p.tone as any} fs={w < 70 ? 9 : 10.5} />
          <text x={x + w / 2} y={120} className="dg-sb">{p.b}</text>
        </g>); x += w + 4; return el })}
      <path d="M199 112 V138 H660 V112" className="dg-brace" />
      <T x={430} y={155} cls="dg-sb">Yang dihitung FCS (CRC-32)</T>
      <T x={45} y={192} cls="dg-note" anchor="start" size={10}>MAC = 48 bit: 24 bit OUI (vendor) + 24 bit unik. Contoh <tspan className="dg-mono">00:1A:2B</tspan>:3C:4D:5E</T>
      <T x={45} y={212} cls="dg-note" anchor="start" size={10}>Type 0x0800 = IPv4 · 0x86DD = IPv6 · 0x0806 = ARP · 0x8100 = frame ber-tag VLAN</T>
      <Box x={548} y={168} w={230} h={46} label="MTU standar 1500 byte" sub="di luar header & FCS" tone="a" />
    </Fig>
  )
}

/* Switch belajar MAC address */
export function DgMacTable() {
  const [step, setStep] = useState(0)
  const steps = [
    { t: 'A kirim frame ke B. Switch belum tahu siapa-siapa.', rows: [] as string[][], flood: false },
    { t: 'Switch catat: MAC A ada di port 1 (belajar dari MAC sumber).', rows: [['1', 'AA:AA', 'A']], flood: false },
    { t: 'Tujuan B belum ada di tabel → frame di-flood ke semua port lain.', rows: [['1', 'AA:AA', 'A']], flood: true },
    { t: 'B membalas. Switch catat MAC B di port 2. Selanjutnya diteruskan langsung, tidak di-flood.', rows: [['1', 'AA:AA', 'A'], ['2', 'BB:BB', 'B']], flood: false },
  ]
  const s = steps[step]
  return (
    <Fig title="Bagaimana switch belajar" sub="Klik untuk maju satu langkah" w={820} h={300}>
      <g onClick={() => setStep((step + 1) % 4)} className="dg-click">
        <rect x={0} y={0} width={820} height={300} fill="transparent" />
        <Device cx={130} cy={70} kind="pc" label="A · AA:AA" />
        <Device cx={130} cy={230} kind="pc" label="B · BB:BB" />
        <Device cx={690} cy={70} kind="pc" label="C · CC:CC" />
        <Device cx={690} cy={230} kind="pc" label="D · DD:DD" />
        <Box x={340} y={120} w={140} h={62} label="Switch" tone="grad" />
        {[[170, 70, 335, 135, '1'], [170, 230, 335, 168, '2'], [650, 70, 485, 135, '3'], [650, 230, 485, 168, '4']].map(([x1, y1, x2, y2, p], i) => (
          <g key={i}>
            <path d={`M${x1} ${y1} H${(Number(x1) + Number(x2)) / 2} V${y2} H${x2}`} className="dg-lnk" />
            <text x={Number(x2) + (i < 2 ? -14 : 14)} y={Number(y2) - 6} className="dg-note" style={{ fontSize: 9 }}>port {p}</text>
          </g>
        ))}
        {step >= 0 && step < 3 && <circle cx={250} cy={100} r={9} className="dg-pkt dg-flow-x" />}
        {s.flood && [3, 4].map((p, i) => <circle key={p} cx={560} cy={i === 0 ? 100 : 200} r={7} className="dg-pkt2 dg-flow-x" />)}
        {s.flood && <circle cx={250} cy={200} r={7} className="dg-pkt2 dg-flow-x" />}
        <Box x={575} y={118} w={210} h={26} label="Tabel MAC (CAM)" tone="a" fs={10} />
        {s.rows.map((r, i) => (<g key={i}>
          <rect x={575} y={148 + i * 26} width={210} height={22} rx={6} className="dg-row" />
          <text x={600} y={163 + i * 26} className="dg-sb" style={{ textAnchor: 'start' }}>port {r[0]}</text>
          <text x={665} y={163 + i * 26} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r[1]}</text>
        </g>))}
        {!s.rows.length && <text x={680} y={163} className="dg-note" style={{ fontSize: 10 }}>(kosong)</text>}
        <rect x={40} y={268} width={740} height={26} rx={9} className="dg-hint" />
        <text x={410} y={285} className="dg-sb">{step + 1}/4: {s.t}</text>
      </g>
    </Fig>
  )
}

/* VLAN: access vs trunk + tag 802.1Q */
export function DgVlanTrunk() {
  return (
    <Fig title="VLAN: access port vs trunk port" sub="Tag 802.1Q hanya hidup di dalam trunk" w={820} h={330}>
      <Device cx={90} cy={70} kind="pc" label="VLAN 10" /><Device cx={90} cy={180} kind="pc" label="VLAN 20" />
      <Device cx={730} cy={70} kind="pc" label="VLAN 10" /><Device cx={730} cy={180} kind="pc" label="VLAN 20" />
      <Box x={215} y={60} w={130} h={130} label="Switch A" tone="grad" />
      <Box x={475} y={60} w={130} h={130} label="Switch B" tone="grad" />
      <path d="M122 70 H212" className="dg-lnk v10" /><path d="M122 180 H212" className="dg-lnk v20" />
      <path d="M608 70 H698" className="dg-lnk v10" /><path d="M608 180 H698" className="dg-lnk v20" />
      <T x={167} y={58} cls="dg-note" size={9}>access · untagged</T>
      <T x={653} y={58} cls="dg-note" size={9}>access · untagged</T>
      <path d="M348 125 H472" className="dg-trunk" />
      <T x={410} y={110} cls="dg-cap-in">TRUNK</T>
      <T x={410} y={148} cls="dg-note" size={9}>membawa VLAN 10 + 20, keduanya ber-tag</T>
      {/* Anatomi tag */}
      <T x={410} y={212} cls="dg-cap-in">Frame saat melewati trunk</T>
      <Box x={130} y={228} w={110} h={44} label="MAC Tujuan" tone="n" fs={9.5} />
      <Box x={244} y={228} w={110} h={44} label="MAC Sumber" tone="n" fs={9.5} />
      <Box x={358} y={228} w={150} h={44} label="Tag 802.1Q" sub="4 byte" tone="p" fs={9.5} />
      <Box x={512} y={228} w={70} h={44} label="Type" tone="n" fs={9.5} />
      <Box x={586} y={228} w={104} h={44} label="Payload" tone="grad" fs={9.5} />
      <path d="M358 274 V292 H508 V274" className="dg-brace" />
      <T x={433} y={310} cls="dg-note" size={9.5}>TPID 0x8100 · PCP (QoS) · DEI · VID 12 bit → 1–4094</T>
      <T x={90} y={252} cls="dg-note" anchor="start" size={9.5}>Native VLAN dikirim</T>
      <T x={90} y={266} cls="dg-note" anchor="start" size={9.5}>tanpa tag: sumber bug klasik.</T>
    </Fig>
  )
}

/* STP: root bridge dan port terblokir */
export function DgStp() {
  return (
    <Fig title="Spanning Tree: memutus loop tanpa mencabut kabel" sub="Satu jalur diblokir secara logis, siap jadi cadangan" w={820} h={300}>
      <Box x={330} y={30} w={160} h={56} label="Switch A" sub="ROOT BRIDGE" tone="grad" />
      <T x={410} y={20} cls="dg-note" size={10}>priority terendah menang</T>
      <Box x={110} y={165} w={150} h={56} label="Switch B" tone="n" />
      <Box x={560} y={165} w={150} h={56} label="Switch C" tone="n" />
      <path d="M340 86 L215 165" className="dg-lnk fwd" />
      <path d="M480 86 L605 165" className="dg-lnk fwd" />
      <path d="M260 200 H560" className="dg-lnk blk" />
      <circle cx={410} cy={200} r={17} className="dg-blockdot" />
      <T x={410} y={205} cls="dg-blk-x">✕</T>
      <T x={410} y={236} cls="dg-sb">Blocking port</T>
      <T x={410} y={254} cls="dg-note" size={10}>tetap mendengar BPDU; langsung aktif bila jalur utama putus</T>
      <T x={262} y={116} cls="dg-sb" anchor="start">Root port</T>
      <T x={560} y={116} cls="dg-sb" anchor="end">Root port</T>
      <T x={410} y={286} cls="dg-note">Tanpa STP: frame broadcast berputar selamanya → broadcast storm → jaringan lumpuh dalam hitungan detik.</T>
    </Fig>
  )
}

/* Anatomi alamat IPv4 + mask */
export function DgIpv4Anatomy() {
  const [cidr, setCidr] = useState(26)
  const bits = Array.from({ length: 32 }, (_, i) => i < cidr)
  const oct = [0, 1, 2, 3]
  const maskOct = oct.map(o => { let v = 0; for (let i = 0; i < 8; i++) if (bits[o * 8 + i]) v += 128 >> i; return v })
  const hosts = Math.max(0, Math.pow(2, 32 - cidr) - 2)
  return (
    <Fig title="Alamat IPv4 = bagian network + bagian host" sub="Klik bit untuk menggeser garis pemisah (prefix)" w={820} h={250}>
      <T x={410} y={24} cls="dg-cap-in">192.168.10.130 / {cidr}</T>
      {oct.map(o => (<g key={o}>
        <text x={65 + o * 190 + 88} y={52} className="dg-sb">oktet {o + 1}</text>
        {Array.from({ length: 8 }, (_, i) => {
          const gi = o * 8 + i
          return <g key={i} className="dg-click" onClick={() => setCidr(gi + 1)}>
            <rect x={65 + o * 190 + i * 22} y={60} width={19} height={30} rx={4} className={`dg-mbit ${bits[gi] ? 'net' : 'host'}`} />
            <text x={65 + o * 190 + i * 22 + 9.5} y={80} className="dg-mbit-tx">{bits[gi] ? 1 : 0}</text>
          </g>
        })}
        <text x={65 + o * 190 + 88} y={110} className="dg-mono dg-sb">{maskOct[o]}</text>
      </g>))}
      <path d={`M${65 + Math.floor(cidr / 8) * 190 + (cidr % 8) * 22 - 1.5} 54 V116`} className="dg-split" />
      <Box x={65} y={134} w={330} h={44} label="NETWORK: sama untuk semua host di subnet" tone="p" fs={10.5} />
      <Box x={405} y={134} w={330} h={44} label="HOST: membedakan tiap perangkat" tone="a" fs={10.5} />
      <T x={230} y={200} cls="dg-sb">Netmask: {maskOct.join('.')}</T>
      <T x={575} y={200} cls="dg-sb">{hosts.toLocaleString('id')} host tersedia</T>
      <T x={410} y={228} cls="dg-note" size={10}>2 alamat selalu dipesan: alamat network (semua host bit 0) dan broadcast (semua host bit 1)</T>
    </Fig>
  )
}

/* Membagi /24 menjadi empat /26 */
export function DgSubnetSplit() {
  const seg = [
    { n: '192.168.1.0/26', r: '.1 – .62', b: '.63' },
    { n: '192.168.1.64/26', r: '.65 – .126', b: '.127' },
    { n: '192.168.1.128/26', r: '.129 – .190', b: '.191' },
    { n: '192.168.1.192/26', r: '.193 – .254', b: '.255' },
  ]
  return (
    <Fig title="Memecah /24 menjadi empat /26" sub="Menambah 2 bit ke prefix = membelah dua kali" w={820} h={250}>
      <Box x={60} y={34} w={700} h={48} label="192.168.1.0/24: 256 alamat, 254 host" tone="grad" />
      {[0, 1, 2, 3].map(i => <Arrow key={i} d={`M${410} 84 V100 H${137 + i * 182} V114`} tone="p" />)}
      {seg.map((s, i) => (<g key={i}>
        <Box x={60 + i * 182} w={154} y={118} h={70} label={s.n} tone="a" fs={10} />
        <text x={137 + i * 182} y={210} className="dg-sb">host: {s.r}</text>
        <text x={137 + i * 182} y={228} className="dg-note" style={{ fontSize: 9.5 }}>broadcast {s.b}</text>
      </g>))}
      <T x={410} y={247} cls="dg-note" size={10}>Blok = 256 − 192 = 64 → batas subnet meloncat tiap 64 · Netmask 255.255.255.192</T>
    </Fig>
  )
}

/* ARP request/reply */
export function DgArp() {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref}>
      <Fig title="ARP: dari IP ke MAC" sub="Sebelum bisa mengirim frame, host wajib tahu MAC tujuan" w={820} h={280}>
        <Device cx={100} cy={110} kind="pc" label="A · 192.168.1.10" />
        <Device cx={720} cy={110} kind="pc" label="B · 192.168.1.20" />
        <Box x={330} y={82} w={160} h={56} label="Switch" tone="grad" />
        <path d="M132 110 H328" className="dg-lnk" /><path d="M492 110 H688" className="dg-lnk" />
        <g className={inView ? 'dg-pop' : 'dg-hidden'}>
          <Box x={160} y={26} w={500} h={38} label='BROADCAST → "Siapa 192.168.1.20? Kirim ke AA:AA:AA"' tone="warn" fs={10.5} />
          <Arrow d="M410 66 V78" tone="warn" />
          <T x={410} y={20} cls="dg-note" size={10}>Tujuan MAC = FF:FF:FF:FF:FF:FF, jadi semua host di domain broadcast mendengar</T>
        </g>
        <g className={inView ? 'dg-pop' : 'dg-hidden'} style={{ animationDelay: '.5s' }}>
          <Box x={210} y={168} w={400} h={38} label='UNICAST → "192.168.1.20 ada di BB:BB:BB"' tone="ok" fs={10.5} />
          <Arrow d="M410 168 V146" tone="ok" />
        </g>
        <Box x={60} y={222} w={300} h={44} label="Cache ARP di A" sub="192.168.1.20 → BB:BB:BB (timeout ±4 menit)" tone="a" fs={10} />
        <T x={585} y={240} cls="dg-note" size={10}>Linux: <tspan className="dg-mono">ip neigh</tspan> · MikroTik: <tspan className="dg-mono">/ip arp print</tspan></T>
        <T x={585} y={258} cls="dg-note" size={10}>Cisco: <tspan className="dg-mono">show ip arp</tspan></T>
      </Fig>
    </div>
  )
}

/* Longest prefix match */
export function DgRoutingLookup() {
  const routes = [
    { p: '0.0.0.0/0', nh: '203.0.113.1', d: 'ether1', len: 0 },
    { p: '10.0.0.0/8', nh: '10.1.1.2', d: 'ether2', len: 8 },
    { p: '10.20.0.0/16', nh: '10.1.1.6', d: 'ether3', len: 16 },
    { p: '10.20.30.0/24', nh: '10.1.1.10', d: 'ether4', len: 24 },
  ]
  return (
    <Fig title="Longest prefix match" sub="Tujuan 10.20.30.5: semua baris cocok, yang menang prefix terpanjang" w={820} h={280}>
      <Box x={250} y={20} w={320} h={44} label="Paket tujuan: 10.20.30.5" tone="grad" />
      <Box x={60} y={86} w={700} h={30} label="" tone="n" />
      <T x={130} y={106} cls="dg-sb">Prefix</T><T x={340} y={106} cls="dg-sb">Next-hop</T><T x={520} y={106} cls="dg-sb">Interface</T><T x={680} y={106} cls="dg-sb">Cocok?</T>
      {routes.map((r, i) => {
        const win = r.len === 24
        return (<g key={i}>
          <rect x={60} y={120 + i * 34} width={700} height={30} rx={8} className={`dg-rt ${win ? 'win' : ''}`} />
          <text x={130} y={140 + i * 34} className="dg-mono dg-sb">{r.p}</text>
          <text x={340} y={140 + i * 34} className="dg-mono dg-sb">{r.nh}</text>
          <text x={520} y={140 + i * 34} className="dg-sb">{r.d}</text>
          <text x={680} y={140 + i * 34} className={`dg-sb ${win ? 'dg-win-tx' : ''}`}>{win ? '✓ DIPILIH' : 'cocok'}</text>
        </g>)
      })}
      <T x={410} y={272} cls="dg-note">Router tidak memilih rute “pertama” atau “termurah” dulu: ia memilih yang paling spesifik. Baru bila panjang prefix sama, administrative distance lalu metric jadi penentu.</T>
    </Fig>
  )
}

/* DHCP DORA */
export function DgDhcp() {
  const steps = [
    { k: 'DISCOVER', from: 'Klien', to: 'Broadcast', d: 'Ada server DHCP?', tone: 'warn' },
    { k: 'OFFER', from: 'Server', to: 'Klien', d: 'Ini 192.168.1.50 untukmu', tone: 'a' },
    { k: 'REQUEST', from: 'Klien', to: 'Broadcast', d: 'Saya ambil yang itu', tone: 'warn' },
    { k: 'ACK', from: 'Server', to: 'Klien', d: 'Sah, lease 24 jam + gateway + DNS', tone: 'ok' },
  ]
  return (
    <Fig title="DHCP: empat langkah DORA" sub="Dua langkah pertama broadcast karena klien belum punya IP" w={820} h={300}>
      <Device cx={110} cy={50} kind="laptop" label="Klien" />
      <Device cx={710} cy={50} kind="server" label="Server DHCP" s={0.8} />
      <path d="M110 90 V270" className="dg-life" /><path d="M710 90 V270" className="dg-life" />
      {steps.map((s, i) => {
        const y = 120 + i * 40, l2r = i % 2 === 0
        return (<g key={i}>
          <Arrow d={l2r ? `M130 ${y} H690` : `M690 ${y} H130`} tone={s.tone as any} />
          <text x={410} y={y - 8} className="dg-sb">{s.k}</text>
          <text x={410} y={y + 20} className="dg-note" style={{ fontSize: 10 }}>{s.d}</text>
        </g>)
      })}
      <T x={410} y={292} cls="dg-note" size={10}>Port: klien UDP 68 → server UDP 67 · Beda subnet? Router perlu <tspan className="dg-mono">ip helper-address</tspan> (DHCP relay).</T>
    </Fig>
  )
}

/* NAT translation table */
export function DgNat() {
  return (
    <Fig title="NAT overload (PAT): banyak host, satu IP publik" sub="Yang membedakan sesi adalah nomor port sumber" w={820} h={290}>
      <Device cx={80} cy={70} kind="pc" label="10.0.0.5" /><Device cx={80} cy={170} kind="pc" label="10.0.0.6" />
      <Arrow d="M112 70 H250 V115" /><Arrow d="M112 170 H250 V135" />
      <Box x={252} y={100} w={150} h={54} label="Router NAT" sub="203.0.113.7" tone="grad" />
      <Arrow d="M404 127 H520" tone="a" label="ke internet" lx={462} ly={116} />
      <Device cx={580} cy={127} kind="cloud" label="Internet" s={1.2} />
      <Box x={430} y={182} w={350} h={26} label="Tabel translasi NAT" tone="a" fs={10} />
      {[['10.0.0.5:51001', '203.0.113.7:40001'], ['10.0.0.6:49876', '203.0.113.7:40002']].map((r, i) => (<g key={i}>
        <rect x={430} y={212 + i * 26} width={350} height={22} rx={6} className="dg-row" />
        <text x={445} y={227 + i * 26} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r[0]}</text>
        <text x={608} y={227 + i * 26} className="dg-sb">→</text>
        <text x={628} y={227 + i * 26} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r[1]}</text>
      </g>))}
      <T x={215} y={236} cls="dg-note" anchor="middle" size={10}>Balasan dari internet dicocokkan ke baris tabel,</T>
      <T x={215} y={252} cls="dg-note" anchor="middle" size={10}>lalu alamat tujuan ditulis ulang ke IP privat.</T>
      <T x={410} y={278} cls="dg-note" size={10}>Efek samping: koneksi dari luar tidak bisa memulai sendiri → butuh port forward / UPnP / hole punching.</T>
    </Fig>
  )
}

/* TTL & traceroute */
export function DgTtl() {
  return (
    <Fig title="TTL dan cara kerja traceroute" sub="Naikkan TTL satu per satu, kumpulkan pesan error dari tiap hop" w={820} h={280}>
      <Device cx={70} cy={110} kind="laptop" label="Anda" />
      {[0, 1, 2].map(i => <Device key={i} cx={230 + i * 175} cy={110} kind="router" label={`Hop ${i + 1}`} />)}
      <Device cx={760} cy={110} kind="server" label="Tujuan" s={0.8} />
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${i === 0 ? 100 : 260 + (i - 1) * 175} 110 H${i === 3 ? 735 : 200 + i * 175}`} className="dg-lnk" />)}
      {[1, 2, 3].map(n => (<g key={n}>
        <rect x={40} y={150 + (n - 1) * 40} width={140} height={26} rx={8} className="dg-ttlbox" />
        <text x={110} y={168 + (n - 1) * 40} className="dg-sb">kirim TTL={n}</text>
        <path d={`M182 ${163 + (n - 1) * 40} H${215 + (n - 1) * 175}`} className="dg-lnk dash" />
        <circle cx={230 + (n - 1) * 175} cy={163 + (n - 1) * 40} r={11} className="dg-ttl0" />
        <text x={230 + (n - 1) * 175} y={167 + (n - 1) * 40} className="dg-blk-x" style={{ fontSize: 10 }}>0</text>
        <text x={252 + (n - 1) * 175} y={167 + (n - 1) * 40} className="dg-note" style={{ textAnchor: 'start', fontSize: 9.5 }}>TTL habis → balas ICMP Time Exceeded</text>
      </g>))}
      <T x={410} y={272} cls="dg-note" size={10}>Tiap router mengurangi TTL 1. Saat mencapai 0, paket dibuang dan pengirim diberi tahu, itulah yang muncul sebagai baris traceroute.</T>
    </Fig>
  )
}
