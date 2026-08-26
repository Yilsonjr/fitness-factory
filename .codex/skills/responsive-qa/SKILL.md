# Skill: Responsive QA

**Activar cuando:** Después de implementar cualquier componente que sea una página completa, o que contenga grids, tablas, formularios o navegación.

---

## Context

- `design.md` — sección "Responsive"
- `AGENTS.md` — sección "CSS / Tokens"
- `docs/ux-principles.md` — principio 8: "Mobile Is Collapse, Not Redesign"

---

## Breakpoint único

Este proyecto usa **un solo breakpoint:** `@media (max-width: 768px)`.

No hay breakpoints intermedios (1024px, 1280px). Si el componente necesita comportamiento en tablet, entra en la misma media query.

---

## Process

Leer el componente y su bloque `@media (max-width: 768px)`. Si ese bloque no existe en un page component, ya es un problema.

### 1. ¿Existe el bloque responsive?

- [ ] El componente tiene al menos un bloque `@media (max-width: 768px)` en sus styles
- [ ] Si es un page component (lista, formulario, detalle, dashboard), es obligatorio
- [ ] Si es un componente muy simple (solo texto o un badge), puede omitirse

### 2. Layout principal

- [ ] `margin-left` del contenido: `var(--sidebar-width)` en desktop, `var(--sidebar-collapsed)` en mobile
  ```css
  /* Verificar que el layout.component tiene: */
  @media (max-width: 768px) {
    .main-content { margin-left: var(--sidebar-collapsed); }
  }
  ```
- [ ] El `max-width: var(--content-max)` del contenido sigue funcionando en mobile (el wrapper no rompe el layout)

### 3. Grids

- [ ] Grids multi-columna colapsan a 1 columna:
  ```css
  /* Desktop: */
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); }

  /* Mobile: */
  @media (max-width: 768px) {
    .grid { grid-template-columns: 1fr; }
  }
  ```
- [ ] Los elementos con `grid-column: span 2` se resetean:
  ```css
  @media (max-width: 768px) {
    .span-2 { grid-column: 1; }
  }
  ```
- [ ] No hay grids con `minmax` que resulten en columnas demasiado estrechas en mobile

### 4. Page Header

- [ ] El header (título + botón) cambia de row a column:
  ```css
  @media (max-width: 768px) {
    .page-header { flex-direction: column; }
    .page-header button { width: 100%; }
  }
  ```
- [ ] Los botones del header son full-width en mobile (facilita el toque)

### 5. Tablas

- [ ] Las tablas tienen `overflow-x: auto` en su contenedor para scroll horizontal
- [ ] Las columnas no críticas están ocultas en mobile:
  ```css
  @media (max-width: 768px) {
    th:nth-child(3), td:nth-child(3) { display: none; } /* teléfono */
    th:nth-child(5), td:nth-child(5) { display: none; } /* fecha vencimiento */
  }
  ```
- [ ] Las columnas que quedan visibles son suficientes para usar la tabla (al menos: nombre + estado + acción)
- [ ] Los botones de acción de fila siguen siendo accesibles (no ocultos)

### 6. Formularios

- [ ] Los formularios de 2 columnas colapsan a 1 columna:
  ```css
  @media (max-width: 768px) {
    .form-grid { grid-template-columns: 1fr; }
  }
  ```
- [ ] Los elementos `span-2` se resetean (ver punto 3)
- [ ] El botón de submit es full-width o tiene suficiente área de toque (≥44px de altura)

### 7. Navegación (sidebar)

- [ ] En `layout.component.ts`: el sidebar colapsa a `var(--sidebar-collapsed)` en mobile (72px)
- [ ] Los labels de texto en el sidebar están ocultos (`display: none` o `opacity: 0`)
- [ ] El botón de collapse del sidebar está oculto en mobile (no tiene sentido si ya está colapsado)

### 8. Overflow y overflow-x

- [ ] No hay elementos con ancho fijo en px que rompan el layout en viewports < 768px
- [ ] No hay `min-width` o `width` en px que excedan el viewport en mobile
- [ ] Las cards con contenido largo tienen `word-break: break-word` si el contenido es texto del usuario

### 9. Touch Targets

- [ ] Los botones de acción (ver, editar, filtrar) tienen altura ≥ 44px en mobile
- [ ] Los filter chips tienen altura ≥ 44px en mobile
- [ ] Los nav items del sidebar tienen altura ≥ 44px siempre (ya están en 48px actualmente)

### 10. Transformaciones estructurales

Ir más allá del simple resize. Verificar:

| Elemento | Desktop | Mobile esperado | ¿Correcto? |
|---------|---------|-----------------|-----------|
| Summary grid (4 cols) | `repeat(4, 1fr)` | `1fr` | [ ] |
| Form grid (2 cols) | `repeat(2, 1fr)` | `1fr` | [ ] |
| Page header (row) | `flex-direction: row` | `flex-direction: column` | [ ] |
| Sidebar | 260px visible | 72px íconos | [ ] |
| List/detail grid | 2 cols | 1 col | [ ] |
| Expense inline form | 3 cols | 1 col | [ ] |

---

## Output

```
## Responsive QA Report — [Componente]

### Breakpoint: 768px

### ✅ Correcto
- [Items que pasan]

### ❌ Problemas

**[Categoría]**
- Problema: [descripción]
  CSS actual: [código actual]
  CSS correcto: [código correcto]

### 🔶 Observaciones
- [Items que funcionan pero podrían mejorar]
```

Priorizar problemas que rompen el layout (overflow, elementos inutilizables) sobre los que son solo ajustes de spacing.
