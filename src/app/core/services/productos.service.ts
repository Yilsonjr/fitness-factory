import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Producto, CategoriaProducto, ProductoForm, CategoriaForm, EntradaInventarioForm, MovimientoInventario } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  productos = signal<Producto[]>([]);
  categorias = signal<CategoriaProducto[]>([]);
  loading = signal(false);

  async cargarProductos(incluirInactivos = false) {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;
    this.loading.set(true);
    let q = this.supabase.client
      .from('productos')
      .select('*, categoria:categorias_producto(id, nombre)')
      .eq('gimnasio_id', gimnasioId)
      .order('nombre', { ascending: true });
    if (!incluirInactivos) q = q.eq('activo', true);
    const { data } = await q;
    this.productos.set((data as Producto[]) ?? []);
    this.loading.set(false);
  }

  async cargarCategorias() {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;
    const { data } = await this.supabase.client
      .from('categorias_producto')
      .select('*')
      .eq('gimnasio_id', gimnasioId)
      .order('nombre', { ascending: true });
    this.categorias.set((data as CategoriaProducto[]) ?? []);
  }

  async obtener(id: string): Promise<Producto | null> {
    const { data } = await this.supabase.client
      .from('productos')
      .select('*, categoria:categorias_producto(id, nombre)')
      .eq('id', id)
      .single();
    return (data as Producto) ?? null;
  }

  async crear(form: ProductoForm): Promise<{ error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { error: 'Sin gimnasio activo' };
    const { error } = await this.supabase.client
      .from('productos')
      .insert({ ...form, gimnasio_id: gimnasioId });
    return { error: error?.message ?? null };
  }

  async actualizar(id: string, form: Partial<ProductoForm>): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('productos')
      .update(form)
      .eq('id', id);
    return { error: error?.message ?? null };
  }

  async desactivar(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('productos')
      .update({ activo: false })
      .eq('id', id);
    return { error: error?.message ?? null };
  }

  async crearCategoria(form: CategoriaForm): Promise<{ data: CategoriaProducto | null; error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { data: null, error: 'Sin gimnasio activo' };
    const { data, error } = await this.supabase.client
      .from('categorias_producto')
      .insert({ ...form, gimnasio_id: gimnasioId })
      .select()
      .single();
    return { data: (data as CategoriaProducto) ?? null, error: error?.message ?? null };
  }

  async entradaInventario(form: EntradaInventarioForm): Promise<{ error: string | null }> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return { error: 'Sin gimnasio activo' };

    const { error: movError } = await this.supabase.client
      .from('movimientos_inventario')
      .insert({ ...form, gimnasio_id: gimnasioId, fecha: new Date().toISOString() });

    if (movError) return { error: movError.message };

    const { data: prod } = await this.supabase.client
      .from('productos')
      .select('stock')
      .eq('id', form.producto_id)
      .single();

    const currentStock = (prod as { stock: number } | null)?.stock ?? 0;
    let newStock = currentStock;
    if (form.tipo === 'entrada') newStock += form.cantidad;
    else if (form.tipo === 'ajuste') newStock = form.cantidad;
    else if (form.tipo === 'merma') {
      if (form.cantidad > currentStock) return { error: `Stock insuficiente. Stock actual: ${currentStock}` };
      newStock = currentStock - form.cantidad;
    }

    const { error: stockError } = await this.supabase.client
      .from('productos')
      .update({ stock: newStock })
      .eq('id', form.producto_id);

    return { error: stockError?.message ?? null };
  }

  async obtenerMovimientosInventario(): Promise<MovimientoInventario[]> {
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return [];

    const { data } = await this.supabase.client
      .from('movimientos_inventario')
      .select('*, producto:productos(id, nombre, stock, stock_minimo)')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false });

    return (data as MovimientoInventario[]) ?? [];
  }
}
