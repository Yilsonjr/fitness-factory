# Product: Fitness Factory

## Product

Sistema de gestión de gimnasio, orientado a operaciones diarias del personal (admin y recepcionistas). Funciona como herramienta interna staff-facing — no tiene páginas públicas ni portal de clientes.

Opera exclusivamente en la República Dominicana. Moneda: **DOP** (Peso Dominicano). Formato: `RD$ 1,500.00` via `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`.

**Nombre de producto:** Fitness Factory  
**Tipo:** SaaS web, single-page application  
**Idioma de interfaz:** Español  
**Autenticación:** Email + contraseña (Supabase Auth)  
**Base de datos:** Supabase / PostgreSQL

---

## Primary Users

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `admin` | Dueño o gerente del gimnasio | Todas las secciones incluyendo Reportes y Configuración |
| `recepcionista` | Personal de mostrador | Dashboard, Clientes, Membresías, Caja |

Los usuarios están ligados a un `gimnasio_id`. Un usuario nunca ve datos de otro gimnasio.

---

## Primary Jobs

1. **Registrar cobros** — Recibir el pago de un cliente (membresía nueva, cuota atrasada, cobro puntual). Es la acción más frecuente del día.
2. **Asignar membresías** — Vincular a un cliente con un plan activo. Calcula fecha de fin automáticamente según `duracion_dias` del plan.
3. **Gestionar el turno de caja** — Abrir el turno al inicio del día, registrar gastos durante el día, cerrar y cuadrar al final.
4. **Consultar clientes** — Buscar un cliente para ver su estado de membresía, datos de contacto, historial de pagos.
5. **Reportes administrativos** — Ver ingresos, gastos y ganancia neta de un rango de fechas (solo admin).

---

## High Frequency Workflows

### 1. Registrar Cobro (`/caja/cobrar`)
```
1. Verificar que hay un turno abierto en /caja
2. Navegar a /caja/cobrar (o botón "Cobrar" en sidebar)
3. Buscar cliente por nombre, cédula o teléfono (mín 2 chars)
4. Seleccionar cliente → se auto-rellena monto y concepto si tiene membresía activa
5. Confirmar monto, método de pago, concepto
6. Activar checkbox "vincular a membresía" (default: true)
7. Confirmar → pago registrado, formulario se resetea
```

### 2. Asignar Membresía (`/membresias/asignar`)
```
1. Navegar a /membresias/asignar (o desde detalle de cliente con ?cliente=id)
2. Buscar y seleccionar cliente
3. Seleccionar plan → aparece panel de resumen (precio, duración, fecha fin calculada)
4. Confirmar fecha de inicio (default: hoy)
5. Seleccionar método de pago
6. Confirmar → redirige a detalle del cliente
```

### 3. Abrir / Cerrar Turno (`/caja`)
```
Abrir:
  1. Ingresar monto de apertura
  2. Confirmar → turno activo para el resto del día

Durante el turno:
  - Registrar gastos inline (monto + concepto)
  - Los cobros de /caja/cobrar se acumulan automáticamente

Cerrar:
  1. Click "Cerrar turno" → modal de cierre
  2. Ver balance esperado (apertura + ingresos - gastos)
  3. Ingresar monto real en caja
  4. Añadir notas opcionales
  5. Confirmar → turno cerrado
```

---

## Critical Information

Los siguientes datos deben ser siempre visibles, nunca colapsados detrás de tabs o acordeones:

| Dato | Dónde debe aparecer | Por qué es crítico |
|------|--------------------|--------------------|
| Estado de membresía del cliente | Lista de clientes, detalle de cliente | Determina si el cliente puede entrar al gimnasio |
| Fecha de vencimiento | Lista de clientes (columna Vence), detalle | Determina cuándo llamar al cliente para renovar |
| Balance actual del turno | Turno de caja | El recepcionista necesita saber en todo momento cuánto hay en caja |
| Turno abierto o cerrado | Dashboard, sidebar de caja | Sin turno abierto no se pueden registrar cobros |
| Monto de membresía | Panel de resumen en MembresiaForm | Confirmar precio antes de asignar |

---

## Data Models (src/app/core/models/index.ts)

### Entidades principales

**`Gimnasio`** — Datos del negocio (nombre, teléfono, dirección, RNC). Un usuario pertenece a un gimnasio via `gimnasio_id`.

**`Usuario`** — Usuario del sistema. Campos clave: `auth_id` (Supabase Auth UID), `rol: RolUsuario` ('admin' | 'recepcionista'), `gimnasio_id`.

**`Cliente`** — Miembro del gimnasio. Campos clave: `cedula` (ID dominicano, formato `000-0000000-0`), `nombre`, `apellido`, `telefono`, `fecha_nacimiento`, `sexo: SexoTipo` ('M' | 'F'), `foto_url`, `contacto_emergencia`, `activo: boolean`. Campo virtual: `membresia_activa?: Membresia` (join desde el servicio).

**`Plan`** — Tipo de membresía. Campos: `nombre`, `precio`, `duracion_dias`, `periodo: PeriodoPlan` ('diario' | 'semanal' | 'quincenal' | 'mensual'). El `periodo` es solo display — `duracion_dias` es el valor autoritativo para cálculos.

**`Membresia`** — Instancia de membresía asignada. Campos: `cliente_id`, `plan_id`, `fecha_inicio`, `fecha_fin`, `estado: EstadoMembresia` ('activa' | 'vencida' | 'congelada' | 'cancelada'), `precio_pagado` (puede diferir del plan si hubo descuento).

**`TurnoCaja`** — Sesión diaria de caja. Campos: `monto_apertura`, `monto_cierre?`, `estado: EstadoTurno` ('abierto' | 'cerrado'), `ingresos_totales`, `gastos_totales`, `notas_cierre?`.

**`Pago`** — Cobro registrado. Campos: `turno_id`, `cliente_id`, `membresia_id?` (opcional), `monto`, `metodo: MetodoPago` ('efectivo' | 'tarjeta' | 'transferencia'), `concepto`.

**`Gasto`** — Egreso registrado en el turno. Campos: `turno_id`, `monto`, `concepto`.

**`Asistencia`** — Log de acceso. Campos: `cliente_id`, `metodo: MetodoAcceso` ('huella' | 'manual' | 'tarjeta'). (Funcionalidad futura — tabla existe en DB.)

**`ConfigSistema`** — Configuración global del gimnasio. Campos: `dias_gracia` (días extra después de vencimiento), `horario_apertura`, `horario_cierre`, `color_tema`.

### Enums / Union Types

```typescript
type RolUsuario     = 'admin' | 'recepcionista'
type SexoTipo       = 'M' | 'F'
type PeriodoPlan    = 'diario' | 'semanal' | 'quincenal' | 'mensual'
type EstadoMembresia = 'activa' | 'vencida' | 'congelada' | 'cancelada'
type EstadoTurno    = 'abierto' | 'cerrado'
type MetodoPago     = 'efectivo' | 'tarjeta' | 'transferencia'
type MetodoAcceso   = 'huella' | 'manual' | 'tarjeta'
```

---

## Business Rules

- Un turno debe estar **abierto** para poder registrar pagos en `RegistroPagoComponent`. Si no hay turno abierto, el formulario muestra un aviso y bloquea el envío.
- Al asignar una membresía nueva, la anterior queda **cancelada** automáticamente (lógica en `MembresiasService`).
- **`dias_gracia`** — Días extra post-vencimiento en los que el cliente todavía tiene acceso. Configurado en `ConfigSistema`.
- **Cédula dominicana** — Formato `000-0000000-0`. La función `formatCedula()` en `ClienteFormComponent` aplica el mask automáticamente.
- **Umbral "por vencer"** — Inconsistencia conocida: Dashboard usa 3 días, MembresiasLista y Reportes usan 7 días. El estándar correcto es **7 días**. Pendiente de unificar.
- `precio_pagado` en `Membresia` es el monto realmente cobrado. Puede diferir del `precio` del plan (descuentos, cortesías).

---

## UX Risks

| Riesgo | Dónde | Impacto |
|--------|-------|---------|
| Cobrar sin turno abierto | RegistroPagoComponent | El pago no se puede vincular a ningún turno — bloqueo correcto con aviso |
| Asignar membresía al cliente equivocado | MembresiaFormComponent | La membresía anterior se cancela automáticamente — acción irreversible |
| Cerrar turno con diferencia de efectivo | TurnoCajaComponent (modal) | Se muestra la diferencia en tiempo real antes de confirmar |
| Desactivar un cliente activo | ClienteDetalleComponent | Requiere botón explícito, sin confirmación modal actualmente (gap) |
| Confundir "por vencer" threshold | Dashboard vs Membresias | 3 días vs 7 días — puede causar que recepcionista no llame a tiempo |
| Badge color inconsistente para "activa" | ClentesLista vs ClienteDetalle | Dos verdes diferentes — puede generar desconfianza visual |

---

## Interface Implications

- **Densidad alta** — Staff usa la aplicación 4-8 horas/día. Las tablas deben mostrar máxima información por fila. No usar whitespace de landing page.
- **Acciones rápidas** — Los 3 workflows más frecuentes deben ser alcanzables en máximo 2 taps desde cualquier pantalla.
- **Status siempre visible** — El estado de membresía nunca debe estar colapsado. Es la información más crítica en cada interacción con un cliente.
- **Desktop-primary** — El app se usa en la computadora del mostrador. Mobile es colateral (colapso, no rediseño).
- **Español exclusivo** — Toda la UI, mensajes de error, placeholders y labels están en español. No mezclar idiomas.
- **DOP siempre** — Todos los montos usan `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`. Nunca mostrar números crudos sin formato.

---

## Information Architecture

- **Configuración** se divide por dominio: General, Membresías, Operación y Usuarios y acceso.
- **Usuarios y acceso** separa la administración de usuarios de la configuración general; los roles granulares quedan como future capability hasta tener backend RBAC real.
- **Reportes** se divide por dominio: General, Finanzas, Membresías, Ventas y Caja.
- La sidebar principal se mantiene compacta; los submódulos viven en navegación secundaria dentro de Configuración y Reportes.
- `color_tema` existe en backend, pero la identidad visual charcoal + electric lime ya no depende de ese valor.

---

## Unknown / Needs Product Decision

- ¿Cuál es el umbral estándar de "por vencer"? (actualmente 3 días en dashboard vs 7 días en el resto)
- ¿Debería existir confirmación modal al desactivar un cliente?
- ¿Se planea portal de clientes o app móvil en el futuro?
- ¿El módulo de Asistencia (`huella`, `tarjeta`) tiene hardware asociado? ¿Cuándo se activa?
- ¿Debería `precio_pagado` mostrarse en algún listado diferenciado del precio del plan?
