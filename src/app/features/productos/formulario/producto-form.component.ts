import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos.service';
import { ProductoForm } from '../../../core/models';

@Component({
  selector: 'app-producto-form',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>{{ editando() ? 'Editar producto' : 'Nuevo producto' }}</h1>
          <p class="subtitle">{{ editando() ? 'Modifica los datos del producto' : 'Agrega un producto al catálogo' }}</p>
        </div>
        <a routerLink="/productos" class="btn-secondary">Volver</a>
      </div>

      @if (mensaje()) {
        <div class="banner" role="alert" [class.error]="isError()">{{ mensaje() }}</div>
      }

      <section class="card">
        <div class="grid">
          <div class="field span-2">
            <label for="pf-nombre">Nombre</label>
            <input id="pf-nombre" type="text" [(ngModel)]="form.nombre" name="nombre" required />
          </div>

          <div class="field span-2">
            <label for="pf-desc">Descripción</label>
            <input id="pf-desc" type="text" [(ngModel)]="form.descripcion" name="descripcion" />
          </div>

          <div class="field">
            <label for="pf-cat">Categoría</label>
            <div class="cat-row">
              <select id="pf-cat" [(ngModel)]="form.categoria_id" name="categoria_id">
                <option value="">Sin categoría</option>
                @for (cat of service.categorias(); track cat.id) {
                  <option [value]="cat.id">{{ cat.nombre }}</option>
                }
              </select>
              <button type="button" class="btn-secondary-sm" (click)="toggleNuevaCat()">+ Nueva</button>
            </div>
            @if (mostrarNuevaCat()) {
              <div class="nueva-cat">
                <label for="pf-nueva-cat" class="sr-only">Nombre de nueva categoría</label>
                <input id="pf-nueva-cat" type="text" [(ngModel)]="nuevaCat" name="nuevaCat" placeholder="Nombre de categoría" />
                <button type="button" class="btn-secondary-sm" (click)="crearCategoria()">Crear</button>
              </div>
            }
          </div>

          <div class="field">
            <label for="pf-precio">Precio (RD$)</label>
            <input id="pf-precio" type="number" min="0" step="0.01" [(ngModel)]="form.precio" name="precio" />
          </div>

          <div class="field">
            <label for="pf-stock">Stock inicial</label>
            <input id="pf-stock" type="number" min="0" [(ngModel)]="form.stock" name="stock" />
          </div>

          <div class="field">
            <label for="pf-min">Stock mínimo</label>
            <input id="pf-min" type="number" min="0" [(ngModel)]="form.stock_minimo" name="stock_minimo" />
          </div>

          @if (editando()) {
            <div class="field inline-check">
              <input id="pf-activo" type="checkbox" [(ngModel)]="form.activo" name="activo" />
              <label for="pf-activo">Activo</label>
            </div>
          }
        </div>

        <div class="actions">
          <button class="btn-primary" [disabled]="saving()" (click)="guardar()">
            {{ saving() ? 'Guardando…' : (editando() ? 'Guardar cambios' : 'Crear producto') }}
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: var(--content-form-max); margin: 0 auto; padding: var(--space-6) var(--space-4); display: grid; gap: var(--space-5); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); flex-wrap: wrap; }
    h1 { margin: 0; color: var(--text-primary); font-size: var(--text-5xl); font-weight: var(--font-bold); }
    .subtitle { margin: var(--space-1) 0 0; color: var(--text-secondary); font-size: var(--text-md); }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: var(--space-4); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
    .span-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: .4rem; }
    label { color: var(--text-secondary); font-size: var(--text-sm); font-weight: var(--font-medium); }
    input, select { background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--radius-input); padding: var(--space-3) var(--space-4); width: 100%; box-sizing: border-box; }
    input:focus-visible, select:focus-visible { border-color: var(--primary); box-shadow: var(--shadow-focus); outline: none; }
    .cat-row { display: flex; gap: var(--space-2); }
    .cat-row select { flex: 1; }
    .nueva-cat { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
    .nueva-cat input { flex: 1; }
    .inline-check { flex-direction: row; align-items: center; gap: var(--space-2); }
    .inline-check input { width: auto; }
    .actions { display: flex; justify-content: flex-end; margin-top: var(--space-4); }
    .btn-primary { background: var(--primary); color: var(--text-on-primary); border: 0; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-weight: var(--font-semibold); cursor: pointer; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-secondary { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-weight: var(--font-semibold); cursor: pointer; text-decoration: none; display: inline-flex; }
    .btn-secondary:hover { background: var(--bg-elevated); }
    .btn-secondary-sm { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); cursor: pointer; white-space: nowrap; }
    .btn-secondary-sm:hover { background: var(--bg-elevated); }
    .banner { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--color-success-banner); color: var(--color-success-text); }
    .banner.error { background: var(--color-danger-banner); color: var(--color-danger-text); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .span-2 { grid-column: auto; } .page { padding: var(--space-4); } }
  `],
})
export class ProductoFormComponent implements OnInit {
  editando = signal(false);
  saving = signal(false);
  mensaje = signal('');
  isError = signal(false);
  mostrarNuevaCat = signal(false);
  nuevaCat = '';
  private id = '';

  form: ProductoForm = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    stock_minimo: 5,
    categoria_id: '',
    activo: true,
  };

  constructor(
    public service: ProductosService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.service.cargarCategorias();
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.editando.set(true);
      const prod = await this.service.obtener(this.id);
      if (prod) {
        this.form = {
          nombre: prod.nombre,
          descripcion: prod.descripcion ?? '',
          precio: prod.precio,
          stock: prod.stock,
          stock_minimo: prod.stock_minimo,
          categoria_id: prod.categoria_id ?? '',
          activo: prod.activo,
        };
      }
    }
  }

  toggleNuevaCat() {
    this.mostrarNuevaCat.update(v => !v);
  }

  async crearCategoria() {
    if (!this.nuevaCat.trim()) return;
    const { data, error } = await this.service.crearCategoria({ nombre: this.nuevaCat.trim() });
    if (error) {
      this.isError.set(true);
      this.mensaje.set(error);
      return;
    }
    await this.service.cargarCategorias();
    if (data) this.form.categoria_id = data.id;
    this.nuevaCat = '';
    this.mostrarNuevaCat.set(false);
  }

  async guardar() {
    if (!this.form.nombre.trim()) {
      this.isError.set(true);
      this.mensaje.set('El nombre es obligatorio.');
      return;
    }

    this.saving.set(true);
    const payload = { ...this.form, categoria_id: this.form.categoria_id || undefined };
    const { error } = this.editando()
      ? await this.service.actualizar(this.id, payload)
      : await this.service.crear(payload);

    this.saving.set(false);

    if (error) {
      this.isError.set(true);
      this.mensaje.set(error);
      return;
    }

    await this.router.navigate(['/productos']);
  }
}
