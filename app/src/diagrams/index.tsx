import type { FC } from 'react'
import * as D from './dasar'
import * as L23 from './l2l3'
import * as L47 from './l4l7'
import * as A from './lanjut'

/** Registri diagram — id dipakai di data/enrich.json */
export const DIAGRAMS: Record<string, FC> = {
  'jaringan-dasar': D.DgJaringan,
  'topologi': D.DgTopologi,
  'byte-bit': D.DgByte,
  'bandwidth-latency': D.DgBandwidthLatency,
  'encoding-sinyal': D.DgEncoding,
  'osi-stack': D.DgOsiStack,
  'osi-tcpip': D.DgOsiTcpip,
  'enkapsulasi': D.DgEnkapsulasi,
  'media-kabel': D.DgMedia,
  'pinout-rj45': D.DgPinout,
  'fiber-mode': D.DgFiberMode,
  'domain-tabrakan': D.DgDomain,

  'ethernet-frame': L23.DgEthernetFrame,
  'mac-table': L23.DgMacTable,
  'vlan-trunk': L23.DgVlanTrunk,
  'stp': L23.DgStp,
  'ipv4-anatomi': L23.DgIpv4Anatomy,
  'subnet-split': L23.DgSubnetSplit,
  'arp': L23.DgArp,
  'routing-lookup': L23.DgRoutingLookup,
  'dhcp-dora': L23.DgDhcp,
  'nat-pat': L23.DgNat,
  'ttl-traceroute': L23.DgTtl,

  'tcp-udp-header': L47.DgTcpUdpHeader,
  'tcp-handshake': L47.DgHandshake,
  'congestion': L47.DgCongestion,
  'socket-port': L47.DgSocket,
  'dns-rekursif': L47.DgDns,
  'http-flow': L47.DgHttp,
  'email-flow': L47.DgEmail,
  'tls-handshake': L47.DgTls,

  'ospf-area': A.DgOspfArea,
  'bgp-as': A.DgBgp,
  'administrative-distance': A.DgAdminDistance,
  'ipv6-anatomi': A.DgIpv6,
  'wifi-kanal': A.DgWifiChannels,
  'csma-ca': A.DgCsmaCa,
  'vpn-tunnel': A.DgVpnTunnel,
  'firewall-stateful': A.DgFirewall,
  'acl-urutan': A.DgAclOrder,
  'arsitektur-dc': A.DgArsitektur,
  'monitoring-tingkat': A.DgMonitoring,
}

export function getDiagram(id: string): FC | null { return DIAGRAMS[id] || null }
export const DIAGRAM_IDS = Object.keys(DIAGRAMS)
