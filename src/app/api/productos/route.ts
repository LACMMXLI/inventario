import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const productos = await db.producto.findMany({
      include: {
        categoria: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, descripcion, stockMinimo, unidad, precio, categoriaId } = await request.json()

    if (!nombre || !categoriaId) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      )
    }

    const producto = await db.producto.create({
      data: {
        nombre,
        descripcion,
        stockMinimo: parseInt(stockMinimo) || 0,
        unidad: unidad || 'unidad',
        precio: precio ? parseFloat(precio) : null,
        categoriaId,
        stockActual: 0
      },
      include: {
        categoria: true
      }
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}