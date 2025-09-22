import { supabaseServerClient } from '@/lib/supabase'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre } = await request.json()

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseServerClient.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error('Error en Supabase Auth signUp:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
        return NextResponse.json({ error: 'No se pudo crear el usuario en Supabase' }, { status: 500 })
    }

    // 2. Crear el usuario en nuestra base de datos Prisma
    const newUser = await db.usuario.create({
      data: {
        id: authData.user.id, // Usar el ID de Supabase
        email,
        nombre,
        rol: 'empleado', // Por defecto, los nuevos usuarios son empleados
      },
    })

    return NextResponse.json({
      success: true,
      usuario: newUser,
    })

  } catch (error) {
    console.error('Error en el registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
