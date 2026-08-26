import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { Usuario, RolUsuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _usuario = signal<Usuario | null>(null);
  private _loading = signal(true);

  usuario = this._usuario.asReadonly();
  loading = this._loading.asReadonly();
  isLoggedIn = computed(() => !!this._usuario());
  rol = computed(() => this._usuario()?.rol ?? null);
  isAdmin = computed(() => this._usuario()?.rol === 'admin');
  gimnasioId = computed(() => this._usuario()?.gimnasio_id ?? null);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initAuthListener();
  }

  private async initAuthListener() {
    // Verificar sesión actual
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      await this.loadUsuario(session.user.id);
    }
    this._loading.set(false);

    // Escuchar cambios de auth
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUsuario(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this._usuario.set(null);
        this.router.navigate(['/login']);
      }
    });
  }

  private async loadUsuario(authId: string) {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('auth_id', authId)
      .eq('activo', true)
      .single();

    if (data && !error) {
      this._usuario.set(data as Usuario);
    } else {
      this._usuario.set(null);
    }
  }

  async login(email: string, password: string): Promise<{ error: string | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      await this.loadUsuario(data.user.id);
      if (!this._usuario()) {
        await this.supabase.auth.signOut();
        return { error: 'Usuario no tiene acceso al sistema' };
      }
    }

    return { error: null };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(rol: RolUsuario): boolean {
    return this._usuario()?.rol === rol;
  }
}
