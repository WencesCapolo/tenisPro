"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { OrderWithRelations } from "@/server/api/order/order.types";
import { OrderStatus } from "@prisma/client";
import { format } from "date-fns";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";

interface OrdersTableProps {
  filters?: {
    page?: number
    limit?: number
    orderStatus?: OrderStatus
    customerId?: string
    orderNumber?: string
    customerEmail?: string
    productId?: string
    dateFrom?: string
    dateTo?: string
    minAmount?: number
    maxAmount?: number
  }
}

// Component for a regular order row
const RegularOrderRow = ({ order }: { order: OrderWithRelations }) => {
  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case "DESPACHADO":
        return "success"
      case "PENDIENTE":
        return "secondary"
      case "PROCESANDO":
        return "default"
      case "CANCELADO":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "PENDIENTE":
        return "Pendiente"
      case "PROCESANDO":
        return "Procesando"
      case "DESPACHADO":
        return "Despachado"
      case "CANCELADO":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <TableRow className="hover:bg-muted/20 transition-all duration-200 group border-b border-border/30">
      <TableCell className="font-semibold text-foreground">{order.orderNumber}</TableCell>
      <TableCell className="font-medium text-foreground">{order.customer.name}</TableCell>
      <TableCell className="text-muted-foreground">{order.customer.email}</TableCell>
      <TableCell className="text-muted-foreground">{format(new Date(order.createdAt), "MMM dd, yyyy")}</TableCell>
      <TableCell>
        <OrderStatusSelect
          orderId={order.id}
          currentStatus={order.orderStatus}
        />
      </TableCell>
      <TableCell className="text-right font-semibold text-foreground">
        ${Number(order.totalAmount).toFixed(2)}
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm"
          asChild
          className="group-hover:bg-primary/10 group-hover:text-primary transition-colors"
        >
          <Link href={`/orders/${order.id}`}>
            Ver Detalles
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
};

// Component for an expandable order row (for grouping by customer)
const ExpandableOrderRow = ({ 
  customerName, 
  orders 
}: { 
  customerName: string; 
  orders: OrderWithRelations[]; 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (orders.length === 1 && orders[0]) {
    return <RegularOrderRow order={orders[0]} />;
  }

  const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case "DESPACHADO":
        return "success"
      case "PENDIENTE":
        return "secondary"
      case "PROCESANDO":
        return "default"
      case "CANCELADO":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "PENDIENTE":
        return "Pendiente"
      case "PROCESANDO":
        return "Procesando"
      case "DESPACHADO":
        return "Despachado"
      case "CANCELADO":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <>
      <TableRow 
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell colSpan={6}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{customerName}</span>
            <Badge variant="outline" className="ml-2">
              {orders.length} {orders.length === 1 ? "orden" : "ordenes"}
            </Badge>
            <ChevronRight 
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </div>
        </TableCell>
        <TableCell className="text-right">${totalAmount.toFixed(2)}</TableCell>
      </TableRow>
      {isExpanded && orders.map(order => (
        <TableRow key={order.id} className="bg-muted/30">
          <TableCell className="pl-8">{order.orderNumber}</TableCell>
          <TableCell>{order.customer.name}</TableCell>
          <TableCell>{order.customer.email}</TableCell>
          <TableCell>{format(new Date(order.createdAt), "MMM dd, yyyy")}</TableCell>
          <TableCell>
            <OrderStatusSelect
              orderId={order.id}
              currentStatus={order.orderStatus}
            />
          </TableCell>
          <TableCell className="text-right">${Number(order.totalAmount).toFixed(2)}</TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" asChild>
              <Link href={`/orders/${order.id}`}>
                Ver Detalles
              </Link>
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

export function OrdersTable({ filters = {} }: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { page = 1, limit = 10, ...otherFilters } = filters;
  
  const { data, isLoading, error } = api.order.getAll.useQuery({
    page,
    limit,
    ...otherFilters,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando ordenes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-destructive mb-2">Error cargando ordenes</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const orders = data?.data || [];

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return [
      order.orderNumber,
      order.customer.name,
      order.customer.email,
      order.orderStatus,
      order.totalAmount.toString()
    ].some((value) => (value ?? "").toLowerCase().includes(searchLower));
  });

  // Group orders by customer name for expandable functionality
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const customerName = order.customer.name;
    acc[customerName] ??= [];
    acc[customerName]?.push(order);
    return acc;
  }, {} as Record<string, OrderWithRelations[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm focus:shadow-md transition-all duration-200"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm hidden md:block shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="font-semibold text-foreground">Número de Orden</TableHead>
              <TableHead className="font-semibold text-foreground">Nombre del Cliente</TableHead>
              <TableHead className="font-semibold text-foreground">Email del Cliente</TableHead>
              <TableHead className="font-semibold text-foreground">Fecha de Orden</TableHead>
              <TableHead className="font-semibold text-foreground">Estado</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Total</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!groupedOrders || Object.keys(groupedOrders).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron ordenes.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedOrders).map(([customerName, customerOrders]) => (
                <ExpandableOrderRow 
                  key={customerName} 
                  customerName={customerName} 
                  orders={customerOrders}
                />
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>Total de Ordenes:</TableCell>
              <TableCell className="text-right font-medium">
                {filteredOrders.length}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Mobile Table */}
      <div className="space-y-4 md:hidden">
        <p className="text-sm text-muted-foreground text-center">
          Toca cualquier orden para ver detalles
        </p>
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                <TableHead className="py-4 font-semibold text-foreground">Orden</TableHead>
                <TableHead className="py-4 font-semibold text-foreground">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No se encontraron ordenes.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell 
                      className="font-medium py-6 cursor-pointer"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">{order.customer.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <OrderStatusSelect
                        orderId={order.id}
                        currentStatus={order.orderStatus}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}