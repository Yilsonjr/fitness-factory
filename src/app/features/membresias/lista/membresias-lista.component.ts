import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Membresia } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';

type MembresiaVista = Membresia & {
  cliente?: { nombre: string; apellido: string; cedula?: string };
  plan?: { nombre: string; periodo: string; precio: number };
};

@Component({
  selector: 'app-membresias-lista',
  imports: [RouterLink, StatusBadgeComponent, SkeletonListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Membresías</h1>
          <p class="subtitle">Activas, vencidas y por vencer</p>
        </div>
        <a routerLink="/membresias/asignar" class="btn-primary">Asignar membresía</a>
      </div>

      <div class="filters">
        @for (f of filtros; track f.value) {
          <button class="chip" [class.active]="filtro() === f.value" (click)="filtro.set(f.value)">{{ f.label }}</button>
        }
      </div>

      @if (loading()) {
        <div class="card loading-card">
          <app-skeleton-list [items]="[
            { width: '35%', height: '1.4rem' },
            { width: '100%', height: '2.75rem' },
            { width: '100%', height: '2.75rem' },
            { width: '100%', height: '2.75rem' }
          ]"></app-skeleton-list>
        </div>
      } @else {
        <div class="card table-wrap">
          <table aria-label="Lista de membresías">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Plan</th>
                <th scope="col">Inicio</th>
                <th scope="col">Vence</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (m of visibles(); track m.id) {
                <tr>
                  <td>{{ m.cliente?.nombre }} {{ m.cliente?.apellido }}</td>
                  <td>{{ m.plan?.nombre }}</td>
                  <td>{{ m.fecha_inicio }}</td>
                  <td>{{ m.fecha_fin }}</td>
                  <td>
                    @switch (estadoVisual(m)) {
                      @case ('activa') { <app-status-badge tone="success" label="Activa"></app-status-badge> }
                      @case ('por vencer') { <app-status-badge tone="warning" label="Por vencer"></app-status-badge> }
                      @case ('vencida') { <app-status-badge tone="danger" label="Vencida"></app-status-badge> }
                      @case ('congelada') { <app-status-badge tone="frozen" label="Congelada"></app-status-badge> }
                    }
                  </td>
                  <td><a [routerLink]="['/clientes', m.cliente_id]" class="link">Ver cliente</a></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">Sin membresías para mostrar</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    h1 { margin: 0; color: var(--text-primary, #f1f5f9); }
    .subtitle { margin: .25rem 0 0; color: var(--text-secondary, #94a3b8); }
    .filters { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .chip, .btn-primary { border: 0; border-radius: 999px; padding: .65rem .95rem; cursor: pointer; font-weight: 600; text-decoration: none; }
    .chip { background: var(--bg-card, #1e293b); color: var(--text-secondary, #94a3b8); border: 1px solid var(--border, #334155); }
    .chip.active { background: var(--primary-subtle); color: var(--primary, #3b82f6); border-color: var(--primary, #3b82f6); }
    .btn-primary { background: var(--primary, #3b82f6); color: var(--text-on-primary); }
    .card { background: var(--bg-card, #1e293b); border: 1px solid var(--border, #334155); border-radius: 16px; padding: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .8rem .65rem; border-bottom: 1px solid var(--border-muted); color: var(--text-primary, #f1f5f9); text-align: left; }
    th { color: var(--text-secondary, #94a3b8); font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; }
    .empty { color: var(--text-secondary, #94a3b8); text-align: center; padding: 2rem 0; }
    .link { color: var(--primary, #3b82f6); text-decoration: none; }
    .table-wrap { overflow: auto; }
    .loading-card { display: grid; gap: var(--space-3); }
  `],
})
export class MembresiasListaComponent implements OnInit {
  loading = signal(true);
  items = signal<MembresiaVista[]>([]);
  filtro = signal<'todas' | 'activa' | 'vencida' | 'por vencer' | 'congelada'>('todas');
  filtros = [
    { value: 'todas', label: 'Todas' },
    { value: 'activa', label: 'Activas' },
    { value: 'por vencer', label: 'Por vencer' },
    { value: 'vencida', label: 'Vencidas' },
    { value: 'congelada', label: 'Congeladas' },
  ] as const;

  visibles = computed(() => this.items().filter(item => this.filtro() === 'todas' ? true : this.estadoVisual(item) === this.filtro()));

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('membresias')
      .select('*, cliente:clientes(nombre, apellido, cedula), plan:planes(nombre, periodo, precio)')
      .in('estado', ['activa', 'vencida', 'congelada'])
      .order('fecha_inicio', { ascending: false });

    this.items.set((data as MembresiaVista[]) ?? []);
    this.loading.set(false);
  }

  estadoVisual(item: MembresiaVista): 'activa' | 'vencida' | 'por vencer' | 'congelada' {
    if (item.estado === 'congelada') return 'congelada';
    if (item.estado === 'vencida') return 'vencida';
    const fin = new Date(item.fecha_fin);
    const diff = Math.ceil((fin.getTime() - Date.now()) / 86400000);
    if (diff >= 0 && diff <= 7) return 'por vencer';
    return 'activa';
  }
}
