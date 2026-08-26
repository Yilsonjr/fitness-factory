# AGENTS.md — Fitness Factory

Guía de ingeniería y diseño para agentes de código (Codex, Claude Code, etc.).
Leer este archivo completo antes de modificar cualquier componente.

---

## 1. Product Identity

**Fitness Factory** es un sistema de gestión de gimnasio orientado a operaciones diarias del personal en República Dominicana. Es una herramienta interna (staff-facing), no un portal público.

**Leer antes de cualquier tarea de UI:**
- `docs/product.md` — qué es el producto, sus usuarios, sus flujos críticos
- `design.md` — reglas visuales del sistema
- `docs/ux-principles.md` — por qué la interfaz está diseñada así
- `src/styles/tokens.css` — tokens CSS que deben usarse siempre

---

## 2. TypeScript Best Practices

- Usar strict type checking
- Preferir inferencia de tipos cuando el tipo es obvio
- Nunca usar `any`; usar `unknown` cuando el tipo es incierto

---

## 3. Angular Best Practices

- Siempre usar standalone components (default en Angular v20+)
- **NO** declarar `standalone: true` en el decorator — ya es el default
- Usar signals para state management
- Implementar lazy loading para todas las feature routes
- **NO** usar `@HostBinding` ni `@HostListener` — usar el objeto `host` en `@Component`
- Usar `NgOptimizedImage` para imágenes estáticas (no funciona con base64 inline)
- Prefijo de selector: `app-` para todos los componentes
- Estructura de archivos:
  - Features: `src/app/features/<dominio>/<vista>/component.ts`
  - Shared: `src/app/shared/components/<nombre>/component.ts`
  - Services: `src/app/core/services/<nombre>.service.ts`

### Components

- Mantener componentes pequeños, con una sola responsabilidad
- Usar `input()` y `output()` en lugar de decoradores `@Input()` / `@Output()`
- Usar `computed()` para estado derivado
- Usar `changeDetection: ChangeDetectionStrategy.OnPush` siempre
- Preferir templates y styles inline para componentes pequeños y medianos
- **NO** usar `ngClass` — usar bindings de `class` (`[class.active]="condition"`)
- **NO** usar `ngStyle` — usar bindings de `style` (`[style.color]="value"`)
- Cuando se usen templates/styles externos, usar paths relativos al archivo TS

---

## 4. Forms — Regla crítica con excepción documentada

**Política nueva:** Los formularios nuevos deben usar **Reactive Forms** (`ReactiveFormsModule`, `FormBuilder`, `Validators`).

**Excepción documentada:** Todos los formularios existentes usan template-driven forms (`FormsModule`, `[(ngModel)]`). Esta inconsistencia con la política está registrada en `docs/design-decisions.md`. **NO refactorizar los formularios existentes** a menos que esa sea la tarea explícita. Solo añadir Reactive forms en formularios nuevos.

Ver `.codex/skills/frontend-refactor/SKILL.md` para el proceso de migración cuando se solicite.

---

## 5. CSS / Tokens — Regla más importante de UI

### SIEMPRE usar design tokens

**Ningún valor visual debe estar hardcodeado en componentes.**

```css
/* ✅ Correcto */
color: var(--text-primary);
background: var(--color-success-subtle);
border-radius: var(--radius-card);

/* ❌ Incorrecto */
color: #f1f5f9;
background: rgba(34, 197, 94, 0.15);
border-radius: 16px;
```

Todos los tokens están en `src/styles/tokens.css`. Si el valor que necesitas no existe como token, revisar si puede mapearse a un token existente antes de añadir uno nuevo.

### Tokens más usados

| Superficie | Token de fondo | Token de borde |
|-----------|---------------|----------------|
| Página | `--bg-primary` | — |
| Card | `--bg-card` | `--border` |
| Modal / Dropdown | `--bg-elevated` | `--border` |
| Inputs | `--bg-input` | `--border` |

| Estado | Fondo badge | Texto badge |
|--------|------------|------------|
| Activa / success | `--color-success-subtle` | `--color-success-text` |
| Por vencer / warning | `--color-warning-subtle` | `--color-warning-text` |
| Vencida / danger | `--color-danger-subtle` | `--color-danger-text` |
| Congelada / frozen | `--color-frozen-subtle` | `--color-frozen-text` |
| Sin membresía | `--color-neutral-subtle` | `--text-secondary` |

| Superficie | Radius token |
|-----------|-------------|
| Cards | `--radius-card` (16px) |
| Form inputs | `--radius-input` (10px) |
| Botones estándar | `--radius-md` (8px) |
| Botones pequeños / icon buttons | `--radius-sm` (6px) |
| Pills, chips, avatars | `--radius-full` (999px) |
| Íconos de stat cards | `--radius-lg` (12px) |
| Avatar grande | `--radius-xl` (24px) |

### Heading canónico

Todos los `<h1>` de página usan `--text-5xl` (1.75rem):

```css
h1 {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}
```

Los `<h2>` de sección dentro de cards usan `--text-xl` (1.1rem).

### Transiciones

```css
/* Hover states */
transition: var(--transition-fast);

/* Layout (sidebar collapse) */
transition: var(--transition-layout);
```

### Breakpoint único

Solo existe un breakpoint: `@media (max-width: 768px)`.

### CSS framework

NO Tailwind. NO Angular Material. NO Bootstrap. Solo CSS puro con variables.

### Iconos

SVG inline, stroke-based, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`. Tamaños: 16-28px. Ver `design.md` para reglas completas.

### Moneda

Siempre DOP con formato `es-DO`:
```typescript
new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(monto)
// → "RD$ 1,500.00"
```

---

## 6. Accessibility

- Debe pasar todos los checks de AXE
- Cumplir WCAG 2.1 AA como mínimo
- Gestión de foco, contraste de color, atributos ARIA

Ver `docs/accessibility.md` para requisitos completos y checklist.

---

## 7. State Management

- Usar signals para estado local del componente
- Usar `computed()` para estado derivado
- Mantener transformaciones de estado puras y predecibles
- **NO** usar `mutate()` en signals — usar `update()` o `set()`

```typescript
// Patrón correcto
private _clientes = signal<Cliente[]>([]);
clientes = this._clientes.asReadonly();
loading = signal(false);
filtrados = computed(() => this._clientes().filter(...));
```

---

## 8. Templates

- Usar control flow nativo (`@if`, `@for`, `@switch`) en lugar de directivas estructurales (`*ngIf`, `*ngFor`)
- Usar el async pipe para manejar observables
- No asumir globals como `new Date()` — acceder solo a través de métodos del componente
- No escribir arrow functions en templates (no están soportadas)
- Idioma de la interfaz: **español** exclusivamente

---

## 9. Services

- Un servicio, una responsabilidad
- Usar `providedIn: 'root'` para servicios singleton
- Usar `inject()` en lugar de constructor injection

```typescript
// Correcto
private service = inject(ClientesService);

// Incorrecto
constructor(private service: ClientesService) {}
```

---

## 10. Design System

Antes de implementar cualquier UI significativa, consultar:

| Documento | Uso |
|-----------|-----|
| `docs/product.md` | Contexto del producto, usuarios, flujos críticos |
| `design.md` | Reglas visuales, tokens, patrones de componentes |
| `docs/components.md` | Catálogo de componentes existentes — buscar aquí antes de crear uno nuevo |
| `docs/ux-principles.md` | Por qué la interfaz está diseñada así (densidad, workflows, etc.) |
| `docs/accessibility.md` | Checklist WCAG AA |
| `docs/codex-workflows.md` | Prompts operativos para tareas comunes |
| `.codex/skills/` | Skills especializadas para diseño, QA, refactor |

---

## 11. Anti-patterns a evitar

### Visuales
- Hex hardcodeados en componentes → usar tokens
- Gradientes morado/azul, glassmorphism, glow effects → no aplican a este producto
- Cards dentro de cards → revisar si se necesita el container exterior
- Badges innecesarios → solo cuando el estado es ambiguo sin ellos
- Exceso de iconos decorativos → cada ícono debe ayudar a reconocer, localizar o actuar

### Código
- Template-driven forms para formularios nuevos → usar Reactive forms
- `ngClass` / `ngStyle` → usar bindings de clase/estilo
- `constructor(private x = inject(...))` → separar `private x = inject(...)` como propiedad
- `signal.mutate()` → usar `signal.update()` o `signal.set()`

### Producto
- UI en inglés → todo en español
- Montos sin formato DOP → usar `Intl.NumberFormat`
- Dashboards genéricos → las 4 métricas del dashboard (activas, por vencer, vencidas, ingresos) son operativas, no decorativas

---

## 12. Scaffold de componente página

Template base para nuevas páginas de feature:

```typescript
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-[feature]-[vista]',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Título en Español</h1>
          <p class="subtitle">Descripción breve</p>
        </div>
        <!-- Botón de acción primaria si aplica -->
      </div>
      <!-- Contenido -->
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: var(--content-max); margin: 0 auto; padding: var(--space-6) var(--space-4); }
    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-6);
      flex-wrap: wrap; gap: var(--space-4);
    }
    h1 { font-size: var(--text-5xl); font-weight: var(--font-bold); color: var(--text-primary); margin: 0; }
    .subtitle { color: var(--text-secondary); font-size: var(--text-md); margin: var(--space-1) 0 0; }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; }
    }
  `],
})
export class [Feature][Vista]Component {
  // Servicios
  private service = inject(ServiceName);

  // Estado
  loading = signal(false);

  // Estado derivado
  items = computed(() => this.service.items());
}
```
