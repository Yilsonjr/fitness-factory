import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CajaService } from '../../../core/services/caja.service';
import { VentasService } from '../../../core/services/ventas.service';
import { TurnoCaja, Pago, Gasto, Venta } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

@Component({
  selector: 'app-turno-caja',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Caja</h1>
          <p class="subtitle">Apertura, cobros, gastos y cierre del turno</p>
        </div>
        <div class="header-actions">
          <a routerLink="/pos" class="btn-secondary">Punto de Venta</a>
          <a routerLink="/caja/cobrar" class="btn-primary">Cobrar membresía</a>
        </div>
      </div>

      @if (!turno()) {
        <section class="card form-card">
          <h2>Abrir turno</h2>
          <div class="field">
            <label for="apertura-monto">Monto inicial</label>
            <input id="apertura-monto" type="number" min="0" step="0.01" [(ngModel)]="aperturaMonto" name="aperturaMonto" />
          </div>
          <button class="btn-primary" (click)="abrirTurno()" [disabled]="saving()">{{ saving() ? 'Abriendo…' : 'Abrir turno' }}</button>
        </section>
      } @else {
        <section class="summary-grid">
          <div class="card stat"><span>Apertura</span><strong>{{ turno()?.monto_apertura | currencyDop }}</strong></div>
          <div class="card stat"><span>Cobros</span><strong>{{ resumen().ingresos | currencyDop }}</strong></div>
          <div class="card stat"><span>Ventas POS</span><strong>{{ resumenVentas().total | currencyDop }}</strong></div>
          <div class="card stat"><span>Gastos</span><strong>{{ resumen().gastos | currencyDop }}</strong></div>
          <div class="card stat"><span>Balance</span><strong>{{ balance() | currencyDop }}</strong></div>
        </section>

        <section class="card">
          <h2>Registrar gasto</h2>
          <div class="inline-form">
            <div class="field-inline">
              <label for="gasto-monto">Monto</label>
              <input id="gasto-monto" type="number" min="0" step="0.01" [(ngModel)]="gastoMonto" name="gastoMonto" />
            </div>
            <div class="field-inline">
              <label for="gasto-concepto">Concepto</label>
              <input id="gasto-concepto" type="text" [(ngModel)]="gastoConcepto" name="gastoConcepto" />
            </div>
            <button class="btn-secondary" (click)="registrarGasto()">Agregar gasto</button>
          </div>
        </section>

        <section class="lists-grid">
          <div class="card">
            <h2>Cobros del turno</h2>
            <div class="list">
              @for (p of pagos(); track p.id) {
                <div class="list-item">
                  <div><strong>{{ p.concepto }}</strong><p>{{ p.cliente?.nombre }} {{ p.cliente?.apellido }}</p></div>
                  <span>{{ p.monto | currencyDop }}</span>
                </div>
              } @empty { <div class="empty">Sin cobros</div> }
            </div>
          </div>
          <div class="card">
            <h2>Ventas POS</h2>
            <div class="list">
              @for (v of ventas(); track v.id) {
                <div class="list-item">
                  <div>
                    <strong>{{ v.detalles?.length }} producto{{ v.detalles?.length !== 1 ? 's' : '' }}</strong>
                    <p>{{ v.metodo }} · {{ v.cliente?.nombre || 'Sin cliente' }}</p>
                  </div>
                  <span>{{ v.total | currencyDop }}</span>
                </div>
              } @empty { <div class="empty">Sin ventas</div> }
            </div>
          </div>
          <div class="card">
            <h2>Gastos del turno</h2>
            <div class="list">
              @for (g of gastos(); track g.id) {
                <div class="list-item">
                  <div><strong>{{ g.concepto }}</strong><p>{{ g.fecha }}</p></div>
                  <span>{{ g.monto | currencyDop }}</span>
                </div>
              } @empty { <div class="empty">Sin gastos</div> }
            </div>
          </div>
        </section>

        <section class="card footer-actions">
          <button class="btn-secondary" (click)="abrirModalCerrar()">Cerrar turno</button>
        </section>
      }

      @if (modalCerrar()) {
        <app-confirm-dialog
          title="Cerrar turno"
          [description]="'Esperado: ' + (montoEsperado() | currencyDop) + ' · Diferencia: ' + (diferencia() | currencyDop)"
          cancelLabel="Cancelar cierre"
          (cancel)="cerrarModal()"
        >
          <div dialog-body>
            <div class="field"><label for="cierre-monto">Monto de cierre</label><input id="cierre-monto" type="number" min="0" step="0.01" [ngModel]="cierreMonto()" (ngModelChange)="cierreMonto.set($event)" name="cierreMonto" /></div>
            <div class="field"><label for="cierre-notas">Notas</label><textarea id="cierre-notas" rows="3" [(ngModel)]="cierreNotas" name="cierreNotas"></textarea></div>
          </div>

          <div dialog-actions>
            <button class="btn-secondary" type="button" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-primary" type="button" (click)="cerrarTurno()">Confirmar cierre</button>
          </div>
        </app-confirm-dialog>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; }
    .header-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
    h1, h2 { color: var(--text-primary, #f1f5f9); margin: 0; }
    .subtitle { color: var(--text-secondary, #94a3b8); margin: .25rem 0 0; }
    .card { background: var(--bg-card, #1e293b); border: 1px solid var(--border, #334155); border-radius: 16px; padding: 1rem; margin-bottom: 1rem; }
    .summary-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .stat span { display: block; color: var(--text-secondary, #94a3b8); font-size: .8rem; margin-bottom: .25rem; }
    .stat strong { color: var(--text-primary, #f1f5f9); font-size: 1.2rem; }
    .field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: .9rem; }
    .field-inline { display: flex; flex-direction: column; gap: .4rem; }
    input, textarea { width: 100%; box-sizing: border-box; background: var(--bg-primary, #0f172a); color: var(--text-primary, #f1f5f9); border: 1px solid var(--border, #334155); border-radius: 10px; padding: .8rem .9rem; }
    input:focus-visible, textarea:focus-visible {
      border-color: var(--primary);
      box-shadow: var(--shadow-focus);
      outline: none;
    }
    .inline-form { display: grid; grid-template-columns: 160px 1fr auto; gap: .75rem; align-items: end; }
    .lists-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .list { display: flex; flex-direction: column; gap: .5rem; }
    .list-item { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; border: 1px solid var(--border-muted); border-radius: 12px; padding: .8rem; }
    .list-item p { margin: .2rem 0 0; color: var(--text-secondary, #94a3b8); font-size: .84rem; }
    .empty { color: var(--text-secondary, #94a3b8); padding: 1rem 0; }
    .btn-primary, .btn-secondary { border: 0; border-radius: 10px; padding: .75rem 1rem; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-flex; justify-content: center; }
    .btn-primary { background: var(--primary, #3b82f6); color: var(--text-on-primary); }
    .btn-secondary { background: transparent; color: var(--text-primary, #f1f5f9); border: 1px solid var(--border, #334155); }
    .footer-actions { display: flex; justify-content: flex-end; }
    @media (max-width: 768px) { .summary-grid, .lists-grid, .inline-form { grid-template-columns: 1fr; } .footer-actions { justify-content: stretch; } .footer-actions .btn-secondary, .header-actions .btn-primary, .header-actions .btn-secondary { width: 100%; } .header-actions { width: 100%; } }
  `],
})
export class TurnoCajaComponent implements OnInit {
  turno = signal<TurnoCaja | null>(null);
  pagos = signal<Pago[]>([]);
  gastos = signal<Gasto[]>([]);
  ventas = signal<Venta[]>([]);
  resumen = signal({ ingresos: 0, gastos: 0 });
  resumenVentas = signal({ total: 0, cantidad: 0 });
  saving = signal(false);
  modalCerrar = signal(false);
  aperturaMonto = 0;
  gastoMonto = 0;
  gastoConcepto = '';
  cierreMonto = signal(0);
  cierreNotas = '';
  balance = computed(() => (this.turno()?.monto_apertura || 0) + this.resumen().ingresos + this.resumenVentas().total - this.resumen().gastos);
  montoEsperado = computed(() => (this.turno()?.monto_apertura || 0) + this.resumen().ingresos - this.resumen().gastos);
  diferencia = computed(() => this.cierreMonto() - this.montoEsperado());

  constructor(private caja: CajaService, private ventasService: VentasService) {}

  async ngOnInit() {
    await this.cargar();
  }

  abrirModalCerrar() {
    this.modalCerrar.set(true);
  }

  cerrarModal() {
    this.modalCerrar.set(false);
  }


  async cargar() {
    await this.caja.cargarTurnoActual();
    this.turno.set(this.caja.turnoActual());
    if (this.turno()) {
      const [pagos, gastos, resumen, ventas, resumenVentas] = await Promise.all([
        this.caja.obtenerPagosTurno(this.turno()!.id),
        this.caja.obtenerGastosTurno(this.turno()!.id),
        this.caja.resumenTurno(this.turno()!.id),
        this.ventasService.obtenerVentasTurno(this.turno()!.id),
        this.ventasService.resumenVentasTurno(this.turno()!.id),
      ]);
      this.pagos.set(pagos);
      this.gastos.set(gastos);
      this.ventas.set(ventas);
      this.resumen.set({ ingresos: resumen.ingresos, gastos: resumen.gastos });
      this.resumenVentas.set(resumenVentas);
      this.cierreMonto.set(this.montoEsperado());
    }
  }


  async abrirTurno() {
    this.saving.set(true);
    const { error } = await this.caja.abrirTurno({ monto_apertura: Number(this.aperturaMonto) || 0 });
    this.saving.set(false);
    if (!error) await this.cargar();
  }

  async registrarGasto() {
    if (!this.gastoMonto || !this.gastoConcepto.trim()) return;
    const { error } = await this.caja.registrarGasto(Number(this.gastoMonto), this.gastoConcepto.trim());
    if (!error) {
      this.gastoMonto = 0;
      this.gastoConcepto = '';
      await this.cargar();
    }
  }

  async cerrarTurno() {
    const { error } = await this.caja.cerrarTurno({ monto_cierre: Number(this.cierreMonto()) || 0, notas_cierre: this.cierreNotas || undefined });
    if (!error) {
      this.cerrarModal();
      await this.cargar();
    }
  }




}
