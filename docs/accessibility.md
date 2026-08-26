# Accessibility — Fitness Factory

Estándar: **WCAG 2.1 AA**. Todos los componentes deben pasar AXE automated checks.

---

## Gaps conocidos (ver ui-audit.md para detalles)

| Gap | Severidad | Componentes afectados |
|-----|----------|-----------------------|
| Modal sin ARIA roles ni focus trap | Critical | turno-caja.component |
| Focus ring ausente en varios forms | Critical | 5 componentes |
| Labels sin `for`/`id` en varios inputs | Critical | mayoría de formularios |
| Tablas sin `scope` ni `caption` | Critical | todos los componentes con tabla |
| Sin skip-to-main-content link | Important | layout.component |

Estos gaps están registrados en `docs/ui-audit.md` bajo Critical (C1–C5). Deben resolverse antes de cualquier rediseño visual.

---

## 1. Color Contrast

### Texto sobre backgrounds

| Combinación | Ratio (aprox.) | WCAG AA |
|-------------|---------------|---------|
| `--text-primary` (#f1f5f9) sobre `--bg-card` (#1e293b) | 12.6:1 | ✅ Pasa AAA |
| `--text-secondary` (#94a3b8) sobre `--bg-card` (#1e293b) | 4.7:1 | ✅ Pasa AA (texto normal ≥4.5:1) |
| `--text-muted` (#475569) sobre `--bg-card` (#1e293b) | 2.6:1 | ❌ No pasa para texto normal — solo usar para hints no críticos |
| `--primary` (#3b82f6) sobre `--bg-card` (#1e293b) | 3.2:1 | ❌ No usar para texto — solo para UI interactiva |
| `white` sobre `--primary` (#3b82f6) | 3.9:1 | ✅ Pasa AA para texto grande (>18px o bold >14px) — botones usan text-base/font-semibold |

### Badges de estado (texto sobre fondo translúcido efectivo)

Los badges usan fondos con opacidad sobre `--bg-card`. El ratio debe calcularse con el color efectivo resultante.

| Badge | Texto | Bg efectivo (aprox.) | Ratio aprox. | Estado |
|-------|-------|---------------------|--------------|--------|
| activa | `#4ade80` | `#223a2a` | ~3.8:1 | ⚠️ Verificar — marginal para texto xs |
| warning | `#f59e0b` | `#2f2a1f` | ~4.2:1 | ⚠️ Verificar |
| danger | `#f87171` | `#2f2020` | ~4.1:1 | ⚠️ Verificar |
| frozen | `#eab308` | `#28260e` | ~5.1:1 | ✅ |

**Acción requerida:** Verificar los ratios exactos usando una herramienta como [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/) con los colores efectivos calculados. Si alguno no pasa, aumentar la opacidad del fondo o ajustar el color del texto del token.

---

## 2. Keyboard Navigation

Todos los elementos interactivos deben ser alcanzables y accionables con teclado.

### Orden de tab
El tab order debe seguir el orden visual: izquierda → derecha, arriba → abajo. No usar `tabindex` positivo (>0) excepto en casos justificados.

### Elementos que deben ser focusables
- Todos los `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`
- Los list items con acciones (filas de tabla con click handlers)
- Los filter chips cuando tienen acción de click

### Focus visible
**Requisito:** Todos los elementos focusables deben mostrar un indicador de foco visible que cumpla WCAG 2.4.11 (Enhanced Focus Appearance, recomendado para AA++).

**Implementación estándar en este proyecto:**
```css
:focus-visible {
  border-color: var(--primary);
  box-shadow: var(--shadow-focus); /* 0 0 0 3px rgba(59,130,246,0.15) */
  outline: none;
}
```

Usar `:focus-visible` (no `:focus`) para evitar el ring en clicks con mouse.

**Aplicar a:** `input`, `select`, `textarea`, `button`, `a`, `.filter-btn`, `.chip`, `.nav-item`.

---

## 3. Forms

### Labels

**Regla:** Cada input debe tener un `<label>` explícito con `for` que coincida con el `id` del input.

```html
<!-- Correcto -->
<label for="telefono">Teléfono</label>
<input id="telefono" type="tel" ...>

<!-- Incorrecto -->
<label>Teléfono</label>
<input type="tel" ...>
```

No usar `placeholder` como sustituto del label. El placeholder desaparece al escribir.

### Required fields

```html
<label for="nombre">
  Nombre
  <span aria-hidden="true">*</span>
  <span class="sr-only">(obligatorio)</span>
</label>
<input id="nombre" required aria-required="true" ...>
```

### Error messages

Los mensajes de error deben estar asociados al input mediante `aria-describedby`:

```html
<input
  id="cedula"
  aria-describedby="cedula-error"
  aria-invalid="true"
  ...>
<span id="cedula-error" role="alert">
  La cédula debe tener el formato 000-0000000-0
</span>
```

**Importante:** El `role="alert"` anuncia el error automáticamente a screen readers sin que el usuario tenga que navegar hasta él.

### Groups of related inputs

Usar `<fieldset>` + `<legend>` para grupos de radio buttons o checkboxes:

```html
<fieldset>
  <legend>Método de pago</legend>
  <label><input type="radio" name="metodo" value="efectivo"> Efectivo</label>
  <label><input type="radio" name="metodo" value="tarjeta"> Tarjeta</label>
  <label><input type="radio" name="metodo" value="transferencia"> Transferencia</label>
</fieldset>
```

---

## 4. Tables

### Headers

```html
<table aria-label="Lista de membresías">
  <thead>
    <tr>
      <th scope="col">Cliente</th>
      <th scope="col">Plan</th>
      <th scope="col">Vence</th>
      <th scope="col">Estado</th>
      <th scope="col"><span class="sr-only">Acciones</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Juan Pérez</td>
      ...
    </tr>
  </tbody>
</table>
```

**Requerido en todas las tablas:**
- `aria-label` en `<table>` (o `<caption>` dentro de ella)
- `scope="col"` en todos los `<th>` de columna
- `<span class="sr-only">Acciones</span>` en la columna de acciones (el header suele estar vacío visualmente)

### Tablas con acciones por fila

Si una fila tiene múltiples acciones (ver, editar), asegurar que cada botón tenga `aria-label` que incluya el nombre del elemento:

```html
<button aria-label="Ver detalle de Juan Pérez">
  <!-- ícono ojo -->
</button>
<button aria-label="Editar Juan Pérez">
  <!-- ícono lápiz -->
</button>
```

---

## 5. Dialogs / Modals

El modal de cierre de turno en `turno-caja.component.ts` actualmente no cumple los requisitos de accesibilidad (ver `docs/ui-audit.md` C1). Cuando se corrija:

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  class="modal">
  <h2 id="modal-title">Cerrar turno</h2>
  <!-- Contenido -->
  <button (click)="cancelar()">Cancelar</button>
  <button (click)="confirmar()">Confirmar cierre</button>
</div>
```

**Requisitos del modal:**
1. `role="dialog"` y `aria-modal="true"`
2. `aria-labelledby` apuntando al heading del modal
3. Focus se mueve al primer elemento focusable del modal al abrirse
4. El foco no puede salir del modal mientras está abierto (focus trap)
5. Cerrar con `Escape` devuelve el foco al elemento que abrió el modal
6. El backdrop con click también cierra el modal

**Implementación Angular recomendada:**
```typescript
ngAfterViewInit() {
  if (this.modalOpen()) {
    this.modalRef.nativeElement.querySelector('[autofocus], button')?.focus();
  }
}

@HostListener('keydown.escape')
onEscape() {
  this.cerrarModal();
}
```

---

## 6. Icons

### Íconos en botones sin texto visible (icon-only buttons)

```html
<!-- Requiere aria-label -->
<button aria-label="Editar cliente" class="btn-icon">
  <svg aria-hidden="true" ...>...</svg>
</button>
```

El SVG lleva `aria-hidden="true"` porque el `aria-label` del botón ya lo describe.

### Íconos decorativos que acompañan texto

```html
<button>
  <svg aria-hidden="true" ...>...</svg>
  Nuevo cliente
</button>
```

El texto visible es suficiente — `aria-hidden="true"` evita que el screen reader lea el SVG dos veces.

### `title` attribute en botones (patrón actual)

El app actualmente usa `title="Ver detalle"` en los botones de acción. Esto es aceptable como tooltip visual pero **no** es un substituto completo de `aria-label` porque `title` no es anunciado de forma confiable por todos los screen readers. Migrar a `aria-label` gradualmente.

---

## 7. Live Regions

Para feedback de operaciones asíncronas (guardar, cobrar, asignar), usar `role="alert"` para errores y `role="status"` para éxito:

```html
<!-- Error (anuncia inmediatamente) -->
<div role="alert" aria-live="assertive">
  No se pudo registrar el pago. Verifica tu conexión.
</div>

<!-- Éxito (anuncia cuando el lector esté libre) -->
<div role="status" aria-live="polite">
  Pago registrado correctamente.
</div>
```

Estos elementos deben existir en el DOM desde el inicio (aunque vacíos) para que el screen reader los registre. Actualizar solo el contenido textual, no el elemento completo.

---

## 8. Touch Targets

En mobile, todos los elementos interactivos deben tener un mínimo de **44×44px** de área de toque.

**Elementos actuales que pueden ser pequeños:**
- Icon buttons en tablas (ver, editar): `padding: 0.4rem` sobre un SVG de 18px → ~34px total. Insuficiente.
- Filter chips: verificar que el padding total supere 44px de altura en mobile.

**Corrección sugerida:**
```css
@media (max-width: 768px) {
  .btn-icon {
    min-width: 44px;
    min-height: 44px;
  }
}
```

---

## 9. Reduced Motion

El bloque `prefers-reduced-motion` ya está incluido en `src/styles/tokens.css`:

```css
@media (prefers-reduced-motion: reduce) {
  --duration-fast:   0s;
  --duration-layout: 0s;
}
```

Esto elimina automáticamente las transiciones de los componentes que usen los tokens de motion. Sin embargo, las animaciones `@keyframes` (ej: el spinner de loading en botones) deben bloquearse explícitamente:

```css
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    opacity: 0.6;
  }
}
```

---

## Checklist reutilizable

Usar antes de considerar terminado cualquier componente con UI.

### Forms
- [ ] Cada `<input>`, `<select>`, `<textarea>` tiene `<label for="id">` explícito
- [ ] Cada input tiene un `id` único en la página
- [ ] Los campos requeridos tienen `required` y `aria-required="true"`
- [ ] Los errores tienen `role="alert"` o `aria-describedby` al input
- [ ] El formulario no se resetea al producirse un error

### Keyboard
- [ ] Todos los elementos interactivos son alcanzables con Tab
- [ ] El tab order sigue el orden visual
- [ ] Todos los elementos interactivos tienen `:focus-visible` estilo (`--shadow-focus`)
- [ ] Las acciones se pueden completar sin ratón

### Contrast
- [ ] Texto normal: ratio ≥ 4.5:1
- [ ] Texto grande (>18px o bold >14px): ratio ≥ 3:1
- [ ] Badges de estado verificados con colores efectivos (no el rgba puro)

### Images & Icons
- [ ] Íconos en botones sin texto: `aria-label` en el botón, `aria-hidden="true"` en SVG
- [ ] Íconos decorativos: `aria-hidden="true"` en SVG
- [ ] Imágenes informativas: `alt` descriptivo

### Tables
- [ ] `aria-label` o `<caption>` en `<table>`
- [ ] `scope="col"` en todos los `<th>`
- [ ] Columna de acciones tiene header con `<span class="sr-only">`
- [ ] Botones de fila tienen `aria-label` que incluye el nombre del elemento

### Dialogs
- [ ] `role="dialog"` y `aria-modal="true"`
- [ ] `aria-labelledby` apuntando al heading
- [ ] Focus trap implementado
- [ ] Cierre con `Escape` implementado
- [ ] Focus vuelve al trigger al cerrar

### Semantic HTML
- [ ] Un solo `<h1>` por página
- [ ] Jerarquía de headings correcta (h1 → h2 → h3, sin saltar)
- [ ] `<nav>` para la navegación principal
- [ ] `<main>` para el contenido principal
- [ ] `<button>` (no `<div>` o `<span>`) para acciones

### Motion
- [ ] Animaciones `@keyframes` bloqueadas con `prefers-reduced-motion: reduce`
- [ ] Transiciones usan tokens de motion (automáticamente bloqueadas)

### Mobile
- [ ] Touch targets ≥ 44×44px en todos los elementos interactivos
- [ ] Sin texto que requiera zoom para leer (mínimo 16px nativo para texto de label, 14px equivalente en rem)
