"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ShoppingCart 
} from "lucide-react"
import { calculateOrderStats, formatCurrency } from "@/utils/dashboardCalculations"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  isLoading?: boolean
}

function StatCard({ title, value, description, icon, trend, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
            {description && (
              <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-primary/70">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${
              !trend.isPositive ? 'rotate-180' : ''
            }`} />
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardStats() {
  // This would typically fetch real data from your API
  const { data: ordersData, isLoading: ordersLoading } = api.order.getAll.useQuery({
    page: 1,
    limit: 1000, // Get all orders for stats
  })

  // Calculate statistics from the orders data
  const orders = ordersData?.data || []
  const { totalOrders, totalRevenue, uniqueCustomers, completionRate } = calculateOrderStats(orders)

  const stats = [
    {
      title: "Total de Órdenes",
      value: totalOrders.toLocaleString(),
      description: "Órdenes totales registradas",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      title: "Ingresos Totales",
      value: formatCurrency(totalRevenue),
      description: "Ingresos acumulados",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Clientes Únicos",
      value: uniqueCustomers.toLocaleString(),
      description: "Clientes registrados",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Tasa de Finalización",
      value: `${completionRate}%`,
      description: "Órdenes completadas vs total",
      icon: <CheckCircle className="h-4 w-4" />,
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          isLoading={ordersLoading}
        />
      ))}
    </div>
  )
}
