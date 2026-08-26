import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Plan, PlanForm, Membresia, MembresiaForm, MetodoPago } from '../models';

@Injectable({ providedIn: 'root' })
export class MembresiasService {
  private _planes = signal<Plan[]>([]);
  private _loading = signal(false);

  planes = this._planes.asReadonly();
  loading = this._loading.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  // ===================== PLANES =====================

  async cargarPlanes() {
    const { data } = await this.supabase.client
      .from('planes')
      .select('*')
      .eq('activo', true)
      .order('precio', { ascending: true });

    this._planes.set((data as Plan[]) ?? []);
  }

  async crearPlan(form: PlanForm): Promise<{ error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { error: 'Sin gimnasio asignado' };

    const { error } = await this.supabase.client
      .from('planes')
      .insert({ ...form, gimnasio_id: gimnasioId });

    if (!error) await this.cargarPlanes();
    return { error: error?.message ?? null };
  }

  async actualizarPlan(id: string, form: Partial<PlanForm>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('planes')
      .update(form)
      .eq('id', id);

    if (!error) await this.cargarPlanes();
    return { error: error?.message ?? null };
  }

  // ===================== MEMBRESÍAS =====================

  async asignarMembresia(form: MembresiaForm): Promise<{ error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { error: 'Sin gimnasio asignado' };

    // Obtener plan para calcular fecha_fin y precio
    const plan = this._planes().find(p => p.id === form.plan_id);
    if (!plan) return { error: 'Plan no encontrado' };

    const fechaInicio = new Date(form.fecha_inicio);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + plan.duracion_dias);

    // 1. Marcar membresías activas anteriores como canceladas
    await this.supabase.client
      .from('membresias')
      .update({ estado: 'cancelada' })
      .eq('cliente_id', form.cliente_id)
      .eq('estado', 'activa');

    // 2. Crear nueva membresía
    const { data: membresia, error: memError } = await this.supabase.client
      .from('membresias')
      .insert({
        gimnasio_id: gimnasioId,
        cliente_id: form.cliente_id,
        plan_id: form.plan_id,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: fechaFin.toISOString().split('T')[0],
        precio_pagado: plan.precio,
        notas: form.notas,
      })
      .select()
      .single();

    if (memError) return { error: memError.message };

    // 3. Registrar pago
    const { error: pagoError } = await this.supabase.client
      .from('pagos')
      .insert({
        gimnasio_id: gimnasioId,
        cliente_id: form.cliente_id,
        membresia_id: membresia.id,
        monto: plan.precio,
        metodo: form.metodo_pago,
        concepto: `Membresía ${plan.nombre} - ${form.fecha_inicio}`,
      });

    if (pagoError) return { error: pagoError.message };

    return { error: null };
  }

  async crearMembresiaParaCobro(
    clienteId: string,
    planId: string,
    fechaInicio: string,
  ): Promise<{ membresiaId: string | null; error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { membresiaId: null, error: 'Sin gimnasio asignado' };

    const plan = this._planes().find(p => p.id === planId);
    if (!plan) return { membresiaId: null, error: 'Plan no encontrado' };

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFin = new Date(fechaInicioDate);
    fechaFin.setDate(fechaFin.getDate() + plan.duracion_dias);

    await this.supabase.client
      .from('membresias')
      .update({ estado: 'cancelada' })
      .eq('cliente_id', clienteId)
      .eq('estado', 'activa');

    const { data, error } = await this.supabase.client
      .from('membresias')
      .insert({
        gimnasio_id: gimnasioId,
        cliente_id: clienteId,
        plan_id: planId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin.toISOString().split('T')[0],
        precio_pagado: plan.precio,
      })
      .select('id')
      .single();

    if (error) return { membresiaId: null, error: error.message };
    return { membresiaId: data.id, error: null };
  }

  async obtenerMembresiasCliente(clienteId: string): Promise<Membresia[]> {
    const { data } = await this.supabase.client
      .from('membresias')
      .select(`*, plan:planes(nombre, periodo, precio)`)
      .eq('cliente_id', clienteId)
      .order('fecha_inicio', { ascending: false });

    return (data as Membresia[]) ?? [];
  }

  async congelarMembresia(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('membresias')
      .update({ estado: 'congelada' })
      .eq('id', id);

    return { error: error?.message ?? null };
  }

  async reactivarMembresia(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('membresias')
      .update({ estado: 'activa' })
      .eq('id', id);

    return { error: error?.message ?? null };
  }

  // ===================== ESTADÍSTICAS =====================

  async contarPorEstado(): Promise<{ activas: number; vencidas: number; porVencer: number }> {
    const hoy = new Date().toISOString().split('T')[0];
    const en7Dias = new Date();
    en7Dias.setDate(en7Dias.getDate() + 7);
    const limite = en7Dias.toISOString().split('T')[0];

    const { count: activas } = await this.supabase.client
      .from('membresias')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activa');

    const { count: vencidas } = await this.supabase.client
      .from('membresias')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'vencida');

    const { count: porVencer } = await this.supabase.client
      .from('membresias')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activa')
      .lte('fecha_fin', limite)
      .gte('fecha_fin', hoy);

    return {
      activas: activas ?? 0,
      vencidas: vencidas ?? 0,
      porVencer: porVencer ?? 0,
    };
  }
}
