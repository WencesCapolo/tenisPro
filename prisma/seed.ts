import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'juan.perez@email.com' },
      update: {},
      create: {
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '+57 300 123 4567',
        address: 'Calle 123 #45-67',
        city: 'Bogotá',
        state: 'Cundinamarca',
        postalCode: '110111',
        country: 'Colombia',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'maria.gonzalez@email.com' },
      update: {},
      create: {
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        phone: '+57 301 234 5678',
        address: 'Carrera 50 #12-34',
        city: 'Medellín',
        state: 'Antioquia',
        postalCode: '050001',
        country: 'Colombia',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'carlos.rodriguez@email.com' },
      update: {},
      create: {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '+57 302 345 6789',
        address: 'Avenida 6 #23-45',
        city: 'Cali',
        state: 'Valle del Cauca',
        postalCode: '760001',
        country: 'Colombia',
      },
    }),
  ])

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'RAQ-PROF-001' },
      update: {},
      create: {
        name: 'RAQUETA',
        description: 'Raqueta profesional Wilson Pro Staff v14',
        price: 450000,
        availableAmount: 15,
        category: 'PROFESIONAL',
        brand: 'Wilson',
        model: 'Pro Staff v14',
        sku: 'RAQ-PROF-001',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PEL-ENTR-001' },
      update: {},
      create: {
        name: 'PELOTA',
        description: 'Pelotas de tenis Wilson US Open (pack 3)',
        price: 25000,
        availableAmount: 50,
        category: 'ENTRENAMIENTO',
        brand: 'Wilson',
        model: 'US Open',
        sku: 'PEL-ENTR-001',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'ZAP-PROF-001' },
      update: {},
      create: {
        name: 'ZAPATILLA',
        description: 'Zapatillas Nike Air Zoom Vapor Pro',
        price: 320000,
        availableAmount: 8,
        category: 'PROFESIONAL',
        brand: 'Nike',
        model: 'Air Zoom Vapor Pro',
        sku: 'ZAP-PROF-001',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'RED-RECR-001' },
      update: {},
      create: {
        name: 'RED',
        description: 'Red de tenis recreativa para entrenamiento',
        price: 180000,
        availableAmount: 5,
        category: 'RECREATIVA',
        brand: 'Babolat',
        model: 'Training Net',
        sku: 'RED-RECR-001',
      },
    }),
  ])

  // Create sample orders
  const orders = []
  
  // Order 1 - Juan Pérez
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-001',
      orderStatus: 'DESPACHADO',
      customerId: customers[0]!.id,
      totalAmount: 475000,
      subtotal: 475000,
      shippingAddress: 'Calle 123 #45-67, Bogotá',
      billingAddress: 'Calle 123 #45-67, Bogotá',
      createdAt: new Date('2025-01-10'),
      shippedAt: new Date('2025-01-12'),
      orderItems: {
        create: [
          {
            productId: products[0]!.id,
            quantity: 1,
            unitPrice: 450000,
            totalPrice: 450000,
          },
          {
            productId: products[1]!.id,
            quantity: 1,
            unitPrice: 25000,
            totalPrice: 25000,
          },
        ],
      },
    },
  })

  // Order 2 - María González
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-002',
      orderStatus: 'PROCESANDO',
      customerId: customers[1]!.id,
      totalAmount: 320000,
      subtotal: 320000,
      shippingAddress: 'Carrera 50 #12-34, Medellín',
      billingAddress: 'Carrera 50 #12-34, Medellín',
      createdAt: new Date('2025-01-15'),
      orderItems: {
        create: [
          {
            productId: products[2]!.id,
            quantity: 1,
            unitPrice: 320000,
            totalPrice: 320000,
          },
        ],
      },
    },
  })

  // Order 3 - Carlos Rodríguez
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-003',
      orderStatus: 'PENDIENTE',
      customerId: customers[2]!.id,
      totalAmount: 230000,
      subtotal: 230000,
      shippingAddress: 'Avenida 6 #23-45, Cali',
      billingAddress: 'Avenida 6 #23-45, Cali',
      createdAt: new Date('2025-01-20'),
      orderItems: {
        create: [
          {
            productId: products[1]!.id,
            quantity: 2,
            unitPrice: 25000,
            totalPrice: 50000,
          },
          {
            productId: products[3]!.id,
            quantity: 1,
            unitPrice: 180000,
            totalPrice: 180000,
          },
        ],
      },
    },
  })

  // Order 4 - Juan Pérez (another order)
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-004',
      orderStatus: 'DESPACHADO',
      customerId: customers[0]!.id,
      totalAmount: 50000,
      subtotal: 50000,
      shippingAddress: 'Calle 123 #45-67, Bogotá',
      billingAddress: 'Calle 123 #45-67, Bogotá',
      createdAt: new Date('2025-02-01'),
      shippedAt: new Date('2025-02-03'),
      orderItems: {
        create: [
          {
            productId: products[1]!.id,
            quantity: 2,
            unitPrice: 25000,
            totalPrice: 50000,
          },
        ],
      },
    },
  })

  orders.push(order1, order2, order3, order4)

  console.log(`✅ Created ${customers.length} customers`)
  console.log(`✅ Created ${products.length} products`)
  console.log(`✅ Created ${orders.length} orders`)
  console.log('🎉 Seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
