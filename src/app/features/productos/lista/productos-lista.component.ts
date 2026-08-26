import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos.service';
import { Producto, TipoMovimientoInv } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

@Component({
  selector: 'app-productos-lista',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent, SkeletonListComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Productos</h1>
          <p class="subtitle">Inventario y catálogo de productos</p>
        </div>
        <div class="header-actions">
          <a routerLink="/productos/inventario" class="btn-secondary">Historial inventario</a>
          <a routerLink="/productos/nuevo" class="btn-primary">Nuevo producto</a>
        </div>
      </div>

      @if (mensaje()) {
        <div class="banner" role="alert" [class.error]="isError()">{{ mensaje() }}</div>
      }

      <section class="card filters">
        <div class="field">
          <label for="prod-buscar" class="sr-only">Buscar producto</label>
          <input id="prod-buscar" type="search" placeholder="Buscar por nombre…" [ngModel]="termino()" (ngModelChange)="termino.set($event)" name="termino" />
        </div>
        <div class="field">
          <label for="prod-cat" class="sr-only">Filtrar por categoría</label>
          <select id="prod-cat" [ngModel]="categoriaFiltro()" (ngModelChange)="categoriaFiltro.set($event)" name="categoriaFiltro">
            <option value="">Todas las categorías</option>
            @for (cat of service.categorias(); track cat.id) {
              <option [value]="cat.id">{{ cat.nombre }}</option>
            }
          </select>
        </div>
      </section>

      @if (service.loading()) {
        <div class="card loading-card">
          <app-skeleton-list [items]="[
            { width: '40%', height: '1.4rem' },
            { width: '100%', height: '3rem' },
            { width: '100%', height: '3rem' },
            { width: '100%', height: '3rem' }
          ]"></app-skeleton-list>
        </div>
      }

      <section class="card">
        <div class="table-wrap">
          <table aria-label="Lista de productos">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Categoría</th>
                <th scope="col">Precio</th>
                <th scope="col">Stock</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (prod of productosFiltrados(); track prod.id) {
                <tr>
                  <td>
                    <strong>{{ prod.nombre }}</strong>
                    @if (prod.descripcion) { <p class="desc">{{ prod.descripcion }}</p> }
                  </td>
                  <td>{{ prod.categoria?.nombre || '—' }}</td>
                  <td>{{ prod.precio | currencyDop }}</td>
                  <td>
                    <span class="stock-badge" [class.low]="prod.stock <= prod.stock_minimo">
                      {{ prod.stock }}
                    </span>
                    @if (prod.stock <= prod.stock_minimo) {
                      <span class="low-label">Stock bajo</span>
                    }
                  </td>
                  <td class="actions-cell">
                    <a [routerLink]="['/productos', prod.id, 'editar']" class="btn-link" [attr.aria-label]="'Editar ' + prod.nombre">Editar</a>
                    <button class="btn-link" (click)="abrirEntrada(prod)" [attr.aria-label]="'Registrar entrada de ' + prod.nombre">+ Stock</button>
                    <button class="btn-link danger" (click)="solicitarDesactivacion(prod)" [attr.aria-label]="'Desactivar ' + prod.nombre">Desactivar</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">No hay productos</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>

    @if (productoEntrada()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="'Entrada de stock: ' + productoEntrada()!.nombre" (click)="cerrarEntrada()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>+ Stock: {{ productoEntrada()!.nombre }}</h2>
          <p class="modal-stock">Stock actual: <strong>{{ productoEntrada()!.stock }}</strong></p>

          <div class="field">
            <label for="inv-tipo">Tipo</label>
            <select id="inv-tipo" [(ngModel)]="entradaTipo" name="entradaTipo">
              <option value="entrada">Entrada (suma)</option>
              <option value="ajuste">Ajuste (fija el valor)</option>
              <option value="merma">Merma (resta)</option>
            </select>
          </div>

          <div class="field">
            <label for="inv-cant">Cantidad</label>
            <input id="inv-cant" type="number" min="1" [(ngModel)]="entradaCantidad" name="entradaCantidad" />
          </div>

          <div class="field">
            <label for="inv-notas">Notas (opcional)</label>
            <input id="inv-notas" type="text" [(ngModel)]="entradaNotas" name="entradaNotas" />
          </div>

          @if (mensajeModal()) {
            <div class="banner" role="alert" [class.error]="isErrorModal()">{{ mensajeModal() }}</div>
          }

          <div class="modal-actions">
            <button class="btn-secondary" type="button" (click)="cerrarEntrada()">Cancelar</button>
            <button class="btn-primary" type="button" [disabled]="savingEntrada()" (click)="guardarEntrada()">
                {{ savingEntrada() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (productoDesactivando()) {
      <app-confirm-dialog
        title="Desactivar producto"
        description="Se ocultará el producto del catálogo y de POS."
        cancelLabel="Cancelar desactivación"
        (cancel)="cancelarDesactivacion()"
      >
        <div dialog-body>
          <p class="confirm-text">{{ productoDesactivando()!.nombre }}</p>
          <p class="confirm-subtext">Esta acción no borra datos históricos.</p>
        </div>

        <div dialog-actions>
          <button class="btn-secondary" type="button" (click)="cancelarDesactivacion()">Cancelar</button>
          <button class="btn-danger" type="button" (click)="confirmarDesactivacion()">Desactivar</button>
        </div>
      </app-confirm-dialog>
    }
  `,
  styleUrl: './productos-lista.component.css',
})
export class ProductosListaComponent implements OnInit {
  termino = signal('');
  categoriaFiltro = signal('');
  mensaje = signal('');
  isError = signal(false);
  productoDesactivando = signal<Producto | null>(null);

  // Inventario modal
  productoEntrada = signal<Producto | null>(null);
  entradaTipo: TipoMovimientoInv = 'entrada';
  entradaCantidad = 1;
  entradaNotas = '';
  savingEntrada = signal(false);
  mensajeModal = signal('');
  isErrorModal = signal(false);

  productosFiltrados = computed(() => {
    const term = this.termino().toLowerCase();
    const cat = this.categoriaFiltro();
    return this.service.productos().filter(p => {
      const matchNombre = !term || p.nombre.toLowerCase().includes(term);
      const matchCat = !cat || p.categoria_id === cat;
      return matchNombre && matchCat;
    });
  });

  constructor(public service: ProductosService, private toast: ToastService) {}

  async ngOnInit() {
    await Promise.all([this.service.cargarProductos(), this.service.cargarCategorias()]);
  }

  abrirEntrada(prod: Producto) {
    this.productoEntrada.set(prod);
    this.entradaTipo = 'entrada';
    this.entradaCantidad = 1;
    this.entradaNotas = '';
    this.mensajeModal.set('');
  }

  cerrarEntrada() {
    this.productoEntrada.set(null);
  }

  async guardarEntrada() {
    const prod = this.productoEntrada();
    if (!prod || this.entradaCantidad < 1) return;
    this.savingEntrada.set(true);
    this.mensajeModal.set('');

    const { error } = await this.service.entradaInventario({
      producto_id: prod.id,
      cantidad: this.entradaCantidad,
      tipo: this.entradaTipo,
      notas: this.entradaNotas || undefined,
    });

    this.savingEntrada.set(false);

    if (error) {
      this.isErrorModal.set(true);
      this.mensajeModal.set(error);
      this.toast.error('No se pudo actualizar el stock', error);
      return;
    }

    this.cerrarEntrada();
    this.isError.set(false);
    this.mensaje.set(`Stock de "${prod.nombre}" actualizado.`);
    this.toast.success('Stock actualizado', `Se registró el movimiento para ${prod.nombre}.`);
    await this.service.cargarProductos();
  }

  solicitarDesactivacion(prod: Producto) {
    this.productoDesactivando.set(prod);
  }

  cancelarDesactivacion() {
    this.productoDesactivando.set(null);
  }

  async confirmarDesactivacion() {
    const prod = this.productoDesactivando();
    if (!prod) return;
    this.productoDesactivando.set(null);

    const { error } = await this.service.desactivar(prod.id);
    if (error) {
      this.isError.set(true);
      this.mensaje.set(error);
      this.toast.error('No se pudo desactivar el producto', error);
    } else {
      this.isError.set(false);
      this.mensaje.set(`"${prod.nombre}" desactivado.`);
      this.toast.warning('Producto desactivado', `${prod.nombre} ya no aparece en el catálogo.`);
      await this.service.cargarProductos();
    }
  }
}
