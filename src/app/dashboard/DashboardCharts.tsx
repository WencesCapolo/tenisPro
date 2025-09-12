"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api"
import { 
  BarChart3, 
  PieChart
} from "lucide-react"
import { 
  calculateMonthlyRevenue, 
  calculateOrderStats, 
  formatChartNumber 
} from "@/utils/dashboardCalculations"

export function OrderStatusChart() {
  const { data: ordersData, isLoading } = api.order.getAll.useQuery({
    page: 1,
    limit: 1000,
  })

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Estado de Órdenes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="h-2 w-full bg-muted animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const orders = ordersData?.data || []
  const statusCounts = {
    PENDIENTE: orders.filter(o => o.orderStatus === 'PENDIENTE').length,
    PROCESANDO: orders.filter(o => o.orderStatus === 'PROCESANDO').length,
    DESPACHADO: orders.filter(o => o.orderStatus === 'DESPACHADO').length,
    CANCELADO: orders.filter(o => o.orderStatus === 'CANCELADO').length,
  }

  const total = orders.length
  const statusData = [
    {
      label: 'Pendientes',
      count: statusCounts.PENDIENTE,
      percentage: total > 0 ? (statusCounts.PENDIENTE / total) * 100 : 0,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      label: 'En Proceso',
      count: statusCounts.PROCESANDO,
      percentage: total > 0 ? (statusCounts.PROCESANDO / total) * 100 : 0,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      label: 'Completadas',
      count: statusCounts.DESPACHADO,
      percentage: total > 0 ? (statusCounts.DESPACHADO / total) * 100 : 0,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      label: 'Canceladas',
      count: statusCounts.CANCELADO,
      percentage: total > 0 ? (statusCounts.CANCELADO / total) * 100 : 0,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
  ]

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Estado de Órdenes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {statusData.map((status, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${status.color}`}></div>
                  <span className="text-sm font-medium text-foreground">{status.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{status.count}</span>
                  <span className={`text-xs ${status.textColor}`}>
                    {status.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={status.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RevenueChart() {
  const { data: ordersData, isLoading } = api.order.getAll.useQuery({
    page: 1,
    limit: 1000,
  })

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Ingresos por Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
        </CardContent>
      </Card>
    )
  }

  // Calculate real monthly revenue data from orders
  const orders = ordersData?.data || []
  const monthlyRevenue = calculateMonthlyRevenue(orders, 6)

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1) // Ensure at least 1 to avoid division by zero

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Ingresos por Mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-end justify-between gap-2">
          {monthlyRevenue.map((data, index) => (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div className="text-xs text-muted-foreground font-medium">
                ${formatChartNumber(data.revenue)}
              </div>
              <div 
                className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md transition-all duration-300 hover:from-primary/80 hover:to-primary/40"
                style={{ 
                  height: `${maxRevenue > 0 ? (data.revenue / maxRevenue) * 160 : 8}px`,
                  minHeight: '8px'
                }}
              ></div>
              <div className="text-xs font-medium text-foreground">{data.month}</div>
              <div className="text-xs text-muted-foreground">{data.orders} órdenes</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

