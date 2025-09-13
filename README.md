# 🎾 TenisPro - Order Management System

> A comprehensive order management solution for tennis equipment companies

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![tRPC](https://img.shields.io/badge/tRPC-10.45-398ccb?style=for-the-badge&logo=trpc)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🚀 Overview

TenisPro is a modern, full-stack web application designed to streamline order management for tennis equipment companies. Built with cutting-edge technologies and following industry best practices, it provides a robust, scalable, and maintainable solution for managing orders, customers, and inventory.

The application features a clean, intuitive interface that allows teams to manage orders faster and smarter, reducing processing time from days to seconds through automation and intelligent workflows.

## ✨ Features

- **📊 Dashboard Analytics** - Real-time order statistics and performance metrics
- **🛒 Order Management** - Complete order lifecycle from creation to delivery
- **👥 Customer Management** - Comprehensive customer profiles and history
- **📦 Inventory Tracking** - Real-time stock levels and product management
- **🔄 Status Automation** - Intelligent order status transitions with validation
- **📧 Email Notifications** - AI-powered email generation for order updates
- **📱 Responsive Design** - Mobile-first approach with modern UI components
- **🔍 Advanced Filtering** - Powerful search and filtering capabilities
- **📈 Reporting** - Detailed order analytics and business insights
- **🏆 Creative Detail Badge** - Special golden badge for premium "PELOTA PROFESIONAL" orders

## 🏆 Creative Detail Feature

The **"Detalle creativo"** is a special visual indicator that highlights premium orders in the system. When an order meets specific criteria, it displays a distinctive golden badge to emphasize its importance and premium nature.

### When the Badge Appears

The Creative Detail badge is automatically displayed when an order has:
- **Product Name**: `PELOTA`
- **Product Type**: `PROFESIONAL`

### Visual Design

The badge features:
- **Golden color scheme** to convey premium quality
- **Eye-catching design** that stands out in the order list
- **Consistent styling** that maintains the application's visual hierarchy

This feature helps users quickly identify high-value professional tennis ball orders, ensuring they receive the attention and priority handling they deserve in the order management workflow.

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Backend** | tRPC, Prisma ORM, PostgreSQL |
| **UI/UX** | shadcn/ui, TailwindCSS, Lucide Icons |
| **State Management** | TanStack Query (React Query) |
| **Validation** | Zod schemas |
| **AI Integration** | OpenAI API |
| **Development** | ESLint, Prettier, TypeScript |
| **Database** | Supabase PostgreSQL |

## 🏗️ Project Structure

TenisPro follows a **layered architecture** pattern that promotes separation of concerns, maintainability, and testability:

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard and analytics
│   ├── ordenes/          # Order management pages
│   ├── nueva-orden/      # Order creation
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/              # shadcn/ui base components
│   ├── forms/           # Form components
│   └── tables/          # Data table components
├── server/api/          # Backend API layer
│   ├── [entity]/        # Feature-based modules
│   │   ├── *.router.ts  # tRPC route definitions
│   │   ├── *.service.ts # Business logic layer
│   │   └── *.repository.ts # Data access layer
│   └── root.ts          # Main tRPC router
├── lib/                 # Utilities and configurations
│   ├── db.ts           # Prisma client
│   ├── result.ts       # Result Pattern implementation
│   └── errors.ts       # Custom error definitions
└── styles/             # Global styles
```

### 🎯 Router-Service-Repository Pattern

Each API feature follows a consistent **three-layer architecture**:

#### 1. **Router Layer** (`*.router.ts`)
- Defines tRPC endpoints and input validation
- Handles HTTP concerns and request/response mapping
- Uses Zod schemas for input validation
- Implements the `unwrap` pattern for clean error handling

```typescript
// Example: order.router.ts
export const orderRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return unwrap(await orderService.getById(input.id));
    }),
});
```

#### 2. **Service Layer** (`*.service.ts`)
- Contains business logic and validation rules
- Orchestrates multiple repository calls
- Implements business workflows and automation
- Returns `Result<T, AppError>` for type-safe error handling

```typescript
// Example: order.service.ts
async getById(id: string): Promise<Result<OrderWithRelations, AppError>> {
  const result = await this.orderRepository.findById(id);
  
  if (!result.success) {
    return result;
  }

  if (!result.data) {
    return err(createError.orderNotFound(id));
  }

  return ok(result.data);
}
```

#### 3. **Repository Layer** (`*.repository.ts`)
- Handles data persistence and retrieval
- Abstracts database operations
- Implements query optimization and relationships
- Provides type-safe database operations

```typescript
// Example: order.repository.ts
async findById(id: string): Promise<Result<OrderWithRelations | null, AppError>> {
  return safeAsync(async () => {
    return await this.db.order.findUnique({
      where: { id },
      include: { customer: true, orderItems: true }
    });
  });
}
```

## 🎨 Result Pattern

TenisPro implements the **Result Pattern** for robust, type-safe error handling without exceptions:

### Core Type Definition

```typescript
export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};
```

### Key Benefits

- **🛡️ Type Safety** - Compile-time error handling guarantees
- **🚫 No Exceptions** - Eliminates unexpected crashes from unhandled exceptions
- **🔗 Composable** - Easy to chain operations and propagate errors
- **📊 Structured Errors** - Consistent error codes and messages across the application
- **🐛 Better Debugging** - Clear error tracking with structured error information

### Usage Example

```typescript
// Service layer
async createOrder(input: CreateOrderInput): Promise<Result<Order, AppError>> {
  // Validate stock
  const stockResult = await this.validateStock(input.orderItems);
  if (!stockResult.success) {
    return stockResult; // Error propagation
  }

  // Create order
  const orderResult = await this.orderRepository.create(orderData);
  if (!orderResult.success) {
    return orderResult;
  }

  return ok(orderResult.data); // Success case
}

// Router layer (using unwrap helper)
createOrder: publicProcedure
  .input(createOrderSchema)
  .mutation(async ({ input }) => {
    return unwrap(await orderService.create(input));
  }),
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.18.0
- **npm** >= 9.0.0
- **PostgreSQL** database (or Supabase account)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tenisPro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local` file:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/tenispro"
   DIRECT_URL="postgresql://username:password@localhost:5432/tenispro"
   
   # OpenAI (for email generation)
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:deploy` | Deploy migrations to production |
| `npm run db:reset` | Reset database and run migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

## 📖 Usage Examples

### Creating a New Order

```typescript
// Using tRPC client
const createOrder = api.order.create.useMutation({
  onSuccess: (order) => {
    console.log('Order created:', order.orderNumber);
  },
});

const newOrder = await createOrder.mutateAsync({
  customer: {
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "+57 300 123 4567"
  },
  orderItems: [
    {
      productId: "clx1234567890",
      quantity: 2,
      unitPrice: 150000
    }
  ],
  shippingAddress: "Calle 123 #45-67, Bogotá, Colombia",
  notes: "Entrega en horario de oficina"
});
```

### Querying Orders with Filters

```typescript
// Get orders with pagination and filters
const { data: orders } = api.order.getAll.useQuery({
  page: 1,
  limit: 10,
  orderStatus: 'PENDIENTE',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  customerId: 'clx1234567890'
});
```

### Updating Order Status

```typescript
// Update order status with automatic email notification
const updateStatus = api.order.updateStatus.useMutation();

await updateStatus.mutateAsync({
  id: 'order-id',
  status: 'DESPACHADO',
  trackingNumber: 'TRK123456789'
});
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

**Wemceslao Capolo** - *Initial work and development*

---

<div align="center">
  <p>Built with ❤️ using Next.js, tRPC, and modern web technologies</p>
  <p>
    <a href="#-tenispro---order-management-system">Back to top</a>
  </p>
</div>