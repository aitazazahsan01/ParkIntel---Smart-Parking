import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
        
        {/* App Logo/Title - Enhanced Design */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-110">
            <span className="text-xl text-white font-extrabold">P</span>
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            ParkIntel
          </span>
        </Link>
        
        {/* Right-side content */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>

      </div>
    </header>
  )
}