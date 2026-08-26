# UI Audit — Fitness Factory

Inventario honesto del estado actual de la interfaz. No es una crítica, es un mapa técnico de deuda visual.

Última actualización: 2026-08-21  
Auditado por: Design System Infrastructure task

**Importante:** Este documento registra problemas. No modificar componentes basándose solo en este audit — cada corrección requiere una tarea explícita con QA.

---

## Critical — Problemas funcionales, responsive o de accesibilidad

### C1. Modal sin gestión de foco ni roles ARIA
**Componente:** `src/app/features/caja/turno/turno-caja.component.ts`  
**Problema:** El modal de cierre de turno usa `position: fixed` con CSS pero no tiene:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` apuntando al heading del modal
- Trampa de foco (el usuario puede navegar con Tab fuera del modal)
- Soporte para cerrar con `Escape`

**Impacto:** Falla WCAG 2.1 AA (4.1.2 Name, Role, Value). Screen readers no anuncian la apertura del modal.  
**Corrección:** Añadir los atributos ARIA, implementar focus trap y `Escape` handler.

---

### C2. Focus ring ausente en la mayoría de inputs
**Componentes:** Todos excepto `login.component.ts` y `cliente-form.component.ts`  
**Problema:** El focus ring (`box-shadow: var(--shadow-focus)`) está implementado en LoginComponent y ClienteFormComponent, pero no en:
- `membresia-form.component.ts`
- `turno-caja.component.ts`
- `registro-pago.component.ts`
- `reportes.component.ts`
- `configuracion.component.ts`
- `clientes-lista.component.ts` (search input)

**Impacto:** Falla WCAG 2.1 AA (2.4.7 Focus Visible). Usuarios de teclado no pueden ver dónde están.  
**Corrección:** Añadir a todos los inputs:
```css
input:focus, select:focus, textarea:focus {
  border-color: var(--primary);
  box-shadow: var(--shadow-focus);
  outline: none;
}
```

---

### C3. Labels sin atributo `for` en varios formularios
**Componentes:** Mayoría de formularios  
**Problema:** `<label>` sin `for` atributo que apunte al `id` del input correspondiente. Los inputs tampoco tienen `id` consistente.  
**Ejemplo en `turno-caja.component.ts`:**
```html
<!-- Actual (incorrecto): -->
<label>Monto de apertura</label>
<input type="number" [(ngModel)]="montoApertura">

<!-- Correcto: -->
<label for="monto-apertura">Monto de apertura</label>
<input id="monto-apertura" type="number" [(ngModel)]="montoApertura">
```
**Impacto:** Screen readers no pueden asociar label con input. Falla WCAG 1.3.1.

---

### C4. Tablas sin `scope` en headers ni `caption`/`aria-label`
**Componentes:** Todos los que tienen tablas (`clientes-lista`, `membresias-lista`, `cliente-detalle`, `reportes`, `configuracion`)  
**Problema:** Ninguna tabla tiene:
- `scope="col"` en `<th>` de columnas
- `<caption>` o `aria-label` describiendo la tabla

**Impacto:** Screen readers no pueden navegar la tabla de forma estructurada. Falla WCAG 1.3.1.

---

### C5. Sin skip-to-main-content link
**Componente:** `src/app/shared/components/layout/layout.component.ts`  
**Problema:** No existe un "Skip to main content" link para usuarios de teclado que quieran saltar la navegación del sidebar.  
**Impacto:** Usuarios de teclado deben tabear a través de todos los items de navegación en cada página.

---

## Important — Inconsistencias significativas de UX/UI

### I1. Colores de estado hardcodeados (no usan tokens)
**Componentes:** Los 13 componentes  
**Problema:** Todos los colores de status están hardcodeados. El archivo `src/styles/tokens.css` ya existe con los valores correctos, pero los componentes aún no lo referencian — siguen usando fallback values.

**Inventario de valores hardcodeados:**

| Valor hardcodeado | Ocurrencias | Token correcto |
|------------------|-------------|----------------|
| `#22c55e` | 6 componentes | `--color-success` |
| `rgba(34,197,94,0.15)` | 5 componentes | `--color-success-subtle` |
| `rgba(34,197,94,0.12)` | 3 componentes | `--color-success-banner` |
| `#4ade80` | 3 componentes | `--color-success-text` |
| `#f59e0b` | 4 componentes | `--color-warning` / `--color-warning-text` |
| `rgba(245,158,11,0.15)` | 3 componentes | `--color-warning-subtle` |
| `#ef4444` | 6 componentes | `--color-danger` / `--color-danger-text` |
| `rgba(239,68,68,0.15)` | 5 componentes | `--color-danger-subtle` |
| `rgba(239,68,68,0.12)` | 3 componentes | `--color-danger-banner` |
| `#f87171` | 2 componentes | `--color-danger-text` |
| `#eab308` | 1 componente (membresias-lista) | `--color-frozen` / `--color-frozen-text` |
| `rgba(234,179,8,0.12)` | 1 componente | `--color-frozen-subtle` |
| `rgba(148,163,184,0.12)` | 1 componente | `--color-neutral-subtle` |

**Impacto:** La refactorización del tema o los colores de status requiere editar todos los componentes individualmente.  
**Corrección:** Tarea de frontend-refactor — sustituir valor a valor con tokens.

---

### I2. Inconsistencia en color de badge "activa"
**Componentes:** `clientes-lista.component.ts` vs `membresias-lista.component.ts` + `cliente-detalle.component.ts`  
**Problema:**
- `clientes-lista`: usa `#22c55e` para texto de badge activa
- `membresias-lista` + `cliente-detalle`: usa `#4ade80` para texto de badge activa

Son dos verdes distintos para el mismo significado semántico.  
**Corrección:** Estandarizar a `--color-success-text` (`#4ade80`) — el más claro tiene mejor contraste sobre `--bg-card`.

---

### I3. Inconsistencia en color de badge "vencida"
**Componentes:** `clientes-lista.component.ts` vs `membresias-lista.component.ts`  
**Problema:**
- `clientes-lista`: usa `#ef4444` para texto de badge inactiva/vencida
- `membresias-lista`: usa `#f87171` para texto de badge vencida

**Corrección:** Estandarizar a `--color-danger-text` (`#f87171`).

---

### I4. Page heading h1 inconsistente
**Componentes:** Múltiples  
**Problema:**

| Componente | h1 font-size actual | Correcto |
|-----------|--------------------|---------:|
| `dashboard.component.ts` | 1.75rem | ✅ correcto |
| `login.component.ts` | 1.75rem | ✅ correcto |
| `cliente-form.component.ts` | **1.6rem** | ❌ drift |
| `clientes-lista.component.ts` | **1.5rem** | ❌ incorrecto (ese valor es para stat-values) |
| `membresias-lista.component.ts` | no definido | ⚠️ heredado |
| `turno-caja.component.ts` | no definido | ⚠️ heredado |
| `reportes.component.ts` | no definido | ⚠️ heredado |
| `configuracion.component.ts` | no definido | ⚠️ heredado |

**Estándar canónico:** `font-size: var(--text-5xl)` (1.75rem) en todos los `<h1>` de página.

---

### I5. Border-radius sin sistema (10 valores distintos)
**Componentes:** Todos  
**Problema:** Se usan 10 valores de radius distintos sin ningún sistema:
- `10px` — inputs (19 ocurrencias) → debería ser `--radius-input`
- `16px` — cards (10 ocurrencias) → debería ser `--radius-card`
- `12px` — íconos de stat cards (7 ocurrencias) → debería ser `--radius-lg`
- `8px` — botones (6 ocurrencias) → debería ser `--radius-md`
- `6px` — pequeños (4 ocurrencias) → debería ser `--radius-sm`
- `999px` — pills (4 ocurrencias) → debería ser `--radius-full`
- `50%` — avatares en tabla (3 ocurrencias) → usar `--radius-full`
- `24px` — avatar grande (1 ocurrencia) → debería ser `--radius-xl`
- `20px` — badge en clientes-lista (1 ocurrencia) → debería ser `--radius-full`
- `18px` — photo-preview (1 ocurrencia) → debería ser `--radius-lg` o `--radius-card`

---

### I6. Filter chips inconsistentes
**Componentes:** `clientes-lista.component.ts` vs `membresias-lista.component.ts`  
**Problema:**
- `clientes-lista`: chips rectangulares con `border-radius: 6px`
- `membresias-lista`: chips tipo pill con `border-radius: 999px`

**Estándar:** Pill (`--radius-full`) — es más coherente con el patrón de badges y más reconocible como filtro.

---

### I7. Template-driven forms en todos los formularios
**Componentes:** LoginComponent, ClienteFormComponent, MembresiaFormComponent, TurnoCajaComponent, RegistroPagoComponent, ReportesComponent, ConfiguracionComponent, ClientesListaComponent (search)  
**Problema:** AGENTS.md dice "Prefer Reactive forms". Todos los formularios usan FormsModule + `[(ngModel)]`.  
**Decisión:** No migrar los existentes (riesgo vs beneficio). Los formularios nuevos deben usar Reactive forms.  
**Referencia:** Ver `docs/design-decisions.md` — "Template-Driven Forms".

---

### I8. Umbral "por vencer" inconsistente
**Componentes:** `dashboard.component.ts` vs `membresias-lista.component.ts` vs `reportes.component.ts`  
**Problema:**
- Dashboard: ≤3 días → `estaProximoAVencer()` en `ClientesService`
- MembresiasLista: ≤7 días → `estadoVisual()` en el componente
- Reportes: ≤7 días → `plusDaysISO(7)` en la query

**Estándar correcto:** 7 días (permite más tiempo de reacción para llamar al cliente).  
**Corrección:** Actualizar `ClientesService.estaProximoAVencer()` a 7 días, y el texto del dashboard.

---

## Generic Patterns — Elementos que hacen parecer el app genérico

### G1. ~~Dashboard con 4 KPI cards~~ — NO es un problema aquí
Las 4 KPI cards (activas, por vencer, vencidas, ingresos del día) son métricas operativas específicas del negocio. No son decorativas ni genéricas. **No cambiar.**

### G2. Stat card icon containers sin diferenciación
**Componente:** `dashboard.component.ts`  
Los contenedores de íconos en stat cards usan colores de estado (verde, naranja, rojo, azul). Esto es correcto para el significado semántico. Sin embargo, los 4 tienen la misma forma y tamaño exactos — podría añadirse alguna diferenciación visual menor si la identidad del producto lo requiere. **Low priority.**

---

## Component Opportunities — Para consolidar

### O1. DOP Currency formatter duplicado
**Problema:** El patrón `new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })` está copiado en al menos 4 componentes: `dashboard`, `turno-caja`, `reportes`, `cliente-detalle`.  
**Oportunidad:** Crear un shared Angular pipe `CurrencyDopPipe` en `src/app/shared/pipes/currency-dop.pipe.ts`.  
**Prioridad:** Media — funciona correctamente tal como está.

### O2. Client search typeahead duplicado
**Problema:** La lógica de "buscar cliente mientras se escribe" está duplicada en `membresia-form.component.ts` y `registro-pago.component.ts`.  
**Oportunidad:** Extraer a un componente `ClientSearchComponent`.  
**Prioridad:** Baja — solo 2 instancias.

---

## Design Token Violations — Valores arbitrarios

Ver **I1** para el inventario completo de colores hardcodeados.

Adicionalmente:

| Valor | Componente | Token correspondiente |
|-------|-----------|----------------------|
| `0 25px 50px rgba(0,0,0,0.4)` (shadow) | `login.component.ts` | `--shadow-login` |
| `0 0 0 3px rgba(59,130,246,.14)` (focus) | `cliente-form.component.ts` | `--shadow-focus` |
| `rgba(2,6,23,0.72)` (overlay) | `turno-caja.component.ts` | `--bg-overlay` |
| `padding: 3rem 1rem !important` | `clientes-lista.component.ts` (empty state) | `--space-12 --space-4`, sin `!important` |
| `var(--bg-input, #0f172a)` — `--bg-input` no estaba definido | `login.component.ts` | Ahora sí definido en `tokens.css` |
| `font-size: 0.78rem` en table headers | múltiples | Usar `--text-xs` (0.75rem) — diferencia mínima, estandarizar |

---

## Polish — Mejoras menores

### P1. `transform: translateY(-2px)` en hover de action-cards
**Componente:** `dashboard.component.ts` (action cards)  
**Problema:** El hover en las quick-action cards aplica `transform: translateY(-2px)`, causando un layout shift visual. Puede ser molesto para usuarios sensibles al movimiento.  
**Corrección:** Reemplazar con `border-color: var(--primary)` o `box-shadow` en hover. Añadir `prefers-reduced-motion` block que lo desactive.

### P2. `padding: 3rem 1rem !important` en empty state
**Componente:** `clientes-lista.component.ts`  
**Problema:** `!important` innecesario.  
**Corrección:** Eliminar `!important` — no compite con ningún otro estilo.

### P3. Notación inconsistente en rem (`.75rem` vs `0.75rem`)
**Componentes:** Múltiples  
**Problema:** Mezcla de `.75rem` (sin cero) y `0.75rem` en el mismo codebase.  
**Estándar:** Siempre con cero: `0.75rem`. Más legible y consistente.

### P4. `font-size: 0.78rem` en table headers de algunos componentes
**Componentes:** Algunos  
**Problema:** 0.78rem es un valor no perteneciente a ningún token. El token más cercano es `--text-xs` (0.75rem).  
**Corrección:** Usar `var(--text-xs)`.

---

## Resumen de prioridades

| Prioridad | Cantidad | Descripción |
|-----------|----------|-------------|
| Critical | 5 | Accessibility gaps (modal ARIA, focus ring, labels, table scope, skip nav) |
| Important | 8 | Token migration, color inconsistencies, heading inconsistency, radius chaos, chip inconsistency, forms policy, threshold inconsistency |
| Polish | 4 | translateY hover, !important, rem notation, font-size 0.78rem |

**Regla:** Corregir todos los Critical antes de cualquier rediseño visual. Los Important pueden corregirse por tarea individual de refactor. El Polish es opcional.
