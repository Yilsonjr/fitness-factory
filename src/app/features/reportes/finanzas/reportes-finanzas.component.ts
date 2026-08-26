import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

type Movimiento = { fecha: string; monto: number; concepto?: string; metodo?: string };

@Component({
  selector: 'app-reportes-finanzas',
  imports: [CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stack">
      <section class="cards">
        <article class="card stat stat-income"><span>Ingresos</span><strong>{{ ingresos() | currencyDop }}</strong></article>
        <article class="card stat stat-expense"><span>Gastos</span><strong>{{ gastos() | currencyDop }}</strong></article>
        <article class="card stat stat-net"><span>Ganancia</span><strong>{{ ganancia() | currencyDop }}</strong></article>
      </section>

      <section class="card">
        <h2>Métodos de pago</h2>
        <div class="methods">
          @for (item of metodos(); track item.metodo) {
            <div class="method-row"><span>{{ item.metodo }}</span><strong>{{ item.total | currencyDop }}</strong></div>
          }
        </div>
      </section>

      <section class="grid">
        <section class="card">
          <h2>Pagos</h2>
          <div class="table-wrap">
            <table aria-label="Pagos del período">
              <thead><tr><th scope="col">Fecha</th><th scope="col">Concepto</th><th scope="col">Método</th><th scope="col">Monto</th></tr></thead>
              <tbody>
                @for (p of pagos(); track p.fecha + p.monto + p.concepto) {
                  <tr><td>{{ formatDate(p.fecha) }}</td><td>{{ p.concepto || '—' }}</td><td>{{ p.metodo || '—' }}</td><td>{{ p.monto | currencyDop }}</td></tr>
                } @empty { <tr><td colspan="4" class="empty">No se registraron pagos en este período.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <h2>Gastos</h2>
          <div class="table-wrap">
            <table aria-label="Gastos del período">
              <thead><tr><th scope="col">Fecha</th><th scope="col">Concepto</th><th scope="col">Monto</th></tr></thead>
              <tbody>
                @for (g of gastosList(); track g.fecha + g.monto + g.concepto) {
                  <tr><td>{{ formatDate(g.fecha) }}</td><td>{{ g.concepto || '—' }}</td><td>{{ g.monto | currencyDop }}</td></tr>
                } @empty { <tr><td colspan="3" class="empty">No se registraron gastos en este período.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </section>
  `,
  styleUrl: './reportes-finanzas.component.css',
})
export class ReportesFinanzasComponent {
  pagos = signal<Movimiento[]>([]);
  gastosList = signal<Movimiento[]>([]);

  ingresos = computed(() => this.pagos().reduce((sum, item) => sum + item.monto, 0));
  gastos = computed(() => this.gastosList().reduce((sum, item) => sum + item.monto, 0));
  ganancia = computed(() => this.ingresos() - this.gastos());
  metodos = computed(() => {
    const map = new Map<string, number>();
    for (const pago of this.pagos()) {
      const key = pago.metodo ?? 'desconocido';
      map.set(key, (map.get(key) ?? 0) + pago.monto);
    }
    return [...map.entries()].map(([metodo, total]) => ({ metodo, total }));
  });

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
    if (!gimnasioId) return;

    const desde = this.periodo.desde();
    const hasta = this.periodo.hasta();
    const [pagos, gastos] = await Promise.all([
      this.supabase.client.from('pagos').select('fecha,monto,concepto,metodo').eq('gimnasio_id', gimnasioId).eq('anulado', false).gte('fecha', desde).lte('fecha', hasta + 'T23:59:59').order('fecha', { ascending: false }),
      this.supabase.client.from('gastos').select('fecha,monto,concepto').eq('gimnasio_id', gimnasioId).gte('fecha', desde).lte('fecha', hasta + 'T23:59:59').order('fecha', { ascending: false }),
    ]);

    this.pagos.set((pagos.data as Movimiento[]) ?? []);
    this.gastosList.set((gastos.data as Movimiento[]) ?? []);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value));
  }
}
