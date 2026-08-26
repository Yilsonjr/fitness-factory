# Skill: UI Architect

**Activar cuando:** Se necesita planificar la estructura de componentes de una feature, o antes de implementar una pantalla con múltiples secciones o flujos complejos.

---

## Context (leer en este orden)

1. `AGENTS.md` — reglas de arquitectura Angular
2. `docs/product.md` — modelo de datos, roles, flujos
3. `src/app/app.routes.ts` — rutas existentes y su estructura
4. `docs/components.md` — catálogo de componentes actuales

---

## Process

### 1. Information Architecture

Antes de pensar en componentes, pensar en **contenido y tareas**:

- ¿Qué información necesita ver el usuario?
- ¿En qué orden de importancia?
- ¿Qué acciones puede tomar?
- ¿Cómo se relacionan los datos entre sí?

No empezar desde "ponemos una card aquí y dentro otra card". Empezar desde el contenido.

### 2. Layout

¿Cómo se distribuye el espacio?

Opciones para este proyecto (desktop-primary, sidebar de 260px):
- **Full-width con max-width:** `max-width: var(--content-max)` — para listas y tablas
- **2 columnas:** para detalle + acciones o form + preview
- **3 columnas:** para dashboards o paneles de configuración
- **1 columna:** para formularios simples en mobile o flows estrechos

Siempre incluir el bloque `@media (max-width: 768px)` que colapsa a 1 columna.

### 3. Visual Hierarchy

¿Qué debe el usuario ver primero?
1. Status crítico (estado de membresía, balance de caja)
2. Acción primaria (botón de cobrar, abrir turno)
3. Listado o formulario
4. Acciones secundarias

No centrar visualmente 5 elementos del mismo peso.

### 4. Navigation & Context

¿Cómo llega el usuario a esta pantalla?
- ¿Desde el sidebar?
- ¿Desde otra pantalla con parámetros? (`?cliente=id`)
- ¿Desde el dashboard?

¿Cómo sale?
- ¿Botón "Volver" explícito? (`routerLink` al listado anterior)
- ¿Redirect automático al éxito? (forms → detalle del item creado)

### 5. Action Hierarchy

Clasificar todas las acciones de la pantalla:

| Tipo | Estilo | Posición |
|------|--------|----------|
| Primaria (1 por región) | `background: var(--primary)` | Prominente, arriba-derecha o final del form |
| Secundaria | Outlined / text color | Junto a la primaria, menor peso |
| Destructiva | `--color-danger-subtle` bg | Separada visualmente, requiere confirmación |

### 6. Progressive Disclosure

¿Qué información puede mostrarse condicionalmente?
- Panel de resumen en `membresia-form` (aparece al seleccionar plan) — correcto
- Membresía activa en `cliente-detalle` (aparece solo si existe) — correcto
- Warning en `registro-pago` (aparece si no hay turno abierto) — correcto

La divulgación progresiva reduce carga cognitiva, pero nunca debe ocultar información crítica. El estado de membresía y los balances son siempre visibles.

### 7. Component Boundaries

¿Qué partes de la UI tienen responsabilidades claramente distintas?

Pregunta para cada pieza de UI:
> "Si necesito cambiar X, ¿también debo cambiar Y?"

Si la respuesta es no, son componentes distintos (o pueden serlo). Si sí, pueden estar en el mismo componente.

**Regla anti-abstracción prematura:** Si un componente solo se usa en un lugar, puede estar inline. No extraer por principio de "reusabilidad futura" que quizás no llega.

**Candidatos actuales a extracción** (ver `docs/components.md`):
- `ClientSearchComponent` — la lógica de búsqueda de cliente está en 2 componentes
- `CurrencyDopPipe` — el formatter DOP está en 4+ componentes
- `StatusBadgeComponent` — garantiza consistencia de tokens en badges

### 8. Density

¿Qué densidad de información es apropiada?

- **Alta densidad** (tablas, listas operativas): `--space-3` de padding, texto `--text-base`, sin whitespace decorativo
- **Media densidad** (formularios, cards de detalle): `--space-4` a `--space-5` de padding
- **Baja densidad** (solo si la pantalla no es operativa): `--space-6`+

Este producto usa alta densidad en la mayoría de sus pantallas. No añadir padding extra "porque se ve mejor".

### 9. Responsive Transformation

Especificar exactamente qué cambia en `@media (max-width: 768px)`:

| Elemento | Desktop | Mobile |
|---------|---------|--------|
| Grids multi-col | `grid-template-columns: X` | `grid-template-columns: 1fr` |
| Page header | `flex-direction: row` | `flex-direction: column` |
| Sidebar margin | `margin-left: var(--sidebar-width)` | `margin-left: var(--sidebar-collapsed)` |
| Tabla | todas las columnas | ocultar columnas no críticas (`display: none`) |
| Form | 2 columnas | 1 columna (`.span-2` reset a `grid-column: 1`) |

---

## Output

Antes de implementar, producir:

```
Feature: [nombre]
Ruta: /[path]
Guard: [authGuard | adminGuard]

Componente: [selector]
Ubicación: src/app/features/[dominio]/[vista]/[nombre].component.ts

Layout: [descripción del layout en desktop]
Responsive: [qué cambia en 768px]

Secciones:
1. [nombre] — [descripción]
2. [nombre] — [descripción]

Estados:
- loading: [descripción]
- empty: [descripción]
- error: [descripción]

Componentes reutilizables: [lista de componentes existentes de docs/components.md]

Acciones:
- Primaria: [nombre] → [qué hace]
- Secundarias: [lista]
- Destructivas: [lista, con confirmación si aplica]

Añadir a app.routes.ts:
{ path: '[path]', loadComponent: () => import('./[ruta]').then(m => m.[Componente]) }
```

---

## Constraints

- Toda nueva ruta debe usar `loadComponent()` para lazy loading
- No añadir NgModules (standalone por defecto)
- El componente page solo orquesta — la lógica de negocio va en services
- Añadir la nueva ruta dentro del `LayoutComponent` (bajo `path: ''`) para heredad el layout y el `authGuard`
