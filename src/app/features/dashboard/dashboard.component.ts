import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CajaService } from '../../core/services/caja.service';
import { MembresiasService } from '../../core/services/membresias.service';
import { VentasService } from '../../core/services/ventas.service';

type StatTone = 'success' | 'warning' | 'danger' | 'primary';
type ActionTone = 'primary' | 'neutral';
type StatIcon = 'memberships' | 'upcoming' | 'expired' | 'income';
type ActionIcon = 'payments' | 'clients' | 'membership' | 'cash' | 'pos';

interface DashboardStat {
  label: string;
  value: string;
  note: string;
  tone: StatTone;
  icon: StatIcon;
}

interface DashboardAction {
  label: string;
  description: string;
  route: string;
  tone: ActionTone;
  icon: ActionIcon;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <section class="hero-card">
        <div class="hero-copy">
          <p class="eyebrow">Resumen operativo</p>
          <h1>Bienvenido, {{ usuarioNombre() }}</h1>
          <p class="subtitle">Controla el turno de caja, las membresías y los cobros desde un solo lugar.</p>
        </div>

        <div class="hero-status" [class.open]="turnoAbierto()" [class.closed]="!turnoAbierto()">
          <div class="hero-status-head">
            <span class="status-pill" [class.is-open]="turnoAbierto()" [class.is-closed]="!turnoAbierto()">
              {{ turnoAbierto() ? 'Turno abierto' : 'Sin turno abierto' }}
            </span>
            <span class="hero-status-label">{{ turnoAbierto() ? 'Caja activa' : 'Acción pendiente' }}</span>
          </div>

          @if (turnoAbierto()) {
            <div class="hero-metric">
              <span class="hero-metric-label">Balance esperado</span>
              <strong>{{ formatCurrency(balanceTurno()) }}</strong>
            </div>

            <div class="turno-grid" aria-label="Resumen del turno">
              <div>
                <span>Apertura</span>
                <strong>{{ formatCurrency(aperturaTurno()) }}</strong>
              </div>
              <div>
                <span>Ingresos</span>
                <strong class="positive">{{ formatCurrency(resumenCaja().ingresos) }}</strong>
              </div>
              <div>
                <span>Gastos</span>
                <strong class="negative">{{ formatCurrency(resumenCaja().gastos) }}</strong>
              </div>
            </div>

            <a routerLink="/caja" class="hero-action">Ver caja</a>
          } @else {
            <p class="hero-copy-note">Abre la caja para registrar cobros y gastos del día.</p>
            <a routerLink="/caja" class="hero-action">Abrir caja</a>
          }
        </div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <h2>Métricas operativas</h2>
            <p class="section-note">Indicadores que requieren atención hoy.</p>
          </div>
        </div>

        <div class="stats-grid">
          @for (card of statCards(); track card.label) {
            <article class="stat-card" [class.success]="card.tone === 'success'" [class.warning]="card.tone === 'warning'" [class.danger]="card.tone === 'danger'" [class.primary]="card.tone === 'primary'">
              <div class="stat-icon" [class.success]="card.tone === 'success'" [class.warning]="card.tone === 'warning'" [class.danger]="card.tone === 'danger'" [class.primary]="card.tone === 'primary'">
                @switch (card.icon) {
                  @case ('memberships') {
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                  }
                  @case ('upcoming') {
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4l3 2"/>
                    </svg>
                  }
                  @case ('expired') {
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M15 9l-6 6"/>
                      <path d="M9 9l6 6"/>
                    </svg>
                  }
                  @case ('income') {
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 1v22"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  }
                }
              </div>

              <div class="stat-copy">
                <span class="stat-label">{{ card.label }}</span>
                <strong class="stat-value">{{ card.value }}</strong>
                <span class="stat-note">{{ card.note }}</span>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <h2>Acciones rápidas</h2>
            <p class="section-note">Atajos para los flujos más frecuentes en recepción.</p>
          </div>
        </div>

        <div class="actions-strip">
          @for (action of quickActions(); track action.route) {
            <a class="action-btn" [class.primary]="action.tone === 'primary'" [routerLink]="action.route">
              <span class="action-btn-icon" aria-hidden="true">
                @switch (action.icon) {
                  @case ('payments') {
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 1v22"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  }
                  @case ('clients') {
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <path d="M20 8v6"/>
                      <path d="M23 11h-6"/>
                    </svg>
                  }
                  @case ('membership') {
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2"/>
                      <path d="M1 10h22"/>
                    </svg>
                  }
                  @case ('pos') {
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4"/>
                    </svg>
                  }
                }
              </span>
              {{ action.label }}
            </a>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly membresias = inject(MembresiasService);
  private readonly ventasService = inject(VentasService);
  readonly caja = inject(CajaService);

  readonly stats = signal({ activas: 0, vencidas: 0, porVencer: 0 });
  readonly resumenCaja = signal({ ingresos: 0, gastos: 0 });
  readonly ventasTurno = signal({ total: 0, cantidad: 0 });
  readonly turnoAbierto = signal(false);

  private readonly numberFormatter = new Intl.NumberFormat('es-DO');
  private readonly currencyFormatter = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });

  readonly usuarioNombre = computed(() => this.auth.usuario()?.nombre ?? 'equipo');
  readonly aperturaTurno = computed(() => this.caja.turnoActual()?.monto_apertura ?? 0);
  readonly ingresosDia = computed(() => this.resumenCaja().ingresos);
  readonly balanceTurno = computed(() => this.aperturaTurno() + this.resumenCaja().ingresos + this.ventasTurno().total - this.resumenCaja().gastos);

  readonly statCards = computed<DashboardStat[]>(() => [
    {
      label: 'Membresías activas',
      value: this.numberFormatter.format(this.stats().activas),
      note: 'Clientes con acceso vigente',
      tone: 'success',
      icon: 'memberships',
    },
    {
      label: 'Por vencer',
      value: this.numberFormatter.format(this.stats().porVencer),
      note: 'Membresías que requieren seguimiento',
      tone: 'warning',
      icon: 'upcoming',
    },
    {
      label: 'Vencidas',
      value: this.numberFormatter.format(this.stats().vencidas),
      note: 'Clientes por recuperar',
      tone: 'danger',
      icon: 'expired',
    },
    {
      label: 'Ingresos del día',
      value: this.currencyFormatter.format(this.ingresosDia()),
      note: this.turnoAbierto() ? 'Acumulado del turno actual' : 'Sin turno abierto',
      tone: 'primary',
      icon: 'income',
    },
  ]);

  readonly quickActions = computed<DashboardAction[]>(() => [
    {
      label: 'Registrar cobro',
      description: 'Ir al flujo de pagos de caja.',
      route: '/caja/cobrar',
      tone: 'primary',
      icon: 'payments',
    },
    {
      label: 'Nuevo cliente',
      description: 'Dar de alta un miembro nuevo.',
      route: '/clientes/nuevo',
      tone: 'neutral',
      icon: 'clients',
    },
    {
      label: 'Asignar membresía',
      description: 'Vincular un plan activo a un cliente.',
      route: '/membresias/asignar',
      tone: 'neutral',
      icon: 'membership',
    },
    {
      label: 'Punto de Venta',
      description: 'Vender productos del inventario.',
      route: '/pos',
      tone: 'neutral',
      icon: 'pos',
    },
  ]);

  async ngOnInit(): Promise<void> {
    const stats = await this.membresias.contarPorEstado();
    this.stats.set(stats);

    await this.caja.cargarTurnoActual();
    this.turnoAbierto.set(this.caja.hayTurnoAbierto());

    if (this.caja.hayTurnoAbierto()) {
      const turnoId = this.caja.turnoActual()!.id;
      const [resumen, ventas] = await Promise.all([
        this.caja.resumenTurno(),
        this.ventasService.resumenVentasTurno(turnoId),
      ]);
      this.resumenCaja.set({ ingresos: resumen.ingresos, gastos: resumen.gastos });
      this.ventasTurno.set(ventas);
    }
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }
}
