import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientesService } from '../../../core/services/clientes.service';
import { CajaService } from '../../../core/services/caja.service';
import { MembresiasService } from '../../../core/services/membresias.service';
import { ToastService } from '../../../core/services/toast.service';
import { Cliente, Membresia, Pago } from '../../../core/models';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

type MembresiaVista = Membresia & { plan?: { nombre: string; periodo: string; precio?: number } };
type PagoVista = Pago & { membresia?: { id: string; fecha_inicio: string; fecha_fin: string; plan?: { nombre: string } } };

@Component({
  selector: 'app-cliente-detalle',
  imports: [RouterLink, FormsModule, CurrencyDopPipe, ConfirmDialogComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      @if (loading()) {
        <div class="card" role="status" aria-live="polite" aria-busy="true">Cargando cliente…</div>
      } @else if (cliente()) {
        <div class="header">
          <div class="profile">
            <div class="avatar-lg">
              @if (cliente()?.foto_url) {
                <img [src]="cliente()?.foto_url!" [alt]="cliente()?.nombre" width="96" height="96" />
              } @else {
                {{ iniciales() }}
              }
            </div>
            <div>
              <h1>{{ cliente()?.nombre }} {{ cliente()?.apellido }}</h1>
              <p class="subtitle">{{ cliente()?.cedula || 'Sin cédula' }}</p>
            </div>
          </div>
          <div class="actions">
            <a [routerLink]="['/clientes', cliente()?.id, 'editar']" class="btn-secondary">Editar</a>
            <a [routerLink]="['/clientes', cliente()?.id, 'asistencias']" class="btn-secondary">Asistencias</a>
            <a routerLink="/membresias/asignar" [queryParams]="{ cliente: cliente()?.id }" class="btn-primary">Asignar membresía</a>
            <button class="btn-danger" (click)="solicitarDesactivacion()">Desactivar</button>
          </div>
        </div>

        @if (confirmandoDesactivacion()) {
          <app-confirm-dialog
            title="Desactivar cliente"
            description="Esta acción oculta al cliente de la operación diaria y puede afectar sus flujos futuros."
            cancelLabel="Cancelar desactivación"
            (cancel)="cancelarDesactivacion()"
          >
            <div dialog-actions>
              <button class="btn-secondary" type="button" (click)="cancelarDesactivacion()">Cancelar</button>
              <button class="btn-danger" type="button" (click)="desactivar()">Sí, desactivar</button>
            </div>
          </app-confirm-dialog>
        }

        @if (currentMembership()) {
          <section class="card info-grid">
            <div>
              <p class="label">Membresía actual</p>
              <div class="value-row">
                <strong>{{ currentMembership()!.plan?.nombre || 'Sin plan' }}</strong>
                @switch (currentMembership()!.estado) {
                  @case ('activa') { <app-status-badge tone="success" label="Activa"></app-status-badge> }
                  @case ('congelada') { <app-status-badge tone="frozen" label="Congelada"></app-status-badge> }
                  @case ('vencida') { <app-status-badge tone="danger" label="Vencida"></app-status-badge> }
                  @case ('cancelada') { <app-status-badge tone="neutral" label="Cancelada"></app-status-badge> }
                }
              </div>
            </div>
            <div>
              <p class="label">Vence</p>
              <strong>{{ currentMembership()!.fecha_fin }}</strong>
            </div>
            <div>
              <p class="label">Acción</p>
              @if (currentMembership()!.estado === 'activa') {
                <button class="btn-secondary" [disabled]="savingMembresia()" (click)="congelar()">{{ savingMembresia() ? 'Guardando…' : 'Congelar membresía' }}</button>
              } @else if (currentMembership()!.estado === 'congelada') {
                <button class="btn-secondary" [disabled]="savingMembresia()" (click)="reactivar()">{{ savingMembresia() ? 'Guardando…' : 'Reactivar membresía' }}</button>
              }
            </div>
          </section>
        }

        <section class="card">
          <h2>Información general</h2>
          <div class="info-grid compact">
            <div><span class="label">Teléfono</span><strong>{{ cliente()?.telefono || '—' }}</strong></div>
            <div><span class="label">Email</span><strong>{{ cliente()?.email || '—' }}</strong></div>
            <div><span class="label">Sexo</span><strong>{{ cliente()?.sexo || '—' }}</strong></div>
            <div><span class="label">Fecha nacimiento</span><strong>{{ formatFecha(cliente()?.fecha_nacimiento) }}</strong></div>
            <div class="span-2"><span class="label">Dirección</span><strong>{{ cliente()?.direccion || '—' }}</strong></div>
            <div><span class="label">Contacto emergencia</span><strong>{{ cliente()?.contacto_emergencia || '—' }}</strong></div>
            <div><span class="label">Teléfono emergencia</span><strong>{{ cliente()?.telefono_emergencia || '—' }}</strong></div>
            <div class="span-2"><span class="label">Notas</span><strong>{{ cliente()?.notas || '—' }}</strong></div>
          </div>
        </section>

        <section class="card">
          <h2>Historial de membresías</h2>
          <div class="table-wrap">
            <table aria-label="Historial de membresías del cliente">
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Inicio</th>
                  <th scope="col">Fin</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Pagado</th>
                </tr>
              </thead>
              <tbody>
                @for (m of memberships(); track m.id) {
                  <tr>
                    <td>{{ m.plan?.nombre || '—' }}</td>
                    <td>{{ formatFecha(m.fecha_inicio) }}</td>
                    <td>{{ formatFecha(m.fecha_fin) }}</td>
                      <td>
                        @switch (m.estado) {
                          @case ('activa') { <app-status-badge tone="success" label="Activa"></app-status-badge> }
                          @case ('congelada') { <app-status-badge tone="frozen" label="Congelada"></app-status-badge> }
                          @case ('vencida') { <app-status-badge tone="danger" label="Vencida"></app-status-badge> }
                          @case ('cancelada') { <app-status-badge tone="neutral" label="Cancelada"></app-status-badge> }
                        }
                      </td>
                    <td>{{ m.precio_pagado | currencyDop }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty">Sin historial</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <div class="section-head">
            <div>
              <h2>Historial de pagos</h2>
              <p class="section-note">Cobros y movimientos monetarios asociados a este cliente.</p>
            </div>
          </div>

          <div class="summary-grid payments-summary">
            <div class="summary-card primary">
              <span class="summary-label">Total cobrado</span>
              <strong class="summary-value">{{ totalPagado() | currencyDop }}</strong>
              <span class="summary-note">Pagos no anulados</span>
            </div>
            <div class="summary-card success">
              <span class="summary-label">Pagos registrados</span>
              <strong class="summary-value">{{ pagos().length }}</strong>
              <span class="summary-note">Movimientos de caja</span>
            </div>
            <div class="summary-card danger">
              <span class="summary-label">Pagos anulados</span>
              <strong class="summary-value">{{ pagosAnulados() }}</strong>
              <span class="summary-note">Requieren auditoría</span>
            </div>
          </div>

          <div class="table-wrap payments-table-wrap">
            <table aria-label="Historial de pagos del cliente">
              <thead>
                <tr>
                  <th scope="col">Fecha y hora</th>
                  <th scope="col">Concepto</th>
                  <th scope="col">Método</th>
                  <th scope="col">Monto</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (p of pagos(); track p.id) {
                  <tr>
                    <td>{{ formatFechaHora(p.fecha) }}</td>
                    <td>
                      <div class="payment-concept">
                        <strong>{{ p.concepto }}</strong>
                        <span>{{ p.membresia?.plan?.nombre || 'Pago suelto' }}</span>
                      </div>
                    </td>
                    <td>{{ metodoLabel(p.metodo) }}</td>
                    <td>{{ p.monto | currencyDop }}</td>
                    <td>
                      @if (p.anulado) {
                        <app-status-badge tone="danger" label="Anulado"></app-status-badge>
                      } @else {
                        <app-status-badge tone="success" label="Registrado"></app-status-badge>
                      }
                    </td>
                    <td>
                      @if (!p.anulado) {
                        <button class="btn-link danger" (click)="abrirAnulacion(p)">Anular</button>
                      } @else {
                        <span class="muted">—</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="empty">Sin historial de pagos</td></tr>
                }
              </tbody>
            </table>
          </div>

          @if (anulandoPago()) {
            <app-confirm-dialog
              title="Anular pago"
              description="Confirma el motivo antes de revertir el cobro."
              cancelLabel="Cerrar anulación"
              (cancel)="cancelarAnulacion()"
            >
              <div dialog-body>
                <div class="anulacion-data">
                  <div>
                    <span class="label">Concepto</span>
                    <strong>{{ anulandoPago()?.concepto }}</strong>
                  </div>
                  <div>
                    <span class="label">Monto</span>
                    <strong>{{ anulandoPago()?.monto | currencyDop }}</strong>
                  </div>
                </div>

                <div class="field">
                  <label for="motivo-anulacion">Motivo de anulación</label>
                  <textarea id="motivo-anulacion" rows="3" [ngModel]="motivoAnulacion()" (ngModelChange)="motivoAnulacion.set($event)" name="motivoAnulacion"></textarea>
                </div>

                @if (anulacionMensaje()) {
                  <div class="banner" [class.error]="anulacionError()" role="status" aria-live="polite">{{ anulacionMensaje() }}</div>
                }
              </div>

              <div dialog-actions>
                <button class="btn-secondary" type="button" (click)="cancelarAnulacion()">Cancelar</button>
                  <button class="btn-danger" type="button" [disabled]="anulando() || !motivoAnulacion().trim()" (click)="confirmarAnulacion()">
                    {{ anulando() ? 'Anulando…' : 'Confirmar anulación' }}
                  </button>
                </div>
            </app-confirm-dialog>
          }
        </section>
      } @else {
        <div class="card">Cliente no encontrado.</div>
      }
    </div>
  `,
  styleUrl: './cliente-detalle.component.css',
})
export class ClienteDetalleComponent implements OnInit {
  cliente = signal<Cliente | null>(null);
  memberships = signal<MembresiaVista[]>([]);
  pagos = signal<PagoVista[]>([]);
  loading = signal(true);
  confirmandoDesactivacion = signal(false);
  anulandoPago = signal<PagoVista | null>(null);
  motivoAnulacion = signal('');
  anulando = signal(false);
  anulacionMensaje = signal('');
  anulacionError = signal(false);
  savingMembresia = signal(false);

  currentMembership = computed(() => {
    const list = this.memberships();
    return list.find(item => item.estado === 'activa') ?? list[0] ?? null;
  });

  totalPagado = computed(() => this.pagos().filter((pago) => !pago.anulado).reduce((sum, pago) => sum + pago.monto, 0));
  pagosAnulados = computed(() => this.pagos().filter((pago) => pago.anulado).length);

  iniciales = computed(() => {
    const c = this.cliente();
    if (!c) return 'CL';
    return ((c.nombre?.charAt(0) ?? '') + (c.apellido?.charAt(0) ?? '')).toUpperCase();
  });

  private id = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientes: ClientesService,
    private caja: CajaService,
    private membresias: MembresiasService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.cargar();
  }

  private async cargar() {
    if (!this.id) {
      this.loading.set(false);
      return;
    }

    const [cliente, memberships] = await Promise.all([
      this.clientes.obtener(this.id),
      this.membresias.obtenerMembresiasCliente(this.id),
    ]);

    const pagos = await this.clientes.obtenerPagos(this.id);

    this.cliente.set(cliente);
    this.memberships.set(memberships as MembresiaVista[]);
    this.pagos.set(pagos as PagoVista[]);
    this.loading.set(false);
  }

  private static readonly fechaFmt = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' });
  private static readonly fechaHoraFmt = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' });

  formatFecha(value?: string): string {
    if (!value) return '—';
    return ClienteDetalleComponent.fechaFmt.format(new Date(value));
  }

  formatFechaHora(value: string): string {
    return ClienteDetalleComponent.fechaHoraFmt.format(new Date(value));
  }

  metodoLabel(metodo: Pago['metodo']): string {
    switch (metodo) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta':
        return 'Tarjeta';
      case 'transferencia':
        return 'Transferencia';
    }
  }

  async desactivar() {
    if (!this.id) return;
    const { error } = await this.clientes.desactivar(this.id);
    if (!error) {
      this.confirmandoDesactivacion.set(false);
      this.toast.warning('Cliente desactivado', `${this.cliente()?.nombre} fue desactivado.`);
      await this.router.navigate(['/clientes']);
    }
  }

  solicitarDesactivacion() {
    this.confirmandoDesactivacion.set(true);
  }

  cancelarDesactivacion() {
    this.confirmandoDesactivacion.set(false);
  }

  abrirAnulacion(pago: PagoVista) {
    this.anulandoPago.set(pago);
    this.motivoAnulacion.set('');
    this.anulacionMensaje.set('');
    this.anulacionError.set(false);
  }

  cancelarAnulacion() {
    this.anulandoPago.set(null);
    this.motivoAnulacion.set('');
    this.anulacionMensaje.set('');
    this.anulacionError.set(false);
  }

  async confirmarAnulacion() {
    const pago = this.anulandoPago();
    const motivo = this.motivoAnulacion().trim();
    if (!pago || motivo.length < 5) {
      this.anulacionError.set(true);
      this.anulacionMensaje.set('Escribe un motivo válido de al menos 5 caracteres.');
      return;
    }

    this.anulando.set(true);
    this.anulacionMensaje.set('');
    const { error } = await this.caja.anularPago(pago.id, motivo);
    this.anulando.set(false);

    if (error) {
      this.anulacionError.set(true);
      this.anulacionMensaje.set(error);
      this.toast.error('No se pudo anular el pago', error);
      return;
    }

    this.anulacionError.set(false);
    this.anulacionMensaje.set('Pago anulado correctamente.');
    this.toast.warning('Pago anulado', 'El pago fue revertido y quedó auditado.');
    this.anulandoPago.set(null);
    this.motivoAnulacion.set('');
    await this.cargar();
  }

  async congelar() {
    const current = this.currentMembership();
    if (!current || this.savingMembresia()) return;
    this.savingMembresia.set(true);
    await this.membresias.congelarMembresia(current.id);
    this.savingMembresia.set(false);
    this.toast.info('Membresía congelada', 'La membresía quedó en estado congelada.');
    await this.cargar();
  }

  async reactivar() {
    const current = this.currentMembership();
    if (!current || this.savingMembresia()) return;
    this.savingMembresia.set(true);
    await this.membresias.reactivarMembresia(current.id);
    this.savingMembresia.set(false);
    this.toast.success('Membresía reactivada', 'La membresía volvió a estar activa.');
    await this.cargar();
  }
}
