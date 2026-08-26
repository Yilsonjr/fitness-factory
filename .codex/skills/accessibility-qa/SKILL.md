# Skill: Accessibility QA

**Activar cuando:** Después de implementar o modificar cualquier componente con UI interactiva. Obligatorio antes de marcar una feature como terminada.

---

## Context

- `docs/accessibility.md` — checklist completo con reglas y ejemplos

---

## Estándar

**WCAG 2.1 AA**. Debe pasar checks de AXE.

---

## Process

Leer el componente completo y verificar cada punto.

### 1. Semantic HTML

- [ ] La página tiene exactamente 1 `<h1>` con `font-size: var(--text-5xl)`
- [ ] La jerarquía de headings es correcta (h1 → h2 → h3, sin saltar niveles)
- [ ] La navegación principal está dentro de `<nav>` (en `layout.component`)
- [ ] El contenido principal está dentro de `<main>` (en `layout.component`)
- [ ] Los botones son `<button>`, no `<div>` o `<span>` con click handler
- [ ] Los links son `<a>` o `[routerLink]` en elementos `<a>`

### 2. Forms — Labels

- [ ] Cada `<input>` tiene `<label for="id">` explícito donde `for` coincide con el `id` del input
- [ ] Cada `<select>` tiene `<label for="id">` explícito
- [ ] Cada `<textarea>` tiene `<label for="id">` explícito
- [ ] No se usa solo `placeholder` como label (el placeholder desaparece al escribir)

```html
<!-- Verificar este patrón en todos los inputs: -->
<label for="telefono">Teléfono</label>
<input id="telefono" type="tel" ...>
```

### 3. Forms — Required y Validation

- [ ] Los campos requeridos tienen `required` en el HTML y `aria-required="true"`
- [ ] Los mensajes de error están asociados al input con `aria-describedby`:
  ```html
  <input id="cedula" aria-describedby="cedula-error" aria-invalid="true">
  <span id="cedula-error" role="alert">Formato inválido</span>
  ```
- [ ] Los mensajes de error usan `role="alert"` para ser anunciados automáticamente
- [ ] El formulario preserva los datos del usuario al producirse un error (no resetea)

### 4. Focus Ring

- [ ] Todos los `<input>`, `<select>`, `<textarea>` tienen focus ring visible:
  ```css
  input:focus-visible {
    border-color: var(--primary);
    box-shadow: var(--shadow-focus);
    outline: none;
  }
  ```
- [ ] Todos los `<button>` tienen focus ring visible
- [ ] Los links y elementos de navegación tienen focus ring visible
- [ ] No se elimina el outline sin reemplazarlo (`outline: none` sin `box-shadow` → ❌)

### 5. Icons

- [ ] Los icon-only buttons tienen `aria-label` descriptivo:
  ```html
  <button aria-label="Ver detalle de Juan Pérez">
    <svg aria-hidden="true" ...>...</svg>
  </button>
  ```
- [ ] Los SVG en botones con texto visible tienen `aria-hidden="true"`
- [ ] Los SVG decorativos tienen `aria-hidden="true"`
- [ ] No hay botones con solo un emoji o solo un SVG sin `aria-label`

### 6. Tables

- [ ] `<table>` tiene `aria-label` o `<caption>` describiendo el contenido
- [ ] Todos los `<th>` de columna tienen `scope="col"`
- [ ] La columna de acciones tiene un header (aunque sea `<span class="sr-only">Acciones</span>`)
- [ ] Los botones de fila tienen `aria-label` que incluye el nombre del item:
  ```html
  <button aria-label="Editar membresía de Juan Pérez">...</button>
  ```

### 7. Dialog / Modal

*Solo verificar si el componente tiene un modal.*

- [ ] El modal tiene `role="dialog"` y `aria-modal="true"`
- [ ] El modal tiene `aria-labelledby` apuntando al id del heading del modal
- [ ] El foco se mueve al modal al abrirse (al primer elemento focusable)
- [ ] El foco no puede salir del modal con Tab mientras está abierto (focus trap)
- [ ] `Escape` cierra el modal
- [ ] El foco vuelve al elemento que abrió el modal al cerrar

### 8. Color

- [ ] El estado de membresía no se comunica **solo** con color — siempre hay texto junto al badge
- [ ] Los mensajes de error no se comunican **solo** con color (rojo) — siempre hay texto
- [ ] El ratio de contraste del texto sobre fondo es ≥ 4.5:1 para texto normal
- [ ] El ratio del texto en badges es aceptable (verificar `docs/accessibility.md` para ratios exactos de cada badge)

### 9. Live Regions

- [ ] Los banners de éxito usan `role="status"` o `aria-live="polite"`
- [ ] Los banners de error usan `role="alert"` o `aria-live="assertive"`
- [ ] Los elementos de live region existen en el DOM desde el inicio (aunque vacíos)

### 10. Navigation (solo para layout.component)

- [ ] Existe un skip link "Saltar al contenido principal" como primer elemento focusable:
  ```html
  <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
  <main id="main-content">...</main>
  ```
- [ ] El skip link es visible al recibir foco (`:focus-visible`)

### 11. Motion

- [ ] Las animaciones `@keyframes` (ej: spinner de loading) están bloqueadas con:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .spinner { animation: none; }
  }
  ```
- [ ] Las transiciones usan tokens de motion (automáticamente reducidas via tokens.css)

### 12. Touch Targets

*Solo verificar en mobile (@media max-width: 768px)*

- [ ] Todos los elementos interactivos tienen área de toque ≥ 44×44px en mobile
- [ ] Los icon buttons en tablas tienen `min-height: 44px` en mobile
- [ ] Los filter chips tienen `min-height: 44px` en mobile

---

## Severity Classification

| Severidad | Descripción |
|-----------|-------------|
| **Critical** | Impide uso completo para usuarios con discapacidad. Bloquea release. |
| **Major** | Dificulta significativamente el uso. Debe corregirse. |
| **Minor** | Impacto bajo o workaround disponible. Corregir cuando sea posible. |

| Check | Severidad |
|-------|-----------|
| Labels faltantes | Critical |
| Focus ring ausente | Critical |
| Modal sin ARIA | Critical |
| Tabla sin scope | Major |
| Icon button sin aria-label | Major |
| Error sin role="alert" | Major |
| Skip link ausente | Major |
| Badge solo-color sin texto | Critical |
| Touch target < 44px | Minor (Major en app-only) |

---

## Output

```
## Accessibility QA Report — [Componente]

### Resultado: PASA / FALLA / PASA CON OBSERVACIONES

### Critical Issues (bloquean release)
- [ ] [Descripción + línea + corrección]

### Major Issues (deben corregirse)
- [ ] [Descripción + línea + corrección]

### Minor Issues (cuando sea posible)
- [ ] [Descripción + línea + corrección]

### Checks que pasan ✅
- [Lista]
```
