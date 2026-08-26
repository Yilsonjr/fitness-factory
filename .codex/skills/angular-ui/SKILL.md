# Skill: Angular UI — Fitness Factory

**Activar cuando:** Se crea o modifica cualquier componente Angular con UI.

Stack: Angular 21.1.0, standalone components, signals, OnPush, CSS puro.

---

## Scaffold de componente página

Template base para nuevas feature pages. Adaptar según el contenido.

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
// Para formularios nuevos:
// import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-[feature]-[vista]',
  // NO declarar standalone: true — es el default en Angular 21
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Título en Español</h1>
          <p class="subtitle">Descripción de la sección</p>
        </div>
        <button class="btn-primary" (click)="accionPrimaria()">
          Acción Principal
        </button>
      </div>

      @if (loading()) {
        <p class="loading-text">Cargando...</p>
      } @else if (items().length === 0) {
        <p class="empty-text">No hay elementos que mostrar.</p>
      } @else {
        <!-- Contenido principal -->
      }

      @if (error()) {
        <div class="banner-error" role="alert">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      max-width: var(--content-max);
      margin: 0 auto;
      padding: var(--space-6) var(--space-4);
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
    }

    h1 {
      font-size: var(--text-5xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: var(--text-md);
      margin: var(--space-1) 0 0;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-5);
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      cursor: pointer;
      transition: var(--transition-fast);
      white-space: nowrap;
    }

    .btn-primary:hover { background: var(--primary-hover); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .loading-text, .empty-text {
      color: var(--text-secondary);
      text-align: center;
      padding: var(--space-8) var(--space-4);
      font-size: var(--text-base);
    }

    .banner-error {
      background: var(--color-danger-banner);
      border: 1px solid var(--color-danger-subtle);
      border-radius: var(--radius-md);
      color: var(--color-danger-text);
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-4);
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; }
      .btn-primary { width: 100%; }
    }
  `],
})
export class [Feature][Vista]Component implements OnInit {
  private service = inject(ServiceName);

  // Estado
  loading = signal(false);
  error = signal<string | null>(null);

  // Datos
  private _items = signal<Item[]>([]);
  items = this._items.asReadonly();

  // Estado derivado
  itemsFiltrados = computed(() => this._items().filter(...));

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await this.service.obtener();
    if (error) {
      this.error.set('No se pudo cargar la información. Intenta de nuevo.');
    } else {
      this._items.set(data ?? []);
    }
    this.loading.set(false);
  }

  async accionPrimaria() {
    // ...
  }
}
```

---

## Reglas Angular para este proyecto

### Componentes

```typescript
// ✅ Correcto
@Component({
  selector: 'app-mi-componente',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
  styles: [`...`],
})

// ❌ Incorrecto
@Component({
  selector: 'app-mi-componente',
  standalone: true, // no poner — es el default
  changeDetection: ChangeDetectionStrategy.Default, // siempre OnPush
  templateUrl: './mi-componente.html', // preferir inline
})
```

### Signals

```typescript
// Estado mutable
private _datos = signal<Dato[]>([]);
datos = this._datos.asReadonly();  // Exponer readonly

// Estado derivado
filtrados = computed(() => this._datos().filter(d => d.activo));

// Modificar
this._datos.set([]);           // Reemplazar
this._datos.update(d => [...d, nuevo]);  // Derivar de anterior

// ❌ NUNCA
this._datos.mutate(d => d.push(nuevo)); // mutate está deprecado
```

### Inject

```typescript
// ✅ Correcto
private service = inject(MiService);
private router = inject(Router);
private route = inject(ActivatedRoute);
private fb = inject(FormBuilder);

// ❌ Incorrecto
constructor(private service: MiService) {}
```

### Control flow

```html
<!-- ✅ Correcto (Angular 17+ native control flow) -->
@if (loading()) {
  <p>Cargando...</p>
} @else if (items().length === 0) {
  <p>Sin resultados</p>
} @else {
  @for (item of items(); track item.id) {
    <div>{{ item.nombre }}</div>
  }
}

<!-- ❌ Incorrecto -->
<p *ngIf="loading()">Cargando...</p>
<div *ngFor="let item of items()">{{ item.nombre }}</div>
```

### Class y Style bindings

```html
<!-- ✅ Correcto -->
<div [class.activo]="esActivo()" [class.error]="tieneError()">
<div [style.color]="colorActual()">

<!-- ❌ Incorrecto -->
<div [ngClass]="{ activo: esActivo() }">
<div [ngStyle]="{ color: colorActual() }">
```

### Host bindings

```typescript
// ✅ Correcto — en el objeto host del decorator
@Component({
  host: {
    'class': 'mi-componente',
    '[class.active]': 'isActive()',
    '(click)': 'onClick()',
  }
})

// ❌ Incorrecto — decoradores @HostBinding y @HostListener
@HostBinding('class.active') get isActive() { ... }
@HostListener('click') onClick() { ... }
```

---

## Reactive Forms (solo para formularios nuevos)

```typescript
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { inject } from '@angular/core';

private fb = inject(FormBuilder);

form = this.fb.group({
  nombre:   ['', [Validators.required, Validators.minLength(2)]],
  cedula:   ['', Validators.required],
  email:    ['', [Validators.email]],
  monto:    [null as number | null, [Validators.required, Validators.min(1)]],
});

// Acceder a un control
get nombreControl(): AbstractControl { return this.form.get('nombre')!; }

// En template:
// <input formControlName="nombre" [attr.aria-invalid]="nombreControl.invalid && nombreControl.touched">
// @if (nombreControl.invalid && nombreControl.touched) { <span role="alert">...</span> }

// Submit
async guardar() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  const datos = this.form.value;
  // ...
}
```

---

## Ruta nueva (lazy loading)

En `src/app/app.routes.ts`, dentro del array de children de `LayoutComponent`:

```typescript
{
  path: 'mi-feature',
  loadComponent: () =>
    import('./features/mi-feature/lista/mi-feature.component')
      .then(m => m.MiFeatureComponent),
},
```

Con guard:
```typescript
{
  path: 'admin-only',
  canActivate: [adminGuard],
  loadComponent: () =>
    import('./features/admin-only/admin-only.component')
      .then(m => m.AdminOnlyComponent),
},
```

---

## CSS — Reglas específicas

```css
/* ✅ Solo tokens — nunca hex ni valores raw sin token */
background: var(--bg-card);
border-radius: var(--radius-card);
color: var(--text-primary);
font-size: var(--text-base);
padding: var(--space-4);
transition: var(--transition-fast);

/* ❌ Incorrecto */
background: #1e293b;
border-radius: 16px;
color: #f1f5f9;
font-size: 0.9rem;
padding: 1rem;
transition: all 0.2s;
```

```css
/* Card pattern */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: var(--space-4);
}

/* Form input pattern */
input, select, textarea {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-input);
  color: var(--text-primary);
  font-size: var(--text-base);
  padding: 0.8rem var(--space-3);
  width: 100%;
  box-sizing: border-box;
}

input:focus-visible, select:focus-visible, textarea:focus-visible {
  border-color: var(--primary);
  box-shadow: var(--shadow-focus);
  outline: none;
}
```

---

## Checklist antes de hacer PR

- [ ] Selector: `app-[feature]-[vista]`
- [ ] No `standalone: true` en el decorator
- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] Signals para estado, `computed()` para derivados
- [ ] `inject()` para servicios (no constructor)
- [ ] Control flow nativo (`@if`, `@for`)
- [ ] No `ngClass` ni `ngStyle`
- [ ] No `@HostBinding` ni `@HostListener`
- [ ] CSS: solo tokens, sin hex hardcodeados
- [ ] `@media (max-width: 768px)` block si es página
- [ ] Al menos un `<h1>` con `font-size: var(--text-5xl)`
- [ ] Labels con `for`/`id` si tiene formulario
- [ ] Focus ring en inputs si tiene formulario
- [ ] `ng build` pasa sin errores
