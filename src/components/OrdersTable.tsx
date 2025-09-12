import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import { OrderWithRelations } from "@/server/api/order/order.types"
import { OrderStatus } from "@prisma/client"
import { format } from "date-fns"

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

export function OrdersTable({ filters = {} }: OrdersTableProps) {
  const { page = 1, limit = 10, ...otherFilters } = filters
  
  const { data, isLoading, error } = api.order.getAll.useQuery({
    page,
    limit,
    ...otherFilters,
  })

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
    )
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
    )
  }

  const orders = data?.data || []

  if (orders.length === 0) {
    return (
      <div className="w-full">
        <Table>
          <TableCaption>No se encontraron ordenes.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Número de orden</TableHead>
              <TableHead>Nombre del cliente</TableHead>
              <TableHead>Fecha de orden</TableHead>
              <TableHead>Estado</TableHead> 
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No se encontraron ordenes
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DESPACHADO":
        return "bg-green-100 text-green-800"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800"
      case "PROCESANDO":
        return "bg-blue-100 text-blue-800"
      case "CANCELADO":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
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
    <div className="w-full">
      <Table>
        <TableCaption>
          Mostrando {orders.length} de {data?.pagination?.total || 0} ordenes
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Número de orden</TableHead>
            <TableHead>Nombre del cliente</TableHead>
            <TableHead>Fecha de orden</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: OrderWithRelations) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell>
                {format(new Date(order.createdAt), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {getStatusLabel(order.orderStatus)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                ${order.totalAmount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
