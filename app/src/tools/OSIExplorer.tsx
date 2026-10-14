import { useState } from 'react'

interface Layer {
  n: number; name: string; en: string; pdu: string
  fungsi: string; protokol: string[]; perangkat: string; contoh: string
}
const LAYERS: Layer[] = [
  { n: 7, name: 'Aplikasi', en: 'Application', pdu: 'Data',
    fungsi: 'Antarmuka ke aplikasi pengguna: HTTP, email, DNS, dsb.', protokol: ['HTTP/S', 'DNS', 'DHCP', 'SMTP', 'SSH', 'FTP'],
    perangkat: 'Host / server', contoh: 'Browser mengirim permintaan GET /index.html' },
  { n: 6, name: 'Presentasi', en: 'Presentation', pdu: 'Data',
    fungsi: 'Format, enkripsi, kompresi data.', protokol: ['TLS/SSL', 'JPEG', 'ASCII', 'UTF-8'],
    perangkat: 'Host', contoh: 'TLS mengenkripsi data sebelum dikirim' },
  { n: 5, name: 'Sesi', en: 'Session', pdu: 'Data',
    fungsi: 'Membuka, mengelola, menutup sesi komunikasi.', protokol: ['NetBIOS', 'RPC', 'sockets'],
    perangkat: 'Host', contoh: 'Menjaga sesi login tetap terbuka' },
  { n: 4, name: 'Transport', en: 'Transport', pdu: 'Segment',
    fungsi: 'Keandalan (TCP) atau kecepatan (UDP), port, kontrol aliran.', protokol: ['TCP', 'UDP', 'QUIC'],
    perangkat: 'Host (firewall L4)', contoh: 'TCP three-way handshake ke port 443' },
  { n: 3, name: 'Network', en: 'Network', pdu: 'Packet',
    fungsi: 'Pengalamatan logis (IP) & routing antar-jaringan.', protokol: ['IP', 'ICMP', 'OSPF', 'BGP'],
    perangkat: 'Router / L3 switch', contoh: 'Router memilih jalur ke 8.8.8.8 (longest prefix match)' },
  { n: 2, name: 'Data Link', en: 'Data Link', pdu: 'Frame',
    fungsi: 'Pengalamatan fisik (MAC), switching, deteksi error dalam satu link.', protokol: ['Ethernet', 'ARP', '802.1Q', 'PPP'],
    perangkat: 'Switch / NIC', contoh: 'Switch meneruskan frame ke port MAC tujuan' },
  { n: 1, name: 'Fisik', en: 'Physical', pdu: 'Bit',
    fungsi: 'Sinyal listrik/optik/radio; kabel, konektor, encoding.', protokol: ['Ethernet PHY', 'DSL', 'RF', 'fiber'],
    perangkat: 'Kabel / hub / repeater', contoh: 'Bit 1010 jadi pulsa listrik di kabel tembaga' },
]

export default function OSIExplorer() {
  const [sel, setSel] = useState(3)
  const layer = LAYERS.find(l => l.n === sel)!

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Penjelajah Model OSI</h3>
        <span className="text-[12px] text-faint">klik sebuah layer</span>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {/* Stack */}
        <div className="space-y-1.5">
          {LAYERS.map(l => (
            <button key={l.n} onClick={() => setSel(l.n)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition ${
                sel === l.n ? 'border-[var(--primary-border)] bg-[var(--primary-soft)]' : 'border-app bg-surface-2 hover:border-[var(--border-strong)]'}`}>
              <span className={`w-7 h-7 rounded-md grid place-items-center font-semibold text-sm tabular-nums shrink-0 ${sel === l.n ? 'bg-[var(--primary)] text-[var(--fg-contrast)]' : 'bg-[var(--surface-3)] text-muted'}`}>{l.n}</span>
              <span className="font-medium text-sm flex-1">{l.name}</span>
              <span className="chip !py-0.5 !text-[10px]">{l.pdu}</span>
            </button>
          ))}
          <div className="text-[11px] text-faint pt-1 text-center">PDU: Data → Segment → Packet → Frame → Bit</div>
        </div>

        {/* Detail */}
        <div key={sel} className="fade-in rounded-lg border border-app p-4 bg-surface-2">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-9 h-9 rounded-lg grid place-items-center bg-[var(--fg)] text-[var(--fg-contrast)] font-semibold tabular-nums shrink-0">L{layer.n}</span>
            <div>
              <div className="font-semibold">{layer.name}</div>
              <div className="text-[12px] text-faint">{layer.en} · PDU: {layer.pdu}</div>
            </div>
          </div>
          <p className="text-[13.5px] text-muted leading-relaxed mb-3">{layer.fungsi}</p>
          <Row label="Protokol">{layer.protokol.map(p => <span key={p} className="chip mr-1 mb-1">{p}</span>)}</Row>
          <Row label="Perangkat">{layer.perangkat}</Row>
          <Row label="Contoh nyata"><span className="text-muted italic">{layer.contoh}</span></Row>
        </div>
      </div>
    </div>
  )
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 py-1.5 border-t border-app text-[13px]">
      <span className="text-[12px] font-medium text-faint w-20 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 flex flex-wrap items-center">{children}</div>
    </div>
  )
}
