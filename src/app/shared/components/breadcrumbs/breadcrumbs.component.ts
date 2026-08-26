import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length > 0) {
      <nav class="breadcrumbs" aria-label="Migas de pan">
        <ol>
          @for (item of items(); track item.url; let last = $last) {
            <li>
              @if (last) {
                <span aria-current="page">{{ item.label }}</span>
              } @else {
                <a [routerLink]="item.url">{{ item.label }}</a>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: [`
    :host { display: block; }

    .breadcrumbs {
      margin: 0 0 var(--space-4);
      padding: 0 var(--space-4);
    }

    ol {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      list-style: none;
      padding: 0;
      margin: 0;
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }

    li {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    li:not(:last-child)::after {
      content: '/';
      color: var(--text-muted);
    }

    a {
      color: var(--text-secondary);
      text-decoration: none;
    }

    a:hover {
      color: var(--primary);
    }

    a:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
      border-radius: var(--radius-sm);
    }

    [aria-current="page"] {
      color: var(--text-primary);
      font-weight: var(--font-semibold);
    }

    @media (max-width: 768px) {
      .breadcrumbs { padding: 0 var(--space-4); }
    }
  `],
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly _items = signal<BreadcrumbItem[]>([]);
  readonly items = this._items.asReadonly();
  private subscription?: Subscription;

  ngOnInit(): void {
    this.update();
    this.subscription = this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => this.update());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private update(): void {
    this._items.set(this.buildBreadcrumbs(this.router.url));
  }

  private buildBreadcrumbs(url: string): BreadcrumbItem[] {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      const previous = segments[index - 1];
      const next = segments[index + 1];

      if (this.isDynamicId(segment)) {
        if (next === 'editar') {
          items.push({ label: 'Editar', url: '/' + segments.slice(0, index + 2).join('/') });
          index++;
          continue;
        }

        if (next === 'asistencias') {
          items.push({ label: 'Asistencias', url: '/' + segments.slice(0, index + 2).join('/') });
          index++;
          continue;
        }

        items.push({ label: 'Detalle', url: '/' + segments.slice(0, index + 1).join('/') });
        continue;
      }

      if (segment === 'nuevo') {
        items.push({ label: 'Nuevo', url: '/' + segments.slice(0, index + 1).join('/') });
        continue;
      }

      if (segment === 'inventario') {
        items.push({ label: 'Historial inventario', url: '/' + segments.slice(0, index + 1).join('/') });
        continue;
      }

      if (segment === 'asignar' && previous === 'membresias') {
        items.push({ label: 'Asignar membresía', url: '/' + segments.slice(0, index + 1).join('/') });
        continue;
      }

      if (segment === 'cobrar') {
        items.push({ label: 'Cobrar membresía', url: '/' + segments.slice(0, index + 1).join('/') });
        continue;
      }

      if (segment === 'ventas-anuladas') {
        items.push({ label: 'Ventas anuladas', url: '/' + segments.slice(0, index + 1).join('/') });
        continue;
      }

      items.push({ label: this.labelFor(segment), url: '/' + segments.slice(0, index + 1).join('/') });
    }

    return items;
  }

  private labelFor(segment: string): string {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      clientes: 'Clientes',
      membresias: 'Membresías',
      caja: 'Caja',
      pos: 'Punto de Venta',
      productos: 'Productos',
      reportes: 'Reportes',
      configuracion: 'Configuración',
      general: 'General',
      finanzas: 'Finanzas',
      operacion: 'Operación',
      usuarios: 'Usuarios y acceso',
      ventas: 'Ventas',
      anuladas: 'Anuladas',
    };

    return labels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  private isDynamicId(segment: string): boolean {
    return /^[0-9a-f-]{6,}$/i.test(segment);
  }
}
