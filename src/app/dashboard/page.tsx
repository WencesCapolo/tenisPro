import { OrdersTable } from "@/components/OrdersTable"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Stats cards could go here in the future */}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">
                  Recent Orders
                </h3>
                <p className="text-sm text-muted-foreground">
                  You have processed {5} orders this month.
                </p>
              </div>
              <div className="p-6 pt-0">
                <OrdersTable />
              </div>
            </div>
          </div>
          <div className="col-span-3">
            {/* Additional dashboard widgets could go here */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Additional widgets coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
