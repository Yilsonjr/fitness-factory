import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigSistema, Gimnasio } from '../../../core/models';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';

@Component({
  selector: 'app-config-general',
  standalone: true,
  imports: [FormsModule, SkeletonListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>General</h2>
          <p class="subtitle">Datos institucionales del gimnasio.</p>
        </div>
      </div>

        @if (loading()) {
        <div class="card loading-card" aria-busy="true" aria-live="polite">
          <app-skeleton-list [items]="[
            { width: '65%', height: '1.3rem' },
            { width: '100%', height: '3rem' },
            { width: '100%', height: '3rem' },
            { width: '100%', height: '3rem' }
          ]"></app-skeleton-list>
        </div>
      } @else {
        @if (message()) {
          <div class="banner" [class.error]="isError()" role="status" aria-live="polite">{{ message() }}</div>
        }

        <section class="card">
          <div class="grid">
            <div class="field span-2">
              <label for="cfg-nombre-comercial">Nombre comercial</label>
              <input id="cfg-nombre-comercial" [(ngModel)]="config.nombre_comercial" name="nombre_comercial" />
            </div>
            <div class="field span-2">
              <label for="cfg-nombre">Nombre del gimnasio</label>
              <input id="cfg-nombre" [(ngModel)]="gimnasio.nombre" name="gimnasio_nombre" />
            </div>
            <div class="field">
              <label for="cfg-telefono">Teléfono</label>
              <input id="cfg-telefono" [(ngModel)]="gimnasio.telefono" name="gimnasio_telefono" />
            </div>
            <div class="field">
              <label for="cfg-rnc">RNC</label>
              <input id="cfg-rnc" [(ngModel)]="gimnasio.rnc" name="gimnasio_rnc" />
            </div>
            <div class="field span-2">
              <label for="cfg-direccion">Dirección</label>
              <input id="cfg-direccion" [(ngModel)]="gimnasio.direccion" name="gimnasio_direccion" />
            </div>
          </div>

          <div class="actions">
            <button class="btn-primary" type="button" [disabled]="saving()" (click)="guardar()">
              {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </section>
      }
    </section>
  `,
  styleUrl: './config-general.component.css',
})
export class ConfigGeneralComponent implements OnInit {
  gimnasio: Partial<Gimnasio> = {};
  config: Partial<ConfigSistema> = {};
  loading = signal(true);
  saving = signal(false);
  message = signal('');
  isError = signal(false);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const [{ data: gimnasio }, { data: config }] = await Promise.all([
      this.supabase.client.from('gimnasios').select('*').eq('id', gimnasioId).single(),
      this.supabase.client.from('config_sistema').select('*').eq('gimnasio_id', gimnasioId).maybeSingle(),
    ]);

    this.gimnasio = gimnasio ?? {};
    this.config = config ?? {};
    this.loading.set(false);
  }

  async guardar(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;

    this.saving.set(true);
    const { data: actualConfig } = await this.supabase.client
      .from('config_sistema')
      .select('*')
      .eq('gimnasio_id', gimnasioId)
      .maybeSingle<ConfigSistema>();

    const gimnasioResult = await this.supabase.client.from('gimnasios').update({
      nombre: this.gimnasio.nombre,
      telefono: this.gimnasio.telefono,
      direccion: this.gimnasio.direccion,
      rnc: this.gimnasio.rnc,
    }).eq('id', gimnasioId);

    const configResult = await this.upsertConfig({
      gimnasio_id: gimnasioId,
      ...(actualConfig ?? {}),
      nombre_comercial: this.config.nombre_comercial,
    });

    const error = gimnasioResult.error ?? configResult.error;
    this.saving.set(false);

    if (error) {
      this.isError.set(true);
      this.message.set(error.message);
      return;
    }

    this.isError.set(false);
    this.message.set('Datos generales guardados.');
    await this.cargar();
  }

  private async upsertConfig(payload: Partial<ConfigSistema> & { gimnasio_id: string }) {
    return this.supabase.client.from('config_sistema').upsert(payload, { onConflict: 'gimnasio_id' });
  }
}
