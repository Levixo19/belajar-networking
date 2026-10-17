import type { FC } from 'react'
import SubnetCalculator from './SubnetCalculator'
import BaseConverter from './BaseConverter'
import OSIExplorer from './OSIExplorer'
import TcpHandshake from './TcpHandshake'
import PacketJourney from './PacketJourney'
import VlanLab from './VlanLab'
import PacketInspector from './PacketInspector'
import CliSim from './CliSim'
import Arecibo from './Arecibo'
import { IconBinary, IconGrid, IconLayers, IconRoute, IconZap, IconSearch, IconFlask, IconTerminal, IconBroadcast } from '../components/icons'

const CliIpDasar: FC = () => <CliSim scenario="ip-dasar" />
const CliVlan: FC = () => <CliSim scenario="vlan" />
const CliDiagnosa: FC = () => <CliSim scenario="diagnosa" />

export interface ToolDef { slug: string; name: string; desc: string; Icon: FC<any>; Comp: FC; related?: string }
export const TOOLS: ToolDef[] = [
  { slug: 'subnet', name: 'Kalkulator Subnet', desc: 'Hitung network, broadcast, host, mask + visualisasi biner network/host.', Icon: IconGrid, Comp: SubnetCalculator, related: '04-network-layer/02-subnetting' },
  { slug: 'biner', name: 'Konverter Biner', desc: 'Biner ↔ desimal ↔ hex interaktif dengan bobot bit yang bisa diklik.', Icon: IconBinary, Comp: BaseConverter, related: '00-fondasi/02-bit-byte-biner' },
  { slug: 'arecibo', name: 'Dekode pesan Arecibo', desc: 'Atur lebar baris sampai 1.679 bit dari teleskop Arecibo (1974) membentuk gambar. Framing dengan tangan.', Icon: IconBroadcast, Comp: Arecibo, related: '00-fondasi/02-bit-byte-biner' },
  { slug: 'osi', name: 'Penjelajah OSI', desc: 'Jelajahi 7 layer: fungsi, PDU, protokol, perangkat, contoh nyata.', Icon: IconLayers, Comp: OSIExplorer, related: '01-model-referensi/01-osi' },
  { slug: 'paket', name: 'Perjalanan Paket', desc: 'Animasi enkapsulasi & routing paket dari PC ke server lintas internet.', Icon: IconRoute, Comp: PacketJourney, related: '01-model-referensi/03-enkapsulasi' },
  { slug: 'tcp', name: 'Koneksi TCP', desc: 'Animasi 3-way handshake, transfer, dan teardown TCP langkah demi langkah.', Icon: IconZap, Comp: TcpHandshake, related: '05-transport/02-tcp' },
  { slug: 'packet-inspector', name: 'Pembedah Paket', desc: 'Hex dump frame nyata. Klik byte untuk tahu kolom apa itu dan gunanya.', Icon: IconSearch, Comp: PacketInspector, related: '01-model-referensi/03-enkapsulasi' },
  { slug: 'vlan-lab', name: 'Lab VLAN', desc: 'Atur VLAN tiap port, uji ping antar-PC, nyalakan inter-VLAN routing.', Icon: IconFlask, Comp: VlanLab, related: '03-data-link/03-vlan' },
  { slug: 'cli-ip', name: 'Terminal: konfigurasi IP', desc: 'Latih perintah Cisco, MikroTik, dan Linux untuk memberi IP ke interface.', Icon: IconTerminal, Comp: CliIpDasar, related: '04-network-layer/01-ipv4' },
  { slug: 'cli-vlan', name: 'Terminal: VLAN', desc: 'Buat VLAN dan access port di tiga platform berbeda.', Icon: IconTerminal, Comp: CliVlan, related: '03-data-link/03-vlan' },
  { slug: 'cli-diagnosa', name: 'Terminal: diagnosa', desc: 'Runtutan perintah troubleshooting dari layer 1 sampai layer 7.', Icon: IconTerminal, Comp: CliDiagnosa, related: '14-monitoring-troubleshooting/01-metodologi' },
]

const BY_SLUG: Record<string, FC> = Object.fromEntries(TOOLS.map(t => [t.slug, t.Comp]))
export function toolBySlug(slug: string): FC | null { return BY_SLUG[slug] || null }

const MODULE_TOOL: Record<string, FC> = {
  '00-fondasi/02-bit-byte-biner': BaseConverter,
  '01-model-referensi/01-osi': OSIExplorer,
  '01-model-referensi/03-enkapsulasi': PacketJourney,
  '04-network-layer/02-subnetting': SubnetCalculator,
  '04-network-layer/03-vlsm-cidr': SubnetCalculator,
  '05-transport/02-tcp': TcpHandshake,
}
export function toolForModule(id: string): FC | null { return MODULE_TOOL[id] || null }
