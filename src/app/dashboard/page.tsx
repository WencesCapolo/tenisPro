"use client"
import { OrdersTable } from "@/components/OrdersTable"
import { DashboardStats } from "@/app/dashboard/DashboardStats"
import { OrderStatusChart, RevenueChart } from "@/app/dashboard/DashboardCharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Calendar, Filter } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestiona tus órdenes y obtén información valiosa sobre tu negocio
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

      {/* Statistics Cards with Quick Actions */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Estadísticas</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DashboardStats />
          </div>
          <div className="lg:col-span-4">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/nueva-orden">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Nueva Orden
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Cliente
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Orders Table - Centered */}
      <section className="space-y-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Órdenes Recientes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gestiona y supervisa todas las órdenes de tu negocio
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <OrdersTable filters={{ limit: 5 }} />
          </CardContent>
        </Card>
      </section>

      {/* Analytics Section with Order Status Chart */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Análisis y Métricas</h2>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/* Order Status Chart */}
            <OrderStatusChart />
          </div>
          <div className="lg:col-span-8">
            <RevenueChart />
          </div>
        </div>
      </section>
    </div>
  )
}
