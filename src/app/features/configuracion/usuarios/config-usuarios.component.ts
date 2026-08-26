import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';

type VistaAcceso = 'usuarios' | 'roles';

@Component({
  selector: 'app-config-usuarios',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, SkeletonListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>Usuarios y acceso</h2>
          <p class="subtitle">Gestión de personas que entran al sistema y base futura de autorización.</p>
        </div>
      </div>

      <div class="subnav" role="tablist" aria-label="Subsecciones de usuarios y acceso">
        <button type="button" role="tab" [attr.aria-selected]="vista() === 'usuarios'" [class.active]="vista() === 'usuarios'" (click)="vista.set('usuarios')">Usuarios</button>
        <button type="button" role="tab" [attr.aria-selected]="vista() === 'roles'" [class.active]="vista() === 'roles'" (click)="vista.set('roles')">Roles y permisos</button>
      </div>

      @if (message()) {
        <div class="banner" [class.error]="isError()" role="status" aria-live="polite">{{ message() }}</div>
      }

      @if (vista() === 'usuarios') {
        <section class="card">
          <div class="table-head">
            <div>
              <h3>Usuarios</h3>
              <p class="subtitle">Hoy solo se crea el perfil recepcionista; el modelo genérico requiere backend adicional.</p>
            </div>
            <button class="btn-primary" type="button" (click)="composerAbierto.set(!composerAbierto())">Nuevo usuario</button>
          </div>

          @if (composerAbierto()) {
            <div class="composer">
              <div class="grid">
                <div class="field">
                  <label for="user-nombre">Nombre</label>
                  <input id="user-nombre" [(ngModel)]="nuevo.nombre" name="nombre" />
                </div>
                <div class="field">
                  <label for="user-email">Correo</label>
                  <input id="user-email" type="email" [(ngModel)]="nuevo.email" name="email" autocomplete="email" />
                </div>
                <div class="field">
                  <label for="user-pass">Contraseña temporal</label>
                  <input id="user-pass" type="password" [(ngModel)]="nuevo.password" name="password" autocomplete="new-password" />
                </div>
                <div class="field">
                  <label>Rol</label>
                  <div class="readonly-chip">Recepcionista</div>
                </div>
              </div>

              <div class="actions">
                <button class="btn-secondary" type="button" (click)="composerAbierto.set(false)">Cancelar</button>
                <button class="btn-primary" type="button" [disabled]="saving()" (click)="crearUsuario()">{{ saving() ? 'Creando…' : 'Crear usuario' }}</button>
              </div>
            </div>
          }

          @if (loading()) {
            <div class="loading-card" aria-busy="true" aria-live="polite">
              <app-skeleton-list [items]="[
                { width: '45%', height: '1.2rem' },
                { width: '100%', height: '2.8rem' },
                { width: '100%', height: '2.8rem' },
                { width: '100%', height: '2.8rem' }
              ]"></app-skeleton-list>
            </div>
          } @else {
            <div class="table-wrap">
              <table aria-label="Usuarios del sistema">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Email</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of usuariosFiltrados(); track user.id) {
                    <tr>
                      <td>{{ user.nombre }}</td>
                      <td>{{ user.email }}</td>
                      <td>{{ user.rol }}</td>
                      <td>
                        @if (user.activo) {
                          <app-status-badge tone="success" label="Activo"></app-status-badge>
                        } @else {
                          <app-status-badge tone="neutral" label="Inactivo"></app-status-badge>
                        }
                      </td>
                      <td>
                        <div class="actions-inline">
                          @if (user.id !== auth.usuario()?.id) {
                            <button class="link" type="button" (click)="alternarEstado(user)">{{ user.activo ? 'Desactivar' : 'Activar' }}</button>
                          } @else {
                            <span class="muted">Usuario actual</span>
                          }
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="empty">Sin usuarios</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      } @else {
        <section class="card future-card">
          <h3>Roles y permisos</h3>
          <p class="subtitle">No existe un backend RBAC para construir permisos granulares todavía.</p>
          <div class="future-note">Future capability — backend support required</div>

          <div class="role-grid">
            <div class="role-card">
              <strong>admin</strong>
              <p>Dashboard administrativo, clientes, membresías, caja, POS, productos, reportes y configuración.</p>
            </div>
            <div class="role-card">
              <strong>recepcionista</strong>
              <p>Dashboard operativo, clientes, membresías, caja, POS y productos.</p>
            </div>
          </div>
        </section>
      }
    </section>
  `,
  styleUrl: './config-usuarios.component.css',
})
export class ConfigUsuariosComponent implements OnInit {
  vista = signal<VistaAcceso>('usuarios');
  loading = signal(true);
  saving = signal(false);
  usuarios = signal<Usuario[]>([]);
  message = signal('');
  isError = signal(false);
  composerAbierto = signal(false);
  nuevo = { nombre: '', email: '', password: '' };

  usuariosFiltrados = computed(() => [...this.usuarios()].sort((a, b) => a.nombre.localeCompare(b.nombre)));

  constructor(
    public auth: AuthService,
    private supabase: SupabaseService
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
    const { data } = await this.supabase.client.from('usuarios').select('*').eq('gimnasio_id', gimnasioId).order('nombre', { ascending: true });
    this.usuarios.set((data as Usuario[]) ?? []);
    this.loading.set(false);
  }

  async crearUsuario(): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;

    this.saving.set(true);
    const { data, error } = await this.supabase.client.functions.invoke('create-recepcionista', {
      body: { ...this.nuevo, gimnasioId },
    });
    this.saving.set(false);

    if (error) {
      this.isError.set(true);
      this.message.set(error.message);
      return;
    }

    this.isError.set(false);
    this.message.set('Usuario creado correctamente.');
    this.nuevo = { nombre: '', email: '', password: '' };
    this.composerAbierto.set(false);
    if (data) await this.cargar();
  }

  async alternarEstado(usuario: Usuario): Promise<void> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;

    const { error } = await this.supabase.client.from('usuarios').update({ activo: !usuario.activo }).eq('id', usuario.id).eq('gimnasio_id', gimnasioId);
    if (error) {
      this.isError.set(true);
      this.message.set(error.message);
      return;
    }

    this.isError.set(false);
    this.message.set(usuario.activo ? 'Usuario desactivado.' : 'Usuario activado.');
    await this.cargar();
  }
}
