import Link from 'next/link'
import { Car, BarChart2, BrainCircuit, Zap, DollarSign } from 'lucide-react'

// Re-usable button classes for consistency
const buttonClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-11 px-8 py-3"

export default function WelcomePage() {
  return (
    // overflow-hidden prevents animation/glow artifacts from showing a scrollbar
    <main className="flex flex-col items-center overflow-hidden">

      {/* Hero Section */}
      <section className="relative w-full border-b dark:border-slate-800">
        <div className="container relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 pb-24 pt-16 text-center lg:pb-32 lg:pt-24">
          
          {/* Hero Glow Effect */}
          <div className="absolute -top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 opacity-20 filter blur-3xl dark:opacity-40" />

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Parking, Perfected.
            <span className="block bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Stop circling the block. ParkIntel uses real-time data and AI to
            predict parking availability, so you can find a spot, save fuel,
            and get on with your day.
          </p>

          <Link
            href="/map"
            className={`${buttonClasses} bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold shadow-lg`}
          >
            Find Parking Now
          </Link>
        </div>
        
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 -z-20 h-full w-full bg-white dark:bg-slate-950">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,rgba(240,240,240,0.8)_1px,transparent_1px),linear-gradient(to_bottom,rgba(240,240,240,0.8)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)]"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full border-b bg-background/50 py-16 dark:border-slate-800 md:py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our platform analyzes thousands of data points to deliver a seamless parking experience.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                <BrainCircuit className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold">AI Predictions</h3>
              <p className="text-muted-foreground">
                Our model forecasts spot availability based on time, events, and historical trends.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Real-Time Data</h3>
              <p className="text-muted-foreground">
                Get live occupancy status from our connected lots, directly on your map.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50">
                <DollarSign className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Dynamic Pricing</h3>
              <p className="text-muted-foreground">
                Prices adjust based on demand, helping you save money or maximize your lot's revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Cards Section */}
      <section className="container mx-auto grid max-w-5xl grid-cols-1 gap-8 py-16 md:grid-cols-2 md:py-24">
        
        {/* Card 1: For Drivers (with Hover Glow) */}
        <div className="relative group">
          {/* The Glow Effect */}
          <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70" />
          {/* The Card Content */}
          <div className="relative flex h-full flex-col justify-between rounded-lg border bg-card p-6 shadow-sm dark:border-slate-800">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <Car className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">For Drivers</h3>
              <p className="text-muted-foreground">
                Find the best spot, instantly. See real-time data and AI-powered predictions. Create a free account to save your favorite locations and view your parking history.
              </p>
            </div>
            <Link
              href="/login"
              className={`${buttonClasses} bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full`}
            >
              Sign In to Park
            </Link>
          </div>
        </div>

        {/* Card 2: For Owners (with Hover Glow) */}
        <div className="relative group">
          {/* The Glow Effect */}
          <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-teal-500 to-purple-500 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70" />
          {/* The Card Content */}
          <div className="relative flex h-full flex-col justify-between rounded-lg border bg-card p-6 shadow-sm dark:border-slate-800">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <BarChart2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">For Lot Owners</h3>
              <p className="text-muted-foreground">
                Turn your lot into a smart-revenue asset. Use our dashboard for demand forecasts, dynamic pricing, and real-time analytics to maximize your occupancy and income.
              </p>
            </div>
            <Link
              href="/register-lot"
              className={`${buttonClasses} bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full`}
            >
              Register Your Parking
            </Link>
          </div>
        </div>

      </section>
      
      {/* Footer */}
      <footer className="container py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ParkIntel. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
