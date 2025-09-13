import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { NavBar } from "@/components/NavBar"
import { TRPCProvider } from "@/lib/trpc-provider"
import { Toaster } from "@/components/ui/toaster"
import { ConditionalLayout } from "@/components/ConditionalLayout"

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
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster />
        </TRPCProvider>
      </body>
    </html>
  )
}
