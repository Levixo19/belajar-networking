# Celah praktik industri: teknologi produksi modern (2026) yang hilang atau dangkal di kurikulum

Method note: coverage was checked by grepping all 129 module files under `/home/vi/Projects/networking/materi/` (paths below are relative to that folder). External facts were checked with curl against PeeringDB's API, the IETF datatracker and RFC Editor, the Kubernetes blog, Cloudflare's isbgpsafeyet.com, idnic.net, docs.cilium.io, ultraethernet.org, and GitHub repo metadata via `gh api` (all fetched 2026-10-13). WebSearch was unavailable. manrs.org returned a Cloudflare block, academy.apnic.net returned a JS challenge, and the APNIC/NIST RPKI dashboards render client-side, so none of those yielded numbers. Claims about what engineers "use daily" are inferences unless a source is given.

Overall pattern: the curriculum is unusually broad. Almost every 2026 buzzword appears somewhere, but most production topics get a paragraph, a table row or a one-line "tren" note, with no config, no lab and no operational procedure. The main problems are depth and missing labs, not missing vocabulary. The clear exceptions, where whole modules are missing, are service-provider core (MPLS/SR/IS-IS), internet interconnection/peering in Indonesia, and the Linux high-performance datapath.

## Q1 — Service provider and internet scale (MPLS, SR, TE, BGP at scale, internet architecture, DDoS)

### Takeaway
BGP (07.6) is the strongest SP-relevant module: route reflectors, communities, RPKI/ROV, MANRS, IRR/bgpq4. MPLS and Segment Routing are only one section of a WAN overview (11.1 §4). IS-IS, LDP operation, L2VPN/VPLS/EVPN-VPWS, RSVP-TE/SR-TE, TI-LFA/Flex-Algo, ASPA, BGP roles, BMP and BGP incident case studies are missing or appear only by name. Internet architecture (transit, peering, IXP) is about one subsection in 00.4.

### Cited Findings
**Curriculum coverage (grep evidence):**
- MPLS is taught in `11-wan-vpn/01-teknologi-wan.md` §4 (≈70 lines): label switching, an LDP row in a terms table, "layer 2,5" header, and MPLS L3VPN as VRF+RD+RT+MP-BGP. It also has a short "Segment Routing — penerus MPLS" subsection: "SR-MPLS dan SRv6 menghilangkan LDP/RSVP… (source routing)". There is no config, no lab and no label-forwarding walk-through on a real NOS. — `11-wan-vpn/01-teknologi-wan.md` lines 105–175, 396–397
- "VPLS" occurs in exactly 1 file. "RSVP-TE" occurs once. "TI-LFA", "LFA/Fast Reroute", "BGP-LS", "PCEP" and "Flex-Algo" occur 0 times. "Segment Routing/SR-MPLS/SRv6" appears only in 11.1. — grep across `materi/`
- IS-IS appears in comparison tables in `07-routing-lanjutan/02-konsep-routing-dinamis.md`, which even recommends "Service provider, backbone besar → IS-IS atau OSPF" (line 370). There is no IS-IS module, while RIP (07.3) and EIGRP (07.5) each have their own. — `07-routing-lanjutan/02-konsep-routing-dinamis.md`
- BGP 07.6 (784 lines) covers RR and confederation (§7), mandatory filtering and route-leak warnings, communities for inbound TE, RPKI/ROA/ROV with IOS-XE config, the MANRS four actions, and IRR plus bgpq4-generated prefix-lists. — `07-routing-lanjutan/06-bgp.md` lines 244–495
- The following are absent from the curriculum (0 hits): BMP (BGP Monitoring Protocol), Large Communities (RFC 8092), BGP graceful shutdown (RFC 8326), Add-Path, ASPA (0 hits for "ASPA" as a term), BGP Roles / RFC 9234, RFC 8212. "maxLength" appears only in a quiz answer. — grep across `materi/`
- DDoS: 12.3 gives conceptual RTBH (community 65535:666, /32 to upstream), notes Flowspec "kalau ISP mendukung", scrubbing, and anycast as dispersion. It makes the correct operational point that volumetric attacks must be mitigated upstream. There is no Flowspec rule anatomy, no flow-based detection tooling and no lab. — `12-keamanan/03-serangan-l3-l7.md` lines 233–254, 491–493
- Internet architecture: Tier 1/2/3 table, transit vs peering, a one-paragraph IXP definition, "Indonesia: IIX (Jakarta), OpenIXP, JKT-IX, IXP daerah", and RIR → NIR (IDNIC under APJII). PeeringDB appears once, inside the MANRS "coordination" bullet. — `00-fondasi/04-sejarah-dan-standar.md` lines 107–113, 224–237; `07-routing-lanjutan/06-bgp.md` line 476

**External state of the art (verified 2026-10-13):**
- SRv6 is mature at the standards level: SRv6 Network Programming is RFC 8986 (Feb 2021) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc8986.json); BGP overlay services over SRv6 is RFC 9252 (Jul 2022) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc9252.json); compressed SRv6 SIDs (uSID/CSID) is RFC 9800 (Jun 2025) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc9800.json), [datatracker](https://datatracker.ietf.org/doc/draft-ietf-spring-srv6-srh-compression/); IGP Flexible Algorithm is RFC 9350 (Feb 2023) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc9350.json).
- ASPA is still not an RFC as of Oct 2026. draft-ietf-sidrops-aspa-verification is at rev -28 and draft-ietf-sidrops-aspa-profile at rev -29, both in state "WG Consensus: Waiting for Write-Up". — [IETF datatracker API](https://datatracker.ietf.org/doc/draft-ietf-sidrops-aspa-verification/)
- Published BGP-hygiene standards that a 2026 course should teach: RFC 9234 BGP Roles / route-leak prevention (May 2022) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc9234.json); RFC 8212 default eBGP deny without policy (Jul 2017) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc8212.json); RFC 9319 BCP on avoiding maxLength in ROAs (Oct 2022) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc9319.json); RFC 9582 ROA profile (May 2024) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc9582.json); RFC 9774 deprecating AS_SET/AS_CONFED_SET (May 2025) — [RFC Editor](https://www.rfc-editor.org/rfc/rfc9774.json).
- ROV keeps spreading among Tier-1s. Cloudflare's tracker logs "February 3, 2026 – Sparkle (AS6762), a global Tier-1 transit provider, now rejects RPKI-invalid prefixes" and still answers "Is BGP safe yet? No." — [isbgpsafeyet.com](https://isbgpsafeyet.com/)
- The open-source routing-security toolchain is actively maintained: Routinator (RPKI validator/RTR, last push 2026-09-17), rpki-client-portable (2026-10-13), bgpq4 (2026-03-16), FRR (2026-10-12), pmacct with BGP/BMP/RPKI/streaming-telemetry support (2026-10-12). — `gh api repos/...` ([routinator](https://github.com/NLnetLabs/routinator), [rpki-client-portable](https://github.com/rpki-client/rpki-client-portable), [bgpq4](https://github.com/bgp/bgpq4), [frr](https://github.com/FRRouting/frr), [pmacct](https://github.com/pmacct/pmacct))

### Inferences
- MPLS/SR is a whole-module gap. At ISPs and carriers the backbone is MPLS (LDP or SR) over IS-IS, carrying L3VPN, L2VPN and EVPN services. A learner who finishes this curriculum can explain MPLS L3VPN to a customer but cannot run or troubleshoot a PE. That is where the senior-vs-junior split shows in Indonesian carrier jobs.
- IS-IS is the most notable single protocol omission. RIP and EIGRP get full modules even though senior SP and hyperscaler engineers rarely touch them, while IS-IS, the default SP/DC IGP, gets none.
- BGP security is a section-level depth problem and cheap to fix. 07.6 already has the right frame, but it presents RPKI as Cisco-only config and stops at ROV. Adding ASPA (marked as draft), RFC 9234 roles, RFC 8212, the RFC 9319 maxLength guidance, a validator (Routinator/rpki-client) with RTR to FRR/MikroTik, and two or three incident case studies (route leaks and hijacks) would bring it to 2026 practice.
- The curriculum's claim that "mayoritas rute IPv4… tercakup ROA" and that "sebagian besar backbone… sudah ROV" (07.6 line 458) is plausible but could not be checked numerically this session. The writer should flag it for a dated citation (NIST RPKI Monitor / APNIC ROV stats).
- DDoS is a depth plus lab problem. Concepts are correct. Missing are detection (NetFlow/sFlow → FastNetMon/pmacct style thresholds), Flowspec rule anatomy and its risks, RTBH with the RFC 7999 BLACKHOLE community in a lab, and how Indonesian IXPs/upstreams offer blackholing. This was not verified per IXP.

### Gaps
- I could not confirm which Indonesian carriers run SR-MPLS vs LDP or SRv6. No public source was fetched, so carrier-specific claims must not be made.
- No authoritative live ROA/ROV percentage for Indonesia or globally could be extracted: APNIC and NIST dashboards are JS-rendered and manrs.org blocked the fetch.
- Whether RFC 7999 is cited anywhere in `materi/` was not separately grepped; only the 65535:666 value was seen in 12.3.

## Q2 — Modern enterprise and campus (SD-WAN, SASE/SSE/ZTNA, Wi-Fi 6E/7, WPA3, NAC at scale, IPv6-only)

### Takeaway
This domain is the best covered of the six. SD-WAN, SASE/SSE/ZTNA, Wi-Fi 6E/7 (MLO, 320 MHz) and WPA3 all have real sections. The gaps are operational depth: NAC at scale (MAB, CoA and posture each appear about once), IPv6-mostly (RFC 8925 / PREF64 absent), Passpoint/OpenRoaming (absent), and no hands-on SD-WAN or ZTNA lab.

### Cited Findings
- SD-WAN appears in 16 files. The core section in 11.1 explains overlay over any transport, application-aware routing, local internet breakout vs MPLS "tromboning", and licensing cost. — `11-wan-vpn/01-teknologi-wan.md` lines 186–235
- SASE/SSE gets a dedicated section in 12.5 (§6, ≈50 lines), alongside a Zero Trust Architecture section (§4) and micro-segmentation (§5). ZTNA appears in 7 files. — `12-keamanan/05-hardening-zero-trust.md` lines 311–505
- Wi-Fi 6E/7 is current: the generation table lists 802.11be/Wi-Fi 7 (2024, 2.4+5+6 GHz, 46 Gbps, MLO, 320 MHz, 4096-QAM, multi-RU) with a dedicated "MLO — mengapa penting" subsection, and there is even a Wi-Fi 8 (802.11bn) outlook. WPA3 appears in 13 files. — `10-wireless/02-802-11.md` lines 19–20, 336–346
- "Passpoint" and "OpenRoaming" have 0 hits. — grep across `materi/`
- NAC: 802.1X is covered in 10.3, 12.2 and 12.4, and ISE/ClearPass/PacketFence names appear in 4 files. But "MAB" appears in only 1 file (`12-keamanan/02-serangan-l2.md`) and "CoA/Change of Authorization" in only 1 file (`12-keamanan/04-aaa-identitas.md`). — grep across `materi/`
- IPv6 transition: 08.3 has NAT64+DNS64 with 64:ff9b::/96, limitations, 464XLAT/CLAT and DS-Lite. "IPv6-only" appears 16 times in that one file. "PREF64"/RFC 8781 and "IPv6-mostly"/"option 108" have 0 hits. — `08-ipv6/03-routing-transisi-ipv6.md` lines 178–256
- RFC 8925 "IPv6-Only Preferred Option for DHCPv4" (Oct 2020, Proposed Standard) is the standard behind IPv6-mostly networks. — [RFC Editor](https://www.rfc-editor.org/rfc/rfc8925.json)

### Inferences
- SD-WAN and SASE are adequate for awareness. To make graduates stand out, add one vendor-neutral lab: an SD-WAN-like overlay with WireGuard plus BGP/BFD path selection on FRR or MikroTik, and a ZTNA demo with an identity-aware proxy. The concepts already exist (11.1, 12.5, 19.6), so this is a lab gap, not a content gap.
- NAC at scale is a depth problem in 12.4. Enterprise NAC work is mostly MAB fallback for IoT/printers, dynamic VLAN/dACL via RADIUS attributes, CoA for re-auth/quarantine, profiling, and certificate onboarding (EAP-TLS). The curriculum mentions these once each, with no flow. A FreeRADIUS (already in 13.4) + PacketFence lab would close it cheaply.
- IPv6-only needs a missing section in 08.3: "IPv6-mostly" (RFC 8925 option 108 + PREF64 RA option + CLAT on endpoints). This is how large enterprises and conference networks deploy IPv6-only in 2026. The rest of 08.3 is already solid.
- Wi-Fi depth is good. Passpoint/OpenRoaming and 6 GHz AFC/regulatory status in Indonesia would be niche additions to 10.4, but low priority.

### Gaps
- I could not verify Indonesia's current 6 GHz (Wi-Fi 6E/7) spectrum regulation status. No Komdigi source was fetched. The writer should not assert whether 6 GHz is licensed-exempt in Indonesia without a source.
- No current Indonesian IPv6 adoption percentage was retrieved (APNIC IPv6 stats page is JS-rendered).

## Q3 — Programmability and operations (telemetry, YANG/NETCONF/RESTCONF, SoT, Nornir/NAPALM/pyATS/Batfish, GitOps/CI, containerlab/digital twins)

### Takeaway
Concept coverage is good: NETCONF, RESTCONF, YANG, OpenConfig and gNMI (with gnmic examples) in 15.2; Nornir, NAPALM, pyATS and Scrapli in 15.3; NetBox, Batfish and a GitLab CI pipeline with containerlab in 15.4. Labs lag far behind. lab/05 has only Python backup plus Ansible. No lab builds a telemetry pipeline, a NetBox-driven config generation, a Batfish test or a containerlab topology. Flow-analytics tooling, BMP, SuzieQ and "digital twin" thinking are missing.

### Cited Findings
- 15.2 has dedicated sections for NETCONF (§4), RESTCONF (§5), YANG (§6) and "gNMI dan Streaming Telemetry" (§7), including `gnmic ... --stream-mode sample --sample-interval 10s` and a quiz explaining on-change vs sample and push vs pull. — `15-otomasi/02-data-dan-api.md` lines 231–415, 512–513
- 14.3 has a "Streaming Telemetry — Pengganti Modern" section (SNMP vs gNMI table) and a NetFlow/IPFIX/sFlow section. sFlow appears only in 14.3. — `14-monitoring-troubleshooting/03-observability.md` lines 87–92
- 15.4 has "NetBox — Source of Truth" (intent vs implementation, Ansible dynamic inventory, drift audit) and names Nautobot as "fork NetBox dengan fokus otomasi tambahan". It also has a CI/CD pipeline with "VALIDATE (Batfish, dry-run)", a GitLab CI example running `containerlab deploy -t lab.clab.yaml`, and a manual approval gate. — `15-otomasi/04-ansible-cicd.md` lines 235–286, 342–428
- Lab coverage: lab/05 contains 5.1–5.4 Linux labs, 5.5 Python config backup and 5.6 Ansible playbook. There is no NetBox, Batfish, containerlab, gNMI or Nornir lab. containerlab is mentioned in only 4 files (15.4, lab/00, 13.2, sumber-belajar). — curriculum outline and grep
- 0 hits for: BMP, SuzieQ, Akvorado, pmacct, Kentik, "digital twin". netlab has 2 hits. — grep across `materi/`
- Tooling is current and active as of Oct 2026: containerlab v0.81.0 (released 2026-10-11, 2,878★); netlab (pushed 2026-10-11); Batfish (pushed 2026-10-12); NetBox v4.7.2 (2026-09-29, 21,683★); Nautobot (pushed 2026-10-13); Nornir (2026-10-10); NAPALM (2026-08-12); gnmic (2026-09-28); openconfig/kne (2026-10-12); SuzieQ (2026-08-29); Akvorado flow collector (2026-10-12, 2,380★). — GitHub API: [containerlab](https://github.com/srl-labs/containerlab), [netlab](https://github.com/ipspace/netlab), [batfish](https://github.com/batfish/batfish), [netbox](https://github.com/netbox-community/netbox), [nautobot](https://github.com/nautobot/nautobot), [nornir](https://github.com/nornir-automation/nornir), [napalm](https://github.com/napalm-automation/napalm), [gnmic](https://github.com/openconfig/gnmic), [kne](https://github.com/openconfig/kne), [suzieq](https://github.com/netenglabs/suzieq), [akvorado](https://github.com/akvorado/akvorado)
- The capstone (20.8 "Kode yang Menjaga") asks for SoT, templates, idempotent playbooks, compliance-as-code, CI and "observability sebagai kode". The project already expects these skills without a guided lab teaching them. — `20-proyek-akhir/08-babak-7-kode-yang-menjaga.md` outline

### Inferences
- This is a lab-depth gap, not a content gap. The best intervention is a new `lab/07-lab-netdevops` built on containerlab or netlab (free NOS images such as FRR, plus SR Linux/cEOS if licences allow): NetBox → Jinja2 → Nornir/NAPALM push → Batfish pre-check in CI → gnmic → Prometheus/Grafana telemetry. It would turn the 15.x concepts into portfolio projects (18.4).
- Flow analytics (Akvorado or pmacct + ClickHouse) and BMP for BGP visibility are what ISP NOCs use to answer "who is eating my transit" and "what changed in BGP". Both are missing and would fit as a new section in 14.3.
- "Digital twin" is mostly marketing. The concrete practice is "spin a containerlab/KNE replica of prod from the SoT, then test changes", which can be taught under that name in 15.4.
- YANG/NETCONF depth is adequate for CCNA-plus. The extra senior skill is reading a YANG tree with `pyang -f tree`, then mapping native vs OpenConfig paths for gNMI subscriptions. That is a small section addition to 15.2.

### Gaps
- Not verified whether netlab's or containerlab's free-image catalogue covers MikroTik CHR adequately for an Indonesia-flavoured lab; containerlab supports vrnetlab-wrapped VMs, but this was not checked against current docs this session.

## Q4 — Cloud-native and host networking (K8s CNI, service mesh, eBPF/XDP, Linux datapath performance, cloud deep dives)

### Takeaway
16.4 (cloud, 172 lines) and 16.5 (K8s, 214 lines) are short overviews. Cilium/eBPF, Calico, Gateway API and NetworkPolicy are named correctly, but there is no depth on eBPF datapaths, kube-proxy replacement, Cilium BGP/Hubble or service mesh. The Linux high-performance datapath (XDP, AF_XDP, DPDK, SR-IOV, NIC offloads) is entirely missing. Cloud networking lacks PrivateLink/endpoint services, transit design, hybrid BGP over Direct Connect/ExpressRoute, and cloud egress cost.

### Cited Findings
- 16.5 has CNI comparison rows ("Calico — Routing L3 (BGP)…", "Cilium — Berbasis eBPF… tren naik"), a note that eBPF replaces iptables for LB/policy, kube-proxy implementing Services "iptables/IPVS/eBPF", "Gateway API = penerus Ingress… (tren baru)", and Cilium L7 policy. — `16-datacenter-cloud-sdn/05-container-kubernetes.md` lines 61–175
- Service mesh/Istio: 1 hit, in the TLS module (`06-aplikasi/04-tls-pki.md`). Hubble: 0 hits. — grep
- XDP, AF_XDP, DPDK and SR-IOV: 0 hits across the curriculum. eBPF appears in only 1 file outside 16.5 (15.1). — grep
- 16.4 has sections on service models, VPC/VNet, connectivity to cloud, other cloud network services, and cloud vs on-prem, plus a data-sovereignty note naming AWS Jakarta `ap-southeast-3`, GCP Jakarta and Azure Indonesia Central with PP 71/2019. PrivateLink appears only in `21-ekosistem-profesi/02-rumpun-infrastruktur.md`. Transit Gateway, Direct Connect and ExpressRoute appear in 3–4 files each, mostly the career module. — `16-datacenter-cloud-sdn/04-cloud-networking.md` lines 8–119; grep
- Ingress NGINX is retired. Kubernetes SIG Network and the SRC announced "Best-effort maintenance will continue until March 2026. Afterward, there will be no further releases, no bugfixes… We recommend migrating… Consider migrating to Gateway API". — [Kubernetes blog, 2025-11-11](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/). The GitHub repo is now archived (archived=true, last push 2026-03-23). — [kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx). The curriculum does not mention ingress-nginx (0 hits), so nothing is stale, but its Ingress section (§5) should now lead with Gateway API rather than call it a "tren baru".
- Cilium stable docs are at 1.20.2 and include a full "Kubernetes Without kube-proxy" guide. — [docs.cilium.io](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/). Cilium release v1.20.2 was published 2026-09-16 (25,639★); Calico was pushed 2026-10-12. — GitHub API ([cilium](https://github.com/cilium/cilium), [calico](https://github.com/projectcalico/calico))
- AI/GPU back-end fabrics: RoCE appears in 3 files and PFC in 2 (03.1 pause frames, 16.3 storage). "Ultra Ethernet" and "DCQCN" have 0 hits. — grep. The Ultra Ethernet Consortium has published its specification 1.0 and a 1.1 download. — [ultraethernet.org](https://ultraethernet.org/)

### Inferences
- Linux datapath performance is a missing section, best placed as a new module 13.5 "Datapath Linux Berkinerja Tinggi": NIC offloads (TSO/GRO/RSS via ethtool, partly in 13.1), XDP/eBPF basics with an XDP drop program for DDoS, AF_XDP/DPDK concepts, SR-IOV for VMs, and when each applies. Senior engineers at hyperscalers, CDNs and large ISPs (DDoS scrubbing, load balancers such as Cloudflare/Meta-style XDP LBs) use this, and nearly no Indonesian course covers it.
- K8s networking is a depth problem in 16.5. Add Cilium in practice (kube-proxy replacement, BGP control plane advertising pod/LB IPs to the ToR, Hubble flow visibility), Gateway API as the default given ingress-nginx's retirement, and a short service-mesh section (sidecar vs sidecarless/ambient, mTLS). These connect directly to the BGP and EVPN material the learner already has.
- Cloud networking is a depth problem large enough to justify splitting 16.4 into two modules: (a) multi-VPC/hub-spoke and Transit Gateway/Virtual WAN/NCC; (b) hybrid (Direct Connect/ExpressRoute/Interconnect with BGP, BFD, MACsec, redundancy patterns), PrivateLink/Private Service Connect, cloud DNS resolvers, and egress-cost-aware design. Cloud network engineer is already listed as a career path in 21.2 without matching technical depth.
- AI fabrics (RoCEv2, PFC/ECN/DCQCN, rail-optimised topologies, UEC) are a hyperscaler daily topic in 2026 and fit as a new section in 16.1 or 16.2. Priority for a typical Indonesian engineer is medium, but it differentiates anyone targeting DC/AI-DC jobs.

### Gaps
- Not verified this session: the current names and availability of Indonesian cloud regions (e.g., Azure "Indonesia Central" GA status). The curriculum lists them, but I did not fetch provider pages.
- No primary source fetched on which Indonesian operators deploy XDP/DPDK.

## Q5 — Other domains (precision timing, optical, 5G/private 5G, LEO, OT, observability/incident practice, packet analysis)

### Takeaway
Timing covers NTP/chrony only. PTP/IEEE 1588 and NTS are absent. Optical stops at CWDM/DWDM and the ZR reach row, with no coherent optics or 400G/800G pluggables. Cellular is essentially absent apart from 5G as a WAN access option. LEO is one Starlink mention. OT appears through Purdue/IEC 62443 and the cold-chain capstone. Incident practice (postmortem, SLO, error budget) exists but sits mostly in the career module. Packet analysis covers Wireshark/tcpdump basics with almost no tshark, display-filter or Zeek workflow.

### Cited Findings
- NTP section: stratum hierarchy, "stratum 16 berarti tidak sinkron", Cisco `ntp master`, chrony config with `local stratum 10`. — `06-aplikasi/05-layanan-lain.md` lines 245–291
- "Network Time Security" has 0 hits. "1588" appears in 1 file. Every "PTP" hit is MikroTik "PtP" (point-to-point wireless or tunnel), not Precision Time Protocol. — grep (`19-mikrotik/05-wireless-mikrotik.md`, `19-mikrotik/06-vpn-tunnel.md`)
- NTS is a published standard: RFC 8915 "Network Time Security for the Network Time Protocol" (Oct 2020). — [RFC Editor](https://www.rfc-editor.org/rfc/rfc8915.json)
- Optical: 02.3 has "WDM — Banyak Sinyal dalam Satu Serat" with a CWDM vs DWDM table and a transceiver reach table including ZR (80 km). "coherent" has 0 hits, "800G" 1 hit and "400G" 4 files. — `02-layer-fisik/03-fiber.md` lines 154–157, 337–341; grep
- Cellular: 5G appears in 18 files, mainly as modulation/access/WAN-option or career context. "UPF", "private 5G" and "5G SA" have 0 hits. — grep
- LEO: one "Starlink" mention in `11-wan-vpn/01-teknologi-wan.md`. — grep
- OT: Purdue/IEC 62443 appear in `12-keamanan/01-konsep-keamanan.md`, `12-keamanan/06-tools-keamanan.md` and the capstone `20-proyek-akhir/07-babak-6-tim-merah-tim-biru.md`. The capstone story features factory HMI and cold-storage sensors. — grep; capstone outline
- Incident practice: postmortem appears in 14.1 ("Dokumentasi dan RCA"), the capstone night-shift round 20.9 ("Setelah Pagi: Postmortem") and heavily in 21.5 (DevOps/SRE careers, 12 hits). Error budget appears in 14.3 and 21.4/21.5. "MOP/Method of Procedure" appears only in a career file. — grep
- Packet analysis: Wireshark is covered in 14.2 ("Wireshark — Analisis Mendalam") and 05.2 ("Analisis TCP di Wireshark"). tshark has 2 hits, "display filter"/`-Y` 0 hits, Zeek 6 files (mostly the 12.6 tools list). — grep

### Inferences
- Timing: add a missing section to 06.5. PTP (IEEE 1588 profiles: telecom G.8275.x for 5G fronthaul, power/broadcast), boundary/transparent clocks, why NTP is not enough, NTS for secure NTP, and GNSS dependence and spoofing risk. This is medium priority: essential for mobile backhaul, finance and broadcast, less so for enterprise.
- Optical: add a section to 02.3 on coherent optics (400ZR/ZR+ pluggables, IP-over-DWDM, OSNR/chromatic dispersion basics, reading DOM/DDM values). Indonesia's archipelagic backbone (submarine and long-haul) makes this a real differentiator for carrier and NOC roles. This is an inference; no Indonesian operator source was fetched.
- 5G core/private 5G and LEO: one new section in 11.1, or a short new module. Cover 5G SA core functions (AMF/SMF/UPF), N3/N6/N9 interfaces, network slicing as an IP/MPLS/SR transport requirement, and LEO (Starlink) as a WAN underlay with CGNAT/latency behaviour. Medium-low priority except for telco-bound learners.
- OT: partially covered via the capstone. A focused section (Purdue zones, Modbus/DNP3/OPC UA basics, unidirectional gateways, passive monitoring with Zeek/ICS parsers) would fit 12.x and matches Indonesian industrial employers (oil and gas, mining, manufacturing). That last point is an inference.
- Observability/incident practice: the content exists but is spread across career modules. Move it into 14.1/14.3 as operational skills: network SLIs (loss, latency, reachability, BGP session uptime), blameless postmortem template, change management/MOP with rollback, and maintenance-window discipline. This is a depth and placement problem.
- Packet analysis mastery is a depth problem in 14.2 and cheap, high-value: display-filter fluency, tshark field extraction for bulk analysis, TCP expert info, TAP vs SPAN vs packet broker, ring-buffer captures, and Zeek logs for NSM.

### Gaps
- No primary source fetched on Indonesian PTP or 5G SA deployment status, or on private-5G licensing in Indonesia.
- No 400G/800G market or adoption figure retrieved this session.

## Q6 — Indonesian context (IXPs, IDNIC/APNIC, ASN, ID-NOG, regional practice)

### Takeaway
Indonesian internet-ecosystem content is one bullet ("IIX, OpenIXP, JKT-IX, IXP daerah") plus one sentence on IDNIC under APJII. PeeringDB lists 80 Indonesian IXPs, with JKT-IX, IIX-Jakarta and OpenIXP/NiCE each having 600–870 member networks. The curriculum has no material on getting an ASN and PI space from IDNIC, joining an IXP, writing a peering policy, route servers, IRR/RPKI registration via IDNIC, or the ID-NOG community. For an Indonesian engineer this is the highest-leverage missing module.

### Cited Findings
- Curriculum: "Indonesia: IIX (Jakarta), OpenIXP, JKT-IX, IXP daerah" and "Di bawah RIR ada NIR/LIR (di Indonesia: IDNIC di bawah APJII)". CDIX: 0 hits. ID-NOG/IDNOG: 0 hits. IDNIC: 2 files. APNIC: 2 files. "NiCE" hits are mostly unrelated words. — `00-fondasi/04-sejarah-dan-standar.md` lines 107–113, 233–237; grep
- PeeringDB lists 80 IXPs with country=ID. By participant network count: JKT-IX (Jakarta) 868; IIX-Jakarta 828; OpenIXP/NiCE 625; AIX (Depok) 320; ODIX Omadata (Surabaya) 213; CXC Jakarta 201; BIX Jakarta 181; DE-CIX Jakarta 177; EdgeNXT 133; ILIX 105; Digital Edge EPIX Jakarta 98; CDIX 84; OMNIIX 74; IIX-JawaTimur 71; NCIX-neuCentrIX 67; Equinix Jakarta 44. Regional IIX nodes include IIX-Jabar, IIX-Bali, IIX-Jogja, IIX-Lampung, IIX-Rimba-1 (Pekanbaru), IIX-Jateng, IIX-Sumut, IIX-Banten. — [PeeringDB API /ix?country=ID](https://www.peeringdb.com/api/ix?country=ID) (fetched 2026-10-13)
- IDNIC brands itself "IDNIC - APJII". Its site offers getting IP and ASN ("Dapatkan IP", "Panduan IP & ASN"), membership and pricing, IP transfer, Whois, "IRM", reverse DNS, an IPv6 community and mailing list, and events. — [idnic.net](https://idnic.net/)
- The ID-NOG site is live at idnog.or.id (HTTP 200), but its content is rendered client-side and could not be extracted. — [idnog.or.id](https://idnog.or.id/)
- Global and regional IXP players are present in Jakarta (DE-CIX Jakarta, Equinix Jakarta, Digital Edge EPIX) alongside APJII-run IIX and community-run OpenIXP/NiCE. — [PeeringDB API](https://www.peeringdb.com/api/ix?country=ID)

### Inferences
- The curriculum's IXP list is outdated and incomplete. JKT-IX is now the largest by PeeringDB membership, and DE-CIX Jakarta, CDIX, AIX, CXC and the regional IIX nodes are missing. The 00.4 bullet should be refreshed with a dated PeeringDB citation.
- Recommended new module: "Interkoneksi Internet & Ekosistem Indonesia". It could be 07.10, or a new stage beside 07 such as "07B Operasi ISP". Contents:
  - IDNIC membership and ASN/PI process (link to the IDNIC guide; do not restate fees)
  - IRR objects and RPKI ROAs via the APNIC/IDNIC portal
  - PeeringDB record hygiene
  - Transit vs peering economics
  - IXP route servers and BGP communities for RS control
  - Peering policy (open/selective)
  - Remote peering and IX port sizing
  - Using looking glasses, bgp.tools and RIPE Atlas for troubleshooting
  - Joining ID-NOG/APNIC communities and the MANRS Network Operator Programme
  - A lab peering FRR/MikroTik to a containerlab "IX" with a BIRD route server
- MikroTik is central to the curriculum (Tahap 19, RT-RW-Net), so the module should include RouterOS v7 BGP filters, RPKI and RTR configuration. Many small Indonesian ISPs peer at IIX/OpenIXP with MikroTik edge routers. This is an inference; RouterOS v7 RPKI support was not re-verified this session.

### Gaps
- No ID-NOG event history, mailing-list size or programme content could be retrieved (JS-rendered site, no search).
- IDNIC fees, the minimum allocation size and the current ASN/PI requirements were not extracted. The writer should link to idnic.net rather than quote numbers.
- Whether APJII's IIX still offers free or regulated domestic peering, and its current route-server and RPKI policy, was not verified.
- Note: PeeringDB's "IIX-Jakarta" naming confirms IIX is operated under APJII (regional nodes use apjii.or.id domains), but the governance relationship between APJII, IDNIC and IIX was not fetched from a primary page.

## Q7 — Gap classification, ranking and target module (for an Indonesian engineer who wants to outperform peers)

### Takeaway
The highest-value fixes, in order: (1) a new SP core module (IS-IS + MPLS/LDP + L3VPN/L2VPN/EVPN + SR-MPLS/SRv6/TI-LFA); (2) a new Indonesian interconnection/peering module; (3) a BGP-security and DDoS-operations depth upgrade; (4) a NetDevOps lab track (containerlab/netlab + NetBox + Batfish + gNMI telemetry + flow analytics). Cloud-native and host datapath depth, IPv6-mostly, packet-analysis mastery and timing/optical sections follow. Most other buzzwords are already present at awareness level.

### Cited Findings
Ranked gap table. Evidence is from the grep findings above; type is M = whole module missing, S = section missing, D = depth/lab problem.

| # | Gap | Type | Current location / evidence | Suggested target |
|---|-----|------|-----------------------------|------------------|
| 1 | IS-IS + MPLS (LDP, L3VPN ops, L2VPN/VPLS/EVPN-VPWS) + SR-MPLS/SRv6 (RFC 8986, 9252, 9800), TI-LFA, Flex-Algo (RFC 9350), SR-TE basics | M | 11.1 §4 only; IS-IS has no module; TI-LFA/LFA/PCEP/BGP-LS 0 hits; VPLS 1 hit | New `07-routing-lanjutan/10-isis` + new `11-wan-vpn/04-mpls-sr-provider` (or new stage "Jaringan Service Provider"), with containerlab/FRR or SR Linux lab |
| 2 | Internet interconnection and the Indonesian ecosystem (IDNIC ASN/PI, IRR/RPKI registration, PeeringDB, 80 Indonesian IXPs, route servers, peering policy, ID-NOG, MANRS programme) | M | 00.4 single bullet; CDIX, ID-NOG 0 hits; PeeringDB 1 hit | New `07-routing-lanjutan/11-interkoneksi-internet-indonesia`; refresh 00.4 IXP list |
| 3 | BGP security and ops at scale: ASPA (draft), BGP Roles RFC 9234, RFC 8212, maxLength RFC 9319, validator + RTR (Routinator/rpki-client), Large Communities, graceful shutdown, Add-Path, BMP, incident case studies | D/S | 07.6 has RPKI/MANRS/IRR, but BMP, Large Communities, Roles, ASPA have 0 hits | New sections in `07-routing-lanjutan/06-bgp` + a case in `14-monitoring-troubleshooting/04` |
| 4 | DDoS operations: flow-based detection, RTBH (RFC 7999) lab, Flowspec rule anatomy and risks, scrubbing and IXP blackholing | D | 12.3 conceptual only | Deepen `12-keamanan/03`; add lab |
| 5 | NetDevOps labs: containerlab/netlab topology, NetBox-driven config, Nornir/NAPALM, Batfish in CI, gnmic → Prometheus/Grafana | D (lab) | Concepts in 15.2–15.4; lab/05 only backup + Ansible | New `lab/07-lab-netdevops` |
| 6 | Telemetry and flow analytics pipeline: gNMI collector design, on-change/sample tuning, BMP, Akvorado/pmacct, SuzieQ | S | 14.3 brief; Akvorado/pmacct/BMP/SuzieQ 0 hits | New section in `14-monitoring-troubleshooting/03` |
| 7 | Cloud networking deep dive: hub-spoke/TGW/vWAN, hybrid BGP over DX/ExpressRoute/Interconnect, PrivateLink/PSC, cloud DNS, egress cost | D | 16.4 is 172 lines; PrivateLink only in career module | Split into `16-…/04a` + `04b` |
| 8 | K8s networking depth: Cilium kube-proxy replacement, BGP control plane, Hubble, Gateway API as default (ingress-nginx retired Mar 2026), service mesh/ambient | D | 16.5 is 214 lines; Hubble 0, Istio 1 hit | Deepen `16-…/05` |
| 9 | Linux high-performance datapath: offloads, XDP/eBPF, AF_XDP, DPDK, SR-IOV | M/S | 0 hits for XDP/DPDK/SR-IOV | New `13-linux-networking/05-datapath-kinerja-tinggi` |
| 10 | Packet analysis mastery: display filters, tshark scripting, TAP/SPAN/packet brokers, Zeek workflow | D | tshark 2 hits; display filter 0 hits | Deepen `14-monitoring-troubleshooting/02`; Zeek in `12-keamanan/06` |
| 11 | Ops discipline: network SLIs/SLOs, blameless postmortem, MOP/change management | D (placement) | Mostly in 21.5 career module and capstone | Move into `14-…/01` and `14-…/03` |
| 12 | IPv6-mostly: RFC 8925 option 108, PREF64 (RFC 8781), CLAT on endpoints | S | 08.3 has NAT64/464XLAT; option 108/PREF64 0 hits | New section in `08-ipv6/03` |
| 13 | NAC at scale: MAB, dynamic VLAN/dACL, CoA, profiling, EAP-TLS onboarding (FreeRADIUS/PacketFence lab) | D | MAB 1 file, CoA 1 file | Deepen `12-keamanan/04` + lab |
| 14 | AI/GPU fabrics: RoCEv2, PFC/ECN/DCQCN, rail-optimised, Ultra Ethernet | S | RoCE 3 hits; UEC/DCQCN 0 | New section in `16-…/01` or `16-…/02` |
| 15 | Optical transport: coherent, 400ZR/ZR+, IPoDWDM, OSNR, DOM reading | S | 02.3 stops at CWDM/DWDM; coherent 0 hits | New section in `02-layer-fisik/03` |
| 16 | Precision timing: PTP/IEEE 1588 profiles, NTS (RFC 8915) | S | No PTP (Precision Time Protocol) coverage; NTS 0 hits | New section in `06-aplikasi/05` |
| 17 | 5G SA core/private 5G and LEO (Starlink) as an underlay | S/M | UPF/private 5G 0 hits; Starlink 1 hit | Section in `11-wan-vpn/01`, or optional new module |
| 18 | OT/industrial networks (Purdue, protocols, passive monitoring) | D | Purdue/IEC 62443 in 12.1/12.6 + capstone | Section in `12-keamanan` |
| 19 | SD-WAN/ZTNA hands-on lab; Wi-Fi Passpoint/OpenRoaming | D (lab) / S | Concepts covered in 11.1, 12.5, 10.x | Optional lab; small section in `10-wireless/04` |

- Supporting standards and tools are current and real (RFC 8986/9252/9800/9350/9234/8212/9319/8925/8915 published; ASPA still a draft at rev 28/29; containerlab v0.81.0, NetBox v4.7.2, Cilium 1.20.2 released Sep–Oct 2026; ingress-nginx archived). — sources as cited in Q1–Q5.

### Inferences
- The ranking weights Indonesian job-market leverage. Most Indonesian employers of network engineers are ISPs, telcos, data centres and MikroTik-heavy SMB/RT-RW-Net operators (the curriculum itself emphasises this in 18.5/19.x). SP core, peering and BGP operations, and DDoS defence therefore rank above hyperscaler-specific topics such as AI fabrics or DPDK. This is a reasoned inference; no labour-market dataset was fetched in this sub-task.
- Items 3, 4, 10, 11 and 12 are low-effort, high-return edits to existing modules. Items 1, 2, 5 and 9 need new modules or labs.
- Consider demoting RIP (07.3) and EIGRP (07.5) to "historical/CCNA reference" to free space for IS-IS. Hiring managers at SP/DC employers value IS-IS far more. This is an opinion/inference.
- The capstone (20.x) already assumes NetDevOps and incident-response skills (20.8, 20.9). Adding the lab track in #5 would close a "taught as concept, examined as practice" mismatch.

### Gaps
- No job-posting or salary data was collected to empirically weight the ranking for Indonesia (WebSearch unavailable).
- Sizes of the existing 16.x modules (150–214 lines) were measured, but their text was not read line by line, so some depth may sit in prose the greps did not catch.
- Lab/00 lists lab platforms. Whether it already recommends containerlab images usable for SR/MPLS labs (e.g., SR Linux, FRR with MPLS kernel support) was not checked in detail.
