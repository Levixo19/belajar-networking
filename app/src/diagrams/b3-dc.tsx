import { Fig, Box, Arrow, T, Device } from './primitives'

type Tone = 'n' | 'p' | 'a' | 'ok' | 'warn' | 'no' | 'grad' | 'dark'

/* NETCONF: lima langkah transaksi */
export function DgNetconfTxn() {
  const steps: { l: string; t: Tone; lines: string[] }[] = [
    { l: '1. lock', t: 'p', lines: ['candidate datastore'] },
    { l: '2. edit-config', t: 'a', lines: ['ubah candidate'] },
    { l: '3. validate', t: 'a', lines: ['periksa validitas'] },
    { l: '4. commit', t: 'ok', lines: ['candidate menjadi', 'running (ATOMIK)', 'semua atau tidak ada'] },
    { l: '5. unlock', t: 'p', lines: [] },
  ]
  return (
    <Fig title="Transaksi NETCONF dengan datastore candidate" sub="Perubahan ditampung di candidate, baru menjadi running saat commit" w={820} h={230}>
      {steps.map((s, i) => {
        const x = 10 + i * 158
        return (
          <g key={i}>
            <Box x={x} y={30} w={148} h={56} label={s.l} tone={s.t} fs={13} />
            {s.lines.map((ln, j) => <T key={j} x={x + 74} y={116 + j * 18} cls="dg-note">{ln}</T>)}
            {i < 4 && <Arrow d={`M${x + 148} 58 H${x + 158}`} tone="n" />}
          </g>
        )
      })}
    </Fig>
  )
}

/* Python: Nornir di atas Netmiko, NAPALM, Scrapli */
export function DgPythonStack() {
  const eng: { l: string; s: string; t: Tone }[] = [
    { l: 'Netmiko', s: 'CLI scraping via SSH', t: 'p' },
    { l: 'NAPALM', s: 'getter sama tiap vendor', t: 'a' },
    { l: 'Scrapli', s: 'modern, async', t: 'p' },
  ]
  return (
    <Fig title="Nornir mengorkestrasi Netmiko, NAPALM, dan Scrapli" sub="Nornir adalah kerangka, library di bawahnya adalah mesin" w={820} h={400}>
      <Box x={280} y={16} w={260} h={46} label="NetBox" sub="sumber inventory dinamis" tone="n" />
      <Arrow d="M410 62 V92" tone="n" />
      <Box x={50} y={92} w={720} h={62} label="Nornir" sub="inventory, konkurensi, orkestrasi" tone="grad" fs={14} />
      {eng.map((e, i) => {
        const x = 50 + i * 250
        return (
          <g key={i}>
            <Arrow d={`M${x + 110} 154 V204`} tone="p" label="plugin" lx={x + 140} ly={184} />
            <Box x={x} y={204} w={220} h={64} label={e.l} sub={e.s} tone={e.t} fs={13} />
            <Arrow d={`M${x + 110} 268 V318`} tone="a" />
          </g>
        )
      })}
      <Box x={50} y={318} w={720} h={50} label="Perangkat jaringan" sub="Cisco, Arista, Junos, MikroTik" tone="n" />
      <T x={410} y={392} cls="dg-note">Jinja2 membuat konfigurasi, requests memanggil REST API, ncclient berbicara NETCONF.</T>
    </Fig>
  )
}

/* Pipeline CI/CD */
export function DgCicdPipeline() {
  const st: { l: string; t: Tone }[] = [
    { l: '1. LINT (sintaks, gaya)', t: 'p' },
    { l: '2. VALIDATE (Batfish, dry-run)', t: 'p' },
    { l: '3. TEST (lab: Containerlab)', t: 'a' },
    { l: '4. REVIEW (approval gate)', t: 'warn' },
    { l: '5. DEPLOY (Ansible/Terraform)', t: 'ok' },
    { l: '6. VERIFY (pyATS, post-check)', t: 'ok' },
  ]
  return (
    <Fig title="Pipeline CI/CD untuk jaringan" sub="Git menyimpan niat, pipeline menyaring sebelum menyentuh perangkat" w={820} h={340}>
      <Box x={10} y={125} w={120} h={70} label="Git" sub="(niat)" tone="dark" fs={14} />
      <Arrow d="M130 160 H190" tone="p" label="push" lx={160} ly={150} />
      <path d="M190 14 H630 V326 H190 Z" className="dg-region r-p" />
      <T x={410} y={34} cls="dg-region-lb">CI/CD PIPELINE</T>
      {st.map((s, i) => (
        <Box key={i} x={225} y={48 + i * 46} w={370} h={36} label={s.l} tone={s.t} fs={12} r={8} />
      ))}
      <Arrow d="M630 160 H690" tone="ok" label="deploy" lx={660} ly={150} />
      <Box x={690} y={125} w={120} h={70} label="Jaringan" tone="n" fs={13} />
    </Fig>
  )
}

/* VXLAN: frame dibungkus antar-VTEP */
export function DgVxlanEvpn() {
  return (
    <Fig title="VXLAN: L2 di atas L3" sub="Dua VM di rak berbeda merasa berada di satu LAN" w={820} h={360}>
      <Device cx={150} cy={44} kind="server" label="VM-A (rak 1)" s={0.8} />
      <Device cx={670} cy={44} kind="server" label="VM-B (rak 9)" s={0.8} />
      <Arrow d="M150 84 V138" tone="n" />
      <T x={162} y={116} anchor="start" cls="dg-note">frame Ethernet biasa</T>
      <Arrow d="M670 138 V84" tone="n" />
      <Box x={90} y={140} w={120} h={46} label="Leaf-1" sub="VTEP" tone="p" />
      <Box x={610} y={140} w={120} h={46} label="Leaf-9" sub="VTEP" tone="p" />
      <Arrow d="M210 163 H610" tone="a" anim />
      <Box x={240} y={145} w={340} h={36} label="encap: [IP L1→L9 | UDP | VNI 5000 | frame]" tone="grad" fs={11} r={8} />
      <T x={684} y={212} anchor="start" cls="dg-note">decap</T>
      <path d="M150 190 V235 M670 190 V235" className="dg-lnk dash" />
      <Box x={130} y={235} w={560} h={42} label="underlay L3 (spine)" tone="n" />
      <Box x={150} y={305} w={520} h={38} label="VM-A dan VM-B merasa di satu LAN (VNI 5000)" tone="ok" fs={12} />
    </Fig>
  )
}

/* NAS vs SAN */
export function DgSanNas() {
  return (
    <Fig title="NAS (akses file) vs SAN (akses blok)" sub="Yang dipinta ke storage berbeda, jadi protokolnya juga berbeda" w={820} h={350}>
      <T x={20} y={24} anchor="start" cls="dg-cap-in">NAS (Network Attached Storage): akses FILE</T>
      <Device cx={130} cy={85} kind="laptop" label="Klien" />
      <Device cx={690} cy={85} kind="server" label="NAS" s={0.8} />
      <Arrow d="M180 85 H640" tone="p" both label="NFS / SMB (CIFS)" lx={410} ly={75} />
      <T x={410} y={106} cls="dg-note">{'"beri saya file /data/x.txt"'}</T>
      <T x={410} y={134} cls="dg-note">Bekerja di atas TCP/IP jaringan biasa</T>
      <path d="M20 170 H800" className="dg-lnk thin" />
      <T x={20} y={200} anchor="start" cls="dg-cap-in">SAN (Storage Area Network): akses BLOCK</T>
      <Device cx={130} cy={261} kind="server" label="Server" s={0.8} />
      <Device cx={690} cy={261} kind="server" label="Array" s={0.8} />
      <Arrow d="M180 261 H640" tone="a" both label="iSCSI / FC" lx={410} ly={251} />
      <T x={410} y={282} cls="dg-note">{'"beri saya blok 4096–8192 di LUN 3"'}</T>
      <T x={410} y={310} cls="dg-note">Server melihat storage seolah disk lokal</T>
    </Fig>
  )
}

/* VPC dengan subnet publik dan privat */
export function DgVpc() {
  return (
    <Fig title="VPC dengan subnet publik dan privat" sub="Internet Gateway untuk dua arah, NAT Gateway hanya untuk keluar" w={820} h={400}>
      <path d="M20 14 H500 V380 H20 Z" className="dg-region r-p" />
      <T x={36} y={36} anchor="start" cls="dg-region-lb">VPC 10.0.0.0/16</T>
      <path d="M40 52 H480 V162 H40 Z" className="dg-region r-a" />
      <T x={56} y={74} anchor="start" cls="dg-region-lb">Subnet publik 10.0.1.0/24</T>
      <Box x={60} y={92} w={120} h={46} label="Web VM" tone="a" />
      <path d="M180 115 H300" className="dg-lnk" />
      <Box x={300} y={92} w={160} h={46} label="Internet Gateway" tone="p" fs={12} />
      <path d="M40 188 H480 V298 H40 Z" className="dg-region r-a" />
      <T x={56} y={210} anchor="start" cls="dg-region-lb">Subnet privat 10.0.2.0/24</T>
      <Box x={60} y={228} w={120} h={46} label="DB VM" tone="a" />
      <path d="M180 251 H300" className="dg-lnk" />
      <Box x={300} y={228} w={160} h={46} label="NAT Gateway" tone="warn" fs={12} />
      <T x={260} y={346} cls="dg-note">Route Table · Security Group · NACL</T>
      <Device cx={720} cy={185} kind="cloud" label="Internet" />
      <Arrow d="M460 115 H720 V155" tone="p" both />
      <Arrow d="M460 251 H720 V225" tone="warn" label="(keluar saja)" lx={590} ly={243} />
    </Fig>
  )
}

/* Ingress Kubernetes */
export function DgK8sIngress() {
  return (
    <Fig title="Ingress: pintu masuk L7 ke Service" sub="Satu pintu, tiga tujuan menurut host dan path" w={820} h={330}>
      <Device cx={55} cy={165} kind="cloud" label="Internet" />
      <Arrow d="M95 165 H130" tone="n" />
      <Box x={130} y={118} w={210} h={94} label="Ingress Controller" sub="nginx, Traefik, atau cloud LB" tone="grad" fs={13} />
      <T x={235} y={238} cls="dg-note">terminasi TLS di sini juga</T>
      <Arrow d="M340 165 H460 V62 H600" tone="p" label="toko.contoh.com" lx={530} ly={54} />
      <Arrow d="M340 165 H600" tone="p" label="api.contoh.com/v1" lx={530} ly={157} />
      <Arrow d="M340 165 H460 V268 H600" tone="p" label="api.contoh.com/v2" lx={530} ly={260} />
      <Box x={600} y={40} w={200} h={44} label="Service: frontend" tone="a" fs={12} />
      <Box x={600} y={143} w={200} h={44} label="Service: api-v1" tone="a" fs={12} />
      <Box x={600} y={246} w={200} h={44} label="Service: api-v2" tone="a" fs={12} />
    </Fig>
  )
}

/* SDN: tradisional vs controller */
export function DgSdnCompare() {
  return (
    <Fig title="Jaringan tradisional vs berbasis controller" sub="Otak di setiap perangkat, atau satu otak untuk semua" w={820} h={320}>
      <T x={205} y={24} cls="dg-cap-in">TRADISIONAL (terdistribusi)</T>
      <T x={205} y={44} cls="dg-note">Setiap perangkat punya otak sendiri</T>
      <Device cx={85} cy={130} kind="router" label="R1" />
      <Device cx={205} cy={130} kind="router" label="R2" />
      <Device cx={325} cy={130} kind="router" label="R3" />
      <T x={205} y={200} cls="dg-tx">masing-masing hitung sendiri</T>
      <T x={205} y={236} cls="dg-note">konfigurasi per-perangkat</T>
      <T x={205} y={254} cls="dg-note">(CLI satu per satu)</T>
      <path d="M410 14 V306" className="dg-lnk dash" />
      <T x={615} y={24} cls="dg-cap-in">BERBASIS CONTROLLER (terpusat)</T>
      <T x={615} y={44} cls="dg-note">Satu controller = otak; perangkat = otot</T>
      <Box x={505} y={64} w={220} h={54} label="Controller" sub="(otak/CP)" tone="grad" fs={13} />
      <Arrow d="M565 118 L490 178" tone="p" />
      <Arrow d="M615 118 V178" tone="p" />
      <Arrow d="M665 118 L740 178" tone="p" />
      <Device cx={490} cy={200} kind="switch" label="SW" />
      <Device cx={615} cy={200} kind="switch" label="SW" />
      <Device cx={740} cy={200} kind="switch" label="SW" />
      <T x={615} y={266} cls="dg-tx">ikuti perintah</T>
    </Fig>
  )
}

/* Model tiga tier */
export function DgTigaTier() {
  const dist = (x: number, n1: string, n2: string) => (
    <g>
      <path d={`M${x} 128 H${x + 200} V196 H${x} Z`} className="dg-region r-a" />
      <Box x={x + 14} y={146} w={80} h={36} label={n1} tone="a" fs={12} r={8} />
      <Box x={x + 106} y={146} w={80} h={36} label={n2} tone="a" fs={12} r={8} />
    </g>
  )
  const acc = (x: number, n: string, ep?: string) => (
    <g>
      <Box x={x} y={250} w={56} h={32} label={n} tone="n" fs={11} r={8} />
      {ep && <>
        <path d={`M${x + 28} 282 V318`} className="dg-lnk thin" />
        <Box x={x - 2} y={318} w={60} h={26} label={ep} tone="n" fs={10} r={6} />
      </>}
    </g>
  )
  return (
    <Fig title="Model hierarkis tiga tier" sub="Core, Distribution, Access: tiap lapis punya tugas sendiri" w={820} h={370}>
      <path d="M110 14 H440 V82 H110 Z" className="dg-region r-p" />
      <Box x={150} y={30} w={100} h={38} label="Core-1" tone="p" fs={12} r={8} />
      <Box x={300} y={30} w={100} h={38} label="Core-2" tone="p" fs={12} r={8} />
      <path d="M180 82 L130 128 M180 82 L350 128 M370 82 L130 128 M370 82 L350 128" className="dg-lnk thin" />
      {dist(30, 'D1', 'D2')}
      {dist(250, 'D3', 'D4')}
      <path d="M68 196 L68 250 M133 196 L133 250 M198 196 L198 250 M290 196 L290 250 M355 196 L355 250 M420 196 L420 250" className="dg-lnk thin" />
      {acc(40, 'A1', 'PC')}
      {acc(105, 'A2', 'PC')}
      {acc(170, 'A3', 'AP')}
      {acc(262, 'A4', 'PC')}
      {acc(327, 'A5', 'IP-Phone')}
      {acc(392, 'A6')}
      <T x={500} y={32} anchor="start" cls="dg-cap-in">CORE</T>
      <T x={500} y={52} anchor="start" cls="dg-tx">Backbone: forwarding cepat, tak ada</T>
      <T x={500} y={70} anchor="start" cls="dg-tx">filtering/policy rumit. Redundan penuh.</T>
      <T x={500} y={140} anchor="start" cls="dg-cap-in">DISTRIBUTION</T>
      <T x={500} y={160} anchor="start" cls="dg-tx">Kebijakan: routing antar-VLAN, ACL,</T>
      <T x={500} y={178} anchor="start" cls="dg-tx">QoS, agregasi. Batas L2/L3.</T>
      <T x={500} y={254} anchor="start" cls="dg-cap-in">ACCESS</T>
      <T x={500} y={274} anchor="start" cls="dg-tx">Tempat endpoint nyambung.</T>
      <T x={500} y={292} anchor="start" cls="dg-tx">Port user, PoE, port security, VLAN.</T>
    </Fig>
  )
}

/* Defense in depth */
export function DgDefense() {
  const L: { name: string; desc: string; off: number; cls: string }[] = [
    { name: 'Perimeter', desc: 'Firewall/NGFW, IPS, filter tepi (12-keamanan/03)', off: 95, cls: 'r-p' },
    { name: 'Segmentasi', desc: 'VLAN + ACL/ZBF antar-zona; DMZ untuk publik', off: 100, cls: 'r-a' },
    { name: 'Access control', desc: '802.1X/NAC, port security, AAA (12/04)', off: 128, cls: 'r-p' },
    { name: 'Host/endpoint', desc: 'EDR, patching, hardening', off: 120, cls: 'r-a' },
    { name: 'Data', desc: 'Enkripsi (TLS/IPsec), DLP', off: 55, cls: 'r-p' },
  ]
  return (
    <Fig title="Keamanan berlapis (defense in depth)" sub="Penyerang harus menembus lapisan demi lapisan menuju data" w={820} h={330}>
      {L.map((l, i) => {
        const x1 = 20 + i * 30, x2 = 800 - i * 30, y1 = 10 + i * 50, y2 = 320 - i * 14
        return (
          <g key={i}>
            <path d={`M${x1} ${y1} H${x2} V${y2} H${x1} Z`} className={`dg-region ${l.cls}`} />
            <T x={x1 + 16} y={y1 + 24} anchor="start" cls="dg-region-lb">{l.name}</T>
            <T x={x1 + 16 + l.off} y={y1 + 24} anchor="start" cls="dg-tx">{l.desc}</T>
          </g>
        )
      })}
    </Fig>
  )
}

/* Pengalamatan IP: acak vs hierarkis */
export function DgIpPlan() {
  return (
    <Fig title="Pengalamatan IP: acak vs hierarkis" sub="Pola alamat yang rapi membuat summarization dan filter jadi mudah" w={820} h={340}>
      <T x={20} y={22} anchor="start" cls="dg-cap-in">BURUK (acak)</T>
      <T x={20} y={64} anchor="start" cls="dg-tx">Site A:</T>
      <Box x={90} y={42} w={170} h={36} label="10.4.7.0/24" tone="no" fs={12} r={8} />
      <Box x={275} y={42} w={170} h={36} label="192.168.55.0/24" tone="no" fs={12} r={8} />
      <Box x={460} y={42} w={170} h={36} label="172.20.3.0/24" tone="no" fs={12} r={8} />
      <T x={645} y={64} anchor="start" cls="dg-note">tak terpola</T>
      <T x={90} y={102} anchor="start" cls="dg-tx">tak bisa di-summarize, sulit dibaca, sulit filter</T>
      <path d="M20 124 H800" className="dg-lnk thin" />
      <T x={20} y={152} anchor="start" cls="dg-cap-in">BAIK (hierarkis)</T>
      <Box x={250} y={164} w={320} h={34} label={'10.<site>.<vlan>.0/24'} tone="ok" fs={13} r={8} />
      <Box x={20} y={222} w={190} h={34} label="Site 1: 10.1.0.0/16" tone="p" fs={12} r={8} />
      <Arrow d="M210 239 H290" tone="n" />
      <Box x={290} y={222} w={230} h={34} label="VLAN10 = 10.1.10.0/24" tone="a" fs={12} r={8} />
      <Box x={540} y={222} w={230} h={34} label="VLAN20 = 10.1.20.0/24" tone="a" fs={12} r={8} />
      <Box x={20} y={282} w={190} h={34} label="Site 2: 10.2.0.0/16" tone="p" fs={12} r={8} />
      <Arrow d="M210 299 H290" tone="n" />
      <Box x={290} y={282} w={400} h={34} label="dapat di-summarize sebagai 10.2.0.0/16 ke core" tone="ok" fs={12} r={8} />
    </Fig>
  )
}

/* PPDIOO */
export function DgPpdioo() {
  const s: { l: string; d: string; t: Tone }[] = [
    { l: 'Prepare', d: 'pahami kebutuhan bisnis, anggaran, strategi', t: 'p' },
    { l: 'Plan', d: 'analisis kebutuhan, audit yang ada, gap analysis', t: 'a' },
    { l: 'Design', d: 'topologi, IP, VLAN, routing, keamanan, redundansi', t: 'p' },
    { l: 'Implement', d: 'pasang & konfigurasi (bertahap, teruji)', t: 'a' },
    { l: 'Operate', d: 'jalankan, pantau, pelihara', t: 'p' },
    { l: 'Optimize', d: 'tuning, perbaikan berkelanjutan', t: 'ok' },
  ]
  return (
    <Fig title="Siklus PPDIOO" sub="Enam fase yang berputar, hasil optimasi menjadi masukan perencanaan berikutnya" w={820} h={340}>
      {s.map((x, i) => {
        const y = 14 + i * 54
        return (
          <g key={i}>
            <Box x={20} y={y} w={130} h={40} label={x.l} tone={x.t} fs={13} r={8} />
            <T x={170} y={y + 25} anchor="start" cls="dg-tx">{x.d}</T>
            {i < 5 && <Arrow d={`M85 ${y + 40} V${y + 54}`} tone="n" />}
          </g>
        )
      })}
      <Arrow d="M560 304 H690 V88 H560" tone="ok" dash />
      <T x={702} y={180} anchor="start" cls="dg-note">kembali ke Plan</T>
    </Fig>
  )
}

/* Memilih sertifikasi */
export function DgCertPilih() {
  const r: { q: string; a: string; t: Tone }[] = [
    { q: 'Baru total & ingin fondasi netral', a: 'Network+ (18.3)', t: 'a' },
    { q: 'Ingin kerja enterprise/umum', a: 'CCNA (18.2), rekomendasi utama', t: 'ok' },
    { q: 'Kerja ISP/RT-RW-Net di Indonesia', a: 'MTCNA + CCNA (18.5)', t: 'a' },
    { q: 'Tertarik keamanan', a: 'CCNA → Security+ → spesialis keamanan', t: 'a' },
    { q: 'Tertarik otomasi/cloud', a: 'CCNA → CCNA Automation / cloud certs', t: 'a' },
    { q: 'Sudah berpengalaman, ingin naik', a: 'CCNP track pilihan', t: 'a' },
  ]
  return (
    <Fig title="Memilih sertifikasi menurut situasi" sub="Mulai dari posisi Anda sekarang, bukan dari sertifikat yang paling terkenal" w={820} h={370}>
      {r.map((x, i) => {
        const y = 14 + i * 58
        return (
          <g key={i}>
            <Box x={20} y={y} w={330} h={44} label={x.q} tone="n" fs={12} r={8} />
            <Arrow d={`M350 ${y + 22} H400`} tone="n" />
            <Box x={400} y={y} w={400} h={44} label={x.a} tone={x.t} fs={12} r={8} />
          </g>
        )
      })}
    </Fig>
  )
}

/* Jalur sertifikasi MikroTik */
export function DgMikrotikJalur() {
  const c: { code: string; d: string; t: Tone }[] = [
    { code: 'MTCRE', d: 'Routing Engineer: routing statis lanjutan, OSPF, tunnel', t: 'p' },
    { code: 'MTCWE', d: 'Wireless Engineer: wireless MikroTik', t: 'p' },
    { code: 'MTCEWE', d: 'Enterprise Wireless Engineer: wireless enterprise, CAPsMAN, RF, roaming', t: 'p' },
    { code: 'MTCSWE', d: 'Switching Engineer: switching CRS/SwOS, VLAN/QinQ, MSTP, L2 security', t: 'p' },
    { code: 'MTCTCE', d: 'Traffic Control: firewall, QoS, web proxy', t: 'p' },
    { code: 'MTCUME', d: 'User Management: hotspot, RADIUS, PPP', t: 'p' },
    { code: 'MTCSE', d: 'Security Engineer: keamanan', t: 'p' },
    { code: 'MTCIPv6E', d: 'IPv6 Engineer: IPv6', t: 'p' },
    { code: 'MTCINE', d: 'Inter-networking: BGP, MPLS (level tertinggi, untuk ISP)', t: 'warn' },
  ]
  return (
    <Fig title="Jalur sertifikasi MikroTik" sub="MTCNA adalah pintu masuk, semua sertifikasi lain bercabang darinya" w={820} h={470}>
      <Box x={20} y={14} w={340} h={54} label="MTCNA (Network Associate)" sub="WAJIB, pintu masuk semua sertifikasi lain" tone="ok" fs={13} />
      <path d="M45 68 V438" className="dg-lnk" />
      {c.map((x, i) => {
        const y = 86 + i * 40
        return (
          <g key={i}>
            <path d={`M45 ${y + 16} H70`} className="dg-lnk" />
            <Box x={70} y={y} w={100} h={32} label={x.code} tone={x.t} fs={11} r={8} />
            <T x={185} y={y + 20} anchor="start" cls="dg-tx">{x.d}</T>
          </g>
        )
      })}
    </Fig>
  )
}

/* Jalur karier network */
export function DgKarierJalur() {
  const row: { l: string; s?: string; t: Tone }[] = [
    { l: 'IT Support / Helpdesk', s: '(0-2 th)', t: 'n' },
    { l: 'NOC Technician', s: '(1-2 th)', t: 'n' },
    { l: 'Network Administrator', s: '(2-3 th)', t: 'a' },
    { l: 'Network Engineer', t: 'p' },
  ]
  const br: [string, string?][] = [['Network / Solution Architect'], ['Site Reliability / Cloud Engineer'], ['Network Security Engineer /', 'Security Architect']]
  return (
    <Fig title="Jalur klasik karier jaringan" sub="Dari dukungan teknis sampai percabangan spesialisasi" w={820} h={290}>
      {row.map((r, i) => {
        const x = 10 + i * 205
        return (
          <g key={i}>
            <Box x={x} y={30} w={165} h={64} label={r.l} sub={r.s} tone={r.t} fs={12} r={8} />
            {i < 3 && <Arrow d={`M${x + 165} 62 H${x + 205}`} tone="p" />}
          </g>
        )
      })}
      {br.map((b, i) => {
        const x = 15 + i * 265
        const cx = x + 130
        return (
          <g key={i}>
            <Arrow d={`M707 94 V140 H${cx} V190`} tone="p" />
            <Box x={x} y={190} w={260} h={54} label={b[0]} sub={b[1]} tone="grad" fs={11} r={8} />
          </g>
        )
      })}
    </Fig>
  )
}
