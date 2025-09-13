"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Plus, 
  UserPlus, 
  Package, 
  Users, 
  Settings,
  Menu,
  X
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Órdenes",
    href: "/ordenes",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Nueva Orden",
    href: "/nueva-orden",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    title: "Nuevo Cliente",
    href: "/nuevo-cliente",
    icon: <UserPlus className="h-5 w-5" />,
  },
]

export function NavBar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */} 
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-gray-200 border-r border-gray-300 hidden md:block shadow-lg rounded-r-3xl">
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-20 items-center justify-center border-b border-gray-300 bg-gray-100 rounded-tr-3xl">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-300 shadow-md group-hover:scale-105 transition-transform">
                <Package className="h-6 w-6 text-gray-700" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-800">TenisPro</span>
                <span className="text-xs text-gray-600">Gestión de Órdenes</span>
              </div>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 p-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navegación Principal
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                  pathname === item.href
                    ? "bg-blue-300/70 text-blue-700 shadow-md"
                    : "text-gray-600 hover:bg-blue-300/50 hover:text-gray-700"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-2xl transition-colors",
                  pathname === item.href
                    ? "bg-blue-300/40"
                    : "group-hover:bg-blue-300/30"
                )}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-300">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                  <Settings className="h-3 w-3" />
                </div>
                <span>v1.0.0</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>Developed by</span>
                <img 
                  src="https://www.kyto.io/images/logos/logo-kyto-black.png" 
                  alt="Kyto Logo" 
                  className="h-4 w-auto"
                />
                <span className="font-medium">Kyto</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-gray-200/95 backdrop-blur supports-[backdrop-filter]:bg-gray-200/60 md:hidden shadow-sm rounded-b-3xl">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gray-300 shadow-sm">
              <Package className="h-4 w-4 text-gray-700" />
            </div>
            <span className="font-bold text-xl text-gray-800">TenisPro</span>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 hover:bg-gray-200/50 rounded-2xl"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
          </Button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-300 bg-gray-200/95 backdrop-blur rounded-b-3xl">
            <nav className="space-y-1 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                    pathname === item.href 
                      ? "bg-blue-300/70 text-blue-700 shadow-md" 
                      : "text-gray-600 hover:bg-blue-300/50 hover:text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-2xl transition-colors",
                    pathname === item.href
                      ? "bg-blue-300/40"
                      : "bg-blue-300/20"
                  )}>
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}