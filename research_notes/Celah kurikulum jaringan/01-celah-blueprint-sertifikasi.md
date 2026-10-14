# Certification blueprint gaps in the existing Indonesian networking curriculum (as of Oct 2026)

Method note (applies to every section). Official objectives came from Cisco exam-topic PDFs on learningcontent.cisco.com, cisco.com exam pages, comptia.org, juniper.net certification pages and the MikroTik training-outline PDFs. For ENCOR, SPCOR and the detailed Network+ sub-bullets, the official pages are JavaScript-rendered or blocked, so I used GitHub transcriptions. Each one is marked "secondary". Curriculum coverage was checked with `grep -rliE` over `/home/vi/Projects/networking/materi/` (term present or absent, and in which module), with spot reads of section headings and line counts. "Absent" means the English term (and obvious Indonesian equivalents) does not appear outside stages 18, 20 and 21 (career, capstone, profession) or the glossary. A grep miss can be a false negative if the concept is described with different wording. Example: ENCOR "client density" looked absent by English term, but `10-wireless/04` has "Kepadatan tinggi", so it is covered. Items marked "verify" need a human read.

Curriculum shorthand: `NN/MM` = `materi/NN-<stage>/MM-<module>.md`. Example: `11/01` = `materi/11-wan-vpn/01-teknologi-wan.md`.

---

## 1. Cisco CCNA 200-301 v1.1, CCNP ENCOR 350-401, ENARSI 300-410, SPCOR 350-501, CCNA Automation 200-901: missing or shallow objectives

### Takeaway
CCNA v1.1 is close to fully covered. The gaps are minor, apart from mapping errors in `18/02`. CCNP Enterprise has about 20 specific gaps, mostly Cisco-platform features: SD-Access/LISP, Cisco SD-WAN components, AP join/L3 roaming/9800 tags, SSO/NSF, TCAM/adjacency tables, SPAN config, conditional debug, EEM, device-side NETCONF/RESTCONF, BGP 4-byte AS/peer-groups, time-based ACL and PTP. SPCOR is essentially uncovered: IS-IS, MPLS LDP/TE, Segment Routing/SRv6, L2VPN/Carrier Ethernet and SP HA have no module. CCNA Automation's software-development and Cisco-platform-API domains (about 30% of the exam) have no module.

### Cited Findings

**Exam versions (current as of Oct 2026)**
- CCNA is still "Implementing and Administering Cisco Solutions (200-301 CCNA) v1.1". It is a 120-minute exam, and no newer version is announced on the exam page — [Cisco CCNA exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html)
- CCNA v1.1 domain weights: 1.0 Network Fundamentals 20%, 2.0 Network Access 20%, 3.0 IP Connectivity 25%, 4.0 IP Services 10%, 5.0 Security Fundamentals 15%, 6.0 Automation & Programmability 10%. Objective 6.6 is "Recognize the capabilities of configuration management mechanisms such as Ansible and Terraform", and 6.4 is "Explain AI (generative and predictive) and machine learning in network operations" — [CCNA v1.1 exam topics PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf)
- The current ENCOR version is 350-401 v1.1 (120 min). The page has no upcoming-version announcement — [Cisco ENCOR exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/encor.html)
- The current SPCOR version is 350-501 v1.0 (120 min). No upcoming-version announcement — [Cisco SPCOR exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/spcor.html)
- ENARSI 300-410 v1.1 is a 90-minute exam. Weights: 1.0 Layer 3 Technologies 35%, 2.0 VPN Technologies 20%, 3.0 Infrastructure Security 20%, 4.0 Infrastructure Services 25% — [ENARSI v1.1 exam topics PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/300-410-ENARSI-v1.1.pdf)
- CCNA Automation: the exam page names it "Automating Networks Using Cisco Platforms (200-901 CCNAAUTO) v1.0" — [Cisco CCNA Automation exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccnaauto.html). The exam-topics PDF (dated 2025) is titled "Automating Networks Using Cisco Platforms v1.1 (200-901)" and is "associated with the CCNA Automation Certification" — [CCNAAUTO v1.1 exam topics PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-901-CCNAAUTO_v.1.1.pdf). **Conflict: the page says v1.0 and the PDF says v1.1.** Cisco's own GitHub prep repo (CiscoLearning, created June 2026) links the v1.1 PDF — [CiscoLearning/ccna-auto-prep](https://github.com/CiscoLearning/ccna-auto-prep)
- Changes from DevNet Associate DEVASC v1.1 to CCNAAUTO v1.1: the domains and weights are the same (15/20/15/15/20/15). Product names were updated: "Cisco DNA Center" → "Cisco Catalyst Center", "Cisco SD-WAN" → "Cisco Catalyst SD-WAN", and "Umbrella" → "Secure Connect" in 3.5. Several verbs changed from "Identify" to "Describe/Interpret" (2.3, 2.6, 3.7, 4.2, 4.3, 4.8, 4.12, 5.8), and 6.8 "Identify cause of application connectivity issues" became "Diagnose application connectivity issues" — [DEVASC v1.1 PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-901-DEVASC-v1.1.pdf) vs [CCNAAUTO v1.1 PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-901-CCNAAUTO_v.1.1.pdf)
- The curriculum already notes that "Per 2026, jalur DevNet berganti nama menjadi CCNA/CCNP/CCIE Automation" (the DevNet track was renamed CCNA/CCNP/CCIE Automation in 2026) — [curriculum 18/01](/home/vi/Projects/networking/materi/18-karier-sertifikasi/01-peta-sertifikasi.md)

**CCNA v1.1 vs curriculum** (objective text from the [CCNA v1.1 PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf); coverage from [curriculum `materi/`](/home/vi/Projects/networking/materi/))
- Found in the curriculum: Rapid PVST+ (`03/04`); root guard, loop guard and BPDU filter (`03/04`, `12/02`); voice VLAN (`03/03`); FlexConnect and AP modes (`10/04` "Mode AP (topik CCNA 2.6)"); gateway of last resort and host route (`04/05`, `07/01`); PHB (`11/03`); syslog facility (`06/05`); WPA2-PSK GUI (`lab/04` Lab 4.4); Terraform (`15/04`); generative AI (`15/01`, `16/06`); EUI-64 (`08/01-02`). I found no objective with zero coverage.
- `18/02` maps 2.1.c "InterVLAN connectivity" to `07/*`. Inter-VLAN routing actually lives in `03/03` (section "Inter-VLAN Routing") and in `lab/02` Lab 2.3 — [curriculum 18/02](/home/vi/Projects/networking/materi/18-karier-sertifikasi/02-peta-ccna.md)
- `18/02` maps 4.4 SNMP and 4.5 syslog only to `14/03`. `06/05` also has SNMP and syslog sections, including facility, so the mapping is incomplete but not wrong.

**ENCOR 350-401 v1.1 vs curriculum** (objectives from a secondary transcription: [alcancil/Cisco encor_v11.md](https://github.com/alcancil/Cisco/blob/main/CCNP%20350-401%20ENCOR/Blueprint/encor_v11.md). Weights: Architecture 15%, Virtualization 10%, Infrastructure 30%, Network Assurance 10%, Security 20%, Automation 15%.)
- 1.1.b "High availability techniques such as redundancy, FHRP, and SSO". FHRP is covered (`07/08`). Stateful switchover (SSO/NSF) is **absent**: the only "SSO" hits mean single sign-on, in `12/04-05`.
- 1.2.b "Location services in a WLAN design" is **absent** (0 hits for location services/RTLS). 1.2.c client density is covered (`10/04` "Kepadatan tinggi").
- 1.3 "Cisco SD-WAN solution: control and data plane elements". `11/01` §5 SD-WAN runs about 18 lines (capabilities and vendors) plus SASE. vManage/vSmart/vBond/OMP (now Catalyst SD-WAN Manager/Controller/Validator) appears in only one file (`16/06`) → **shallow**.
- 1.4 "Cisco SD-Access solution: control and data plane elements; traditional campus interoperating with SD-Access". SD-Access appears only as one-line mentions (`15/01`, `16/06`, `17/01`). LISP appears once (`15/01`) → **shallow/absent**.
- 1.6 "Describe hardware and software switching mechanisms such as CEF, CAM, TCAM, FIB, RIB, and adjacency tables". CEF/FIB/RIB are present (`04/05`) and CAM is present (`03/02`). **TCAM has 0 hits and "adjacency table" has 0 hits.**
- 2.3.a LISP is **absent** as a teachable section. 2.3.b VXLAN is covered (`16/02`).
- 3.1.c "Configure and verify ... RSTP, MST". MST is mentioned in `03/04` ("Varian STP"), but I found no evidence of MST configuration (region, revision, instance mapping) → **verify; likely shallow**.
- 3.3.c "Describe access point discovery and join process (discovery algorithms, WLC selection process)" is **absent** (`10/04` has no discovery/join section; `06/02` likely mentions DHCP option 43 only).
- 3.3.d "Layer 2 and Layer 3 roaming". `10/02` covers 802.11k/v/r and sticky clients. Controller-level L2/L3 roaming (intra/inter-controller, mobility anchor) is **absent**.
- 3.3.f "Describe wireless segmentation with groups, profiles, and tags" (Catalyst 9800 policy/site/RF tags) is **absent** (0 hits).
- 3.4.a "Interpret network time protocol configurations such as NTP and PTP". NTP is covered (`06/05`, `13/04`). Precision Time Protocol (IEEE 1588) is **absent**.
- 4.1 "Diagnose network problems using tools such as debugs, conditional debugs ...". "Conditional debug" has **0 hits**.
- 4.3 "Configure SPAN/RSPAN/ERSPAN". RSPAN/ERSPAN are named in `14/02`, but no `monitor session` configuration exists anywhere → **shallow (config missing)**.
- 4.5 "Describe Cisco DNA Center [Catalyst Center] workflows". Mentions exist in `15/*` and `16/06`, but there is no workflow section → **shallow**.
- 4.6 "Configure and verify NETCONF and RESTCONF". The concepts and client side are covered (`15/02`, `15/03` ncclient). Device-side enablement on IOS XE (`netconf-yang`, `restconf`) has 0 hits → **shallow**.
- 5.4.b WebAuth: one mention (`12/04`). 5.5.d TrustSec/MACsec: mentions only (`03/06`, `16/06`). 5.5.e MAB: one mention (`12/02`) → **shallow**.
- 6.6 "Construct an EEM applet". EEM appears only as an analogy (`04/04`: Netwatch "setara IP SLA + EEM di Cisco", i.e. equivalent to IP SLA + EEM in Cisco). No `event manager applet` example → **absent**.
- 6.7 "Compare agent vs. agentless orchestration tools, such as Chef, Puppet, Ansible, and SaltStack". Puppet has 1 mention and SaltStack 0 (`15/04` only) → **shallow**.
- Covered well: VRF (`07/07`, `16/03`), GRE/IPsec (`11/02`), PBR (`07/07`), multicast RPF/PIM/IGMPv3 (`07/09`, 23 RPF hits), Flexible NetFlow (`14/03` "flow record/flow exporter"), IP SLA config (`07/01` §7 `ip sla 1`), CoPP (`12/05`), 802.1X (`12/04` dot1x config), EAPOL 4-way handshake (`10/03`).

**ENARSI 300-410 v1.1 vs curriculum** ([ENARSI PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/300-410-ENARSI-v1.1.pdf))
- 1.11.b "Neighbor relationship and authentication (next-hop, multihop, 4-byte AS, private AS, route refresh, synchronization, operation, peer group, states and timers)". 4-byte AS has **0 hits** and peer-group has **0 hits**. Route refresh/soft-reconfig is present (`07/06`) → **section gap in `07/06`**.
- 3.2.a "IPv4 access control lists (standard, extended, time-based)". Time-based ACL/time-range has **0 hits** → add to `09/02`.
- 4.3 "logging (local, syslog, debugs, conditional debugs, timestamps)". Conditional debug is **absent** (same gap as ENCOR 4.1).
- 4.6 "Troubleshoot NetFlow (v5, v9, flexible NetFlow)". Flexible NetFlow is present in `14/03`. v5/v9 version differences were not found → **minor depth gap**.
- 4.7 "Troubleshoot ... using Cisco DNA Center assurance" → **shallow** (mentions only).
- 2.3 "Configure and verify DMVPN (single hub): GRE/mGRE, NHRP, IPsec, dynamic neighbor, spoke-to-spoke". `11/02` §5 DMVPN covers about 57 lines (lines 458–515), and NHRP/mGRE appear only there → **verify depth** (phase 1/2/3, NHRP registration/redirect/shortcut, spoke-to-spoke).
- 2.1/2.2 "Describe MPLS operations (LSR, LDP, label switching, LSP)" and "MPLS Layer 3 VPN". `11/01` §4 MPLS runs about 80 lines, with subsections "Konsep" (concepts), "MPLS L3VPN" and "Segment Routing". LDP appears in only this one file. That is probably enough for "describe" level, but RD/RT/VPNv4/MP-BGP depth should be verified.
- Covered: AD, route-maps, redistribution, summarization (`07/07`, `04/03`); split horizon/route poisoning (`07/02-03`); PBR and VRF-Lite (`07/07`); BFD (`07/02`, `07/04`); EIGRP named mode and stuck-in-active (`07/05`); OSPF area types and virtual link (`07/04`); uRPF; IPv6 FHS (RA guard, DHCPv6 guard, source guard in `08/02-03`); SNMPv3; SCP; IP SLA.

**SPCOR 350-501 vs curriculum** (objectives from a secondary transcription: [oicnanev/CiscoCertifications CCNP-Service-Provider.md](https://github.com/oicnanev/CiscoCertifications/blob/main/CCNP/CCNP-Service-Provider.md). Weights: Architecture 15%, Networking 30%, MPLS and Segment Routing 20%, Services 20%, Automation and Assurance 15%.)
- 2.1 "Implement IS-IS (IPv4 and IPv6): route advertisement, area addressing, single/multitopology, metrics". IS-IS appears only in passing (7 files, e.g. "underlay IS-IS" in `16/06`). There is **no IS-IS module**.
- 3.1 "Implement MPLS: LDP sync, LDP session protection, LDP neighbors, Unified MPLS, MPLS OAM". LDP sync, Unified/Seamless MPLS and MPLS OAM/LSP ping each have **0 hits**.
- 3.2 "Describe traffic engineering: IS-IS and OSPF extensions, RSVP functionality, FRR". RSVP is mentioned in `11/01` and `11/03` only. No TE section.
- 3.3 "Describe segment routing: segment types, SR control plane, SR-TE, TI-LFA, PCE-PCC, Flexible algorithm, SRv6 (locator, micro-segment, encapsulation, interworking gateway)". There is one short subsection, "Segment Routing — penerus MPLS" (successor to MPLS), in `11/01` (lines 168–184). TI-LFA, Flex-Algo and PCE have **0 hits**.
- 4.1 "Describe VPN services: EVPN, Inter-AS VPN, CSC, mVPN". EVPN is covered only in the DC/VXLAN context (`16/02`). Inter-AS and CSC have **0 hits**.
- 4.2 "Configure L2VPN and Carrier Ethernet: E-Line, E-Tree, E-Access, E-LAN; IEEE 802.1ad, 802.1ah, ITU G.8032; Ethernet OAM; VLAN tag manipulation". E-Line/E-LAN appear once (`11/01`), 802.1ad/QinQ once (`03/01`), and 802.1ah only as history (`00/04`). G.8032/ERPS and CFM/Y.1731 have **0 hits**.
- 1.2 "Describe Cisco network software architecture: IOS, IOS XE, IOS XR". IOS XR appears only as an Ansible platform name (`15/04`).
- 1.3 NFV infrastructure/VNF has **0 hits**. 1.1.c "Mobility (packet core, RAN xhaul transport for 5G vRAN and ORAN transport)" and 1.1.d "Routed optical network" are **absent** ("backhaul" appears only in the wireless context, `10/04`, `19/05`).
- 1.4.a "MPLS QoS models (Pipe, Short Pipe, Uniform)" and 1.4.b "MPLS TE QoS (... DS-TE)" have **0 hits**. IntServ appears once (`11/03`).
- 1.5 control-plane security: LPTS has 0 hits. BGP flowspec has 1 mention (`12/03`). GTSM/TTL security is present (`07/06`, `12/03`), RPKI/BGPsec is present (`07/06`, `12/03`), and RTBH is present (`07/06` and others).
- 2.4.g/h "Additional Paths" and "PIC" have **0 hits**. 2.8 "NSF/graceful restart, NSR" have **0 hits**. BFD and link aggregation are covered.
- 2.7 "IPv6 transition (NAT44, NAT64, CGNAT, MAP-T and DS Lite)" is covered (`08/03`, `09/01` CGNAT).
- 5.3 NSO has **0 hits**. 5.6 "Secure ZTP" has 2 mentions only. 5.7 "Configure dial-in/out, TCP, TLS and mTLS certificates using gRPC and gNMI": gNMI concepts are present (`15/02`, `14/03`), but dial-in/out config is absent.
- Transport technologies (1.1.b xDSL, DWDM, DOCSIS, xPON) are covered at physical/access level (`02/01`, `02/03`, `11/01`).

**CCNA Automation 200-901 v1.1 vs curriculum** ([CCNAAUTO v1.1 PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-901-CCNAAUTO_v.1.1.pdf))
- 1.0 Software Development and Design (15%): 1.3 TDD has 0 hits, 1.4 agile/lean/waterfall 0 hits outside career stages, 1.6 MVC/Observer 0 hits. 1.8 Git operations (clone, add/remove, commit, push/pull, branch, merge and conflicts, diff) has only a "Git untuk Jaringan" (Git for networking) section in `15/04` (1 hit for git merge/branch/clone) → **missing section + depth**.
- 2.0 APIs (20%): 2.2 webhooks has 1 hit (security context `12/03`) → **absent**. 2.3 API constraints (rate limiting, pagination): pagination has 0 hits. HTTP status codes and Bearer tokens are covered (`06/03` mentions 401/403/404 and Bearer). 2.8 REST vs RPC vs sync/async is partial (`06/03` covers gRPC).
- 3.0 Cisco Platforms and Development (15%): 3.1 Cisco SDK has 0 relevant hits. 3.2–3.5: Meraki, Catalyst Center and ACI are mentioned. NSO, UCS Manager, Intersight, Webex/CUCM AXL/UDS and the security APIs (XDR, Firepower, Secure Connect, Secure Endpoint, ISE, Secure Malware Analytics) are effectively **absent**. 3.7 DevNet resources: only "DevNet Sandbox" in `18/04`. 3.9 coding tasks against Meraki/Catalyst Center/Webex APIs are **absent**.
- 4.0 Application Deployment and Security (15%): 4.1 edge computing has 0 hits, 4.3.b bare metal 0, 4.6 Dockerfile 0, 4.5 Python unit test 1 hit (`15/04`). 4.10 OWASP is covered (`12/03`), and Docker networking is covered (`16/05`) without image building.
- 5.0 Infrastructure and Automation (20%): 5.3 CML/pyATS is covered (`lab/00`, `15/03`). 5.6 NSO is absent. 5.12 "Interpret a unified diff" has 0 hits (NAPALM diff exists in `15/03`). 5.14 sequence diagrams have 0 hits. RESTCONF/NETCONF/YANG are covered (`15/02`). Ansible is covered (`15/04`).
- 6.0 Network Fundamentals (15%): fully covered by stages 03–09.

### Inferences
- CCNA v1.1: no new module needed. Fix the `18/02` mapping rows and add a short "show-output interpretation" drill if desired.
- The fastest high-value additions for CCNP Enterprise are targeted sections inside existing modules:
  - `10/04`: AP join/WLC selection, L2/L3 roaming, 9800 tags, location services
  - `03/02`: TCAM and adjacency table
  - `14/02`: SPAN/RSPAN/ERSPAN config and conditional debug
  - `06/05`: PTP
  - `07/06`: 4-byte AS and peer groups
  - `09/02`: time-based ACL
  - `15/02`: IOS XE `netconf-yang`/`restconf` enablement
  - `15/04`: agent vs agentless (Chef/Puppet/Salt)
  - `17/01` or `07/08`: SSO/NSF
  - EEM applet: new section in `15/03` or `14/02`
- Cisco SD-Access plus Cisco Catalyst SD-WAN (ENCOR 1.3/1.4/2.3.a/4.5/6.4) justify **one new module**, e.g. `16-07 Cisco SD-Access & Catalyst SD-WAN` (LISP/VXLAN/SGT fabric roles, SD-WAN Manager/Controller/Validator, OMP, TLOC, Catalyst Center workflows and APIs).
- SPCOR needs a **new stage**. One option is `22-service-provider` with modules: IS-IS; MPLS LDP and L3VPN in depth; TE and Segment Routing (SR-MPLS, SRv6, TI-LFA, Flex-Algo, PCE); L2VPN and Carrier Ethernet (VPWS/VPLS/EVPN, 802.1ad/ah, G.8032, CFM/Y.1731); SP HA and BGP scale (GR/NSF/NSR, Add-Path, PIC); SP security (LPTS/CoPP, flowspec, RTBH); SP automation (IOS XR, NSO, ZTP, gNMI dial-out).
- CCNA Automation needs **two new modules** in stage 15: `15-05 Software development for network engineers` (Git workflow, TDD/unittest, design patterns, SDLC methods, Dockerfile, CI/CD, secrets, unified diff, sequence diagrams) and `15-06 Cisco platform APIs` (Meraki, Catalyst Center, Catalyst SD-WAN, ACI, NSO, Webex, Intersight, security APIs, webhooks, API constraints, Cisco SDKs, DevNet resources).

### Gaps
- The official ENCOR v1.1 and SPCOR v1.0 PDFs could not be fetched: learningcontent.cisco.com returned 403 for every filename variant I tried, and learningnetwork.cisco.com pages are JavaScript-rendered. The objective lists above come from GitHub transcriptions and should be checked against the official PDF. The SPCOR list includes SRv6 micro-segment, ORAN xhaul, routed optical networking and gNMI mTLS, which suggests it reflects Cisco's refreshed SPCOR topics. I could not confirm when that refresh took effect.
- I could not confirm from a primary page whether CCNAAUTO v1.0 or v1.1 is the version currently delivered. The exam page and the PDF conflict.
- No evidence found of a CCNA v2.0 or ENCOR v1.2 announcement on the Cisco exam pages as of Oct 2026, but announcements on learningnetwork could not be read.
- DMVPN depth (`11/02` §5), MST config (`03/04`) and REST API security (ENCOR 5.3) were not read line by line. They are marked "verify".

---

## 2. CompTIA Network+ N10-009: missing or shallow objectives

### Takeaway
The existing map `18/03` has **wrong domain weights**: it lists Security at 19% and Troubleshooting at 19%, but the official weights are 14% and 24%. It also claims coverage that does not exist for disaster recovery and physical installation. The real N10-009 gaps are vendor-neutral operations topics (DR metrics and site types, backup types, lifecycle and asset documentation, physical-plant power and environment), some Network+ vocabulary (cloud service attributes, WoL, plenum, rootkit/logic bomb, GDPR/data locality, geofencing), and troubleshooting tools (toner, Wi-Fi analyzer, port mirroring).

### Cited Findings
- N10-009 launched June 20, 2024, with estimated retirement in 2027. The page shows no newer version. Weights: Networking concepts 23%, Network implementation 20%, Network operations 19%, Network security 14%, Network troubleshooting 24% — [CompTIA Network+ page](https://www.comptia.org/en-us/certifications/network/)
- The curriculum's `18/03` table says "4.0 Network Security | 19%" and "5.0 Network Troubleshooting | 19%", and its summary says "sisanya ~19-20%" (the rest about 19–20%) → **factual error**. It should be 14% and 24% — [curriculum 18/03](/home/vi/Projects/networking/materi/18-karier-sertifikasi/03-peta-networkplus.md)
- `18/03` maps "Ketersediaan tinggi & disaster recovery (redundansi, FHRP, backup, RTO/RPO)" (high availability and DR) to `17/01-02` and `07/08`. Grep finds RPO/hot site/disaster recovery only in `21-ekosistem-profesi/*` (career profiles) and in `18/03` itself, not in `17/*` → **mapping claims coverage that does not exist** — [curriculum materi/](/home/vi/Projects/networking/materi/)
- N10-009 objective 3.3 "Explain disaster recovery (DR) concepts" lists RPO, RTO, MTTR, MTBF, cold/warm/hot site, full/incremental/differential backup, active-active vs active-passive, tabletop exercises and validation tests — [secondary transcription of N10-009 objectives](https://github.com/jmbealer/my-knowledge-base/blob/main/013-technology_and_applied_science/CompTIA/networkplus-wip.md). Curriculum: MTBF 0 hits; hot/cold/warm site 0; incremental/differential backup 0 (the only hits are encoding/cable terms); tabletop appears only in the security context (`12/05`) → **missing section**.
- 2.4 "Explain important factors of physical installations": IDF/MDF, rack size, port-side exhaust/intake, cable trays, patch/fiber distribution panels, lockable racks, UPS, PDU, power load, voltage, humidity, fire suppression (wet pipe, dry pipe, pre-action, deluge, clean agents), temperature — [same transcription](https://github.com/jmbealer/my-knowledge-base/blob/main/013-technology_and_applied_science/CompTIA/networkplus-wip.md). Curriculum: IDF/MDF appear only in `02/02` and UPS in `17/*`. The power distribution unit has 0 hits, fire-suppression types have 0 relevant hits, and humidity appears only outside the core stages → **missing section**. Best home: `02/02` "Kabel Terstruktur" (structured cabling) or a new `17/05`.
- 3.1 "organizational processes and procedures": rack diagrams (0 hits), asset inventory (security context only), EOL/EOS, decommissioning (0), SLA (present), wireless heat map (1 hit outside core), golden config (present `12/05`, `15/01`), AUP (1 hit `12/01`) → **shallow**. Home: `17/03` "Dokumentasi Jaringan" (network documentation).
- 3.2 monitoring: SNMP, NetFlow, syslog severity and SIEM are covered (`14/03`, `12/06`). "Port mirroring" has 0 hits under that name (SPAN is named in `14/02`) → add the CompTIA term.
- 3.4 services: DHCP, SLAAC, DNSSEC, DoH/DoT and hosts file are covered (`06/01-02`, `13/01`). **PTP (Precision Time Protocol) 0 and NTS (Network Time Security) 0** → section in `06/05`.
- 3.5 access/management: split tunnel (`11/02`) and out-of-band (`06/05` and others) are covered. **Clientless VPN 0 hits.**
- 1.3 cloud concepts: VPC, NSG/security lists, IGW, NAT gateway and Direct Connect are covered (`16/04`). **Community cloud 0, elasticity 0, multitenancy 1 hit outside core** → small depth gap in `16/04` §1.
- 1.2 appliances: WAF, IDS/IPS, load balancer, proxy, NAS/SAN, CDN and media converter are present. UTM has 1 hit (Linux context `13/04`). Transparent proxy has 0 → minor.
- 1.5 media/transceivers: SFP28/QSFP, MPO, BNC, F-type, APC/UPC and twinax are present (`02/02-03`). **Plenum cable 0 hits.** Satellite appears only in `11/01`.
- 1.6 network types: HAN 0, darknet 0 (minor vocabulary).
- 1.7 IPv4: APIPA and RFC 1918 are covered. "Class D/E" did not match the literal search (`04/01` has a "Kelas Alamat (Classful)" section, so likely covered; verify).
- 2.2 switching: **Wake-on-LAN 0 hits.** Auto-MDIX 1 hit (`02/02`). Switch stacking is present (`03/05`). Storm control and jumbo frames are covered.
- 2.3 wireless: 802.11h/DFS, band steering, WPS, captive portal, MU-MIMO and beamforming are covered (`10/*`).
- 4.1 security concepts: **geofencing 0, GDPR 0, data locality 0**. PCI DSS is present. Honeypot appears once (`12/03`). SCADA/ICS/IIoT have few hits (`12/06`, `11/03`). BYOD has 2 hits.
- 4.2 attacks: **logic bomb 0, rootkit 0.** Whaling, vishing/smishing, tailgating, DNS tunneling and SSL stripping are present (`12/01`, `12/03`).
- 5.2 cabling issues: CRC, runts, giants, err-disabled and PoE power budget are present (`03/01-02`, `02/02`). TX/RX transposed is covered (`02/03`).
- 5.5 tools: **toner/tone generator 0 hits, Wi-Fi analyzer 0 hits** (the concept may appear as spectrum/site-survey tools in `10/04`; verify). VFL is present (`02/03`) and nmap is present.

### Inferences
- `18/03` must be corrected: weights to 23/20/19/14/24, and its DR and physical-installation rows must stop pointing at modules that do not cover them.
- Most Network+ gaps are **missing sections, not modules**. Suggested placements:
  - New section "Disaster Recovery & Kontinuitas" (DR and continuity: RPO/RTO/MTTR/MTBF, site types, backup types, active-active/active-passive, tabletop/validation) in `17/02` (it fits "Manajemen & Operasi dalam Desain", management and operations in design) or a new `17/05`
  - New section "Instalasi Fisik & Lingkungan" (physical installation and environment: MDF/IDF, rack units, airflow, UPS/PDU, power load, HVAC/humidity, fire-suppression types, plenum) in `02/02`
  - Extend `17/03` documentation with asset inventory, EOL/EOS, decommissioning, rack diagrams and AUP
  - Add PTP and NTS to `06/05`
  - Add Network+ vocabulary to `16/04` and `12/01-03`
  - Add toner and Wi-Fi analyzer to `14/02`
- Because Troubleshooting is the largest domain (24%), `14/*` is well placed. A dedicated "CompTIA-term" troubleshooting drill (performance-based-question style) is the best-weighted addition.

### Gaps
- The official CompTIA objectives PDF could not be fetched (partners.comptia.org returned HTML, not the PDF). Sub-bullets come from a community transcription and should be checked against the official PDF before final authoring.

---

## 3. Juniper JNCIA-Junos (JN0-106) and JNCIS-ENT / JNCIS-SP: missing Junos-specific and concept topics

### Takeaway
The curriculum has **no Juniper content at all**. Junos appears only in passing (multi-vendor automation, "VyOS memakai CLI mirip Junos" — VyOS uses a Junos-like CLI). The entire JNCIA-Junos blueprint is therefore a **missing module**: Junos architecture (RE/PFE), the candidate/commit/rollback model, rescue config, login classes, routing-instances, routing policy (policy-statement), firewall filters and J-Web. The concept layer is mostly covered by the vendor-neutral stages. At JNCIS level the main concept gaps are IS-IS (also a SPCOR gap), MPLS RSVP/LDP/SR, and Junos HA features (GRES, NSR, NSB, ISSU, Virtual Chassis, RTG).

### Cited Findings
- JNCIA-Junos exam: code JN0-106, 90 minutes, 65 multiple-choice questions, software version Junos OS 21.2, no prerequisite, valid three years — [Juniper JNCIA-Junos page](https://www.juniper.net/us/en/training/certification/tracks/junos/jncia-junos.html)
- JNCIA-Junos objectives — [Juniper JNCIA-Junos page](https://www.juniper.net/us/en/training/certification/tracks/junos/jncia-junos.html):
  - **Networking Fundamentals**: collision/broadcast domains, Layer 2/3 addressing, IPv4/IPv6, subnetting/supernetting, longest match, CoS, connection-oriented vs connectionless
  - **Junos OS Fundamentals**: software architecture, control and forwarding planes, routing engine and packet forwarding engine, transit vs exception traffic
  - **User Interfaces**: CLI modes/navigation/help, filtering output, active vs candidate configuration, reverting to previous configurations, loading/comparing configuration files, J-Web
  - **Configuration Basics**: factory-default, initial config, user accounts, login classes, authentication methods, interface types, configuration groups, NTP/SNMP/syslog, configuration archival, logging and tracing, rescue configuration
  - **Operational Monitoring and Maintenance**: show/monitor commands, Junos installation and upgrades, root password recovery
  - **Routing Fundamentals**: routing vs forwarding tables, route preference, routing instances, static routing
  - **Routing Policy and Firewall Filters**: default policies, import/export, policy flow, terms, match criteria and actions, firewall filter structure, uRPF
- JNCIS-ENT exam: code JN0-352, 65 questions, 90 minutes, Junos 23.1, prerequisite JNCIA-Junos. Objectives:
  - **Layer 2 switching/VLANs**: native/voice VLAN, inter-VLAN routing
  - **STP/RSTP**
  - **Layer 2 security**: BPDU/loop/root protection, MAC limiting, DHCP snooping, DAI, IP source guard, MACsec, storm control, Layer 2 firewall filters
  - **Protocol-independent routing**: static/aggregate/generated routes, martian addresses, routing instances incl. RIB groups, load balancing, filter-based forwarding
  - **OSPF**
  - **IS-IS**: LSDB, PDUs, TLVs, levels and areas, DIS, metrics
  - **BGP**
  - **Tunnels**: GRE, IP-IP
  - **High availability**: LAG, Redundant Trunk Groups, Virtual Chassis, graceful restart, GRES, NSR, NSB, BFD, VRRP, unified ISSU
  - Source: [Juniper JNCIS-ENT page](https://www.juniper.net/us/en/training/certification/tracks/enterprise-routing-switching/jncis-ent.html)
- JNCIS-SP exam: code JN0-364, 65 questions, 90 minutes, Junos OS 25.2. Objectives:
  - Protocol-independent routing (same as ENT)
  - OSPF, IS-IS, BGP
  - **Layer 2 bridging**: SP switching platforms, virtual switches, provider bridging (Q-in-Q), IRB
  - **STP, RSTP, MSTP and VSTP**
  - **MPLS**: terminology, header, LIB, RSVP, LDP, segment routing with MPLS, shortest-path SR LSPs
  - **IPv6**: OSPFv3, IS-IS, BGP, IPv6-over-IPv4 tunneling
  - **GRE**
  - **HA**: LAG, GR, GRES, NSB, NSR, BFD, VRRP
  - The page brands the platforms as "HPE Juniper Networking" (version-change note: post-HPE acquisition branding). Source: [Juniper JNCIS-SP page](https://www.juniper.net/us/en/training/certification/tracks/service-provider-routing-switching/jncis-sp.html)
- Curriculum grep (0 hits outside career stages) for: routing-instance, policy-statement, martian, RIB group, filter-based forwarding, redundant trunk group/RTG, Virtual Chassis, GRES, VSTP, traceoptions, J-Web, rescue config, login class. "commit confirmed" appears only in the capstone `20/08`. "routing engine/PFE" has 1 hit outside the core stages. Junos appears as a name in `15/02`, `15/03` and `13/04` only — [curriculum materi/](/home/vi/Projects/networking/materi/)
- Junos-related concepts that the curriculum does cover vendor-neutrally:
  - control/data/management plane (`04/05`)
  - firewall filter concept (`09/02`, `09/03`, MikroTik `19/03`)
  - uRPF (several modules)
  - DHCP snooping, DAI, storm control (`12/02`)
  - MSTP mentioned (`03/04`)
  - QinQ mentioned (`03/01`)
  - IRB only in EVPN (`16/02`)
  - GRE/IPIP (`11/02`, `19/06`)
  - VRRP (`07/08`), BFD (`07/02`, `07/04`), ECMP (`07/04`, `07/06`)
  - aggregate route mentioned once (`04/05`)

### Inferences
- Add **one whole new module** (or a short stage, e.g. `23-juniper` or `19b`), "Junos OS: arsitektur, CLI & commit model" (architecture, CLI and commit model). It would cover:
  - RE/PFE, transit vs exception traffic
  - candidate/active config, `commit check/confirmed/and-quit`, `rollback n`, rescue config, `load merge/override/replace`, `show | compare`, `| display set`
  - configuration groups, login classes and authentication order, J-Web
  - root password recovery and software upgrade
  - routing tables inet.0/inet6.0/mpls.0/inet.3, route preference vs Cisco AD
  - routing-instances (virtual-router/VRF), static/aggregate/generated routes, martians, RIB groups
  - routing policy (`policy-statement`, terms, from/then, default policies per protocol, import/export chains)
  - firewall filters (terms, implicit discard, `filter input/output`, lo0 filter, uRPF)
  - It should also extend the existing Cisco↔MikroTik↔Linux equivalence table to Junos.
- JNCIS-level concept gaps overlap with SPCOR (IS-IS, MPLS RSVP/LDP/SR) and should share the SP stage proposed in Section 1. JNCIS-ENT-only gaps (RTG, Virtual Chassis, GRES/NSR/NSB/ISSU, filter-based forwarding, VSTP, MACsec, IP source guard detail) are best handled as a "Junos HA & L2" section of the Junos module, plus an "HA platform features" section in `07/08` or `17/01`.

### Gaps
- Juniper's pages do not state the release date of JN0-106 or JN0-352, so I could not determine whether newer codes are planned. JNCIS-SP uses Junos OS 25.2, which suggests that blueprint was refreshed recently. I found no retirement announcement.

---

## 4. MikroTik advanced tracks (MTCRE, MTCINE, MTCTCE, MTCUME, MTCWE, MTCSE, MTCIPv6E): outline topics missing beyond stage 19

### Takeaway
Stage 19 plus the "MikroTik RouterOS" subsections across the curriculum cover MTCNA and parts of MTCRE, MTCTCE and MTCUME. The clearest gaps are:
- **MTCINE**: MPLS/LDP/VPLS/L3VPN/TE on RouterOS — whole module missing
- **MTCRE**: OSPF on RouterOS v7, and routing marks/VRF policy in v7 syntax — depth
- **MTCTCE**: packet-flow diagram, HTB internals, SFQ/RED queue types, web proxy — missing sections
- **MTCUME**: PPP profile depth, L2TP/BCP/MLPPP, User Manager/RADIUS incoming — shallow
- **MTCSE**: RAW table, port knocking, certificates on RouterOS — partial
- **MTCIPv6E**: RouterOS IPv6 tunnels and PD server, plus RouterOS IPv6 feature gaps
- **MTCWE**: legacy wireless (WDS/HWMP/Virtual-AP)

All official outlines are 2011–2020 vintage and predate RouterOS v7, so the curriculum should teach the topics with v7 syntax rather than copy the outlines.

### Cited Findings
- MikroTik's training page links outlines for MTCNA, MTCRE, MTCINE, MTCTCE, MTCUME, MTCWE, MTCSE, MTCIPv6E, **MTCEWE and MTCSWE** — [MikroTik training page](https://mikrotik.com/training/about). The curriculum's `18/05` track diagram omits MTCEWE (Enterprise Wireless) and MTCSWE (Switching) — [curriculum 18/05](/home/vi/Projects/networking/materi/18-karier-sertifikasi/05-peta-mikrotik.md)
- Outline dates (version note): MTCRE last edited July 10, 2015; MTCINE Feb 2, 2012; MTCTCE May 10, 2011; MTCUME May 10, 2011; MTCWE Mar 16, 2011; MTCSE Mar 22, 2019; MTCIPv6E Aug 26, 2016; MTCSWE Feb 19, 2020; MTCEWE Mar 10, 2020 — [MTCRE](https://i.mt.lv/cdn/training_pdf/mtcre_outline_2019181161836.pdf), [MTCINE](https://i.mt.lv/cdn/training_pdf/mtcine_outline_2020154114220.pdf), [MTCTCE](https://i.mt.lv/cdn/training_pdf/mtctce_outline_2020154113204.pdf), [MTCUME](https://i.mt.lv/cdn/training_pdf/mtcume_outline_2019181161836.pdf), [MTCWE](https://i.mt.lv/cdn/training_pdf/mtcwe_outline_2019181161836.pdf), [MTCSE](https://i.mt.lv/cdn/training_pdf/mtcse_outline_2019181161836.pdf), [MTCIPv6E](https://i.mt.lv/cdn/training_pdf/mtcipv6e_outline_2019181161836.pdf), [MTCSWE](https://i.mt.lv/cdn/training_pdf/mtcswe_outline_202083141326.pdf), [MTCEWE](https://i.mt.lv/cdn/training_pdf/mtcewe_outline_202083141141.pdf)

**MTCRE** ([outline](https://i.mt.lv/cdn/training_pdf/mtcre_outline_2019181161836.pdf))
- Outline modules:
  - **Static routing**: more-specific routes, ECMP, forcing gateway over an interface, gateway reachability check and distance, routing mark and route policy, recursive next-hop with scope/target-scope
  - **Point-to-point addressing**
  - **VPN**: IPIP, EoIP, PPTP, SSTP, L2TP, PPPoE; VLAN, QinQ, switch-chip VLAN
  - **OSPF**: LSA types, areas, router types, DR/BDR, type1/type2 external, cost and interface types (broadcast, NBMA), SPT, stub/NSSA/area ranges, virtual links, OSPF routing filters
- Curriculum: check-gateway and target-scope are covered (`07/01`, `04/05`, `19/01`). ECMP is covered. Routing mark/routing-table has only 2 files (`04/05`, `19/03`). SSTP/L2TP/IPIP/EoIP are covered (`11/02`, `19/06`). QinQ appears in only 1 file (`03/01`), not in `19/02`. OSPF on RouterOS: `07/04` has a MikroTik section with v7 instance/template hits (2 files). **There is no stage-19 OSPF module**, and RouterOS routing filters appear only in `07/06` and `19/01`.

**MTCINE** ([outline](https://i.mt.lv/cdn/training_pdf/mtcine_outline_2020154114220.pdf))
- Outline:
  - **BGP**: AS, path vector, iBGP/eBGP, private AS removal, multihop/loopback, filters, best path, attributes, route reflectors and confederations
  - **MPLS**: static labels, LDP, PHP, MPLS traceroute, LDP-based VPLS, bridge split horizon, VPLS control word, L2MTU and MPLS fragmentation, BGP-based VPLS, VRF and route leaking, BGP L3VPN, OSPF as CE-PE
  - **Traffic engineering**: RSVP, static/dynamic path (CSPF), bandwidth allocation
- Curriculum: BGP on MikroTik is covered (`07/06` MikroTik section, v7 `bgp connection`/template 1 hit). MPLS is mentioned in 27 files, but RouterOS MPLS configuration is absent: VPLS appears once (`03/06`), LDP once (`11/01`), PHP only in `11/01`, and TE/RSVP only conceptually (`11/01`). There is no `/mpls` configuration → **whole module missing**.

**MTCTCE** ([outline](https://i.mt.lv/cdn/training_pdf/mtctce_outline_2020154113204.pdf))
- Outline: **packet flow diagram**; firewall filter/NAT/mangle with all actions, NAT helpers and UPnP; **HTB** (queue tree, structure, dual limitation, priority), burst; **queue types FIFO, SFQ, RED, PCQ**, queue size, simple queue and queue tree interaction; DNS cache; DHCP (options, relay); **web proxy** (rule/access/direct/cache lists, regex)
- Curriculum: "packet flow" has **0 hits**. HTB appears in 4 files (`11/03`, `13/04`, padanan), but not as RouterOS HTB internals (dual limitation, priority 1–8, parent/child) in `19/04`. **SFQ 0 hits.** Queue types are mentioned in `19/04`. UPnP is covered (`09/01`). Web proxy appears in only 1 file outside the core stages → **missing**.

**MTCUME** ([outline](https://i.mt.lv/cdn/training_pdf/mtcume_outline_2019181161836.pdf))
- Outline:
  - **PPP profile**: local/remote address, filters, address list, change TCP-MSS, encryption, session timeout, rate-limit, only-one; PPP secret limit bytes
  - **PPTP/L2TP** client/server
  - **PPPoE** (incl. securing the server by removing IP from the interface, interface ECMP)
  - **L2TP+EoIP / L2TP+VPLS / L2TP+BCP bridging; MLPPP/MRRU**
  - **IPsec** peers/proposals/policies/NAT-T/DPD/PFS
  - **HotSpot** login methods (HTTP CHAP/PAP, MAC, cookie, HTTPS, trial, RADIUS), user limits, profiles, walled garden, **IP binding**, customization
  - **RADIUS client and User Manager**, RADIUS incoming
- Curriculum: PPP profile/secret are covered (`19/06`, `11/02`, `lab/06`). Walled garden is covered (`19/04`). **IP binding 0 hits. MLPPP/multilink 0. BCP (PPP Bridging Control Protocol) 0 relevant hits** (hits are BGP "BCP" best practice). **User Manager has 1 hit (`12/04`).** RADIUS incoming/CoA for MikroTik is not found specifically → **missing section: "RouterOS AAA: RADIUS, User Manager v7, CoA"**.

**MTCWE** ([outline](https://i.mt.lv/cdn/training_pdf/mtcwe_outline_2019181161836.pdf))
- Outline: wireless tools (scan, frequency usage, spectral scan, snooper, align, sniffer); troubleshooting (registration table, ack-timeout/distance, CCQ, signal, data rates); advanced settings (HW-retries, HW-protection, adaptive noise immunity, WMM, country, TX power, **Virtual-AP**); 802.11n; security (access/connect lists, RADIUS, EAP, management frame protection); **WDS and HWMP+ mesh**; transparent bridging (WDS, station-WDS, pseudobridge, MPLS/VPLS); **Nstreme and Nv2**
- Curriculum: Nstreme and Nv2 are covered (`19/05`, `10/04`). Spectral is covered. CCQ is covered (`10/02`, `10/04`). WDS is present (`10/02`, `19/05`). **HWMP 0 and Virtual-AP 0.** The new `/interface wifi` (wifiwave2/wifi-qcom) package is mentioned in 3 files (`10/03`, `10/04`, `19/05`).

**MTCSE** ([outline](https://i.mt.lv/cdn/training_pdf/mtcse_outline_2019181161836.pdf))
- Outline: **RAW table** and SYN-flood mitigation with RAW; default config; management-access best practices; bridge filter; ICMP filtering; **MNDP attacks**; DHCP rogue/starvation; TCP SYN, UDP and Smurf attacks; brute-force prevention; port-scan detection; cryptography and PKI; **certificates in RouterOS** (self-signed, free valid certificates); **port knocking**; secure HTTPS/SSH/WinBox; SSH tunneling; L2TP+IPsec; SSTP with certificates
- Curriculum: SYN flood is covered (`09/03`, `12/03`, `13/03`). MNDP is covered (`03/06`, `19/01`). The raw table appears in generic/Linux context (`09/03`, `12/05`, `13/03`); RouterOS `/ip firewall raw` usage should be verified in `19/03`. **Port knocking 0 hits.** ACME/Let's Encrypt is covered generically (`06/04`), but RouterOS certificate workflows are not found.

**MTCIPv6E** ([outline](https://i.mt.lv/cdn/training_pdf/mtcipv6e_outline_2019181161836.pdf))
- Outline: addressing; SLAAC/DHCPv6; NDP; header, next-header, fragmentation, PMTUD; ICMPv6/RA flags M/O, MLD, temporary addresses, IPsec AH/ESP; transitions (dual stack, 6to4, 6RD, Teredo, DS-Lite); **IPv6 pool, DHCP-PD server/client**; **IPIPv6, EoIPv6, GRE6**; RouterOS IPv6 features not yet available (NAT, HotSpot, RADIUS, policy routing, DHCPv6 server)
- Curriculum: `08/01-03` cover addressing, NDP, SLAAC, DHCPv6, PD, RA flags, temporary addresses, 6to4/6RD/Teredo/DS-Lite and FHS, each with a MikroTik subsection. **IPIPv6/EoIPv6/GRE6 0 hits.** MLD appears only in 2 files as a mention (`01/02`, `03/01`). The RouterOS v7 IPv6 feature matrix is not covered.

**MTCSWE / MTCEWE** (not in the assignment, but listed on the official page)
- MTCSWE covers:
  - L2MTU/jumbo, 802.1ad QinQ with bridge VLAN filtering
  - MAC-based and protocol-based VLANs
  - **MSTP regions/CIST**
  - bonding modes
  - bridge horizon/port isolation
  - 802.1p L2 QoS and switch-chip limiting
  - **IGMP snooping, DHCP snooping, loop protect, storm control, switch ACL, 802.1X**
  - PoE priority/monitoring
  - port mirroring
  - **SwOS**
  - Source: [MTCSWE outline](https://i.mt.lv/cdn/training_pdf/mtcswe_outline_202083141326.pdf)
- MTCEWE covers RF and antenna theory, roaming, airtime, 802.11 standards/MCS/MU-MIMO, country/regulatory/DFS on CAPsMAN, and 60 GHz Wireless Wire — [MTCEWE outline](https://i.mt.lv/cdn/training_pdf/mtcewe_outline_202083141141.pdf)
- Curriculum: `19/02` (172 lines) covers bridge, hardware offload, bridge VLAN filtering and STP. **QinQ, MSTP regions, switch-chip ACL, DHCP snooping on CRS, port isolation via bridge horizon, PoE management and SwOS are not in stage 19** (netinstall also has 0 hits).

**Stage-19 depth signal**: stage-19 modules are short. `19/02` is 172 lines, `19/03` 239, `19/04` 207, `19/05` 197, `19/06` 193 and `19/07` 220, compared with 600–780 lines for core modules such as `07/04` OSPF (738) and `07/06` BGP (784) — [curriculum materi/](/home/vi/Projects/networking/materi/) (`wc -l`).

### Inferences
- Missing stage-19 modules, in priority order for the Indonesian ISP market:
  1. `19-08 MikroTik Routing Lanjutan` (advanced routing; MTCRE): OSPF v7 instance/area/interface-template, routing tables and VRF in v7, routing filters v7 syntax, recursive/scope, ECMP, PCC load-balance and failover
  2. `19-09 MikroTik MPLS & BGP ISP` (MTCINE): LDP, PHP, VPLS (LDP and BGP signalled), L2MTU, VRF/L3VPN, RSVP-TE, BGP v7 templates/RR
  3. `19-10 MikroTik AAA & User Management` (MTCUME): RADIUS client, User Manager v7, CoA/RADIUS incoming, PPP profile depth, HotSpot IP binding and login methods, L2TP/BCP/MLPPP
  4. `19-11 MikroTik Switching (CRS/SwOS)` (MTCSWE): QinQ, MSTP, switch-chip ACL, DHCP snooping, port isolation, PoE, SwOS
- Missing sections inside existing modules:
  - `19/03`: packet-flow diagram, RAW table, port knocking, certificates, NAT helpers
  - `19/04`: HTB internals, queue types SFQ/RED/PCQ, web proxy
  - `19/05`: Virtual-AP, WDS/HWMP mesh, v7 `wifi` package/CAPsMAN v7
  - `08/03` MikroTik section: IPIPv6/EoIPv6/GRE6
- `18/05` should add MTCSWE and MTCEWE to the track diagram, and note that the outlines are pre-v7.

### Gaps
- MikroTik does not publish exam objectives separately from training outlines, and I found no newer (RouterOS v7-era) outlines on the official page as of Oct 2026. Whether the trainers' current material uses v7 syntax could not be verified from primary sources.

---

## 5. Gap classification (whole module / section / depth) and ranking

### Takeaway
Ranked by exam weight × real-world relevance (Indonesian ISP/enterprise market):
1. SP core (IS-IS / MPLS / SR / L2VPN): new stage
2. Junos module: new module
3. Cisco SD-Access + Catalyst SD-WAN: new module
4. Software dev + Cisco platform APIs for CCNA Automation: 2 new modules
5. MikroTik advanced routing / MPLS / AAA / switching: 4 new stage-19 modules
6. Network+ DR and physical installation: new sections, plus fixing the wrong weights in `18/03`
7. ENCOR/ENARSI feature-level gaps (wireless join/roaming/tags, SPAN, conditional debug, EEM, TCAM, PTP, SSO, time-based ACL, BGP 4-byte AS/peer groups, NETCONF enablement): sections

### Cited Findings
- SPCOR "MPLS and Segment Routing" is 20% and "Services" is 20% of the exam, while "Networking" (IS-IS/OSPF/BGP/HA) is 30% — [SPCOR transcription](https://github.com/oicnanev/CiscoCertifications/blob/main/CCNP/CCNP-Service-Provider.md). IS-IS, MPLS (RSVP, LDP, SR) and HA also appear in JNCIS-SP — [Juniper JNCIS-SP](https://www.juniper.net/us/en/training/certification/tracks/service-provider-routing-switching/jncis-sp.html). MPLS/VPLS/TE appear in MTCINE — [MTCINE outline](https://i.mt.lv/cdn/training_pdf/mtcine_outline_2020154114220.pdf). One SP stage would therefore serve three vendors' blueprints.
- IS-IS appears in JNCIS-ENT ("IS-IS ... Levels and areas, DIS, Metrics") as well as JNCIS-SP and SPCOR 2.1 — [Juniper JNCIS-ENT](https://www.juniper.net/us/en/training/certification/tracks/enterprise-routing-switching/jncis-ent.html)
- CCNA Automation domains 1.0 (15%), 3.0 (15%) and 4.0 (15%) are mostly absent from the curriculum, about 45% of the exam weight, while 5.0/6.0 (35%) are mostly covered — [CCNAAUTO v1.1 PDF](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-901-CCNAAUTO_v.1.1.pdf)
- ENCOR Architecture (15%) contains 1.3 SD-WAN and 1.4 SD-Access, and Automation (15%) contains 6.4 "APIs for Cisco DNA Center and vManage" — [ENCOR transcription](https://github.com/alcancil/Cisco/blob/main/CCNP%20350-401%20ENCOR/Blueprint/encor_v11.md)
- Network+ Troubleshooting is 24% and Operations is 19% (DR is objective 3.3) — [CompTIA Network+ page](https://www.comptia.org/en-us/certifications/network/)

### Inferences

Ranked gap list. Format: rank. gap — type — target location — exam objectives — rationale.

1. **Service-provider core** — WHOLE MODULE SET (new stage `22-service-provider`, about 6 modules)
   - Target modules: IS-IS; MPLS LDP and L3VPN in depth (RD/RT/MP-BGP VPNv4, Inter-AS/CSC overview); MPLS TE and Segment Routing (RSVP-TE, FRR, SR-MPLS, SRv6, TI-LFA, Flex-Algo, PCE); L2VPN and Carrier Ethernet (VPWS/VPLS/EVPN-MPLS, E-Line/E-LAN/E-Tree, 802.1ad/ah, G.8032, CFM/Y.1731); SP HA and BGP scale (GR/NSF/NSR, BFD, Add-Path, BGP PIC, RR); SP security and automation (LPTS/CoPP, flowspec, RTBH, RPKI; IOS XR, NSO, Secure ZTP, gNMI dial-out)
   - Objectives: SPCOR 1.2–1.7, 2.1, 2.4.g–h, 2.8, 3.1–3.3, 4.1–4.2, 5.3, 5.6–5.7; JNCIS-SP MPLS/IS-IS/HA; JNCIS-ENT IS-IS/HA; MTCINE
   - Rationale: highest cross-exam weight; core to Indonesian ISPs/telcos.
2. **Junos OS** — WHOLE MODULE (new, e.g. `23-juniper/01-junos-dasar`, optionally `/02-junos-routing-policy-ha`)
   - Objectives: JNCIA-Junos, all six Junos-specific domains; JNCIS-ENT protocol-independent routing, RTG, Virtual Chassis, GRES/NSR/NSB/ISSU, filter-based forwarding, VSTP
   - Rationale: zero current coverage; Juniper is common in Indonesian carriers and data centers.
3. **Cisco SD-Access and Catalyst SD-WAN** — WHOLE MODULE (`16/07`)
   - Objectives: ENCOR 1.3, 1.4, 2.3.a (LISP), 4.5, 6.4; ENARSI 4.7 (assurance); CCNAAUTO 3.2 (Catalyst Center, Catalyst SD-WAN APIs)
   - Rationale: 15% Architecture plus parts of Automation.
4. **CCNA Automation software-dev and Cisco APIs** — TWO MODULES (`15/05` software development for network engineers, `15/06` Cisco platform APIs)
   - Objectives: CCNAAUTO 1.3–1.8, 2.2–2.3, 2.8, 3.1–3.9, 4.1–4.8, 4.11–4.12, 5.6 (NSO), 5.12–5.14
   - Rationale: about 45% of that exam is missing.
5. **MikroTik advanced** — FOUR MODULES plus sections
   - Modules: `19/08` routing v7 (MTCRE), `19/09` MPLS/BGP ISP (MTCINE), `19/10` AAA/User Manager/RADIUS (MTCUME), `19/11` CRS switching/SwOS (MTCSWE)
   - Sections: `19/03` packet flow, RAW, port knocking, certificates (MTCTCE/MTCSE); `19/04` HTB internals, SFQ/RED, web proxy (MTCTCE); `19/05` Virtual-AP, HWMP, v7 wifi (MTCWE/MTCEWE); `08/03` IPIPv6/EoIPv6/GRE6 (MTCIPv6E)
   - Rationale: the curriculum's stated Indonesian ISP/RT-RW-Net focus (`18/05`).
6. **Network+ operations** — SECTIONS
   - (a) DR and continuity in `17/02` or a new `17/05`: N10-009 3.3
   - (b) physical installation and environment in `02/02`: 2.4
   - (c) lifecycle/asset documentation in `17/03`: 3.1
   - (d) PTP/NTS in `06/05`: 3.4
   - (e) vocabulary additions: cloud attributes in `16/04` (1.3); plenum (1.5); WoL (2.2); rootkit/logic bomb (4.2); geofencing/GDPR/data locality (4.1); toner/Wi-Fi analyzer/port mirroring in `14/02` (5.5, 3.2)
   - Plus a **correction to `18/03`**: weights 23/20/19/14/24, and remove the false DR and physical mappings.
7. **ENCOR/ENARSI feature gaps** — SECTIONS/DEPTH
   - `10/04`: AP discovery/join and WLC selection (ENCOR 3.3.c), L2/L3 roaming and mobility anchor (3.3.d), 9800 policy/site/RF tags (3.3.f), location services (1.2.b)
   - `03/02`: TCAM and adjacency table (1.6)
   - `14/02`: SPAN/RSPAN/ERSPAN config (4.3) and conditional debug (4.1, ENARSI 4.3)
   - `06/05`: PTP (3.4.a)
   - `17/01` or `07/08`: SSO/NSF (1.1.b)
   - `15/02`: IOS XE NETCONF/RESTCONF enablement (4.6)
   - `15/03`: EEM applet (6.6)
   - `15/04`: agent vs agentless (Chef/Puppet/Salt) (6.7)
   - `12/04`: MAB/WebAuth/TrustSec/MACsec depth (5.4–5.5)
   - `07/06`: 4-byte AS and peer groups (ENARSI 1.11.b)
   - `09/02`: time-based ACL (ENARSI 3.2.a)
   - `14/03`: NetFlow v5 vs v9 (ENARSI 4.6)
   - Verify depth: DMVPN phases in `11/02` (ENARSI 2.3); MST config in `03/04` (ENCOR 3.1.c)
8. **CCNA v1.1** — MAPPING FIXES ONLY in `18/02`: 2.1.c → `03/03` and `lab/02`; 4.4/4.5 → add `06/05`.

### Gaps
- The ranking is a judgment that combines published domain weights with relevance to the Indonesian market. I found no published Indonesian job-market data in this session to weight vendors (Cisco vs Juniper vs MikroTik), so the order of items 1, 2 and 5 is an inference.
- Coverage was determined by term grep plus heading reads, not a full read of every module. "Shallow" judgments for DMVPN, MST, MPLS L3VPN and REST API security should be confirmed by a human pass.
