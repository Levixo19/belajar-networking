import { Fig, Box, Arrow, T, Device } from './primitives'

/* Kartu dengan beberapa baris teks di dalamnya (judul + baris kecil). */
function Card({ x, y, w, h, lines, tone = 'n', fs = 12 }: {
  x: number; y: number; w: number; h: number; lines: string[]; tone?: 'n' | 'p' | 'a' | 'ok' | 'warn' | 'no' | 'grad' | 'dark'; fs?: number
}) {
  const cx = x + w / 2
  const step = 16
  const top = y + h / 2 - ((lines.length - 1) * step) / 2 + 4
  return (
    <g>
      <Box x={x} y={y} w={w} h={h} tone={tone} />
      {lines.map((l, i) => (
        <T key={i} x={cx} y={top + i * step} cls={i === 0 ? 'dg-lb' : 'dg-sb'} size={i === 0 ? fs : 10.5}>{l}</T>
      ))}
    </g>
  )
}

/* 19.4 Pohon HTB: inner queue dan leaf queue */
export function DgS4QosHtbTree() {
  const groups = [
    { c: 160, name: 'BISNIS (inner)', leaves: ['toko-a', 'toko-b', '...'] },
    { c: 430, name: 'RUMAH-20 (inner)', leaves: ['rumah-31', '...'] },
    { c: 690, name: 'RUMAH-10 (inner)', leaves: ['rumah-01', '...'] },
  ]
  return (
    <Fig title="Pohon HTB: inner queue dan leaf queue" sub="Hanya leaf yang memegang trafik nyata; inner membagi kapasitas ke bawah" w={840} h={330}>
      <Box x={310} y={24} w={240} h={52} label="TOTAL-DOWN (inner)" sub="max-limit=285M" tone="p" />
      {groups.map((g, gi) => {
        const n = g.leaves.length
        const gap = 86
        const x0 = g.c - ((n - 1) * gap) / 2
        return (
          <g key={gi}>
            <path d={`M430 76 V102 H${g.c} V132`} className="dg-lnk" />
            <Box x={g.c - 85} y={132} w={170} h={42} label={g.name} tone="a" fs={11.5} />
            {g.leaves.map((lf, li) => {
              const lx = x0 + li * gap
              return (
                <g key={li}>
                  <path d={`M${g.c} 174 V198 H${lx} V222`} className="dg-lnk" />
                  {lf === '...'
                    ? <T x={lx} y={246} cls="dg-note" size={14}>...</T>
                    : <Box x={lx - 38} y={222} w={76} h={36} label={lf} tone="n" fs={11} r={8} />}
                </g>
              )
            })}
          </g>
        )
      })}
      <T x={420} y={296} cls="dg-note" size={11}>leaf: trafik nyata (baris paling bawah). Inner: pengelompok yang membagi max-limit ke anak-anaknya.</T>
    </Fig>
  )
}

/* 19.5 PTP vs PTMP */
export function DgS4WirelessPtpPtmp() {
  return (
    <Fig title="PTP (backhaul) dan PTMP (WISP)" sub="Mode wireless menentukan peran tiap radio dalam link" w={820} h={300}>
      <path d="M16 20 H396 V282 H16 Z" className="dg-region r-p" />
      <path d="M424 20 H804 V282 H424 Z" className="dg-region r-a" />
      <T x={206} y={44} cls="dg-cap-in">PTP (Point-to-Point) backhaul</T>
      <T x={614} y={44} cls="dg-cap-in">PTMP (Point-to-Multipoint)</T>

      <Device cx={80} cy={130} kind="ap" label="AP: bridge / ap-bridge" />
      <Device cx={332} cy={130} kind="router" label="station-bridge" />
      <Arrow d="M118 130 H294" tone="p" both label="link nirkabel" lx={206} ly={120} />
      <T x={206} y={214} cls="dg-note" size={10.5}>Menghubungkan dua lokasi,</T>
      <T x={206} y={230} cls="dg-note" size={10.5}>mis. tower ke pelanggan jauh</T>

      <Device cx={614} cy={96} kind="ap" label="AP: ap-bridge" />
      <Device cx={500} cy={190} kind="pc" label="station" />
      <Device cx={614} cy={190} kind="pc" label="station" />
      <Device cx={728} cy={190} kind="pc" label="station" />
      <Arrow d="M600 118 L512 168" tone="a" both />
      <Arrow d="M614 122 V164" tone="a" both />
      <Arrow d="M628 118 L716 168" tone="a" both />
      <T x={614} y={262} cls="dg-note" size={10.5}>Satu tower melayani banyak pelanggan (WISP)</T>
    </Fig>
  )
}

/* 19.6 IPsec vs NAT: urutan srcnat */
export function DgS4IpsecNatUrutan() {
  return (
    <Fig title="IPsec site-to-site: accept dulu, baru masquerade" sub="Rantai srcnat dibaca dari atas ke bawah; aturan pertama yang cocok menang" w={860} h={330}>
      <Box x={20} y={90} w={120} h={60} label="LAN A" sub="192.168.1.0/24" tone="n" />
      <path d="M170 40 H540 V260 H170 Z" className="dg-region r-p" />
      <T x={355} y={62} cls="dg-cap-in">Router A, chain=srcnat</T>
      <Box x={190} y={82} w={330} h={50} label="1. dst-address=192.168.2.0/24" sub="action=accept (kecualikan dari NAT)" tone="ok" fs={11.5} />
      <Box x={190} y={186} w={330} h={50} label="2. out-interface=ether1-wan" sub="action=masquerade" tone="warn" fs={11.5} />
      <Arrow d="M140 108 H190" tone="ok" />
      <Arrow d="M355 132 V186" tone="n" label="tujuan lain" lx={410} ly={164} />
      <Box x={575} y={82} w={130} h={50} label="IPsec policy" sub="enkripsi LAN A ke LAN B" tone="a" fs={11.5} />
      <Arrow d="M520 107 H575" tone="ok" />
      <Box x={735} y={82} w={105} h={50} label="LAN B" sub="192.168.2.0/24" tone="n" />
      <Arrow d="M705 107 H735" tone="a" label="terowongan" lx={720} ly={72} />
      <Box x={575} y={186} w={130} h={50} label="Internet" sub="alamat WAN (NAT)" tone="n" fs={11.5} />
      <Arrow d="M520 211 H575" tone="warn" />
      <T x={430} y={282} cls="dg-note" size={11}>Jika masquerade berada di atas aturan accept, paket VPN di-NAT sebelum dienkripsi</T>
      <T x={430} y={300} cls="dg-note" size={11}>dan tidak lagi cocok dengan policy IPsec, sehingga tunnel gagal.</T>
    </Fig>
  )
}

/* 19.7 Kosakata scripting RouterOS */
export function DgS4ScriptKosakata() {
  const rows: [string, string, string][] = [
    [':local / :global', 'variabel', 'p'],
    [':if ... do={...}', 'kondisi', 'p'],
    [':foreach i in={...}', 'loop', 'p'],
    [':log info/warning', 'tulis ke log', 'a'],
    ['[/command get value]', 'ambil nilai', 'a'],
    ['[find ...]', 'cari item (mengembalikan id)', 'a'],
  ]
  return (
    <Fig title="Kosakata dasar scripting RouterOS" sub="Enam bentuk yang muncul di hampir semua skrip" w={700} h={300}>
      {rows.map(([cmd, ket, tone], i) => {
        const y = 20 + i * 44
        return (
          <g key={i}>
            <Box x={40} y={y} w={290} h={34} label={cmd} tone={tone as 'p' | 'a'} fs={12} r={8} />
            <Arrow d={`M334 ${y + 17} H386`} tone="n" />
            <Box x={390} y={y} w={270} h={34} label={ket} tone="n" fs={12} r={8} />
          </g>
        )
      })}
    </Fig>
  )
}

/* 19.8 RIB, FIB, filter */
export function DgS4RouterosRibFib() {
  const src = ['OSPF', 'BGP', 'static', 'conn']
  return (
    <Fig title="Alur rute di RouterOS v7: filter, RIB, seleksi, FIB" sub="Filter bekerja per protokol di pintu masuk dan keluar RIB" w={860} h={360}>
      {src.map((s, i) => (
        <g key={s}>
          <Box x={20} y={50 + i * 48} w={90} h={36} label={s} tone="a" fs={12} r={8} />
          <path d={`M110 ${68 + i * 48} H128`} className="dg-lnk" />
        </g>
      ))}
      <path d="M128 68 V212" className="dg-lnk" />
      <Arrow d="M128 140 H150" tone="p" />
      <Box x={150} y={100} w={130} h={80} label="filter masuk" sub="(per protokol)" tone="p" fs={11.5} />
      <Arrow d="M280 140 H318" tone="p" />
      <Box x={318} y={100} w={90} h={80} label="RIB" tone="dark" />
      <Arrow d="M408 140 H446" tone="p" />
      <Box x={446} y={100} w={140} h={80} label="seleksi rute" sub="distance, next-hop lookup" tone="a" fs={11.5} />
      <Arrow d="M586 140 H624" tone="p" />
      <Box x={624} y={100} w={90} h={80} label="FIB" tone="dark" />
      <Arrow d="M714 140 H742" tone="p" />
      <Box x={742} y={100} w={100} h={80} label="forwarding" sub="paket" tone="ok" fs={11.5} />

      <Box x={560} y={24} w={282} h={34} label="/ip route print (ringkas)" tone="n" fs={11} r={8} />
      <path d="M669 58 V100" className="dg-lnk" strokeDasharray="4 3" />
      <Box x={560} y={226} w={282} h={34} label="/routing rule, routing table" tone="n" fs={11} r={8} />
      <path d="M669 180 V226" className="dg-lnk" strokeDasharray="4 3" />

      <Arrow d="M363 180 V230" tone="n" />
      <Box x={288} y={230} w={150} h={40} label="filter keluar" tone="p" fs={11.5} r={8} />
      <Arrow d="M363 270 V304" tone="n" />
      <Box x={268} y={304} w={190} h={40} label="OSPF / BGP ke tetangga" tone="a" fs={11.5} r={8} />
    </Fig>
  )
}

/* 19.9 Backbone ISP kecil */
export function DgS4BackboneIspKecil() {
  return (
    <Fig title="Desain backbone ISP kecil dengan MikroTik" sub="Dua border router, tiga PE di POP, IGP + LDP + iBGP di dalam" w={860} h={390}>
      <Box x={90} y={16} w={150} h={34} label="Upstream A" tone="n" r={8} />
      <Box x={340} y={16} w={150} h={34} label="Upstream B" tone="n" r={8} />
      <Box x={600} y={16} w={230} h={34} label="IX (IIX/OpenIXP/dll)" tone="n" r={8} />
      <path d="M165 50 V100" className="dg-lnk" />
      <path d="M415 50 V100" className="dg-lnk" />
      <Box x={90} y={100} w={150} h={44} label="BR1 (CCR)" tone="p" />
      <Box x={340} y={100} w={150} h={44} label="BR2 (CCR)" tone="p" />
      <path d="M240 122 H340" className="dg-lnk" />
      <path d="M490 122 H715 V50" className="dg-lnk" />
      <T x={600} y={112} cls="dg-note" size={10.5}>eBGP, filter (19.8)</T>

      <path d="M165 144 V206 M415 144 V206 M165 206 H665" className="dg-lnk" />
      <T x={520} y={196} cls="dg-note" size={10.5} anchor="start">OSPF area 0 + LDP + iBGP</T>
      <T x={520} y={181} cls="dg-note" size={10.5} anchor="start">(RR di BR1/BR2 atau CORE)</T>

      {[165, 415, 665].map((cx, i) => (
        <g key={cx}>
          <path d={`M${cx} 206 V250`} className="dg-lnk" />
          <Box x={cx - 85} y={250} w={170} h={42} label={`PE-POP${i + 1}`} tone="a" />
          <path d={`M${cx} 292 V330`} className="dg-lnk" />
          <T x={cx} y={348} cls="dg-sb">pelanggan</T>
        </g>
      ))}
      <path d="M250 271 H330" className="dg-lnk" />
      <T x={290} y={263} cls="dg-note" size={10.5}>fiber</T>
      <path d="M500 271 H580" className="dg-lnk" />
      <T x={540} y={263} cls="dg-note" size={10.5}>wireless</T>
      <T x={430} y={378} cls="dg-note" size={11}>PE: VRF, VPLS, PPPoE BNG</T>
    </Fig>
  )
}

/* 19.10 Arsitektur RADIUS */
export function DgS4RadiusArsitektur() {
  return (
    <Fig title="AAA terpusat: pelanggan, NAS, dan server RADIUS" sub="Router menjadi klien RADIUS; keputusan dan catatan sesi ada di server" w={870} h={310}>
      <T x={95} y={30} cls="dg-cap-in">Pelanggan</T>
      <T x={95} y={46} cls="dg-note" size={10.5}>(supplicant)</T>
      <Card x={20} y={64} w={150} h={150} lines={['modem', 'laptop', 'HP']} tone="n" />

      <T x={375} y={30} cls="dg-cap-in">NAS (router MikroTik)</T>
      <T x={375} y={46} cls="dg-note" size={10.5}>(RADIUS client)</T>
      <Card x={270} y={64} w={210} h={150} lines={['PPPoE server', 'Hotspot', '/radius (klien)', '/radius incoming']} tone="p" />

      <T x={770} y={30} cls="dg-cap-in">Server RADIUS</T>
      <T x={770} y={46} cls="dg-note" size={10.5}>(User Manager / FreeRADIUS)</T>
      <Card x={690} y={64} w={160} h={150} lines={['basis data user,', 'profile, limitation,', 'sesi, accounting', 'CoA/Disconnect']} tone="a" />

      <Arrow d="M170 120 H270" tone="n" label="PPPoE / HTTP" lx={220} ly={108} />
      <T x={220} y={142} cls="dg-note" size={10.5}>login</T>

      <Arrow d="M480 92 H690" tone="p" both label="UDP 1812 (autentikasi)" lx={585} ly={84} />
      <Arrow d="M480 140 H690" tone="ok" label="UDP 1813 (accounting)" lx={585} ly={132} />
      <Arrow d="M690 188 H480" tone="warn" label="UDP 3799 (CoA/Disconnect)" lx={585} ly={180} />
      <T x={435} y={262} cls="dg-note" size={11}>Server memutuskan akses, profil, dan batas; NAS menegakkannya dan melaporkan pemakaian.</T>
    </Fig>
  )
}

/* 19.11 Switch chip vs CPU */
export function DgS4CrsSwitchChip() {
  const ports = [0, 1, 2, 3, 4, 5]
  return (
    <Fig title="Dua jalur forwarding CRS: switch chip dan CPU" sub="Trafik yang selesai di ASIC tidak pernah menyentuh CPU" w={820} h={380}>
      <T x={410} y={22} cls="dg-cap-in">port fisik (ether1..ether24, sfp-sfpplus1..)</T>
      {ports.map(i => (
        <g key={i}>
          <Box x={128 + i * 116} y={34} w={28} h={20} tone="n" r={4} />
          <path d={`M${142 + i * 116} 54 V106`} className="dg-lnk" />
        </g>
      ))}
      <Card x={100} y={106} w={620} h={92} lines={['SWITCH CHIP (ASIC)', 'tabel MAC (FDB), tabel VLAN, ACL, isolasi port,', 'policer/shaper, storm control, mirror, L3HW']} tone="p" fs={13} />
      <Arrow d="M410 198 V250" tone="n" both />
      <T x={425} y={228} cls="dg-note" size={10.5} anchor="start">switch1-cpu (port internal)</T>
      <Card x={100} y={250} w={620} h={92} lines={['CPU', 'RouterOS: firewall, NAT, queue, routing lunak,', 'PPPoE, Hotspot, DHCP, STP, IGMP snooping (kontrol)']} tone="a" fs={13} />
    </Fig>
  )
}

/* 22.1 Satu entri label MPLS 32 bit */
export function DgS4MplsLabelEntry() {
  const x0 = 90
  const u = 20
  const fields: { from: number; len: number; label: string; sub: string; tone: 'p' | 'a' | 'warn' | 'ok' }[] = [
    { from: 0, len: 20, label: 'Label', sub: '20 bit', tone: 'p' },
    { from: 20, len: 3, label: 'TC', sub: '3 bit', tone: 'a' },
    { from: 23, len: 1, label: 'S', sub: '1', tone: 'warn' },
    { from: 24, len: 8, label: 'TTL', sub: '8 bit', tone: 'ok' },
  ]
  return (
    <Fig title="Satu entri label MPLS: 32 bit" sub="Label 20 bit, TC 3 bit, S 1 bit, TTL 8 bit" w={820} h={230}>
      {[0, 8, 16, 24].map((b, i) => (
        <T key={b} x={x0 + b * u + 80} y={26} cls="dg-note" size={10.5}>{`byte ${i}`}</T>
      ))}
      {Array.from({ length: 32 }, (_, i) => (
        <T key={i} x={x0 + i * u + u / 2} y={54} cls="dg-note" size={8.5}>{i}</T>
      ))}
      {fields.map(f => (
        <Box key={f.label} x={x0 + f.from * u} y={66} w={f.len * u} h={58} label={f.label} sub={f.sub} tone={f.tone} r={f.len === 1 ? 3 : 6} fs={f.len === 1 ? 11 : 12} />
      ))}
      <path d={`M${x0} 138 V146 H${x0 + 640} V138`} className="dg-brace2" />
      <T x={x0 + 320} y={166} cls="dg-note" size={11}>4 byte per entri; tumpukan label = beberapa entri berurutan</T>
      <T x={x0 + 480} y={196} cls="dg-note" size={11}>S = 1 pada entri paling bawah (bottom of stack), S = 0 pada entri lain</T>
    </Fig>
  )
}

/* 22.1 Perjalanan paket berlabel */
export function DgS4MplsLabelPath() {
  const nodes = [
    { cx: 70, kind: 'pc' as const, name: 'ce1a' },
    { cx: 250, kind: 'router' as const, name: 'pe1' },
    { cx: 430, kind: 'router' as const, name: 'p1' },
    { cx: 610, kind: 'router' as const, name: 'pe2' },
    { cx: 790, kind: 'pc' as const, name: 'ce2a' },
  ]
  const pk = [
    { mid: 160, w: 60, t: 'IP', tone: 'n' as const },
    { mid: 340, w: 130, t: '17 | 81 | IP', tone: 'a' as const },
    { mid: 520, w: 100, t: '81 | IP', tone: 'a' as const },
    { mid: 700, w: 60, t: 'IP', tone: 'n' as const },
  ]
  const ops = [
    { cx: 250, l: 'PUSH 17 (+81)', s: 'label VPN 81 di bawah, 17 di atas' },
    { cx: 430, l: 'POP 17 (PHP)', s: 'penultimate hop' },
    { cx: 610, l: 'POP 81', s: 'lookup di VRF pelanggan' },
  ]
  return (
    <Fig title="Perjalanan satu paket: push, pop (PHP), pop" sub="ping dari ce1a ke 192.168.2.1 di belakang ce2a" w={860} h={290}>
      {nodes.map(n => <Device key={n.name} cx={n.cx} cy={130} kind={n.kind} label={n.name} />)}
      {[0, 1, 2, 3].map(i => (
        <Arrow key={i} d={`M${nodes[i].cx + 30} 130 H${nodes[i + 1].cx - 30}`} tone="p" />
      ))}
      {pk.map((p, i) => (
        <Box key={i} x={p.mid - p.w / 2} y={72} w={p.w} h={30} label={p.t} tone={p.tone} fs={11} r={8} />
      ))}
      {ops.map(o => (
        <Card key={o.cx} x={o.cx - 85} y={182} w={170} h={50} lines={[o.l, o.s]} tone="p" fs={11.5} />
      ))}
      <T x={430} y={262} cls="dg-note" size={11}>Label 17: transport, dari p1 (LDP). Label 81: dialokasikan pe2 untuk VRF pelanggan A.</T>
    </Fig>
  )
}

/* 22.2 Tumpukan label L3VPN */
export function DgS4L3vpnLabelStack() {
  return (
    <Fig title="Dua label, dua tugas: transport dan VPN" sub="Paket dari ce1a ke 192.168.2.1, di link pe1 ke p1" w={860} h={250}>
      <Card x={20} y={46} w={130} h={110} lines={['Ethernet', '0x8847']} tone="n" />
      <Card x={160} y={46} w={210} h={110} lines={['Label 17 (S=0)', 'TRANSPORT', 'dari LDP (p1)', '"bawa ke pe2"']} tone="p" />
      <Card x={380} y={46} w={210} h={110} lines={['Label 81 (S=1)', 'VPN', 'dari MP-BGP (pe2)', '"di pe2: VRF CUST-A"']} tone="a" />
      <Card x={600} y={46} w={240} h={110} lines={['IP 192.168.1.1 ->', '192.168.2.1']} tone="n" />
      <path d="M160 172 V180 H370 V172" className="dg-brace2" />
      <T x={265} y={202} cls="dg-note" size={10.5}>diganti P di tiap hop</T>
      <path d="M380 172 V180 H590 V172" className="dg-brace2" />
      <T x={485} y={202} cls="dg-note" size={10.5}>tetap sampai pe2</T>
      <T x={430} y={236} cls="dg-note" size={11}>Setiap entri 4 byte; label atas (S=0) dibaca P, label bawah (S=1) hanya dibaca PE egress.</T>
    </Fig>
  )
}

/* 22.2 Hub and spoke dengan RT */
export function DgS4L3vpnHubSpoke() {
  return (
    <Fig title="Hub-and-spoke dengan route-target" sub="Spoke hanya mengimpor rute hub; semua trafik antar-spoke lewat CE hub" w={860} h={330}>
      <path d="M20 40 H250 V270 H20 Z" className="dg-region r-p" />
      <T x={135} y={62} cls="dg-cap-in">Spoke PE</T>
      <Box x={36} y={84} w={198} h={56} label="Spoke 1 VRF" sub="export 2001, import 2000" tone="p" fs={11.5} />
      <Box x={36} y={160} w={198} h={56} label="Spoke 2 VRF" sub="export 2001, import 2000" tone="p" fs={11.5} />

      <path d="M340 40 H610 V270 H340 Z" className="dg-region r-a" />
      <T x={475} y={62} cls="dg-cap-in">Hub PE</T>
      <Box x={360} y={80} w={230} h={56} label="VRF HUB-IN" sub="import 2001" tone="a" fs={11.5} />
      <Box x={360} y={190} w={230} h={56} label="VRF HUB-OUT" sub="export 2000" tone="a" fs={11.5} />
      <Arrow d="M250 108 H340" tone="p" />
      <T x={295} y={98} cls="dg-note" size={10}>2001</T>
      <Arrow d="M340 218 H250" tone="ok" />
      <T x={295} y={236} cls="dg-note" size={10}>2000</T>

      <Box x={700} y={116} w={140} h={80} label="CE hub / firewall" tone="warn" fs={11.5} />
      <Arrow d="M590 108 H650 V140 H700" tone="a" label="link 1" lx={650} ly={98} />
      <Arrow d="M700 172 H650 V218 H590" tone="ok" label="link 2" lx={650} ly={236} />

      <T x={430} y={298} cls="dg-note" size={11}>RT:65000:2001 = "dari spoke"     RT:65000:2000 = "dari hub"</T>
    </Fig>
  )
}

/* 22.3 Segment routing: tumpukan SID */
export function DgS4SrLabelStack() {
  const nodes = [
    { cx: 90, name: 'R1' },
    { cx: 330, name: 'R5' },
    { cx: 570, name: 'R4' },
    { cx: 780, name: 'R3' },
  ]
  const pk = [
    { mid: 210, w: 170, t: '16004 | 16003 | IP', tone: 'a' as const },
    { mid: 450, w: 120, t: '16003 | IP', tone: 'a' as const },
    { mid: 675, w: 110, t: 'paket IP polos', tone: 'n' as const },
  ]
  return (
    <Fig title="Source routing dengan label: R1 ke R3 lewat R5 dan R4" sub="Bukan jalur terpendek lewat R2; dua segmen di tumpukan" w={860} h={350}>
      {nodes.map(n => <Device key={n.name} cx={n.cx} cy={150} kind="router" label={n.name} />)}
      {[0, 1, 2].map(i => (
        <Arrow key={i} d={`M${nodes[i].cx + 30} 150 H${nodes[i + 1].cx - 30}`} tone="p" />
      ))}
      {pk.map((p, i) => (
        <Box key={i} x={p.mid - p.w / 2} y={86} w={p.w} h={32} label={p.t} tone={p.tone} fs={11} r={8} />
      ))}
      <Card x={10} y={206} w={160} h={54} lines={['R1 mendorong', 'push [16004 | 16003]']} tone="p" fs={11.5} />
      <Card x={245} y={206} w={170} h={54} lines={['penultimate untuk R4', 'pop 16004 (PHP)']} tone="p" fs={11.5} />
      <Card x={485} y={206} w={170} h={54} lines={['penultimate untuk R3', 'pop 16003 (PHP)']} tone="p" fs={11.5} />
      <T x={30} y={298} cls="dg-note" size={11} anchor="start">16004 = segmen 1: pergi ke R4 lewat jalur terpendek</T>
      <T x={30} y={318} cls="dg-note" size={11} anchor="start">16003 = segmen 2: pergi ke R3 lewat jalur terpendek</T>
    </Fig>
  )
}

/* 22.4 Tumpukan label pseudowire */
export function DgS4PwLabelStack() {
  return (
    <Fig title="Isi paket pseudowire: dua label, control word, frame pelanggan" sub="Ukuran tiap bagian ikut menentukan MTU minimal di core" w={860} h={240}>
      <Card x={20} y={30} w={190} h={110} lines={['Label luar', '(transport)', 'ke PE tujuan', 'diganti P']} tone="p" />
      <Card x={220} y={30} w={190} h={110} lines={['Label PW', '(S-bit = 1)', 'pilih PW di', 'PE tujuan']} tone="a" />
      <Card x={420} y={30} w={190} h={110} lines={['Control word', '(opsional,', '4 byte)']} tone="warn" />
      <Card x={620} y={30} w={220} h={110} lines={['Frame Ethernet pelanggan', '(tanpa preamble', 'dan FCS)']} tone="n" />
      <T x={115} y={166} cls="dg-sb">4 byte</T>
      <T x={315} y={166} cls="dg-sb">4 byte</T>
      <T x={515} y={166} cls="dg-sb">0 atau 4 byte</T>
      <path d="M20 182 H610" className="dg-lnk" />
      <T x={430} y={206} cls="dg-note" size={11}>Overhead MPLS: 8 sampai 12 byte di depan frame pelanggan, sebelum header Ethernet link core.</T>
    </Fig>
  )
}

/* 22.5 FIB datar vs hierarkis */
export function DgS4PicFib() {
  const pre = ['203.0.113.0/24', '198.51.100.0/24', '... 1 juta entri']
  return (
    <Fig title="FIB datar vs FIB hierarkis (PIC)" sub="Satu objek bersama membuat failover tidak bergantung pada jumlah prefiks" w={870} h={320}>
      <T x={215} y={26} cls="dg-cap-in">FIB datar (tanpa PIC)</T>
      <T x={650} y={26} cls="dg-cap-in">FIB hierarkis (PIC)</T>
      {pre.map((p, i) => (
        <g key={i}>
          <Box x={20} y={50 + i * 52} w={140} h={38} label={p} tone="n" fs={11} r={8} />
          <Arrow d={`M160 ${69 + i * 52} H190`} tone="n" />
          <Box x={190} y={50 + i * 52} w={230} h={38} label={i < 2 ? 'next-hop 192.0.2.1, Gi0/0/0/2, MAC aa:bb' : 'menyimpan info forwarding sendiri'} tone="p" fs={9.5} r={8} />
          <Box x={450} y={50 + i * 52} w={140} h={38} label={p} tone="n" fs={11} r={8} />
          <path d={`M590 ${69 + i * 52} H606`} className="dg-lnk" />
        </g>
      ))}
      <path d="M606 69 V173" className="dg-lnk" />
      <Arrow d="M606 121 H626" tone="p" />
      <Card x={626} y={76} w={150} h={90} lines={['path-list', 'primer 10.255.0.1', 'backup 10.255.0.2']} tone="a" />
      <Arrow d="M776 121 H794" tone="p" />
      <Box x={794} y={96} w={66} h={50} label="adjacency" tone="dark" fs={9.5} r={8} />
      <Box x={20} y={236} w={400} h={40} label="Upstream 192.0.2.1 mati: tulis ulang 1 juta entri" tone="no" fs={11.5} r={8} />
      <Box x={450} y={236} w={400} h={40} label="satu objek bersama, diubah SEKALI" tone="ok" fs={11.5} r={8} />
    </Fig>
  )
}

/* Lab 7: alur pemrosesan frame router */
export function DgS4LabRouterFlow() {
  const cx = 520
  const ipv4: { l: string; s?: string; o?: string[] }[] = [
    { l: 'checksum salah?', o: ['buang diam-diam'] },
    { l: 'tujuan = IP saya?', o: ['ya: echo request -> echo reply', 'UDP/TCP: ICMP 3/3'] },
    { l: 'TTL <= 1?', o: ['ya: ICMP 11/0', '(time exceeded)'] },
    { l: 'LPM di trie', o: ['tidak ada: ICMP 3/0', '(net unreachable)'] },
    { l: 'TTL - 1', s: 'hitung ulang checksum' },
    { l: 'next hop', s: 'gateway rute, atau tujuan bila connected' },
    { l: 'MAC next hop di cache ARP?', o: ['ya: kirim frame'] },
  ]
  const y0 = 246
  const st = 54
  const last = y0 + ipv4.length * st
  return (
    <Fig title="Alur satu frame di router buatan sendiri" sub="Dari frame masuk sampai terkirim, dibuang, atau dijawab ICMP" w={870} h={last + 80}>
      <Box x={230} y={14} w={200} h={34} label="frame masuk" tone="dark" r={8} />
      <Arrow d="M330 48 V68" tone="n" />
      <Box x={200} y={68} w={260} h={40} label="MAC tujuan = saya / broadcast?" tone="p" fs={11.5} r={8} />
      <Arrow d="M460 88 H500" tone="no" />
      <Box x={500} y={70} w={130} h={36} label="tidak: buang" tone="no" fs={11.5} r={8} />
      <path d="M330 108 V150 M150 150 H520" className="dg-lnk" />
      <Arrow d="M150 150 V190" tone="n" />
      <Arrow d={`M${cx} 150 V190`} tone="n" />

      <Box x={20} y={190} w={260} h={36} label="ARP" tone="a" r={8} />
      <path d="M150 226 V238 H8 V337" className="dg-lnk" />
      <Arrow d="M8 275 H20" tone="n" />
      <Arrow d="M8 337 H20" tone="n" />
      <Box x={20} y={252} w={260} h={46} label="request untuk saya?" sub="reply, pelajari" tone="n" fs={11.5} r={8} />
      <Box x={20} y={314} w={260} h={46} label="reply" sub="pelajari, kirim antrean" tone="n" fs={11.5} r={8} />

      <Box x={400} y={190} w={240} h={36} label="IPv4" tone="a" r={8} />
      {ipv4.map((r, i) => {
        const y = y0 + i * st
        const prevEnd = i === 0 ? 226 : y - st + (ipv4[i - 1].s ? 42 : 36)
        return (
          <g key={i}>
            <Arrow d={`M${cx} ${prevEnd} V${y}`} tone="n" />
            <Box x={400} y={y} w={240} h={r.s ? 42 : 36} label={r.l} sub={r.s} tone="p" fs={11.5} r={8} />
            {r.o && <>
              <Arrow d={`M640 ${y + 18} H672`} tone="no" />
              <Card x={672} y={y - 4} w={190} h={r.o.length > 1 ? 46 : 36} lines={r.o} tone="n" fs={11} />
            </>}
          </g>
        )
      })}
      <Arrow d={`M${cx} ${last - st + 36} V${last}`} tone="warn" />
      <Card x={340} y={last} w={520} h={50} lines={['tidak: antrekan paket, kirim ARP request (sekali)', 'ulangi tiap 1 s; setelah 3 kali: ICMP 3/1 (host unreachable)']} tone="warn" fs={11.5} />
    </Fig>
  )
}

/* Lab 8: pipeline NetDevOps */
export function DgS4LabNetdevopsPipeline() {
  return (
    <Fig title="Pipeline NetDevOps: dari sumber kebenaran sampai telemetri" sub="Konfigurasi dirender, diuji, dideploy bertahap, lalu diamati" w={860} h={700}>
      <Box x={70} y={14} w={330} h={44} label="NetBox" sub="data inventaris & IPAM" tone="a" fs={12} />
      <Box x={460} y={14} w={330} h={44} label="policy/firewall.yml" sub="kebijakan di Git" tone="a" fs={12} />
      <path d="M235 58 V76 H430 M625 58 V76 H430" className="dg-lnk" />
      <Arrow d="M430 76 V96" tone="n" />
      <Box x={250} y={96} w={360} h={38} label="scripts/render.py (Jinja2)" tone="p" fs={12} r={8} />
      <Arrow d="M430 134 V158" tone="n" />
      <Box x={200} y={158} w={460} h={44} label="build/" sub="konfigurasi yang DIMAKSUD, di-commit ke Git" tone="n" fs={12} />
      <Arrow d="M430 202 V232" tone="n" />
      <T x={445} y={222} cls="dg-note" size={10.5} anchor="start">pull request</T>
      <Box x={110} y={232} w={640} h={54} label="CI" sub="lint, uji offline, render-check, uji Batfish (pytest + pybatfish)" tone="p" fs={12} />
      <Arrow d="M430 286 V324" tone="n" />
      <T x={445} y={312} cls="dg-note" size={10.5} anchor="start">merge ke main + persetujuan manusia</T>
      <Box x={110} y={324} w={520} h={54} label="scripts/deploy.py (Nornir)" sub="pre-check, canary, post-check, sisanya" tone="p" fs={12} />
      <Arrow d="M630 351 H690" tone="warn" label="regresi?" lx={660} ly={341} />
      <Box x={690} y={331} w={150} h={40} label="rollback otomatis" tone="warn" fs={11} r={8} />
      <Arrow d="M370 378 V412" tone="n" />
      <Box x={110} y={412} w={520} h={46} label="containerlab" sub="4 router FRR + 2 switch SR Linux + 3 host" tone="dark" fs={12} />

      <Arrow d="M200 458 V510" tone="a" />
      <T x={212} y={488} cls="dg-note" size={10.5} anchor="start">gNMI (push, 5 detik)</T>
      <Arrow d="M540 458 V510" tone="a" />
      <T x={552} y={488} cls="dg-note" size={10.5} anchor="start">SNMP (poll, 30 detik)</T>
      <Box x={130} y={510} w={140} h={38} label="gnmic" tone="n" fs={12} r={8} />
      <Box x={450} y={510} w={180} h={38} label="snmp_exporter" tone="n" fs={12} r={8} />
      <path d="M200 548 V570 H370 M540 548 V570 H370" className="dg-lnk" />
      <Arrow d="M370 570 V590" tone="a" />
      <Box x={290} y={590} w={160} h={38} label="Prometheus" tone="a" fs={12} r={8} />
      <Arrow d="M370 628 V648" tone="n" />
      <Box x={290} y={648} w={160} h={38} label="Grafana" tone="ok" fs={12} r={8} />
    </Fig>
  )
}
