import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

type VentaVista = { id: string; fecha: string; total: number; metodo: string; cliente?: { nombre: string; apellido: string }; detalles?: { cantidad: number; precio_unitario: number; producto?: { nombre: string } }[] };

@Component({
  selector: 'app-reportes-ventas',
  imports: [RouterLink, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stack">
      <div class="header-actions">
        <a routerLink="/reportes/ventas/anuladas" class="btn-secondary">Ventas anuladas</a>
      </div>

      <section class="cards">
        <article class="card stat stat-pos"><span>Ventas</span><strong>{{ ventas().length }}</strong></article>
        <article class="card stat stat-net"><span>Total vendido</span><strong>{{ total() | currencyDop }}</strong></article>
      </section>

      <section class="grid">
        <section class="card">
          <h2>Ventas POS del período</h2>
          <div class="table-wrap">
            <table aria-label="Ventas del período">
              <thead><tr><th scope="col">Fecha</th><th scope="col">Cliente</th><th scope="col">Método</th><th scope="col">Productos</th><th scope="col">Total</th></tr></thead>
              <tbody>
                @for (v of ventas(); track v.id) {
                  <tr><td>{{ formatDate(v.fecha) }}</td><td>{{ v.cliente ? v.cliente.nombre + ' ' + v.cliente.apellido : '—' }}</td><td>{{ v.metodo }}</td><td>{{ v.detalles?.length ?? 0 }}</td><td>{{ v.total | currencyDop }}</td></tr>
                } @empty { <tr><td colspan="5" class="empty">No se registraron ventas en este período.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <h2>Productos más vendidos</h2>
          <div class="table-wrap">
            <table aria-label="Productos más vendidos">
              <thead><tr><th scope="col">Producto</th><th scope="col">Cantidad</th><th scope="col">Total</th></tr></thead>
              <tbody>
                @for (p of topProductos(); track p.nombre) {
                  <tr><td>{{ p.nombre }}</td><td>{{ p.cantidad }}</td><td>{{ p.total | currencyDop }}</td></tr>
                } @empty { <tr><td colspan="3" class="empty">No hay ventas para consolidar.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </section>
  `,
  styleUrl: './reportes-ventas.component.css',
})
export class ReportesVentasComponent {
  ventas = signal<VentaVista[]>([]);
  total = computed(() => this.ventas().reduce((sum, item) => sum + item.total, 0));
  topProductos = computed(() => {
    const map = new Map<string, { nombre: string; cantidad: number; total: number }>();
    for (const venta of this.ventas()) {
      for (const detalle of venta.detalles ?? []) {
        const nombre = detalle.producto?.nombre ?? 'Desconocido';
        const prev = map.get(nombre) ?? { nombre, cantidad: 0, total: 0 };
        map.set(nombre, { nombre, cantidad: prev.cantidad + detalle.cantidad, total: prev.total + detalle.cantidad * detalle.precio_unitario });
      }
    }
    return [...map.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
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
    const { data } = await this.supabase.client
      .from('ventas')
      .select('id,total,metodo,fecha,cliente:clientes(nombre,apellido),detalles:detalles_venta(cantidad,precio_unitario,producto:productos(nombre))')
      .eq('gimnasio_id', gimnasioId)
      .eq('anulado', false)
      .gte('fecha', desde)
      .lte('fecha', hasta + 'T23:59:59')
      .order('fecha', { ascending: false });

    this.ventas.set(((data ?? []) as unknown) as VentaVista[]);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value));
  }
}
