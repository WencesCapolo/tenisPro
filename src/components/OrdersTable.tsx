import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Order {
  id: string
  customerName: string
  orderDate: string
  status: string
  total: number
}

// Sample data for demonstration
const sampleOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "John Doe",
    orderDate: "2024-01-15",
    status: "Completed",
    total: 129.99,
  },
  {
    id: "ORD-002",
    customerName: "Jane Smith",
    orderDate: "2024-01-16",
    status: "Pending",
    total: 89.50,
  },
  {
    id: "ORD-003",
    customerName: "Mike Johnson",
    orderDate: "2024-01-17",
    status: "Processing",
    total: 245.00,
  },
  {
    id: "ORD-004",
    customerName: "Sarah Wilson",
    orderDate: "2024-01-18",
    status: "Shipped",
    total: 156.75,
  },
  {
    id: "ORD-005",
    customerName: "David Brown",
    orderDate: "2024-01-19",
    status: "Completed",
    total: 78.25,
  },
]

interface OrdersTableProps {
  orders?: Order[]
}

export function OrdersTable({ orders = sampleOrders }: OrdersTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableCaption>A list of recent orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Order ID</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.customerName}</TableCell>
              <TableCell>{order.orderDate}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : order.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "Processing"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "Shipped"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
