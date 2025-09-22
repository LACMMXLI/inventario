import { db } from '@/lib/db'

export async function GET() {
  try {
    // Verificar si ya existen usuarios
    const existingUsers = await db.usuario.findMany()
    
    if (existingUsers.length === 0) {
      // Crear usuarios por defecto
      await db.usuario.createMany({
        data: [
          {
            codigo: '728654',
            nombre: 'Administrador',
            rol: 'admin'
          },
          {
            codigo: '123456',
            nombre: 'Empleado',
            rol: 'empleado'
          }
        ]
      })
      
      // Crear categorías por defecto para restaurante FatBoy
      await db.categoria.createMany({
        data: [
          {
            nombre: 'Hamburguesas',
            descripcion: 'Hamburguesas y sandwiches'
          },
          {
            nombre: 'Bebidas',
            descripcion: 'Bebidas y refrescos'
          },
          {
            nombre: 'Papas y Acompañamientos',
            descripcion: 'Papas fritas y acompañamientos'
          },
          {
            nombre: 'Postres',
            descripcion: 'Postres y dulces'
          },
          {
            nombre: 'Insumos',
            descripcion: 'Ingredientes y materiales'
          }
        ]
      })
      
      return new Response(JSON.stringify({ 
        message: 'Base de datos inicializada correctamente',
        usuarios: 2,
        categorias: 5
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({ 
        message: 'La base de datos ya está inicializada',
        usuarios: existingUsers.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error)
    return new Response(JSON.stringify({ error: 'Error al inicializar la base de datos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}