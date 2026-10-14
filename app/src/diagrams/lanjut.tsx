import { useState } from 'react'
import { Fig, Box, Arrow, T, Device } from './primitives'

/* Area OSPF */
export function DgOspfArea() {
  return (
    <Fig title="Hierarki area OSPF" sub="Semua area harus menempel ke Area 0, itu aturan yang tidak bisa ditawar" w={820} h={310}>
      <path d="M250 20 H570 V120 H250 Z" className="dg-region r-p" />
      <T x={410} y={14} cls="dg-region-lb">Area 0: backbone</T>
      <Device cx={330} cy={70} kind="router" label="R1" /><Device cx={490} cy={70} kind="router" label="R2" />
      <path d="M355 70 H465" className="dg-lnk" />
      <path d="M60 190 H360 V290 H60 Z" className="dg-region r-a" />
      <T x={210} y={184} cls="dg-region-lb">Area 1</T>
      <path d="M460 190 H760 V290 H460 Z" className="dg-region r-a" />
      <T x={610} y={184} cls="dg-region-lb">Area 2 (stub)</T>
      <Device cx={210} cy={235} kind="router" label="R3" /><Device cx={610} cy={235} kind="router" label="R4" />
      <path d="M320 90 L235 215" className="dg-lnk" /><path d="M500 90 L590 215" className="dg-lnk" />
      <Box x={252} y={130} w={140} h={26} label="ABR" tone="p" fs={10} r={8} />
      <Box x={432} y={130} w={140} h={26} label="ABR" tone="p" fs={10} r={8} />
      <T x={410} y={172} cls="dg-note" size={10}>Area Border Router meringkas rute antar-area, LSA flooding berhenti di sini</T>
      <Box x={60} y={20} w={160} h={100} label="LSA tipe 1 & 2" sub="di dalam satu area" tone="a" fs={10} />
      <Box x={600} y={20} w={160} h={100} label="LSA tipe 3 & 5" sub="antar-area & eksternal" tone="a" fs={10} />
      <T x={410} y={306} cls="dg-note" size={10}>Metric OSPF = cost = referensi bandwidth ÷ bandwidth interface. Default referensi 100 Mbps, wajib dinaikkan di jaringan gigabit.</T>
    </Fig>
  )
}

/* BGP antar AS */
export function DgBgp() {
  return (
    <Fig title="BGP: routing antar organisasi" sub="Yang dipertukarkan bukan sekadar rute, tapi kebijakan" w={820} h={300}>
      {[{ x: 130, as: 'AS 64500', d: 'ISP A' }, { x: 410, as: 'AS 64501', d: 'Perusahaan Anda' }, { x: 690, as: 'AS 64502', d: 'ISP B' }].map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={110} r={72} className={`dg-as as${i}`} />
          <text x={n.x} y={100} className="dg-lb" style={{ fontSize: 13 }}>{n.as}</text>
          <text x={n.x} y={122} className="dg-sb">{n.d}</text>
          <Device cx={n.x} cy={155} kind="router" s={0.55} />
        </g>
      ))}
      <path d="M205 110 H338" className="dg-ebgp" /><path d="M482 110 H615" className="dg-ebgp" />
      <T x={271} y={96} cls="dg-note" size={10}>eBGP</T><T x={548} y={96} cls="dg-note" size={10}>eBGP</T>
      <Box x={60} y={212} w={700} h={30} label="AS-PATH: 64502 64501 (daftar AS yang dilewati, sekaligus pencegah loop)" tone="grad" fs={10.5} />
      <T x={200} y={266} cls="dg-note" size={10}>Prefix lebih spesifik menang di tabel</T>
      <T x={200} y={282} cls="dg-note" size={10}>routing global: dasar hijack BGP.</T>
      <T x={620} y={266} cls="dg-note" size={10}>Atribut penentu: Weight → Local Pref →</T>
      <T x={620} y={282} cls="dg-note" size={10}>AS-PATH terpendek → Origin → MED.</T>
    </Fig>
  )
}

/* Administrative distance */
export function DgAdminDistance() {
  const rows = [['Connected', 0], ['Static', 1], ['eBGP', 20], ['OSPF', 110], ['IS-IS', 115], ['RIP', 120], ['iBGP', 200], ['Tidak dipercaya', 255]]
  return (
    <Fig title="Administrative distance: siapa yang lebih dipercaya" sub="Makin kecil angkanya, makin dipercaya sumber rutenya" w={820} h={230}>
      <path d="M70 60 H760" className="dg-axis" />
      {rows.map((r, i) => {
        const x = 70 + (Number(r[1]) / 255) * 690
        return (<g key={i}>
          <circle cx={x} cy={60} r={7} className={`dg-adot d${i}`} />
          <path d={`M${x} 60 V${i % 2 ? 88 : 34}`} className="dg-lnk" />
          <text x={x} y={i % 2 ? 104 : 28} className="dg-sb">{r[0]}</text>
          <text x={x} y={i % 2 ? 120 : 14} className="dg-note" style={{ fontSize: 10 }}>{r[1]}</text>
        </g>)
      })}
      <Box x={70} y={148} w={330} h={66} label="AD memilih PROTOKOL mana yang dipakai" sub="dibandingkan saat prefix-nya sama persis" tone="p" fs={11} />
      <Box x={430} y={148} w={330} h={66} label="Metric memilih JALUR di dalam protokol itu" sub="cost OSPF, hop count RIP, dsb." tone="a" fs={11} />
    </Fig>
  )
}

/* Anatomi alamat IPv6 */
export function DgIpv6() {
  return (
    <Fig title="Membaca alamat IPv6" sub="128 bit, ditulis 8 grup heksadesimal" w={820} h={280}>
      <T x={410} y={30} cls="dg-mono dg-big">2001:0db8:85a3:1234:0000:8a2e:0370:7334</T>
      <Box x={60} y={54} w={340} h={44} label="Global routing prefix: /48 dari RIR" tone="p" fs={10.5} />
      <Box x={404} y={54} w={110} h={44} label="Subnet /64" tone="a" fs={10.5} />
      <Box x={518} y={54} w={242} h={44} label="Interface ID: 64 bit" tone="grad" fs={10.5} />
      <T x={410} y={126} cls="dg-cap-in">Aturan penyingkatan</T>
      <T x={410} y={150} cls="dg-mono dg-sb">2001:0db8:0000:0000:0000:0000:0000:0001</T>
      <Arrow d="M410 158 V172" tone="p" />
      <T x={410} y={192} cls="dg-mono dg-sb">2001:db8::1</T>
      <T x={410} y={212} cls="dg-note" size={10}>Nol di depan tiap grup boleh dibuang · Satu deret grup nol boleh diganti :: (hanya sekali)</T>
      {[['::1', 'loopback'], ['fe80::/10', 'link-local: selalu ada'], ['fc00::/7', 'unique local (privat)'], ['2000::/3', 'global unicast'], ['ff00::/8', 'multicast: IPv6 tak punya broadcast']].map((r, i) => (
        <g key={i}>
          <rect x={60 + (i % 3) * 240} y={228 + Math.floor(i / 3) * 26} width={230} height={22} rx={7} className="dg-row" />
          <text x={72 + (i % 3) * 240} y={243 + Math.floor(i / 3) * 26} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r[0]}</text>
          <text x={150 + (i % 3) * 240} y={243 + Math.floor(i / 3) * 26} className="dg-note" style={{ textAnchor: 'start', fontSize: 9.5 }}>{r[1]}</text>
        </g>
      ))}
    </Fig>
  )
}

/* Kanal Wi-Fi 2.4 GHz */
export function DgWifiChannels() {
  const [sel, setSel] = useState([1, 6, 11])
  const chX = (c: number) => 70 + (c - 1) * 58
  return (
    <Fig title="Kenapa hanya kanal 1, 6, dan 11" sub="Di 2,4 GHz tiap kanal selebar 22 MHz tapi jaraknya cuma 5 MHz" w={820} h={260}>
      <path d="M50 190 H790" className="dg-axis" />
      {Array.from({ length: 13 }, (_, i) => i + 1).map(c => (
        <g key={c} className="dg-click" onClick={() => setSel(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c])}>
          <path d={`M${chX(c) - 46} 190 Q${chX(c)} ${sel.includes(c) ? 60 : 140} ${chX(c) + 46} 190 Z`}
            className={`dg-chan ${sel.includes(c) ? 'on' : ''}`} />
          <text x={chX(c)} y={208} className={`dg-sb ${sel.includes(c) ? 'dg-win-tx' : ''}`}>{c}</text>
        </g>
      ))}
      <T x={420} y={228} cls="dg-sb">nomor kanal (2,412 – 2,472 GHz)</T>
      <T x={420} y={250} cls="dg-note" size={10}>
        {sel.length === 3 && sel.includes(1) && sel.includes(6) && sel.includes(11)
          ? 'Tepat: 1, 6, 11 tidak saling tumpang tindih. Inilah satu-satunya trio bersih di 2,4 GHz.'
          : 'Klik kanal untuk menyalakan. Coba cari tiga kanal yang lengkungnya tidak bersentuhan sama sekali.'}
      </T>
      <T x={420} y={40} cls="dg-note" size={10}>Kanal yang tumpang tindih bukan berbagi waktu dengan sopan, mereka saling merusak sinyal.</T>
    </Fig>
  )
}

/* CSMA/CA */
export function DgCsmaCa() {
  return (
    <Fig title="CSMA/CA: kenapa Wi-Fi melambat saat ramai" sub="Udara tidak bisa dipakai dua orang sekaligus, jadi semua harus antre" w={820} h={280}>
      {[
        ['Dengarkan dulu', 'Carrier sense: ada yang memancar?'],
        ['Tunggu DIFS', 'Jeda wajib sebelum boleh bicara'],
        ['Backoff acak', 'Undi angka mundur agar tidak barengan'],
        ['Kirim frame', 'Baru boleh memancar'],
        ['Tunggu ACK', 'Tanpa ACK = dianggap hilang, ulangi'],
      ].map((s, i) => (
        <g key={i}>
          <Box x={45 + i * 156} y={60} w={140} h={70} label={s[0]} tone={i === 3 ? 'grad' : 'n'} fs={11} />
          <text x={115 + i * 156} y={148} className="dg-note" style={{ fontSize: 9.5 }}>{s[1]}</text>
          {i < 4 && <Arrow d={`M187 95 H${199 + i * 156}`} tone="p" />}
        </g>
      ))}
      <Box x={45 + 0 * 156} y={60} w={140} h={70} label="Dengarkan dulu" tone="n" fs={11} />
      <T x={410} y={40} cls="dg-note" size={10}>Half-duplex: satu perangkat bicara, sisanya diam menunggu.</T>
      <Box x={60} y={186} w={340} h={76} label="Makin banyak klien" sub="giliran makin jarang → throughput per klien turun drastis" tone="warn" fs={11} />
      <Box x={420} y={186} w={340} h={76} label="Klien lambat menulari yang cepat" sub="perangkat 802.11b/g menahan udara lebih lama per frame" tone="no" fs={11} />
    </Fig>
  )
}

/* Terowongan VPN */
export function DgVpnTunnel() {
  return (
    <Fig title="VPN site-to-site: paket di dalam paket" sub="Header luar untuk internet, header dalam untuk jaringan privat" w={820} h={300}>
      <path d="M40 40 H250 V180 H40 Z" className="dg-region r-a" />
      <T x={145} y={32} cls="dg-region-lb">Kantor Pusat 10.1.0.0/24</T>
      <path d="M570 40 H780 V180 H570 Z" className="dg-region r-a" />
      <T x={675} y={32} cls="dg-region-lb">Cabang 10.2.0.0/24</T>
      <Device cx={100} cy={110} kind="pc" label="10.1.0.5" s={0.8} />
      <Device cx={210} cy={110} kind="firewall" label="Gateway" s={0.75} />
      <Device cx={610} cy={110} kind="firewall" label="Gateway" s={0.75} />
      <Device cx={720} cy={110} kind="pc" label="10.2.0.9" s={0.8} />
      <Device cx={410} cy={110} kind="cloud" label="Internet publik" s={1.6} />
      <path d="M245 110 H340" className="dg-lnk" /><path d="M480 110 H575" className="dg-lnk" />
      <path d="M245 110 C320 40 500 40 575 110" className="dg-tunnel" />
      <T x={410} y={54} cls="dg-sb">Terowongan terenkripsi</T>
      <T x={410} y={190} cls="dg-note" size={10}>Bagi internet ini hanya paket biasa antara dua IP publik.</T>
      <T x={410} y={222} cls="dg-cap-in">Isi paket saat melintas</T>
      <Box x={90} y={238} w={150} h={44} label="IP luar" sub="publik → publik" tone="p" fs={10} />
      <Box x={244} y={238} w={110} h={44} label="ESP" sub="enkripsi" tone="warn" fs={10} />
      <Box x={358} y={238} w={150} h={44} label="IP dalam" sub="10.1.0.5 → 10.2.0.9" tone="a" fs={10} />
      <Box x={512} y={238} w={140} h={44} label="Payload" tone="grad" fs={10} />
      <Box x={656} y={238} w={74} h={44} label="Auth" tone="ok" fs={10} />
      <path d="M244 284 V296 H652 V284" className="dg-brace" />
    </Fig>
  )
}

/* Firewall stateful vs stateless */
export function DgFirewall() {
  return (
    <Fig title="Stateless vs stateful" sub="Yang satu menilai tiap paket sendirian, yang lain mengingat percakapan" w={820} h={300}>
      <T x={205} y={24} cls="dg-cap-in">Stateless (ACL biasa)</T>
      <Box x={45} y={40} w={320} h={110} label="" tone="n" />
      {['Paket masuk → cek daftar aturan', 'Cocok? izinkan / tolak', 'Selesai: tidak diingat'].map((t, i) =>
        <T key={i} x={205} y={70 + i * 26} cls="dg-sb" size={11}>{t}</T>)}
      <T x={205} y={170} cls="dg-note" size={10}>Balasan harus dibolehkan lewat aturan terpisah →</T>
      <T x={205} y={186} cls="dg-note" size={10}>gampang salah dan gampang terlalu longgar.</T>

      <T x={615} y={24} cls="dg-cap-in">Stateful</T>
      <Box x={455} y={40} w={320} h={110} label="" tone="p" />
      {['Paket keluar → catat di tabel koneksi', 'Balasan dicocokkan ke tabel', 'Cocok = otomatis diizinkan'].map((t, i) =>
        <T key={i} x={615} y={70 + i * 26} cls="dg-sb" size={11}>{t}</T>)}
      <T x={615} y={170} cls="dg-note" size={10}>Aturan jadi jauh lebih pendek dan lebih aman.</T>

      <Box x={45} y={206} w={730} h={26} label="Tabel koneksi (conntrack)" tone="a" fs={10.5} />
      {[['10.0.0.5:51001', '93.184.216.34:443', 'ESTABLISHED'], ['10.0.0.9:49222', '1.1.1.1:53', 'ASSURED']].map((r, i) => (
        <g key={i}>
          <rect x={45} y={236 + i * 26} width={730} height={22} rx={6} className="dg-row" />
          <text x={70} y={251 + i * 26} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r[0]}</text>
          <text x={280} y={251 + i * 26} className="dg-sb">→</text>
          <text x={320} y={251 + i * 26} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r[1]}</text>
          <text x={620} y={251 + i * 26} className="dg-sb" style={{ textAnchor: 'start' }}>{r[2]}</text>
        </g>
      ))}
      <T x={410} y={292} cls="dg-note" size={10}>Linux: <tspan className="dg-mono">conntrack -L</tspan> · MikroTik: <tspan className="dg-mono">/ip firewall connection print</tspan> · Aturan pertama yang paling berguna: terima <tspan className="dg-mono">established,related</tspan>.</T>
    </Fig>
  )
}

/* Urutan evaluasi ACL */
export function DgAclOrder() {
  const rules = [
    { n: 10, a: 'permit', d: 'tcp any host 10.0.0.10 eq 443', ok: true },
    { n: 20, a: 'deny', d: 'ip 10.0.0.0/8 any', ok: false },
    { n: 30, a: 'permit', d: 'ip any any', ok: true, dead: true },
  ]
  return (
    <Fig title="ACL dievaluasi dari atas ke bawah, berhenti di kecocokan pertama" sub="Urutan salah = aturan di bawahnya jadi hiasan" w={820} h={260}>
      {rules.map((r, i) => (
        <g key={i}>
          <rect x={60} y={40 + i * 54} width={640} height={44} rx={10} className={`dg-acl ${r.ok ? 'ok' : 'no'} ${r.dead ? 'dead' : ''}`} />
          <text x={90} y={67 + i * 54} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r.n}</text>
          <text x={140} y={67 + i * 54} className={`dg-lb ${r.ok ? 'tx-ok' : 'tx-no'}`} style={{ textAnchor: 'start', fontSize: 12 }}>{r.a}</text>
          <text x={230} y={67 + i * 54} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r.d}</text>
          {r.dead && <text x={715} y={67 + i * 54} className="dg-note" style={{ textAnchor: 'start', fontSize: 10 }}>tak pernah tercapai</text>}
          {i < 2 && <Arrow d={`M380 ${84 + i * 54} V${94 + i * 54}`} tone="p" />}
        </g>
      ))}
      <Box x={60} y={206} w={640} h={40} label="implicit deny any any: selalu ada di akhir, walau tidak ditulis" tone="no" fs={11} />
      <T x={760} y={140} cls="dg-note" size={10} anchor="middle">Cisco: dari</T>
      <T x={760} y={156} cls="dg-note" size={10} anchor="middle">atas ke bawah</T>
    </Fig>
  )
}

/* Arsitektur tiga tingkat vs spine-leaf */
export function DgArsitektur() {
  return (
    <Fig title="Tiga tingkat klasik vs spine-leaf" sub="Pola trafik data center berubah dari utara-selatan ke timur-barat" w={820} h={310}>
      <T x={200} y={24} cls="dg-cap-in">Core – Distribution – Access</T>
      {[[200, 50, 1], [130, 130, 2], [200, 210, 4]].map(([cx, y, n], li) => (
        <g key={li}>{Array.from({ length: n as number }, (_, i) => {
          const x = (n as number) === 1 ? 200 : (n as number) === 2 ? 120 + i * 160 : 65 + i * 90
          return <g key={i}>
            <Box x={x - 34} y={y as number} w={68} h={34} label={['Core', 'Dist', 'Acc'][li]} tone={li === 0 ? 'grad' : li === 1 ? 'p' : 'a'} fs={10} r={8} />
            {li > 0 && (li === 1
              ? <path d={`M${x} ${y as number} L200 84`} className="dg-lnk" />
              : <><path d={`M${x} ${y as number} L${120 + (i < 2 ? 0 : 1) * 160} 164`} className="dg-lnk" /></>)}
          </g>
        })}</g>
      ))}
      <T x={200} y={272} cls="dg-note" size={10}>Bagus untuk trafik naik-turun (klien → server)</T>
      <T x={200} y={288} cls="dg-note" size={10}>Server ke server bisa memutar jauh.</T>

      <T x={610} y={24} cls="dg-cap-in">Spine – Leaf</T>
      {[0, 1].map(i => <Box key={i} x={490 + i * 180} y={70} w={110} h={36} label={`Spine ${i + 1}`} tone="grad" fs={10} r={8} />)}
      {[0, 1, 2, 3].map(i => <Box key={i} x={450 + i * 90} y={190} w={76} h={36} label={`Leaf ${i + 1}`} tone="a" fs={10} r={8} />)}
      {[0, 1].map(s => [0, 1, 2, 3].map(l =>
        <path key={`${s}${l}`} d={`M${545 + s * 180} 106 L${488 + l * 90} 190`} className="dg-lnk thin" />))}
      <T x={610} y={272} cls="dg-note" size={10}>Tiap leaf terhubung ke semua spine, jumlah hop</T>
      <T x={610} y={288} cls="dg-note" size={10}>selalu sama, cocok untuk trafik antar-server.</T>
    </Fig>
  )
}

/* Monitoring: SNMP vs NetFlow vs paket */
export function DgMonitoring() {
  return (
    <Fig title="Tiga tingkat kedalaman pemantauan" sub="Makin dalam datanya, makin mahal menyimpannya" w={820} h={280}>
      {[
        { t: 'SNMP / metrik', q: 'Berapa banyak?', d: 'Counter per interface: bps, error, drop. Ringan, cocok untuk grafik jangka panjang.', tone: 'a', w: 230 },
        { t: 'NetFlow / sFlow', q: 'Siapa bicara ke siapa?', d: 'Ringkasan per aliran: IP, port, byte, durasi. Menjawab "bandwidth habis untuk apa".', tone: 'p', w: 250 },
        { t: 'Tangkap paket', q: 'Apa persisnya isinya?', d: 'Wireshark/tcpdump: kebenaran mutlak, tapi besar dan lambat dianalisis.', tone: 'grad', w: 230 },
      ].map((c, i) => (
        <g key={i}>
          <Box x={45 + i * 250} y={50} w={c.w} h={150} label="" tone={c.tone as any} />
          <T x={45 + i * 250 + c.w / 2} y={84} cls="dg-lb" size={14}>{c.t}</T>
          <T x={45 + i * 250 + c.w / 2} y={110} cls="dg-sb">{c.q}</T>
          <foreignObject x={60 + i * 250} y={124} width={c.w - 30} height={70}>
            <div className="dg-fo">{c.d}</div>
          </foreignObject>
        </g>
      ))}
      <path d="M45 226 H775" className="dg-axis" />
      <T x={90} y={250} cls="dg-note" anchor="start" size={10}>murah · retensi tahunan</T>
      <T x={730} y={250} cls="dg-note" anchor="end" size={10}>mahal · retensi jam-an</T>
      <T x={410} y={272} cls="dg-note" size={10}>Alur troubleshooting yang sehat: mulai dari metrik → sempitkan dengan flow → baru tangkap paket di titik yang sudah dicurigai.</T>
    </Fig>
  )
}
