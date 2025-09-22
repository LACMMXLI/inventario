import { supabaseServerClient } from '@/lib/supabase'
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

    return NextResponse.json({
      success: true,
      session: data.session,
    })

  } catch (error) {
    console.error('Error en el inicio de sesión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
