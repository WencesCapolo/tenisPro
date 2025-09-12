/*
  Warnings:

  - You are about to drop the column `product_type` on the `products` table. All the data in the column will be lost.
  - Changed the type of `name` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "products_product_type_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "product_type",
DROP COLUMN "name",
ADD COLUMN     "name" "ProductType" NOT NULL;

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");
