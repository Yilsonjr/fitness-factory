import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../../core/services/clientes.service';
import { Cliente } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';

@Component({
  selector: 'app-clientes-lista',
  imports: [RouterLink, FormsModule, StatusBadgeComponent, SkeletonListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Clientes</h1>
          <p class="subtitle">{{ clientesFiltrados().length }} clientes registrados</p>
        </div>
        <a routerLink="/clientes/nuevo" class="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo cliente
        </a>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <label for="cl-busqueda" class="sr-only">Buscar clientes</label>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="cl-busqueda"
          type="text"
          [ngModel]="busqueda()"
          (ngModelChange)="busqueda.set($event)"
          placeholder="Buscar por nombre, cédula o teléfono..."
        />
      </div>

      <!-- Filtros -->
      <div class="filters">
        <button 
          class="filter-btn" 
          [class.active]="filtro() === 'todos'"
          (click)="filtro.set('todos')"
        >Todos</button>
        <button 
          class="filter-btn" 
          [class.active]="filtro() === 'activos'"
          (click)="filtro.set('activos')"
        >Con membresía</button>
        <button 
          class="filter-btn" 
          [class.active]="filtro() === 'vencidos'"
          (click)="filtro.set('vencidos')"
        >Sin membresía</button>
      </div>

      <!-- Loading -->
      @if (clientes.loading()) {
        <div class="loading-card">
          <app-skeleton-list [items]="[
            { width: '46%', height: '1.4rem' },
            { width: '100%', height: '3.2rem' },
            { width: '100%', height: '3.2rem' },
            { width: '100%', height: '3.2rem' }
          ]"></app-skeleton-list>
        </div>
      }

      <!-- Tabla -->
      @if (!clientes.loading()) {
        <div class="table-container">
          <table aria-label="Lista de clientes">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Cédula</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Membresía</th>
                <th scope="col">Vence</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (cliente of clientesFiltrados(); track cliente.id) {
                <tr>
                  <td>
                    <div class="cliente-cell">
                      <div class="avatar">
                        @if (cliente.foto_url) {
                          <img [src]="cliente.foto_url" [alt]="cliente.nombre" />
                        } @else {
                          {{ cliente.nombre.charAt(0) }}{{ cliente.apellido.charAt(0) }}
                        }
                      </div>
                      <div>
                        <span class="nombre">{{ cliente.nombre }} {{ cliente.apellido }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ cliente.cedula || '—' }}</td>
                  <td>{{ cliente.telefono || '—' }}</td>
                  <td>
                    @if (cliente.membresia_activa) {
                      <app-status-badge tone="success" [label]="cliente.membresia_activa.plan?.nombre || 'Activa'"></app-status-badge>
                    } @else {
                      <app-status-badge tone="neutral" label="Sin membresía"></app-status-badge>
                    }
                  </td>
                  <td>
                    @if (cliente.membresia_activa) {
                      <span [class.vencimiento-pronto]="estaProximoAVencer(cliente)">
                        {{ cliente.membresia_activa.fecha_fin }}
                      </span>
                    } @else {
                      —
                    }
                  </td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/clientes', cliente.id]" class="btn-icon" [attr.aria-label]="'Ver detalle de ' + cliente.nombre + ' ' + cliente.apellido">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </a>
                      <a [routerLink]="['/clientes', cliente.id, 'editar']" class="btn-icon" [attr.aria-label]="'Editar ' + cliente.nombre + ' ' + cliente.apellido">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">
                    No se encontraron clientes
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin: 0.25rem 0 0;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      background: var(--primary);
      color: var(--text-on-primary);
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-primary:hover { background: var(--primary-hover); }

    /* Search */
    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.65rem 1rem;
      margin-bottom: 1rem;
      color: var(--text-secondary);
    }

    .search-bar input {
      flex: 1;
      background: none;
      border: 1px solid transparent;
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
    }

    .search-bar input:focus-visible {
      border-color: var(--primary);
      box-shadow: var(--shadow-focus);
      outline: none;
    }

    .search-bar input::placeholder {
      color: var(--text-muted);
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .filter-btn {
      padding: 0.45rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-secondary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: var(--transition-fast);
    }

    .filter-btn.active {
      background: var(--primary-subtle);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* Table */
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 0.85rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 0.85rem 1rem;
      font-size: 0.9rem;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-muted);
    }

    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg-row-hover); }

    /* Cliente cell */
    .cliente-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--text-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
      overflow: hidden;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .nombre { font-weight: 500; }

    /* Badge */
    .vencimiento-pronto { color: var(--color-warning-text); }

    /* Actions */
    .actions { display: flex; gap: 0.5rem; }

    .btn-icon {
      padding: 0.4rem;
      border-radius: 6px;
      color: var(--text-secondary);
      transition: var(--transition-fast);
      cursor: pointer;
    }

    .btn-icon:hover {
      color: var(--primary);
      background: var(--primary-subtle);
    }

    .empty {
      text-align: center;
      color: var(--text-secondary);
      padding: 3rem 1rem !important;
    }

    .loading-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: var(--space-4); }
    .loading-card { display: grid; gap: var(--space-3); }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 768px) {
      th:nth-child(3), td:nth-child(3),
      th:nth-child(5), td:nth-child(5) {
        display: none;
      }
    }
  `],
})
export class ClientesListaComponent implements OnInit {
  busqueda = signal('');
  filtro = signal<'todos' | 'activos' | 'vencidos'>('todos');

  clientesFiltrados = computed(() => {
    let lista = this.clientes.clientes();

    // Filtro por búsqueda
    if (this.busqueda().trim()) {
      const term = this.busqueda().toLowerCase();
      lista = lista.filter(c =>
        c.nombre.toLowerCase().includes(term) ||
        c.apellido.toLowerCase().includes(term) ||
        c.cedula?.includes(term) ||
        c.telefono?.includes(term)
      );
    }

    // Filtro por estado de membresía
    const f = this.filtro();
    if (f === 'activos') {
      lista = lista.filter(c => c.membresia_activa);
    } else if (f === 'vencidos') {
      lista = lista.filter(c => !c.membresia_activa);
    }

    return lista;
  });

  constructor(public clientes: ClientesService) {}

  async ngOnInit() {
    await this.clientes.cargar();
  }

  estaProximoAVencer(cliente: Cliente): boolean {
    if (!cliente.membresia_activa?.fecha_fin) return false;
    const fin = new Date(cliente.membresia_activa.fecha_fin);
    const hoy = new Date();
    const diff = (fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= 0;
  }
}
