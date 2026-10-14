import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import { nextModule } from '../lib/content'
import { isDue } from '../lib/srs'
import { IconHome, IconBook, IconCards, IconTools, IconUsers } from './icons'

/** Tab bar bawah untuk layar sempit: lima tujuan utama selalu satu ketukan. */
export default function MobileTabBar() {
  const s = useStore()
  const loc = useLocation()
  const lanjut = useMemo(() => nextModule(s.progress), [s.progress])
  const due = useMemo(() => Object.values(s.srs).filter(x => isDue(x)).length, [s.srs])
  const items = [
    { to: '/', label: 'Dasbor', Icon: IconHome, end: true },
    { to: `/m/${encodeURI(lanjut.id)}`, label: 'Lanjut', Icon: IconBook, aktif: loc.pathname.startsWith('/m/') },
    { to: '/review', label: 'Review', Icon: IconCards, badge: due },
    { to: '/tools', label: 'Alat', Icon: IconTools },
    { to: '/karier', label: 'Karier', Icon: IconUsers },
  ]
  return (
    <nav aria-label="Navigasi bawah" className="tabbar glass lg:hidden">
      {items.map(({ to, label, Icon, end, aktif, badge }) => (
        <NavLink key={label} to={to} end={end}
          className={({ isActive }) => `tabbar-item ${(aktif ?? isActive) ? 'is-on' : ''}`}>
          <span className="relative">
            <Icon size={21} />
            {badge ? <span className="badge-count absolute -right-2.5 -top-1.5 !h-4 !min-w-4 !text-[10px]">{badge > 99 ? '99+' : badge}</span> : null}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
