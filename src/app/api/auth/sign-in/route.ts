import { supabaseServerClient } from '@/lib/supabase'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServerClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error en Supabase Auth signIn:', error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'No se pudo obtener los datos del usuario' }, { status: 401 })
    }

    // Obtener datos del usuario desde nuestra base de datos
    const usuario = await db.usuario.findUnique({
      where: { id: data.user.id }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado en la base de datos local' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    })

  } catch (error) {
    console.error('Error en el inicio de sesión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
