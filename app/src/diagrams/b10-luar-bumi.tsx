import { Fig, Box, Arrow, T, Device } from './primitives'

/* 11.4 Ketinggian orbit dan RTT propagasi minimum (bent pipe) */
export function DgLbOrbitRtt() {
  const orbit = [
    { x: 20, l: 'LEO, sekitar 550 km', s: 'putaran sekitar 95 menit', c: 'ribuan satelit untuk layanan global', tone: 'p' as const },
    { x: 300, l: 'MEO, 8.000 km (O3b mPOWER)', s: 'putaran sekitar 4,8 jam', c: 'SES: 6 satelit untuk layanan global', tone: 'a' as const },
    { x: 580, l: 'GEO, 35.786 km', s: 'putaran 23 jam 56 menit', c: '3 satelit, cakupan hampir global', tone: 'warn' as const },
  ]
  // Skala batang: 600 ms = 500 px, mulai x = 290.
  const X0 = 290
  const px = (ms: number) => (ms * 500) / 600
  const baris = [
    { l: 'Kabel laut Jakarta-Singapura (1.055 km)', ms: 10.6, v: '10,6 ms', tone: 'ok' as const },
    { l: 'LEO 550 km, satelit di atas kepala', ms: 7.3, v: '7,3 ms', tone: 'p' as const },
    { l: 'LEO 550 km, elevasi 25 derajat', ms: 15, v: '15,0 ms', tone: 'p' as const },
    { l: 'MEO 8.000 km, di atas kepala', ms: 107, v: '107 ms', tone: 'a' as const },
    { l: 'GEO, tepat di bawah satelit', ms: 477, v: '477 ms', tone: 'warn' as const },
    { l: 'GEO, paling sedikit (RFC 2488)', ms: 558, v: '558 ms', tone: 'no' as const },
  ]
  const ticks = [0, 100, 200, 300, 400, 500, 600]
  return (
    <Fig title="Ketinggian orbit dan RTT propagasi minimum" sub="Bent pipe: terminal ke satelit ke gateway lalu kembali, sama dengan empat kali jarak ke satelit" w={860} h={390}>
      {orbit.map(o => (
        <g key={o.l}>
          <Box x={o.x} y={20} w={260} h={54} label={o.l} sub={o.s} tone={o.tone} fs={12.5} />
          <T x={o.x + 130} y={96} cls="dg-note" size={11}>{o.c}</T>
        </g>
      ))}
      <T x={20} y={142} anchor="start" cls="dg-cap-in">RTT propagasi, dihitung dari kecepatan cahaya</T>
      {ticks.map(t => <path key={t} d={`M${X0 + px(t)} 345 V355`} className="dg-axis" />)}
      {baris.map((b, i) => {
        const y = 180 + i * 30
        return (
          <g key={b.l}>
            <T x={20} y={y} anchor="start" size={11}>{b.l}</T>
            <Box x={X0} y={y - 11} w={Math.max(px(b.ms), 3)} h={14} tone={b.tone} r={3} />
            <T x={X0 + px(b.ms) + 8} y={y} anchor="start" cls="dg-sb" size={11}>{b.v}</T>
          </g>
        )
      })}
      <path d={`M${X0} 350 H${X0 + px(600)}`} className="dg-axis" />
      {ticks.map(t => <T key={t} x={X0 + px(t)} y={368} cls="dg-note" size={10.5}>{t === 600 ? '600 ms' : String(t)}</T>)}
    </Fig>
  )
}

/* 11.4 VSAT topologi bintang: VSAT ke VSAT lewat hub = double hop */
export function DgLbVsatBintang() {
  return (
    <Fig title="VSAT topologi bintang: dari cabang ke cabang lewat hub" sub="Setiap lalu lintas VSAT mampir ke hub, jadi VSAT ke VSAT naik-turun ke satelit dua kali" w={860} h={380}>
      <Box x={330} y={20} w={200} h={50} label="Satelit GEO" sub="35.786 km" tone="a" />
      <Box x={30} y={250} w={170} h={50} label="VSAT cabang A" sub="antena kecil" tone="n" />
      <Box x={345} y={250} w={170} h={50} label="Hub" sub="stasiun bumi besar" tone="p" />
      <Box x={660} y={250} w={170} h={50} label="VSAT cabang B" sub="antena kecil" tone="n" />
      <Arrow d="M115 250 L385 72" tone="p" />
      <Arrow d="M418 72 V248" tone="p" />
      <Arrow d="M442 248 V72" tone="a" />
      <Arrow d="M475 72 L745 250" tone="a" />
      <T x={170} y={150} size={11.5}>lompatan 1: sekitar 260 ms</T>
      <T x={690} y={150} size={11.5}>lompatan 2: sekitar 260 ms</T>
      <T x={410} y={170} anchor="end" cls="dg-note" size={10.5}>ke hub</T>
      <T x={450} y={170} anchor="start" cls="dg-note" size={10.5}>dari hub</T>
      <T x={430} y={326} cls="dg-note" size={11}>VSAT ke VSAT: dua lompatan GEO, sekitar 520 ms satu arah sebelum antrean</T>
      <T x={430} y={346} cls="dg-note" size={11}>ITU-T G.114: delay satu arah sebaiknya tidak melebihi 400 ms untuk perencanaan jaringan</T>
      <T x={430} y={366} cls="dg-note" size={11}>RFC 3135: outroute (hub ke VSAT) jauh lebih besar daripada inroute (VSAT ke hub)</T>
    </Fig>
  )
}

/* 11.4 Jalur data Starlink: terminal, satelit, laser, gateway, PoP, internet */
export function DgLbJalurStarlink() {
  return (
    <Fig title="Jalur data Starlink: terminal, satelit, laser, gateway, PoP" sub="Satelit turun langsung ke gateway yang terlihat, atau mengoper lewat laser bila gateway jauh" w={860} h={380}>
      <Box x={150} y={30} w={170} h={48} label="Satelit LEO A" sub="sekitar 550 km" tone="p" />
      <Box x={430} y={30} w={170} h={48} label="Satelit LEO B" sub="sekitar 550 km" tone="p" />
      <Arrow d="M322 54 H428" tone="a" dash both label="laser" lx={375} ly={46} />
      <T x={375} y={100} cls="dg-note" size={11}>3 laser per satelit, hingga 200 Gbps</T>

      <Box x={40} y={230} w={190} h={50} label="Terminal pengguna" sub="antena phased array" tone="n" />
      <Arrow d="M135 230 L230 80" tone="p" both label="link pengguna (Ku-band)" lx={92} ly={160} />

      <Box x={440} y={230} w={130} h={50} label="Gateway" sub="antena besar" tone="n" />
      <Arrow d="M515 80 L507 228" tone="p" both label="link gateway" lx={572} ly={160} />

      <Box x={620} y={230} w={100} h={50} label="PoP" sub="ke internet" tone="ok" />
      <Arrow d="M572 255 H618" tone="ok" both />
      <Box x={770} y={230} w={70} h={50} label="Internet" tone="n" fs={12} />
      <Arrow d="M722 255 H768" tone="ok" both />

      <path d="M20 300 H840" className="dg-lnk thin" />
      <T x={840} y={318} anchor="end" cls="dg-note" size={10.5}>permukaan Bumi</T>
      <T x={430} y={336} cls="dg-note" size={11}>Propagasi radio 1,8 sampai 3,6 ms per ruas; bolak-balik biasanya di bawah 10 ms (SpaceX)</T>
      <T x={430} y={354} cls="dg-note" size={11}>Median RTT router ke internet: 25,7 ms (Amerika Serikat, jam sibuk, Juni 2025)</T>
      <T x={430} y={372} cls="dg-note" size={11}>Terminal hanya memakai satelit di atas elevasi 25 derajat; rute lewat laser bisa menambah latensi</T>
    </Fig>
  )
}

/* 11.4 PEP split connection, dan kenapa IPsec/QUIC tidak bisa dipecah */
export function DgLbPepSplit() {
  return (
    <Fig title="PEP memecah satu koneksi TCP menjadi tiga potongan" sub="ACK lokal membuat komputer Anda melihat RTT pendek; enkripsi lapisan bawah membuat PEP buta" w={860} h={370}>
      <T x={20} y={16} anchor="start" cls="dg-cap-in">TCP biasa: dipecah PEP</T>
      <Device cx={60} cy={78} kind="pc" label="Komputer" />
      <Box x={150} y={55} w={140} h={50} label="PEP terminal" sub="di modem VSAT" tone="p" />
      <Box x={360} y={24} w={140} h={46} label="Satelit GEO" sub="35.786 km" tone="a" />
      <Box x={570} y={55} w={140} h={50} label="PEP hub" sub="di stasiun bumi" tone="p" />
      <Device cx={790} cy={78} kind="server" label="Server" />
      <Arrow d="M84 80 H148" tone="ok" both />
      <Arrow d="M290 72 L358 52" tone="a" both />
      <Arrow d="M502 52 L568 72" tone="a" both />
      <Arrow d="M712 80 H772" tone="ok" both />
      <path d="M40 134 V144 H290 V134" className="dg-brace" />
      <path d="M296 134 V144 H564 V134" className="dg-brace" />
      <path d="M570 134 V144 H820 V134" className="dg-brace" />
      <T x={165} y={164} size={11.5}>TCP 1: RTT beberapa ms</T>
      <T x={165} y={182} cls="dg-note" size={10.5}>ACK langsung dari PEP</T>
      <T x={430} y={164} size={11.5}>Koneksi 2: protokol khusus link satelit</T>
      <T x={430} y={182} cls="dg-note" size={10.5}>RTT sekitar 600 ms, sering dengan kompresi</T>
      <T x={695} y={164} size={11.5}>TCP 3: RTT jaringan darat</T>
      <T x={695} y={182} cls="dg-note" size={10.5}>ke server tujuan</T>

      <T x={20} y={226} anchor="start" cls="dg-cap-in">Di dalam IPsec ESP atau QUIC: tidak bisa dipecah</T>
      <g className="dg-dim">
        <Box x={200} y={240} w={130} h={28} label="PEP terminal" tone="p" fs={11.5} r={7} />
        <Box x={530} y={240} w={130} h={28} label="PEP hub" tone="p" fs={11.5} r={7} />
      </g>
      <Box x={20} y={244} w={120} h={44} label="Komputer" tone="n" fs={12} />
      <Box x={720} y={244} w={120} h={44} label="Server" tone="n" fs={12} />
      <Arrow d="M142 280 H718" tone="no" both />
      <T x={430} y={316} size={11.5}>Satu koneksi ujung ke ujung, menanggung RTT GEO penuh</T>
      <T x={430} y={336} cls="dg-note" size={11}>Header transport terenkripsi: PEP tidak bisa membaca atau membalas ACK atas nama ujung</T>
      <T x={430} y={354} cls="dg-note" size={11}>RFC 3135 (IPsec) dan RFC 9312 (QUIC)</T>
    </Fig>
  )
}

/* 11.4 NASA Deep Space Network: tiga kompleks sekitar 120 derajat bujur */
export function DgLbDsnCakupan() {
  const cx = 250, cy = 190, R = 130
  const titik = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
  }
  // Busur 120 derajat di sekitar setiap kompleks (sudut matematis, berlawanan arah jarum jam).
  const busur = (dari: number, ke: number) => {
    const p = titik(dari, R), q = titik(ke, R)
    return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} A${R} ${R} 0 0 0 ${q.x.toFixed(1)} ${q.y.toFixed(1)}`
  }
  const kompleks = [
    { nama: 'Goldstone', deg: 90, cls: 'dg-lnk v10' },
    { nama: 'Madrid', deg: 210, cls: 'dg-lnk v20' },
    { nama: 'Canberra', deg: 330, cls: 'dg-ray r2' },
  ]
  return (
    <Fig title="NASA Deep Space Network: tiga kompleks, sekitar 120 derajat bujur" sub="Saat Bumi berputar, setiap kompleks menjaga sepertiga langit; wahana selalu terlihat dari salah satunya" w={860} h={380}>
      <circle cx={cx} cy={cy} r={90} className="dg-pdu" />
      <T x={cx} y={cy + 4} cls="dg-cap-in">Bumi</T>
      <T x={cx} y={cy + 22} cls="dg-note" size={10.5}>dari atas kutub utara</T>
      <Arrow d={`M${titik(60, 62).x.toFixed(1)} ${titik(60, 62).y.toFixed(1)} A62 62 0 0 0 ${titik(120, 62).x.toFixed(1)} ${titik(120, 62).y.toFixed(1)}`} tone="n" />
      {kompleks.map(k => {
        // Label atas di antara Bumi dan busur; label bawah di luar busur, rata ke arah luar.
        const atas = k.deg === 90
        const s = titik(k.deg, 90), l = titik(k.deg, atas ? 112 : 150)
        const anchor: 'start' | 'middle' | 'end' = atas ? 'middle' : (Math.cos((k.deg * Math.PI) / 180) < 0 ? 'end' : 'start')
        return (
          <g key={k.nama}>
            <path d={busur(k.deg - 60, k.deg + 60)} className={k.cls} />
            <circle cx={s.x} cy={s.y} r={7} className="dg-hub" />
            <T x={l.x} y={l.y + 4} anchor={anchor} size={11.5}>{k.nama}</T>
          </g>
        )
      })}
      <Box x={600} y={150} w={210} h={50} label="Wahana antarplanet" sub="jauh di luar orbit Bumi" tone="a" />
      <Arrow d={`M${cx + R + 2} ${cy} H598`} tone="a" dash label="sinyal" lx={490} ly={180} />
      <T x={600} y={238} anchor="start" size={11}>Goldstone (California), Madrid (Spanyol),</T>
      <T x={600} y={256} anchor="start" size={11}>Canberra (Australia)</T>
      <T x={600} y={282} anchor="start" cls="dg-note" size={11}>Setiap kompleks: sedikitnya 4 antena,</T>
      <T x={600} y={300} anchor="start" cls="dg-note" size={11}>terbesar 70 m, juga antena 34 m</T>
      <T x={600} y={326} anchor="start" cls="dg-note" size={11}>Sebelum wahana tenggelam di cakrawala satu</T>
      <T x={600} y={344} anchor="start" cls="dg-note" size={11}>kompleks, kompleks berikutnya mengambil alih</T>
      <T x={20} y={372} anchor="start" cls="dg-note" size={10.5}>Skema: jarak antarkompleks digambar rata 120 derajat</T>
    </Fig>
  )
}

/* 11.4 DTN store-and-forward: bundle menunggu kontak berikutnya */
export function DgLbBundleDtn() {
  const X0 = 230
  const tx = (t: number) => X0 + t * 6.1
  const node = [
    { x: 20, l: 'Rover', s: 'di permukaan Mars', tone: 'n' as const },
    { x: 233, l: 'Orbiter Mars', s: 'relay, menyimpan bundle', tone: 'warn' as const },
    { x: 446, l: 'Stasiun DSN', s: 'Goldstone, Madrid, Canberra', tone: 'a' as const },
    { x: 659, l: 'Pusat misi', s: 'penerima akhir', tone: 'n' as const },
  ]
  const hop = [
    { c: 216.5, l: 'UHF' }, { c: 429.5, l: 'X-band' }, { c: 642.5, l: 'darat' },
  ]
  return (
    <Fig title="DTN: bundle disimpan sampai kontak berikutnya" sub="Skenario DTN dengan rover dan orbiter, custody transfer opsional; setiap ruas hanya perlu tersambung pada gilirannya" w={860} h={380}>
      {node.map(n => <Box key={n.l} x={n.x} y={24} w={180} h={52} label={n.l} sub={n.s} tone={n.tone} fs={12.5} />)}
      {hop.map(h => (
        <g key={h.l}>
          <Arrow d={`M${h.c - 15} 50 H${h.c + 15}`} tone="p" />
          <T x={h.c} y={98} cls="dg-note" size={10.5}>{h.l}</T>
        </g>
      ))}

      <T x={20} y={154} anchor="start" size={11.5}>Rover ke orbiter</T>
      <T x={20} y={204} anchor="start" size={11.5}>Orbiter ke stasiun DSN</T>
      <T x={20} y={254} anchor="start" size={11.5}>DSN ke pusat misi</T>

      <Box x={tx(5)} y={141} w={tx(22) - tx(5)} h={18} label="kontak 1" tone="p" fs={11} r={4} />
      <Box x={tx(22)} y={191} w={tx(62) - tx(22)} h={18} label="bundle disimpan di orbiter" tone="warn" fs={11} r={4} />
      <Box x={tx(62)} y={191} w={tx(80) - tx(62)} h={18} label="kontak 2" tone="p" fs={11} r={4} />
      <path d={`M${X0} 250 H${tx(80) - 4}`} className="dg-lnk thin dash" />
      <path d={`M${tx(95) + 4} 250 H840`} className="dg-lnk thin dash" />
      <Box x={tx(80)} y={241} w={tx(95) - tx(80)} h={18} label="teruskan" tone="ok" fs={11} r={4} />

      <Arrow d={`M${tx(22)} 160 V189`} tone="a" />
      <Arrow d={`M${tx(80)} 210 V239`} tone="a" />
      <T x={tx(22) + 8} y={179} anchor="start" cls="dg-note" size={10.5}>custody pindah ke orbiter</T>
      <T x={tx(80) - 8} y={230} anchor="end" cls="dg-note" size={10.5}>custody pindah ke DSN</T>

      <Arrow d={`M${X0} 290 H842`} tone="n" />
      <T x={842} y={308} anchor="end" cls="dg-note" size={10.5}>waktu</T>
      <T x={430} y={338} size={11.5}>Tidak pernah ada saat ketiga ruas tersambung bersamaan</T>
      <T x={430} y={358} cls="dg-note" size={11}>TCP membutuhkan jalur ujung ke ujung; DTN cukup satu ruas pada satu waktu (RFC 4838, RFC 9171)</T>
    </Fig>
  )
}
