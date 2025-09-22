import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { productoId, tipo, cantidad, motivo } = await request.json()

    if (!productoId || !tipo || !cantidad) {
      return NextResponse.json(
        { error: 'Producto, tipo y cantidad son requeridos' },
        { status: 400 }
      )
    }

    if (tipo !== 'entrada' && tipo !== 'salida') {
      return NextResponse.json(
        { error: 'Tipo debe ser "entrada" o "salida"' },
        { status: 400 }
      )
    }

    // Obtener el producto actual
    const producto = await db.producto.findUnique({
      where: { id: productoId }
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Calcular nuevo stock
    let nuevoStock = producto.stockActual
    if (tipo === 'entrada') {
      nuevoStock += cantidad
    } else {
      if (nuevoStock < cantidad) {
        return NextResponse.json(
          { error: 'Stock insuficiente para la salida' },
          { status: 400 }
        )
      }
      nuevoStock -= cantidad
    }

    // Obtener usuario del localStorage (en un sistema real esto vendría de un token)
    // Para este ejemplo, usaremos un usuario por defecto
    const usuario = await db.usuario.findFirst()

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Crear movimiento y actualizar stock en una transacción
    const result = await db.$transaction([
      // Actualizar stock del producto
      db.producto.update({
        where: { id: productoId },
        data: { stockActual: nuevoStock }
      }),
      // Crear movimiento
      db.movimientoInventario.create({
        data: {
          tipo,
          cantidad,
          motivo: motivo || `${tipo === 'entrada' ? 'Entrada' : 'Salida'} de stock`,
          productoId,
          usuarioId: usuario.id
        }
      })
    ])

    return NextResponse.json({
      message: 'Stock actualizado correctamente',
      producto: result[0],
      movimiento: result[1]
    })

  } catch (error) {
    console.error('Error al crear movimiento:', error)
    return NextResponse.json(
      { error: 'Error al crear movimiento' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const movimientos = await db.movimientoInventario.findMany({
      include: {
        producto: {
          include: {
            categoria: true
          }
        },
        usuario: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Últimos 50 movimientos
    })

    return NextResponse.json(movimientos)
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    )
  }
}