import { Fig, Box, Arrow, T, Device } from './primitives'

/* Lab 00b bagian 4: topologi pertama (2 PC, 1 switch, 1 router, server untuk bagian 5) */
export function DgPtTopologiPertama() {
  const host = [
    { cx: 170, nama: 'PC0', ip: '192.168.10.11/24' },
    { cx: 410, nama: 'PC1', ip: '192.168.10.12/24' },
    { cx: 650, nama: 'Server0 (bagian 5)', ip: '192.168.10.100/24' },
  ]
  return (
    <Fig title="Topologi pertama di Packet Tracer" sub="R1 menjadi gateway LAN 192.168.10.0/24; Loopback0 mewakili jaringan lain" w={820} h={430}>
      <rect x={60} y={150} width={700} height={235} className="dg-region r-p" />
      <T x={80} y={172} anchor="start" cls="dg-region-lb">LAN 192.168.10.0/24</T>

      <path d="M410 92 V178" className="dg-lnk" />
      <path d="M432 70 H518" className="dg-lnk dash" />
      <path d="M398 201 L184 282" className="dg-lnk" />
      <path d="M410 201 V280" className="dg-lnk" />
      <path d="M422 201 L636 280" className="dg-lnk dash" />

      <Device cx={410} cy={70} kind="router" />
      <T x={380} y={74} anchor="end" cls="dg-sb">R1 (2911)</T>
      <Box x={520} y={45} w={170} h={50} label="Loopback0" sub="10.10.10.1/32" tone="a" />
      <T x={605} y={114} cls="dg-note" size={11}>mewakili jaringan lain</T>
      <T x={400} y={116} anchor="end" cls="dg-note" size={11}>G0/0  192.168.10.1/24</T>
      <T x={400} y={168} anchor="end" cls="dg-note" size={11}>G0/1</T>

      <Device cx={410} cy={190} kind="switch" />
      <T x={376} y={194} anchor="end" cls="dg-sb">Switch0 (2960)</T>
      <T x={346} y={242} anchor="start" cls="dg-note" size={11}>Fa0/1</T>
      <T x={418} y={246} anchor="start" cls="dg-note" size={11}>Fa0/2</T>
      <T x={498} y={218} anchor="start" cls="dg-note" size={11}>Fa0/3</T>

      <Device cx={170} cy={300} kind="pc" />
      <Device cx={410} cy={300} kind="pc" />
      <Device cx={650} cy={300} kind="server" />
      {host.map(h => (
        <g key={h.nama}>
          <T x={h.cx} y={340} cls="dg-sb">{h.nama}</T>
          <T x={h.cx} y={356} cls="dg-note" size={11}>{h.ip}</T>
          <T x={h.cx} y={371} cls="dg-note" size={11}>gateway 192.168.10.1</T>
        </g>
      ))}

      <T x={410} y={402} cls="dg-note" size={11}>Semua kabel Copper Straight-Through. Server0 baru disambung di bagian 5; Loopback0 interface virtual, tanpa kabel</T>
      <T x={410} y={418} cls="dg-note" size={11}>Ping uji dari PC0: 192.168.10.12, 192.168.10.1, 10.10.10.1</T>
    </Fig>
  )
}

/* Lab 00b bagian 5.2: cara membaca tab OSI Model di jendela PDU Information */
export function DgPtAnatomiPdu() {
  type Baris = { l: string; s: string; on?: 'p' | 'a' }
  const panel = [
    {
      judul: 'Di Switch0', x: 16, tone: 'r-p', antar: 192,
      masuk: [
        { l: 'Layer 4 sampai 7', s: 'tidak dipakai' },
        { l: 'Layer 3', s: 'tidak dipakai' },
        { l: 'Layer 2 Ethernet II', s: 'MAC PC0 >> MAC PC1', on: 'p' },
        { l: 'Layer 1', s: 'masuk di Fa0/1', on: 'p' },
      ] as Baris[],
      keluar: [
        { l: 'Layer 4 sampai 7', s: 'tidak dipakai' },
        { l: 'Layer 3', s: 'tidak dipakai' },
        { l: 'Layer 2 Ethernet II', s: 'frame tidak diubah', on: 'p' },
        { l: 'Layer 1', s: 'keluar di Fa0/2', on: 'p' },
      ] as Baris[],
      catatan: ['Switch hanya memakai Layer 1 dan 2:', 'ia memutuskan dari tabel MAC,', 'tanpa membuka header IP.'],
    },
    {
      judul: 'Di PC1', x: 416, tone: 'r-a', antar: 144,
      masuk: [
        { l: 'Layer 4 sampai 7', s: 'tidak dipakai' },
        { l: 'Layer 3 IP + ICMP', s: 'tipe 8, echo request', on: 'a' },
        { l: 'Layer 2 Ethernet II', s: 'MAC PC0 >> MAC PC1', on: 'p' },
        { l: 'Layer 1', s: 'masuk di Fa0', on: 'p' },
      ] as Baris[],
      keluar: [
        { l: 'Layer 4 sampai 7', s: 'tidak dipakai' },
        { l: 'Layer 3 IP + ICMP', s: 'tipe 0, echo reply', on: 'a' },
        { l: 'Layer 2 Ethernet II', s: 'MAC PC1 >> MAC PC0', on: 'p' },
        { l: 'Layer 1', s: 'keluar di Fa0', on: 'p' },
      ] as Baris[],
      catatan: ['PC1 membuka paket sampai Layer 3,', 'membuat balasan ICMP,', 'lalu membungkusnya turun lagi.'],
    },
  ]
  const ys = [76, 124, 172, 220]
  const tab = [
    { x: 20, l: 'OSI Model', s: 'tindakan per lapisan' },
    { x: 290, l: 'Inbound PDU Details', s: 'header paket masuk' },
    { x: 560, l: 'Outbound PDU Details', s: 'header paket keluar' },
  ]
  return (
    <Fig title="Membaca jendela PDU Information" sub="Contoh Percobaan A: ICMP echo request dari PC0 ke PC1. In Layers dibaca naik dari Layer 1, Out Layers dibaca turun ke Layer 1" w={820} h={440}>
      {panel.map(p => {
        const xi = p.x + 34, xo = p.x + 214
        return (
          <g key={p.judul}>
            <rect x={p.x} y={14} width={388} height={330} className={`dg-region ${p.tone}`} />
            <T x={p.x + 194} y={38} cls="dg-cap-in">{p.judul}</T>
            <T x={xi + 70} y={64} cls="dg-sb">In Layers</T>
            <T x={xo + 70} y={64} cls="dg-sb">Out Layers</T>
            {p.masuk.map((b, i) => <Box key={'m' + i} x={xi} y={ys[i]} w={140} h={40} label={b.l} sub={b.s} tone={b.on || 'n'} fs={11} />)}
            {p.keluar.map((b, i) => <Box key={'k' + i} x={xo} y={ys[i]} w={140} h={40} label={b.l} sub={b.s} tone={b.on || 'n'} fs={11} />)}
            <Arrow d={`M${p.x + 20} 256 V82`} tone="n" />
            <Arrow d={`M${p.x + 368} 82 V256`} tone="n" />
            <Arrow d={`M${xi + 142} ${p.antar} H${xo - 2}`} tone="p" />
            <T x={xi + 70} y={278} cls="dg-note" size={11}>baca dari bawah</T>
            <T x={xo + 70} y={278} cls="dg-note" size={11}>baca dari atas</T>
            {p.catatan.map((c, i) => <T key={i} x={p.x + 194} y={302 + i * 15} cls="dg-note" size={11}>{c}</T>)}
          </g>
        )
      })}
      <T x={20} y={366} anchor="start" cls="dg-note" size={11}>Tiga tab di jendela PDU Information:</T>
      {tab.map(t => <Box key={t.l} x={t.x} y={376} w={240} h={46} label={t.l} sub={t.s} tone="n" />)}
    </Fig>
  )
}
