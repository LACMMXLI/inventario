"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Package, Plus, Minus, RefreshCw, Search, Settings, BarChart3, ShoppingCart, Users, AlertTriangle } from "lucide-react"
import { Producto, Categoria } from "@prisma/client"

interface ProductoConCategoria extends Producto {
  categoria: {
    nombre: string
  }
}

interface MovimientoConDetalles {
  id: string
  tipo: string
  cantidad: number
  motivo: string
  createdAt: string
  producto: {
    nombre: string
    categoria: {
      nombre: string
    }
  }
  usuario: {
    nombre: string
    rol: string
  }
}

export default function AdminPage() {
  const [productos, setProductos] = useState<ProductoConCategoria[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoConDetalles[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("todas")
  const [actualizandoStock, setActualizandoStock] = useState<{[key: string]: number}>({})
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    descripcion: "",
    stockMinimo: "",
    unidad: "unidad",
    precio: "",
    categoriaId: ""
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
    if (userData.rol !== "admin") {
      router.push("/")
      return
    }

    cargarDatos()
  }, [router])

  const cargarDatos = async () => {
    try {
      const [productosRes, categoriasRes, movimientosRes] = await Promise.all([
        fetch("/api/productos"),
        fetch("/api/categorias"),
        fetch("/api/movimientos")
      ])

      if (productosRes.ok) {
        const productosData = await productosRes.json()
        setProductos(productosData)
      }

      if (categoriasRes.ok) {
        const categoriasData = await categoriasRes.json()
        setCategorias(categoriasData)
      }

      if (movimientosRes.ok) {
        const movimientosData = await movimientosRes.json()
        setMovimientos(movimientosData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar los datos",
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
        cargarDatos()
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

  const crearProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.categoriaId) {
      toast({
        title: "Error",
        description: "Nombre y categoría son requeridos",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nuevoProducto)
      })

      if (response.ok) {
        toast({
          title: "Producto creado",
          description: "El producto ha sido creado exitosamente"
        })
        setNuevoProducto({
          nombre: "",
          descripcion: "",
          stockMinimo: "",
          unidad: "unidad",
          precio: "",
          categoriaId: ""
        })
        setIsDialogOpen(false)
        cargarDatos()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "No se pudo crear el producto",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      })
    }
  }

  const getStockStatus = (producto: ProductoConCategoria) => {
    if (producto.stockActual === 0) return { color: "destructive", text: "Agotado" }
    if (producto.stockActual <= producto.stockMinimo) return { color: "secondary", text: "Bajo" }
    return { color: "default", text: "Normal" }
  }

  const productosConStockBajo = productos.filter(p => p.stockActual <= p.stockMinimo)
  const productosAgotados = productos.filter(p => p.stockActual === 0)

  const generarReporteWhatsApp = () => {
    const productosFaltantes = productos.filter(p => p.stockActual <= p.stockMinimo)
    
    let mensaje = "📋 *REPORTE DE INVENTARIO - PRODUCTOS FALTANTES*\n\n"
    
    if (productosFaltantes.length === 0) {
      mensaje += "✅ Todos los productos tienen stock suficiente\n"
    } else {
      productosFaltantes.forEach(producto => {
        const faltante = producto.stockMinimo - producto.stockActual
        mensaje += `🔸 *${producto.nombre}*\n`
        mensaje += `   Categoría: ${producto.categoria.nombre}\n`
        mensaje += `   Stock actual: ${producto.stockActual} ${producto.unidad}\n`
        mensaje += `   Stock mínimo: ${producto.stockMinimo} ${producto.unidad}\n`
        mensaje += `   Necesita: ${faltante} ${producto.unidad}\n\n`
      })
    }
    
    mensaje += `\n📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n`
    mensaje += `🕒 Hora: ${new Date().toLocaleTimeString('es-ES')}\n`
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(mensaje).then(() => {
      toast({
        title: "Reporte copiado",
        description: "El reporte ha sido copiado al portapapeles. Pégalo en WhatsApp."
      })
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar el reporte",
        variant: "destructive"
      })
    })
  }

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoriaFilter === "todas" || producto.categoria.nombre === categoriaFilter
    return matchesSearch && matchesCategory
  })

  const handleLogout = () => {
    localStorage.removeItem("usuario")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando datos...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Panel Administrador FatBoy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Modo Administrador</span>
              <Button variant="outline" onClick={handleLogout}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productos.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{productosConStockBajo.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agotados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{productosAgotados.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos Movimientos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movimientos.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="productos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="productos" className="space-y-6">
            <div className="flex justify-between items-center">
              <Card className="flex-1 mr-4">
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
                          {categorias.map(categoria => (
                            <SelectItem key={categoria.id} value={categoria.nombre}>
                              {categoria.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Producto</DialogTitle>
                    <DialogDescription>
                      Ingresa los datos del nuevo producto.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nombre" className="text-right">
                        Nombre
                      </Label>
                      <Input
                        id="nombre"
                        value={nuevoProducto.nombre}
                        onChange={(e) => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="descripcion" className="text-right">
                        Descripción
                      </Label>
                      <Input
                        id="descripcion"
                        value={nuevoProducto.descripcion}
                        onChange={(e) => setNuevoProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stockMinimo" className="text-right">
                        Stock Mínimo
                      </Label>
                      <Input
                        id="stockMinimo"
                        type="number"
                        value={nuevoProducto.stockMinimo}
                        onChange={(e) => setNuevoProducto(prev => ({ ...prev, stockMinimo: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unidad" className="text-right">
                        Unidad
                      </Label>
                      <Select value={nuevoProducto.unidad} onValueChange={(value) => setNuevoProducto(prev => ({ ...prev, unidad: value }))}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="kg">Kilogramo</SelectItem>
                          <SelectItem value="litro">Litro</SelectItem>
                          <SelectItem value="paquete">Paquete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="precio" className="text-right">
                        Precio
                      </Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.01"
                        value={nuevoProducto.precio}
                        onChange={(e) => setNuevoProducto(prev => ({ ...prev, precio: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="categoria" className="text-right">
                        Categoría
                      </Label>
                      <Select value={nuevoProducto.categoriaId} onValueChange={(value) => setNuevoProducto(prev => ({ ...prev, categoriaId: value }))}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map(categoria => (
                            <SelectItem key={categoria.id} value={categoria.id}>
                              {categoria.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={crearProducto}>Crear Producto</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

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
                        {producto.precio && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Precio:</span>
                            <span className="text-sm">${producto.precio}</span>
                          </div>
                        )}
                        
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
          </TabsContent>

          <TabsContent value="movimientos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Últimos Movimientos</CardTitle>
                <CardDescription>Historial de movimientos de inventario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {movimientos.map((movimiento) => (
                    <div key={movimiento.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={movimiento.tipo === "entrada" ? "default" : "secondary"}>
                            {movimiento.tipo === "entrada" ? "Entrada" : "Salida"}
                          </Badge>
                          <span className="font-medium">{movimiento.producto.nombre}</span>
                          <span className="text-sm text-gray-500">({movimiento.producto.categoria.nombre})</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{movimiento.motivo}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {movimiento.usuario.nombre} - {new Date(movimiento.createdAt).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-semibold ${movimiento.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {movimiento.tipo === "entrada" ? "+" : "-"}{movimiento.cantidad}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reportes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Productos con Stock Bajo
                  </CardTitle>
                  <CardDescription>
                    Productos que necesitan ser reabastecidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {productosConStockBajo.length === 0 ? (
                      <p className="text-gray-500">No hay productos con stock bajo</p>
                    ) : (
                      productosConStockBajo.map((producto) => (
                        <div key={producto.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium">{producto.nombre}</p>
                            <p className="text-sm text-gray-600">{producto.categoria.nombre}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-yellow-700">
                              {producto.stockActual} / {producto.stockMinimo} {producto.unidad}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Generar Reporte
                  </CardTitle>
                  <CardDescription>
                    Genera reportes para compartir con proveedores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Reporte de Productos Faltantes</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Genera un reporte con todos los productos que necesitan ser reabastecidos y cópialo para compartir por WhatsApp.
                    </p>
                    <Button onClick={generarReporteWhatsApp} className="w-full">
                      Generar Reporte WhatsApp
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Resumen</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total productos:</span>
                        <span>{productos.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock bajo:</span>
                        <span className="text-yellow-600">{productosConStockBajo.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agotados:</span>
                        <span className="text-red-600">{productosAgotados.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuración del Sistema
                </CardTitle>
                <CardDescription>
                  Configura las opciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Información del Sistema</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Versión:</span>
                        <span>1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última actualización:</span>
                        <span>{new Date().toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Categorías del Sistema</h4>
                    <div className="space-y-2">
                      {categorias.map((categoria) => (
                        <div key={categoria.id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <span>{categoria.nombre}</span>
                          <Badge variant="outline">{categoria.nombre}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}