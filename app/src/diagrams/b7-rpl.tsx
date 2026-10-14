import { Fig, Box, Arrow, T } from './primitives'

/* Satu commit: lingkaran kecil berlabel. */
function Dot({ x, y, label, tone = 'n' }: { x: number; y: number; label: string; tone?: 'n' | 'p' | 'a' | 'ok' | 'warn' | 'no' }) {
  return <Box x={x - 16} y={y - 16} w={32} h={32} r={16} label={label} tone={tone} fs={11} />
}

/* 15.5 Merge vs rebase */
export function DgP7GitMergeRebase() {
  return (
    <Fig title="Merge dan rebase" sub="Dua cara menyatukan branch fitur ke main yang sudah maju" w={840} h={320}>
      <path d="M16 18 H412 V302 H16 Z" className="dg-region r-p" />
      <path d="M428 18 H824 V302 H428 Z" className="dg-region r-a" />
      <T x={214} y={42} cls="dg-cap-in">Merge: riwayat bercabang</T>
      <T x={626} y={42} cls="dg-cap-in">Rebase: riwayat lurus</T>

      {/* merge */}
      <T x={44} y={118} cls="dg-note" anchor="start">main</T>
      <T x={44} y={218} cls="dg-note" anchor="start">fitur</T>
      <path d="M100 110 H330" className="dg-lnk" />
      <path d="M170 110 L230 210 H290 L350 110" className="dg-lnk" />
      <Dot x={100} y={110} label="A" />
      <Dot x={170} y={110} label="B" />
      <Dot x={250} y={110} label="C" />
      <Dot x={350} y={110} label="M" tone="p" />
      <Dot x={230} y={210} label="D" tone="a" />
      <Dot x={290} y={210} label="E" tone="a" />
      <T x={214} y={262} cls="dg-sb">M adalah merge commit dengan dua induk (C dan E)</T>
      <T x={214} y={282} cls="dg-note">Hash D dan E tidak berubah</T>

      {/* rebase */}
      <T x={456} y={118} cls="dg-note" anchor="start">main</T>
      <T x={456} y={218} cls="dg-note" anchor="start">lama</T>
      <path d="M512 110 H772" className="dg-lnk" />
      <path d="M582 110 L642 210 H702" className="dg-lnk dash" />
      <Dot x={512} y={110} label="A" />
      <Dot x={582} y={110} label="B" />
      <Dot x={652} y={110} label="C" />
      <Dot x={712} y={110} label="D'" tone="a" />
      <Dot x={772} y={110} label="E'" tone="a" />
      <Dot x={642} y={210} label="D" tone="n" />
      <Dot x={702} y={210} label="E" tone="n" />
      <T x={626} y={262} cls="dg-sb">D' dan E' adalah commit baru (hash berubah)</T>
      <T x={626} y={282} cls="dg-note">D dan E lama ditinggalkan: jangan rebase branch bersama</T>
    </Fig>
  )
}

const DIFF_ROWS: { m: string; t: string; tone: 'n' | 'p' | 'ok' | 'no'; note: string; nt: 'n' | 'ok' | 'no' | 'p' }[] = [
  { m: '', t: '--- a/r1.cfg', tone: 'n', note: 'berkas versi lama', nt: 'n' },
  { m: '', t: '+++ b/r1.cfg', tone: 'n', note: 'berkas versi baru', nt: 'n' },
  { m: '', t: '@@ -1,4 +1,5 @@', tone: 'p', note: 'lama: mulai baris 1, 4 baris. baru: mulai baris 1, 5 baris', nt: 'p' },
  { m: ' ', t: 'hostname r1', tone: 'n', note: 'diawali spasi: konteks, tidak berubah', nt: 'n' },
  { m: ' ', t: 'interface ether1', tone: 'n', note: '', nt: 'n' },
  { m: '-', t: ' ip address 10.0.0.1/24', tone: 'no', note: 'dihapus dari versi lama', nt: 'no' },
  { m: '+', t: ' ip address 10.0.0.1/25', tone: 'ok', note: 'ditambah di versi baru (pasangan - dan + = baris diubah)', nt: 'ok' },
  { m: ' ', t: 'ntp server 10.0.0.9', tone: 'n', note: '', nt: 'n' },
  { m: '+', t: 'ntp server 10.0.0.10', tone: 'ok', note: 'baris baru murni', nt: 'ok' },
]

/* 15.5 Anatomi unified diff */
export function DgP7UnifiedDiff() {
  const y0 = 64
  const step = 32
  return (
    <Fig title="Anatomi unified diff" sub="Hasil git diff untuk berkas r1.cfg" w={840} h={y0 + DIFF_ROWS.length * step + 24}>
      {DIFF_ROWS.map((r, i) => {
        const y = y0 + i * step
        return (
          <g key={i}>
            <Box x={24} y={y} w={270} h={26} r={6} tone={r.tone} />
            <T x={40} y={y + 17} cls="dg-mono" anchor="start" size={12}>{r.m}</T>
            <T x={r.m ? 56 : 40} y={y + 17} cls="dg-mono" anchor="start" size={12}>{r.t.trimStart() === r.t ? r.t : r.t.trim()}</T>
            {r.note && <Arrow d={`M300 ${y + 13} H340`} tone={r.nt} />}
            {r.note && <T x={350} y={y + 17} cls="dg-sb" anchor="start" size={11.5}>{r.note}</T>}
          </g>
        )
      })}
      <T x={24} y={40} cls="dg-note" anchor="start">Kolom pertama menandai: spasi = tetap, - = hilang, + = muncul</T>
    </Fig>
  )
}

/* 15.5 Test double di batas I/O */
export function DgP7TestDouble() {
  return (
    <Fig title="Test double di batas I/O" sub="Kode yang sama berjalan dengan router sungguhan atau dengan tiruan" w={820} h={320}>
      <Box x={24} y={124} w={150} h={64} label="pytest" sub="test_*.py, assert" tone="p" />
      <Box x={254} y={110} w={210} h={92} label="Kode Anda" sub="ensure_address + MikroTikRest" tone="a" />
      <Arrow d="M174 156 H254" tone="p" label="panggil" lx={214} ly={146} />
      <path d="M520 40 V290" className="dg-lnk dash" />
      <T x={520} y={30} cls="dg-note">batas I/O: sesi disuntikkan</T>

      <Box x={580} y={50} w={200} h={52} label="requests.Session" sub="produksi" tone="n" />
      <Box x={580} y={120} w={200} h={52} label="Router MikroTik" sub="/rest/ip/address" tone="n" />
      <Arrow d="M680 102 V120" tone="n" />
      <Arrow d="M464 140 L518 100 L580 76" tone="n" dash label="produksi" lx={480} ly={88} />

      <Box x={580} y={216} w={200} h={64} label="FakeSession" sub="antre jawaban, catat panggilan" tone="ok" />
      <Arrow d="M464 176 L520 240 H580" tone="ok" label="tes" lx={512} ly={204} />
      <T x={254} y={246} cls="dg-note" anchor="start">Tes memeriksa hasil dan daftar calls</T>
      <T x={254} y={264} cls="dg-note" anchor="start">tanpa perangkat, tanpa jaringan, tanpa menunggu</T>
    </Fig>
  )
}

/* 15.5 Sekuens API: rate limit dan pagination */
export function DgP7SekuensApi() {
  const xa = 150
  const xb = 650
  const msgs: { y: number; from: 'a' | 'b'; text: string; tone: 'p' | 'ok' | 'warn' | 'no'; dash?: boolean }[] = [
    { y: 112, from: 'a', text: 'GET /devices?page=1', tone: 'p' },
    { y: 156, from: 'b', text: '429 Too Many Requests, Retry-After: 30', tone: 'no', dash: true },
    { y: 218, from: 'a', text: 'GET /devices?page=1 (setelah 30 detik)', tone: 'p' },
    { y: 262, from: 'b', text: '200 + Link: <...page=2>; rel="next"', tone: 'ok', dash: true },
    { y: 306, from: 'a', text: 'GET /devices?page=2', tone: 'p' },
    { y: 350, from: 'b', text: '200, tanpa rel="next": selesai', tone: 'ok', dash: true },
  ]
  return (
    <Fig title="Diagram sekuens: rate limit dan pagination" sub="Baca dari atas ke bawah; panah putus-putus adalah respons" w={800} h={400}>
      <Box x={xa - 70} y={20} w={140} h={36} label="Klien (skrip)" tone="p" />
      <Box x={xb - 70} y={20} w={140} h={36} label="API server" tone="a" />
      <path d={`M${xa} 56 V386`} className="dg-life" />
      <path d={`M${xb} 56 V386`} className="dg-life" />
      {msgs.map((m, i) => {
        const d = m.from === 'a' ? `M${xa} ${m.y} H${xb}` : `M${xb} ${m.y} H${xa}`
        return (
          <g key={i}>
            <Arrow d={d} tone={m.tone} dash={m.dash} />
            <T x={(xa + xb) / 2} y={m.y - 8} cls="dg-sb" size={11.5}>{m.text}</T>
          </g>
        )
      })}
      <T x={(xa + xb) / 2} y={190} cls="dg-note">klien menunggu 30 detik, bukan mengulang segera</T>
    </Fig>
  )
}

/* 15.5 Polling vs webhook */
type Msg = { y: number; from: 'a' | 'b'; t: string; tone: 'p' | 'n' | 'ok' }
export function DgP7WebhookPolling() {
  const poll: Msg[] = [
    { y: 120, from: 'a', t: 'ada kejadian baru?', tone: 'p' },
    { y: 156, from: 'b', t: 'belum', tone: 'n' },
    { y: 192, from: 'a', t: 'ada kejadian baru?', tone: 'p' },
    { y: 228, from: 'b', t: 'belum', tone: 'n' },
    { y: 264, from: 'a', t: 'ada kejadian baru?', tone: 'p' },
    { y: 300, from: 'b', t: 'ya, ini datanya', tone: 'ok' },
  ]
  const hook: Msg[] = [
    { y: 120, from: 'a', t: 'POST /webhooks (daftar URL)', tone: 'p' },
    { y: 156, from: 'b', t: '201 Created', tone: 'n' },
    { y: 228, from: 'b', t: 'POST ke URL Anda (kejadian)', tone: 'ok' },
    { y: 264, from: 'a', t: '200 OK', tone: 'n' },
  ]
  const panel = (ox: number, items: Msg[]) => {
    const xa = ox + 70
    const xb = ox + 330
    return (
      <g>
        <Box x={xa - 55} y={62} w={110} h={30} label="Klien" tone="p" fs={11.5} />
        <Box x={xb - 55} y={62} w={110} h={30} label="API server" tone="a" fs={11.5} />
        <path d={`M${xa} 92 V320`} className="dg-life" />
        <path d={`M${xb} 92 V320`} className="dg-life" />
        {items.map((m, i) => (
          <g key={i}>
            <Arrow d={m.from === 'a' ? `M${xa} ${m.y} H${xb}` : `M${xb} ${m.y} H${xa}`} tone={m.tone} dash={m.from === 'b' && m.tone === 'n' || m.t === '200 OK'} />
            <T x={(xa + xb) / 2} y={m.y - 7} cls="dg-sb" size={11}>{m.t}</T>
          </g>
        ))}
      </g>
    )
  }
  return (
    <Fig title="Polling dan webhook" sub="Siapa yang memulai komunikasi saat ada kejadian" w={840} h={350}>
      <path d="M12 16 H414 V338 H12 Z" className="dg-region r-p" />
      <path d="M426 16 H828 V338 H426 Z" className="dg-region r-a" />
      <T x={213} y={42} cls="dg-cap-in">Polling: klien bertanya berkala</T>
      <T x={627} y={42} cls="dg-cap-in">Webhook: server memanggil klien</T>
      {panel(10, poll)}
      {panel(424, hook)}
      <T x={627} y={196} cls="dg-note">(waktu berlalu, tanpa lalu lintas)</T>
    </Fig>
  )
}

