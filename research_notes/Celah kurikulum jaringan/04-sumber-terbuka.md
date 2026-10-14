# Openly licensed networking learning materials for adaptation into the Indonesian curriculum (verified licence inventory)

Verification method: each licence was read from its primary file (LICENSE/COPYING/README/preface/copyright page) via `gh api repos/.../contents/...` or by fetching the official site on 2026-10-13. GitHub's `license.spdx_id` field is only cited as a secondary signal. Where GitHub reports `NOASSERTION`, the actual file was read. Nothing was copied into the project. Module IDs refer to `00-kerangka-kurikulum-saat-ini.md`.

Legend: **ADAPT** = translation and modification are allowed, **ADAPT-SA** = allowed, but derivatives must carry the same licence, **QUOTE/TRANSLATE-ONLY** = only verbatim or translated-verbatim use is allowed, **REF-ONLY** = not openly licensed for adaptation (link or cite only).

---

## Q1. Open textbooks: what do the licences of the Systems Approach series, CNP3, Dordal and others actually allow?

### Takeaway
Only the main Peterson & Davie textbook (*Computer Networks: A Systems Approach*) is CC BY 4.0 and therefore freely translatable and adaptable, commercial use included. **All the Systems Approach micro-books (SDN, 5G, TCP Congestion Control, Private 5G, Edge Cloud Operations, Network Security) are CC BY-NC-ND 4.0**, which means no translation or adaptation without permission. Bonaventure's CNP3 is open but its licence statements conflict: the README says CC BY-SA 3.0 while the file headers and preface say CC BY 3.0. Severance's *Introduction to Networking* is CC BY 4.0 in its electronic edition. Dordal and Beej are ND licences: Beej has an explicit exception for full translation, and Dordal requires permission.

### Cited Findings

**Peterson & Davie, *Computer Networks: A Systems Approach* (github.com/SystemsApproach/book, book.systemsapproach.org)**: ADAPT
- The repo `LICENSE` is the full CC legal code, starting "Creative Commons Attribution 4.0 International Public License". It was added 2018-07-15 and contains no NonCommercial/NoDerivatives text — [LICENSE](https://github.com/SystemsApproach/book/blob/master/LICENSE)
- README: "Source for *Computer Networks: A Systems Approach* is available on GitHub under terms of the Creative Commons (CC BY 4.0) license. The community is invited to contribute corrections, improvements, updates, and new material under the same terms." — [README.rst](https://github.com/SystemsApproach/book/blob/master/README.rst)
- The same README also says: "While this license does not automatically grant the right to make derivative works, we are keen to discuss derivative works (such as translations) with interested parties. Please reach out to discuss@systemsapproach.org." This contradicts the CC BY 4.0 legal code, which licenses "Adapted Material". The sentence appears to be boilerplate shared with the ND micro-books — [README.rst](https://github.com/SystemsApproach/book/blob/master/README.rst)
- The content was "seeded with once restricted content: the 5th edition of *Peterson and Davie*, copyrighted by Elsevier" — [README.rst](https://github.com/SystemsApproach/book/blob/master/README.rst)
- Required attribution (verbatim from README): "Title: *Computer Networks: A Systems Approach* / Authors: Larry Peterson and Bruce Davie / Copyright: Elsevier, 2012 / Source: https://github.com/SystemsApproach/book / License: CC BY 4.0" — [README.rst](https://github.com/SystemsApproach/book/blob/master/README.rst)
- Contributor CLA (with Elsevier): "The CC BY license allows users to copy, to create extracts, abstracts and new works from the Contribution, to alter and revise the Contribution and to make commercial use of the Contribution … provided the user gives appropriate credit …, provides a link to the license, indicates if changes were made" — [CLA.rst](https://github.com/SystemsApproach/book/blob/master/CLA.rst)
- Repo contents include chapter sources in reStructuredText (foundation, direct, internetworking, scaling, e2e, congestion, data, security, applications), figures, and a `6E-bottomupslides` directory, all under the repo-level LICENSE — [repo root](https://github.com/SystemsApproach/book). The repo was last pushed 2026-08-20 and has about 3.4k stars (GitHub API).

**Systems Approach micro-books**: all REF-ONLY for adaptation and translation (BY-NC-ND 4.0)
- In every micro-book repo, line 1 of `LICENSE` reads "Creative Commons Attribution 4.0 International Public License", but line 5 reads "Attribution-NonCommercial-NoDerivatives 4.0 International Public…" and the body contains the NonCommercial clauses (7 NC/ND matches per file). The READMEs all state CC BY-NC-ND 4.0 — [sdn LICENSE](https://github.com/SystemsApproach/sdn/blob/master/LICENSE), [sdn README](https://github.com/SystemsApproach/sdn/blob/master/README.rst)
- *Software-Defined Networks: A Systems Approach* (Peterson, Cascone, O'Connor, Vachuska, Davie): "License: CC BY-NC-ND 4.0" — [SystemsApproach/sdn README](https://github.com/SystemsApproach/sdn)
- *5G Mobile Networks: A Systems Approach* (Peterson, Sunay): CC BY-NC-ND 4.0. The repo is **archived** (last push 2023-01-27) — [SystemsApproach/5G](https://github.com/SystemsApproach/5G)
- *TCP Congestion Control: A Systems Approach* (Peterson, Brakmo, Davie): CC BY-NC-ND 4.0. The README adds: "This book incorporates introductory and background content from: *Computer Networks: A Systems Approach* … License: CC BY 4.0" — [SystemsApproach/tcpcc README](https://github.com/SystemsApproach/tcpcc)
- *Private 5G: A Systems Approach* (Peterson, Sunay, Davie): CC BY-NC-ND 4.0 — [SystemsApproach/private5g](https://github.com/SystemsApproach/private5g)
- *Edge Cloud Operations: A Systems Approach* (Peterson, Baker, Bavier, Williams, Davie): CC BY-NC-ND 4.0 — [SystemsApproach/ops](https://github.com/SystemsApproach/ops)
- *Network Security: A Systems Approach* (Peterson, Davie): CC BY-NC-ND 4.0, with the same "incorporates … content from *Computer Networks: A Systems Approach* … CC BY 4.0" note. The README says "version 1 sent to printing" (2025-11) — [SystemsApproach/security](https://github.com/SystemsApproach/security)
- All micro-book READMEs say: "While this license does not automatically grant the right to make derivative works, we are keen to discuss derivative works (such as translations) … discuss@systemsapproach.org" — [sdn README](https://github.com/SystemsApproach/sdn)
- The repo `SystemsApproach/network-management` does not exist (HTTP 404 from the GitHub API).

**Bonaventure, *Computer Networking: Principles, Protocols and Practice*, 3rd ed. (github.com/cnp3/ebook, computer-networking.info)**: ADAPT-SA (conservative reading)
- README: "(c) Olivier Bonaventure, UCLouvain, Belgium … All the files in this subversion repository are licensed under a Creative Commons Attribution-Share Alike 3.0 Unported License." — [cnp3/ebook README.md](https://github.com/cnp3/ebook/blob/master/README.md)
- This conflicts with the per-file headers (`index.rst`, `preface.rst`): ".. This file is licensed under a creative commons licence <http://creativecommons.org/licenses/by/3.0/>". The preface says "The book is released under a creative commons license (by/3.0)" and adds a Saylor note: "(c) 2011-2021, Olivier Bonaventure, Université catholique de Louvain (Belgium) and the collaborators listed above, used under a Creative Commons Attribution (CC BY) license made possible by funding from The Saylor Foundation's Open Textbook Challenge … https://creativecommons.org/licenses/by/3.0/" — [preface.rst](https://github.com/cnp3/ebook/blob/master/preface.rst), [index.rst](https://github.com/cnp3/ebook/blob/master/index.rst)
- GitHub reports no licence file (`license: null`). The repo contains `cc-by.png`, `exercises/`, `principles/`, `protocols/`, `examples/` and `pkt/` — [repo root](https://github.com/cnp3/ebook)
- Translation infrastructure exists. The README says "register on Weblate (weblate.info.ucl.ac.be/engage/cnp3-ebook) to start translating … The translations are made paragraph per paragraph". The existing `locale/` folders are cs, en, fr, pot, vi and zh_Hans, so **there is no Indonesian locale** — [README.md](https://github.com/cnp3/ebook/blob/master/README.md), [locale/](https://github.com/cnp3/ebook/tree/master/locale)
- Companion repos in the cnp3 org (licences from the GitHub API): `ipmininet` GPL-2.0, `RoutingExamples` GPL-2.0 ("IPv6 routing examples with IPMininet"), `IPMininet-iBGP` GPL-2.0, `INGInious-open`, `INGInious-packets` and `INGInious-C` GPL-3.0, `INGInious-problems-network-trace` AGPL-3.0, `Linksimulator` MIT. `Slides` (11 .pptx decks: apps, reliable, TCP, routing, iBGP, congestion, router, LAN) has **no licence**. `MCQ` and `cnp3-netkit-labs` show NOASSERTION, and no root LICENSE file was retrievable — [github.com/cnp3](https://github.com/cnp3)

**Peter L. Dordal, *An Introduction to Computer Networks* (intronetworks.cs.luc.edu)**: REF-ONLY for adaptation, QUOTE-ONLY for excerpts
- "This text is released under the Creative Commons license Attribution-NonCommercial-NoDerivs … You may copy the work and distribute it to others for any noncommercial use (and for some commercial uses …), but all reuse requires attribution." — [Preface › Licensing](https://intronetworks.cs.luc.edu/current2/html/preface.html)
- "Starting with Edition 1.9.16, commercial use is also explicitly allowed, provided that printed copies are not distributed. In other words, the text is also released under the terms of the Creative Commons license Attribution-NoDerivs, amended to include a prohibition on the distribution of printed copies." — [Preface](https://intronetworks.cs.luc.edu/current2/html/preface.html)
- "Under the Creative Commons licenses, creation of derivative works requires permission. It is not entirely clear, however, what would be considered a derivative work, beyond the traditional examples of abridgment and translation. Any supplemental materials like exams, labs, slides or coverage of additional topics would be new, independent works, and would require no permission. … if you have a situation you're concerned about … let me know and I'll probably be happy to grant permission." — [Preface](https://intronetworks.cs.luc.edu/current2/html/preface.html)
- Required URI: "That URI is intronetworks.cs.luc.edu". "Some of the chapters contain source code; this is licensed under the Apache 2.0 license." A commercial German translation exists (Rheinwerk Verlag) — [Preface](https://intronetworks.cs.luc.edu/current2/html/preface.html)
- Current desktop edition 2.0.11, "© Copyright 2012-2022, Peter L Dordal". It covers many topics, including a Mininet chapter and solutions sections — [contents](https://intronetworks.cs.luc.edu/current2/html/)

**Charles Severance, *Introduction to Networking: How the Internet Works* (net-intro.com, github.com/csev/net-intro)**: ADAPT (electronic edition)
- "The paper/print version of this book is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License. … Electronic copies of this book in EPUB, PDF, and HTML are licensed under a Creative Commons Attribution 4.0 International License. … If you are interested in translating this book into a language other than English, please contact me. I am willing to give commercial print distribution rights for a complete and responsible translation." — [book/COPYRIGHT.md](https://github.com/csev/net-intro/blob/master/book/COPYRIGHT.md)
- The site lists Spanish, Greek and Russian translations, plus audio and slides. The repo has no root LICENSE (GitHub `license: null`), and the licence lives in `book/COPYRIGHT.md` — [net-intro.com](https://www.net-intro.com/)
- Chapters: packets, architecture, link layer, internet layer, DNS, transport, application, secure transport, OSI, wrap-up — [book/](https://github.com/csev/net-intro/tree/master/book)

**Beej's Guide to Network Programming (github.com/beejjorgensen/bgnet)**: TRANSLATE-ONLY (full translation)
- "this work is licensed under the Creative Commons Attribution- Noncommercial- No Derivative Works 3.0 License … One specific exception to the 'No Derivative Works' portion of the license is as follows: this guide may be freely translated into any language, provided the translation is accurate, and the guide is reprinted in its entirety. The same license restrictions apply to the translation as to the original guide." — [src/bgnet_part_0100_intro.md](https://github.com/beejjorgensen/bgnet/blob/master/src/bgnet_part_0100_intro.md)

### Inferences
- The only textbook-scale source that can legally be **translated into Indonesian and cut into modules** without asking anyone is *Computer Networks: A Systems Approach* (CC BY 4.0). Severance's electronic edition (CC BY 4.0) is a second, smaller one. If the CNP3 README's CC BY-SA 3.0 statement is honoured, CNP3 is usable too, but adapted modules would then carry ShareAlike.
- The README sentence in the CN:ASA repo ("does not automatically grant the right to make derivative works") is legally weaker than the CC BY 4.0 legal code it ships with. As a courtesy and to remove the ambiguity, email discuss@systemsapproach.org before publishing a translation.
- For the SDN, TCP CC, 5G, Private 5G, Ops and Security topics, **only cite or link** the micro-books. Where tcpcc and security say they "incorporate introductory and background content" from CN:ASA, adapt the equivalent CN:ASA chapter (`congestion/`, `security/`) instead of the micro-book text.
- For CNP3, take the conservative path: treat it as CC BY-SA 3.0 and license the adapted modules under CC BY-SA 4.0. CC BY-SA 3.0 allows adaptations under a later version of the same licence, but that clause was not re-read in this session. Alternatively, ask Bonaventure (cnp3 mailing list) to confirm CC BY. Proposing an Indonesian locale via Weblate is a natural collaboration path.
- Dordal: the curriculum can write its own independent labs and exercises "inspired by" the book without permission (the author's own preface says so), but translating or abridging chapters needs his consent.

### Gaps
- No primary licence statement was found for the CNP3 `MCQ`, `cnp3-netkit-labs` and `Slides` repos (no retrievable LICENSE). Treat them as REF-ONLY until clarified.
- The SA book's DOI-linked "formal publication" referenced in the CLA was not located.
- The licence of figures embedded from third parties in CN:ASA (if any) was not audited figure by figure.
- Other candidate open textbooks (e.g. TLDP Linux networking guides, the LARTC HOWTO) could not be verified: no licence text was found on the lartc.org homepage. Not recommended until verified.

---

## Q2. Lab collections and topologies: containerlab, netlab, Batfish, NetBox/Nautobot, Mininet, GNS3/EVE-NG, Cisco DevNet, Nokia/Juniper, CS144, Wireshark captures

### Takeaway
The lab ecosystem is mostly permissively licensed: containerlab (BSD-3), netlab and bgplab (MIT), Batfish (Apache-2.0), NetBox/Nautobot (Apache-2.0), NetBox demo data (MIT), Mininet (BSD-3), P4 tutorials (Apache-2.0), and most CiscoDevNet sample repos (MIT/BSD/Apache). The traps are: **netlab-examples carries a non-standard MIT-plus-anti-SaaS licence**, **ipSpace NetOpsWorkshop is CC BY-NC-SA 4.0**, several srl-labs labs have **no licence**, and **CS144 and Wireshark SampleCaptures publish no licence**, so they are reference-only. Network OS images (SR Linux, cEOS, vJunos and others) have vendor EULAs separate from the lab files.

### Cited Findings

**containerlab / srl-labs (Nokia)**
- `srl-labs/containerlab`: BSD-3-Clause. It contains a `lab-examples/` directory with 44 entries. Last push 2026-10-12, about 2.9k stars (GitHub API) — [srl-labs/containerlab](https://github.com/srl-labs/containerlab)
- Other srl-labs repos (GitHub API licences): `srl-telemetry-lab` BSD-3 (Clos plus streaming telemetry), `srl-sros-telemetry-lab` BSD-3, `learn-srlinux` BSD-3 (its LICENSE starts "Copyright (c) 2021 Nokia. All rights reserved." followed by the BSD terms), `intent-based-ansible-lab` BSD-3, `clab-workshop` Apache-2.0 (modules 05-install … 45-streaming-telemetry, 40-packet-capture), `vrnetlab` MIT, `clab-io-draw` MIT (containerlab ↔ draw.io diagrams), `network-multitool` MIT, `wsl-containerlab` Apache-2.0 — [github.com/srl-labs](https://github.com/srl-labs)
- srl-labs repos with **no licence** (REF-ONLY): `netbox-nrx-clab`, `multivendor-evpn-lab`, `nokia-segment-routing-lab`, `srl-k8s-anycast-lab`, `sros-anysec-macsec-lab` — [github.com/srl-labs](https://github.com/srl-labs)
- `hellt/clabs` ("community provided labs built with containerlab"): no licence file (GitHub `license: null`) → REF-ONLY — [hellt/clabs](https://github.com/hellt/clabs)
- `nokia/srlinux-yang-models`: BSD-3-Clause — [nokia/srlinux-yang-models](https://github.com/nokia/srlinux-yang-models)

**netlab / ipSpace (Ivan Pepelnjak)**
- `ipspace/netlab` LICENSE.md (21 lines) is standard MIT/Expat wording: "Copyright (c) 2020-2025 Ivan Pepelnjak, Jeroen van Bemmel, Stefano Sasso, … Permission is hereby granted … to use, copy, modify, merge, publish, distribute, sublicense, and/or sell …". GitHub shows NOASSERTION only because it fails to auto-detect the file. The repo includes `docs/` — [netlab LICENSE.md](https://github.com/ipspace/netlab/blob/dev/LICENSE.md)
- `ipspace/netlab-examples` uses a **modified** licence. It grants rights "to use, copy, modify, merge, and/or publish copies of the Software" (no "distribute, sublicense, sell") and adds: "No licensee or downstream recipient may use the Software (including any modified or derivative versions) to offer it to third parties as a hosted, managed, or Software-as-a-Service (SaaS) product or cloud service where the primary value of the service is the functionality of the Software itself." — [netlab-examples LICENSE.md](https://github.com/ipspace/netlab-examples/blob/master/LICENSE.md)
- `ipspace/bgplab` (`bgplab/bgplab` redirects there; "Master BGP configuration with this set of virtual labs"): MIT, "Copyright (c) 2023–2024 Ivan Pepelnjak". Last push 2026-09-27 — [bgplab LICENSE.md](https://github.com/ipspace/bgplab)
- `ipspace/NetOpsWorkshop`: "Attribution-NonCommercial-ShareAlike 4.0 International" → NC, so not usable in a curriculum that may be sold — [NetOpsWorkshop LICENSE.md](https://github.com/ipspace/NetOpsWorkshop)
- `ipspace/ansible-examples`, `MPLS-infrastructure` and `VLAN-service` have no licence → REF-ONLY. `ipspace/pubcloud` is MIT — [github.com/ipspace](https://github.com/ipspace)

**Batfish**
- `batfish/batfish` and `batfish/pybatfish`: Apache-2.0 — [batfish](https://github.com/batfish/batfish), [pybatfish](https://github.com/batfish/pybatfish)
- `pybatfish/jupyter_notebooks` includes "Getting started with Batfish", "Analyzing ACLs and Firewall Rules", "Introduction to BGP Analysis", "Introduction to Forwarding Analysis", "Provably Safe ACL and Firewall Changes", "Uncovering Configuration and Behavior Drift", "Validating Configuration Settings", "Analyzing the Impact of Failures", plus `networks/` sample configs — [jupyter_notebooks](https://github.com/batfish/pybatfish/tree/master/jupyter_notebooks)

**NetBox / Nautobot**
- `netbox-community/netbox`: Apache-2.0. `netbox-community/netbox-demo-data`: MIT ("Demo data useful for populating demo instances of NetBox") — [netbox](https://github.com/netbox-community/netbox), [netbox-demo-data](https://github.com/netbox-community/netbox-demo-data)
- `nautobot/nautobot`: Apache-2.0 — [nautobot](https://github.com/nautobot/nautobot)

**Mininet / P4**
- `mininet/mininet` LICENSE: "BSD 3-Clause License (original Mininet authors: Bob Lantz and Brandon Heller) Copyright (c) 2013-2022 Open Networking Foundation; Copyright (c) 2009-2012 Bob Lantz and The Board of Trustees of The Leland Stanford Junior University". Last push 2024-07 — [mininet LICENSE](https://github.com/mininet/mininet/blob/master/LICENSE)
- `mininet/mininet-tutorials` does not exist (404). The Mininet walkthrough lives on the project website and GitHub wiki, and its licence was not verified.
- `p4lang/tutorials`: `LICENSE` is Apache-2.0. `LICENSES/` also contains GPL-2.0-only.txt for some files. `P4_tutorial.pdf.license`: "SPDX-FileCopyrightText: 2018 Nate Foster / SPDX-License-Identifier: Apache-2.0" — [p4lang/tutorials](https://github.com/p4lang/tutorials)

**Cisco DevNet** (licences from the GitHub API, plus primary files where noted)
- `CiscoDevNet/netprog_basics` MIT (course code: programming_fundamentals, network_device_apis, network_controllers, netdevops, application_hosting). `python_code_samples_network` MIT (file read: "MIT License Copyright (c) 2019, Cisco Systems, Inc. and/or its affiliates"). `cml-community` BSD-3 (community CML topologies). `dne-dna-code` MIT. `virlutils` MIT. `yang-explorer` Apache-2.0. `coding-skills-sample-code` Apache-2.0 — [github.com/CiscoDevNet](https://github.com/CiscoDevNet), [python_code_samples_network LICENSE](https://github.com/CiscoDevNet/python_code_samples_network/blob/master/LICENSE)
- NOASSERTION repos that need per-repo reading before use: `yangsuite`, `sdwan-devops`, `Getting-started-with-Cisco-SD-WAN-REST-APIs`, `awesome-webex` — [github.com/CiscoDevNet](https://github.com/CiscoDevNet)

**GNS3 / EVE-NG**
- `GNS3/gns3-registry` (appliance definitions/templates): GPL-3.0 — [GNS3/gns3-registry](https://github.com/GNS3/gns3-registry)

**Stanford CS144**
- The cs144.github.io course page (Fall 2026) lists schedule, practice exams and texts, but has no licence statement. The GitHub `cs144` org/user repos (`cs144.github.io`, `imp`) have no licence. `cs144/minnow` is not public (404) → **REF-ONLY** — [cs144.github.io](https://cs144.github.io/), GitHub API

**Wireshark SampleCaptures**
- The SampleCaptures page contains no licence statement. Captures are user-contributed: "If you want to include a new example capture file, you should attach it to this page …" The wiki front page also shows no licence → **REF-ONLY (link, do not redistribute)** — [wiki.wireshark.org/SampleCaptures](https://wiki.wireshark.org/SampleCaptures)

### Inferences
- **Best lab backbone for module `lab/*` and `20-proyek-akhir/05-babak-4`:** containerlab `lab-examples` (BSD-3) and bgplab (MIT) can be translated, modified and redistributed with the copyright notice retained. srl-labs `clab-workshop` (Apache-2.0) maps directly onto `lab/00-setup-lab` (install, basics, packet capture, telemetry).
- netlab itself is MIT, but a curriculum that *copies* `netlab-examples` topologies inherits the anti-SaaS clause and the missing "distribute" grant. Write your own topologies, or use bgplab's.
- Batfish notebooks (Apache-2.0) fit `15-otomasi/04`, `20-proyek-akhir/08-babak-7` (compliance as code) and `09-nat-acl-firewall/02` (ACL analysis). NetBox demo data (MIT) fits `15-otomasi/04` (NetBox as Source of Truth) and `17-desain-arsitektur/03`.
- Wireshark and CS144 material should be cited only. Generating your own pcaps in the curriculum's containerlab topologies avoids licence questions entirely for `14-monitoring-troubleshooting/02` and `05-transport/02`.
- Apache-2.0 sources require keeping the NOTICE file (if any) and stating changes. MIT/BSD require keeping the copyright and permission notice. GPL sources (ipmininet, GNS3 registry, CNP3 RoutingExamples) should sit as separate files under their own GPL, not merged into CC-licensed prose.

### Gaps
- EVE-NG community labs: no official GitHub org or licence was verified in this session.
- Juniper open labs: `Juniper/vlabs` does not exist (404). Juniper vLabs is a web portal whose terms were not checked.
- NOS image licences (Nokia SR Linux container, Arista cEOS, Juniper vJunos/cRPD, Cisco IOL/CML) were not verified. They are separate from lab-file licences and usually restrict redistribution.
- "Cisco Sample Code License" (used by some DevNet repos) was not read. Only repos with standard SPDX licences are listed above.

---

## Q3. Curated lists: which ones can be used to discover sources, and what are their licences?

### Takeaway
networktocode's awesome-network-automation is CC BY 4.0, and facyber/awesome-networking is CC0-1.0 per GitHub detection. Both can be adapted into `referensi/sumber-belajar`, but every link they recommend still needs its own licence check. The lists themselves were used here only as a discovery aid.

### Cited Findings
- `networktocode/awesome-network-automation` LICENSE: "Creative Commons Attribution 4.0 International License (CC BY 4.0) http://creativecommons.org/licenses/by/4.0/". Active (pushed 2026-10-10, about 2.9k stars) — [LICENSE](https://github.com/networktocode/awesome-network-automation/blob/master/LICENSE)
- `facyber/awesome-networking` ("networking courses, books, tutorials"): the GitHub API reports CC0-1.0. The root `LICENSE` path returned 404, so the file name differs and the text was not read directly — [facyber/awesome-networking](https://github.com/facyber/awesome-networking)
- `ipspace/awesome-network-automation` (fork): NOASSERTION — [ipspace](https://github.com/ipspace)

### Inferences
- The structure and annotations of the networktocode list can be translated into the Indonesian "Sumber Belajar Lanjutan" page with attribution ("Based on awesome-network-automation by Network to Code, CC BY 4.0").

### Gaps
- Not every entry in the lists was audited. Only the items listed in Q1, Q2, Q4 and Q5 were licence-checked.

---

## Q4. Open-licence reference documentation: Kubernetes, Cilium, FRRouting, Linux kernel, IETF RFCs, Wikipedia

### Takeaway
Kubernetes docs (CC BY 4.0) are freely adaptable. Cilium (Apache-2.0 repo, docs included) is adaptable with notice. **The FRR docs carry a legacy GNU Zebra permission notice** (copyleft-like, translation allowed). Linux kernel networking docs are GPL-2.0. **IETF RFCs may be translated and quoted verbatim, but not modified** (TLP 5.0). Wikipedia is CC BY-SA 4.0 (or GFDL), so ShareAlike applies.

### Cited Findings
- **Kubernetes docs:** the `kubernetes/website` LICENSE is the CC "Attribution 4.0 International" legal code. GitHub: CC-BY-4.0 — [kubernetes/website LICENSE](https://github.com/kubernetes/website/blob/main/LICENSE)
- **Cilium:** the repo LICENSE is Apache-2.0. The README "License" section references the Apache license (LICENSE), BSD-2-Clause and GPL-2.0 for the `bpf/` datapath. `Documentation/conf.py` copyright is "Cilium Authors", and no separate docs licence file exists in `Documentation/` — [cilium README.rst](https://github.com/cilium/cilium/blob/main/README.rst)
- **FRRouting docs:** COPYING: "please note that FRR's documentation is, for historical reasons, licensed under a custom (but relatively permissive) license. This license dates back to the GNU Zebra project…" — [FRR COPYING](https://github.com/FRRouting/frr/blob/master/COPYING)
- FRR user guide copyright notice: "Copyright (c) 1996-2018 Kunihiro Ishiguro, et al. Permission is granted to make and distribute verbatim copies of this manual provided the copyright notice and this permission notice are preserved on all copies. Permission is granted to copy and distribute modified versions of this manual under the conditions for verbatim copying, provided that the entire resulting derived work is distributed under the terms of a permission notice identical to this one. Permission is granted to copy and distribute translations of this manual into another language, under the above conditions for modified versions, except that this permission notice may be stated in a translation approved by Kunihiro Ishiguro." — [doc/user/index.rst](https://github.com/FRRouting/frr/blob/master/doc/user/index.rst)
- **Linux kernel networking docs:** sampled files (`Documentation/networking/bridge.rst`, `ip-sysctl.rst`, `vxlan.rst`, `nf_conntrack-sysctl.rst`) all begin ".. SPDX-License-Identifier: GPL-2.0" — [torvalds/linux Documentation/networking](https://github.com/torvalds/linux/tree/master/Documentation/networking)
- **IETF RFCs, TLP v5.0 (effective March 25, 2015), Section 3.c (outside the IETF Standards Process)** grants rights: "i. to copy, publish, display and distribute IETF Contributions and IETF Documents in full and without modification, ii. to translate IETF Contributions and IETF Documents into languages other than English, and to copy, publish, display and distribute such translated IETF Contributions and IETF Documents in full and without modification, iii. to copy, publish, display and distribute unmodified portions of IETF Contributions and IETF Documents and translations thereof, provided that: (x) each such portion is clearly attributed to IETF and identifies the RFC … from which it is taken, (y) all IETF legends, legal notices and indications of authorship contained in the original IETF RFC must also be included where any substantial portion of the text of an IETF RFC, and in any event where more than one-fifth of such text, is reproduced…" — [IETF Trust TLP 5.0 PDF](https://trustee.ietf.org/wp-content/uploads/Corrected-TLP-5.0-legal-provsions.pdf), [TLP index](https://trustee.ietf.org/documents/trust-legal-provisions/)
- TLP 3.d: "The following licenses are not granted … i. any license to modify IETF Contributions or IETF Documents, or portions thereof (other than to make translations or to extract, use and modify Code Components as permitted under … Section 4…)". Section 4.c/6.d covers Code Components under the Revised BSD License — [TLP 5.0 PDF](https://trustee.ietf.org/wp-content/uploads/Corrected-TLP-5.0-legal-provsions.pdf)
- **Wikipedia/Wikimedia Terms of Use:** contributed text is licensed under "Creative Commons Attribution-ShareAlike 4.0 International License ('CC BY-SA 4.0'), and GNU Free Documentation License ('GFDL') … Reusers may comply with either license or both." Attribution is via hyperlink, a list of authors, or a link to the history — [Wikimedia Terms of Use](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use)

### Inferences
- Kubernetes docs can be translated and adapted for `16-datacenter-cloud-sdn/05-container-kubernetes` (Service, Ingress, NetworkPolicy, CNI) with the line "Adapted from Kubernetes Documentation, © The Kubernetes Authors, CC BY 4.0", plus a note of changes. Kubernetes also has an official Indonesian localisation (kubernetes.io/id). It was not verified in this session but is worth checking for reuse.
- FRR docs translated into Indonesian would have to keep the English permission notice, since an "approved" translation of the notice is practically unobtainable. Derived text must carry the identical notice, which is a copyleft-like effect. Practical advice: quote short FRR command references and write your own explanations for `13-linux-networking/04`, `referensi/cheatsheet-linux-network`, and `07-routing-lanjutan/04` and `/06`.
- Kernel docs (GPL-2.0) are best used as a cited reference in `13-linux-networking/01-03`, without copying text into CC-licensed modules.
- RFCs for `referensi/daftar-rfc-penting` and `00-fondasi/04` (reading an RFC): you may quote verbatim excerpts and translate them into Indonesian (translation in full or of unmodified portions) with attribution to the IETF and the RFC number. Restating protocol behaviour in your own words is ordinary authorship, not a licensed modification. Over one-fifth of an RFC triggers the full legends.
- Any text adapted from Wikipedia (including id.wikipedia.org) forces that module to be CC BY-SA 4.0.

### Gaps
- Cilium's docs site (docs.cilium.io) footer was not fetched. The repo licence is assumed to cover the docs because no separate notice was found (inference).
- The Kubernetes Indonesian localisation status and coverage were not checked.

---

## Q5. Indonesian-language open resources (GitHub, university OER)

### Takeaway
Indonesian networking repos exist, and some are popular (e.g. `arsitektur-jaringan-komputer/Modul-Jarkom`, 104 stars), but **almost none carry a licence**, so they are reference-only. The licensed exceptions are small: one AGPL-3.0 LaTeX book (`BukuInformatika/Jarkom`) and a couple of MIT MikroTik quiz repos. There is a clear gap for an openly licensed Indonesian networking text.

### Cited Findings (GitHub search, 2026-10-13, licences from the GitHub API and repo contents)
- `arsitektur-jaringan-komputer/Modul-Jarkom`: "Modul praktikum mata kuliah Jaringan Komputer". Contains Modul-1…4 and Modul-GNS3, 104 stars, **no licence** → REF-ONLY — [repo](https://github.com/arsitektur-jaringan-komputer/Modul-Jarkom)
- `dicodingacademy/a387-jarkom-labs`: Dicoding "Jaringan Komputer untuk Pemula" exercises, **no licence** → REF-ONLY — [repo](https://github.com/dicodingacademy/a387-jarkom-labs)
- `auriza/komdat-lab`: "Materi praktikum mata kuliah Komunikasi Data dan Jaringan Komputer". Has p01–p13 markdown, `pkt/` (Packet Tracer files) and a GBPP/SAP doc, **no licence** → REF-ONLY — [repo](https://github.com/auriza/komdat-lab)
- `BukuInformatika/Jarkom`: "Buku Jaringan Komputer" (LaTeX, main.pdf, chapters/). LICENSE is "GNU AFFERO GENERAL PUBLIC LICENSE Version 3" — [repo](https://github.com/BukuInformatika/Jarkom)
- `dulkemot/belajar-mikrotik` ("Materi MikroTik Indonesia + kuis interaktif"): MIT. `xelisme/MikroTik-Praktik` (MikroTik practice question generator): MIT — [dulkemot/belajar-mikrotik](https://github.com/dulkemot/belajar-mikrotik), [xelisme/MikroTik-Praktik](https://github.com/xelisme/MikroTik-Praktik)
- CNP3 has no Indonesian locale (cs, fr, vi, zh_Hans only) — [cnp3/ebook locale](https://github.com/cnp3/ebook/tree/master/locale)
- Indonesian Wikipedia text falls under the Wikimedia ToU (CC BY-SA 4.0/GFDL) — [Wikimedia ToU](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use)

### Inferences
- `BukuInformatika/Jarkom` is technically adaptable, but AGPL-3.0 is a software licence with strong copyleft and is awkward for prose. Mixing it in would push the derived module toward AGPL. Use it only as a reference unless relicensed.
- The MIT MikroTik quiz repos could feed `referensi/soal-latihan` and `19-mikrotik/*` question banks, after a quality review (not done here).
- Opportunity: an Indonesian translation of CN:ASA (CC BY 4.0) or Severance (CC BY 4.0 electronic), or a CNP3 Weblate locale, would be a first openly licensed Indonesian networking textbook. This is inference: no such translation was found in this search.

### Gaps
- Indonesian government OER (SIBI/buku.kemdikbud.go.id Informatika books, Rumah Belajar) and university OER portals (e.g. UT, ITB/UGM OCW) were not fetched. Their licences are unverified.
- GitHub search covered repo names and descriptions only. Content in GitLab, Google Drive or university LMS was not searchable without WebSearch.

---

## Q6. Inventory matrix: adaptable parts, attribution, share-alike implications, and which curriculum gap each serves

### Takeaway
A mixed-licence curriculum is workable if it is licensed **CC BY-SA 4.0** for the prose. That absorbs CC BY 4.0 (CN:ASA, Severance, Kubernetes, awesome-network-automation) and CC BY-SA (Wikipedia, CNP3). Code and lab files should stay in separate directories under their original MIT/BSD/Apache terms. GPL/AGPL, FRR-notice, ND and NC sources are cited, not merged.

### Cited Findings (each row's licence is sourced in Q1–Q5)

| Resource | Licence (verified) | Adaptable? | Attribution needed | Fills curriculum module/gap |
|---|---|---|---|---|
| CN:ASA (Peterson & Davie) | CC BY 4.0 ([LICENSE](https://github.com/SystemsApproach/book/blob/master/LICENSE)) | ADAPT: translate, modify, commercial | Title/Authors/"Copyright: Elsevier, 2012"/Source URL/CC BY 4.0 link + "changes made" | 00-fondasi/03 (latency, BDP), 01-model-referensi, 03-data-link/01-02, 04-network-layer, 05-transport/02-04 (`congestion/`), 06-aplikasi, 12-keamanan (`security/`), 16-06 SDN background |
| SA micro-books (SDN, 5G, TCPCC, Private 5G, Ops, Security) | CC BY-NC-ND 4.0 ([sdn](https://github.com/SystemsApproach/sdn)) | REF-ONLY; translation needs permission | Cite | 16-06 SDN, 05-04 congestion, 12 security: reading list only |
| CNP3 (Bonaventure) | README: CC BY-SA 3.0; file headers: CC BY 3.0 ([README](https://github.com/cnp3/ebook/blob/master/README.md)) | ADAPT-SA (conservative) | "(c) Olivier Bonaventure, UCLouvain" + licence link | 04-05 routing basics, 07-02 dynamic routing concepts, 05-02 TCP, 08 IPv6, exercises for referensi/soal-latihan |
| CNP3 IPMininet/RoutingExamples | GPL-2.0 (GitHub API) | ADAPT (as separate GPL code) | GPL notice | 08-ipv6/03, 07-06 iBGP labs |
| Dordal | CC BY-NC-ND (amended: commercial OK, no print) ([preface](https://intronetworks.cs.luc.edu/current2/html/preface.html)) | REF-ONLY (code: Apache-2.0) | URI intronetworks.cs.luc.edu | Reading for 05-transport, 11-03 QoS, Mininet |
| Severance net-intro | Electronic CC BY 4.0; print CC BY-NC 4.0 ([COPYRIGHT.md](https://github.com/csev/net-intro/blob/master/book/COPYRIGHT.md)) | ADAPT (electronic) | "© Charles R. Severance, CC BY 4.0" | 00-fondasi/01, 01-model-referensi beginner level |
| Beej's Guide | CC BY-NC-ND 3.0 + full-translation exception ([intro](https://github.com/beejjorgensen/bgnet/blob/master/src/bgnet_part_0100_intro.md)) | Full accurate translation only | Same licence | 05-transport/01 sockets (reference) |
| containerlab + lab-examples | BSD-3 ([repo](https://github.com/srl-labs/containerlab)) | ADAPT | Keep copyright + disclaimer | lab/00, lab/01-02, 16-01/02 spine-leaf, VXLAN/EVPN |
| clab-workshop | Apache-2.0 | ADAPT | Licence + changes notice | lab/00-setup-lab, 14-02 packet capture, 14-03 telemetry |
| srl-telemetry-lab / learn-srlinux | BSD-3 | ADAPT | Nokia copyright line | 14-03 observability (gNMI, Prometheus/Grafana), 16-01 Clos |
| netlab | MIT ([LICENSE.md](https://github.com/ipspace/netlab/blob/dev/LICENSE.md)) | ADAPT | Copyright + MIT notice | lab tooling for 07-*, 20-05 |
| netlab-examples | MIT-variant + anti-SaaS, no "distribute" grant | Restricted; prefer own topologies | Notice + clause | — |
| bgplab | MIT | ADAPT | Copyright + MIT notice | 07-06 BGP, lab/02 Lab 2.6, 14-04 Case 10 |
| NetOpsWorkshop | CC BY-NC-SA 4.0 | NC: avoid | — | — |
| Batfish/pybatfish notebooks | Apache-2.0 | ADAPT | Licence + changes | 09-02 ACL, 15-04, 20-08 compliance-as-code |
| NetBox / netbox-demo-data / Nautobot | Apache-2.0 / MIT / Apache-2.0 | ADAPT | Notices | 15-04 Source of Truth, 17-03 documentation |
| Mininet | BSD-3 | ADAPT | ONF + Stanford copyright | 13-02 virtual networking, 16-06 SDN |
| P4 tutorials | Apache-2.0 (some GPL-2.0 files) | ADAPT | SPDX notices | 16-06 SDN (programmable data plane), optional |
| CiscoDevNet netprog_basics / python_code_samples_network / cml-community | MIT / MIT / BSD-3 | ADAPT | Cisco copyright + notice | 15-02 APIs, 15-03 Python, lab Cisco topologies |
| GNS3 registry | GPL-3.0 | ADAPT (as GPL) | GPL | lab/00 (appliance templates) |
| CS144 | none | REF-ONLY | — | — |
| Wireshark SampleCaptures | none stated | REF-ONLY (link) | — | 14-02 (link only) |
| awesome-network-automation | CC BY 4.0 | ADAPT | Network to Code, CC BY 4.0 | referensi/sumber-belajar |
| Kubernetes docs | CC BY 4.0 | ADAPT | "© The Kubernetes Authors, CC BY 4.0" | 16-05 container & Kubernetes |
| Cilium | Apache-2.0 | ADAPT | Notice | 16-05 CNI, NetworkPolicy, eBPF |
| FRR docs | Zebra permission notice | ADAPT under identical notice (copyleft-like) | Keep permission notice | 13-04 FRR, cheatsheet-linux-network |
| Linux kernel networking docs | GPL-2.0 | Keep separate / cite | GPL | 13-01..03 |
| IETF RFCs | IETF Trust TLP 5.0 | Translate + verbatim quotes only; code BSD | Attribute IETF + RFC number; legends if >1/5 | 00-04, referensi/daftar-rfc-penting |
| Wikipedia (en/id) | CC BY-SA 4.0 or GFDL | ADAPT-SA | Link to article/history | glosarium, 00-04 history |
| Modul-Jarkom, komdat-lab, a387-jarkom-labs | none | REF-ONLY | — | Benchmark for Indonesian lab style |
| BukuInformatika/Jarkom | AGPL-3.0 | Copyleft: avoid merging | AGPL | — |
| belajar-mikrotik, MikroTik-Praktik | MIT | ADAPT | MIT notice | 19-mikrotik, referensi/soal-latihan |

### Inferences
- **ShareAlike compatibility:** CC BY 4.0 material can be included in a CC BY-SA 4.0 work. CC BY-SA material cannot be relicensed as plain CC BY, so licensing the whole prose curriculum CC BY-SA 4.0 is the simplest superset. If the project wants a permissive CC BY output instead, it must avoid adapting Wikipedia and (conservatively) CNP3 text.
- ND and NC sources (SA micro-books, Dordal, Beej, NetOpsWorkshop) must not be translated or paraphrased closely. The curriculum is safe if it links to them in reading lists.
- Keep `lab/` topology and config files in a separate tree with a per-file SPDX header and a NOTICE listing upstream sources (containerlab BSD-3, bgplab MIT, Batfish Apache-2.0). This avoids mixing code licences with the CC prose licence.
- The biggest content wins per gap: CN:ASA for theory chapters 01–06 (adapt into Indonesian), containerlab, bgplab and clab-workshop for labs, Batfish and NetBox for automation, and Kubernetes docs for 16-05. MikroTik (19-*) has no high-quality openly licensed source beyond small MIT quiz repos, so it stays original content.

### Gaps
- Per-figure provenance inside CN:ASA and CNP3 was not audited. Some figures may originate from third parties.
- No legal opinion was obtained on the conflicting CNP3 statements or on the CN:ASA README sentence about derivative works. Both are best resolved by emailing the authors.
- The NOTICE files of individual Apache-2.0 repos (clab-workshop, Batfish, NetBox) were not inspected.
