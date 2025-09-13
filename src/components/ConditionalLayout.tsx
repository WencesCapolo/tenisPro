"use client"

import { usePathname } from "next/navigation"
import { NavBar } from "@/components/NavBar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  if (isHomePage) {
    // Homepage layout without navbar
    return (
      <div className="min-h-screen bg-background font-sans antialiased">
        {children}
      </div>
    )
  }

  // Default layout with navbar for other pages
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <NavBar />
      <main className="md:ml-72">
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
