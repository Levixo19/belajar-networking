import type { FC } from 'react'
import { SubnetDrill, BinaryBlitz, OsiSorter, PortMatch, CidrFlash } from './games'
import { IconGrid, IconBinary, IconLayers, IconZap, IconRoute } from '../components/icons'

export interface GameDef { slug: string; name: string; desc: string; Icon: FC<any>; Comp: FC; related?: string }
export const GAMES: GameDef[] = [
  { slug: 'subnet-drill', name: 'Drill Subnet', desc: 'Network, broadcast, jumlah host, netmask. Lawan waktu.', Icon: IconGrid, Comp: SubnetDrill, related: '04-network-layer/02-subnetting' },
  { slug: 'biner-blitz', name: 'Biner Blitz', desc: 'Desimal ⇄ biner 8 bit sampai jadi refleks.', Icon: IconBinary, Comp: BinaryBlitz, related: '00-fondasi/02-bit-byte-biner' },
  { slug: 'osi-sorter', name: 'Urutkan OSI', desc: 'Susun tujuh layer dari Physical sampai Application.', Icon: IconLayers, Comp: OsiSorter, related: '01-model-referensi/01-osi' },
  { slug: 'port-match', name: 'Tebak Port', desc: 'Dua puluh port layanan yang wajib di luar kepala.', Icon: IconZap, Comp: PortMatch, related: '05-transport/01-port-socket' },
  { slug: 'cidr-flash', name: 'CIDR ⇄ Netmask', desc: 'Terjemahkan prefix ke netmask dan sebaliknya.', Icon: IconRoute, Comp: CidrFlash, related: '04-network-layer/03-vlsm-cidr' },
]
const BY_SLUG: Record<string, FC> = Object.fromEntries(GAMES.map(g => [g.slug, g.Comp]))
export function gameBySlug(slug: string): FC | null { return BY_SLUG[slug] || null }
