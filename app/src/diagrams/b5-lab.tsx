import { Fig, Box, Arrow, T, Device } from './primitives'

/* Topologi lab standar (Lab 00 bagian 4) */
export function DgL5TopologiLabStandar() {
  return (
    <Fig title="Topologi lab standar: 2 router, 2 switch, 4 PC" sub="Siapkan sekali, pakai berulang di banyak lab" w={820} h={370}>
      <path d="M280 55 H540" className="dg-lnk" />
      <path d="M260 75 V140" className="dg-lnk" /><path d="M560 75 V140" className="dg-lnk" />
      <path d="M245 172 L180 250" className="dg-lnk" /><path d="M275 172 L340 250" className="dg-lnk" />
      <path d="M545 172 L480 250" className="dg-lnk" /><path d="M575 172 L640 250" className="dg-lnk" />
      <Device cx={260} cy={55} kind="router" /><T x={260} y={92} cls="dg-sb">R1</T>
      <Device cx={560} cy={55} kind="router" /><T x={560} y={92} cls="dg-sb">R2</T>
      <Device cx={260} cy={160} kind="switch" /><T x={260} y={190} cls="dg-sb">SW1</T>
      <Device cx={560} cy={160} kind="switch" /><T x={560} y={190} cls="dg-sb">SW2</T>
      <Device cx={180} cy={265} kind="pc" label="PC1" />
      <Device cx={340} cy={265} kind="pc" label="PC2" />
      <Device cx={480} cy={265} kind="pc" label="PC3" />
      <Device cx={640} cy={265} kind="pc" label="PC4" />
      <T x={150} y={316} anchor="start" cls="dg-note" size={11}>R1, R2: router (routing, OSPF, static, NAT)</T>
      <T x={150} y={332} anchor="start" cls="dg-note" size={11}>SW1, SW2: switch (VLAN, trunk, STP)</T>
      <T x={150} y={348} anchor="start" cls="dg-note" size={11}>PC1-4: host (uji konektivitas, DHCP, ping)</T>
    </Fig>
  )
}

/* Lab 2.1: rantai tiga router */
export function DgL5RoutingRantai() {
  return (
    <Fig title="Lab 2.1: R1, R2, R3 dalam rantai dengan static route" sub="Rute harus dua arah: tanpa rute balik, ping gagal separuh jalan" w={820} h={250}>
      <path d="M140 105 H190" className="dg-lnk" /><path d="M230 105 H380" className="dg-lnk" />
      <path d="M420 105 H570" className="dg-lnk" /><path d="M610 105 H680" className="dg-lnk" />
      <Box x={15} y={75} w={125} h={60} label="LAN A" sub="10.0.1.0/24" tone="n" />
      <Box x={680} y={75} w={125} h={60} label="LAN C" sub="10.0.3.0/24" tone="n" />
      <Device cx={210} cy={105} kind="router" label="R1" />
      <Device cx={400} cy={105} kind="router" label="R2" />
      <Device cx={590} cy={105} kind="router" label="R3" />
      <T x={305} y={95} cls="dg-note" size={10}>10.0.12.0/30</T>
      <T x={495} y={95} cls="dg-note" size={10}>10.0.23.0/30</T>
      <Arrow d="M225 82 C260 45 350 45 385 82" tone="a" dash label="default route" lx={305} ly={40} />
      <T x={210} y={172} cls="dg-note" size={10}>10.0.3.0/24 via 10.0.12.2</T>
      <T x={210} y={188} cls="dg-note" size={10}>0.0.0.0/0 via 10.0.12.2</T>
      <T x={400} y={172} cls="dg-note" size={10}>10.0.1.0/24 via 10.0.12.1</T>
      <T x={400} y={188} cls="dg-note" size={10}>10.0.3.0/24 via 10.0.23.3</T>
      <T x={590} y={172} cls="dg-note" size={10}>10.0.1.0/24 via 10.0.23.2</T>
      <T x={410} y={228} cls="dg-note" size={11}>Verifikasi: show ip route dan traceroute (jalur R1, R2, R3)</T>
    </Fig>
  )
}

/* Lab 2.3: router-on-a-stick */
export function DgL5RouterOnAStick() {
  return (
    <Fig title="Lab 2.3: router-on-a-stick, satu trunk dua subinterface" sub="Link switch ke router harus trunk" w={820} h={350}>
      <path d="M410 82 V148" className="dg-lnk" />
      <path d="M390 172 L250 255" className="dg-lnk v10" />
      <path d="M430 172 L570 255" className="dg-lnk v20" />
      <Device cx={410} cy={60} kind="router" /><T x={380} y={64} anchor="end" cls="dg-sb">R1</T>
      <T x={470} y={48} anchor="start" cls="dg-note" size={11}>gi0/0.10  dot1Q 10  10.0.10.1/24</T>
      <T x={470} y={68} anchor="start" cls="dg-note" size={11}>gi0/0.20  dot1Q 20  10.0.20.1/24</T>
      <T x={424} y={118} anchor="start" cls="dg-note" size={11}>trunk (gi0/0)</T>
      <Device cx={410} cy={160} kind="switch" /><T x={376} y={164} anchor="end" cls="dg-sb">SW</T>
      <Device cx={240} cy={270} kind="pc" label="PC VLAN 10" />
      <Device cx={580} cy={270} kind="pc" label="PC VLAN 20" />
      <T x={240} y={322} cls="dg-note" size={11}>gateway 10.0.10.1</T>
      <T x={580} y={322} cls="dg-note" size={11}>gateway 10.0.20.1</T>
    </Fig>
  )
}

/* Lab 3.3: NAT/PAT */
export function DgL5NatPatLab() {
  return (
    <Fig title="Lab 3.3: PAT dari LAN privat ke internet" sub="Banyak host privat berbagi satu IP publik, dibedakan port sumber" w={820} h={270}>
      <path d="M190 117 H310" className="dg-lnk v10" />
      <path d="M350 117 H560" className="dg-lnk v20" />
      <Box x={20} y={85} w={170} h={64} label="LAN privat" sub="192.168.1.0/24" tone="n" />
      <Device cx={330} cy={117} kind="router" label="R1 (NAT)" />
      <Device cx={580} cy={117} kind="router" />
      <T x={580} y={160} cls="dg-sb">R2</T>
      <T x={580} y={178} cls="dg-note" size={10}>internet, IP publik simulasi</T>
      <T x={250} y={104} cls="dg-note" size={10}>gi0/0</T>
      <T x={250} y={140} cls="dg-note" size={10}>ip nat inside</T>
      <T x={455} y={104} cls="dg-note" size={10}>gi0/1</T>
      <T x={455} y={140} cls="dg-note" size={10}>ip nat outside</T>
      <T x={330} y={200} cls="dg-note" size={10}>access-list 1 permit 192.168.1.0 0.0.0.255</T>
      <T x={330} y={216} cls="dg-note" size={10}>ip nat inside source list 1 interface gi0/1 overload</T>
      <T x={410} y={254} cls="dg-note" size={11}>Verifikasi: show ip nat translations (inside local ke inside global:port)</T>
    </Fig>
  )
}

/* Lab 4.2 + 4.3: DHCP snooping dan DAI */
export function DgL5SnoopingDai() {
  return (
    <Fig title="Lab 4.2 dan 4.3: DHCP snooping dan DAI pada VLAN 10" sub="Hanya port trusted yang boleh mengirim reply DHCP" w={820} h={330}>
      <path d="M165 150 H386" className="dg-lnk fwd" />
      <path d="M432 140 L685 70" className="dg-lnk blk" />
      <path d="M432 162 L685 235" className="dg-lnk v10" />
      <Device cx={140} cy={150} kind="server" label="DHCP server sah" />
      <Device cx={410} cy={150} kind="switch" /><T x={410} y={190} cls="dg-sb">SW</T>
      <Device cx={710} cy={60} kind="server" label="Rogue DHCP" />
      <Device cx={710} cy={245} kind="pc" label="PC" />
      <T x={275} y={134} cls="dg-note" size={10}>gi0/1</T>
      <T x={275} y={170} cls="dg-note" size={10}>ip dhcp snooping trust</T>
      <T x={520} y={92} cls="dg-note" size={10}>untrusted</T>
      <T x={520} y={106} cls="dg-note" size={10}>OFFER/ACK diblokir</T>
      <T x={555} y={218} cls="dg-note" size={10}>untrusted (default)</T>
      <T x={410} y={280} cls="dg-note" size={11}>ip dhcp snooping, ip dhcp snooping vlan 10</T>
      <T x={410} y={300} cls="dg-note" size={11}>DAI: ip arp inspection vlan 10; gi0/1: ip arp inspection trust</T>
    </Fig>
  )
}

/* Lab 5.2: namespaces */
export function DgL5NamespaceRouting() {
  const nodeLabel = (cx: number, n: string) => <T x={cx} y={134} cls="dg-sb">{n}</T>
  return (
    <Fig title="Lab 5.2: dua router dan dua host hanya dengan network namespaces" sub="Pasangan veth menghubungkan namespace, ip_forward=1 menjadikan r1 dan r2 router" w={820} h={275}>
      <path d="M95 100 H250" className="dg-lnk" />
      <path d="M300 100 H520" className="dg-lnk" />
      <path d="M570 100 H725" className="dg-lnk" />
      <Device cx={70} cy={100} kind="pc" />{nodeLabel(70, 'h1')}
      <Device cx={275} cy={100} kind="router" />{nodeLabel(275, 'r1')}
      <Device cx={545} cy={100} kind="router" />{nodeLabel(545, 'r2')}
      <Device cx={750} cy={100} kind="pc" />{nodeLabel(750, 'h2')}
      <T x={98} y={88} anchor="start" cls="dg-note" size={10}>h1r1</T><T x={98} y={118} anchor="start" cls="dg-note" size={10}>10.0.1.2/24</T>
      <T x={247} y={88} anchor="end" cls="dg-note" size={10}>r1h1</T><T x={247} y={118} anchor="end" cls="dg-note" size={10}>10.0.1.1/24</T>
      <T x={303} y={88} anchor="start" cls="dg-note" size={10}>r1r2</T><T x={303} y={118} anchor="start" cls="dg-note" size={10}>10.0.12.1/24</T>
      <T x={517} y={88} anchor="end" cls="dg-note" size={10}>r2r1</T><T x={517} y={118} anchor="end" cls="dg-note" size={10}>10.0.12.2/24</T>
      <T x={573} y={88} anchor="start" cls="dg-note" size={10}>r2h2</T><T x={573} y={118} anchor="start" cls="dg-note" size={10}>10.0.2.1/24</T>
      <T x={722} y={88} anchor="end" cls="dg-note" size={10}>h2r2</T><T x={722} y={118} anchor="end" cls="dg-note" size={10}>10.0.2.2/24</T>
      <T x={70} y={178} cls="dg-note" size={10}>default via 10.0.1.1</T>
      <T x={275} y={178} cls="dg-note" size={10}>10.0.2.0/24 via 10.0.12.2</T>
      <T x={275} y={194} cls="dg-note" size={10}>net.ipv4.ip_forward=1</T>
      <T x={545} y={178} cls="dg-note" size={10}>10.0.1.0/24 via 10.0.12.1</T>
      <T x={545} y={194} cls="dg-note" size={10}>net.ipv4.ip_forward=1</T>
      <T x={750} y={178} cls="dg-note" size={10}>default via 10.0.2.1</T>
      <T x={410} y={245} cls="dg-note" size={11}>Uji: sudo ip netns exec h1 ping -c3 10.0.2.2</T>
    </Fig>
  )
}

/* Lab 6.2: bridge VLAN MikroTik */
export function DgL5MikrotikVlan() {
  return (
    <Fig title="Lab 6.2: bridge VLAN filtering pada MikroTik CHR" sub="Satu bridge, dua VLAN, gateway di interface VLAN" w={820} h={330}>
      <path d="M210 72 H250" className="dg-lnk v10" />
      <path d="M570 72 H610" className="dg-lnk v20" />
      <path d="M340 104 L240 205" className="dg-lnk v10" />
      <path d="M480 104 L580 205" className="dg-lnk v20" />
      <Box x={20} y={40} w={190} h={64} label="vlan10" sub="10.0.10.1/24 (gateway)" tone="p" />
      <Box x={250} y={40} w={320} h={64} label="bridge1" sub="vlan-filtering=yes (aktifkan terakhir)" tone="dark" />
      <Box x={610} y={40} w={190} h={64} label="vlan20" sub="10.0.20.1/24 (gateway)" tone="a" />
      <Device cx={225} cy={235} kind="pc" label="VLAN 10 (staff)" />
      <Device cx={595} cy={235} kind="pc" label="VLAN 20 (tamu)" />
      <T x={268} y={150} anchor="end" cls="dg-note" size={10}>ether3, pvid=10</T>
      <T x={268} y={166} anchor="end" cls="dg-note" size={10}>untagged</T>
      <T x={552} y={150} anchor="start" cls="dg-note" size={10}>ether4, pvid=20</T>
      <T x={552} y={166} anchor="start" cls="dg-note" size={10}>untagged</T>
      <T x={410} y={304} cls="dg-note" size={11}>Inter-VLAN diatur firewall forward (mis. tamu tidak boleh ke staff)</T>
    </Fig>
  )
}

/* Lab 6.7: WireGuard site-to-site */
export function DgL5MikrotikWireguard() {
  return (
    <Fig title="Lab 6.7: VPN site-to-site WireGuard antara dua CHR" sub="Tukar public-key, set allowed-address, tambah rute lewat tunnel" w={820} h={305}>
      <path d="M230 100 H590" className="dg-lnk v20" />
      <path d="M190 140 V160" className="dg-lnk" /><path d="M630 140 V160" className="dg-lnk" />
      <Device cx={190} cy={100} kind="router" label="CHR situs A" />
      <Device cx={630} cy={100} kind="router" label="CHR situs B" />
      <Box x={105} y={160} w={170} h={50} label="LAN A" sub="situs A" tone="n" />
      <Box x={545} y={160} w={170} h={50} label="LAN B" sub="192.168.20.0/24" tone="n" />
      <T x={236} y={88} anchor="start" cls="dg-note" size={10}>wg1 10.99.0.1/24</T>
      <T x={584} y={88} anchor="end" cls="dg-note" size={10}>wg1 10.99.0.2/24</T>
      <T x={410} y={118} cls="dg-note" size={10}>UDP 13231 (buka di firewall input)</T>
      <T x={410} y={248} cls="dg-note" size={11}>peer allowed-address: 10.99.0.2/32, 192.168.20.0/24</T>
      <T x={410} y={266} cls="dg-note" size={11}>ip route 192.168.20.0/24 via 10.99.0.2</T>
      <T x={410} y={284} cls="dg-note" size={11}>netwatch host=192.168.20.1 interval=10s, torch pada wg1</T>
    </Fig>
  )
}

/* Peta bobot domain: bar horizontal */
function Bobot({ rows, title, sub, foot, h }: {
  rows: { n: string; pct: number; tahap: string; hi?: boolean }[]
  title: string; sub: string; foot: string; h: number
}) {
  return (
    <Fig title={title} sub={sub} w={820} h={h}>
      {rows.map((r, i) => {
        const y = 24 + i * 46
        return (
          <g key={r.n}>
            <T x={20} y={y + 22} anchor="start" cls="dg-sb">{r.n}</T>
            <Box x={250} y={y} w={r.pct * 16} h={34} label={`${r.pct}%`} tone={r.hi ? 'a' : 'p'} fs={13} r={6} />
            <T x={250 + r.pct * 16 + 10} y={y + 21} anchor="start" cls="dg-note" size={10}>{r.tahap}</T>
          </g>
        )
      })}
      <T x={410} y={h - 16} cls="dg-note" size={11}>{foot}</T>
    </Fig>
  )
}

export function DgL5BobotCcna() {
  return (
    <Bobot title="Bobot enam domain CCNA 200-301 v1.1" sub="IP Connectivity (25%) adalah domain terbesar" h={330}
      foot="Durasi 120 menit, nilai lulus tidak dipublikasikan, berlaku 3 tahun. Diuji sampai 2 Februari 2027"
      rows={[
        { n: '1.0 Network Fundamentals', pct: 20, tahap: 'Tahap 0-5, 8, 10' },
        { n: '2.0 Network Access', pct: 20, tahap: 'Tahap 3, 10' },
        { n: '3.0 IP Connectivity', pct: 25, tahap: 'Tahap 4, 7', hi: true },
        { n: '4.0 IP Services', pct: 10, tahap: 'Tahap 6, 9, 11, 14' },
        { n: '5.0 Security Fundamentals', pct: 15, tahap: 'Tahap 9, 12, 10' },
        { n: '6.0 Automation & Programmability', pct: 10, tahap: 'Tahap 15, 16' },
      ]} />
  )
}

export function DgL5BobotNetworkplus() {
  return (
    <Bobot title="Bobot lima domain Network+ N10-009" sub="Troubleshooting (24%) adalah domain terbesar, Security yang terkecil" h={300}
      foot="Durasi 90 menit, maks 90 soal, passing 720/900, vendor-netral"
      rows={[
        { n: '1.0 Networking Concepts', pct: 23, tahap: 'Tahap 0-6, 8' },
        { n: '2.0 Network Implementation', pct: 20, tahap: 'Tahap 3, 7, 10' },
        { n: '3.0 Network Operations', pct: 19, tahap: 'Tahap 14, 17' },
        { n: '4.0 Network Security', pct: 14, tahap: 'Tahap 12, 9' },
        { n: '5.0 Network Troubleshooting', pct: 24, tahap: 'Tahap 14', hi: true },
      ]} />
  )
}
