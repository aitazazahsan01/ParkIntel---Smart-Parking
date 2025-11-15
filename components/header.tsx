import Link from 'next/link'
import { ParkingCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        
        {/* App Logo/Title */}
        <Link href="/" className="flex items-center space-x-2">
          <ParkingCircle className="h-6 w-6 text-indigo-600" />
          <span className="font-bold sm:inline-block">
            ParkIntel
          </span>
        </Link>
        
        {/* Right-side content (Theme Toggle) */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>

      </div>
    </header>
  )
}