import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../../core/services/productos.service';
import { VentasService } from '../../core/services/ventas.service';
import { CajaService } from '../../core/services/caja.service';
import { Producto, ItemVenta, MetodoPago, Venta } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyDopPipe } from '../../shared/pipes/currency-dop.pipe';

@Component({
  selector: 'app-punto-venta',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent, StatusBadgeComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Punto de Venta</h1>
          <p class="subtitle">Selecciona productos y registra la venta</p>
        </div>
        <a routerLink="/caja" class="btn-secondary">Volver a caja</a>
      </div>

      @if (!turnoAbierto()) {
        <div class="card warning">No hay turno abierto. <a routerLink="/caja" class="link">Abrir caja</a></div>
      } @else {
        <div class="pos-layout">
          <!-- Catálogo de productos -->
          <section class="catalog">
            <div class="catalog-header">
              <label for="pos-buscar" class="sr-only">Buscar producto</label>
              <input id="pos-buscar" type="search" placeholder="Buscar producto…" [ngModel]="termino()" (ngModelChange)="termino.set($event)" name="termino" class="search" />
              <div class="cat-tabs" role="group" aria-label="Filtrar por categoría">
                <button
                  class="cat-tab"
                  [class.active]="categoriaFiltro() === ''"
                  (click)="setCatFiltro('')"
                  [attr.aria-pressed]="categoriaFiltro() === ''"
                >Todos</button>
                @for (cat of service.categorias(); track cat.id) {
                  <button
                    class="cat-tab"
                    [class.active]="categoriaFiltro() === cat.id"
                    (click)="setCatFiltro(cat.id)"
                    [attr.aria-pressed]="categoriaFiltro() === cat.id"
                  >{{ cat.nombre }}</button>
                }
              </div>
            </div>

            <div class="prod-grid" role="list" aria-label="Productos disponibles">
              @for (prod of productosFiltrados(); track prod.id) {
                <button
                  class="prod-card"
                  role="listitem"
                  [disabled]="prod.stock === 0"
                  (click)="agregarAlCarrito(prod)"
                  [attr.aria-label]="prod.nombre + ', ' + (prod.precio | currencyDop) + (prod.stock === 0 ? ', sin stock' : '')"
                >
                  <span class="prod-nombre">{{ prod.nombre }}</span>
                  <span class="prod-precio">{{ prod.precio | currencyDop }}</span>
                  <span class="prod-stock" [class.sin-stock]="prod.stock === 0">
                    {{ prod.stock === 0 ? 'Sin stock' : 'Stock: ' + prod.stock }}
                  </span>
                </button>
              } @empty {
                <p class="empty">Sin productos disponibles</p>
              }
            </div>
          </section>

          <!-- Carrito -->
          <aside class="cart">
            <h2>Carrito</h2>

            @if (carrito().length === 0) {
              <p class="cart-empty">Selecciona productos del catálogo</p>
            } @else {
              <div class="cart-items">
                @for (item of carrito(); track item.producto.id) {
                  <div class="cart-item">
                    <div class="item-info">
                      <span class="item-nombre">{{ item.producto.nombre }}</span>
                      <span class="item-precio">{{ item.producto.precio | currencyDop }} c/u</span>
                    </div>
                    <div class="item-qty">
                      <button class="qty-btn" (click)="cambiarCantidad(item, -1)" aria-label="Reducir cantidad">−</button>
                      <span class="qty-val">{{ item.cantidad }}</span>
                      <button class="qty-btn" (click)="cambiarCantidad(item, 1)" [disabled]="item.cantidad >= item.producto.stock" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <span class="item-subtotal">{{ (item.producto.precio * item.cantidad) | currencyDop }}</span>
                    <button class="btn-remove" (click)="quitarItem(item)" aria-label="Quitar {{ item.producto.nombre }}">✕</button>
                  </div>
                }
              </div>

              <div class="cart-footer">
                <div class="total-row">
                  <span>Total</span>
                  <strong>{{ total() | currencyDop }}</strong>
                </div>

                <div class="field">
                  <label for="pos-metodo">Método de pago</label>
                  <select id="pos-metodo" [(ngModel)]="metodo" name="metodo">
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                @if (mensaje()) {
                  <div class="banner" role="alert" [class.error]="isError()">{{ mensaje() }}</div>
                }

                <button class="btn-cobrar" [disabled]="saving()" (click)="cobrar()">
                  {{ saving() ? 'Procesando…' : 'Cobrar ' + (total() | currencyDop) }}
                </button>

                @if (ventasRecientes().length > 0) {
                  <div class="sales-history">
                    <div class="sales-history-head">
                      <h3>Ventas recientes</h3>
                      <span>{{ ventasRecientes().length }}</span>
                    </div>

                    <div class="sales-list">
                      @for (venta of ventasRecientes(); track venta.id) {
                        <div class="sale-item">
                          <div>
                            <strong>{{ formatFechaHora(venta.fecha) }}</strong>
                            <p>{{ venta.detalles?.length }} producto{{ venta.detalles?.length !== 1 ? 's' : '' }} · {{ venta.metodo }}</p>
                          </div>
                          <div class="sale-actions">
                            <span class="sale-total">{{ venta.total | currencyDop }}</span>
                            @if (!venta.anulado) {
                              <button class="btn-link danger" type="button" (click)="solicitarAnulacion(venta)">Anular</button>
                            } @else {
                              <app-status-badge tone="danger" label="Anulada"></app-status-badge>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </aside>
        </div>
      }
    </div>

    @if (ventaAnulando()) {
      <app-confirm-dialog
        title="Anular venta POS"
        description="Se restituirá el stock de los productos vendidos."
        cancelLabel="Cancelar anulación"
        (cancel)="cancelarAnulacion()"
      >
        <div dialog-body>
          <div class="anulacion-summary">
            <div><span class="label">Fecha</span><strong>{{ formatFechaHora(ventaAnulando()!.fecha) }}</strong></div>
            <div><span class="label">Total</span><strong>{{ ventaAnulando()!.total | currencyDop }}</strong></div>
          </div>

          <div class="field">
            <label for="motivo-anulacion-venta">Motivo de anulación</label>
            <textarea id="motivo-anulacion-venta" rows="3" [ngModel]="motivoAnulacionVenta()" (ngModelChange)="motivoAnulacionVenta.set($event)" name="motivoAnulacionVenta"></textarea>
          </div>

          @if (anulacionMensaje()) {
            <div class="banner" [class.error]="anulacionError()" role="status" aria-live="polite">{{ anulacionMensaje() }}</div>
          }
        </div>

        <div dialog-actions>
          <button class="btn-secondary" type="button" (click)="cancelarAnulacion()">Cancelar</button>
          <button class="btn-danger" type="button" [disabled]="anulandoVenta() || !motivoAnulacionVenta().trim()" (click)="confirmarAnulacion()">
              {{ anulandoVenta() ? 'Anulando…' : 'Confirmar anulación' }}
          </button>
        </div>
      </app-confirm-dialog>
    }
  `,
  styleUrl: './punto-venta.component.css',
})
export class PuntoVentaComponent implements OnInit {
  turnoAbierto = signal(false);
  carrito = signal<ItemVenta[]>([]);
  ventasRecientes = signal<Venta[]>([]);
  saving = signal(false);
  mensaje = signal('');
  isError = signal(false);
  metodo: MetodoPago = 'efectivo';
  termino = signal('');
  ventaAnulando = signal<Venta | null>(null);
  motivoAnulacionVenta = signal('');
  anulandoVenta = signal(false);
  anulacionMensaje = signal('');
  anulacionError = signal(false);
  private _categoriaFiltro = signal('');
  categoriaFiltro = this._categoriaFiltro.asReadonly();

  total = computed(() => this.carrito().reduce((s, i) => s + i.producto.precio * i.cantidad, 0));

  productosFiltrados = computed(() => {
    const term = this.termino().toLowerCase();
    const cat = this._categoriaFiltro();
    return this.service.productos().filter(p => {
      const matchNombre = !term || p.nombre.toLowerCase().includes(term);
      const matchCat = !cat || p.categoria_id === cat;
      return matchNombre && matchCat;
    });
  });

  constructor(
    public service: ProductosService,
    private ventas: VentasService,
    private caja: CajaService,
    private toast: ToastService,
  ) {}

  async ngOnInit() {
    await Promise.all([
      this.service.cargarProductos(),
      this.service.cargarCategorias(),
      this.caja.cargarTurnoActual(),
    ]);
    this.turnoAbierto.set(this.caja.hayTurnoAbierto());
    if (this.caja.turnoActual()?.id) {
      this.ventasRecientes.set(await this.ventas.obtenerVentasTurno(this.caja.turnoActual()!.id));
    }
  }

  setCatFiltro(id: string) {
    this._categoriaFiltro.set(id);
  }

  agregarAlCarrito(prod: Producto) {
    const current = this.carrito();
    const idx = current.findIndex(i => i.producto.id === prod.id);
    if (idx >= 0) {
      const item = current[idx];
      if (item.cantidad < prod.stock) {
        this.carrito.update(list =>
          list.map((i, n) => n === idx ? { ...i, cantidad: i.cantidad + 1 } : i)
        );
      }
    } else {
      this.carrito.update(list => [...list, { producto: prod, cantidad: 1 }]);
    }
  }

  cambiarCantidad(item: ItemVenta, delta: number) {
    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
      this.quitarItem(item);
      return;
    }
    if (nueva > item.producto.stock) return;
    this.carrito.update(list =>
      list.map(i => i.producto.id === item.producto.id ? { ...i, cantidad: nueva } : i)
    );
  }

  quitarItem(item: ItemVenta) {
    this.carrito.update(list => list.filter(i => i.producto.id !== item.producto.id));
  }

  async cobrar() {
    if (this.carrito().length === 0) return;
    this.saving.set(true);
    this.mensaje.set('');

    const { error } = await this.ventas.registrarVenta({
      items: this.carrito(),
      metodo: this.metodo,
    });

    this.saving.set(false);

    if (error) {
      this.isError.set(true);
      this.mensaje.set(error);
      this.toast.error('No se pudo registrar la venta', error);
      return;
    }

    this.isError.set(false);
    this.mensaje.set('Venta registrada correctamente.');
    this.toast.success('Venta registrada', `Se cobró ${this.formatCurrency(this.total())}.`);
    this.carrito.set([]);
    await this.service.cargarProductos();
    if (this.caja.turnoActual()?.id) {
      this.ventasRecientes.set(await this.ventas.obtenerVentasTurno(this.caja.turnoActual()!.id));
    }
  }

  formatFechaHora(value: string): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  private static readonly currencyFmt = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });

  formatCurrency(value: number): string {
    return PuntoVentaComponent.currencyFmt.format(value);
  }

  solicitarAnulacion(venta: Venta) {
    this.ventaAnulando.set(venta);
    this.motivoAnulacionVenta.set('');
    this.anulacionMensaje.set('');
    this.anulacionError.set(false);
  }

  cancelarAnulacion() {
    this.ventaAnulando.set(null);
    this.motivoAnulacionVenta.set('');
    this.anulacionMensaje.set('');
    this.anulacionError.set(false);
  }

  async confirmarAnulacion() {
    const venta = this.ventaAnulando();
    const motivo = this.motivoAnulacionVenta().trim();
    if (!venta || motivo.length < 5) {
      this.anulacionError.set(true);
      this.anulacionMensaje.set('Escribe un motivo válido de al menos 5 caracteres.');
      return;
    }

    this.anulandoVenta.set(true);
    this.anulacionMensaje.set('');
    const { error } = await this.ventas.anularVenta(venta.id, motivo);
    this.anulandoVenta.set(false);

    if (error) {
      this.anulacionError.set(true);
      this.anulacionMensaje.set(error);
      this.toast.error('No se pudo anular la venta', error);
      return;
    }

    this.anulacionError.set(false);
    this.anulacionMensaje.set('Venta anulada correctamente.');
    this.toast.warning('Venta anulada', 'El stock fue restituido automáticamente.');
    this.ventaAnulando.set(null);
    this.motivoAnulacionVenta.set('');
    if (this.caja.turnoActual()?.id) {
      this.ventasRecientes.set(await this.ventas.obtenerVentasTurno(this.caja.turnoActual()!.id));
    }
    await this.service.cargarProductos();
  }
}
