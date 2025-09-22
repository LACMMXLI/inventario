"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BasicInput } from "@/components/ui/basic-input"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [codigo, setCodigo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async () => {
    console.log("Intentando login con código:", codigo)
    console.log("Longitud del código:", codigo.length)
    
    if (codigo.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Por favor ingresa el código de 6 dígitos completo.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("Enviando solicitud a /api/auth con:", { codigo })
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ codigo })
      })

      console.log("Respuesta status:", response.status)
      const data = await response.json()
      console.log("Respuesta data:", data)

      if (response.ok) {
        // Guardar información del usuario en localStorage (para este ejemplo)
        localStorage.setItem("usuario", JSON.stringify(data.usuario))
        
        toast({
          title: "Bienvenido",
          description: `Hola, ${data.usuario.nombre}!`
        })

        // Redirigir según el rol
        if (data.usuario.rol === "admin") {
          router.push("/admin")
        } else {
          router.push("/empleado")
        }
      } else {
        toast({
          title: "Error de autenticación",
          description: data.error || "Código incorrecto",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error en login:", error)
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
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
            Gestiona el inventario de tu restaurante FatBoy
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tu código de 6 dígitos para acceder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <BasicInput
                value={codigo}
                onChange={setCodigo}
                maxLength={6}
                placeholder="Ingresa el código de 6 dígitos"
              />
              
              <div className="text-sm text-gray-500 text-center">
                <p>Administrador: 728654</p>
                <p>Empleado: 123456</p>
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              disabled={isLoading || codigo.length !== 6}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sistema de inventario para restaurante FatBoy</p>
        </div>
      </div>
    </div>
  )
}