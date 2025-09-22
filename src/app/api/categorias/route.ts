import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categorias = await db.categoria.findMany({
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}