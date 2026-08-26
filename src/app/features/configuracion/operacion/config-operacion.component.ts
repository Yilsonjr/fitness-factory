import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigSistema } from '../../../core/models';

@Component({
  selector: 'app-config-operacion',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>Operación</h2>
          <p class="subtitle">Parámetros que afectan el flujo diario.</p>
        </div>
      </div>

      @if (message()) {
        <div class="banner" [class.error]="isError()" role="status" aria-live="polite">{{ message() }}</div>
      }

      <section class="card">
        <div class="grid">
          <div class="field">
            <label for="cfg-gracia">Días de gracia</label>
            <input id="cfg-gracia" type="number" [(ngModel)]="config.dias_gracia" name="dias_gracia" />
          </div>
          <div class="field">
            <label for="cfg-apertura">Horario apertura</label>
            <input id="cfg-apertura" type="time" [(ngModel)]="config.horario_apertura" name="horario_apertura" />
          </div>
          <div class="field">
            <label for="cfg-cierre">Horario cierre</label>
            <input id="cfg-cierre" type="time" [(ngModel)]="config.horario_cierre" name="horario_cierre" />
          </div>
        </div>

        <div class="legacy-note">
          <h3>Tema visual</h3>
          <p>
            El color de marca ya está fijado por el design system charcoal + electric lime.
            El valor almacenado en backend se conserva por compatibilidad, pero no se expone como ajuste editable.
          </p>
        </div>

        <div class="actions">
          <button class="btn-primary" type="button" [disabled]="saving()" (click)="guardar()">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </section>
    </section>
  `,
  styleUrl: './config-operacion.component.css',
})
export class ConfigOperacionComponent implements OnInit {
  config: Partial<ConfigSistema> = { dias_gracia: 0 };
  message = signal('');
  isError = signal(false);
  saving = signal(false);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;

    const { data } = await this.supabase.client.from('config_sistema').select('*').eq('gimnasio_id', gimnasioId).maybeSingle();
    this.config = data ?? { dias_gracia: 0 };
  }

  async guardar(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;

    this.saving.set(true);
    const { data: actualConfig } = await this.supabase.client.from('config_sistema').select('*').eq('gimnasio_id', gimnasioId).maybeSingle();
    const { error } = await this.supabase.client.from('config_sistema').upsert({
      gimnasio_id: gimnasioId,
      ...(actualConfig ?? {}),
      dias_gracia: this.config.dias_gracia ?? 0,
      horario_apertura: this.config.horario_apertura,
      horario_cierre: this.config.horario_cierre,
    }, { onConflict: 'gimnasio_id' });
    this.saving.set(false);

    if (error) {
      this.isError.set(true);
      this.message.set(error.message);
      return;
    }

    this.isError.set(false);
    this.message.set('Configuración operativa guardada.');
    await this.cargar();
  }
}
