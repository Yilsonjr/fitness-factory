import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientesService } from '../../../core/services/clientes.service';
import { Asistencia, Cliente } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface AsistenciaResumen {
  label: string;
  value: string;
  note: string;
  tone: 'primary' | 'success' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-cliente-asistencias',
  imports: [RouterLink, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      @if (loading()) {
        <div class="card state-card" role="status" aria-live="polite" aria-busy="true">Cargando historial de asistencias…</div>
      } @else if (error()) {
        <div class="banner-error" role="alert">{{ error() }}</div>
      } @else if (cliente()) {
        <div class="page-header">
          <div>
            <p class="eyebrow">Cliente</p>
            <h1>Historial de asistencias</h1>
            <p class="subtitle">{{ clienteNombre() }} · {{ clienteCedula() }}</p>
          </div>
          <a [routerLink]="['/clientes', clienteId()]" class="btn-secondary">Volver al detalle</a>
        </div>

        <section class="client-card card">
          <div class="client-identity">
            <div class="avatar-lg" aria-hidden="true">
              @if (cliente()?.foto_url) {
                <img [src]="cliente()?.foto_url!" [alt]="clienteNombre()" width="72" height="72" />
              } @else {
                {{ iniciales() }}
              }
            </div>
            <div class="client-meta">
              <strong>{{ clienteNombre() }}</strong>
              <span>{{ clienteCedula() }}</span>
            </div>
          </div>

          <div class="client-status">
            <span class="status-pill">{{ asistencias().length }} registros</span>
            <p>Consulta la actividad de acceso del cliente en orden cronológico.</p>
          </div>
        </section>

        <section class="summary-panel card" aria-label="Resumen operativo de asistencias">
          <div class="summary-header">
            <div>
              <h2>Resumen operativo</h2>
              <p class="section-note">Lectura rápida del comportamiento de acceso del cliente.</p>
            </div>
            <span class="status-pill">{{ asistencias().length }} registros</span>
          </div>

          <div class="summary-grid">
            @for (card of resumen(); track card.label) {
              <div class="summary-row" [class.primary]="card.tone === 'primary'" [class.success]="card.tone === 'success'" [class.danger]="card.tone === 'danger'" [class.neutral]="card.tone === 'neutral'">
                <span class="summary-label">{{ card.label }}</span>
                <strong class="summary-value">{{ card.value }}</strong>
                <span class="summary-note">{{ card.note }}</span>
              </div>
            }
          </div>
        </section>

        @if (asistencias().length === 0) {
          <div class="card empty-state">
            <h2>Sin historial de asistencias</h2>
            <p>Este cliente todavía no tiene registros de entrada cargados en el sistema.</p>
          </div>
        } @else {
          <section class="card">
            <div class="section-head">
              <div>
                <h2>Últimos accesos</h2>
                <p class="section-note">Los registros más recientes aparecen primero.</p>
              </div>
            </div>

            <div class="table-wrap">
              <table aria-label="Historial de asistencias del cliente">
                <thead>
                  <tr>
                    <th scope="col">Fecha y hora</th>
                    <th scope="col">Método</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  @for (asistencia of asistencias(); track asistencia.id) {
                    <tr>
                      <td>{{ formatFecha(asistencia.fecha_entrada) }}</td>
                      <td>{{ metodoLabel(asistencia.metodo) }}</td>
                      <td>
                        @if (asistencia.autorizado) {
                          <app-status-badge tone="success" label="Autorizada"></app-status-badge>
                        } @else {
                          <app-status-badge tone="danger" label="Denegada"></app-status-badge>
                        }
                      </td>
                      <td>{{ asistencia.notas || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class ClienteAsistenciasComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientes = inject(ClientesService);
  private readonly dateFormatter = new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  private readonly _cliente = signal<Cliente | null>(null);
  private readonly _asistencias = signal<Asistencia[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly cliente = this._cliente.asReadonly();
  readonly asistencias = this._asistencias.asReadonly();
  readonly clienteId = computed(() => this.cliente()?.id ?? '');
  readonly clienteNombre = computed(() => {
    const cliente = this.cliente();
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente';
  });
  readonly clienteCedula = computed(() => this.cliente()?.cedula ?? 'Sin cédula');
  readonly iniciales = computed(() => {
    const cliente = this.cliente();
    if (!cliente) {
      return 'CL';
    }

    return `${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}`.toUpperCase();
  });

  readonly resumen = computed<AsistenciaResumen[]>(() => {
    const registros = this.asistencias();
    const autorizadas = registros.filter((item) => item.autorizado).length;
    const denegadas = registros.length - autorizadas;
    const ultima = registros[0]?.fecha_entrada ? this.formatFecha(registros[0].fecha_entrada) : 'Sin registros';

    return [
      {
        label: 'Registros',
        value: `${registros.length}`,
        note: 'Total en historial',
        tone: 'primary',
      },
      {
        label: 'Autorizadas',
        value: `${autorizadas}`,
        note: 'Entradas permitidas',
        tone: 'success',
      },
      {
        label: 'Denegadas',
        value: `${denegadas}`,
        note: 'Intentos rechazados',
        tone: 'danger',
      },
      {
        label: 'Último acceso',
        value: ultima,
        note: 'Registro más reciente',
        tone: 'neutral',
      },
    ];
  });

  async ngOnInit(): Promise<void> {
    const clienteId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!clienteId) {
      this.error.set('No se encontró el cliente solicitado.');
      this.loading.set(false);
      return;
    }

    const cliente = await this.clientes.obtener(clienteId);
    if (!cliente) {
      this.error.set('No se encontró el cliente solicitado.');
      this.loading.set(false);
      return;
    }

    const asistencias = await this.clientes.obtenerAsistencias(clienteId);
    this._cliente.set(cliente);
    this._asistencias.set(asistencias);
    this.loading.set(false);
  }

  formatFecha(valor: string): string {
    return this.dateFormatter.format(new Date(valor));
  }

  metodoLabel(metodo: Asistencia['metodo']): string {
    switch (metodo) {
      case 'huella':
        return 'Huella';
      case 'manual':
        return 'Manual';
      case 'tarjeta':
        return 'Tarjeta';
    }
  }
}
