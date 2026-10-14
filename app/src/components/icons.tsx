// Ikon antarmuka: satu family (Phosphor), satu bobot. Nama ekspor dipertahankan
// supaya pemakai lama tidak perlu diubah; `stroke` diterima demi kompatibilitas.
import type { FC } from 'react'
import {
  HouseIcon, CardsIcon, WrenchIcon, MagnifyingGlassIcon, ListIcon, SunIcon, MoonIcon,
  CheckIcon, ArrowRightIcon, ArrowLeftIcon, CaretRightIcon, FlameIcon, ClockIcon,
  BookOpenIcon, StackIcon, LightningIcon, PathIcon, GridFourIcon, BinaryIcon, XIcon,
  ChartLineIcon, TerminalWindowIcon, FlaskIcon, TrophyIcon, BrainIcon, ArrowsOutIcon,
  PlusIcon, ArrowCounterClockwiseIcon, CircleHalfIcon, CompassIcon, CloudIcon,
  GlobeHemisphereWestIcon, PlantIcon, GraduationCapIcon, FlagCheckeredIcon, LinuxLogoIcon,
  RulerIcon, BooksIcon, PackageIcon, WifiHighIcon, PlugIcon, LinkIcon, MapTrifoldIcon,
  TruckIcon, IdentificationCardIcon, ShieldCheckIcon, BroadcastIcon, RobotIcon,
  BookOpenTextIcon, HardDrivesIcon, HashIcon, TargetIcon, UsersThreeIcon, GraphIcon, CertificateIcon, BriefcaseIcon, ShuffleIcon, SignpostIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'

type P = { size?: number; className?: string; stroke?: number }
const WEIGHT = 'regular' as const

const wrap = (C: PhosphorIcon): FC<P> => ({ size = 18, className = '' }) => (
  <C size={size} weight={WEIGHT} className={className} aria-hidden="true" />
)

export const IconHome = wrap(HouseIcon)
export const IconCards = wrap(CardsIcon)
export const IconTools = wrap(WrenchIcon)
export const IconSearch = wrap(MagnifyingGlassIcon)
export const IconMenu = wrap(ListIcon)
export const IconSun = wrap(SunIcon)
export const IconMoon = wrap(MoonIcon)
export const IconSystem = wrap(CircleHalfIcon)
export const IconCheck = wrap(CheckIcon)
export const IconArrowRight = wrap(ArrowRightIcon)
export const IconArrowLeft = wrap(ArrowLeftIcon)
export const IconChevron = wrap(CaretRightIcon)
export const IconFlame = wrap(FlameIcon)
export const IconClock = wrap(ClockIcon)
export const IconBook = wrap(BookOpenIcon)
export const IconLayers = wrap(StackIcon)
export const IconZap = wrap(LightningIcon)
export const IconRoute = wrap(PathIcon)
export const IconGrid = wrap(GridFourIcon)
export const IconBinary = wrap(BinaryIcon)
export const IconClose = wrap(XIcon)
export const IconChart = wrap(ChartLineIcon)
export const IconTerminal = wrap(TerminalWindowIcon)
export const IconFlask = wrap(FlaskIcon)
export const IconTrophy = wrap(TrophyIcon)
export const IconBrain = wrap(BrainIcon)
export const IconExpand = wrap(ArrowsOutIcon)
export const IconPlus = wrap(PlusIcon)
export const IconRetry = wrap(ArrowCounterClockwiseIcon)
export const IconTarget = wrap(TargetIcon)
export const IconUsers = wrap(UsersThreeIcon)
export const IconGraph = wrap(GraphIcon)
export const IconCertificate = wrap(CertificateIcon)
export const IconBriefcase = wrap(BriefcaseIcon)
export const IconShuffle = wrap(ShuffleIcon)

// Ikon per tahap kurikulum. Data konten masih membawa emoji; UI memakai peta ini.
const STAGE: Record<string, PhosphorIcon> = {
  'panduan': BookOpenTextIcon,
  '00-fondasi': PlantIcon,
  '01-model-referensi': CompassIcon,
  '02-layer-fisik': PlugIcon,
  '03-data-link': LinkIcon,
  '04-network-layer': PackageIcon,
  '05-transport': TruckIcon,
  '06-aplikasi': GlobeHemisphereWestIcon,
  '07-routing-lanjutan': MapTrifoldIcon,
  '08-ipv6': HashIcon,
  '09-nat-acl-firewall': IdentificationCardIcon,
  '10-wireless': WifiHighIcon,
  '11-wan-vpn': BroadcastIcon,
  '12-keamanan': ShieldCheckIcon,
  '13-linux-networking': LinuxLogoIcon,
  '14-monitoring-troubleshooting': MagnifyingGlassIcon,
  '15-otomasi': RobotIcon,
  '16-datacenter-cloud-sdn': CloudIcon,
  '17-desain-arsitektur': RulerIcon,
  '18-karier-sertifikasi': GraduationCapIcon,
  '19-mikrotik': HardDrivesIcon,
  '21-ekosistem-profesi': UsersThreeIcon,
  '22-service-provider': GraphIcon,
  '23-jalur-vendor': SignpostIcon,
  'lab': FlaskIcon,
  'referensi': BooksIcon,
  '20-proyek-akhir': FlagCheckeredIcon,
}

export function StageIcon({ id, size = 16, className = '' }: { id: string; size?: number; className?: string }) {
  const C = STAGE[id] ?? StackIcon
  return <C size={size} weight={WEIGHT} className={className} aria-hidden="true" />
}
