"use client"
import { OrdersTable } from "@/components/OrdersTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, Filter } from "lucide-react"
import Link from "next/link"

export default function OrdenesPage() {
  return (
    <div className="flex-1 space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Órdenes
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestiona y supervisa todas las órdenes de tu negocio
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button asChild className="shadow-lg">
            <Link href="/nueva-orden">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Link>
          </Button>
        </div>
      </div>

      {/* Orders Table Section */}
      <section className="space-y-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Todas las Órdenes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vista completa de todas las órdenes del sistema
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <OrdersTable filters={{ limit: 50 }} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
