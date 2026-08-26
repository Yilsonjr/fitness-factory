import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Cliente, ClienteForm, Asistencia, Pago } from '../models';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private _clientes = signal<Cliente[]>([]);
  private _loading = signal(false);

  clientes = this._clientes.asReadonly();
  loading = this._loading.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  private mapClienteConMembresia(cliente: Cliente & { membresia_activa?: unknown }): Cliente {
    const membresiaActiva = Array.isArray(cliente.membresia_activa)
      ? cliente.membresia_activa[0] ?? null
      : cliente.membresia_activa ?? null;

    return {
      ...cliente,
      membresia_activa: membresiaActiva as Cliente['membresia_activa'],
    };
  }

  async cargar() {
    this._loading.set(true);
    const { data, error } = await this.supabase.client
      .from('clientes')
      .select(`
        *,
        membresia_activa:membresias(
          id, estado, fecha_inicio, fecha_fin, precio_pagado,
          plan:planes(nombre, periodo)
        )
      `)
      .eq('activo', true)
      .eq('membresias.estado', 'activa')
      .order('nombre', { ascending: true });

    if (data && !error) {
      // Aplanar: membresia_activa viene como array, tomar la primera
      const clientes = (data as Array<Cliente & { membresia_activa?: unknown }>).map(cliente =>
        this.mapClienteConMembresia(cliente)
      );
      this._clientes.set(clientes);
    }
    this._loading.set(false);
  }

  async obtener(id: string): Promise<Cliente | null> {
    const { data, error } = await this.supabase.client
      .from('clientes')
      .select(`
        *,
        membresia_activa:membresias(
          id, estado, fecha_inicio, fecha_fin, precio_pagado,
          plan:planes(nombre, periodo)
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      ...data,
      membresia_activa: data.membresia_activa?.[0] ?? null,
    } as Cliente;
  }

  async crear(form: ClienteForm): Promise<{ data: Cliente | null; error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { data: null, error: 'Sin gimnasio asignado' };

    const { data, error } = await this.supabase.client
      .from('clientes')
      .insert({ ...form, gimnasio_id: gimnasioId })
      .select()
      .single();

    if (!error) {
      await this.cargar(); // Refrescar lista
    }

    return {
      data: data as Cliente | null,
      error: error?.message ?? null,
    };
  }

  async actualizar(id: string, form: Partial<ClienteForm>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('clientes')
      .update(form)
      .eq('id', id);

    if (!error) {
      await this.cargar();
    }

    return { error: error?.message ?? null };
  }

  async desactivar(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('clientes')
      .update({ activo: false })
      .eq('id', id);

    if (!error) {
      await this.cargar();
    }

    return { error: error?.message ?? null };
  }

  async buscar(termino: string): Promise<Cliente[]> {
    const { data } = await this.supabase.client
      .from('clientes')
      .select('id, nombre, apellido, cedula, telefono, foto_url')
      .eq('activo', true)
      .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,cedula.ilike.%${termino}%`)
      .limit(20);

    return (data as Cliente[]) ?? [];
  }

  async obtenerAsistencias(clienteId: string): Promise<Asistencia[]> {
    const { data } = await this.supabase.client
      .from('asistencias')
      .select('*, cliente:clientes(nombre, apellido, cedula)')
      .eq('cliente_id', clienteId)
      .order('fecha_entrada', { ascending: false });

    return (data as Asistencia[]) ?? [];
  }

  async obtenerPagos(clienteId: string): Promise<Pago[]> {
    const { data } = await this.supabase.client
      .from('pagos')
      .select('*, membresia:membresias(id, fecha_inicio, fecha_fin, plan:planes(nombre))')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false });

    return (data as Pago[]) ?? [];
  }

  async subirFoto(clienteId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `clientes/${clienteId}/foto.${ext}`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('fotos')
      .upload(path, file, { upsert: true });

    if (uploadError) return null;

    const { data } = this.supabase.client.storage
      .from('fotos')
      .getPublicUrl(path);

    // Guardar URL en el cliente
    await this.supabase.client
      .from('clientes')
      .update({ foto_url: data.publicUrl })
      .eq('id', clienteId);

    return data.publicUrl;
  }
}
