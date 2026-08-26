import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos.service';
import { MovimientoInventario, TipoMovimientoInv } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface ResumenInventario {
  label: string;
  value: string;
  note: string;
}

@Component({
  selector: 'app-productos-inventario',
  imports: [FormsModule, RouterLink, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <p class="eyebrow">Inventario</p>
          <h1>Historial de movimientos</h1>
          <p class="subtitle">Entradas, ajustes y mermas registradas en el almacén.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/productos" class="btn-secondary">Volver a productos</a>
        </div>
      </div>

      <section class="summary-grid" aria-label="Resumen de inventario">
        @for (card of resumen(); track card.label) {
          <article class="card summary-card">
            <span class="summary-label">{{ card.label }}</span>
            <strong class="summary-value">{{ card.value }}</strong>
            <span class="summary-note">{{ card.note }}</span>
          </article>
        }
      </section>

      <section class="card filters">
        <div class="field">
          <label for="buscar-inv">Buscar producto</label>
          <input id="buscar-inv" type="search" placeholder="Nombre del producto…" [ngModel]="termino()" (ngModelChange)="termino.set($event)" name="termino" />
        </div>
        <div class="field">
          <label for="tipo-inv">Tipo</label>
          <select id="tipo-inv" [ngModel]="tipoFiltro()" (ngModelChange)="tipoFiltro.set($event)" name="tipoFiltro">
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="ajuste">Ajuste</option>
            <option value="merma">Merma</option>
          </select>
        </div>
      </section>

      <section class="card">
        <div class="table-wrap">
          <table aria-label="Historial de movimientos de inventario">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Producto</th>
                <th scope="col">Tipo</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Notas</th>
              </tr>
            </thead>
            <tbody>
              @for (mov of movimientosFiltrados(); track mov.id) {
                <tr>
                  <td>{{ formatFecha(mov.fecha) }}</td>
                  <td>
                    <strong>{{ mov.producto?.nombre || 'Producto eliminado' }}</strong>
                    <p class="subline">Stock actual: {{ mov.producto?.stock ?? '—' }}</p>
                  </td>
                  <td>
                    @switch (mov.tipo) {
                      @case ('entrada') { <app-status-badge tone="success" label="Entrada"></app-status-badge> }
                      @case ('ajuste') { <app-status-badge tone="warning" label="Ajuste"></app-status-badge> }
                      @case ('merma') { <app-status-badge tone="danger" label="Merma"></app-status-badge> }
                    }
                  </td>
                  <td>{{ formatCantidad(mov.cantidad, mov.tipo) }}</td>
                  <td>{{ mov.notas || '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">Sin movimientos registrados</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styleUrl: './productos-inventario.component.css',
})
export class ProductosInventarioComponent implements OnInit {
  private readonly service = inject(ProductosService);
  private readonly numberFormat = new Intl.NumberFormat('es-DO');

  readonly movimientos = signal<MovimientoInventario[]>([]);
  readonly termino = signal('');
  readonly tipoFiltro = signal<'' | TipoMovimientoInv>('');

  movimientosFiltrados = computed(() => {
    const term = this.termino().trim().toLowerCase();
    const tipo = this.tipoFiltro();
    return this.movimientos().filter((mov) => {
      const matchTerm = !term || (mov.producto?.nombre ?? '').toLowerCase().includes(term);
      const matchType = !tipo || mov.tipo === tipo;
      return matchTerm && matchType;
    });
  });

  resumen = computed<ResumenInventario[]>(() => {
    const data = this.movimientos();
    const entradas = data.filter((item) => item.tipo === 'entrada').length;
    const ajustes = data.filter((item) => item.tipo === 'ajuste').length;
    const mermas = data.filter((item) => item.tipo === 'merma').length;
    const cantidadNeta = data.reduce((sum, item) => sum + item.cantidad * (item.tipo === 'merma' ? -1 : 1), 0);

    return [
      { label: 'Movimientos', value: this.numberFormat.format(data.length), note: 'Total histórico' },
      { label: 'Entradas', value: this.numberFormat.format(entradas), note: 'Reposiciones' },
      { label: 'Ajustes', value: this.numberFormat.format(ajustes), note: 'Correcciones manuales' },
      { label: 'Mermas', value: this.numberFormat.format(mermas), note: `Variación neta: ${this.numberFormat.format(cantidadNeta)}` },
    ];
  });

  async ngOnInit(): Promise<void> {
    this.movimientos.set(await this.service.obtenerMovimientosInventario());
  }

  formatFecha(value: string): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  formatCantidad(cantidad: number, tipo: TipoMovimientoInv): string {
    const prefix = tipo === 'merma' ? '-' : '+';
    return `${prefix}${this.numberFormat.format(cantidad)}`;
  }
}
