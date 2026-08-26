import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Plan, PlanForm } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

type PlanEditable = Plan;

@Component({
  selector: 'app-config-membresias',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, SkeletonListComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>Membresías</h2>
          <p class="subtitle">Planes disponibles y su mantenimiento.</p>
        </div>
        <button class="btn-primary" type="button" (click)="abrirNuevo()">+ Nuevo plan</button>
      </div>

      @if (message()) {
        <div class="banner" [class.error]="isError()" role="status" aria-live="polite">{{ message() }}</div>
      }

      @if (composerAbierto()) {
        <section class="card composer">
          <div class="composer-head">
            <div>
              <h3>{{ editingId() ? 'Editar plan' : 'Nuevo plan' }}</h3>
              <p class="subtitle">Se guarda un solo plan a la vez para mantener claridad operativa.</p>
            </div>
            <button class="btn-secondary" type="button" (click)="cerrarComposer()">Cerrar</button>
          </div>

          <div class="grid">
            <div class="field">
              <label for="plan-nombre">Nombre</label>
              <input id="plan-nombre" [(ngModel)]="form.nombre" name="nombre" />
            </div>
            <div class="field">
              <label for="plan-periodo">Periodo</label>
              <select id="plan-periodo" [(ngModel)]="form.periodo" name="periodo">
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div class="field">
              <label for="plan-dias">Días</label>
              <input id="plan-dias" type="number" [(ngModel)]="form.duracion_dias" name="duracion_dias" />
            </div>
            <div class="field">
              <label for="plan-precio">Precio</label>
              <input id="plan-precio" type="number" step="0.01" [(ngModel)]="form.precio" name="precio" />
            </div>
            <div class="field span-2">
              <label for="plan-descripcion">Descripción</label>
              <input id="plan-descripcion" [(ngModel)]="form.descripcion" name="descripcion" />
            </div>
            <label class="check span-2" for="plan-activo">
              <input id="plan-activo" type="checkbox" [(ngModel)]="form.activo" name="activo" />
              <span>Activo</span>
            </label>
          </div>

          <div class="actions">
            <button class="btn-secondary" type="button" (click)="cerrarComposer()">Cancelar</button>
            <button class="btn-primary" type="button" [disabled]="saving()" (click)="guardar()">
              {{ saving() ? 'Guardando…' : 'Guardar plan' }}
            </button>
          </div>
        </section>
      }

      @if (loading()) {
        <div class="card loading-card" aria-busy="true" aria-live="polite">
          <app-skeleton-list [items]="[
            { width: '50%', height: '1.3rem' },
            { width: '100%', height: '2.8rem' },
            { width: '100%', height: '2.8rem' },
            { width: '100%', height: '2.8rem' }
          ]"></app-skeleton-list>
        </div>
      } @else {
        <div class="card table-wrap">
          <table aria-label="Planes de membresía">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Periodo</th>
                <th scope="col">Días</th>
                <th scope="col">Precio</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (plan of planes(); track plan.id) {
                <tr>
                  <td>{{ plan.nombre }}</td>
                  <td>{{ plan.periodo }}</td>
                  <td>{{ plan.duracion_dias }}</td>
                  <td>{{ plan.precio | currencyDop }}</td>
                  <td>
                    @if (plan.activo) {
                      <app-status-badge tone="success" label="Activo"></app-status-badge>
                    } @else {
                      <app-status-badge tone="neutral" label="Inactivo"></app-status-badge>
                    }
                  </td>
                  <td>
                    <div class="actions-inline">
                      <button class="link" type="button" (click)="editar(plan)">Editar</button>
                      <button class="link" type="button" (click)="cambiarEstado(plan)">{{ plan.activo ? 'Desactivar' : 'Activar' }}</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">No hay planes</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styleUrl: './config-membresias.component.css',
})
export class ConfigMembresiasComponent implements OnInit {
  planes = signal<PlanEditable[]>([]);
  loading = signal(true);
  saving = signal(false);
  composerAbierto = signal(false);
  editingId = signal<string | null>(null);
  message = signal('');
  isError = signal(false);
  form: PlanForm & { activo: boolean } = { nombre: '', periodo: 'mensual', duracion_dias: 30, precio: 0, descripcion: '', activo: true };

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  abrirNuevo(): void {
    this.editingId.set(null);
    this.form = { nombre: '', periodo: 'mensual', duracion_dias: 30, precio: 0, descripcion: '', activo: true };
    this.composerAbierto.set(true);
  }

  editar(plan: PlanEditable): void {
    this.editingId.set(plan.id);
    this.form = {
      nombre: plan.nombre,
      periodo: plan.periodo,
      duracion_dias: plan.duracion_dias,
      precio: plan.precio,
      descripcion: plan.descripcion ?? '',
      activo: plan.activo,
    };
    this.composerAbierto.set(true);
  }

  cerrarComposer(): void {
    this.composerAbierto.set(false);
  }

  async cargar(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('planes')
      .select('*')
      .eq('gimnasio_id', gimnasioId)
      .order('created_at', { ascending: false });

    this.planes.set((data as PlanEditable[]) ?? []);
    this.loading.set(false);
  }

  async guardar(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;

    this.saving.set(true);
    const payload = { ...this.form, gimnasio_id: gimnasioId };
    const editingId = this.editingId();
    const result = editingId
      ? await this.supabase.client.from('planes').update(payload).eq('id', editingId)
      : await this.supabase.client.from('planes').insert(payload);

    this.saving.set(false);

    if (result.error) {
      this.isError.set(true);
      this.message.set(result.error.message);
      return;
    }

    this.isError.set(false);
    this.message.set(editingId ? 'Plan actualizado.' : 'Plan creado.');
    this.cerrarComposer();
    await this.cargar();
  }

  async cambiarEstado(plan: PlanEditable): Promise<void> {
    const { error } = await this.supabase.client.from('planes').update({ activo: !plan.activo }).eq('id', plan.id);
    if (error) {
      this.isError.set(true);
      this.message.set(error.message);
      return;
    }

    this.isError.set(false);
    this.message.set(plan.activo ? 'Plan desactivado.' : 'Plan activado.');
    await this.cargar();
  }
}
