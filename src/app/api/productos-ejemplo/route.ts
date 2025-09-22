import { db } from '@/lib/db'

export async function GET() {
  try {
    // Verificar si ya hay productos
    const existingProducts = await db.producto.findMany()
    
    if (existingProducts.length > 0) {
      return new Response(JSON.stringify({ 
        message: 'Ya existen productos en la base de datos',
        cantidad: existingProducts.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Obtener categorías
    const categorias = await db.categoria.findMany()
    
    // Crear productos de ejemplo para FatBoy
    const productos = [
      {
        nombre: 'Hamburguesa Clásica',
        descripcion: 'Hamburguesa de res con lechuga, tomate y cebolla',
        stockMinimo: 10,
        unidad: 'unidad',
        precio: 45.00,
        categoriaNombre: 'Hamburguesas'
      },
      {
        nombre: 'Hamburguesa con Queso',
        descripcion: 'Hamburguesa de res con queso cheddar',
        stockMinimo: 10,
        unidad: 'unidad',
        precio: 50.00,
        categoriaNombre: 'Hamburguesas'
      },
      {
        nombre: 'Papas Fritas Grandes',
        descripcion: 'Porción grande de papas fritas',
        stockMinimo: 20,
        unidad: 'porción',
        precio: 25.00,
        categoriaNombre: 'Papas y Acompañamientos'
      },
      {
        nombre: 'Papas Fritas Pequeñas',
        descripcion: 'Porción pequeña de papas fritas',
        stockMinimo: 20,
        unidad: 'porción',
        precio: 15.00,
        categoriaNombre: 'Papas y Acompañamientos'
      },
      {
        nombre: 'Refresco de Naranja',
        descripcion: 'Refresco de naranja 500ml',
        stockMinimo: 15,
        unidad: 'unidad',
        precio: 20.00,
        categoriaNombre: 'Bebidas'
      },
      {
        nombre: 'Agua Purificada',
        descripcion: 'Botella de agua 600ml',
        stockMinimo: 20,
        unidad: 'unidad',
        precio: 12.00,
        categoriaNombre: 'Bebidas'
      },
      {
        nombre: 'Helado de Vainilla',
        descripcion: 'Cono de helado de vainilla',
        stockMinimo: 10,
        unidad: 'unidad',
        precio: 18.00,
        categoriaNombre: 'Postres'
      },
      {
        nombre: 'Pan de Hamburguesa',
        descripcion: 'Pan para hamburguesa (paquete de 12)',
        stockMinimo: 5,
        unidad: 'paquete',
        precio: 30.00,
        categoriaNombre: 'Insumos'
      },
      {
        nombre: 'Carne Molida',
        descripcion: 'Carne molida para hamburguesas (kg)',
        stockMinimo: 3,
        unidad: 'kg',
        precio: 120.00,
        categoriaNombre: 'Insumos'
      }
    ]

    // Crear productos en la base de datos
    for (const producto of productos) {
      const categoria = categorias.find(cat => cat.nombre === producto.categoriaNombre)
      if (categoria) {
        await db.producto.create({
          data: {
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            stockMinimo: producto.stockMinimo,
            unidad: producto.unidad,
            precio: producto.precio,
            categoriaId: categoria.id,
            stockActual: Math.floor(Math.random() * 20) + 5 // Stock inicial aleatorio
          }
        })
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Productos de ejemplo creados correctamente',
      cantidad: productos.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error al crear productos de ejemplo:', error)
    return new Response(JSON.stringify({ error: 'Error al crear productos de ejemplo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}