// ============================================================
// MODELOS - GYM MANAGEMENT SYSTEM
// ============================================================

export type RolUsuario = 'admin' | 'recepcionista';
export type SexoTipo = 'M' | 'F';
export type PeriodoPlan = 'diario' | 'semanal' | 'quincenal' | 'mensual';
export type EstadoMembresia = 'activa' | 'vencida' | 'congelada' | 'cancelada';
export type EstadoTurno = 'abierto' | 'cerrado';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';
export type MetodoAcceso = 'huella' | 'manual' | 'tarjeta';

export interface Gimnasio {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  rnc?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  auth_id: string;
  gimnasio_id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  gimnasio_id: string;
  cedula?: string;
  nombre: string;
  apellido: string;
  sexo?: SexoTipo;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  foto_url?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  notas?: string;
  activo: boolean;
  huella_template?: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones virtuales (joins)
  membresia_activa?: Membresia;
}

export interface Plan {
  id: string;
  gimnasio_id: string;
  nombre: string;
  periodo: PeriodoPlan;
  duracion_dias: number;
  precio: number;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membresia {
  id: string;
  gimnasio_id: string;
  cliente_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoMembresia;
  precio_pagado: number;
  notas?: string;
  created_at: string;
  updated_at: string;
  // Relaciones virtuales
  cliente?: Cliente;
  plan?: Plan;
}

export interface TurnoCaja {
  id: string;
  gimnasio_id: string;
  usuario_id: string;
  monto_apertura: number;
  monto_cierre?: number;
  estado: EstadoTurno;
  fecha_apertura: string;
  fecha_cierre?: string;
  notas_cierre?: string;
  // Relaciones virtuales
  usuario?: Usuario;
  total_ingresos?: number;
  total_gastos?: number;
}

export interface Pago {
  id: string;
  gimnasio_id: string;
  cliente_id: string;
  membresia_id?: string;
  turno_id?: string;
  monto: number;
  metodo: MetodoPago;
  concepto: string;
  recibido_por?: string;
  fecha: string;
  anulado: boolean;
  motivo_anulacion?: string;
  created_at: string;
  // Relaciones virtuales
  cliente?: Cliente;
}

export interface Gasto {
  id: string;
  gimnasio_id: string;
  turno_id?: string;
  monto: number;
  concepto: string;
  registrado_por?: string;
  fecha: string;
  created_at: string;
}

export interface Asistencia {
  id: string;
  gimnasio_id: string;
  cliente_id: string;
  metodo: MetodoAcceso;
  fecha_entrada: string;
  autorizado: boolean;
  notas?: string;
  // Relaciones virtuales
  cliente?: Cliente;
}

export interface ConfigSistema {
  id: string;
  gimnasio_id: string;
  nombre_comercial?: string;
  moneda: string;
  dias_gracia: number;
  horario_apertura?: string;
  horario_cierre?: string;
  impresora_config?: unknown;
  tema_color: string;
  created_at: string;
  updated_at: string;
}

// DTOs para formularios
export interface ClienteForm {
  cedula?: string;
  nombre: string;
  apellido: string;
  sexo?: SexoTipo;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  notas?: string;
}

export interface PlanForm {
  nombre: string;
  periodo: PeriodoPlan;
  duracion_dias: number;
  precio: number;
  descripcion?: string;
}

export interface MembresiaForm {
  cliente_id: string;
  plan_id: string;
  fecha_inicio: string;
  metodo_pago: MetodoPago;
  notas?: string;
}

export interface AperturaCajaForm {
  monto_apertura: number;
}

export interface CierreCajaForm {
  monto_cierre: number;
  notas_cierre?: string;
}

export interface PagoForm {
  cliente_id: string;
  monto: number;
  metodo: MetodoPago;
  concepto: string;
  membresia_id?: string;
}

// ============================================================
// MÓDULO PRODUCTOS / POS / INVENTARIO
// ============================================================

export type TipoMovimientoInv = 'entrada' | 'ajuste' | 'merma';

export interface CategoriaProducto {
  id: string;
  gimnasio_id: string;
  nombre: string;
  created_at: string;
}

export interface Producto {
  id: string;
  gimnasio_id: string;
  categoria_id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones virtuales
  categoria?: CategoriaProducto;
}

export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  // Relaciones virtuales
  producto?: Producto;
}

export interface Venta {
  id: string;
  gimnasio_id: string;
  turno_id?: string;
  cliente_id?: string;
  usuario_id?: string;
  total: number;
  metodo: MetodoPago;
  fecha: string;
  anulado: boolean;
  motivo_anulacion?: string;
  created_at: string;
  // Relaciones virtuales
  detalles?: DetalleVenta[];
  cliente?: Cliente;
}

export interface ProductoForm {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  categoria_id?: string;
  activo: boolean;
}

export interface CategoriaForm {
  nombre: string;
}

export interface ItemVenta {
  producto: Producto;
  cantidad: number;
}

export interface VentaForm {
  items: ItemVenta[];
  metodo: MetodoPago;
  cliente_id?: string;
}

export interface EntradaInventarioForm {
  producto_id: string;
  cantidad: number;
  tipo: TipoMovimientoInv;
  costo_unitario?: number;
  notas?: string;
}

export interface MovimientoInventario {
  id: string;
  producto_id: string;
  gimnasio_id: string;
  cantidad: number;
  tipo: TipoMovimientoInv;
  costo_unitario?: number;
  notas?: string;
  fecha: string;
  created_at: string;
  producto?: Producto;
}
