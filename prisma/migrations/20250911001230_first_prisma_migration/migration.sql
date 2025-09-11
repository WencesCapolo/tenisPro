-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('PROFESIONAL', 'ENTRENAMIENTO', 'RECREATIVA');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDIENTE', 'PROCESANDO', 'DESPACHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ORDER_STATUS_CHANGE', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'DELIVERY_CONFIRMATION', 'CANCELLATION_NOTICE');

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "available_amount" INTEGER NOT NULL,
    "product_type" "public"."ProductType" NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "sku" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT DEFAULT 'Colombia',
    "tax_id" TEXT,
    "company_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "order_status" "public"."OrderStatus" NOT NULL,
    "customer_id" TEXT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shipping_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "customer_notes" TEXT,
    "shipping_address" TEXT,
    "billing_address" TEXT,
    "tracking_number" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE INDEX "products_product_type_idx" ON "public"."products"("product_type");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "public"."products"("category");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "public"."products"("is_active");

-- CreateIndex
CREATE INDEX "products_is_deleted_idx" ON "public"."products"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "customers_is_active_idx" ON "public"."customers"("is_active");

-- CreateIndex
CREATE INDEX "customers_is_deleted_idx" ON "public"."customers"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "public"."orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "public"."orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_order_status_idx" ON "public"."orders"("order_status");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "public"."orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "public"."orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_is_deleted_idx" ON "public"."orders"("is_deleted");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "public"."order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "public"."order_items"("product_id");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
