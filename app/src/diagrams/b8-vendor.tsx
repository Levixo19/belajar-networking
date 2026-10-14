import { Fig, Box, Arrow, T, Device } from './primitives'

/* 23.1 Arsitektur Junos: Routing Engine dan Packet Forwarding Engine */
export function DgV8JunosRePfe() {
  return (
    <Fig title="Junos: Routing Engine dan Packet Forwarding Engine" sub="Bidang kontrol menyusun tabel, bidang data meneruskan paket" w={820} h={320}>
      <path d="M16 16 H388 V270 H16 Z" className="dg-region r-p" />
      <path d="M432 16 H804 V270 H432 Z" className="dg-region r-a" />
      <T x={202} y={40} cls="dg-cap-in">Routing Engine (RE): bidang kontrol</T>
      <T x={618} y={40} cls="dg-cap-in">Packet Forwarding Engine (PFE): bidang data</T>

      <Box x={36} y={56} w={158} h={50} label="rpd" sub="OSPF, BGP, LDP" tone="n" />
      <Box x={210} y={56} w={158} h={50} label="mgd" sub="CLI, NETCONF" tone="n" />
      <Box x={36} y={122} w={158} h={50} label="chassisd" sub="perangkat keras" tone="n" />
      <Box x={210} y={122} w={158} h={50} label="Tabel routing" sub="inet.0, inet6.0, mpls.0" tone="a" />
      <Box x={36} y={190} w={332} h={50} label="Kernel (turunan FreeBSD)" sub="menyalin rute terbaik ke PFE" tone="p" />

      <Box x={456} y={56} w={324} h={50} label="Forwarding table" sub="salinan rute terbaik dari RE" tone="a" />
      <Box x={456} y={122} w={324} h={50} label="ASIC: lookup dan switching" sub="L2 dan L3 pada kecepatan kabel" tone="p" />
      <Box x={456} y={190} w={324} h={50} label="Port interface" sub="ge-0/0/0, xe-0/0/1, ..." tone="n" />

      <Arrow d="M368 215 H410 V81 H456" tone="a" />
      <Arrow d="M618 106 V122" tone="n" />
      <Arrow d="M618 172 V190" tone="n" both />
      <T x={410} y={296} cls="dg-note" size={11}>Paket data tidak melewati RE. Bila rpd restart, PFE tetap meneruskan dengan tabel terakhir.</T>
    </Fig>
  )
}

/* 23.1 Alur candidate, commit confirmed, rollback */
export function DgV8JunosCommit() {
  return (
    <Fig title="Alur konfigurasi Junos: candidate, commit, rollback" sub="Perubahan baru berlaku setelah commit; commit confirmed menarik kembali otomatis" w={840} h={320}>
      <Box x={20} y={50} w={150} h={54} label="Active" sub="konfigurasi berjalan" tone="n" />
      <Box x={240} y={50} w={150} h={54} label="Candidate" sub="set, delete, edit" tone="a" />
      <Box x={450} y={50} w={150} h={54} label="commit check" sub="validasi saja" tone="p" />
      <Box x={650} y={50} w={170} h={54} label="commit confirmed N" sub="aktif, timer N menit" tone="warn" />
      <Arrow d="M170 77 H240" tone="n" label="salin" lx={205} ly={68} />
      <Arrow d="M390 77 H450" tone="a" />
      <Arrow d="M600 77 H650" tone="p" />

      <Box x={240} y={170} w={150} h={54} label="Arsip" sub="rollback 1 sampai 49" tone="n" />
      <Arrow d="M315 170 V104" tone="a" label="rollback N" lx={360} ly={142} />

      <Box x={450} y={170} w={170} h={54} label="commit kedua" sub="menjadi permanen" tone="ok" />
      <Box x={650} y={170} w={170} h={54} label="Timer habis" sub="rollback otomatis" tone="no" />
      <Arrow d="M690 104 V138 H535 V170" tone="ok" />
      <T x={612} y={132} cls="dg-sb">dikonfirmasi</T>
      <Arrow d="M790 104 V170" tone="no" />
      <T x={738} y={140} cls="dg-sb" anchor="end">tidak</T>

      <Arrow d="M535 224 V266 H95 V104" tone="ok" label="menjadi Active baru" lx={300} ly={282} />
      <T x={735} y={266} cls="dg-note" size={11}>kembali ke Active lama</T>
      <Arrow d="M735 224 V248" tone="no" />
    </Fig>
  )
}

/* 23.2 Fabric SD-Access */
export function DgV8SdaFabric() {
  return (
    <Fig title="Fabric SD-Access: peran node dan tiga lapis" sub="Underlay IS-IS, kontrol LISP, data VXLAN dengan SGT" w={840} h={450}>
      <Device cx={420} cy={36} kind="cloud" label="Jaringan luar" />
      <Arrow d="M420 72 V78 L300 92" tone="n" both />
      <Box x={200} y={96} w={170} h={46} label="Border node" sub="gerbang ke luar fabric" tone="warn" />
      <Box x={470} y={96} w={170} h={46} label="Control plane node" sub="database EID ke RLOC" tone="a" />
      <Box x={315} y={196} w={210} h={46} label="Intermediate node" sub="underlay IP, tanpa enkapsulasi" tone="n" />
      <path d="M285 142 L380 196" className="dg-lnk" />
      <path d="M555 142 L460 196" className="dg-lnk" />
      <Box x={110} y={296} w={170} h={46} label="Edge node E1" sub="anycast gateway" tone="p" />
      <Box x={560} y={296} w={170} h={46} label="Edge node E2" sub="anycast gateway" tone="p" />
      <path d="M375 242 L195 296" className="dg-lnk" />
      <path d="M465 242 L645 296" className="dg-lnk" />
      <Arrow d="M280 330 H560" tone="a" dash both label="VXLAN: VNI dan SGT" lx={420} ly={322} />
      <Arrow d="M195 296 V160 H540 V146" tone="p" dash label="LISP: daftar dan tanya" lx={330} ly={175} />
      <path d="M195 342 V366" className="dg-lnk" />
      <path d="M645 342 V366" className="dg-lnk" />
      <Device cx={195} cy={388} kind="laptop" label="Laptop A (SGT Pegawai)" />
      <Device cx={645} cy={388} kind="server" label="Server B (SGT Server)" />
      <T x={420} y={442} cls="dg-note" size={10.5}>IS-IS di underlay, MTU 9100. VN = VRF (makro). SGT = golongan (mikro), diberi ISE.</T>
    </Fig>
  )
}

/* 23.2 Arsitektur Catalyst SD-WAN */
export function DgV8SdwanArsitektur() {
  return (
    <Fig title="Catalyst SD-WAN: komponen dan jalur" sub="Kontrol lewat Controller (OMP), data langsung antar WAN Edge (IPsec)" w={840} h={390}>
      <path d="M16 16 H824 V130 H16 Z" className="dg-region r-p" />
      <T x={420} y={38} cls="dg-cap-in">Bidang manajemen, kontrol, dan orkestrasi</T>
      <Box x={40} y={52} w={200} h={60} label="SD-WAN Manager" sub="dulu vManage" tone="n" />
      <Box x={320} y={52} w={200} h={60} label="SD-WAN Controller" sub="dulu vSmart, menjalankan OMP" tone="a" />
      <Box x={600} y={52} w={200} h={60} label="SD-WAN Validator" sub="dulu vBond" tone="n" />
      <Arrow d="M240 82 H320" tone="n" both />
      <Arrow d="M520 82 H600" tone="n" both />

      <Box x={110} y={216} w={200} h={56} label="WAN Edge Cabang A" sub="TLOC mpls, biz-internet" tone="p" />
      <Box x={530} y={216} w={200} h={56} label="WAN Edge Cabang B" sub="TLOC mpls, biz-internet" tone="p" />
      <Arrow d="M210 216 V176 H390 V112" tone="a" dash />
      <Arrow d="M630 216 V176 H450 V112" tone="a" dash />
      <T x={420} y={168} cls="dg-sb">OMP</T>
      <T x={420} y={190} cls="dg-note" size={10.5}>kontrol DTLS/TLS</T>

      <Device cx={420} cy={246} kind="cloud" label="Transport: MPLS, internet, LTE" />
      <Arrow d="M310 244 H378" tone="ok" both />
      <Arrow d="M462 244 H530" tone="ok" both />
      <T x={420} y={316} cls="dg-note" size={10.5}>Tunnel data IPsec + BFD (ukur loss, latency, jitter)</T>
      <Device cx={210} cy={352} kind="pc" label="LAN cabang A" s={0.8} />
      <Device cx={630} cy={352} kind="pc" label="LAN cabang B" s={0.8} />
      <path d="M210 272 V330" className="dg-lnk" />
      <path d="M630 272 V330" className="dg-lnk" />
    </Fig>
  )
}

/* 23.3 Urutan autentikasi Catalyst Center */
export function DgV8CatcTokenAlur() {
  const x1 = 150
  const x2 = 690
  return (
    <Fig title="Catalyst Center: token, panggilan, dan kedaluwarsa" sub="Basic Auth sekali, lalu X-Auth-Token selama 60 menit" w={840} h={360}>
      <Box x={30} y={16} w={240} h={40} label="Skrip Python (requests)" tone="p" />
      <Box x={570} y={16} w={240} h={40} label="Catalyst Center" tone="a" />
      <path d={`M${x1} 56 V340`} className="dg-lnk" />
      <path d={`M${x2} 56 V340`} className="dg-lnk" />
      <Arrow d={`M${x1} 96 H${x2}`} tone="p" label="1. POST /dna/system/api/v1/auth/token (Basic Auth)" lx={420} ly={88} />
      <Arrow d={`M${x2} 134 H${x1}`} tone="ok" label='2. 200: {"Token": "..."}' lx={420} ly={126} />
      <Arrow d={`M${x1} 172 H${x2}`} tone="p" label="3. GET /dna/intent/api/v1/network-device (X-Auth-Token)" lx={420} ly={164} />
      <Arrow d={`M${x2} 210 H${x1}`} tone="ok" label='4. 200: {"response": [...]}' lx={420} ly={202} />
      <Arrow d={`M${x1} 266 H${x2}`} tone="p" label="5. permintaan sesudah 60 menit" lx={420} ly={258} />
      <Arrow d={`M${x2} 304 H${x1}`} tone="no" label="6. 401 Unauthorized: ulangi dari langkah 1" lx={420} ly={296} />
      <T x={420} y={238} cls="dg-note" size={10.5}>... token berlaku 60 menit ...</T>
    </Fig>
  )
}

/* 23.3 Peta autentikasi dan batas tiap API */
export function DgV8ApiPeta() {
  const rows = [
    { n: 'Catalyst Center', ns: 'Intent API, on-premise', a: 'Basic, lalu X-Auth-Token', as: 'token 60 menit, 401 = login ulang', p: 'offset dan limit', ps: 'loop sampai halaman habis' },
    { n: 'Meraki Dashboard', ns: 'cloud, api.meraki.com', a: 'Authorization: Bearer', as: 'API key dari dashboard', p: 'perPage dan header Link', ps: '10 req/s per org, 429 Retry-After' },
    { n: 'NSO', ns: 'orkestrator, RESTCONF', a: 'Basic pada /restconf', as: 'yang-data+json, model YANG', p: 'depth dan filter query', ps: 'transaksi atomik lintas perangkat' },
    { n: 'MikroTik v7', ns: 'per router, /rest', a: 'Basic tiap permintaan', as: 'tanpa token', p: 'tanpa pagination', ps: '.proplist, timeout perintah 60 detik' },
  ]
  return (
    <Fig title="Peta API: autentikasi dan batas" sub="Pola sama (HTTPS, JSON), mekanisme token dan batas berbeda" w={840} h={360}>
      <T x={115} y={30} cls="dg-cap-in">Platform</T>
      <T x={385} y={30} cls="dg-cap-in">Autentikasi</T>
      <T x={680} y={30} cls="dg-cap-in">Halaman dan batas</T>
      {rows.map((r, i) => {
        const y = 44 + i * 76
        return (
          <g key={i}>
            <Box x={20} y={y} w={190} h={62} label={r.n} sub={r.ns} tone="p" />
            <Box x={250} y={y} w={270} h={62} label={r.a} sub={r.as} tone="a" />
            <Box x={560} y={y} w={260} h={62} label={r.p} sub={r.ps} tone="n" />
            <Arrow d={`M210 ${y + 31} H250`} tone="n" />
            <Arrow d={`M520 ${y + 31} H560`} tone="n" />
          </g>
        )
      })}
    </Fig>
  )
}
