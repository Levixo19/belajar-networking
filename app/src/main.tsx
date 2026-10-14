import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
// Font baca: hanya @font-face yang didaftarkan; berkas font diunduh browser saat dipakai
import '@fontsource-variable/atkinson-hyperlegible-next'
import '@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css'
import '@fontsource-variable/lexend'
import '@fontsource-variable/source-sans-3'
import '@fontsource-variable/source-sans-3/wght-italic.css'
import '@fontsource-variable/literata/opsz.css'
import '@fontsource-variable/literata/opsz-italic.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
// Judul dan antarmuka (Fase 4). Prosa tetap Atkinson.
import '@fontsource-variable/space-grotesk'
import './index.css'
import { StoreProvider } from './lib/store'
import App from './App'
import Dashboard from './pages/Dashboard'
import ModulePage from './pages/ModulePage'
import ReviewPage from './pages/ReviewPage'
import ToolsPage from './pages/ToolsPage'
import ArenaPage from './pages/ArenaPage'

// Peta profesi memuat data profesi sendiri; dipisah agar bundle utama tetap ramping
const KarierPage = lazy(() => import('./pages/KarierPage'))
// Pustaka memuat ±1.100 tautan; dipisah dengan alasan yang sama
const PustakaPage = lazy(() => import('./pages/PustakaPage'))
const Memuat = () => (
  <div className="mx-auto max-w-[1280px] px-4 pt-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Memuat">
    <div className="h-14 w-2/3 max-w-xl animate-pulse rounded-xl bg-[var(--surface-3)]" />
    <div className="mt-10 aspect-[10/7] w-full animate-pulse rounded-2xl bg-[var(--surface-2)]" />
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Dashboard />} />
            <Route path="m/*" element={<ModulePage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/:tool" element={<ToolsPage />} />
            <Route path="arena" element={<ArenaPage />} />
            <Route path="arena/:game" element={<ArenaPage />} />
            <Route path="karier" element={<Suspense fallback={<Memuat />}><KarierPage /></Suspense>} />
            <Route path="karier/:id" element={<Suspense fallback={<Memuat />}><KarierPage /></Suspense>} />
            <Route path="pustaka" element={<Suspense fallback={<Memuat />}><PustakaPage /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>
)
