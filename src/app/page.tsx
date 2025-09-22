"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, LogIn, UserPlus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const router = useRouter()
  const { toast } = useToast()

  const handleAuth = async () => {
    setIsLoading(true)
    const endpoint = authMode === 'signin' ? '/api/auth/sign-in' : '/api/auth/sign-up'
    const payload = authMode === 'signin' 
      ? { email, password } 
      : { email, password, nombre }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        if (authMode === 'signup') {
          toast({
            title: "Registro exitoso",
            description: "Ahora puedes iniciar sesión con tus credenciales.",
          })
          setAuthMode('signin') // Cambiar a la pestaña de login
        } else {
          // Para el login, almacenar datos del usuario y redirigir según el rol
          const { usuario } = data
          
          // Almacenar datos del usuario en localStorage
          localStorage.setItem('usuario', JSON.stringify(usuario))
          
          toast({
            title: "Bienvenido",
            description: `Has iniciado sesión correctamente como ${usuario.nombre}.`,
          })
          
          // Redirigir basado en el rol del usuario
          if (usuario.rol === 'admin') {
            router.push('/admin')
          } else if (usuario.rol === 'empleado') {
            router.push('/empleado')
          } else {
            // Rol no reconocido, mantener en página de inicio
            toast({
              title: "Advertencia",
              description: "Rol de usuario no reconocido.",
              variant: "destructive"
            })
          }
        }
      } else {
        toast({
          title: `Error de ${authMode === 'signin' ? 'autenticación' : 'registro'}`,
          description: data.error || "Ocurrió un error.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Error en ${authMode}:`, error)
      toast({
        title: "Error de red",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Inventario FatBoy
          </h1>
          <p className="text-gray-600">
            Gestiona el inventario de tu restaurante
          </p>
        </div>

        <Card className="shadow-lg">
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">
                <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup">
                <UserPlus className="mr-2 h-4 w-4" /> Registrarse
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>Ingresa tu email y contraseña para acceder.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Contraseña</Label>
                  <Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </CardContent>
            </TabsContent>
            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Registrarse</CardTitle>
                <CardDescription>Crea una nueva cuenta para empezar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre-signup">Nombre Completo</Label>
                  <Input id="nombre-signup" placeholder="Tu Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Contraseña</Label>
                  <Input id="password-signup" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <div className="p-6 pt-0">
            <Button 
              onClick={handleAuth} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </Button>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sistema de inventario para restaurante FatBoy</p>
        </div>
      </div>
    </div>
  )
}