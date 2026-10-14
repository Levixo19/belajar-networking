import { Fig, Box, Arrow, T, Device } from './primitives'

/* Leher sempit internet (hourglass) */
export function DgR1LeherSempit() {
  const apps = ['HTTP', 'SMTP', 'DNS', 'SSH', 'RTP', 'QUIC', '...']
  const media = ['Ethernet', 'Wi-Fi', 'Fiber', '5G', 'PPP', '...']
  return (
    <Fig title="Leher sempit: banyak di atas, banyak di bawah, hanya satu IP" sub="Ide besar yang bertahan puluhan tahun" w={820} h={300}>
      <path d="M30 40 H630 L410 160 H250 Z" className="dg-region r-a" />
      <path d="M250 190 H410 L630 290 H30 Z" className="dg-region r-a" />
      {apps.map((a, i) => <Box key={a + i} x={34 + i * 86} y={50} w={78} h={34} label={a} tone="n" fs={11} />)}
      <Box x={150} y={105} w={110} h={34} label="TCP" tone="p" fs={12} />
      <Box x={290} y={105} w={110} h={34} label="UDP" tone="p" fs={12} />
      <Box x={250} y={158} w={160} h={36} label="IP" tone="grad" fs={13} />
      {media.map((a, i) => <Box key={a + i} x={40 + i * 100} y={238} w={90} h={34} label={a} tone="n" fs={11} />)}
      <T x={650} y={72} anchor="start" cls="dg-note" size={11}>← banyak aplikasi</T>
      <T x={650} y={127} anchor="start" cls="dg-note" size={11}>← beberapa transport</T>
      <T x={650} y={180} anchor="start" cls="dg-note" size={11}>← LEHER SEMPIT:</T>
      <T x={650} y={196} anchor="start" cls="dg-note" size={11}>hanya satu</T>
      <T x={650} y={260} anchor="start" cls="dg-note" size={11}>← banyak media</T>
    </Fig>
  )
}

/* EtherChannel: satu aliran satu link */
export function DgR1EtherchannelAliran() {
  const ys1 = [80, 94, 108, 122]
  const ys2 = [236, 250, 264, 278]
  return (
    <Fig title="EtherChannel 4 × 1 Gbps = 4 Gbps agregat" sub="Hash memilih link per aliran, bukan per paket" w={820} h={350}>
      <T x={410} y={34} cls="dg-cap-in">Satu transfer file dari Server A ke Server B</T>
      <Box x={40} y={64} w={120} h={72} label="Server A" tone="n" />
      <Box x={660} y={64} w={120} h={72} label="Server B" tone="n" />
      {ys1.map((y, i) => i === 0
        ? <Arrow key={y} d={`M160 ${y} H660`} tone="a" both />
        : <path key={y} d={`M160 ${y} H660`} className="dg-lnk" />)}
      <T x={410} y={158} cls="dg-note" size={11}>Maksimum tetap 1 Gbps (satu aliran = satu link)</T>
      <path d="M40 186 H780" className="dg-lnk" />
      <T x={410} y={214} cls="dg-cap-in">Empat transfer dari server berbeda ke tujuan berbeda</T>
      <Box x={40} y={220} w={120} h={72} label="Server berbeda" tone="n" fs={11} />
      <Box x={660} y={220} w={120} h={72} label="Tujuan berbeda" tone="n" fs={11} />
      {ys2.map((y) => <Arrow key={y} d={`M160 ${y} H660`} tone="ok" both />)}
      <T x={410} y={318} cls="dg-note" size={11}>Bisa mencapai 4 Gbps total (jika hash mendistribusikan dengan baik)</T>
    </Fig>
  )
}

/* PPP: lapisan */
export function DgR1PppLapisan() {
  const rows: { label: string; sub: string; tone: 'a' | 'n' | 'p' }[] = [
    { label: 'NCP (Network Control Protocol)', sub: 'negosiasi layer 3 (IPCP untuk IP)', tone: 'a' },
    { label: 'Authentication (PAP / CHAP)', sub: 'opsional', tone: 'n' },
    { label: 'LCP (Link Control Protocol)', sub: 'membangun dan memelihara link', tone: 'p' },
    { label: 'HDLC-like framing', sub: 'pembungkus frame di atas link fisik', tone: 'n' },
  ]
  return (
    <Fig title="Komponen PPP" sub="Empat lapis, dari framing sampai negosiasi layer 3" w={820} h={290}>
      {rows.map((r, i) => <Box key={i} x={130} y={20 + i * 64} w={560} h={54} label={r.label} sub={r.sub} tone={r.tone} fs={12} />)}
      <Arrow d="M710 238 V30" tone="n" dash />
      <T x={730} y={134} anchor="start" cls="dg-note" size={10}>urutan</T>
      <T x={730} y={148} anchor="start" cls="dg-note" size={10}>naik</T>
    </Fig>
  )
}

/* Header UDP */
export function DgR1UdpHeader() {
  const ticks = Array.from({ length: 33 }, (_, i) => `M${100 + i * 20} 62 v${i % 8 === 0 ? 10 : 5}`).join(' ')
  return (
    <Fig title="Header UDP: hanya 8 byte" sub="Empat field, masing-masing 16 bit" w={820} h={250}>
      <path d="M100 72 H740" className="dg-lnk" />
      <path d={ticks} className="dg-lnk" />
      <T x={100} y={52} cls="dg-note" size={10}>bit 0</T>
      <T x={260} y={52} cls="dg-note" size={10}>bit 8 ... 15</T>
      <T x={420} y={52} cls="dg-note" size={10}>bit 16</T>
      <T x={740} y={52} cls="dg-note" size={10}>bit 31</T>
      <Box x={100} y={90} w={320} h={52} label="Source Port" sub="16 bit" tone="p" />
      <Box x={420} y={90} w={320} h={52} label="Destination Port" sub="16 bit" tone="p" />
      <Box x={100} y={142} w={320} h={52} label="Length" sub="16 bit" tone="a" />
      <Box x={420} y={142} w={320} h={52} label="Checksum" sub="16 bit" tone="a" />
      <T x={86} y={120} anchor="end" cls="dg-note" size={10}>byte 0-3</T>
      <T x={86} y={172} anchor="end" cls="dg-note" size={10}>byte 4-7</T>
      <T x={420} y={226} cls="dg-note" size={11}>Total header: 8 byte, tanpa handshake, ACK, atau pengurutan</T>
    </Fig>
  )
}

/* Static route ke exit interface di multi-access */
export function DgR1StaticArpMultiaccess() {
  const rows = ['5', '6', '7']
  const bad = ['ARP request membanjiri jaringan', 'ARP table membengkak']
  return (
    <Fig title="Static route hanya dengan exit interface di link multi-access" sub="Satu subnet remote dianggap tetangga langsung, setiap tujuan di-ARP" w={820} h={400}>
      <Box x={30} y={16} w={760} h={44} label='Router memperlakukan SELURUH 192.168.10.0/24 sebagai "directly connected" di Gi0/1' tone="p" fs={11.5} />
      {rows.map((n, i) => (
        <g key={n}>
          <Box x={60} y={84 + i * 40} w={280} h={30} label={`Paket ke 192.168.10.${n}`} tone="n" fs={11} />
          <Arrow d={`M340 ${99 + i * 40} H410`} tone="a" />
          <Box x={410} y={84 + i * 40} w={300} h={30} label={`ARP untuk 192.168.10.${n}`} tone="a" fs={11} />
        </g>
      ))}
      <T x={410} y={222} cls="dg-note" size={13}>...</T>
      <Box x={150} y={240} w={520} h={38} label="254 entri ARP untuk satu subnet remote" tone="warn" fs={12} />
      <Box x={30} y={306} w={240} h={56} label={bad[0]} tone="no" fs={11} />
      <Box x={290} y={306} w={240} h={56} label={bad[1]} tone="no" fs={11} />
      <Box x={550} y={306} w={240} h={56} label="Bergantung pada Proxy ARP" sub="di router tetangga (mungkin dimatikan)" tone="no" fs={11} />
    </Fig>
  )
}

/* Graf topologi untuk Dijkstra */
export function DgR1GrafRouting() {
  const N: Record<string, [number, number]> = { JKT: [260, 60], BDG: [560, 60], SMG: [260, 170], YOG: [560, 170], SBY: [260, 280], DPS: [560, 280] }
  const E: [string, string, number][] = [['JKT', 'BDG', 2], ['JKT', 'SMG', 5], ['BDG', 'SMG', 4], ['BDG', 'YOG', 7], ['SMG', 'YOG', 1], ['SMG', 'SBY', 6], ['YOG', 'SBY', 3], ['YOG', 'DPS', 9], ['SBY', 'DPS', 2]]
  return (
    <Fig title="Topologi enam kota dengan cost link" sub="Bahan Dijkstra dan Bellman-Ford: JKT, BDG, SMG, YOG, SBY, DPS" w={820} h={340}>
      {E.map(([a, b], i) => <path key={i} d={`M${N[a][0]} ${N[a][1]} L${N[b][0]} ${N[b][1]}`} className="dg-lnk" />)}
      {Object.entries(N).map(([k, [x, y]]) => <Box key={k} x={x - 36} y={y - 17} w={72} h={34} label={k} tone="p" fs={12} />)}
      {E.map(([a, b, c], i) => {
        const mx = (N[a][0] + N[b][0]) / 2, my = (N[a][1] + N[b][1]) / 2
        return <Box key={i} x={mx - 13} y={my - 10} w={26} h={20} label={String(c)} tone="a" fs={10} r={6} />
      })}
    </Fig>
  )
}

/* RIP: hop count tidak melihat bandwidth */
export function DgR1RipHopCount() {
  return (
    <Fig title="Kelemahan RIP: hop count buta terhadap bandwidth" sub="Metrik RIP hanya menghitung lompatan" w={820} h={350}>
      <Device cx={80} cy={140} kind="router" label="R1" />
      <Device cx={330} cy={70} kind="router" label="R2" />
      <Device cx={300} cy={210} kind="router" label="R3" />
      <Device cx={520} cy={210} kind="router" label="R4" />
      <Device cx={740} cy={140} kind="server" label="tujuan" />
      <Arrow d="M104 130 L306 76" tone="warn" />
      <Arrow d="M354 76 L716 130" tone="warn" />
      <Arrow d="M102 152 L278 202" tone="ok" />
      <Arrow d="M324 210 H496" tone="ok" />
      <Arrow d="M544 206 L718 152" tone="ok" />
      <T x={410} y={22} cls="dg-note" size={11}>Jalur A: R1 → R2 → tujuan (2 hop, semuanya link 10 Mbps)</T>
      <T x={410} y={266} cls="dg-note" size={11}>Jalur B: R1 → R3 → R4 → tujuan (3 hop, semuanya link 10 Gbps)</T>
      <Box x={60} y={290} w={330} h={44} label="RIP memilih A (2 < 3)" sub="1000× lebih lambat" tone="no" fs={12} />
      <Box x={430} y={290} w={330} h={44} label="OSPF memilih B" sub="cost jauh lebih kecil" tone="ok" fs={12} />
    </Fig>
  )
}

/* EIGRP successor dan feasible successor */
export function DgR1EigrpSuccessor() {
  return (
    <Fig title="EIGRP: successor dan feasible successor" sub="Feasibility condition: AD tetangga harus lebih kecil dari FD successor saat ini" w={820} h={350}>
      <T x={340} y={30} cls="dg-note" size={11}>Lewat R2: FD = 30 (R2 melaporkan AD = 20)</T>
      <Device cx={80} cy={140} kind="router" label="R1" />
      <Device cx={340} cy={70} kind="router" label="R2" />
      <Device cx={340} cy={190} kind="router" label="R3" />
      <Box x={600} y={118} w={120} h={44} label="Net X" tone="a" />
      <Arrow d="M104 130 L316 78" tone="ok" />
      <Arrow d="M364 78 L600 130" tone="ok" />
      <Arrow d="M104 152 L316 184" tone="p" dash />
      <Arrow d="M364 184 L600 152" tone="p" dash />
      <T x={340} y={246} cls="dg-note" size={11}>Lewat R3: FD = 45 (R3 melaporkan AD = 25)</T>
      <Box x={30} y={268} w={370} h={64} label="SUCCESSOR = R2" sub="FD 30 terkecil, masuk routing table" tone="ok" fs={12} />
      <Box x={420} y={268} w={370} h={64} label="R3 = FEASIBLE SUCCESSOR" sub="AD_R3 (25) < FD saat ini (30)? 25 < 30: YA" tone="p" fs={12} />
    </Fig>
  )
}

/* Redistribusi dua arah menjadi loop */
export function DgR1RedistribusiLoop() {
  const steps = [
    '1. Rute 10.1.1.0/24 berasal dari EIGRP',
    '2. R1 meredistribusi ke OSPF, menjadi O E2 dengan cost 20',
    '3. Rute menyebar di OSPF, sampai ke R2',
    '4. R2 meredistribusi kembali ke EIGRP, menjadi D EX',
    '5. AD EIGRP external = 170, AD OSPF = 110',
  ]
  return (
    <Fig title="Bahaya redistribusi dua arah: routing loop" sub="Dua router meredistribusi di kedua arah antara OSPF dan EIGRP" w={820} h={480}>
      <path d="M30 28 H230 V200 H30 Z" className="dg-region r-p" />
      <T x={130} y={20} cls="dg-region-lb">OSPF Domain</T>
      <path d="M590 28 H790 V200 H590 Z" className="dg-region r-a" />
      <T x={690} y={20} cls="dg-region-lb">EIGRP Domain</T>
      <Box x={95} y={100} w={70} h={40} label="A" tone="p" />
      <Box x={655} y={100} w={70} h={40} label="B" tone="a" />
      <Device cx={410} cy={70} kind="router" label="R1" />
      <Device cx={410} cy={150} kind="router" label="R2" />
      <Arrow d="M170 110 L385 74" tone="n" both />
      <Arrow d="M435 74 L650 110" tone="n" both />
      <Arrow d="M170 130 L385 148" tone="n" both />
      <Arrow d="M435 148 L650 130" tone="n" both />
      <T x={410} y={216} cls="dg-note" size={11}>(kedua router meredistribusi DUA ARAH)</T>
      {steps.map((s, i) => <Box key={i} x={60} y={236 + i * 34} w={700} h={28} label={s} tone="n" fs={11} r={8} />)}
      <Box x={60} y={420} w={700} h={44} label="Kalau AD dan metrik tidak diatur" sub="router bisa memilih jalur yang memutar balik: LOOP atau suboptimal routing" tone="no" fs={12} />
    </Fig>
  )
}

/* FHRP: virtual IP */
export function DgR1FhrpVirtualIp() {
  return (
    <Fig title="FHRP: dua router berbagi satu gateway virtual" sub="Host tidak perlu tahu router mana yang sedang bekerja" w={820} h={420}>
      <path d="M410 24 H650 V250 H410 Z" className="dg-region r-p" />
      <T x={530} y={18} cls="dg-region-lb">Virtual IP 192.168.1.1</T>
      <T x={530} y={44} cls="dg-note" size={10}>Virtual MAC 0000.0c07.ac0a</T>
      <Box x={425} y={64} w={210} h={56} label="Router-A (aktif)" sub="192.168.1.2" tone="ok" />
      <Box x={425} y={176} w={210} h={56} label="Router-B (standby)" sub="192.168.1.3" tone="n" />
      <Device cx={80} cy={148} kind="pc" label="Host" />
      <T x={80} y={196} cls="dg-note" size={10}>gateway 192.168.1.1</T>
      <Device cx={250} cy={148} kind="switch" label="Switch" />
      <path d="M104 148 H224" className="dg-lnk" />
      <Arrow d="M276 140 L425 100" tone="ok" />
      <Arrow d="M276 156 L425 196" tone="n" dash />
      <Device cx={740} cy={148} kind="cloud" label="Internet" />
      <Arrow d="M635 92 L705 138" tone="ok" />
      <Arrow d="M635 204 L705 160" tone="n" dash />
      <Box x={30} y={282} w={370} h={72} label="Host mengirim ke 192.168.1.1" sub="ARP dijawab MAC virtual, router aktif yang memproses" tone="ok" fs={12} />
      <Box x={420} y={282} w={370} h={72} label="Router-A mati: Router-B ambil alih" sub="IP dan MAC virtual, gratuitous ARP memperbarui MAC table switch" tone="warn" fs={12} />
      <T x={410} y={390} cls="dg-cap-in">Host TIDAK PERLU BERUBAH APA PUN</T>
    </Fig>
  )
}

/* Tiga model pengiriman */
export function DgR1MulticastModel() {
  const cols = [
    { x: 30, t: 'UNICAST', s: 'satu pengirim → satu penerima', k: 'u' },
    { x: 285, t: 'BROADCAST', s: 'satu pengirim → SEMUA di segmen', k: 'b' },
    { x: 540, t: 'MULTICAST', s: 'satu pengirim → yang BERLANGGANAN', k: 'm' },
  ]
  const notes: Record<string, string[]> = {
    u: ['100 penerima = 100 salinan', 'dikirim dari server', 'boros bandwidth di sisi pengirim'],
    b: ['Ke SEMUA di segmen, termasuk', 'yang tidak menginginkannya', 'Tidak melewati router'],
    m: ['Satu aliran, digandakan hanya', 'di titik percabangan', 'Bisa melewati router'],
  }
  return (
    <Fig title="Tiga model pengiriman" sub="Unicast, broadcast, dan multicast" w={820} h={320}>
      {cols.map((c) => {
        const cx = c.x + 125
        const rx = [cx - 85, cx, cx + 85]
        const tone = c.k === 'u' ? 'p' : c.k === 'b' ? 'warn' : 'ok'
        return (
          <g key={c.k}>
            <Box x={c.x} y={16} w={250} h={46} label={c.t} sub={c.s} tone="n" fs={12} />
            <Box x={cx - 45} y={80} w={90} h={28} label="Pengirim" tone="p" fs={11} />
            {c.k === 'm' && <Box x={cx - 35} y={125} w={70} h={26} label="Router" tone="n" fs={10} />}
            {c.k === 'm' && <Arrow d={`M${cx} 108 V125`} tone="ok" />}
            {rx.map((r, i) => {
              const dead = i === 1 && c.k !== 'u'
              const from = c.k === 'm' ? `M${cx} 151` : `M${cx} 108`
              return (
                <g key={i}>
                  {!(c.k === 'm' && i === 1) && <Arrow d={`${from} L${r} 190`} tone={tone} />}
                  <Box x={r - 35} y={192} w={70} h={28} label={`Rx${i + 1}`} tone={dead ? 'no' : 'n'} fs={10} />
                </g>
              )
            })}
            {c.k === 'b' && <T x={cx} y={236} cls="dg-note" size={9}>Rx2 tidak menginginkannya</T>}
            {c.k === 'm' && <T x={cx} y={236} cls="dg-note" size={9}>Rx2 tidak berlangganan</T>}
            {notes[c.k].map((l, i) => <T key={i} x={cx} y={262 + i * 16} cls="dg-note" size={10.5}>{l}</T>)}
          </g>
        )
      })}
    </Fig>
  )
}

/* IS-IS: level dan area */
export function DgR1IsisLevel() {
  return (
    <Fig title="Level dan area IS-IS" sub="Batas area ada di link, bukan di router: r2 dan r3 menghubungkan area ke backbone L2" w={820} h={300}>
      <path d="M20 60 H300 V170 H20 Z" className="dg-region r-a" />
      <T x={160} y={54} cls="dg-region-lb">Area 49.0001</T>
      <path d="M520 60 H800 V170 H520 Z" className="dg-region r-a" />
      <T x={660} y={54} cls="dg-region-lb">Area 49.0002</T>
      <path d="M80 110 H740" className="dg-lnk" />
      <path d="M240 110 L390 190" className="dg-lnk" />
      <path d="M430 190 L580 110" className="dg-lnk" />
      <Device cx={80} cy={110} kind="router" label="r1 (L1)" />
      <Device cx={240} cy={110} kind="router" label="r2 (L1/L2)" />
      <Device cx={580} cy={110} kind="router" label="r3 (L1/L2)" />
      <Device cx={740} cy={110} kind="router" label="r4 (L1)" />
      <Device cx={410} cy={200} kind="router" label="r5 (L2-only)" />
      <T x={410} y={80} cls="dg-region-lb">Backbone L2</T>
      <T x={410} y={102} cls="dg-note" size={11}>metrik 100</T>
      <T x={410} y={258} cls="dg-note" size={11}>area 49.0000</T>
    </Fig>
  )
}

/* Peering bilateral vs multilateral */
export function DgR1PeeringModel() {
  const L: [string, number, number][] = [['A', 100, 80], ['B', 300, 80], ['C', 100, 230], ['D', 300, 230]]
  const R: [string, number, number][] = [['A', 520, 80], ['B', 720, 80], ['C', 520, 230], ['D', 720, 230]]
  const pairs: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
  return (
    <Fig title="Peering bilateral vs multilateral" sub="Route server memangkas jumlah sesi BGP" w={820} h={340}>
      <T x={200} y={28} cls="dg-cap-in">Bilateral (n = 4)</T>
      <T x={620} y={28} cls="dg-cap-in">Multilateral (route server)</T>
      {pairs.map(([a, b], i) => <path key={i} d={`M${L[a][1]} ${L[a][2]} L${L[b][1]} ${L[b][2]}`} className="dg-lnk" />)}
      {R.map((r, i) => <path key={i} d={`M${r[1]} ${r[2]} L620 155`} className="dg-lnk" />)}
      {L.map(([k, x, y]) => <Box key={k} x={x - 25} y={y - 17} w={50} h={34} label={k} tone="p" fs={12} />)}
      {R.map(([k, x, y]) => <Box key={k} x={x - 25} y={y - 17} w={50} h={34} label={k} tone="p" fs={12} />)}
      <Box x={590} y={138} w={60} h={34} label="RS" tone="a" fs={12} />
      <Box x={140} y={284} w={120} h={36} label="6 sesi" tone="warn" fs={13} />
      <Box x={560} y={284} w={120} h={36} label="4 sesi" tone="ok" fs={13} />
    </Fig>
  )
}

/* NDP: NS dan NA */
export function DgR1NdpResolusi() {
  return (
    <Fig title="Address resolution IPv6: NS dan NA" sub="Pengganti ARP, memakai multicast solicited-node" w={820} h={370}>
      <Device cx={110} cy={70} kind="pc" label="Host A" />
      <T x={110} y={116} cls="dg-note" size={10}>2001:db8::1</T>
      <Device cx={710} cy={70} kind="pc" label="Host B" />
      <T x={710} y={116} cls="dg-note" size={10}>2001:db8::a1b2:c3d4</T>
      <path d="M110 126 V360" className="dg-lnk dg-dash" />
      <path d="M710 126 V360" className="dg-lnk dg-dash" />
      <Box x={230} y={20} w={360} h={50} label="1. Hitung solicited-node dari B" sub="ff02::1:ff + 24 bit terakhir → ff02::1:ffb2:c3d4" tone="p" fs={11.5} />
      <T x={410} y={146} cls="dg-lb" size={11}>2. NEIGHBOR SOLICITATION (ICMPv6 tipe 135)</T>
      <Arrow d="M112 156 H708" tone="a" />
      <T x={410} y={176} cls="dg-note" size={10.5}>Tujuan: ff02::1:ffb2:c3d4 (MULTICAST, bukan broadcast)</T>
      <T x={410} y={192} cls="dg-note" size={10.5}>Isi: "Siapa yang punya 2001:db8::a1b2:c3d4?"</T>
      <T x={410} y={208} cls="dg-note" size={10.5}>Opsi: Source Link-Layer Address (MAC saya)</T>
      <Box x={170} y={226} w={480} h={30} label="3. Hanya host dengan alamat solicited-node cocok yang memproses" tone="n" fs={11} r={8} />
      <T x={410} y={284} cls="dg-lb" size={11}>4. NEIGHBOR ADVERTISEMENT (tipe 136)</T>
      <Arrow d="M708 294 H112" tone="ok" />
      <T x={410} y={316} cls="dg-note" size={10.5}>Tujuan: 2001:db8::1 (unicast)</T>
      <T x={410} y={332} cls="dg-note" size={10.5}>Isi: "Ya, MAC saya aa:bb:cc:dd:ee:ff"</T>
    </Fig>
  )
}

/* 464XLAT */
export function DgR1Xlat464() {
  const items = [
    { l: 'Aplikasi', s: 'IPv4-only', tone: 'n' as const },
    { l: 'CLAT', s: 'di ponsel/perangkat', tone: 'p' as const },
    { l: 'Jaringan', s: 'IPv6-only', tone: 'a' as const },
    { l: 'PLAT / NAT64', s: 'di operator', tone: 'p' as const },
    { l: 'Internet', s: 'IPv4', tone: 'n' as const },
  ]
  return (
    <Fig title="464XLAT: IPv4 melewati jaringan IPv6-only" sub="Dua penerjemah, satu di tiap ujung" w={820} h={220}>
      {items.map((it, i) => <Box key={i} x={30 + i * 158} y={60} w={128} h={70} label={it.l} sub={it.s} tone={it.tone} fs={12} />)}
      {[0, 1, 2, 3].map((i) => <Arrow key={i} d={`M${160 + i * 158} 95 H${186 + i * 158}`} tone="n" />)}
      <T x={252} y={156} cls="dg-note" size={10.5}>terjemahkan</T>
      <T x={252} y={171} cls="dg-note" size={10.5}>IPv4 ke IPv6</T>
      <T x={568} y={156} cls="dg-note" size={10.5}>terjemahkan kembali</T>
      <T x={568} y={171} cls="dg-note" size={10.5}>ke IPv4</T>
    </Fig>
  )
}
