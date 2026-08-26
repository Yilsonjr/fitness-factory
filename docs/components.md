# Components — Fitness Factory

Catálogo de componentes existentes. Consultar antes de crear un componente nuevo.

**Principio:** Si existe un componente similar, añadir una variante o extender su API en lugar de crear uno nuevo.

---

## Estado del sistema

| Símbolo | Significado |
|---------|------------|
| ✅ Existe y funciona | Componente implementado y en uso |
| ⚠️ Existe con gaps | Funciona pero tiene problemas documentados en ui-audit.md |
| ❌ Falta | Identificado como necesario, no existe |
| 🔄 Duplicado | Existe en múltiples lugares, candidato a consolidar |

---

## Layout

### `app-layout` ✅
**Ruta:** `src/app/shared/components/layout/layout.component.ts`  
**Responsabilidad:** Shell de la aplicación — sidebar fija + `<router-outlet>` para contenido.  
**API:** Ninguna (usa `inject(AuthService)` internamente)  
**Estado interno:** `collapsed = signal(false)`  
**Tokens principales:** `--sidebar-width`, `--sidebar-collapsed`, `--bg-card`, `--border`, `--primary`, `--primary-subtle`, `--z-sidebar`

**Notas:**
- Sidebar tiene dos estados: expandida (260px) y colapsada (72px íconos-only)
- En mobile (<768px): sidebar siempre colapsada, sin opción de expandir
- Navigation items usan `routerLinkActive` para el estado activo
- Secciones de admin (`/reportes`, `/configuracion`) solo visibles si `isAdmin()`
- Footer de sidebar: avatar del usuario (iniciales) + nombre + botón de logout

**Gaps (ver ui-audit.md C5):** Sin skip-to-main-content link.

---

## Pages — Feature Components

Todos los page components son lazy-loaded desde `src/app/app.routes.ts`.

### `app-login` ✅
**Ruta:** `src/app/features/auth/login/login.component.ts`  
**Patrón visual:** Card centrada, max-width 400px, centrada en viewport  
**Formulario:** Template-driven (FormsModule)  
**Estado:** `loading = signal(false)`, `error = signal<string | null>(null)`  
**Focus ring:** ✅ Implementado (`--shadow-focus` equivalente)  
**Elevación:** ✅ Usa `--shadow-login` — único componente con drop shadow

---

### `app-dashboard` ✅
**Ruta:** `src/app/features/dashboard/dashboard.component.ts`  
**Patrón visual:** Grilla de KPI cards + quick action cards + resumen de turno  
**Secciones:**
1. Page header (h1 + subtítulo)
2. Stats grid — 4 tarjetas métricas operativas
3. Quick actions — 4 tarjetas de navegación rápida
4. Resumen turno activo (visible solo si hay turno abierto)

**KPIs (en orden):**

| KPI | Fuente | Color ícono |
|-----|--------|------------|
| Membresías activas | `ClientesService` | `--color-success` |
| Por vencer (≤3 días*) | `ClientesService` | `--color-warning` |
| Vencidas | `ClientesService` | `--color-danger` |
| Ingresos del día | `CajaService` | `--primary` |

*Umbral de 3 días inconsistente con el resto del app (7 días). Ver `docs/ui-audit.md` I8.

**Quick actions (en orden):**
1. Registrar cobro → `/caja/cobrar`
2. Nuevo cliente → `/clientes/nuevo`
3. Asignar membresía → `/membresias/asignar`
4. Ver reportes → `/reportes`

---

### `app-clientes-lista` ✅ ⚠️
**Ruta:** `src/app/features/clientes/lista/clientes-lista.component.ts`  
**Patrón visual:** Header + search bar + filter chips + tabla  
**Gaps:**
- Filter chips rectangulares (6px) en lugar de pills (999px) — inconsistente con membresias-lista
- Badge "activa" usa `#22c55e` en lugar de `--color-success-text` (`#4ade80`)
- h1 con `1.5rem` en lugar de `--text-5xl` (1.75rem)

**Tabla — columnas:**
1. Cliente (avatar + nombre)
2. Cédula
3. Teléfono *(oculta en mobile)*
4. Membresía (badge de estado)
5. Vence *(oculta en mobile)*
6. Acciones (ver, editar)

**Filtros disponibles:** Todos / Con membresía / Sin membresía  
**Búsqueda:** Por nombre, cédula o teléfono — sin debounce

---

### `app-cliente-detalle` ✅ ⚠️
**Ruta:** `src/app/features/clientes/detalle/cliente-detalle.component.ts`  
**Patrón visual:** Perfil con avatar grande + info grid + membership history  
**Secciones:**
1. Header: avatar 96px + nombre + cédula + action buttons
2. Membresía activa (si existe): plan + estado + fecha + freeze/unfreeze button
3. Info grid 2-3 columnas: teléfono, email, sexo, nacimiento, dirección, contacto emergencia, notas
4. Tabla historial de membresías

**Badge de membresía activa — estados:**
- `activa`: `--color-success-subtle` + `--color-success-text`
- `congelada`: `--color-frozen-subtle` + `--color-frozen-text`
- `vencida`: `--color-danger-subtle` + `--color-danger-text`

**Gap:** Sin confirmación modal al hacer "Desactivar cliente". Ver `docs/ui-audit.md`.

---

### `app-cliente-form` ✅ ⚠️
**Ruta:** `src/app/features/clientes/formulario/cliente-form.component.ts`  
**Modo dual:** Crear (sin `id` en ruta) / Editar (con `:id` en ruta)  
**Patrón visual:** Form de 2 columnas con photo preview  
**Focus ring:** ✅ Implementado correctamente

**Campos (en orden de layout):**
- Foto (preview + file input, full-width)
- Cédula (con auto-format `000-0000000-0`)
- Sexo (select)
- Nombre (required)
- Apellido (required)
- Fecha de nacimiento
- Teléfono
- Email
- Nombre de contacto de emergencia
- Teléfono de emergencia
- Dirección (span-2)
- Notas (textarea, span-2)

**Gap:** h1 con `1.6rem` en lugar de `--text-5xl`. Ver `docs/ui-audit.md` I4.

---

### `app-membresias-lista` ✅
**Ruta:** `src/app/features/membresias/lista/membresias-lista.component.ts`  
**Patrón visual:** Header + filter chips pills + tabla  
**Filter chips:** ✅ Pill style correcto (999px)

**Tabla — columnas:**
1. Cliente
2. Plan
3. Inicio
4. Vence
5. Estado (badge)
6. Acciones (freeze/unfreeze)

**Filtros:** Todas / Activas / Por vencer / Vencidas / Congeladas  
**Umbral "por vencer":** 7 días (`estadoVisual()`)  
**ChangeDetection:** ✅ OnPush

---

### `app-membresia-form` ✅
**Ruta:** `src/app/features/membresias/formulario/membresia-form.component.ts`  
**Patrón visual:** Form con client search + plan selector + summary panel  
**Pre-fill:** Acepta `?cliente=id` como query param

**Secciones:**
1. Client search (typeahead, mín 2 chars) — span-2
2. Plan select
3. Fecha inicio
4. Método de pago
5. Notas — span-2
6. Summary panel (aparece al seleccionar plan): Precio | Duración | Fecha fin

🔄 **Duplicado parcial:** Lógica de client search similar a `registro-pago.component.ts`. Candidato a `ClientSearchComponent`.

---

### `app-turno-caja` ✅ ⚠️
**Ruta:** `src/app/features/caja/turno/turno-caja.component.ts`  
**Modo dual:** Sin turno (form de apertura) / Con turno (management)

**Estado "sin turno":**
- Form simple: monto de apertura + botón "Abrir turno"

**Estado "con turno":**
1. Summary grid: Apertura | Ingresos | Gastos | Balance
2. Form inline para registrar gastos (3 cols: monto + concepto + botón)
3. Grid 2 cols: Lista de pagos | Lista de gastos
4. Botón "Cerrar turno"
5. Modal de cierre (inline, position fixed)

**Gaps críticos en el modal:** Sin `role="dialog"`, sin focus trap, sin soporte `Escape`. Ver `docs/ui-audit.md` C1.

---

### `app-registro-pago` ✅
**Ruta:** `src/app/features/caja/pagos/registro-pago.component.ts`  
**Patrón visual:** Client search + payment form  
**Bloqueo:** Si no hay turno abierto, muestra warning card y deshabilita el submit

**Campos:**
1. Client search (typeahead) — span-2
2. Monto
3. Método de pago (efectivo | tarjeta | transferencia)
4. Concepto — span-2
5. Checkbox "Vincular a membresía activa" (default: true)

🔄 **Duplicado parcial:** Lógica de client search similar a `membresia-form.component.ts`.

---

### `app-reportes` ✅ ⚠️
**Ruta:** `src/app/features/reportes/reportes.component.ts`  
**Guard:** `adminGuard` — solo admins  
**Patrón visual:** Date filters + KPI cards + tablas  

**Secciones:**
1. Header con botón Actualizar
2. Filter card: Desde + Hasta (date range, default mes actual)
3. KPI cards (4): Ingresos | Gastos | Ganancia neta | Nuevos clientes
4. Tabla de pagos: Fecha | Cliente | Concepto | Método | Monto
5. Tabla de membresías próximas a vencer: Cliente | Plan | Vence | Estado

**Gap:** h1 no definido (hereda del browser). Ver `docs/ui-audit.md` I4.

---

### `app-configuracion` ✅
**Ruta:** `src/app/features/configuracion/configuracion.component.ts`  
**Guard:** `adminGuard` — solo admins  
**Patrón visual:** Multi-section admin panel con sticky save button

**Secciones:**
1. Datos del gimnasio (nombre, teléfono, dirección, RNC)
2. Planes (tabla editable inline + form para añadir)
3. Configuración sistema (días gracia, horarios, color tema)
4. Usuarios (lista de usuarios del gimnasio + form para añadir recepcionista)

**Sticky save button:** `position: sticky; bottom: 0` con gradient de fondo.

---

## Primitives — Estado actual

| Componente | Estado | Notas |
|-----------|--------|-------|
| Button primario | ✅ | Clase CSS en cada componente, no un componente standalone |
| Button secundario | ✅ | Clase CSS — misma observación |
| Button peligro | ✅ | Clase CSS |
| Form input | ✅ | Estilo repetido, no un componente |
| Select | ✅ | Nativo HTML con estilos |
| Textarea | ✅ | Nativo HTML con estilos |
| Checkbox | ✅ | Nativo HTML con estilos |
| Badge / Status chip | ✅ | Clase CSS en cada componente |
| Avatar (circular con iniciales) | ✅ | HTML + CSS repetido en 2 componentes |
| Filter chip | ⚠️ | Dos estilos distintos (rectangular vs pill) |
| Icon button | ✅ | Clase CSS |

**Observación importante:** Ningún primitivo existe como Angular component standalone. Son estilos CSS repetidos en cada feature component. Esto es aceptable en la arquitectura actual (inline styles per component), pero implica que los cambios de estilo a un primitivo requieren editar múltiples archivos.

---

## Composite Components — Estado actual

| Componente | Estado | Ubicación |
|-----------|--------|-----------|
| SearchField (input + ícono + typeahead) | 🔄 | Duplicado en membresia-form y registro-pago |
| DatePicker | ✅ | Input nativo `type="date"` |
| Pagination | ❌ | No existe — tablas usan scroll sin paginación |
| Toolbar (header de página) | ✅ | Patrón repetido, no componente |
| FilterBar (chips de filtro) | ⚠️ | Patrón repetido con estilos inconsistentes |

---

## Overlays — Estado actual

| Componente | Estado | Notas |
|-----------|--------|-------|
| Dialog / Modal | ⚠️ | Solo en TurnoCajaComponent, sin ARIA roles |
| Drawer | ❌ | No existe |
| Dropdown | ✅ | Lista de resultados en client search (CSS absoluto) |
| Tooltip | ❌ | No existe (se usa `title` attribute como fallback) |
| Toast / Notification | ✅ | `ToastStackComponent` + `ToastService` |

---

## Data Components — Estado actual

| Componente | Estado | Notas |
|-----------|--------|-------|
| Table | ✅ | Patrón HTML nativo repetido |
| Status badge | ✅ | `StatusBadgeComponent` con tokens |
| EmptyState | ✅ | Texto inline, no componente |
| Skeleton loader | ✅ | `SkeletonComponent` + `SkeletonListComponent` |
| Stat card (KPI) | ✅ | Solo en dashboard.component |

---

## Navigation — Estado actual

| Componente | Estado | Notas |
|-----------|--------|-------|
| Sidebar | ✅ | En layout.component |
| Breadcrumb | ✅ | `BreadcrumbsComponent` |
| Tabs | ❌ | No existe — los filtros actúan como pseudo-tabs |
| TopBar | ❌ | No existe — el header de página es parte de cada feature component |

---

## Recomendaciones

### Antes de crear un componente nuevo:
1. Buscar en este catálogo si existe algo similar
2. Verificar si puede añadirse como variante de un patrón existente
3. Solo crear nuevo componente si la responsabilidad es claramente diferente

### Candidatos prioritarios para extracción:
1. **`ClientSearchComponent`** — Elimina la duplicación entre membresia-form y registro-pago
2. **`CurrencyDopPipe`** — Centraliza el formatter de DOP eliminado de 4 componentes
3. **`StatusBadgeComponent`** — Garantiza consistencia de colores y tokens en todos los badges de estado

---

## Nuevos componentes reutilizables

### `app-secondary-nav` ✅
**Ruta:** `src/app/shared/components/secondary-nav/secondary-nav.component.ts`  
**Responsabilidad:** Navegación secundaria reusable para shells con subrutas.  
**Uso actual:** Configuración y Reportes.

**Notas:**
- Estado activo accesible con `aria-current="page"`
- Se apila en mobile para evitar overflow horizontal
