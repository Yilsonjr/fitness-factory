# Skill: Frontend Refactor

**Activar cuando:** Se solicita migrar tokens, refactorizar CSS, migrar formularios a Reactive Forms, o limpiar deuda técnica de UI documentada en `docs/ui-audit.md`.

---

## Regla fundamental

**Preservar todo el comportamiento observable.**

El usuario no debe notar ninguna diferencia después del refactor. Ninguna regresión funcional es aceptable.

Siempre verificar con `ng build` y una revisión visual antes de completar.

---

## Tipos de refactor disponibles

### A. Migración de tokens CSS

**Objetivo:** Reemplazar valores hardcodeados con tokens de `src/styles/tokens.css`.

**Proceso:**

1. Leer el componente completo
2. Identificar todos los valores hardcodeados (usar `docs/ui-audit.md` como mapa)
3. Reemplazar usando la tabla de correspondencias:

| Valor actual | Token correcto |
|-------------|---------------|
| `#0f172a` | `var(--bg-primary)` |
| `#1e293b` | `var(--bg-card)` |
| `#263348` | `var(--bg-elevated)` |
| `rgba(2,6,23,0.72)` | `var(--bg-overlay)` |
| `#334155` | `var(--border)` |
| `rgba(51,65,85,0.55)` | `var(--border-muted)` |
| `#f1f5f9` | `var(--text-primary)` |
| `#94a3b8` | `var(--text-secondary)` |
| `#475569` | `var(--text-muted)` |
| `#3b82f6` | `var(--primary)` |
| `#2563eb` | `var(--primary-hover)` |
| `rgba(59,130,246,0.15)` | `var(--primary-subtle)` |
| `#22c55e` | `var(--color-success)` |
| `#4ade80` | `var(--color-success-text)` |
| `rgba(34,197,94,0.15)` | `var(--color-success-subtle)` |
| `rgba(34,197,94,0.12)` | `var(--color-success-banner)` |
| `#f59e0b` | `var(--color-warning)` o `var(--color-warning-text)` |
| `rgba(245,158,11,0.15)` | `var(--color-warning-subtle)` |
| `#ef4444` | `var(--color-danger)` |
| `#f87171` | `var(--color-danger-text)` |
| `rgba(239,68,68,0.15)` | `var(--color-danger-subtle)` |
| `rgba(239,68,68,0.12)` | `var(--color-danger-banner)` |
| `#eab308` | `var(--color-frozen)` o `var(--color-frozen-text)` |
| `rgba(234,179,8,0.12)` | `var(--color-frozen-subtle)` |
| `rgba(148,163,184,0.12)` | `var(--color-neutral-subtle)` |
| `6px` (radius) | `var(--radius-sm)` |
| `8px` (radius) | `var(--radius-md)` |
| `10px` (radius) | `var(--radius-input)` |
| `12px` (radius) | `var(--radius-lg)` |
| `16px` (radius) | `var(--radius-card)` |
| `24px` (radius) | `var(--radius-xl)` |
| `999px` (radius) | `var(--radius-full)` |
| `50%` (radius circular) | `var(--radius-full)` |
| `0.2s` (transition) | `var(--duration-fast)` |
| `0.3s ease` (transition) | `var(--transition-layout)` |
| `0 25px 50px rgba(0,0,0,0.4)` | `var(--shadow-login)` |
| `0 0 0 3px rgba(59,130,246,...)` | `var(--shadow-focus)` |
| `0 8px 32px rgba(0,0,0,0.5)` | `var(--shadow-modal)` |
| `260px` (sidebar width) | `var(--sidebar-width)` |
| `72px` (sidebar collapsed) | `var(--sidebar-collapsed)` |

**Reglas:**
- Reemplazar uno a uno, no en masa con sed/replace-all sin revisión
- Mantener los fallback values en los componentes que aún los tienen: `var(--token, #fallback)` → puede simplificarse a `var(--token)` ahora que `tokens.css` está importado
- El comportamiento visual NO debe cambiar — si algo cambia de color, hay un error en el mapeo

**Verificación:** `ng build` + revisión visual del componente

---

### B. Migración a Reactive Forms

**Leer primero:** `docs/design-decisions.md` — "Template-Driven Forms".  
Solo migrar si la tarea lo especifica explícitamente.

**Proceso:**

1. **Mapear el formulario existente:**
   ```
   Campo | ngModel binding | Tipo | Validación actual | Required?
   nombre | this.nombre | text | required="true" | sí
   cedula | this.cedula | text | — | sí
   ...
   ```

2. **Crear FormGroup:**
   ```typescript
   import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

   private fb = inject(FormBuilder);

   form = this.fb.group({
     nombre: ['', Validators.required],
     cedula: ['', Validators.required],
     // ...
   });
   ```

3. **Reemplazar bindings en template:**
   ```html
   <!-- Antes -->
   <input [(ngModel)]="nombre" required>

   <!-- Después -->
   <input formControlName="nombre">
   <!-- El formControlName requiere ReactiveFormsModule + [formGroup]="form" en el padre -->
   ```

4. **Reemplazar acceso a datos:**
   ```typescript
   // Antes
   await service.guardar({ nombre: this.nombre, cedula: this.cedula });

   // Después
   await service.guardar(this.form.value as ClienteForm);
   ```

5. **Reemplazar validación:**
   ```html
   <!-- Antes -->
   @if (f.submitted && !nombre) {
     <span>Campo obligatorio</span>
   }

   <!-- Después -->
   @if (form.get('nombre')?.invalid && form.get('nombre')?.touched) {
     <span>El nombre es obligatorio</span>
   }
   ```

6. **Preservar side effects:**
   - Auto-format de cédula: mantener el `(input)` handler
   - Pre-fill de query params: migrar a `form.patchValue({})` en `ngOnInit`
   - File uploads: mantener la lógica en el handler de `(change)`

7. **Reemplazar submit:**
   ```typescript
   // Antes
   async guardar() {
     if (!this.nombre || !this.cedula) return;
     ...
   }

   // Después
   async guardar() {
     if (this.form.invalid) {
       this.form.markAllAsTouched();
       return;
     }
     ...
   }
   ```

**Verificación:** Todos los estados del formulario: loading, error (preserva datos), success, validación de campos, submit disabled si invalid.

---

### C. Correcciones de accesibilidad

Ver el checklist completo en `.codex/skills/accessibility-qa/SKILL.md` y `docs/accessibility.md`.

**Proceso para añadir `for`/`id` a labels:**
```html
<!-- Encontrar todos los <label> sin for="" y su <input> correspondiente -->
<!-- Añadir id único al input, for al label -->
<!-- Pattern: id = nombre-del-campo en kebab-case -->
<label for="fecha-inicio">Fecha de inicio</label>
<input id="fecha-inicio" type="date" ...>
```

**Proceso para añadir scope a tablas:**
```html
<!-- Añadir scope="col" a todos los <th> -->
<th scope="col">Cliente</th>
<th scope="col">Plan</th>
<!-- Añadir aria-label a la tabla -->
<table aria-label="Lista de membresías">
```

**Proceso para añadir focus ring:**
```css
/* En el bloque de styles del componente */
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  border-color: var(--primary);
  box-shadow: var(--shadow-focus);
  outline: none;
}
```

---

## Constraints estrictos

- **NO** cambiar ninguna lógica de negocio (service calls, data transformations, routing)
- **NO** cambiar ningún selector de componente o ruta
- **NO** cambiar la estructura visual observable para el usuario
- **NO** añadir features que no estaban solicitadas
- **NO** extraer componentes nuevos durante un refactor de tokens (son tareas separadas)
- **SIEMPRE** hacer `ng build` al terminar

## Verificación final

```bash
ng build
```

Debe completar sin errores. Si hay errores de TypeScript, son regresiones del refactor — corregir antes de completar.
