import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario, RolUsuario } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton-list.component';

type VistaAcceso = 'usuarios' | 'roles';

@Component({
  selector: 'app-config-usuarios',
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
              <p class="subtitle">Crea y gestiona los usuarios que acceden al sistema.</p>
            </div>
            <button class="btn-primary" type="button" (click)="abrirComposer()">Nuevo usuario</button>
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
                  <label for="user-rol">Rol</label>
                  <select id="user-rol" [(ngModel)]="nuevo.rol" name="rol">
                    <option value="recepcionista">Recepcionista</option>
                    <option value="admin">Administrador</option>
                    <option value="contador">Contador</option>
                  </select>
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
                      <td>{{ user.rol === 'admin' ? 'Administrador' : 'Recepcionista' }}</td>
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
                            <select class="rol-select" [ngModel]="user.rol" (ngModelChange)="cambiarRol(user, $event)" [attr.aria-label]="'Rol de ' + user.nombre">
                              <option value="recepcionista">Recepcionista</option>
                              <option value="admin">Administrador</option>
                              <option value="contador">Contador</option>
                            </select>
                            <button class="link danger" type="button" (click)="alternarEstado(user)">{{ user.activo ? 'Desactivar' : 'Activar' }}</button>
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
        <section class="card">
          <h3>Roles y permisos</h3>
          <p class="subtitle">El sistema maneja dos roles con accesos diferenciados por módulo.</p>

          <div class="role-grid">
            <div class="role-card">
              <div class="role-head">
                <strong>Administrador</strong>
                <span class="role-badge admin">Admin</span>
              </div>
              <ul class="role-perms">
                <li>✅ Dashboard completo</li>
                <li>✅ Clientes y membresías</li>
                <li>✅ Caja y punto de venta</li>
                <li>✅ Productos (crear/editar)</li>
                <li>✅ Acceso biométrico</li>
                <li>✅ Reportes y finanzas</li>
                <li>✅ Configuración del sistema</li>
              </ul>
            </div>
            <div class="role-card">
              <div class="role-head">
                <strong>Recepcionista</strong>
                <span class="role-badge recep">Recepcionista</span>
              </div>
              <ul class="role-perms">
                <li>✅ Dashboard operativo</li>
                <li>✅ Clientes y membresías</li>
                <li>✅ Caja y punto de venta</li>
                <li>✅ Productos (solo ver)</li>
                <li>✅ Acceso biométrico</li>
                <li>❌ Reportes</li>
                <li>❌ Configuración</li>
              </ul>
            </div>
            <div class="role-card">
              <div class="role-head">
                <strong>Contador</strong>
                <span class="role-badge cont">Contador</span>
              </div>
              <ul class="role-perms">
                <li>✅ Dashboard (solo ver)</li>
                <li>✅ Clientes (solo consultar)</li>
                <li>✅ Reportes y finanzas completos</li>
                <li>❌ Caja / cobros</li>
                <li>❌ Membresías</li>
                <li>❌ Punto de venta</li>
                <li>❌ Configuración</li>
              </ul>
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
  nuevo = { nombre: '', email: '', password: '', rol: 'recepcionista' as 'admin' | 'recepcionista' | 'contador' };

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

  abrirComposer(): void {
    this.nuevo = { nombre: '', email: '', password: '', rol: 'recepcionista' as const };
    this.composerAbierto.set(true);
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
    this.message.set(`Usuario ${this.nuevo.rol === 'admin' ? 'administrador' : 'recepcionista'} creado correctamente.`);
    this.nuevo = { nombre: '', email: '', password: '', rol: 'recepcionista' };
    this.composerAbierto.set(false);
    if (data) await this.cargar();
  }

  async cambiarRol(usuario: Usuario, nuevoRol: RolUsuario): Promise<void> {
    if (nuevoRol === usuario.rol) return;
    const { error } = await this.supabase.client
      .from('usuarios')
      .update({ rol: nuevoRol })
      .eq('id', usuario.id);

    if (error) {
      this.isError.set(true);
      this.message.set(error.message);
      return;
    }

    const rolLabel: Record<RolUsuario, string> = { admin: 'Administrador', recepcionista: 'Recepcionista', contador: 'Contador' };
    this.isError.set(false);
    this.message.set(`${usuario.nombre} ahora es ${rolLabel[nuevoRol]}.`);
    await this.cargar();
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
