"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Package, Plus, Minus, RefreshCw, Search } from "lucide-react"
import { Producto } from "@prisma/client"

interface ProductoConCategoria extends Producto {
  categoria: {
    nombre: string
  }
}

export default function EmpleadoPage() {
  const [productos, setProductos] = useState<ProductoConCategoria[]>([])
  const [filteredProductos, setFilteredProductos] = useState<ProductoConCategoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("todas")
  const [actualizandoStock, setActualizandoStock] = useState<{[key: string]: number}>({})
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const usuario = localStorage.getItem("usuario")
    if (!usuario) {
      router.push("/")
      return
    }

    const userData = JSON.parse(usuario)
    if (userData.rol !== "empleado") {
      router.push("/")
      return
    }

    cargarProductos()
  }, [router])

  useEffect(() => {
    // Filtrar productos
    let filtered = productos

    if (searchTerm) {
      filtered = filtered.filter(producto => 
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoriaFilter !== "todas") {
      filtered = filtered.filter(producto => producto.categoria.nombre === categoriaFilter)
    }

    setFilteredProductos(filtered)
  }, [productos, searchTerm, categoriaFilter])

  const cargarProductos = async () => {
    try {
      const response = await fetch("/api/productos")
      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const actualizarStock = async (productoId: string, cantidad: number, tipo: "entrada" | "salida") => {
    if (cantidad <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive"
      })
      return
    }

    setActualizandoStock(prev => ({ ...prev, [productoId]: cantidad }))

    try {
      const response = await fetch("/api/movimientos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productoId,
          tipo,
          cantidad,
          motivo: `Ajuste manual - ${tipo === "entrada" ? "Incremento" : "Decremento"}`
        })
      })

      if (response.ok) {
        toast({
          title: "Stock actualizado",
          description: `Se ha ${tipo === "entrada" ? "agregado" : "quitado"} ${cantidad} unidades`
        })
        cargarProductos() // Recargar productos
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "No se pudo actualizar el stock",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      })
    } finally {
      setActualizandoStock(prev => {
        const nuevo = { ...prev }
        delete nuevo[productoId]
        return nuevo
      })
    }
  }

  const getStockStatus = (producto: ProductoConCategoria) => {
    if (producto.stockActual === 0) return { color: "destructive", text: "Agotado" }
    if (producto.stockActual <= producto.stockMinimo) return { color: "secondary", text: "Bajo" }
    return { color: "default", text: "Normal" }
  }

  const handleLogout = () => {
    localStorage.removeItem("usuario")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Inventario FatBoy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Modo Empleado</span>
              <Button variant="outline" onClick={handleLogout}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Buscar Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Buscar por nombre</Label>
                <Input
                  id="search"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    <SelectItem value="Hamburguesas">Hamburguesas</SelectItem>
                    <SelectItem value="Bebidas">Bebidas</SelectItem>
                    <SelectItem value="Papas y Acompañamientos">Papas y Acompañamientos</SelectItem>
                    <SelectItem value="Postres">Postres</SelectItem>
                    <SelectItem value="Insumos">Insumos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProductos.map((producto) => {
            const stockStatus = getStockStatus(producto)
            return (
              <Card key={producto.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                      <CardDescription>{producto.categoria.nombre}</CardDescription>
                    </div>
                    <Badge variant={stockStatus.color as any}>
                      {stockStatus.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock Actual:</span>
                      <span className="font-semibold text-lg">{producto.stockActual} {producto.unidad}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock Mínimo:</span>
                      <span className="text-sm">{producto.stockMinimo} {producto.unidad}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Ajustar Stock</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          min="1"
                          value={actualizandoStock[producto.id] || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            setActualizandoStock(prev => ({ ...prev, [producto.id]: value }))
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => actualizarStock(producto.id, actualizandoStock[producto.id] || 0, "entrada")}
                          disabled={!actualizandoStock[producto.id]}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actualizarStock(producto.id, actualizandoStock[producto.id] || 0, "salida")}
                          disabled={!actualizandoStock[producto.id]}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredProductos.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}