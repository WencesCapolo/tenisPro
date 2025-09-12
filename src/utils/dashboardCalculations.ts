/**
 * Dashboard calculation utilities for consistent data processing
 */

import { OrderWithRelations } from "@/server/api/order/order.types";

export interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  monthStart: Date;
  monthEnd: Date;
}

/**
 * Calculate monthly revenue data for the last N months
 */
export function calculateMonthlyRevenue(orders: OrderWithRelations[], monthsCount: number = 6): MonthlyData[] {
  const monthsData: MonthlyData[] = [];
  const currentDate = new Date();
  
  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('es-ES', { month: 'short' });
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
    
    // Filter orders for this month
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= monthStart && orderDate <= monthEnd;
    });
    
    const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    monthsData.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Capitalize first letter
      revenue: monthRevenue,
      orders: monthOrders.length,
      monthStart,
      monthEnd,
    });
  }
  
  return monthsData;
}

/**
 * Calculate order statistics
 */
export function calculateOrderStats(orders: OrderWithRelations[]) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  
  // Status counts
  const statusCounts = {
    PENDIENTE: orders.filter(order => order.orderStatus === 'PENDIENTE').length,
    PROCESANDO: orders.filter(order => order.orderStatus === 'PROCESANDO').length,
    DESPACHADO: orders.filter(order => order.orderStatus === 'DESPACHADO').length,
    CANCELADO: orders.filter(order => order.orderStatus === 'CANCELADO').length,
  };
  
  // Unique customers
  const uniqueCustomers = new Set(orders.map(order => order.customerId)).size;
  
  // Completion rate
  const completionRate = totalOrders > 0 ? Math.round((statusCounts.DESPACHADO / totalOrders) * 100) : 0;
  
  return {
    totalOrders,
    totalRevenue,
    statusCounts,
    uniqueCustomers,
    completionRate,
  };
}



/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-ES', { 
    style: 'currency', 
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format large numbers for charts (e.g., 1000 -> 1k)
 */
export function formatChartNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k';
  } else {
    return value.toFixed(0);
  }
}
