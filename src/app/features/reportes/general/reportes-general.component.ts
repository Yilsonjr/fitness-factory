import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';

@Component({
  selector: 'app-reportes-general',
  imports: [CurrencyDopPipe, SkeletonListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stack">
      @if (loading()) {
        <section class="card loading-card" aria-busy="true" aria-live="polite">
          <app-skeleton-list [items]="[
            { width: '30%', height: '1.4rem' },
            { width: '100%', height: '6rem' },
            { width: '100%', height: '6rem' }
          ]"></app-skeleton-list>
        </section>
      } @else {
        <section class="cards">
          <article class="card stat stat-income"><span>Ingresos membresías</span><strong>{{ resumen().ingresos | currencyDop }}</strong></article>
          <article class="card stat stat-pos"><span>Ventas POS</span><strong>{{ resumen().ventas | currencyDop }}</strong></article>
          <article class="card stat stat-expense"><span>Gastos</span><strong>{{ resumen().gastos | currencyDop }}</strong></article>
          <article class="card stat stat-net"><span>Ganancia neta</span><strong>{{ neto() | currencyDop }}</strong></article>
          <article class="card stat stat-clients"><span>Nuevos clientes</span><strong>{{ resumen().clientes }}</strong></article>
        </section>

        <div class="note">Período: {{ periodo.etiqueta() }}</div>
      }
    </section>
  `,
  styleUrl: './reportes-general.component.css',
})
export class ReportesGeneralComponent {
  loading = signal(true);
  resumen = signal({ ingresos: 0, ventas: 0, gastos: 0, clientes: 0 });

  neto = computed(() => this.resumen().ingresos + this.resumen().ventas - this.resumen().gastos);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    public periodo: ReportPeriodService
  ) {
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

    const [pagos, gastos, ventas, clientes] = await Promise.all([
      this.supabase.client.from('pagos').select('monto').eq('gimnasio_id', gimnasioId).eq('anulado', false).gte('fecha', desde).lte('fecha', hasta + 'T23:59:59'),
      this.supabase.client.from('gastos').select('monto').eq('gimnasio_id', gimnasioId).gte('fecha', desde).lte('fecha', hasta + 'T23:59:59'),
      this.supabase.client.from('ventas').select('total').eq('gimnasio_id', gimnasioId).eq('anulado', false).gte('fecha', desde).lte('fecha', hasta + 'T23:59:59'),
      this.supabase.client.from('clientes').select('id', { count: 'exact', head: true }).eq('gimnasio_id', gimnasioId).gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
    ]);

    const ingresos = ((pagos.data ?? []) as { monto: number }[]).reduce((sum, item) => sum + item.monto, 0);
    const totalGastos = ((gastos.data ?? []) as { monto: number }[]).reduce((sum, item) => sum + item.monto, 0);
    const ventasTotal = ((ventas.data ?? []) as { total: number }[]).reduce((sum, item) => sum + item.total, 0);

    this.resumen.set({
      ingresos,
      ventas: ventasTotal,
      gastos: totalGastos,
      clientes: clientes.count ?? 0,
    });
    this.loading.set(false);
  }
}
