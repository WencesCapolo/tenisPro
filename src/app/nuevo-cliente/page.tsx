"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Form validation schema - matches the customer schema from the server
const customerFormSchema = z.object({
  // Required fields
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Ingrese un email válido"),
  
  // Optional fields
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  companyName: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerFormSchema>

export default function NuevoClientePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>("")
  
  // tRPC mutation for creating customer
  const createCustomerMutation = api.customer.create.useMutation()
  
  // Form setup
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Colombia",
      taxId: "",
      companyName: "",
    },
  })
  
  // Form submission handler
  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true)
    setSubmitError("")
    
    try {
      await createCustomerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        postalCode: data.postalCode || undefined,
        country: data.country || "Colombia",
        taxId: data.taxId || undefined,
        companyName: data.companyName || undefined,
      })
      
      // Redirect to dashboard on success
      router.push("/dashboard")
      
    } catch (error) {
      console.error("Error creating customer:", error)
      setSubmitError("Error al crear el cliente. Por favor, verifique los datos e intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h2>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Complete la información básica del cliente. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required fields */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Nombre completo del cliente"
                  className={form.formState.errors.name ? "border-red-500" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="cliente@ejemplo.com"
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              {/* Optional fields */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+57 300 123 4567"
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
          </CardContent>
        </Card>

        {/* Business Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Información Empresarial</CardTitle>
            <CardDescription>
              Complete esta sección si el cliente es una empresa (opcional).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* Address Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
            <CardDescription>
              Información de dirección del cliente (opcional).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  placeholder="Calle, número, barrio"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {isSubmitting ? "Creando Cliente..." : "Crear Cliente"}
          </Button>
        </div>
      </form>
    </div>
  )
}
