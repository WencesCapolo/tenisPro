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
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-sidebar border-r border-sidebar-border hidden md:block shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-20 items-center justify-center border-b border-sidebar-border bg-gradient-to-r from-sidebar to-sidebar/90">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent shadow-lg group-hover:scale-105 transition-transform">
                <Package className="h-6 w-6 text-sidebar-accent-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-sidebar-foreground">TenisPro</span>
                <span className="text-xs text-sidebar-foreground/70">Gestión de Órdenes</span>
              </div>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 p-6">
            <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-4">
              Navegación Principal
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-sidebar-accent/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  pathname === item.href
                    ? "bg-sidebar-accent-foreground/10"
                    : "group-hover:bg-sidebar-accent-foreground/5"
                )}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 text-xs text-sidebar-foreground/50">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-accent/20">
                <Settings className="h-3 w-3" />
              </div>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden shadow-sm">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">TenisPro</span>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 hover:bg-primary/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="border-t bg-background/95 backdrop-blur">
            <nav className="space-y-1 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    pathname === item.href 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                    pathname === item.href
                      ? "bg-primary-foreground/10"
                      : "bg-primary/5"
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