import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { Venta } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

@Component({
  selector: 'app-ventas-anuladas',
  imports: [RouterLink, StatusBadgeComponent, SkeletonListComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <p class="eyebrow">Auditoría</p>
          <h1>Ventas anuladas</h1>
          <p class="subtitle">Registro de ventas revertidas y sus motivos.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/reportes/ventas" class="btn-secondary">Volver a ventas</a>
        </div>
      </div>

      @if (loading()) {
        <section class="card loading-card" aria-busy="true" aria-live="polite">
          <app-skeleton-list [items]="[
            { width: '28%', height: '1.5rem' },
            { width: '100%', height: '4rem' },
            { width: '100%', height: '4rem' },
            { width: '100%', height: '4rem' }
          ]"></app-skeleton-list>
        </section>
      } @else {
        <section class="cards">
          <article class="card stat">
            <span>Ventas anuladas</span>
            <strong>{{ ventas().length }}</strong>
          </article>
          <article class="card stat">
            <span>Monto revertido</span>
            <strong>{{ totalAnulado() | currencyDop }}</strong>
          </article>
        </section>

        <section class="card">
          <div class="table-wrap">
            <table aria-label="Ventas anuladas">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Total</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (venta of ventas(); track venta.id) {
                  <tr>
                    <td>{{ formatFechaHora(venta.fecha) }}</td>
                    <td>{{ venta.cliente ? venta.cliente.nombre + ' ' + venta.cliente.apellido : '—' }}</td>
                    <td>{{ venta.total | currencyDop }}</td>
                    <td>{{ venta.motivo_anulacion || '—' }}</td>
                    <td><app-status-badge tone="danger" label="Anulada"></app-status-badge></td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty">Sin ventas anuladas</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './ventas-anuladas.component.css',
})
export class VentasAnuladasComponent {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly periodo = inject(ReportPeriodService);
  readonly loading = signal(true);
  readonly ventas = signal<Venta[]>([]);

  totalAnulado = computed(() => this.ventas().reduce((sum, venta) => sum + venta.total, 0));

  constructor() {
    effect(() => {
      this.periodo.desde();
      this.periodo.hasta();
      this.periodo.revision();
      void this.cargar();
    });
  }

  async cargar(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const desde = this.periodo.desde();
    const hasta = this.periodo.hasta();

    const { data } = await this.supabase.client
      .from('ventas')
      .select('*, cliente:clientes(nombre, apellido), detalles:detalles_venta(*, producto:productos(nombre, precio))')
      .eq('gimnasio_id', gimnasioId)
      .eq('anulado', true)
      .gte('fecha', desde)
      .lte('fecha', hasta + 'T23:59:59')
      .order('created_at', { ascending: false });

    this.ventas.set((data as Venta[]) ?? []);
    this.loading.set(false);
  }

  formatFechaHora(value: string): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
}
