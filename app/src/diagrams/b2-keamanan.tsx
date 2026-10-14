import { Fig, Box, Arrow, T, Device } from './primitives'

/* WPA2: four-way handshake */
export function DgK2Wpa2Handshake() {
  const msgs = [
    { y: 168, dir: -1, tone: 'p', t: '1. ANonce (nomor acak dari AP)', n: 'Klien menghitung PTK = PRF(PMK, ANonce, SNonce, MAC-AP, MAC-Klien)' },
    { y: 238, dir: 1, tone: 'a', t: '2. SNonce + MIC', n: 'AP menghitung PTK yang sama, memverifikasi MIC' },
    { y: 298, dir: -1, tone: 'p', t: '3. GTK (Group Temporal Key untuk broadcast) + MIC', n: '' },
    { y: 350, dir: 1, tone: 'ok', t: '4. ACK', n: '' },
  ]
  return (
    <Fig title="Four-way handshake WPA2" sub="Kunci sesi dibangun dari nonce kedua pihak, PMK tidak pernah dikirim" w={820} h={420}>
      <Box x={60} y={8} w={700} h={38} label="PMK (Pairwise Master Key) dari PSK + SSID (PBKDF2, 4096 iterasi) atau dari 802.1X/EAP" tone="grad" fs={11} />
      <Device cx={110} cy={86} kind="laptop" label="Klien" />
      <Device cx={710} cy={86} kind="ap" label="AP" />
      <path d="M110 125 V385" className="dg-life" /><path d="M710 125 V385" className="dg-life" />
      {msgs.map((m, i) => (
        <g key={i}>
          <Arrow d={m.dir > 0 ? `M130 ${m.y} H690` : `M690 ${m.y} H130`} tone={m.tone as 'p' | 'a' | 'ok'} />
          <T x={410} y={m.y - 8} cls="dg-sb">{m.t}</T>
          {m.n && <T x={410} y={m.y + 18} cls="dg-note" size={10.5}>{m.n}</T>}
        </g>
      ))}
      <T x={410} y={402} cls="dg-note" size={11}>Kedua pihak memasang kunci, trafik mulai terenkripsi</T>
    </Fig>
  )
}

/* Menghitung kebutuhan AP berbasis kapasitas */
export function DgK2KapasitasAp() {
  const rows: { l: string; q: string; a: string; s?: string; tone: 'n' | 'p' | 'a' }[] = [
    { l: 'Berapa perangkat?', q: '200 karyawan × 2,5 perangkat = 500 perangkat', a: '', tone: 'n' },
    { l: 'Berapa yang aktif bersamaan?', q: 'Asumsikan 60% aktif = 300 perangkat aktif', a: '', tone: 'n' },
    { l: 'Bandwidth per perangkat?', q: 'Kantor umum 2–5 Mbps · Video call 2–4 Mbps · Video 4K 25 Mbps', a: 'Rata-rata 3 Mbps, jadi 900 Mbps total', tone: 'p' },
    { l: 'Throughput realistis per AP?', q: 'Wi-Fi 6, 5 GHz, 80 MHz, kondisi baik ≈ 400–600 Mbps agregat', a: 'Asumsikan 400 Mbps', tone: 'p' },
    { l: 'Jumlah AP berdasarkan bandwidth', q: '900 / 400 = 2,25', a: 'Minimal 3 AP untuk kapasitas', tone: 'a' },
    { l: 'Cek batas klien per AP', q: 'Praktik baik: maksimal 25–30 klien aktif per radio', a: '300 perangkat / 30 = 10 AP', tone: 'a' },
  ]
  return (
    <Fig title="Menghitung jumlah AP berbasis kapasitas" sub="Dua hitungan, ambil yang lebih besar" w={820} h={452}>
      {rows.map((r, i) => {
        const y = 8 + i * 56
        return (
          <g key={i}>
            <Box x={20} y={y} w={250} h={46} label={`Langkah ${i + 1}`} sub={r.l} tone="n" fs={12} />
            <Arrow d={`M272 ${y + 23} H298`} tone="n" />
            <Box x={300} y={y} w={500} h={46} label={r.q} sub={r.a || undefined} tone={r.tone} fs={11} />
          </g>
        )
      })}
      <Box x={20} y={352} w={780} h={44} label="AMBIL YANG LEBIH BESAR: 10 AP" tone="ok" fs={14} />
      <T x={410} y={420} cls="dg-note" size={11}>Tiga AP cukup untuk bandwidth, tetapi sepuluh dibutuhkan agar klien per radio tidak melebihi batas.</T>
    </Fig>
  )
}

/* Layanan Metro Ethernet MEF */
export function DgK2MefLayanan() {
  return (
    <Fig title="Tipe layanan Metro Ethernet (MEF)" sub="Tiga bentuk koneksi logis di atas jaringan operator" w={820} h={290}>
      <T x={140} y={26} cls="dg-cap-in">E-Line</T>
      <T x={140} y={46} cls="dg-note" size={10.5}>seperti kabel langsung</T>
      <Box x={20} y={115} w={90} h={44} label="Kantor A" tone="p" fs={11} />
      <Box x={170} y={115} w={90} h={44} label="Kantor B" tone="p" fs={11} />
      <path d="M110 131 H170" className="dg-lnk" /><path d="M110 143 H170" className="dg-lnk" />

      <T x={410} y={26} cls="dg-cap-in">E-LAN</T>
      <T x={410} y={46} cls="dg-note" size={10.5}>seperti satu switch besar</T>
      <Box x={310} y={80} w={60} h={34} label="A" tone="a" fs={12} />
      <Box x={310} y={130} w={60} h={34} label="B" tone="a" fs={12} />
      <Box x={310} y={180} w={60} h={34} label="C" tone="a" fs={12} />
      <Device cx={470} cy={147} kind="switch" />
      <path d="M370 97 L448 140" className="dg-lnk" /><path d="M370 147 H446" className="dg-lnk" /><path d="M370 197 L448 154" className="dg-lnk" />

      <T x={690} y={26} cls="dg-cap-in">E-Tree</T>
      <T x={690} y={46} cls="dg-note" size={10.5}>pusat ke cabang</T>
      <Box x={640} y={80} w={100} h={40} label="Pusat" tone="grad" fs={12} />
      <Box x={565} y={190} w={70} h={36} label="A" tone="n" fs={12} />
      <Box x={655} y={190} w={70} h={36} label="B" tone="n" fs={12} />
      <Box x={745} y={190} w={70} h={36} label="C" tone="n" fs={12} />
      <path d="M670 120 L600 190" className="dg-lnk" /><path d="M690 120 V190" className="dg-lnk" /><path d="M710 120 L780 190" className="dg-lnk" />
      <T x={690} y={252} cls="dg-note" size={10.5}>cabang tidak bisa saling bicara langsung</T>
    </Fig>
  )
}

/* Policing vs shaping */
export function DgK2PolicingShaping() {
  const traffic = 'M50 215 Q85 25 120 215 Q155 105 190 215 Q225 10 260 215 Q295 150 330 215 L385 215'
  const Axes = ({ x }: { x: number }) => (
    <>
      <path d={`M${x} 235 V55`} className="dg-axis" /><path d={`M${x} 235 H${x + 345}`} className="dg-axis" />
      <T x={x - 6} y={50} cls="dg-sb">Rate</T>
      <path d={`M${x} 120 H${x + 345}`} className="dg-lnk dash" />
      <T x={x + 345} y={112} cls="dg-note" anchor="end" size={10.5}>batas</T>
    </>
  )
  return (
    <Fig title="Policing vs shaping" sub="Sama-sama menegakkan batas rate; beda nasib paket yang berlebih" w={820} h={340}>
      <defs>
        <clipPath id="k2-clip-up"><rect x={0} y={0} width={820} height={120} /></clipPath>
      </defs>
      <T x={222} y={22} cls="dg-cap-in">POLICING</T>
      <Axes x={50} />
      <path d={traffic} className="dg-curve c-p" />
      <path d={traffic} className="dg-curve c-no" clipPath="url(#k2-clip-up)" />
      <T x={150} y={78} cls="dg-note" size={10.5}>trafik asli</T>
      <T x={222} y={262} cls="dg-sb">Melebihi rate: BUANG (atau turunkan marking)</T>
      <T x={222} y={284} cls="dg-note" size={10.5}>paket di atas garis DIBUANG</T>

      <g transform="translate(400 0)">
        <T x={222} y={22} cls="dg-cap-in">SHAPING</T>
        <Axes x={50} />
        <path d={traffic} className="dg-curve c-p dash" clipPath="url(#k2-clip-up)" />
        <path d="M50 215 L90 120 H250 Q290 125 310 170 L335 215 H385" className="dg-curve c-a" />
        <Arrow d="M120 60 C140 90 140 100 140 116" tone="warn" />
        <T x={168} y={78} cls="dg-note" anchor="start" size={10.5}>di-buffer</T>
        <T x={222} y={262} cls="dg-sb">Melebihi rate: BUFFER dan kirim nanti</T>
        <T x={222} y={284} cls="dg-note" size={10.5}>paket di atas garis DITUNDA (di-buffer), trafik diratakan</T>
      </g>
      <T x={410} y={322} cls="dg-note" size={11}>Policing tidak punya antrean; shaping menukar delay dengan paket yang tetap sampai.</T>
    </Fig>
  )
}

/* Defense in depth */
export function DgK2DefenseDepth() {
  const layers = [
    '1. KEBIJAKAN & PELATIHAN',
    '2. KEAMANAN FISIK',
    '3. PERIMETER (firewall, IPS)',
    '4. JARINGAN INTERNAL (segmentasi)',
    '5. HOST (hardening, EDR)',
    '6. APLIKASI',
    '7. DATA (enkripsi)',
  ]
  const tones: ('n' | 'p' | 'a')[] = ['n', 'p', 'n', 'p', 'n', 'p', 'a']
  return (
    <Fig title="Defense in depth: pertahanan berlapis" sub="Penyerang harus menembus tujuh lapis sebelum menyentuh data" w={820} h={420}>
      {layers.map((lb, i) => {
        const last = i === layers.length - 1
        const x = 20 + i * 30, y = 8 + i * 28, w = 780 - i * 60, h = 400 - i * 56
        return (
          <g key={i}>
            <Box x={x} y={y} w={w} h={h} tone={tones[i]} r={14} />
            {last
              ? <T x={x + w / 2} y={y + h / 2 + 4} cls="dg-sb">{lb}</T>
              : <T x={x + 16} y={y + 19} cls="dg-sb" anchor="start">{lb}</T>}
          </g>
        )
      })}
    </Fig>
  )
}

/* ARP spoofing: MITM klasik */
export function DgK2ArpSpoofing() {
  return (
    <Fig title="ARP spoofing: man-in-the-middle klasik" sub="Dua ARP palsu cukup untuk memasang penyerang di tengah" w={820} h={390}>
      <T x={30} y={26} cls="dg-cap-in" anchor="start">Normal</T>
      <Device cx={110} cy={62} kind="laptop" />
      <Device cx={710} cy={62} kind="router" />
      <Arrow d="M145 62 H672" tone="ok" />
      <T x={410} y={52} cls="dg-note" size={11}>Host A (192.168.1.10) ke Gateway (192.168.1.1, MAC bb:bb)</T>

      <T x={30} y={128} cls="dg-cap-in" anchor="start">Serangan</T>
      <Device cx={110} cy={225} kind="laptop" label="Host A" />
      <T x={110} y={271} cls="dg-note" size={10.5}>192.168.1.10</T>
      <Device cx={410} cy={225} kind="pc" label="Penyerang" />
      <T x={410} y={271} cls="dg-note" size={10.5}>MAC cc:cc</T>
      <Device cx={710} cy={225} kind="router" label="Gateway" />
      <T x={710} y={271} cls="dg-note" size={10.5}>192.168.1.1, MAC bb:bb</T>
      <Arrow d="M395 190 C340 140 200 140 125 192" tone="no" dash label="1" lx={265} ly={142} />
      <Arrow d="M425 190 C480 140 620 140 695 192" tone="no" dash label="2" lx={555} ly={142} />
      <Arrow d="M145 225 H368" tone="p" both label="4" lx={256} ly={215} />
      <Arrow d="M452 225 H672" tone="p" both label="4" lx={562} ly={215} />

      <T x={30} y={292} cls="dg-note" anchor="start" size={11}>1. Penyerang mengirim ARP Reply palsu (gratuitous ARP) ke Host A: "192.168.1.1 ada di MAC penyerang (cc:cc)"</T>
      <T x={30} y={314} cls="dg-note" anchor="start" size={11}>2. Penyerang mengirim ARP palsu ke Gateway: "192.168.1.10 ada di MAC penyerang (cc:cc)"</T>
      <T x={30} y={336} cls="dg-note" anchor="start" size={11}>3. Kedua pihak memperbarui ARP cache</T>
      <T x={30} y={358} cls="dg-note" anchor="start" size={11}>4. SELURUH trafik A ↔ Gateway melewati penyerang: Host A ↔ Penyerang ↔ Gateway</T>
    </Fig>
  )
}

/* DNS amplification */
export function DgK2DnsAmplification() {
  return (
    <Fig title="DNS amplification: contoh nyata" sub="Pantulan lewat open resolver mengubah bandwidth kecil menjadi banjir besar" w={820} h={320}>
      <Device cx={100} cy={100} kind="laptop" label="Penyerang" />
      <Device cx={410} cy={100} kind="server" label="Server DNS (open resolver)" />
      <Device cx={720} cy={100} kind="pc" label="Korban" />
      <Arrow d="M135 100 H378" tone="p" />
      <T x={256} y={78} cls="dg-sb">Query 60 byte</T>
      <T x={256} y={126} cls="dg-note" size={10.5}>alamat sumber = korban</T>
      <Arrow d="M444 100 H686" tone="no" />
      <T x={565} y={78} cls="dg-sb">Balasan 3.000 byte</T>
      <T x={565} y={126} cls="dg-note" size={10.5}>dikirim ke korban</T>
      <Box x={290} y={176} w={240} h={44} label="Faktor amplifikasi 50×" tone="warn" fs={13} />
      <Box x={90} y={244} w={640} h={50} label="Dengan 1.000 open resolver dan 10 Mbps dari penyerang" sub="500 Mbps menghantam korban" tone="no" fs={12} />
    </Fig>
  )
}

/* Faktor autentikasi */
export function DgK2FaktorAuth() {
  const rows: [string, string, 'p' | 'a' | 'ok' | 'n'][] = [
    ['1. SOMETHING YOU KNOW', 'password, PIN, jawaban pertanyaan', 'p'],
    ['2. SOMETHING YOU HAVE', 'token, kartu, ponsel, security key', 'a'],
    ['3. SOMETHING YOU ARE', 'sidik jari, wajah, iris, suara', 'ok'],
    ['4. SOMEWHERE YOU ARE', 'lokasi geografis, alamat IP', 'n'],
    ['5. SOMETHING YOU DO', 'pola perilaku, cara mengetik', 'n'],
  ]
  return (
    <Fig title="Lima faktor autentikasi" sub="MFA berarti menggabungkan faktor dari kategori yang berbeda" w={820} h={310}>
      {rows.map(([k, v, tone], i) => {
        const y = 10 + i * 58
        return (
          <g key={i}>
            <Box x={40} y={y} w={300} h={46} label={k} tone={tone} fs={12.5} />
            <Arrow d={`M342 ${y + 23} H388`} tone="n" />
            <Box x={390} y={y} w={390} h={46} label={v} tone="n" fs={12} />
          </g>
        )
      })}
    </Fig>
  )
}

/* Zero trust: model NIST SP 800-207 */
export function DgK2ZeroTrust() {
  return (
    <Fig title="Arsitektur Zero Trust (NIST SP 800-207)" sub="Setiap akses diputuskan oleh control plane, ditegakkan di data plane" w={820} h={400}>
      <Box x={110} y={10} w={600} h={190} tone="n" r={14} />
      <T x={130} y={32} cls="dg-sb" anchor="start">CONTROL PLANE</T>
      <Box x={150} y={46} w={520} h={140} tone="p" r={12} />
      <T x={170} y={68} cls="dg-sb" anchor="start">PDP (Policy Decision Point)</T>
      <Box x={185} y={92} w={210} h={72} label="Policy Engine" tone="grad" fs={12} />
      <Box x={425} y={92} w={210} h={72} label="Policy Administrator" tone="grad" fs={12} />

      <Arrow d="M410 202 V282" tone="a" label="keputusan" lx={452} ly={246} />

      <Box x={110} y={226} w={600} h={160} tone="n" r={14} />
      <T x={130} y={250} cls="dg-sb" anchor="start">DATA PLANE</T>
      <Box x={140} y={286} w={140} h={60} label="Subjek" tone="n" fs={12} />
      <Box x={340} y={286} w={140} h={60} label="PEP" sub="Policy Enforcement Point" tone="ok" fs={12} />
      <Box x={540} y={286} w={140} h={60} label="Resource" tone="n" fs={12} />
      <Arrow d="M282 316 H336" tone="p" />
      <Arrow d="M482 316 H536" tone="p" />
    </Fig>
  )
}

/* Display filter Wireshark untuk keamanan */
export function DgK2WiresharkFilter() {
  const rows: [string, string][] = [
    ['tcp.flags.syn==1 && tcp.flags.ack==0', 'SYN scan'],
    ['tcp.analysis.retransmission', 'masalah/serangan'],
    ['dns.qry.name contains "suspicious"', 'kueri DNS bernama mencurigakan'],
    ['http.request.method == "POST"', 'permintaan HTTP POST'],
    ['tls.handshake.type == 1', 'ClientHello (lihat SNI)'],
    ['arp.duplicate-address-detected', 'ARP spoofing'],
    ['wlan.fc.type_subtype == 0x0c', 'deauth attack'],
  ]
  return (
    <Fig title="Display filter Wireshark untuk keamanan" sub="Satu baris filter, satu jenis ancaman" w={820} h={370}>
      <T x={210} y={22} cls="dg-cap-in">Display filter</T>
      <T x={600} y={22} cls="dg-cap-in">Yang ditangkap</T>
      {rows.map(([f, m], i) => {
        const y = 36 + i * 46
        return (
          <g key={i}>
            <Box x={30} y={y} w={360} h={36} label={f} tone="dark" fs={12} r={8} />
            <Arrow d={`M392 ${y + 18} H428`} tone="n" />
            <Box x={430} y={y} w={360} h={36} label={m} tone={i === 1 || i === 4 || i === 3 || i === 2 ? 'n' : 'warn'} fs={12} r={8} />
          </g>
        )
      })}
    </Fig>
  )
}

/* Docker: namespace, veth, bridge, NAT */
export function DgK2DockerNet() {
  return (
    <Fig title="Cara kerja jaringan Docker" sub="Namespace + veth + bridge + NAT, semuanya komponen Linux biasa" w={820} h={390}>
      <Box x={20} y={10} w={640} h={366} tone="n" r={14} />
      <T x={40} y={34} cls="dg-sb" anchor="start">HOST</T>
      <Box x={70} y={50} w={210} h={80} label="container A" sub="netns · eth0 · 172.17.0.2" tone="p" fs={12} />
      <Box x={400} y={50} w={210} h={80} label="container B" sub="netns · eth0 · 172.17.0.3" tone="p" fs={12} />
      <path d="M175 130 V172 H300 V200" className="dg-lnk" />
      <path d="M505 130 V172 H380 V200" className="dg-lnk" />
      <T x={146} y={156} cls="dg-note" size={11}>veth</T>
      <T x={534} y={156} cls="dg-note" size={11}>veth</T>
      <Box x={215} y={200} w={250} h={58} label="docker0" sub="Linux BRIDGE 172.17.0.1" tone="grad" fs={13} />
      <Arrow d="M340 258 V308" tone="warn" label="NAT (nftables masquerade)" lx={485} ly={288} />
      <Box x={240} y={310} w={200} h={46} label="eth0 (fisik)" tone="a" fs={12} />
      <Arrow d="M442 333 H700" tone="ok" />
      <Device cx={745} cy={333} kind="cloud" label="Internet" />
    </Fig>
  )
}

/* Netfilter hooks */
export function DgK2Netfilter() {
  return (
    <Fig title="Arsitektur netfilter: lima hook" sub="Jalur paket di kernel Linux; tabel nftables menempel di hook ini" w={820} h={490}>
      <T x={30} y={65} cls="dg-sb" anchor="start">Paket masuk</T>
      <Arrow d="M118 60 H308" tone="n" />
      <Box x={310} y={40} w={200} h={40} label="PREROUTING" tone="a" fs={12.5} />
      <Arrow d="M410 80 V108" tone="n" />
      <Box x={310} y={110} w={200} h={44} label="Keputusan routing" tone="n" fs={12} />

      <Arrow d="M360 154 V180 H230 V203" tone="p" label="untuk host ini?" lx={296} ly={172} />
      <Arrow d="M460 154 V180 H590 V203" tone="p" label="untuk diteruskan?" lx={534} ly={172} />

      <Box x={130} y={205} w={200} h={40} label="INPUT" tone="p" fs={12.5} />
      <Arrow d="M230 245 V280" tone="n" />
      <Box x={130} y={282} w={200} h={34} label="proses lokal" tone="n" fs={11.5} />
      <Arrow d="M230 316 V345" tone="n" />
      <Box x={130} y={347} w={200} h={40} label="OUTPUT" tone="p" fs={12.5} />

      <Box x={490} y={205} w={200} h={40} label="FORWARD" tone="p" fs={12.5} />

      <Arrow d="M230 387 V412 H360 V430" tone="n" />
      <Arrow d="M590 245 V412 H460 V430" tone="n" />
      <Box x={310} y={432} w={200} h={40} label="POSTROUTING" tone="a" fs={12.5} />
      <Arrow d="M512 452 H620" tone="ok" />
      <T x={640} y={457} cls="dg-sb" anchor="start">keluar</T>
    </Fig>
  )
}

/* Linux sebagai router/firewall lengkap */
export function DgK2LinuxRouter() {
  const items: { l: string; s: string; tone: 'n' | 'p' | 'a' }[] = [
    { l: 'IP forwarding', s: 'sysctl net.ipv4.ip_forward=1', tone: 'n' },
    { l: 'Routing', s: 'FRR (OSPF/BGP) atau static', tone: 'p' },
    { l: 'Firewall + NAT', s: 'nftables', tone: 'p' },
    { l: 'DHCP', s: 'Kea / dnsmasq', tone: 'a' },
    { l: 'DNS', s: 'Unbound / dnsmasq', tone: 'a' },
    { l: 'VPN', s: 'WireGuard / strongSwan (IPsec)', tone: 'p' },
    { l: 'QoS', s: 'tc (CAKE / HTB)', tone: 'n' },
    { l: 'Monitoring', s: 'node_exporter / snmpd', tone: 'n' },
    { l: 'NTP', s: 'chrony', tone: 'a' },
  ]
  return (
    <Fig title="Linux sebagai router/firewall lengkap" sub="Sembilan komponen, semuanya perangkat lunak terbuka" w={820} h={300}>
      {items.map((it, i) => (
        <Box key={i} x={30 + (i % 3) * 262} y={20 + Math.floor(i / 3) * 88} w={250} h={68} label={it.l} sub={it.s} tone={it.tone} fs={13} />
      ))}
    </Fig>
  )
}

/* Pola umum studi kasus */
export function DgK2PolaKasus() {
  const rows: [string, string][] = [
    ['"It\'s always DNS"', 'Kasus 4 (dan sering tersembunyi di Kasus 15)'],
    ['MTU black hole di tunnel/VPN', 'Kasus 2'],
    ['Bufferbloat / microburst / queuing bukan bandwidth', 'Kasus 1, 14, 15'],
    ['Layer 2 fatal (loop, duplex, VLAN)', 'Kasus 5, 6, 13'],
    ['Stateful firewall + asymmetric routing', 'Kasus 7'],
    ['"Up tetapi lambat" ≠ "down"', 'Kasus 9, 14, 15'],
    ['Habisnya sumber daya (pool, port, tabel)', 'Kasus 8, 11'],
    ['Otomatisasi yang terlupa (sertifikat, PortFast)', 'Kasus 3, 12'],
    ['Nama yang menyesatkan (BGP "Active")', 'Kasus 10'],
    ['Ubah subjektif menjadi objektif', 'Kasus 15'],
  ]
  return (
    <Fig title="Sepuluh pola dari 15 kasus" sub="Pola berulang dan kasus tempat ia muncul" w={820} h={440}>
      {rows.map(([p, k], i) => {
        const y = 8 + i * 43
        return (
          <g key={i}>
            <Box x={20} y={y} w={460} h={36} label={`${i + 1}. ${p}`} tone={i % 2 ? 'n' : 'p'} fs={11.5} r={8} />
            <Arrow d={`M482 ${y + 18} H512`} tone="n" />
            <Box x={514} y={y} w={290} h={36} label={k} tone="a" fs={11.5} r={8} />
          </g>
        )
      })}
    </Fig>
  )
}

/* SDN: controller + data plane */
export function DgK2SdnController() {
  return (
    <Fig title="Controller-based networking (SDN)" sub="Control plane terpusat, perangkat hanya meneruskan paket" w={820} h={290}>
      <Box x={290} y={20} w={240} h={60} label="CONTROLLER" sub="(otak jaringan)" tone="grad" fs={13} />
      <T x={545} y={54} cls="dg-note" anchor="start" size={11}>control plane TERPUSAT</T>
      <Arrow d="M410 80 V100 H190 V148" tone="a" label="Southbound API (ke perangkat)" lx={300} ly={92} />
      <Arrow d="M410 80 V148" tone="a" />
      <Arrow d="M410 80 V100 H630 V148" tone="a" />
      {[190, 410, 630].map((cx, i) => (
        <Box key={i} x={cx - 90} y={150} w={180} h={70} label={`Switch ${i + 1}`} sub="data plane" tone="n" fs={12.5} />
      ))}
      <T x={410} y={248} cls="dg-note" size={11}>hanya DATA plane (meneruskan paket)</T>
    </Fig>
  )
}
