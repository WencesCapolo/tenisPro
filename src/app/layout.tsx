import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { NavBar } from "@/components/NavBar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TenisPro - Order Management System",
  description: "A comprehensive order management solution for tennis equipment company",
  keywords: ["tennis", "equipment", "orders", "management", "TenisPro"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background font-sans antialiased">
          <NavBar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
