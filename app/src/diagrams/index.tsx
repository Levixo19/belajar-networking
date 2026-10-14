import type { FC } from 'react'
import * as D from './dasar'
import * as L23 from './l2l3'
import * as L47 from './l4l7'
import * as A from './lanjut'
import * as L5 from './b5-lab'
import * as S4 from './b4-sp'
import * as D3 from './b3-dc'
import * as K2 from './b2-keamanan'
import * as R1 from './b1-routing'

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

  // b1-routing.tsx (Fase 5c)
  'r1-leher-sempit': R1.DgR1LeherSempit,
  'r1-etherchannel-aliran': R1.DgR1EtherchannelAliran,
  'r1-ppp-lapisan': R1.DgR1PppLapisan,
  'r1-udp-header': R1.DgR1UdpHeader,
  'r1-static-arp-multiaccess': R1.DgR1StaticArpMultiaccess,
  'r1-graf-routing': R1.DgR1GrafRouting,
  'r1-rip-hop-count': R1.DgR1RipHopCount,
  'r1-eigrp-successor': R1.DgR1EigrpSuccessor,
  'r1-redistribusi-loop': R1.DgR1RedistribusiLoop,
  'r1-fhrp-virtual-ip': R1.DgR1FhrpVirtualIp,
  'r1-multicast-model': R1.DgR1MulticastModel,
  'r1-isis-level': R1.DgR1IsisLevel,
  'r1-peering-model': R1.DgR1PeeringModel,
  'r1-ndp-resolusi': R1.DgR1NdpResolusi,
  'r1-464xlat': R1.DgR1Xlat464,

  // b2-keamanan.tsx (Fase 5c)
  'k2-wpa2-4way': K2.DgK2Wpa2Handshake,
  'k2-kapasitas-ap': K2.DgK2KapasitasAp,
  'k2-mef-layanan': K2.DgK2MefLayanan,
  'k2-policing-shaping': K2.DgK2PolicingShaping,
  'k2-defense-depth': K2.DgK2DefenseDepth,
  'k2-arp-spoofing': K2.DgK2ArpSpoofing,
  'k2-dns-amplification': K2.DgK2DnsAmplification,
  'k2-faktor-auth': K2.DgK2FaktorAuth,
  'k2-zero-trust': K2.DgK2ZeroTrust,
  'k2-wireshark-filter': K2.DgK2WiresharkFilter,
  'k2-docker-net': K2.DgK2DockerNet,
  'k2-netfilter': K2.DgK2Netfilter,
  'k2-linux-router': K2.DgK2LinuxRouter,
  'k2-pola-kasus': K2.DgK2PolaKasus,
  'k2-sdn-controller': K2.DgK2SdnController,

  // b3-dc.tsx (Fase 5c)
  'd3-netconf-txn': D3.DgNetconfTxn,
  'd3-python-stack': D3.DgPythonStack,
  'd3-cicd-pipeline': D3.DgCicdPipeline,
  'd3-vxlan-evpn': D3.DgVxlanEvpn,
  'd3-san-nas': D3.DgSanNas,
  'd3-vpc': D3.DgVpc,
  'd3-k8s-ingress': D3.DgK8sIngress,
  'd3-sdn-compare': D3.DgSdnCompare,
  'd3-tiga-tier': D3.DgTigaTier,
  'd3-defense': D3.DgDefense,
  'd3-ip-plan': D3.DgIpPlan,
  'd3-ppdioo': D3.DgPpdioo,
  'd3-cert-pilih': D3.DgCertPilih,
  'd3-mikrotik-jalur': D3.DgMikrotikJalur,
  'd3-karier-jalur': D3.DgKarierJalur,

  // b4-sp.tsx (Fase 5c)
  's4-qos-htb-tree': S4.DgS4QosHtbTree,
  's4-wireless-ptp-ptmp': S4.DgS4WirelessPtpPtmp,
  's4-ipsec-nat-urutan': S4.DgS4IpsecNatUrutan,
  's4-script-kosakata': S4.DgS4ScriptKosakata,
  's4-routeros-rib-fib': S4.DgS4RouterosRibFib,
  's4-backbone-isp-kecil': S4.DgS4BackboneIspKecil,
  's4-radius-arsitektur': S4.DgS4RadiusArsitektur,
  's4-crs-switch-chip': S4.DgS4CrsSwitchChip,
  's4-mpls-label-entry': S4.DgS4MplsLabelEntry,
  's4-mpls-label-path': S4.DgS4MplsLabelPath,
  's4-l3vpn-label-stack': S4.DgS4L3vpnLabelStack,
  's4-l3vpn-hub-spoke': S4.DgS4L3vpnHubSpoke,
  's4-sr-label-stack': S4.DgS4SrLabelStack,
  's4-pw-label-stack': S4.DgS4PwLabelStack,
  's4-pic-fib': S4.DgS4PicFib,
  's4-lab-router-flow': S4.DgS4LabRouterFlow,
  's4-lab-netdevops-pipeline': S4.DgS4LabNetdevopsPipeline,

  // b5-lab.tsx (Fase 5c)
  'l5-topologi-lab-standar': L5.DgL5TopologiLabStandar,
  'l5-routing-rantai': L5.DgL5RoutingRantai,
  'l5-router-on-a-stick': L5.DgL5RouterOnAStick,
  'l5-nat-pat-lab': L5.DgL5NatPatLab,
  'l5-snooping-dai': L5.DgL5SnoopingDai,
  'l5-namespace-routing': L5.DgL5NamespaceRouting,
  'l5-mikrotik-vlan': L5.DgL5MikrotikVlan,
  'l5-mikrotik-wireguard': L5.DgL5MikrotikWireguard,
  'l5-bobot-ccna': L5.DgL5BobotCcna,
  'l5-bobot-networkplus': L5.DgL5BobotNetworkplus,
}

export function getDiagram(id: string): FC | null { return DIAGRAMS[id] || null }
export const DIAGRAM_IDS = Object.keys(DIAGRAMS)
