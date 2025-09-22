import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { codigo } = await request.json()
    
    if (!codigo || codigo.length !== 6) {
      return NextResponse.json(
        { error: 'Código de autenticación inválido' },
        { status: 400 }
      )
    }
    
    // Buscar usuario por código
    const usuario = await db.usuario.findUnique({
      where: { codigo }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Código de autenticación incorrecto' },
        { status: 401 }
      )
    }
    
    // En un sistema real, aquí se crearía un token JWT
    // Para este ejemplo, devolveremos los datos del usuario
    
    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    })
    
  } catch (error) {
    console.error('Error en autenticación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}