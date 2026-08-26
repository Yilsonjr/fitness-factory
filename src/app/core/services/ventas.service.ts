import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { CajaService } from './caja.service';
import { Venta, VentaForm } from '../models';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private caja = inject(CajaService);

  async registrarVenta(form: VentaForm): Promise<{ ventaId: string | null; error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { ventaId: null, error: 'Sin gimnasio activo' };

    const turnoId = this.caja.turnoActual()?.id ?? null;
    const total = form.items.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);

    const { data: venta, error: ventaError } = await this.supabase.client
      .from('ventas')
      .insert({
        gimnasio_id: gimnasioId,
        turno_id: turnoId,
        cliente_id: form.cliente_id ?? null,
        total,
        metodo: form.metodo,
        fecha: new Date().toISOString(),
        anulado: false,
      })
      .select('id')
      .single();

    if (ventaError) return { ventaId: null, error: ventaError.message };

    const ventaId = (venta as { id: string }).id;

    const detalles = form.items.map(item => ({
      venta_id: ventaId,
      producto_id: item.producto.id,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio,
      subtotal: item.producto.precio * item.cantidad,
    }));

    const { error: detError } = await this.supabase.client
      .from('detalles_venta')
      .insert(detalles);

    if (detError) return { ventaId: null, error: detError.message };

    // Decrement stock
    for (const item of form.items) {
      const { data: prod } = await this.supabase.client
        .from('productos')
        .select('stock')
        .eq('id', item.producto.id)
        .single();
      const current = (prod as { stock: number } | null)?.stock ?? 0;
      if (item.cantidad > current) {
        return { ventaId: null, error: `Stock insuficiente para "${item.producto.nombre}". Disponible: ${current}` };
      }
      await this.supabase.client
        .from('productos')
        .update({ stock: current - item.cantidad })
        .eq('id', item.producto.id);
    }

    return { ventaId, error: null };
  }

  async obtenerVentasTurno(turnoId: string): Promise<Venta[]> {
    const { data } = await this.supabase.client
      .from('ventas')
      .select('*, cliente:clientes(nombre, apellido), detalles:detalles_venta(*, producto:productos(nombre, precio))')
      .eq('turno_id', turnoId)
      .eq('anulado', false)
      .order('created_at', { ascending: false });
    return (data as Venta[]) ?? [];
  }

  async resumenVentasTurno(turnoId: string): Promise<{ total: number; cantidad: number }> {
    const { data } = await this.supabase.client
      .from('ventas')
      .select('total')
      .eq('turno_id', turnoId)
      .eq('anulado', false);
    const list = (data ?? []) as { total: number }[];
    return {
      total: list.reduce((s, v) => s + v.total, 0),
      cantidad: list.length,
    };
  }

  async anularVenta(ventaId: string, motivo: string): Promise<{ error: string | null }> {
    const motivoLimpio = motivo.trim();
    if (motivoLimpio.length < 5) {
      return { error: 'El motivo de anulación debe tener al menos 5 caracteres' };
    }

    const { data: venta, error: ventaError } = await this.supabase.client
      .from('ventas')
      .select('id, anulado, detalles:detalles_venta(producto_id, cantidad)')
      .eq('id', ventaId)
      .single();

    if (ventaError) return { error: ventaError.message };

    const ventaData = venta as { id: string; anulado: boolean; detalles?: { producto_id: string; cantidad: number }[] };
    if (ventaData.anulado) {
      return { error: 'La venta ya fue anulada' };
    }

    const { error: updateError } = await this.supabase.client
      .from('ventas')
      .update({ anulado: true, motivo_anulacion: motivoLimpio })
      .eq('id', ventaId);

    if (updateError) return { error: updateError.message };

    for (const detalle of ventaData.detalles ?? []) {
      const { data: prod } = await this.supabase.client
        .from('productos')
        .select('stock')
        .eq('id', detalle.producto_id)
        .single();

      const current = (prod as { stock: number } | null)?.stock ?? 0;
      await this.supabase.client
        .from('productos')
        .update({ stock: current + detalle.cantidad })
        .eq('id', detalle.producto_id);
    }

    return { error: null };
  }

  async obtenerVentasAnuladas(): Promise<Venta[]> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return [];

    const { data } = await this.supabase.client
      .from('ventas')
      .select('*, cliente:clientes(nombre, apellido), detalles:detalles_venta(*, producto:productos(nombre, precio))')
      .eq('gimnasio_id', gimnasioId)
      .eq('anulado', true)
      .order('created_at', { ascending: false });

    return (data as Venta[]) ?? [];
  }
}
