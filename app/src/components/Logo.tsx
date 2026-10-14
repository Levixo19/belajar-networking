/** Tanda merek: tiga node terhubung. Satu node beraksen menandai "tujuan". */
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="var(--fg)" />
      <path d="M21 42 32 22 43 42Z" fill="none" stroke="var(--fg-contrast)" strokeWidth="3.2"
        strokeLinejoin="round" opacity=".5" />
      <circle cx="32" cy="22" r="5.5" fill="var(--fg-contrast)" />
      <circle cx="21" cy="42" r="5.5" fill="var(--fg-contrast)" />
      <circle cx="43" cy="42" r="5.5" fill="var(--primary)" />
    </svg>
  )
}
