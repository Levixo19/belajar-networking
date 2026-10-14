import { useState } from 'react'
import { Fig, Box, Arrow, T, Device } from './primitives'
import { useInView } from '../lib/useInView'

/* Header TCP vs UDP berdampingan */
export function DgTcpUdpHeader() {
  const row = (y: number, cells: [string, number][], tone: any) => {
    let x = 60
    return cells.map(([lb, w], i) => { const el = <Box key={i} x={x} y={y} w={w} h={30} label={lb} tone={tone} fs={9} r={6} />; x += w + 3; return el })
  }
  return (
    <Fig title="Header TCP (20 byte) vs UDP (8 byte)" sub="Semua kolom ekstra TCP adalah harga dari keandalan" w={820} h={330}>
      <T x={230} y={22} cls="dg-cap-in">TCP</T>
      {row(32, [['Port Sumber', 160], ['Port Tujuan', 160]], 'p')}
      {row(65, [['Sequence Number', 323]], 'a')}
      {row(98, [['Acknowledgement Number', 323]], 'a')}
      {row(131, [['Offset', 60], ['Flags: URG ACK PSH RST SYN FIN', 180], ['Window', 79]], 'grad')}
      {row(164, [['Checksum', 160], ['Urgent Pointer', 160]], 'n')}
      {row(197, [['Options + Padding (0–40 byte)', 323]], 'n')}
      <T x={230} y={248} cls="dg-note" size={10}>Seq + Ack + Window = mesin keandalan & kendali aliran.</T>
      <T x={230} y={266} cls="dg-note" size={10}>Flags mengendalikan pembentukan & pembubaran koneksi.</T>

      <T x={620} y={22} cls="dg-cap-in">UDP</T>
      <Box x={460} y={32} w={160} h={30} label="Port Sumber" tone="p" fs={9} r={6} />
      <Box x={623} y={32} w={160} h={30} label="Port Tujuan" tone="p" fs={9} r={6} />
      <Box x={460} y={65} w={160} h={30} label="Panjang" tone="n" fs={9} r={6} />
      <Box x={623} y={65} w={160} h={30} label="Checksum" tone="n" fs={9} r={6} />
      <Box x={460} y={104} w={323} h={90} label="Data langsung menyusul" tone="grad" fs={11} />
      <T x={620} y={248} cls="dg-note" size={10}>Tanpa seq, tanpa ack, tanpa window.</T>
      <T x={620} y={266} cls="dg-note" size={10}>Cepat, ringan, dan sepenuhnya tidak peduli paket hilang.</T>
      <Box x={60} y={288} w={723} h={34} label="Keduanya sama-sama punya port sumber & tujuan, itulah yang membuat satu IP bisa melayani ribuan aplikasi sekaligus." tone="a" fs={10.5} />
    </Fig>
  )
}

/* Three-way handshake + teardown */
export function DgHandshake() {
  const { ref, inView } = useInView<HTMLDivElement>()
  const msgs = [
    { t: 'SYN', d: 'seq=x', dir: 1, tone: 'p' },
    { t: 'SYN-ACK', d: 'seq=y, ack=x+1', dir: -1, tone: 'a' },
    { t: 'ACK', d: 'ack=y+1', dir: 1, tone: 'ok' },
    { t: 'DATA', d: 'HTTP GET /', dir: 1, tone: 'grad' },
    { t: 'ACK + DATA', d: '200 OK', dir: -1, tone: 'grad' },
    { t: 'FIN', d: 'selesai', dir: 1, tone: 'warn' },
    { t: 'FIN-ACK', d: '', dir: -1, tone: 'warn' },
  ]
  return (
    <div ref={ref}>
      <Fig title="Umur satu koneksi TCP" sub="Tiga pesan untuk membuka, dua untuk menutup" w={820} h={400}>
        <Device cx={110} cy={40} kind="laptop" label="Klien" />
        <Device cx={710} cy={40} kind="server" label="Server" s={0.8} />
        <path d="M110 80 V370" className="dg-life" /><path d="M710 80 V370" className="dg-life" />
        {msgs.map((m, i) => {
          const y = 110 + i * 38
          return (<g key={i} className={inView ? 'dg-slide' : 'dg-hidden'} style={{ animationDelay: `${i * 0.22}s` }}>
            <Arrow d={m.dir > 0 ? `M130 ${y} H690` : `M690 ${y} H130`} tone={m.tone as any} />
            <text x={410} y={y - 7} className="dg-sb">{m.t}</text>
            {m.d && <text x={410} y={y + 17} className="dg-note" style={{ fontSize: 9.5 }}>{m.d}</text>}
          </g>)
        })}
        <path d="M46 96 V210" className="dg-brace2" /><T x={30} y={155} cls="dg-note" size={10}>buka</T>
        <path d="M46 250 V330" className="dg-brace2" /><T x={30} y={295} cls="dg-note" size={10}>tutup</T>
        <T x={410} y={388} cls="dg-note" size={10}>Setelah FIN terakhir, sisi penutup menunggu di TIME_WAIT ±2×MSL agar paket nyasar tidak mengacau koneksi berikutnya.</T>
      </Fig>
    </div>
  )
}

/* Sliding window & congestion control */
export function DgCongestion() {
  return (
    <Fig title="Kendali kemacetan: cwnd naik-turun" sub="TCP terus menebak kapasitas jalur dengan cara menabraknya pelan-pelan" w={820} h={290}>
      <path d="M70 240 H770" className="dg-axis" /><path d="M70 240 V30" className="dg-axis" />
      <T x={420} y={268} cls="dg-sb">waktu →</T>
      <T x={40} y={130} cls="dg-sb">cwnd</T>
      <path d="M70 235 L120 210 L160 175 L200 110 L240 40" className="dg-curve c-p" />
      <path d="M240 40 L245 150" className="dg-curve c-no dash" />
      <path d="M245 150 L320 130 L400 110 L480 88 L560 66" className="dg-curve c-a" />
      <path d="M560 66 L565 120" className="dg-curve c-no dash" />
      <path d="M565 120 L640 104 L720 86" className="dg-curve c-a" />
      <circle cx={240} cy={40} r={7} className="dg-lossdot" /><circle cx={560} cy={66} r={7} className="dg-lossdot" />
      <T x={155} y={205} cls="dg-note" size={10}>Slow start</T>
      <T x={158} y={222} cls="dg-note" size={9}>naik eksponensial</T>
      <T x={400} y={95} cls="dg-note" size={10}>Congestion avoidance: naik linear (+1 MSS/RTT)</T>
      <T x={250} y={30} cls="dg-note" anchor="start" size={10}>paket hilang</T>
      <T x={575} y={56} cls="dg-note" anchor="start" size={10}>paket hilang lagi</T>
      <Box x={70} y={252} w={330} h={30} label="Reno: potong setengah lalu naik linear" tone="a" fs={10} />
      <Box x={410} y={252} w={360} h={30} label="BBR/CUBIC: ukur bandwidth & RTT, bukan sekadar reaksi ke loss" tone="p" fs={10} />
    </Fig>
  )
}

/* Port & socket */
export function DgSocket() {
  return (
    <Fig title="Socket = IP + port + protokol" sub="Satu server, satu IP, banyak layanan. Yang memisahkan adalah nomor port" w={820} h={280}>
      <Device cx={640} cy={130} kind="server" label="203.0.113.9" />
      <Box x={430} y={40} w={150} h={40} label=":80 HTTP" tone="p" fs={11} />
      <Box x={430} y={90} w={150} h={40} label=":443 HTTPS" tone="p" fs={11} />
      <Box x={430} y={140} w={150} h={40} label=":22 SSH" tone="a" fs={11} />
      <Box x={430} y={190} w={150} h={40} label=":53 DNS (UDP)" tone="ok" fs={11} />
      {[60, 110, 160, 210].map((y, i) => <Arrow key={i} d={`M584 ${y} H612 V${130 + (y - 135) * 0.12}`} tone="n" />)}
      <Device cx={90} cy={70} kind="laptop" label="Klien A" />
      <Device cx={90} cy={200} kind="phone" label="Klien B" s={0.8} />
      <Arrow d="M124 70 H424" tone="p" label="src :51001 → dst :443" lx={274} ly={58} />
      <Arrow d="M124 200 H424" tone="ok" label="src :49876 → dst :53" lx={274} ly={188} />
      <Box x={60} y={244} w={700} h={30} label="Socket pair: (IP klien, port klien, IP server, port server, protokol), tuple inilah identitas unik satu koneksi" tone="grad" fs={10.5} />
      <T x={505} y={26} cls="dg-note" size={10}>0–1023 well-known · 1024–49151 registered · 49152+ ephemeral</T>
    </Fig>
  )
}

/* Resolusi DNS rekursif */
export function DgDns() {
  const [step, setStep] = useState(4)
  const nodes = [
    { x: 250, y: 40, lb: 'Root (.)', a: 'Coba server .com' },
    { x: 480, y: 40, lb: 'TLD .com', a: 'Coba ns1.contoh.com' },
    { x: 710, y: 40, lb: 'Authoritative', a: '93.184.216.34' },
  ]
  return (
    <Fig title="Resolusi DNS rekursif" sub="Klik untuk melihat pertanyaan berjalan naik" w={820} h={290}>
      <g className="dg-click" onClick={() => setStep(s => (s + 1) % 5)}>
        <rect x={0} y={0} width={820} height={290} fill="transparent" />
        <Device cx={70} cy={190} kind="laptop" label="Klien" />
        <Box x={140} y={160} w={160} h={60} label="Resolver" sub="ISP / 1.1.1.1" tone="grad" />
        <Arrow d="M100 190 H136" />
        {nodes.map((n, i) => (<g key={i} className={step > i ? '' : 'dg-dim'}>
          <Device cx={n.x} cy={n.y + 30} kind="server" label={n.lb} s={0.7} />
          <Arrow d={`M${220 + i * 6} 158 C${n.x - 60} 120 ${n.x - 40} 100 ${n.x - 14} 70`} tone="p" dash />
          <Arrow d={`M${n.x + 14} 70 C${n.x + 40} 110 ${300 + i * 6} 130 ${292} 160`} tone="a" />
          <text x={n.x} y={100} className="dg-note" style={{ fontSize: 9.5 }}>{n.a}</text>
        </g>))}
        <Arrow d="M136 205 H100" tone="ok" />
        <T x={220} y={244} cls="dg-sb">www.contoh.com → 93.184.216.34</T>
        <T x={620} y={190} cls="dg-note" anchor="start" size={10}>1. Cek cache browser → OS → resolver</T>
        <T x={620} y={208} cls="dg-note" anchor="start" size={10}>2. Kalau kosong, resolver bertanya berantai</T>
        <T x={620} y={226} cls="dg-note" anchor="start" size={10}>3. Jawaban disimpan sesuai nilai TTL</T>
        <T x={620} y={244} cls="dg-note" anchor="start" size={10}>4. Klien akhirnya dapat satu alamat IP</T>
        <T x={410} y={278} cls="dg-note" size={10}>Langkah {step}/4: port 53, UDP untuk kueri biasa, TCP bila jawaban &gt; 512 byte atau zone transfer.</T>
      </g>
    </Fig>
  )
}

/* Siklus HTTP request-response */
export function DgHttp() {
  return (
    <Fig title="Satu klik = rantai panjang" sub="Yang terjadi antara menekan Enter dan halaman muncul" w={820} h={310}>
      {[
        ['1', 'Cek cache', 'browser → OS → router'],
        ['2', 'DNS', 'nama → alamat IP'],
        ['3', 'TCP handshake', 'SYN / SYN-ACK / ACK'],
        ['4', 'TLS handshake', 'sertifikat + kunci sesi'],
        ['5', 'HTTP request', 'GET / HTTP/1.1'],
        ['6', 'HTTP response', '200 OK + HTML'],
        ['7', 'Render + aset', 'CSS, JS, gambar menyusul'],
      ].map((s, i) => (
        <g key={i}>
          <Box x={55} y={26 + i * 38} w={80} h={30} label={`Langkah ${s[0]}`} tone={i < 2 ? 'a' : i < 4 ? 'p' : 'grad'} fs={9.5} r={8} />
          <text x={155} y={46 + i * 38} className="dg-lb" style={{ textAnchor: 'start', fontSize: 12 }}>{s[1]}</text>
          <text x={330} y={46 + i * 38} className="dg-note" style={{ textAnchor: 'start', fontSize: 10 }}>{s[2]}</text>
          {i < 6 && <path d={`M95 ${56 + i * 38} V${64 + i * 38}`} className="dg-lnk" />}
        </g>
      ))}
      <Box x={520} y={26} w={250} h={112} label="Kode status" tone="n" fs={11} />
      {[['2xx', 'Berhasil'], ['3xx', 'Dialihkan'], ['4xx', 'Salah di klien'], ['5xx', 'Salah di server']].map((r, i) => (
        <g key={i}><text x={545} y={70 + i * 20} className="dg-mono dg-sb" style={{ textAnchor: 'start' }}>{r[0]}</text>
          <text x={605} y={70 + i * 20} className="dg-note" style={{ textAnchor: 'start', fontSize: 10 }}>{r[1]}</text></g>
      ))}
      <Box x={520} y={152} w={250} h={130} label="Header yang sering menentukan" tone="a" fs={11} />
      {['Host: virtual hosting', 'Cache-Control: umur cache', 'Cookie / Set-Cookie: sesi', 'Content-Encoding: gzip/br', 'User-Agent: jenis klien'].map((h, i) => (
        <text key={i} x={540} y={196 + i * 18} className="dg-note" style={{ textAnchor: 'start', fontSize: 9.5 }}>{h}</text>
      ))}
      <T x={280} y={300} cls="dg-note" size={10}>HTTP/2 memultipleks banyak request dalam satu koneksi TCP; HTTP/3 pindah ke QUIC di atas UDP.</T>
    </Fig>
  )
}

/* Jalur email */
export function DgEmail() {
  return (
    <Fig title="Perjalanan satu email" sub="SMTP untuk mengirim, IMAP/POP3 untuk mengambil" w={820} h={250}>
      <Device cx={70} cy={100} kind="laptop" label="Pengirim" />
      <Box x={150} y={70} w={140} h={60} label="MTA pengirim" sub="smtp :587" tone="p" />
      <Box x={340} y={70} w={140} h={60} label="MTA penerima" sub="smtp :25" tone="p" />
      <Box x={530} y={70} w={140} h={60} label="Mailbox" sub="imap :993" tone="a" />
      <Device cx={760} cy={100} kind="phone" label="Penerima" s={0.8} />
      <Arrow d="M104 100 H146" /><Arrow d="M292 100 H336" tone="p" label="antar server" lx={314} ly={88} />
      <Arrow d="M482 100 H526" tone="a" /><Arrow d="M672 100 H734" tone="a" />
      <T x={410} y={150} cls="dg-note" size={10}>MX record di DNS yang menentukan MTA penerima mana yang dituju.</T>
      <Box x={60} y={176} w={230} h={62} label="SPF" sub="Server mana yang boleh mengirim" tone="ok" fs={11} />
      <Box x={300} y={176} w={230} h={62} label="DKIM" sub="Tanda tangan kriptografis isi surat" tone="ok" fs={11} />
      <Box x={540} y={176} w={230} h={62} label="DMARC" sub="Kebijakan bila SPF/DKIM gagal" tone="ok" fs={11} />
    </Fig>
  )
}

/* TLS handshake ringkas */
export function DgTls() {
  return (
    <Fig title="TLS 1.3: kunci sesi dalam satu putaran" sub="Sertifikat membuktikan identitas; Diffie-Hellman membuat kunci bersama" w={820} h={300}>
      <Device cx={110} cy={40} kind="laptop" label="Klien" />
      <Device cx={710} cy={40} kind="server" label="Server" s={0.8} />
      <path d="M110 80 V262" className="dg-life" /><path d="M710 80 V262" className="dg-life" />
      {[
        { t: 'ClientHello', d: 'versi, cipher suite, key share', dir: 1, tone: 'p' },
        { t: 'ServerHello + Sertifikat', d: 'key share, bukti identitas', dir: -1, tone: 'a' },
        { t: 'Verifikasi rantai sertifikat', d: 'apakah ditandatangani CA tepercaya?', dir: 0, tone: 'warn' },
        { t: 'Finished (terenkripsi)', d: 'kunci sesi simetris siap', dir: 1, tone: 'ok' },
        { t: 'Data aplikasi terenkripsi', d: 'AES-GCM / ChaCha20', dir: 2, tone: 'grad' },
      ].map((m, i) => {
        const y = 110 + i * 38
        return (<g key={i}>
          {m.dir === 0
            ? <><rect x={300} y={y - 15} width={220} height={26} rx={8} className="dg-hint" /><text x={410} y={y + 3} className="dg-sb">{m.t}</text></>
            : <Arrow d={m.dir > 0 ? `M130 ${y} H690` : `M690 ${y} H130`} tone={m.tone as any} both={m.dir === 2} />}
          {m.dir !== 0 && <text x={410} y={y - 7} className="dg-sb">{m.t}</text>}
          <text x={410} y={y + (m.dir === 0 ? 22 : 17)} className="dg-note" style={{ fontSize: 9.5 }}>{m.d}</text>
        </g>)
      })}
      <T x={410} y={288} cls="dg-note" size={10}>Gembok di browser hanya berarti “jalur terenkripsi dan sertifikat sah”, bukan “situs ini jujur”.</T>
    </Fig>
  )
}
