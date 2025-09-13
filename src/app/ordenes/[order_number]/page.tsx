"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, CreditCard, MapPin, Package, Phone, Mail, User, FileText, Truck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrderStatus, ProductName, ProductType } from "@prisma/client";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";

interface OrderDetailPageProps {
  params: Promise<{
    order_number: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [orderNumber, setOrderNumber] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setOrderNumber(resolvedParams.order_number);
    });
  }, [params]);

  const { data: order, isLoading, error } = api.order.getByOrderNumber.useQuery({
    orderNumber: orderNumber,
  }, {
    enabled: !!orderNumber,
  });

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case "DESPACHADO":
        return "success" as const;
      case "PENDIENTE":
        return "secondary" as const;
      case "PROCESANDO":
        return "default" as const;
      case "CANCELADO":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "PENDIENTE":
        return "Pendiente";
      case "PROCESANDO":
        return "Procesando";
      case "DESPACHADO":
        return "Despachado";
      case "CANCELADO":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getProductNameLabel = (name: ProductName) => {
    switch (name) {
      case "RAQUETA":
        return "Raqueta";
      case "PELOTA":
        return "Pelota";
      case "RED":
        return "Red";
      case "ZAPATILLA":
        return "Zapatilla";
      default:
        return name;
    }
  };

  const getProductTypeLabel = (type: ProductType) => {
    switch (type) {
      case "PROFESIONAL":
        return "Profesional";
      case "ENTRENAMIENTO":
        return "Entrenamiento";
      case "RECREATIVA":
        return "Recreativa";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando detalles de la orden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">Error cargando la orden</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button asChild variant="outline">
              <Link href="/ordenes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Órdenes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Orden no encontrada</p>
            <Button asChild variant="outline">
              <Link href="/ordenes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Órdenes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/ordenes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Orden #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Creada el {format(new Date(order.createdAt), "PPP", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <OrderStatusSelect
            orderId={order.id}
            currentStatus={order.orderStatus}
          />
          <Badge variant={getStatusVariant(order.orderStatus)} className="text-sm px-3 py-1">
            {getStatusLabel(order.orderStatus)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos ({order.orderItems.length})
              </CardTitle>
              <CardDescription>
                Detalles de los productos en esta orden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{getProductNameLabel(item.product.name)}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {getProductTypeLabel(item.product.category)}
                              </Badge>
                              {item.product.brand && (
                                <span>• {item.product.brand}</span>
                              )}
                              {item.product.model && (
                                <span>• {item.product.model}</span>
                              )}
                            </div>
                            {item.product.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                          </span>
                          <span className="font-medium">
                            ${Number(item.totalPrice).toFixed(2)}
                          </span>
                        </div>
                        {Number(item.discount) > 0 && (
                          <div className="text-sm text-green-600">
                            Descuento: -${Number(item.discount).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < order.orderItems.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Orden creada</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "PPpp", { locale: es })}
                    </p>
                  </div>
                </div>
                
                {order.shippedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Orden despachada</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.shippedAt), "PPpp", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                
                {order.deliveredAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Orden entregada</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.deliveredAt), "PPpp", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                
                {order.cancelledAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Orden cancelada</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.cancelledAt), "PPpp", { locale: es })}
                      </p>
                      {order.cancellationReason && (
                        <p className="text-sm text-muted-foreground">
                          Razón: {order.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.notes || order.customerNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.customerNotes && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Notas del cliente:</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {order.customerNotes}
                    </p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Notas internas:</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {order.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{order.customer.email}</span>
              </div>
              {order.customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.customer.phone}</span>
                </div>
              )}
              {order.customer.companyName && (
                <div>
                  <p className="text-sm font-medium">Empresa:</p>
                  <p className="text-sm text-muted-foreground">{order.customer.companyName}</p>
                </div>
              )}
              {order.customer.taxId && (
                <div>
                  <p className="text-sm font-medium">NIT/CC:</p>
                  <p className="text-sm text-muted-foreground">{order.customer.taxId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {(order.shippingAddress || order.trackingNumber) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.shippingAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Dirección de envío:</p>
                      <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                    </div>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <p className="text-sm font-medium">Número de seguimiento:</p>
                    <p className="text-sm text-muted-foreground font-mono">{order.trackingNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing Address */}
          {order.billingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Facturación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Dirección de facturación:</p>
                    <p className="text-sm text-muted-foreground">{order.billingAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Impuestos:</span>
                  <span>${Number(order.taxAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(order.shippingCost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Envío:</span>
                  <span>${Number(order.shippingCost).toFixed(2)}</span>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
