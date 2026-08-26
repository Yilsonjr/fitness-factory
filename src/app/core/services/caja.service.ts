import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { TurnoCaja, AperturaCajaForm, CierreCajaForm, Pago, PagoForm, Gasto } from '../models';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private _turnoActual = signal<TurnoCaja | null>(null);
  private _loading = signal(false);

  turnoActual = this._turnoActual.asReadonly();
  loading = this._loading.asReadonly();
  hayTurnoAbierto = () => !!this._turnoActual();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async cargarTurnoActual() {
    const { data } = await this.supabase.client
      .from('turnos_caja')
      .select('*, usuario:usuarios(nombre)')
      .eq('estado', 'abierto')
      .limit(1)
      .maybeSingle();

    this._turnoActual.set(data as TurnoCaja | null);
  }

  async abrirTurno(form: AperturaCajaForm): Promise<{ error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    const usuario = this.auth.usuario();
    if (!gimnasioId || !usuario) return { error: 'Sin sesión activa' };

    // Verificar que no hay turno abierto
    if (this._turnoActual()) {
      return { error: 'Ya existe un turno abierto. Ciérrelo primero.' };
    }

    const { data, error } = await this.supabase.client
      .from('turnos_caja')
      .insert({
        gimnasio_id: gimnasioId,
        usuario_id: usuario.id,
        monto_apertura: form.monto_apertura,
      })
      .select('*, usuario:usuarios(nombre)')
      .single();

    if (!error) {
      this._turnoActual.set(data as TurnoCaja);
    }

    return { error: error?.message ?? null };
  }

  async cerrarTurno(form: CierreCajaForm): Promise<{ error: string | null }> {
    const turno = this._turnoActual();
    if (!turno) return { error: 'No hay turno abierto' };

    const { error } = await this.supabase.client
      .from('turnos_caja')
      .update({
        monto_cierre: form.monto_cierre,
        estado: 'cerrado',
        fecha_cierre: new Date().toISOString(),
        notas_cierre: form.notas_cierre,
      })
      .eq('id', turno.id);

    if (!error) {
      this._turnoActual.set(null);
    }

    return { error: error?.message ?? null };
  }

  // ===================== PAGOS =====================

  async registrarPago(form: PagoForm): Promise<{ error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    const usuario = this.auth.usuario();
    const turno = this._turnoActual();

    if (!gimnasioId || !usuario) return { error: 'Sin sesión activa' };
    if (!turno) return { error: 'Debe abrir un turno de caja primero' };

    const { error } = await this.supabase.client
      .from('pagos')
      .insert({
        gimnasio_id: gimnasioId,
        cliente_id: form.cliente_id,
        membresia_id: form.membresia_id,
        turno_id: turno.id,
        monto: form.monto,
        metodo: form.metodo,
        concepto: form.concepto,
        recibido_por: usuario.id,
      });

    return { error: error?.message ?? null };
  }

  async anularPago(pagoId: string, motivo: string): Promise<{ error: string | null }> {
    const motivoLimpio = motivo.trim();
    if (motivoLimpio.length < 5) {
      return { error: 'El motivo de anulación debe tener al menos 5 caracteres' };
    }

    const { error } = await this.supabase.client
      .from('pagos')
      .update({ anulado: true, motivo_anulacion: motivoLimpio })
      .eq('id', pagoId);

    return { error: error?.message ?? null };
  }

  async obtenerPagosTurno(turnoId?: string): Promise<Pago[]> {
    const id = turnoId ?? this._turnoActual()?.id;
    if (!id) return [];

    const { data } = await this.supabase.client
      .from('pagos')
      .select('*, cliente:clientes(nombre, apellido)')
      .eq('turno_id', id)
      .eq('anulado', false)
      .order('fecha', { ascending: false });

    return (data as Pago[]) ?? [];
  }

  // ===================== GASTOS =====================

  async registrarGasto(monto: number, concepto: string): Promise<{ error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    const usuario = this.auth.usuario();
    const turno = this._turnoActual();

    if (!gimnasioId || !usuario) return { error: 'Sin sesión activa' };
    if (!turno) return { error: 'Debe abrir un turno de caja primero' };

    const { error } = await this.supabase.client
      .from('gastos')
      .insert({
        gimnasio_id: gimnasioId,
        turno_id: turno.id,
        monto,
        concepto,
        registrado_por: usuario.id,
      });

    return { error: error?.message ?? null };
  }

  async obtenerGastosTurno(turnoId?: string): Promise<Gasto[]> {
    const id = turnoId ?? this._turnoActual()?.id;
    if (!id) return [];

    const { data } = await this.supabase.client
      .from('gastos')
      .select('*')
      .eq('turno_id', id)
      .order('fecha', { ascending: false });

    return (data as Gasto[]) ?? [];
  }

  // ===================== RESUMEN =====================

  async resumenTurno(turnoId?: string): Promise<{
    ingresos: number;
    gastos: number;
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  }> {
    const pagos = await this.obtenerPagosTurno(turnoId);
    const gastos = await this.obtenerGastosTurno(turnoId);

    const ingresos = pagos.reduce((sum, p) => sum + p.monto, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

    return {
      ingresos,
      gastos: totalGastos,
      efectivo: pagos.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + p.monto, 0),
      tarjeta: pagos.filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + p.monto, 0),
      transferencia: pagos.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + p.monto, 0),
    };
  }
}
