import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

type TurnoVista = { id: string; monto_apertura: number; monto_cierre?: number; estado: string; fecha_apertura: string; fecha_cierre?: string; notas_cierre?: string; usuario?: { nombre: string } };

@Component({
  selector: 'app-reportes-caja',
  imports: [CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stack">
      <section class="cards">
        <article class="card stat stat-open"><span>Turnos abiertos</span><strong>{{ abiertos() }}</strong></article>
        <article class="card stat stat-close"><span>Turnos cerrados</span><strong>{{ cerrados() }}</strong></article>
        <article class="card stat stat-net"><span>Monto apertura</span><strong>{{ aperturaTotal() | currencyDop }}</strong></article>
      </section>

      <section class="card">
        <h2>Turnos del período</h2>
        <div class="table-wrap">
          <table aria-label="Turnos del período">
            <thead><tr><th scope="col">Fecha apertura</th><th scope="col">Usuario</th><th scope="col">Estado</th><th scope="col">Apertura</th><th scope="col">Cierre</th></tr></thead>
            <tbody>
              @for (turno of turnos(); track turno.id) {
                <tr>
                  <td>{{ formatDate(turno.fecha_apertura) }}</td>
                  <td>{{ turno.usuario?.nombre || '—' }}</td>
                  <td>{{ turno.estado }}</td>
                  <td>{{ turno.monto_apertura | currencyDop }}</td>
                  <td>{{ turno.monto_cierre ? (turno.monto_cierre | currencyDop) : '—' }}</td>
                </tr>
              } @empty { <tr><td colspan="5" class="empty">No hay turnos en este período.</td></tr> }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
  styleUrl: './reportes-caja.component.css',
})
export class ReportesCajaComponent {
  turnos = signal<TurnoVista[]>([]);
  abiertos = computed(() => this.turnos().filter((t) => t.estado === 'abierto').length);
  cerrados = computed(() => this.turnos().filter((t) => t.estado === 'cerrado').length);
  aperturaTotal = computed(() => this.turnos().reduce((sum, item) => sum + item.monto_apertura, 0));

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
    const { data } = await this.supabase.client
      .from('turnos_caja')
      .select('id,monto_apertura,monto_cierre,estado,fecha_apertura,fecha_cierre,notas_cierre,usuario:usuarios(nombre)')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_apertura', desde)
      .lte('fecha_apertura', hasta + 'T23:59:59')
      .order('fecha_apertura', { ascending: false });

    this.turnos.set(((data ?? []) as unknown) as TurnoVista[]);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value));
  }
}
