# UI Workflow — Fitness Factory

Flujo obligatorio para features de interfaz significativas. Seguir en orden.

---

## Flujo para features nuevas

```
Product Requirement
       ↓
   UX Analysis          ← docs/product.md + docs/ux-principles.md
       ↓
Existing UI Inspection  ← docs/components.md + pantallas relacionadas
       ↓
 Design References      ← references/ (si aplica)
       ↓
Design Alternatives     ← Mínimo 2 estructuras distintas
       ↓
Direction Selection     ← Elegir la que mejor optimice claridad + velocidad + accesibilidad
       ↓
Component Architecture  ← ¿Nuevo componente? ¿Variante de uno existente?
       ↓
   Implementation       ← Angular 21, tokens CSS, OnPush, signals
       ↓
   Visual QA            ← .codex/skills/design-qa/SKILL.md
       ↓
Anti-Generic UI Review  ← .codex/skills/anti-generic-ui/SKILL.md
       ↓
   Responsive QA        ← .codex/skills/responsive-qa/SKILL.md
       ↓
  Accessibility QA      ← .codex/skills/accessibility-qa/SKILL.md
       ↓
   Code Review          ← AGENTS.md compliance
       ↓
     Final
```

Para tareas pequeñas (typos, ajustes de un campo, cambio de color), no es necesario seguir el flujo completo. Usar criterio.

---

## Flujos de usuario críticos

Documentados para que los agentes comprendan el estado esperado de la UI en cada paso.

---

### Flujo 1: Registrar Cobro

**Ruta:** `/caja/cobrar`  
**Prerequisito:** Turno de caja abierto

```
Estado inicial de la pantalla:
├── Warning visible: "No hay turno abierto" (si no hay turno)
│   └── Link a /caja para abrir turno
└── Formulario de cobro (si hay turno abierto):
    ├── Search input vacío
    ├── Monto = "" (vacío)
    ├── Método = "efectivo" (default)
    ├── Concepto = "" (vacío)
    └── Checkbox "Vincular a membresía" = true

Paso 1: Usuario escribe en search
├── A partir de 2 caracteres → busca en ClientesService
├── Muestra dropdown con resultados (nombre + cédula)
└── Si 0 resultados → "No se encontraron clientes con esa búsqueda"

Paso 2: Usuario selecciona cliente
├── Si tiene membresía activa:
│   ├── Monto auto-rellena con precio_pagado de membresía
│   ├── Concepto auto-rellena con "Mensualidad [nombre plan]"
│   └── Chip informativo: "Membresía activa: [Plan] - Vence [fecha]"
└── Si no tiene membresía activa:
    └── Campos vacíos, usuario rellena manualmente

Paso 3: Usuario ajusta campos y confirma
├── Click "Cobrar"
├── Loading: botón → "Procesando..." + disabled
├── Error: banner rojo, formulario preservado
└── Éxito:
    ├── Banner verde "Pago registrado correctamente"
    └── Formulario reseteado (listo para siguiente cobro)
```

---

### Flujo 2: Asignar Membresía

**Ruta:** `/membresias/asignar` (o desde `/clientes/:id` con `?cliente=id`)

```
Estado inicial:
├── Si viene de cliente-detalle (?cliente=id):
│   └── Search pre-relleno con nombre del cliente (no editable si está seleccionado)
└── Sin query param:
    └── Search vacío

Paso 1: Selección de cliente
├── Si pre-seleccionado: saltar a Paso 2
└── Búsqueda igual al flujo anterior

Paso 2: Selección de plan
├── Dropdown con planes disponibles del gimnasio
├── Al seleccionar plan:
│   └── Panel de resumen aparece (slide-in o simplemente display):
│       ├── Precio: RD$ X
│       ├── Duración: X días (nombre del período)
│       └── Fecha fin estimada: [fecha_inicio + duracion_dias]
└── Fecha inicio: default = hoy, editable

Paso 3: Confirmación
├── Método de pago (required)
├── Botón "Asignar membresía" habilitado solo si: cliente + plan seleccionados
├── Click → Loading
├── Error: banner, formulario preservado
└── Éxito:
    └── Navigate a /clientes/:id del cliente
```

**Nota:** Al asignar una membresía nueva, la membresía anterior queda `cancelada` automáticamente (backend). La UI no tiene que mostrar confirmación de esto, pero los developers deben saberlo para evitar mostrar "¿desea cancelar la membresía anterior?".

---

### Flujo 3: Abrir / Cerrar Turno

**Ruta:** `/caja`

```
Estado "sin turno":
└── Form de apertura:
    ├── Input: Monto de apertura (number, required)
    └── Botón: "Abrir turno"
        ├── Loading: "Abriendo..."
        └── Éxito: página se refresca → estado "turno abierto"

Estado "turno abierto":
├── Summary grid (4 cards):
│   ├── Apertura: RD$ [monto_apertura]
│   ├── Ingresos: RD$ [suma de pagos del turno]
│   ├── Gastos: RD$ [suma de gastos del turno]
│   └── Balance: RD$ [apertura + ingresos - gastos]
│
├── Form inline "Registrar gasto":
│   ├── Input monto (number)
│   ├── Input concepto (text)
│   └── Botón "+" (añadir)
│       └── Éxito: lista de gastos actualiza, form limpia
│
├── Grid 2 cols:
│   ├── Pagos del turno (lista ordenada por hora)
│   └── Gastos del turno (lista ordenada por hora)
│
└── Botón "Cerrar turno" → abre modal

Modal de cierre:
├── Monto esperado: RD$ [balance calculado] (readonly)
├── Monto en caja: RD$ [editable, default = monto esperado]
├── Diferencia: RD$ [monto_cierre - monto_esperado] (computed en tiempo real)
│   ├── Positivo: texto verde "Sobrante"
│   └── Negativo: texto rojo "Faltante"
├── Notas: textarea (opcional)
└── Acciones:
    ├── Cancelar → cierra modal, sin cambios
    └── Confirmar cierre → Loading → Éxito: estado "sin turno"
```

---

## Flujos secundarios

### Crear / Editar Cliente

```
Nuevo: /clientes/nuevo
Editar: /clientes/:id/editar

Estados posibles:
├── Cargando (editar): "Cargando datos..."
├── Formulario activo
├── Submitting: "Guardando..." + disabled
├── Error: banner rojo, formulario con datos preservados
└── Éxito nuevo: navigate a /clientes/:id
    Éxito editar: navigate a /clientes/:id
```

### Ver Detalle de Cliente

```
/clientes/:id

Cargando: estados loading en signals
Cargado:
├── Si membresía activa:
│   └── Card de membresía visible con estado + fecha + acción
└── Si sin membresía activa:
    └── Botón prominente "Asignar membresía" → /membresias/asignar?cliente=:id

Acciones disponibles:
├── Editar → /clientes/:id/editar
├── Asignar membresía → /membresias/asignar?cliente=:id
├── Congelar/Reactivar membresía (si existe) → acción en componente
└── Desactivar cliente → [GAP: sin confirmación modal actualmente]
```

---

## Prompts operativos para tareas comunes

Ver `docs/codex-workflows.md` para los prompts completos.
