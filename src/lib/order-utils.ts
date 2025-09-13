import { OrderWithRelations } from "@/server/api/order/order.types";
import { ProductName, ProductType } from "@prisma/client";

/**
 * Checks if an order contains any PELOTA products with PROFESIONAL type
 * @param order - The order with relations to check
 * @returns true if the order contains at least one PELOTA PROFESIONAL product
 */
export function hasProfessionalTennisBall(order: OrderWithRelations): boolean {
  return order.orderItems.some(item => 
    item.product.name === ProductName.PELOTA && 
    item.product.category === ProductType.PROFESIONAL
  );
}

/**
 * Gets all professional tennis ball items from an order
 * @param order - The order with relations to check
 * @returns Array of order items that are PELOTA PROFESIONAL
 */
export function getProfessionalTennisBallItems(order: OrderWithRelations) {
  return order.orderItems.filter(item => 
    item.product.name === ProductName.PELOTA && 
    item.product.category === ProductType.PROFESIONAL
  );
}

/**
 * Counts the total quantity of professional tennis balls in an order
 * @param order - The order with relations to check
 * @returns Total quantity of PELOTA PROFESIONAL items
 */
export function countProfessionalTennisBalls(order: OrderWithRelations): number {
  return getProfessionalTennisBallItems(order)
    .reduce((total, item) => total + item.quantity, 0);
}
