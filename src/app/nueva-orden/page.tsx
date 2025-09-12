"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Loader2 } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Form validation schema
const orderFormSchema = z.object({
  // Customer information (required only for new customers)
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  
  // Customer address information (optional)
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  
  // Business information (optional)
  taxId: z.string().optional(),
  companyName: z.string().optional(),
  
  // Order items (required - at least one item)
  orderItems: z.array(z.object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
  })).min(1, "At least one product is required"),
  
  // Order details (optional)
  notes: z.string().optional(),
  customerNotes: z.string().optional(),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingCost: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
})

type OrderFormData = z.infer<typeof orderFormSchema>

export default function NuevaOrdenPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [submitError, setSubmitError] = useState<string>("")
  
  // tRPC queries and mutations
  const { data: products, isLoading: productsLoading } = api.product.getActive.useQuery()
  const { data: customers } = api.customer.getAll.useQuery()
  const createOrderMutation = api.order.create.useMutation()
  
  
  // Form setup
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Colombia",
      taxId: "",
      companyName: "",
      orderItems: [{ productId: "", quantity: 1 }],
      notes: "",
      customerNotes: "",
      shippingAddress: "",
      billingAddress: "",
      shippingCost: 0,
      discount: 0,
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "orderItems",
  })
  
  // Form submission handler
  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)
    setSubmitError("")
    
    // Validate that either an existing customer is selected or new customer data is provided
    if (!selectedCustomerId && (!data.customerName || !data.customerEmail)) {
      setSubmitError("Debe seleccionar un cliente existente o completar los datos de un nuevo cliente")
      setIsSubmitting(false)
      return
    }

    // Validate that all order items have valid product IDs
    const validOrderItems = data.orderItems.filter(item => {
      return item.productId && item.productId.trim() !== "" && item.quantity > 0
    })
    
    if (validOrderItems.length === 0) {
      setSubmitError("Debe seleccionar al menos un producto para la orden")
      setIsSubmitting(false)
      return
    }

    
    try {
      // Create the order with either existing customer ID or new customer data
      const orderData = {
        orderItems: validOrderItems,
        notes: data.notes || undefined,
        customerNotes: data.customerNotes || undefined,
        shippingAddress: data.shippingAddress || data.address || undefined,
        billingAddress: data.billingAddress || data.address || undefined,
        shippingCost: data.shippingCost || 0,
        discount: data.discount || 0,
      }

      if (selectedCustomerId) {
        // Use existing customer
        await createOrderMutation.mutateAsync({
          ...orderData,
          customerId: selectedCustomerId,
        })
      } else {
        // Create order with new customer data
        await createOrderMutation.mutateAsync({
          ...orderData,
          customer: {
            name: data.customerName!,
            email: data.customerEmail!,
            phone: data.customerPhone || undefined,
            address: data.address || undefined,
            city: data.city || undefined,
            state: data.state || undefined,
            postalCode: data.postalCode || undefined,
            country: data.country || "Colombia",
            taxId: data.taxId || undefined,
            companyName: data.companyName || undefined,
          },
        })
      }
      
      // Redirect to dashboard on success
      router.push("/dashboard")
      
    } catch (error) {
      console.error("Error creating order:", error)
      setSubmitError("Error al crear la orden. Por favor, verifique los datos e intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle existing customer selection
  const handleExistingCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setShowNewCustomerForm(false)
    setSubmitError("") // Clear any previous errors
    
    // Clear form when selecting existing customer
    form.reset({
      ...form.getValues(),
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Colombia",
      taxId: "",
      companyName: "",
    })
  }

  // Handle new customer registration
  const handleNewCustomerClick = () => {
    setShowNewCustomerForm(true)
    setSelectedCustomerId("")
    setSubmitError("") // Clear any previous errors
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Nueva Orden</h2>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>
              Seleccione un cliente existente o registre uno nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Selection Options */}
            <div className="space-y-4">
              {/* Existing Customer Search/Select */}
              {customers && customers.length > 0 && (
                <div className="space-y-2">
                  <Label>Cliente Existente</Label>
                  <Select 
                    value={selectedCustomerId} 
                    onValueChange={handleExistingCustomerSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar y seleccionar cliente existente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Register New Customer Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNewCustomerClick}
                  className="w-full md:w-auto"
                >
                  Registrar Nuevo Cliente
                </Button>
              </div>
            </div>

            {/* New Customer Form - Only show when button is clicked */}
            {showNewCustomerForm && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium">Datos del Nuevo Cliente</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Required fields */}
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nombre *</Label>
                    <Input
                      id="customerName"
                      {...form.register("customerName")}
                      placeholder="Nombre completo del cliente"
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-sm text-red-500">{form.formState.errors.customerName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...form.register("customerEmail")}
                      placeholder="cliente@ejemplo.com"
                    />
                    {form.formState.errors.customerEmail && (
                      <p className="text-sm text-red-500">{form.formState.errors.customerEmail.message}</p>
                    )}
                  </div>
                  
                  {/* Optional fields */}
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Teléfono</Label>
                    <Input
                      id="customerPhone"
                      {...form.register("customerPhone")}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Empresa</Label>
                    <Input
                      id="companyName"
                      {...form.register("companyName")}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxId">NIT/CC</Label>
                    <Input
                      id="taxId"
                      {...form.register("taxId")}
                      placeholder="Número de identificación tributaria"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      {...form.register("country")}
                      placeholder="Colombia"
                    />
                  </div>
                </div>
                
                {/* Address section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Dirección</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        {...form.register("address")}
                        placeholder="Calle, número, barrio"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        {...form.register("city")}
                        placeholder="Ciudad"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">Departamento/Estado</Label>
                      <Input
                        id="state"
                        {...form.register("state")}
                        placeholder="Departamento"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Código Postal</Label>
                      <Input
                        id="postalCode"
                        {...form.register("postalCode")}
                        placeholder="110111"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show selected customer info */}
            {selectedCustomerId && customers && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Cliente Seleccionado:</h4>
                {(() => {
                  const customer = customers.find(c => c.id === selectedCustomerId)
                  return customer ? (
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Nombre:</strong> {customer.name}</p>
                      <p><strong>Email:</strong> {customer.email}</p>
                      {customer.phone && <p><strong>Teléfono:</strong> {customer.phone}</p>}
                      {customer.address && <p><strong>Dirección:</strong> {customer.address}</p>}
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Order Items Section */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>
              Agregue los productos a la orden. Debe incluir al menos un producto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Producto *</Label>
                  <Select
                    value={form.watch(`orderItems.${index}.productId`) || ""}
                    onValueChange={(value) => {
                      if (value && value.trim() !== "") {
                        form.setValue(`orderItems.${index}.productId`, value)
                        form.clearErrors(`orderItems.${index}.productId`)
                      }
                    }}
                    disabled={productsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={productsLoading ? "Cargando productos..." : "Seleccionar producto"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ${product.price.toString()} 
                          {product.availableAmount > 0 ? ` (Stock: ${product.availableAmount})` : " (Sin stock)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.orderItems?.[index]?.productId && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.orderItems[index]?.productId?.message}
                    </p>
                  )}
                </div>
                
                <div className="w-24 space-y-2">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`orderItems.${index}.quantity`, { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {form.formState.errors.orderItems?.[index]?.quantity && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.orderItems[index]?.quantity?.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ productId: "", quantity: 1 })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
            
            {form.formState.errors.orderItems && (
              <p className="text-sm text-red-500">{form.formState.errors.orderItems.message}</p>
            )}
          </CardContent>
        </Card>
        
        {/* Order Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Orden</CardTitle>
            <CardDescription>
              Información adicional sobre la orden (opcional).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingCost">Costo de Envío</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("shippingCost", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discount">Descuento</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("discount", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Dirección de Envío</Label>
              <Textarea
                id="shippingAddress"
                {...form.register("shippingAddress")}
                placeholder="Si es diferente a la dirección del cliente..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="billingAddress">Dirección de Facturación</Label>
              <Textarea
                id="billingAddress"
                {...form.register("billingAddress")}
                placeholder="Si es diferente a la dirección del cliente..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerNotes">Notas del Cliente</Label>
              <Textarea
                id="customerNotes"
                {...form.register("customerNotes")}
                placeholder="Comentarios o instrucciones del cliente..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Notas internas sobre la orden..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creando Orden..." : "Crear Orden"}
          </Button>
        </div>
      </form>
    </div>
  )
}
