"use client";

import { useState } from "react";
import { OrderStatus } from "@prisma/client";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

// All status transitions are allowed - any status can change to any other
const getAllowedTransitions = (currentStatus: OrderStatus): OrderStatus[] => {
  const allStatuses: OrderStatus[] = ['PENDIENTE', 'PROCESANDO', 'DESPACHADO', 'CANCELADO'];
  return allStatuses.filter(status => status !== currentStatus);
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  PROCESANDO: "Procesando",
  DESPACHADO: "Despachado",
  CANCELADO: "Cancelado",
};

const STATUS_VARIANTS: Record<OrderStatus, "success" | "secondary" | "default" | "destructive" | "outline"> = {
  DESPACHADO: "success",
  PENDIENTE: "secondary",
  PROCESANDO: "default",
  CANCELADO: "destructive",
};

export function OrderStatusSelect({ orderId, currentStatus, onStatusChange }: OrderStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const utils = api.useUtils();
  const { toast } = useToast();

  const updateStatusMutation = api.order.updateStatus.useMutation({
    onMutate: async (variables: { id: string; status: OrderStatus; reason?: string }) => {
      setIsUpdating(true);
      
      // Cancel outgoing queries to prevent overwriting optimistic updates
      await utils.order.getAll.cancel();
      
      // Get current data for all relevant queries
      const previousOrderData = utils.order.getAll.getData();
      
      // Optimistic update for orders table
      if (previousOrderData) {
        // Update all matching query keys (different pagination/filters)
        const queryKeys = [
          { page: 1, limit: 10 },
          { page: 1, limit: 1000 }, // For dashboard stats
        ];
        
        queryKeys.forEach(queryKey => {
          const currentData = utils.order.getAll.getData(queryKey);
          if (currentData) {
            utils.order.getAll.setData(
              queryKey,
              {
                ...currentData,
                data: currentData.data.map(order => 
                  order.id === orderId 
                    ? { 
                        ...order, 
                        orderStatus: variables.status,
                        // Update timestamps if needed
                        ...(variables.status === 'DESPACHADO' && { shippedAt: new Date() }),
                        ...(variables.status === 'CANCELADO' && { cancelledAt: new Date() }),
                      }
                    : order
                )
              }
            );
          }
        });
      }
      
      return { previousOrderData };
    },
    onError: (error, variables: { id: string; status: OrderStatus; reason?: string }, context) => {
      // Revert optimistic updates on error
      if (context?.previousOrderData) {
        // Revert all query keys that were optimistically updated
        const queryKeys = [
          { page: 1, limit: 10 },
          { page: 1, limit: 1000 },
        ];
        
        queryKeys.forEach(queryKey => {
          utils.order.getAll.setData(queryKey, context.previousOrderData);
        });
      }
      
      toast({
        title: "Error al actualizar estado",
        description: error.message || "No se pudo actualizar el estado de la orden",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables: { id: string; status: OrderStatus; reason?: string }) => {
      toast({
        title: "Estado actualizado",
        description: `La orden se cambió a ${STATUS_LABELS[variables.status]}`,
      });
      
      onStatusChange?.(variables.status);
    },
    onSettled: () => {
      setIsUpdating(false);
      // Invalidate all order-related queries to update dashboard metrics
      utils.order.getAll.invalidate();
      utils.order.getStats.invalidate(); // If this exists
      
      // Also invalidate any other queries that depend on order status
      utils.invalidate();
    },
  });

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;
    
    // No validation needed - all transitions are allowed
    try {
      await updateStatusMutation.mutateAsync({
        id: orderId,
        status: newStatus,
      });
    } catch (error) {
      // Error handling is done in the mutation callbacks
    }
  };

  const allowedTransitions = getAllowedTransitions(currentStatus);
  const canTransition = allowedTransitions.length > 0;

  // All statuses can transition, so this will always be true
  // Keeping the structure for consistency

  return (
    <div className="relative">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs border-0 bg-transparent hover:bg-muted/50 transition-colors">
          <SelectValue>
            <div className="flex items-center gap-2">
              {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
              <Badge 
                variant={STATUS_VARIANTS[currentStatus]} 
                className="font-medium shadow-sm border-0"
              >
                {STATUS_LABELS[currentStatus]}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Current status (disabled) */}
          <SelectItem value={currentStatus} disabled>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3" />
              <Badge variant={STATUS_VARIANTS[currentStatus]} className="text-xs">
                {STATUS_LABELS[currentStatus]} (actual)
              </Badge>
            </div>
          </SelectItem>
          
          {/* Available transitions */}
          {allowedTransitions.map((status) => (
            <SelectItem key={status} value={status}>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANTS[status]} className="text-xs">
                  {STATUS_LABELS[status]}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
