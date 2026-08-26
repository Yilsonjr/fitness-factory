import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientesService } from '../../../core/services/clientes.service';
import { MembresiasService } from '../../../core/services/membresias.service';
import { Cliente, Plan, MembresiaForm, MetodoPago } from '../../../core/models';
import { ClientSearchComponent, ClienteBusqueda } from '../../../shared/components/client-search/client-search.component';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

@Component({
  selector: 'app-membresia-form',
  imports: [FormsModule, RouterLink, ClientSearchComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Asignar membresía</h1>
          <p class="subtitle">Busca un cliente, selecciona un plan y registra el pago</p>
        </div>
        <a routerLink="/membresias" class="btn-secondary">Volver</a>
      </div>

      @if (message()) { <div class="banner" role="alert" [class.error]="isError()">{{ message() }}</div> }

      <div class="card">
        <div class="grid">
          <div class="span-2">
            <app-client-search
              inputId="mf-cliente"
              label="Cliente"
              [selected]="clienteSeleccionado()"
              (clienteSelected)="seleccionarCliente($event)"
              (clienteCleared)="quitarCliente()"
            />
          </div>

          <div class="field">
            <label for="mf-plan">Plan</label>
            <select id="mf-plan" [ngModel]="planId()" (ngModelChange)="planId.set($event); form.plan_id = $event; onPlanChange()" name="plan_id">
              <option value="">Seleccione</option>
              @for (plan of membresias.planes(); track plan.id) {
                <option [value]="plan.id">{{ plan.nombre }} - {{ plan.precio | currencyDop }}</option>
              }
            </select>
          </div>

          <div class="field">
            <label for="mf-fecha-inicio">Fecha inicio</label>
            <input id="mf-fecha-inicio" type="date" [(ngModel)]="form.fecha_inicio" name="fecha_inicio" (change)="onPlanChange()" />
          </div>

          <div class="field">
            <label for="mf-metodo">Método de pago</label>
            <select id="mf-metodo" [(ngModel)]="form.metodo_pago" name="metodo_pago">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div class="field span-2">
            <label for="mf-notas">Notas</label>
            <textarea id="mf-notas" rows="3" [(ngModel)]="form.notas" name="notas"></textarea>
          </div>
        </div>

        @if (selectedPlan()) {
          <div class="summary">
            <div><span>Precio</span><strong>{{ selectedPlan()?.precio | currencyDop }}</strong></div>
            <div><span>Duración</span><strong>{{ selectedPlan()?.duracion_dias }} días</strong></div>
            <div><span>Fecha fin</span><strong>{{ fechaFinEstimada() }}</strong></div>
          </div>
        }

        <div class="actions">
          <button class="btn-primary" [disabled]="saving() || !clienteSeleccionado() || !selectedPlan()" (click)="guardar()">{{ saving() ? 'Guardando…' : 'Asignar membresía' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 1000px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    h1 { margin: 0; color: var(--text-primary, #f1f5f9); }
    .subtitle { margin: .25rem 0 0; color: var(--text-secondary, #94a3b8); }
    .card { background: var(--bg-card, #1e293b); border: 1px solid var(--border, #334155); border-radius: 16px; padding: 1.1rem; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .span-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: .4rem; }
    label { color: var(--text-secondary, #94a3b8); font-size: .85rem; }
    input, select, textarea { background: var(--bg-primary, #0f172a); color: var(--text-primary, #f1f5f9); border: 1px solid var(--border, #334155); border-radius: 10px; padding: .8rem .9rem; width: 100%; box-sizing: border-box; }
    input:focus-visible, select:focus-visible, textarea:focus-visible {
      border-color: var(--primary);
      box-shadow: var(--shadow-focus);
      outline: none;
    }
    .results { display: flex; flex-direction: column; gap: .5rem; margin-top: .5rem; }
    .result { text-align: left; border: 1px solid var(--border, #334155); background: var(--bg-row-hover); color: var(--text-primary, #f1f5f9); border-radius: 10px; padding: .75rem .85rem; cursor: pointer; display: flex; flex-direction: column; gap: .1rem; }
    .result span, .empty, .selected { color: var(--text-secondary, #94a3b8); font-size: .85rem; }
    .selected { display: flex; justify-content: space-between; align-items: center; margin-top: .5rem; }
    .link { background: none; border: 0; color: var(--primary, #3b82f6); cursor: pointer; padding: 0; }
    .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem; }
    .summary div { border: 1px solid var(--border, #334155); border-radius: 12px; padding: .85rem; }
    .summary span { display: block; color: var(--text-secondary, #94a3b8); font-size: .8rem; margin-bottom: .2rem; }
    .summary strong { color: var(--text-primary, #f1f5f9); }
    .actions { display: flex; justify-content: flex-end; margin-top: 1rem; }
    .btn-primary, .btn-secondary { border: 0; border-radius: 10px; padding: .8rem 1rem; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn-primary { background: var(--primary, #3b82f6); color: var(--text-on-primary); }
    .btn-secondary { background: transparent; color: var(--text-secondary, #94a3b8); border: 1px solid var(--border, #334155); }
    .banner { margin-bottom: 1rem; padding: .85rem 1rem; border-radius: 10px; background: var(--color-success-banner); color: var(--color-success-text); }
    .banner.error { background: var(--color-danger-banner); color: var(--color-danger-text); }
    @media (max-width: 768px) { .grid, .summary { grid-template-columns: 1fr; } .span-2 { grid-column: auto; } .header { flex-direction: column; } }
  `],
})
export class MembresiaFormComponent implements OnInit {
  clienteSeleccionado = signal<ClienteBusqueda | null>(null);
  planId = signal('');
  selectedPlan = computed(() => this.membresias.planes().find(plan => plan.id === this.planId()) ?? null);
  saving = signal(false);
  message = signal('');
  isError = signal(false);

  form: MembresiaForm = {
    cliente_id: '',
    plan_id: '',
    fecha_inicio: todayISO(),
    metodo_pago: 'efectivo',
    notas: '',
  };

  constructor(
    public membresias: MembresiasService,
    private clientes: ClientesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.membresias.cargarPlanes();
    const clienteId = this.route.snapshot.queryParamMap.get('cliente');
    if (clienteId) {
      const cliente = await this.clientes.obtener(clienteId);
      if (cliente) {
        this.clienteSeleccionado.set(cliente);
        this.form.cliente_id = cliente.id;
      }
    }
  }

  seleccionarCliente(cliente: ClienteBusqueda) {
    this.clienteSeleccionado.set(cliente);
    this.form.cliente_id = cliente.id;
  }

  quitarCliente() {
    this.clienteSeleccionado.set(null);
    this.form.cliente_id = '';
  }

  onPlanChange() {
    this.message.set('');
  }

  fechaFinEstimada(): string {
    const plan = this.selectedPlan();
    if (!plan) return '—';
    const inicio = new Date(this.form.fecha_inicio || todayISO());
    inicio.setDate(inicio.getDate() + plan.duracion_dias);
    return inicio.toISOString().split('T')[0];
  }

  async guardar() {
    if (!this.form.cliente_id || !this.form.plan_id) {
      this.isError.set(true);
      this.message.set('Selecciona cliente y plan.');
      return;
    }

    this.saving.set(true);
    const result = await this.membresias.asignarMembresia(this.form);
    this.saving.set(false);

    if (result.error) {
      this.isError.set(true);
      this.message.set(result.error);
      return;
    }

    this.isError.set(false);
    this.message.set('Membresía asignada correctamente.');
    await this.router.navigate(['/clientes', this.form.cliente_id]);
  }
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
