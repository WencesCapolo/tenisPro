import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { NavBar } from "@/components/NavBar"
import { TRPCProvider } from "@/lib/trpc-provider"

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
        <TRPCProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <NavBar />
            <main className="md:ml-64">
              <div className="container mx-auto p-6">
                {children}
              </div>
            </main>
          </div>
        </TRPCProvider>
      </body>
    </html>
  )
}
