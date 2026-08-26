import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientesService } from '../../../core/services/clientes.service';
import { Cliente, ClienteForm } from '../../../core/models';

@Component({
  selector: 'app-cliente-form',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>{{ isEditMode() ? 'Editar cliente' : 'Nuevo cliente' }}</h1>
          <p class="subtitle">{{ isEditMode() ? 'Actualiza la información registrada' : 'Registra un nuevo cliente' }}</p>
        </div>
        <a routerLink="/clientes" class="btn-secondary">Volver</a>
      </div>

      @if (message()) {
        <div class="banner" [class.ok]="!isError()" [class.error]="isError()">
          {{ message() }}
        </div>
      }

      <form #formRef="ngForm" class="card" (ngSubmit)="guardar()">
        <div class="grid">
          <div class="field span-2 photo-block">
            <label>Foto</label>
            <div class="photo-row">
              <div class="photo-preview">
                @if (photoPreview()) {
                  <img [src]="photoPreview()!" alt="Vista previa" />
                } @else if (clienteExistente()?.foto_url) {
                  <img [src]="clienteExistente()?.foto_url!" alt="Foto del cliente" />
                } @else {
                  <span>{{ iniciales() }}</span>
                }
              </div>
              <div>
                <input type="file" accept="image/*" (change)="onFileSelected($event)" />
                <p class="help">PNG/JPG. Se sube al guardar.</p>
              </div>
            </div>
          </div>

          <div class="field">
            <label for="cedula">Cédula</label>
            <input id="cedula" name="cedula" [(ngModel)]="form.cedula" (input)="form.cedula = formatCedula(form.cedula || '')" placeholder="000-0000000-0" />
          </div>

          <div class="field">
            <label for="sexo">Sexo</label>
            <select id="sexo" name="sexo" [(ngModel)]="form.sexo">
              <option [ngValue]="undefined">Seleccione</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>

          <div class="field">
            <label for="nombre">Nombre</label>
            <input id="nombre" name="nombre" [(ngModel)]="form.nombre" required />
            @if (formRef.submitted && !form.nombre.trim()) { <span class="error-text">El nombre es obligatorio</span> }
          </div>

          <div class="field">
            <label for="apellido">Apellido</label>
            <input id="apellido" name="apellido" [(ngModel)]="form.apellido" required />
            @if (formRef.submitted && !form.apellido.trim()) { <span class="error-text">El apellido es obligatorio</span> }
          </div>

          <div class="field">
            <label for="fecha_nacimiento">Fecha nacimiento</label>
            <input id="fecha_nacimiento" name="fecha_nacimiento" type="date" [(ngModel)]="form.fecha_nacimiento" />
          </div>

          <div class="field">
            <label for="telefono">Teléfono</label>
            <input id="telefono" name="telefono" [(ngModel)]="form.telefono" />
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" [(ngModel)]="form.email" />
          </div>

          <div class="field">
            <label for="contacto_emergencia">Contacto emergencia</label>
            <input id="contacto_emergencia" name="contacto_emergencia" [(ngModel)]="form.contacto_emergencia" />
          </div>

          <div class="field">
            <label for="telefono_emergencia">Teléfono emergencia</label>
            <input id="telefono_emergencia" name="telefono_emergencia" [(ngModel)]="form.telefono_emergencia" />
          </div>

          <div class="field span-2">
            <label for="direccion">Dirección</label>
            <input id="direccion" name="direccion" [(ngModel)]="form.direccion" />
          </div>

          <div class="field span-2">
            <label for="notas">Notas</label>
            <textarea id="notas" name="notas" rows="4" [(ngModel)]="form.notas"></textarea>
          </div>
        </div>

        <div class="actions">
          <button type="submit" class="btn-primary" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : 'Guardar cliente' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.25rem; }
    h1 { margin: 0; color: var(--text-primary, #f1f5f9); font-size: var(--text-5xl); }
    .subtitle { margin: .25rem 0 0; color: var(--text-secondary, #94a3b8); }
    .card { background: var(--bg-card, #1e293b); border: 1px solid var(--border, #334155); border-radius: 16px; padding: 1.25rem; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .span-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: .45rem; }
    label { color: var(--text-secondary, #94a3b8); font-size: .85rem; }
    input, select, textarea { width: 100%; box-sizing: border-box; border-radius: 10px; border: 1px solid var(--border, #334155); background: var(--bg-primary, #0f172a); color: var(--text-primary, #f1f5f9); padding: .8rem .9rem; outline: none; }
    input:focus, select:focus, textarea:focus { border-color: var(--primary, #3b82f6); box-shadow: var(--shadow-focus); }
    .help { color: var(--text-secondary, #94a3b8); font-size: .8rem; margin: .4rem 0 0; }
    .error-text { color: var(--color-danger-text); font-size: .78rem; }
    .banner { border-radius: 10px; padding: .85rem 1rem; margin-bottom: 1rem; border: 1px solid transparent; }
    .banner.ok { background: var(--color-success-banner); color: var(--color-success-text); border-color: var(--color-success-subtle); }
    .banner.error { background: var(--color-danger-banner); color: var(--color-danger-text); border-color: var(--color-danger-subtle); }
    .actions { display: flex; justify-content: flex-end; margin-top: 1.25rem; }
    .btn-primary, .btn-secondary { border: 0; border-radius: 10px; padding: .8rem 1.1rem; text-decoration: none; font-weight: 600; cursor: pointer; }
    .btn-primary { background: var(--primary, #3b82f6); color: var(--text-on-primary); }
    .btn-secondary { background: transparent; color: var(--text-secondary, #94a3b8); border: 1px solid var(--border, #334155); }
    .photo-row { display: flex; gap: 1rem; align-items: center; }
    .photo-preview { width: 92px; height: 92px; border-radius: 18px; background: var(--primary-subtle); border: 1px dashed var(--border, #334155); display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--text-secondary, #94a3b8); font-weight: 700; }
    .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
    @media (max-width: 768px) { .grid, .span-2 { grid-template-columns: 1fr; grid-column: auto; } .header { flex-direction: column; } .photo-row { align-items: flex-start; } }
  `],
})
export class ClienteFormComponent implements OnInit {
  form: ClienteForm = { nombre: '', apellido: '' };
  clienteExistente = signal<Cliente | null>(null);
  isEditMode = signal(false);
  saving = signal(false);
  isError = signal(false);
  message = signal('');
  photoPreview = signal<string | null>(null);
  private selectedFile: File | null = null;

  iniciales = computed(() => {
    const nombre = this.form.nombre.trim().charAt(0) || 'C';
    const apellido = this.form.apellido.trim().charAt(0) || 'S';
    return (nombre + apellido).toUpperCase();
  });

  private clienteId: string | null = null;

  constructor(
    private clientes: ClientesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.clienteId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.clienteId);

    if (this.clienteId) {
      const cliente = await this.clientes.obtener(this.clienteId);
      if (cliente) {
        this.clienteExistente.set(cliente);
        this.form = {
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          sexo: cliente.sexo,
          fecha_nacimiento: cliente.fecha_nacimiento,
          telefono: cliente.telefono,
          email: cliente.email,
          direccion: cliente.direccion,
          contacto_emergencia: cliente.contacto_emergencia,
          telefono_emergencia: cliente.telefono_emergencia,
          notas: cliente.notas,
        };
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;

    if (!file) {
      this.photoPreview.set(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.photoPreview.set(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  }

  formatCedula(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 10);
    const part3 = digits.slice(10, 11);
    return [part1, part2, part3].filter(Boolean).join('-');
  }

  async guardar() {
    if (!this.form.nombre?.trim() || !this.form.apellido?.trim()) {
      this.isError.set(true);
      this.message.set('Completa los campos obligatorios.');
      return;
    }

    this.saving.set(true);
    this.message.set('');

    const payload: ClienteForm = {
      ...this.form,
      cedula: this.form.cedula?.trim() || undefined,
      nombre: this.form.nombre.trim(),
      apellido: this.form.apellido.trim(),
    };

    let savedId: string | null = this.clienteId;

    if (this.clienteId) {
      const result = await this.clientes.actualizar(this.clienteId, payload);
      if (result.error) {
        this.isError.set(true);
        this.message.set(result.error);
        this.saving.set(false);
        return;
      }
    } else {
      const result = await this.clientes.crear(payload);
      if (result.error) {
        this.isError.set(true);
        this.message.set(result.error);
        this.saving.set(false);
        return;
      }

      savedId = result.data?.id ?? null;
    }
    if (savedId && this.selectedFile) {
      await this.clientes.subirFoto(savedId, this.selectedFile);
    }

    this.isError.set(false);
    this.message.set('Cliente guardado correctamente.');
    await this.router.navigate(['/clientes']);
  }
}
