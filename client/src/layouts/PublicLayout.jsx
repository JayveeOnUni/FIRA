import { Outlet } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'

export function PublicLayout() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  return (
    <div className="min-h-screen text-slate-800">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {isDemoMode && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900" role="status">
          FIRA demo mode is enabled for thesis presentation and sample-data walkthroughs.
        </div>
      )}
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
