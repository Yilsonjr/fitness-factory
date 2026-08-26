import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { MembresiasService } from '../../../core/services/membresias.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

type MembresiaVista = { id: string; fecha_fin: string; estado: string; precio_pagado: number; cliente?: { nombre: string; apellido: string }; plan?: { nombre: string } };

@Component({
  selector: 'app-reportes-membresias',
  standalone: true,
  imports: [StatusBadgeComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stack">
      <section class="cards">
        <article class="card stat stat-success"><span>Activas</span><strong>{{ estados().activas }}</strong></article>
        <article class="card stat stat-warning"><span>Por vencer</span><strong>{{ estados().porVencer }}</strong></article>
        <article class="card stat stat-danger"><span>Vencidas</span><strong>{{ estados().vencidas }}</strong></article>
        <article class="card stat"><span>Nuevas en período</span><strong>{{ nuevasEnPeriodo() }}</strong></article>
      </section>

      <section class="card">
        <h2>Membresías próximas a vencer</h2>
        <div class="table-wrap">
          <table aria-label="Membresías próximas a vencer">
            <thead><tr><th scope="col">Cliente</th><th scope="col">Plan</th><th scope="col">Vence</th><th scope="col">Estado</th><th scope="col">Pagado</th></tr></thead>
            <tbody>
              @for (m of proximas(); track m.id) {
                <tr>
                  <td>{{ m.cliente?.nombre }} {{ m.cliente?.apellido }}</td>
                  <td>{{ m.plan?.nombre }}</td>
                  <td>{{ formatDate(m.fecha_fin) }}</td>
                  <td>
                    @if (m.estado === 'activa') { <app-status-badge tone="success" label="Activa"></app-status-badge> }
                    @else { <app-status-badge tone="neutral" [label]="m.estado"></app-status-badge> }
                  </td>
                  <td>{{ m.precio_pagado | currencyDop }}</td>
                </tr>
              } @empty { <tr><td colspan="5" class="empty">No hay membresías próximas a vencer.</td></tr> }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
  styleUrl: './reportes-membresias.component.css',
})
export class ReportesMembresiasComponent {
  proximas = signal<MembresiaVista[]>([]);
  estados = signal({ activas: 0, vencidas: 0, porVencer: 0 });
  nuevasEnPeriodo = signal(0);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private membresias: MembresiasService,
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
    const [estados, proximas, nuevas] = await Promise.all([
      this.membresias.contarPorEstado(),
      this.supabase.client.from('membresias').select('id,fecha_fin,estado,precio_pagado,cliente:clientes(nombre,apellido),plan:planes(nombre)').eq('gimnasio_id', gimnasioId).eq('estado', 'activa').gte('fecha_fin', todayISO()).lte('fecha_fin', plusDaysISO(7)).order('fecha_fin', { ascending: true }),
      this.supabase.client.from('membresias').select('id', { count: 'exact', head: true }).eq('gimnasio_id', gimnasioId).gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
    ]);

    this.estados.set(estados);
    this.proximas.set(((proximas.data ?? []) as unknown) as MembresiaVista[]);
    this.nuevasEnPeriodo.set(nuevas.count ?? 0);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value));
  }
}

function todayISO(): string { return new Date().toISOString().split('T')[0]; }
function plusDaysISO(days: number): string { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().split('T')[0]; }
