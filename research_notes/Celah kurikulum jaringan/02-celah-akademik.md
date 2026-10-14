# Academic gaps: what top university networking courses and standard textbooks teach that the curriculum does not

Scope note: WebSearch was unavailable. All findings come from direct fetches of course pages, publisher and author TOC pages, archived pages on web.archive.org, and the GitHub API. Curriculum coverage was checked by grepping `/home/vi/Projects/networking/materi/` and reading the matching passages, not just by counting keyword hits. "Curriculum" means the module set listed in `00-kerangka-kurikulum-saat-ini.md`.

Some course sites could not be reached. Berkeley's `inst.eecs.berkeley.edu/~cs168/fa24` sits behind CalNet login, but the public `sp25.cs168.io` mirror worked. CMU's `cs.cmu.edu` returned HTTP 503, so CMU material comes from the course's GitHub org. Princeton's `cs.princeton.edu` refused connections (curl code 000), so Princeton material comes from the public assignments repo. MIT's 6.829 page says it moved to Canvas, which requires login, so MIT material comes from 6.1800 and the old 6.829 OCW page.

---

## Q1. What do the top courses cover, and what is missing from the curriculum?

### Takeaway
All the courses build the same "first principles" core: layering and the end-to-end argument; reliability built on an unreliable channel; routing algorithms (distance-vector and link-state) studied as algorithms, plus BGP as policy; router internals; congestion-control theory and fairness; DNS/HTTP/CDN/video at scale; data centers with SDN; wireless and cellular. The Indonesian curriculum covers almost every topic by name, usually at configuration or intuition level. What it lacks is the analytical layer (queueing math, the theory of reliable transfer, fairness, policy-routing theory, CRC math) and, above all, any "build the protocol yourself" programming work. The biggest gaps are reliable-data-transfer principles plus a TCP implementation lab, queueing models such as Little's law, router forwarding internals and LPM data structures, measurement methodology, video streaming/ABR, programmable data planes (P4), and cellular architecture.

### Cited Findings

**Stanford CS144 (Keith Winstein; Fall 2026 current, Winter 2025 archived)**
- Fall 2026 lecture topics posted so far: "Datagrams, encapsulation, and multiplexing", "Reliability from unreliability", "TCP I", "TCP Particulars", "Packet Switching I". Optional texts: Saltzer & Kaashoek "Principles of Computer System Design" ch. 7–8, Kurose & Ross, Peterson & Davie. — [CS144 Fall 2026](https://cs144.github.io/)
- Winter 2025 lecture sequence: Datagrams/encapsulation/multiplexing → Reliability from unreliability → Service abstractions → Packet switching → "Why Congestion Control?" → "How Congestion Control" → "The eras tour of home networking" → "Eras beyond 8 (NAPT traversal)" → Routing → "Elastic Buffers" → Security. — [CS144 Winter 2025 (archived)](https://web.archive.org/web/2025060100000/https://cs144.github.io/)
- In Fall 2026, labs carry 38% of the grade (20% correctness and 18% subjective, best 6 of 8 checkpoints, and the last checkpoint is mandatory). — [CS144 Fall 2026](https://cs144.github.io/)

**UC Berkeley CS168 (Spring 2025 public site; course moved to fa26.cs168.io)**
- Lecture list: (1) Layers of the Internet, (2) Design Principles, (3) Links, (4) Routing Principles, (5–6) Distance-Vector, (7) Link-State & Addressing, (8) Routers, (9–10) BGP I/II, (11–12) TCP I/II, (13–15) Congestion Control I/II, (16) DNS, (17) HTTP, (18) Ethernet & STP, (19–20) ARP, DHCP, NAT, TLS, (21) Datacenter Topology, (22) Datacenter Routing, (23) SDN and Host Networking, (24) Multicast, (25) Collectives, (26) Wireless, (27) Cellular. — [CS168 Sp25](https://sp25.cs168.io/)
- The free online textbook has chapters on "throughput-model", "cc-issues", "router-based-cc", "datacenter-cc", "datacenter-addressing", "virtualization", "collective-operations", "collective-implementations", "host-networking", "cellular", and "end-to-end". — [CS168 Sp25 reading links](https://sp25.cs168.io/) (links to textbook.cs168.io)
- Projects: Project 1, traceroute (1A basic, 1B error handling); Project 2, distance-vector routing; Project 3, transport. — [CS168 Sp25](https://sp25.cs168.io/)

**MIT 6.1800 (Spring 2026), which replaced 6.033 and includes a networking unit**
- Networking unit: "Intro to networking and layering", "Network Layer: Routing", "BGP, RON", "Transport Layer: TCP", "In-network Resource Management", "Application Layer", "Datacenters and Clouds". Security unit: "Secure Channels", "ToR", "Network Attacks". — [MIT 6.1800](https://web.mit.edu/6.1800/www/)
- Assigned papers include "Ethernet", "RON" (resilient overlay networks), "DCTCP", "End-to-end Arguments", and "The Tail at Scale". Recitation 6 is "DCTCP, TCP, Queues practice". — [MIT 6.1800](https://web.mit.edu/6.1800/www/)
- The 6.829 page now reads only "We have moved to Canvas" (login required). The 2002 OCW version states its goal as teaching "the design, implementation, analysis, and evaluation of large-scale networked systems" and asks "what are the design principles… In what ways are these design principles compromised in practice?" — [6.829 page](https://web.mit.edu/6.829/www/currentsemester/); [6.829 OCW syllabus](https://ocw.mit.edu/courses/6-829-computer-networks-fall-2002/pages/syllabus/)

**CMU 15-441/641 (Fall 2025, Prof. Justine Sherry)**
- Course description: "routing, congestion control, internetworking, naming, the web and content distribution, video streaming, and network security". The goal is for students to learn "why they are designed the way they are and how they are likely to evolve". Three multi-checkpoint projects (P1–P3), HW0–HW5, two midterms. — [CMU 15-441 Fa25 site source](https://github.com/computer-networks/15-441-fa25)
- Projects: P1 "Mixnet" in C/cmake; P2 "TCP in the Wild", where students write the TCP backend ("state machine, timeouts, retransmissions, buffering, congestion control") and run experiments on AWS; P3 "CMU-Tube", which in earlier years had an "Adaptive Bitrate Proxy" checkpoint and a "Load Balancer" checkpoint. — [cmu-mixnet](https://github.com/computer-networks/cmu-mixnet); [cmu-tcp](https://github.com/computer-networks/cmu-tcp); [cmu-tube](https://github.com/computer-networks/cmu-tube); [cmu-abr-proxy](https://github.com/computer-networks/cmu-abr-proxy); [cmu-load-balancer](https://github.com/computer-networks/cmu-load-balancer)

**Princeton COS 461 (public assignments repo; course site unreachable)**
- Assignments: (1) VM setup and sockets, (2) "TCP Congestion Control and Bufferbloat", (3) "Passive Network Measurement", (4) "Network Security – Portscan", (5) "HTTP Proxy". — [COS461-Public README](https://github.com/feamster/COS461-Public)
- Assignment 2 ships `monitor.py`, `plot_cwnd.py`, `plot_qsize.py`, `plot_ping.py`, and a Jupyter notebook, so students plot cwnd, queue size, and RTT as they change buffer sizes. — [COS461 assignment2 tree](https://github.com/feamster/COS461-Public/tree/master/assignments/assignment2)

**Checking the curriculum against these topics (verified by reading the matching passages)**
- **End-to-end principle: present but shallow.** It is a single line in 00.4 ("kecerdasan di ujung (host), jaringan di tengah dibuat sederhana"), cited via RFC 1958 in 01.2, and used in 09.1 to note that NAT breaks it. None of the following appear: the Saltzer–Reed–Clark argument itself (the careful file-transfer example), fate-sharing, or how middleboxes, QUIC encryption, and CDNs bend the principle. — `materi/00-fondasi/04-sejarah-dan-standar.md:45`, `materi/01-model-referensi/02-tcp-ip.md:285`, `materi/09-nat-acl-firewall/01-nat.md:28`
- **Routing algorithms: intuition only.** 07.2 has a four-step "Dijkstra — intuisi" pseudocode, names Bellman-Ford in a table, and has a worked R1–R2–R3 count-to-infinity example with split horizon and poison reverse. It has no worked Dijkstra or Bellman-Ford table, no proof or argument for why DV converges or loops, no link-state transient loops or microloops, and no implementation. — `materi/07-routing-lanjutan/02-konsep-routing-dinamis.md:56,78,197`
- **BGP policy theory: missing.** "Gao", "valley-free", and customer/provider/peer export rules all return zero hits. Hijack and route leak are covered in 07.6. — grep of `materi/`; `materi/07-routing-lanjutan/06-bgp.md:429,435`
- **Queueing theory, Little's law, statistical multiplexing: missing.** Zero hits for "Little", "M/M/1", "queueing theory", "Kleinrock", and "statistical multiplex". 00.3 describes queuing delay only qualitatively ("Antrean kosong → queuing delay ≈ 0 / Antrean penuh → … tail drop"). — `materi/00-fondasi/03-sinyal-bandwidth-latency.md:196-200`
- **Reliable data transfer principles (stop-and-wait, Go-Back-N, Selective Repeat): missing.** Zero hits for Go-Back-N and Selective Repeat. 05.2 does cover TCP RTO = SRTT + 4×RTTVAR, exponential backoff, fast retransmit, SACK, and sliding-window flow control. — `materi/05-transport/02-tcp.md:182,242-260`
- **Error detection math: missing.** CRC appears only as an FCS field ("CRC-32 dari seluruh frame") and as an interface error counter used in troubleshooting. Zero hits for "polynomial", "Hamming", and parity math. — `materi/03-data-link/01-ethernet-frame-mac.md:63`
- **Data-center transport: one table row.** DCTCP appears only in a comparison table ("Butuh dukungan switch ECN") and in a tip. Incast and the ECN marking-threshold mechanism are not explained. Collectives and all-reduce (AI clusters) get zero hits. RDMA/RoCE/PFC get a short mention in 16.3 and 03.1. — `materi/05-transport/04-congestion-control.md:185,203`; `materi/16-datacenter-cloud-sdn/03-storage-virtualisasi.md:146-148`
- **Programmable data planes / P4: missing.** All "P4" hits are incident-priority labels (P1–P4). OpenFlow appears only in CCNA-level SDN text in 15.1 and 16.6. eBPF/XDP appears only as Cilium in 16.5. — grep of `materi/`; `materi/16-datacenter-cloud-sdn/05-container-kubernetes.md:68-72`
- **Network verification: tool mention only.** Batfish is described in 12.6 ("menjawab pertanyaan tentang jaringan tanpa menyentuh perangkat") and listed in the further-reading file. There is no theory (data-plane verification, reachability analysis) and no lab. — `materi/12-keamanan/06-tools-keamanan.md:322`
- **CDN and DNS at scale: partly covered.** 06.3 has a CDN subsection showing the RTT effect (Jakarta→Virginia 250 ms vs. edge 5 ms). 06.1 has GeoDNS and Anycast DNS subsections and the root-server anycast count. Missing: how CDNs pick a server (DNS-based vs. anycast mapping), cache hierarchy, and hit-ratio economics. — `materi/06-aplikasi/03-http.md:462-468`; `materi/06-aplikasi/01-dns.md:629,646`
- **Video streaming / ABR / DASH: missing.** Every "ABR" hit refers to the OSPF Area Border Router. — grep of `materi/`
- **Cellular/5G architecture: missing.** 4G/5G appears only as an FWA access option and as an SD-WAN underlay in 11.1. There is no RAN, core (UPF/AMF), bearer, or mobility content. — `materi/11-wan-vpn/01-teknologi-wan.md:50,186`
- **Congestion-control fairness theory: missing.** "Fairness" appears only as Wi-Fi airtime fairness and in a note that BBR v1 is unfair to CUBIC. There is no AIMD convergence argument (Chiu–Jain), max-min fairness, or Mathis throughput model. BBR, CUBIC, ECN, bufferbloat, and CAKE/fq_codel are covered at a practical level. — `materi/10-wireless/02-802-11.md:122`; `materi/05-transport/04-congestion-control.md:150-185`; `materi/11-wan-vpn/03-qos.md:430-437`
- **Router internals: partly covered.** There is ASIC vs. CPU, control/data/management plane, RIB vs. FIB/CEF, and switch buffers and HOL blocking. TCAM, tries/LPM lookup structures, switching-fabric types, and input- vs. output-queued router architecture get zero hits. — `materi/03-data-link/02-switching.md:186,247,257`; `materi/04-network-layer/05-routing-dasar.md:315-325`
- **Data-center topology theory: thin.** Spine-leaf, ECMP, and oversubscription ratio are covered in 16.1. Clos appears only as a citation in 00.5. Fat-tree math and ECMP hash polarization are absent. — `materi/16-datacenter-cloud-sdn/01-desain-dc.md:36-69`; `materi/00-fondasi/05-topologi.md:439`
- **Socket programming: missing.** Zero hits for `import socket`, `socket.socket`, `SOCK_STREAM`. Python in 15.3 is automation-focused (Netmiko, NAPALM, Scapy). — grep of `materi/`
- **Anonymity (Tor) and multiple-access theory (ALOHA): missing.** Every "Tor/onion" hit refers to Security Onion. ALOHA has zero hits. — grep of `materi/`

### Inferences
- The curriculum is unusually broad for a practitioner course and already includes several "deep" items that CCNA material skips: BDP, Shannon/Nyquist, bufferbloat, BBR, QUIC HOL blocking, RTO formula, root-server anycast. The gap is not missing topic names. It is missing analytical depth and missing construction work.
- Every university course reviewed puts implementation at the center: CS144's 8 checkpoints carry 38% of the grade, CS168 has three projects, CMU has three multi-checkpoint projects, and COS461 has five assignments. The curriculum's labs are entirely configuration labs (Lab 00–06). This is the clearest dividing line between "understands networks" and "configures networks".
- MIT and Berkeley both treat "design principles" (layering, end-to-end, fate-sharing) as a full lecture with a primary-source reading. The curriculum treats them as a bullet point.

### Gaps
- Princeton COS 461 lecture schedule: the site was unreachable (connection refused), so only assignments were verified.
- CMU 15-441 lecture-by-lecture topics: cs.cmu.edu returned 503 and the GitHub site source has the description and due dates but not the lecture list.
- MIT 6.829 / 6.5820 current graduate syllabus: on Canvas behind login. The 6.5820 URL returned 404. The OCW version is from 2002.
- CS168 Fall 2026 site (fa26.cs168.io) was not fetched in detail. Sp25 was used as the most recent fully public schedule.

---

## Q2. Textbook chapter structures and sections with no curriculum counterpart

### Takeaway
Four textbooks were checked: Kurose & Ross 9e (2025), Peterson & Davie (6e online, 7e preview), Bonaventure CNP3 (3e, with 4e in progress), and Tanenbaum/Feamster/Wetherall 6e. All four have sections the curriculum lacks entirely: reliable-data-transfer protocol design (GBN/SR/RPC), error detection/correction math, multiple-access theory, router internals and packet scheduling, generalized match-action forwarding, routing-algorithm analysis, video streaming and CDNs, cellular/5G core and mobility, and delay-tolerant/performance-monitoring topics. Kurose 9e moved hardest toward CDNs/streaming, BBR, SDN (Google Orion), and a greatly expanded 5G chapter.

### Cited Findings

**Kurose & Ross, *Computer Networking: A Top-Down Approach*, 9th ed. (2025)**
- Chapter list from Pearson: 1 Computer Networks and the Internet; 2 Application Layer; 3 Transport Layer; 4 Network Layer: Data Plane; 5 Network Layer: Control Plane; 6 Link Layer and LANs; 7 Wireless and Mobile Networks; 8 Security. — [Pearson 9e page](https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000013385/9780135415603)
- Sections with no or only thin curriculum counterpart:
  - 1.4.2 "Queuing Delay and Packet Loss" (traffic-intensity analysis); 1.3.1–1.3.2 packet vs. circuit switching
  - 2.5 "Video Streaming and Content Distribution Networks" (2.5.2 HTTP Streaming and DASH, 2.5.3 CDNs, 2.5.4 Netflix/YouTube case studies); 2.6 Socket Programming with UDP/TCP/QUIC
  - 3.4 "Principles of Reliable Data Transfer" (3.4.3 Go-Back-N, 3.4.4 Selective Repeat); 3.6 "Principles of Congestion Control"; 3.7.4 Fairness
  - 4.2 "What's Inside a Router?" (input port processing, switching, output port, where queuing occurs, packet scheduling); 4.4 "Generalized Forwarding and SDN" (match, action, OpenFlow, middleboxes); 4.5 "Architectural Principles of the Internet"
  - 5.2 Routing Algorithms (LS/DV); 5.4.4 IP-Anycast; 5.4.5 Routing Policy; 5.5 SDN control plane
  - 6.2 Error-Detection and -Correction (parity, checksum, CRC); 6.3 Multiple Access protocols (channel partitioning, random access, taking turns, DOCSIS); 6.5.2 VXLANs; 6.7 "A Day in the Life of a Web Page Request"
  - 7.3.3 5G RAN; 7.3.5 Scheduling over RAN/WLAN; 7.4 5G Core, User-plane Function, registration and session establishment; 7.5 Mobility in WiFi and 5G; 7.6 Bluetooth, Satellite, IoT
  - 8.8.2 Authentication and Key Agreement in 5G
  
  — [Pearson 9e TOC](https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000013385/9780135415603)
- Programming work in 9e: "Socket Programming Assignments" (ch. 2), "Programming Assignments" (ch. 3), "Socket Programming Assignment 5: ICMP Ping" and "Programming Assignment: Routing" (ch. 5), "Programming Assignment: Implementing a 4G/5G RAN scheduler" (ch. 7). Wireshark labs exist for HTTP, DNS, TCP, UDP, IP, ICMP, Ethernet, WiFi, 4/5G, TLS, and IPsec. — [Pearson 9e TOC](https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000013385/9780135415603)
- The authors list what's new in 9e: "new material on content distribution networks and updated coverage of over-the-top streaming"; congestion control rebalanced toward "newer congestion control protocols (BBR in particular)"; "new material on SDN, including Google's Orion network control plane"; and ch. 7 "has undergone the most significant change", with expanded wireless physical layer, 5G RAN, link-layer scheduling, 5G Core "softwareization", and mobility. — [Kurose-Ross "What's new in 9e"](https://gaia.cs.umass.edu/kurose_ross/ninth.php)
- The authors' site provides free online lectures, PowerPoint slides, Wireshark labs, knowledge checks, interactive problems, and animations. — [Kurose-Ross author site](https://gaia.cs.umass.edu/kurose_ross/index.php)

**Peterson & Davie, *Computer Networks: A Systems Approach* (6e online, open source; 7e preview exists)**
- Chapters: 1 Foundation (1.5 Performance); 2 Direct Links (2.2 Encoding, 2.3 Framing, 2.4 Error Detection, 2.5 Reliable Transmission, 2.6 Multi-Access, 2.7 Wireless, 2.8 Access Networks); 3 Internetworking (3.4 Routing, 3.5 Implementation, "Virtual Networks All the Way Down"); 4 Advanced Internetworking (Global Internet, IPv6, Multicast, MPLS, Mobile routing); 5 End-to-End Protocols (UDP, TCP, 5.3 Remote Procedure Call, 5.4 RTP); 6 Congestion Control (6.1 Issues in Resource Allocation, 6.2 Queuing Disciplines, 6.3 TCP CC, 6.4 Advanced CC, 6.5 QoS, "Software-Defined Traffic Engineering"); 7 End-to-End Data (presentation formatting, multimedia); 8 Network Security; 9 Applications (traditional, multimedia, infrastructure, 9.4 Overlay Networks). — [book.systemsapproach.org](https://book.systemsapproach.org/)
- A 7th Edition preview is online. — [7e.systemsapproach.org](https://7e.systemsapproach.org/)
- License: the book repo's LICENSE is Creative Commons Attribution 4.0 International. — [SystemsApproach/book LICENSE](https://github.com/SystemsApproach/book)

**Bonaventure, *Computer Networking: Principles, Protocols and Practice* (CNP3, 3e; 4e in progress)**
- Part 1, Principles: "Connecting two hosts" (physical, datalink, framing, recovering from transmission errors, reliable data transfer over an imperfect link); "Building a network" (datagram vs. virtual circuit, computing forwarding tables, flat vs. hierarchical addresses, control plane, distance vector, link state); "Applications"; "Naming and addressing"; "Sharing resources" (sharing bandwidth, network congestion, distributing load, MAC algorithms including ALOHA/CSMA/CD/CA and deterministic MAC, congestion control with window-based transport); "Reference models"; "Network security". — [CNP3 3e](https://beta.computer-networking.info/syllabus/default/index.html)
- Part 2, Protocols: DNS, email, HTTP, HTTP/2, RPC, SSH, TLS, DNSSEC, UDP, TCP, congestion control, IPv6, routing (RIP/OSPF), BGP, LAN/WiFi. Part 3, Exercises: includes "Analyzing packet traces", "Inter-domain routing", "Exploring routing protocols", and an STP/VLAN lab. — [CNP3 3e](https://beta.computer-networking.info/syllabus/default/index.html)
- The 4th edition (Sept 2025) "starts from the protocols used by hosts and then describes how networks operate". The OER report describes "projects that enable students to create their own transport protocol, design campus networks, analyse and predict protocol fields". — [computer-networking.info](https://www.computer-networking.info/)
- License: the ebook repo README states files are "licensed under a Creative Commons Attribution-Share Alike 3.0 Unported License" (GitHub does not detect it automatically). — [cnp3/ebook README](https://github.com/cnp3/ebook)

**Tanenbaum, Feamster & Wetherall, *Computer Networks*, 6th ed.**
- Chapters: Introduction; Physical Layer (includes PSTN, Cellular Networks, Cable, Satellites, "Policy at the Physical Layer"); Data Link Layer ("Error Detection and Correction", "Elementary Data Link Protocols", "Improving Efficiency"); MAC Sublayer ("Channel Allocation Problem", "Multiple Access Protocols", Ethernet, WLAN, Bluetooth, DOCSIS, switching); Network Layer ("Routing Algorithms in a Single Network", "Traffic Management at the Network Layer", "Quality of Service and Application QoE", Internetworking, "Software Defined Networking", "Policy at the Network layer"); Transport ("Elements of Transport Protocols", Congestion Control, UDP, "TCP, QUIC, BBR", "Performance Monitoring", "Delay-Tolerant Networking"); Application (DNS, email, Web, HTTP/2, "Streaming Audio and Video", "Content Delivery Networks and Distributed Cloud Services"); Security. — [Pearson Tanenbaum 6e](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003195/9780137523214)

**Textbook sections with no curriculum counterpart (from the Q1 grep checks)**

| Textbook section | Curriculum status | Closest module |
|---|---|---|
| RDT principles / GBN / SR / "Elementary Data Link Protocols" (K&R 3.4, P&D 2.5, CNP3 "Connecting two hosts", Tanenbaum DLL ch.) | Absent (0 hits) | 05.2 |
| Queuing delay analysis / traffic intensity (K&R 1.4.2), performance (P&D 1.5) | Qualitative only | 00.3 |
| Error detection & correction math (K&R 6.2, P&D 2.4, Tanenbaum DLL) | CRC used only as a counter | 03.1 / 02.4 |
| Multiple access theory: ALOHA, taking turns (K&R 6.3, CNP3 "Sharing resources", Tanenbaum MAC) | CSMA/CD and CSMA/CA only | 03.1 / 10.2 |
| Router internals and packet scheduling (K&R 4.2, P&D 3.5) | ASIC/RIB/FIB only | 04.5 / 03.2 |
| Generalized forwarding / match-action (K&R 4.4) | OpenFlow name-drop only | 16.6 |
| Routing-algorithm analysis (K&R 5.2, Tanenbaum "Routing Algorithms in a Single Network") | Intuition plus one example | 07.2 |
| BGP routing policy (K&R 5.4.5, Tanenbaum "Policy at the Network layer") | Config-level policy only (route-maps) | 07.6 |
| Video streaming / DASH / CDN case studies (K&R 2.5, Tanenbaum app ch.) | CDN described, ABR absent | 06.3 |
| Socket programming (K&R 2.6) | Absent | 15.3 / lab |
| RPC as a transport pattern (P&D 5.3, CNP3 RPC) | gRPC named only | 06.3 |
| Overlay networks (P&D 9.4; MIT reading RON) | VXLAN/SD-WAN overlays only | 11.x / 16.2 |
| 5G RAN/Core/mobility (K&R 7.3–7.5, Tanenbaum "Cellular Networks") | FWA mention only | 10 / 11 |
| "A Day in the Life of a Web Page Request" (K&R 6.7) | **Covered**: 01.3 "Perjalanan Lengkap: Mengetik https://example.com" | 01.3 |
| Performance monitoring and delay-tolerant networking (Tanenbaum transport) | Monitoring yes (14.3); DTN absent | 14 |

### Inferences
- The curriculum's 01.3 end-to-end packet walk already matches K&R 6.7, and its BDP and Shannon coverage matches P&D 1.5 in spirit. These strengths can serve as anchors for the new analytical sections.
- Among textbook-only sections, two have the highest practical payoff for an Indonesian working engineer: video/CDN (OTT traffic dominates ISP and RT-RW-Net links) and cellular architecture (most branch and edge sites, including the final project's TPI sites, run on LTE).
- The open-licensed texts (P&D under CC BY 4.0, CNP3 under CC BY-SA 3.0) can be translated or adapted legally with attribution. CC BY-SA requires derivative material to carry the same license. Kurose and Tanenbaum are commercial and can only be cited as references.

### Gaps
- The exact 7e Peterson & Davie chapter changes were not extracted. The landing page was fetched, but its TOC was not compared against 6e.
- Tanenbaum 6e section numbers were not on the Pearson page; only section titles were available.
- Exact license terms for the Kurose-Ross Wireshark labs and slides on the author site were not verified.
- The license of the Berkeley CS168 online textbook (textbook.cs168.io) was not found on the fetched page.

---

## Q3. Programming labs that could be adapted, and their licenses

### Takeaway
The strongest adaptable lab sequences are:
- Stanford CS144: build a TCP/IP stack in 8 checkpoints, from byte stream through TCP to ARP and an IP router.
- Berkeley CS168: a traceroute project, a 10-stage distance-vector project covering split horizon, poison reverse, count-to-infinity, and triggered updates, and a transport project.
- Princeton COS461: a Mininet bufferbloat experiment, passive measurement, a port scanner, and an HTTP proxy.
- CMU 15-441: a TCP project, an ABR video proxy, and a load balancer.
- The P4 tutorials: 13 exercises.

Licensing is the constraint. Only P4 tutorials (Apache-2.0), Mininet (BSD-3), CMU's ABR proxy (Apache-2.0) and load balancer (MIT), and the open textbooks are clearly reusable. CS144, CS168, COS461, and most CMU starter code have no license or a bare copyright notice. The safe path is to write original Indonesian labs modeled on these designs and cite them as inspiration, not to copy the code.

### Cited Findings

**Stanford CS144: "Minnow" TCP/IP stack in C++**
- Checkpoints (Winter 2025): 0 "networking warmup"; 1 "stitching substrings into a byte stream"; 2 "the TCP receiver"; 3 "the TCP sender"; 4 "measuring the real world"; 5 "down the stack (the network interface)"; 6 "building an IP router"; 7 "putting it all together". — [CS144 Winter 2025 (archived)](https://web.archive.org/web/2025060100000/https://cs144.github.io/)
- Checkpoint 6: "implement an IP router on top of your existing NetworkInterface… forward the datagrams… according to the routing table". The handout notes "You will not need to implement the algorithms that make the routing table, e.g. RIP, OSPF, BGP" and expects about "30–60 lines of code", using longest-prefix match. — [CS144 check6.pdf (Winter 2024, archived)](https://web.archive.org/web/2025060100000/https://cs144.github.io/assignments/check6.pdf)
- Checkpoint 4 needs no code from the earlier labs. Students characterize at least three Internet paths (RTT >100 ms, or paths crossing Wi-Fi, cellular, or satellite) using `mtr`/`traceroute` and `ping -D -n -i 0.2` for at least an hour. They then compute overall delivery rate, the longest run of successes and the longest burst of losses, the autocorrelation of loss ("How independent or 'bursty' were the losses?"), and min/max RTT, and graph RTT over time. — [CS144 check4.pdf (Winter 2025, archived)](https://web.archive.org/web/2025060100000/https://cs144.github.io/assignments/check4.pdf)
- License: the `cs144/minnow` repo is not publicly reachable (GitHub API 404). Only third-party forks exist ("from https://github.com/cs144/minnow"). The course site asks students "Please don't post source code to lab solutions." No license was found. — [GitHub API / search](https://github.com/cs144); [CS144 Fall 2026](https://cs144.github.io/)

**Berkeley CS168 projects (Python)**
- Project 1: traceroute, in two parts (basic, then error handling). — [CS168 Sp25](https://sp25.cs168.io/)
- Project 2, distance-vector routing, with stages including "Stage 1: Installing Static Routes", "Stage 2: Forwarding", "Stage 3: Sending Advertisements", "Stage 6: Split Horizon", "Stage 7: Poison Reverse", "Stage 8: Counting to Infinity", "Stage 9: Poisoning Expired Routes", "Stage 10A: Incremental Triggered Updates", and "Stage 10B: Triggered Updates on Link Up/Down". It runs on a simulator API (`TableEntry(dst, port, latency, expire_time)`). — [CS168 Project 2](https://sp25.cs168.io/proj2/)
- Project 3, transport: stages cover the "Three-Way Handshake", "Honoring Advertised Window", sending and receiving FIN, "Retransmitting Packets" with a retransmit queue, and sections on "Modular Arithmetic" and send/receive sequence space (TXControlBlock and RXControlBlock). — [CS168 Project 3](https://sp25.cs168.io/proj3/)
- License: none found on the project pages.

**Princeton COS461 (public repo, Vagrant VM)**
- Assignment list: sockets, TCP congestion control and bufferbloat, passive network measurement, portscan, HTTP proxy. — [COS461-Public](https://github.com/feamster/COS461-Public)
- License: GitHub reports none (`license: none`); the repo was last pushed 2021-11-04. Assignment READMEs include an academic-integrity policy. — [GitHub API: feamster/COS461-Public](https://github.com/feamster/COS461-Public)

**CMU 15-441/641 (GitHub org `computer-networks`)**
- `cmu-tcp`, "TCP in the Wild": Vagrant plus Docker client/server containers. Students implement `backend.c` (state machine, timeouts, retransmissions, buffering, congestion control). Experiments run on separate AWS instances. License file: "Copyright (C) 2022 Carnegie Mellon University… part of the TCP in the Wild course project" (GitHub: NOASSERTION, so not an open license). — [cmu-tcp](https://github.com/computer-networks/cmu-tcp)
- `cmu-abr-proxy`, "Project 3 Checkpoint 1: Adaptive Bitrate Proxy": Docker, with video watched in a browser through the proxy and a "Netsim" tool. License: Apache-2.0. — [cmu-abr-proxy](https://github.com/computer-networks/cmu-abr-proxy)
- `cmu-load-balancer`, "Project 3 Checkpoint 2". License: MIT. — [cmu-load-balancer](https://github.com/computer-networks/cmu-load-balancer)
- `cmu-mixnet` (P1, C/cmake) and `cmu-tube` (P3, Docker) have no license. The cmu-mixnet README says "DO NOT push your solution to a public fork". — [cmu-mixnet](https://github.com/computer-networks/cmu-mixnet); [cmu-tube](https://github.com/computer-networks/cmu-tube)

**P4 tutorials (p4lang)**
- Exercises: `basic` (IPv4 forwarding), `basic_tunnel`, `calc`, `ecn`, `firewall`, `flowcache`, `link_monitor`, `load_balance`, `mri` (multi-hop route inspection / in-band telemetry), `multicast`, `p4runtime`, `qos`, `source_routing`. The repo is actively maintained (pushed 2026-10-06, about 1.6k stars). — [p4lang/tutorials](https://github.com/p4lang/tutorials)
- License: the LICENSE file is Apache License 2.0. A `LICENSES/` directory and per-file `.license` sidecars exist (GitHub shows NOASSERTION because of the multi-license layout). — [p4lang/tutorials](https://github.com/p4lang/tutorials)

**Mininet**
- "Emulator for rapid prototyping of Software Defined Networks", BSD-3-Clause, about 5.9k stars, last pushed 2024-07-09. — [mininet/mininet](https://github.com/mininet/mininet)
- The curriculum mentions Mininet only once, in the further-reading list. Its lab platforms are Packet Tracer, GNS3/EVE-NG/CML, Containerlab, CHR, and Linux namespaces. — `materi/referensi/sumber-belajar.md`; `materi/lab/00-setup-lab.md:34,149`

**Kurose & Ross**
- 9e includes socket programming assignments (UDP/TCP, ICMP Ping), a routing programming assignment, a 4G/5G RAN scheduler assignment, and Wireshark labs for every chapter. — [Pearson 9e TOC](https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000013385/9780135415603)

**Existing curriculum labs, for contrast**
- Lab 00–06 cover setup, switching, routing (static/OSPF/BGP), IP services, L2 security and WLC, Linux/automation, and MikroTik. No lab asks the learner to implement a protocol, write socket code, run iperf3 or netem experiments, or do statistical measurement (lab grep for `iperf|tc qdisc|netem` returned nothing). — `00-kerangka-kurikulum-saat-ini.md` (lab section); grep of `materi/lab/`

### Inferences
These are proposed adaptations. Each is an original lab inspired by the cited design.

| Proposed lab | Model | Toolchain fit with the existing curriculum | Reuse risk |
|---|---|---|---|
| L-A "Bangun TCP sendiri" (byte stream → reassembler → receiver → sender, in Python) | CS144 ch.1–3, CS168 proj3, CMU cmu-tcp | Linux namespaces (13.2), Python (15.3) | Write original code; cite the designs |
| L-B "Router mini: LPM + ARP" | CS144 ch.5–6 | Scapy + namespaces/TUN (13.2) | Original |
| L-C "Distance-vector dari nol" (split horizon → poison reverse → count-to-infinity → triggered updates) | CS168 proj2 stage list | Pure Python simulator, then compare with FRR RIP (13.4) | Original |
| L-D "Traceroute buatan sendiri" | CS168 proj1 | Python raw sockets / Scapy | Original |
| L-E "Bufferbloat & congestion control eksperimental" (vary queue size; CUBIC vs. BBR; plot cwnd/queue/RTT) | COS461 a2 | Mininet (BSD-3) or namespaces + `tc netem`/`fq_codel`, connecting to 05.4 and 11.3 | Low |
| L-F "Mengukur Internet Indonesia" (1-hour ping, loss autocorrelation, RTT over time; paths over LTE, IIX, and international) | CS144 ch.4 | `ping`, `mtr`, Python/pandas; links to 14.2/14.3 | Original, no code needed |
| L-G "Socket & HTTP proxy" | COS461 a1/a5, K&R ch.2 | Python | Original |
| L-H "ABR video proxy" | CMU cmu-abr-proxy (Apache-2.0) | Docker | Can adapt with attribution |
| L-I "P4: basic forwarding → ECN → load balance → in-band telemetry" | p4lang tutorials (Apache-2.0) | BMv2 + Mininet VM | Can adapt with attribution |

CNP3's exercises are CC BY-SA 3.0, so they could be translated directly if the translated section carries CC BY-SA.

### Gaps
- License terms for CS168 project code and the Berkeley online textbook: not found.
- Whether CS144's minnow skeleton is published anywhere under a license: not found; it appears private.
- Whether the Kurose-Ross socket/Wireshark lab handouts have an explicit reuse license: not verified.
- MIT 6.829/6.5820 lab content: behind Canvas login.

---

## Q4. Gaps ranked by how much they deepen understanding, with suggested placement

### Takeaway
Rank by "turns a configurer into someone who can reason from first principles", weighted by relevance to a working network engineer. The first three are: (1) reliable transfer plus building TCP, (2) queueing and performance math, and (3) routing-algorithm theory plus implementation. Next come router forwarding internals and measurement methodology. Most gaps fit as new `##` sections in existing modules. Two warrant new modules: a programming-lab module, and possibly a "video, CDN & cellular" module.

### Cited Findings (evidence per ranked gap; curriculum evidence from the Q1 greps)

1. **Reliable data transfer principles and a "build TCP" lab.** Every course reviewed centers on this: CS144 checkpoints 1–3, CS168 Project 3, CMU P2 "TCP in the Wild", K&R §3.4 (GBN/SR), P&D 2.5, and CNP3's "Reliable data transfer on top of an imperfect link". The curriculum has 0 hits for GBN/SR and no implementation lab. — [CS144 archive](https://web.archive.org/web/2025060100000/https://cs144.github.io/); [CS168 proj3](https://sp25.cs168.io/proj3/); [cmu-tcp](https://github.com/computer-networks/cmu-tcp); [K&R 9e TOC](https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000013385/9780135415603); [CNP3](https://beta.computer-networking.info/syllabus/default/index.html)
   - **Placement:** new section in **05.2 TCP**, "Prinsip Reliable Data Transfer: stop-and-wait → GBN → SR → TCP", placed before the TCP header section. Add a new lab module, **lab/07-lab-membangun-protokol**, with L-A, L-B, L-D, and L-G.
2. **Queueing and performance models.** Topics: statistical multiplexing, traffic intensity, Little's law, the utilization-vs-delay curve, and why links "feel full" at about 70–80% load. Sources: K&R 1.4.2, P&D 1.5 and 6.2, MIT 6.1800 "In-network Resource Management" with the "DCTCP, TCP, Queues practice" recitation, and CS144's "Elastic Buffers" lecture. The curriculum has 0 hits for Little, M/M/1, or statistical multiplexing. — [MIT 6.1800](https://web.mit.edu/6.1800/www/); [P&D TOC](https://book.systemsapproach.org/); [CS144 archive](https://web.archive.org/web/2025060100000/https://cs144.github.io/)
   - **Placement:** new section in **00.3** ("Antrean: Mengapa Link 80% Terasa Penuh"), referenced from 05.4 (bufferbloat), 11.3 (QoS queueing), and 14.3 (capacity planning). Pair it with lab L-E.
3. **Routing-algorithm theory with implementation, plus BGP policy theory.** Topics: worked Dijkstra and Bellman-Ford tables, why DV loops and how each fix works, LS transient loops, and the Gao–Rexford/valley-free export rules and their link to route leaks. Sources: CS168 gives this 7 lectures and Project 2's 10 stages; K&R 5.2 and 5.4.5; Tanenbaum's "Routing Algorithms in a Single Network" and "Policy at the Network layer". The curriculum has intuition plus one example and 0 hits for valley-free. — [CS168 Sp25](https://sp25.cs168.io/); [CS168 proj2](https://sp25.cs168.io/proj2/); [Tanenbaum 6e](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003195/9780137523214)
   - **Placement:** expand **07.2** with "Dijkstra & Bellman-Ford langkah demi langkah" and "Loop transien dan konvergensi". Add a section to **07.6 BGP**, "Ekonomi & Kebijakan Interdomain (customer/peer/provider, valley-free)", tied to the existing route-leak text. Add lab L-C.
4. **Router and switch forwarding internals.** Topics: LPM data structures (tries), TCAM, input vs. output queuing, switching fabrics, HOL blocking, and packet scheduling (FIFO/priority/WFQ/DRR as algorithms). Sources: K&R 4.2, CS168 lecture 8 "Routers", P&D 3.5, and CS144 checkpoint 6. The curriculum has ASIC/RIB/FIB/CEF and 0 hits for TCAM or trie. — [CS168 Sp25](https://sp25.cs168.io/); [CS144 check6](https://web.archive.org/web/2025060100000/https://cs144.github.io/assignments/check6.pdf)
   - **Placement:** new section in **04.5** ("Di Dalam Router: Lookup LPM, TCAM, Fabric, Antrean"). Cross-link to 03.2 "Arsitektur Hardware Switch" and 11.3.
5. **Network measurement methodology.** Topics: active vs. passive measurement, sampling, loss burstiness and autocorrelation, min-RTT as the propagation estimate, traceroute pitfalls in code. Sources: CS144 checkpoint 4, CS168 Project 1, COS461 assignment 3, and Tanenbaum's "Performance Monitoring". The curriculum has tools (14.2) and observability (14.3) but no statistical method. — [CS144 check4](https://web.archive.org/web/2025060100000/https://cs144.github.io/assignments/check4.pdf); [COS461-Public](https://github.com/feamster/COS461-Public)
   - **Placement:** new section in **14.2** or **14.3** ("Mengukur dengan Benar: Statistik Loss, RTT, dan Bias Pengukuran"). Add lab L-F.
6. **Congestion-control theory: fairness, AIMD, throughput model, router-assisted CC.** Sources: CS168 lectures 13–15 ("throughput-model", "router-based-cc"), K&R 3.6 and 3.7.4, P&D 6.1, 6.2, and 6.4, and MIT "In-network Resource Management". The curriculum's practical CC coverage is good (BBR, CUBIC, ECN, bufferbloat, CAKE), but it has no fairness theory. — [CS168 Sp25](https://sp25.cs168.io/); [P&D](https://book.systemsapproach.org/)
   - **Placement:** new section in **05.4** ("Mengapa AIMD Adil: Teori di Balik Congestion Control").
7. **Video streaming / ABR, and CDN mechanics at scale.** Topics: DASH, buffer-based vs. throughput-based ABR, CDN server selection (DNS vs. anycast), cache hierarchy. Sources: K&R 2.5, Tanenbaum "Streaming Audio and Video" and "Content Delivery Networks", and CMU P3 (ABR proxy, load balancer). The curriculum has 0 ABR hits; its CDN coverage is descriptive. — [K&R ninth.php](https://gaia.cs.umass.edu/kurose_ross/ninth.php); [cmu-abr-proxy](https://github.com/computer-networks/cmu-abr-proxy)
   - **Placement:** new section in **06.3**, or a new **06.6 "Video, CDN & Distribusi Konten"**, with lab L-H. Indonesia's ISP and RT-RW-Net context, where OTT video dominates, makes this directly practical.
8. **Data-center transport and host networking.** Topics: incast, DCTCP mechanism, lossless Ethernet trade-offs (PFC/RoCE), collectives and all-reduce for AI clusters, host networking (NIC offloads, kernel bypass). Sources: CS168 lectures 21–25 ("datacenter-cc", "collective-operations", "host-networking") and MIT's DCTCP reading. The curriculum has one DCTCP table row and short RoCE notes. — [CS168 Sp25](https://sp25.cs168.io/); [MIT 6.1800](https://web.mit.edu/6.1800/www/)
   - **Placement:** new section in **16.1** or a new **16.7 "Transport & Jaringan untuk Klaster AI/Data Center"**.
9. **Generalized forwarding / programmable data planes (P4) and SDN theory.** Sources: K&R 4.4 (match-action), 5.5, and 9e's Orion case study; CS168 lecture 23 (SDN); P&D "Software-Defined Traffic Engineering"; P4 tutorials. The curriculum's SDN coverage is at CCNA level and P4 is absent. — [K&R ninth.php](https://gaia.cs.umass.edu/kurose_ross/ninth.php); [p4lang/tutorials](https://github.com/p4lang/tutorials)
   - **Placement:** new section in **16.6**, "Match-Action & Data Plane yang Dapat Diprogram (OpenFlow → P4 → eBPF/XDP)", with optional lab L-I.
10. **Error detection and correction math.** Topics: Internet checksum (one's complement, and why it is weak), CRC polynomial division and why CRC-32 catches burst errors, FEC intuition. Sources: K&R 6.2, P&D 2.4, Tanenbaum DLL. The curriculum uses CRC only as a counter and has an FEC subsection in 02.4. — [P&D](https://book.systemsapproach.org/)
    - **Placement:** new section in **03.1** ("Bagaimana CRC Mendeteksi Error"). Moderate depth payoff, low effort. Doing one CRC computation by hand demystifies interface counters.
11. **Cellular (4G/5G) architecture and mobility.** Topics: RAN vs. core, UPF/AMF, bearers and sessions, why LTE paths show high and variable RTT and CGNAT, and mobility. Sources: K&R 9e ch. 7 ("most significant change"), CS168 lecture 27 "Cellular", Tanenbaum "Cellular Networks". The curriculum mentions 4G/5G only as an access option. — [K&R ninth.php](https://gaia.cs.umass.edu/kurose_ross/ninth.php); [CS168 Sp25](https://sp25.cs168.io/)
    - **Placement:** a new module **10.5 "Jaringan Seluler 4G/5G untuk Network Engineer"**, or a section in 11.1. This is highly relevant in Indonesia, and the final project's TPI sites run on LTE.
12. **Architecture and design principles as a first-class topic.** Topics: the end-to-end arguments paper, fate-sharing, narrow waist, layering trade-offs, and how middleboxes violate them. Sources: CS168 lecture 2 "Design Principles", MIT 6.1800's "End-to-end Arguments" reading, K&R 4.5 "Architectural Principles of the Internet". The curriculum covers this in one or two lines across 00.4, 01.2, and 09.1. — [CS168 Sp25](https://sp25.cs168.io/); [MIT 6.1800](https://web.mit.edu/6.1800/www/)
    - **Placement:** new section in **01.2** ("Prinsip Arsitektur Internet: End-to-End, Fate-Sharing, Narrow Waist"). Cheap to add, and it explains NAT, QUIC, and middlebox behavior later in the curriculum.
13. **Network verification theory.** Topics: reachability and invariant checking over configs and data planes. Batfish is already named in 12.6. — `materi/12-keamanan/06-tools-keamanan.md:322`
    - **Placement:** a section in **15.4 CI/CD** ("Verifikasi Jaringan Sebelum Deploy") with a Batfish lab. It fits the final project's "Kode yang Menjaga" round (20.8).
14. **Lower priority for practitioners:** multiple-access theory (ALOHA efficiency), overlay and P2P networks (RON; P&D 9.4), anonymity networks (Tor, which MIT covers), delay-tolerant networking (Tanenbaum), and multicast collectives beyond AI clusters. — [MIT 6.1800](https://web.mit.edu/6.1800/www/); [P&D](https://book.systemsapproach.org/); [Tanenbaum 6e](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003195/9780137523214)

### Inferences
- **New modules recommended.** (a) **lab/07 "Membangun Protokol"**, collecting L-A through L-G. This is the single highest-leverage addition because it converts several theory sections into hands-on understanding. (b) Optionally **10.5 Seluler** and **06.6 Video/CDN**, if module count allows.
- **New sections in existing modules recommended:** 00.3 (queueing), 01.2 (architecture principles), 03.1 (CRC math), 04.5 (router internals), 05.2 (RDT principles), 05.4 (fairness theory), 07.2 (algorithm walkthroughs and convergence), 07.6 (valley-free policy), 14.2/14.3 (measurement method), 15.4 (verification), 16.6 (P4/match-action), and 16.1 or a new 16.7 (DC transport and AI clusters).
- **Prerequisite concern.** The labs need basic Python, which 15.3 teaches late (stage 15). Either move a minimal "Python for networking" primer earlier or put lab/07 after stage 15. CS144 uses C++ and CMU uses C; a Python rewrite, as CS168 does, suits this audience better.
- **Fit with certifications.** None of these gaps are tested on CCNA, Network+, or MTCNA (the curriculum maps to those in 18.2, 18.3, and 18.5). They are what differentiates an engineer from peers who hold the same certificate. They should be marked as "pendalaman" (enrichment) so they do not distract from the certification paths.

### Gaps
- No primary-source data was found on how hiring managers or senior engineers in Indonesia value these academic topics. The ranking reflects how central each topic is across courses and textbooks plus practical relevance, judged by the researcher, not survey data.
- There is no effort estimate for producing original Indonesian versions of the labs.
- It was not verified whether the curriculum's Linux namespace lab environment (13.2) can run BMv2/P4 without a dedicated VM. The P4 tutorials normally ship a prebuilt VM.
