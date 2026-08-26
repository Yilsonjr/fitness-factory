import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ZKTecoService } from '../../core/services/zkteco.service';
import { ClientesService } from '../../core/services/clientes.service';
import { AuthService } from '../../core/services/auth.service';
import { Cliente } from '../../core/models';

type PantallaEstado = 'esperando' | 'procesando' | 'resultado';

@Component({
  selector: 'app-acceso-kiosk',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kiosk">
      <!-- Header -->
      <header class="kiosk-header">
        <a routerLink="/dashboard" class="kiosk-back" aria-label="Volver al dashboard">←</a>
        <span class="kiosk-gym">{{ gimnasioNombre() }}</span>
        <span
          class="kiosk-status"
          [class.sim]="zk.esModoSimulacion()"
          [class.ready]="!zk.esModoSimulacion() && zk.estado() === 'listo'"
        >
          @if (zk.esModoSimulacion()) { Modo simulación }
          @else if (zk.estado() === 'conectando') { Conectando… }
          @else if (zk.estado() === 'listo' || zk.estado() === 'capturando') { Lector activo }
          @else { Sin lector }
        </span>
      </header>

      <!-- Pantalla de espera -->
      @if (pantalla() === 'esperando') {
        <section class="kiosk-body" aria-live="polite">
          <div class="pulse-ring" aria-hidden="true">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="35" stroke="var(--brand)" stroke-width="3"/>
              <path d="M40 20 C32 20 26 27 26 36 C26 48 40 58 40 58 C40 58 54 48 54 36 C54 27 48 20 40 20Z" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
              <line x1="33" y1="32" x2="33" y2="50" stroke="var(--brand)" stroke-width="2" stroke-linecap="round"/>
              <line x1="37" y1="29" x2="37" y2="52" stroke="var(--brand)" stroke-width="2" stroke-linecap="round"/>
              <line x1="41" y1="28" x2="41" y2="52" stroke="var(--brand)" stroke-width="2" stroke-linecap="round"/>
              <line x1="45" y1="30" x2="45" y2="50" stroke="var(--brand)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h1>Coloca tu dedo en el lector</h1>
          <p>El acceso se registrará automáticamente</p>

          @if (zk.esModoSimulacion()) {
            <div class="sim-panel">
              <p class="sim-label">Modo simulación — busca un cliente</p>
              <div class="sim-search">
                <input
                  id="kiosk-sim-buscar"
                  type="search"
                  placeholder="Nombre, cédula o teléfono…"
                  [(ngModel)]="terminoBusqueda"
                  (input)="buscarCliente()"
                  autocomplete="off"
                  aria-label="Buscar cliente para simular acceso"
                />
              </div>
              @if (resultadosBusqueda().length > 0) {
                <ul class="sim-results" role="listbox" aria-label="Clientes encontrados">
                  @for (c of resultadosBusqueda(); track c.id) {
                    <li role="option">
                      <button (click)="simularAcceso(c)">
                        {{ c.nombre }} {{ c.apellido }}
                        @if (c.cedula) { <span class="cedula">{{ c.cedula }}</span> }
                      </button>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </section>
      }

      <!-- Procesando -->
      @if (pantalla() === 'procesando') {
        <section class="kiosk-body" aria-live="assertive" aria-busy="true">
          <div class="spinner" aria-hidden="true"></div>
          <h1>Verificando…</h1>
        </section>
      }

      <!-- Resultado -->
      @if (pantalla() === 'resultado' && clienteResultado()) {
        <section
          class="kiosk-body resultado"
          [class.acceso-ok]="accesoPermitido()"
          [class.acceso-no]="!accesoPermitido()"
          aria-live="assertive"
        >
          @if (clienteResultado()?.foto_url) {
            <img [src]="clienteResultado()!.foto_url!" [alt]="clienteResultado()!.nombre" class="foto" />
          } @else {
            <div class="avatar-placeholder" aria-hidden="true">
              {{ iniciales() }}
            </div>
          }

          <h1>{{ clienteResultado()?.nombre }} {{ clienteResultado()?.apellido }}</h1>

          @if (accesoPermitido()) {
            <div class="badge-acceso ok" role="status">
              <span aria-hidden="true">✓</span> Acceso permitido
            </div>
            <p class="membresia-info">
              {{ clienteResultado()?.membresia_activa?.plan?.nombre }} ·
              Vence {{ formatFecha(clienteResultado()?.membresia_activa?.fecha_fin) }}
            </p>
          } @else {
            <div class="badge-acceso no" role="status">
              <span aria-hidden="true">✕</span> Sin membresía activa
            </div>
            <p class="membresia-info">No tiene una membresía vigente</p>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100dvh; }

    .kiosk {
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    /* ── Header ── */
    .kiosk-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--border);
    }

    .kiosk-back {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 1.25rem;
      line-height: 1;
      padding: var(--space-2);
      border-radius: var(--radius-sm);
    }

    .kiosk-back:focus-visible { box-shadow: var(--shadow-focus); outline: none; }

    .kiosk-gym {
      font-weight: var(--font-bold);
      font-size: var(--text-xl);
      color: var(--text-primary);
    }

    .kiosk-status {
      font-size: var(--text-sm);
      color: var(--text-muted);
      background: var(--bg-elevated);
      padding: .25rem .75rem;
      border-radius: var(--radius-full);
    }

    .kiosk-status.sim { color: var(--color-warning-text); background: var(--color-warning-subtle); }
    .kiosk-status.ready { color: var(--color-success-text); background: var(--color-success-subtle); }

    /* ── Body ── */
    .kiosk-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-5);
      padding: var(--space-8) var(--space-6);
      text-align: center;
      transition: background var(--duration-layout);
    }

    h1 {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: var(--font-bold);
      margin: 0;
    }

    p { color: var(--text-secondary); margin: 0; font-size: var(--text-lg); }

    /* ── Fingerprint icon ── */
    .pulse-ring {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pulse-ring::before {
      content: '';
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid var(--brand);
      animation: pulse 2s ease-in-out infinite;
      opacity: .4;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: .4; }
      50% { transform: scale(1.3); opacity: 0; }
    }

    /* ── Spinner ── */
    .spinner {
      width: 64px;
      height: 64px;
      border: 4px solid var(--border);
      border-top-color: var(--brand);
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Resultado ── */
    .resultado { transition: background .3s; }
    .resultado.acceso-ok { background: rgba(183, 245, 0, 0.05); }
    .resultado.acceso-no { background: rgba(239, 68, 68, 0.05); }

    .foto {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--border);
    }

    .avatar-placeholder {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: var(--bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: var(--font-bold);
      color: var(--text-secondary);
    }

    .badge-acceso {
      font-size: 1.25rem;
      font-weight: var(--font-bold);
      padding: .6rem 2rem;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      gap: .5rem;
    }

    .badge-acceso.ok {
      background: var(--color-success-subtle);
      color: var(--color-success-text);
    }

    .badge-acceso.no {
      background: var(--color-danger-subtle);
      color: var(--color-danger-text);
    }

    .membresia-info {
      font-size: var(--text-md);
      color: var(--text-secondary);
    }

    /* ── Simulación ── */
    .sim-panel {
      width: min(100%, 400px);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      border-top: 1px solid var(--border);
      padding-top: var(--space-5);
    }

    .sim-label { color: var(--color-warning-text); font-size: var(--text-sm); margin: 0; }

    .sim-search input {
      width: 100%;
      box-sizing: border-box;
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius-input);
      padding: .75rem 1rem;
      font-size: var(--text-base);
    }

    .sim-search input:focus-visible {
      border-color: var(--primary);
      box-shadow: var(--shadow-focus);
      outline: none;
    }

    .sim-results {
      list-style: none;
      margin: 0;
      padding: 0;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .sim-results li button {
      width: 100%;
      text-align: left;
      background: transparent;
      border: 0;
      border-bottom: 1px solid var(--border);
      padding: .75rem 1rem;
      cursor: pointer;
      color: var(--text-primary);
      font-size: var(--text-base);
      display: flex;
      justify-content: space-between;
      gap: var(--space-3);
    }

    .sim-results li:last-child button { border-bottom: 0; }
    .sim-results li button:hover { background: var(--bg-elevated); }
    .sim-results li button:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--primary); }

    .cedula { color: var(--text-secondary); font-size: var(--text-sm); }
  `],
})
export class AccesoKioskComponent implements OnInit, OnDestroy {
  pantalla = signal<PantallaEstado>('esperando');
  clienteResultado = signal<Cliente | null>(null);
  accesoPermitido = signal(false);
  gimnasioNombre = signal('');
  resultadosBusqueda = signal<Cliente[]>([]);
  terminoBusqueda = '';

  iniciales = computed(() => {
    const c = this.clienteResultado();
    if (!c) return '';
    return `${c.nombre[0] ?? ''}${c.apellido[0] ?? ''}`.toUpperCase();
  });

  private _resultadoTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public zk: ZKTecoService,
    private clientes: ClientesService,
    private auth: AuthService,
  ) {}

  async ngOnInit() {
    const usuario = this.auth.usuario();
    this.gimnasioNombre.set(usuario?.nombre ?? 'Fitness Factory');

    await this.zk.inicializar();

    if (!this.zk.esModoSimulacion()) {
      // Load all fingerprint templates and register them with the local service
      const plantillas = await this.clientes.obtenerPlantillasHuella();
      await this.zk.registrarPlantillas(
        plantillas.map(p => ({ clienteId: p.id, template: p.template }))
      );

      this.zk.iniciarIdentificacion(async ({ clienteId }) => {
        if (!clienteId) return;
        await this.procesarAcceso(clienteId, 'huella');
      });
    }
  }

  ngOnDestroy() {
    this.zk.detenerIdentificacion();
    if (this._resultadoTimer !== null) clearTimeout(this._resultadoTimer);
  }

  // ─── Modo simulación ─────────────────────────────────────────────────────

  async buscarCliente() {
    const termino = this.terminoBusqueda.trim();
    if (termino.length < 2) { this.resultadosBusqueda.set([]); return; }
    const res = await this.clientes.buscar(termino);
    this.resultadosBusqueda.set(res);
  }

  async simularAcceso(cliente: Cliente) {
    this.resultadosBusqueda.set([]);
    this.terminoBusqueda = '';
    await this.procesarAcceso(cliente.id, 'manual');
  }

  // ─── Lógica de acceso ────────────────────────────────────────────────────

  private async procesarAcceso(clienteId: string, metodo: 'huella' | 'manual') {
    this.pantalla.set('procesando');

    const cliente = await this.clientes.obtener(clienteId);
    const permitido = !!cliente?.membresia_activa && cliente.membresia_activa.estado === 'activa';

    await this.clientes.registrarAsistencia(clienteId, metodo, permitido);

    this.clienteResultado.set(cliente);
    this.accesoPermitido.set(permitido);
    this.pantalla.set('resultado');

    // Return to waiting screen after 4 seconds
    this._resultadoTimer = setTimeout(() => {
      this.pantalla.set('esperando');
      this.clienteResultado.set(null);
    }, 4000);
  }

  formatFecha(fecha?: string): string {
    if (!fecha) return '';
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(fecha));
  }
}
