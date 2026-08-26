import { Injectable, inject, signal } from '@angular/core';
import { MetodoPago } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface ReciboItem {
  descripcion: string;
  cantidad?: number;
  precio: number;
}

export interface ReciboData {
  tipo: 'membresia' | 'venta' | 'cobro';
  numero: string;
  fecha: Date;
  gimnasioNombre: string;
  gimnasioTel?: string;
  clienteNombre: string;
  items: ReciboItem[];
  total: number;
  metodo: MetodoPago | string;
  cajero: string;
}

@Injectable({ providedIn: 'root' })
export class ReciboService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  recibo = signal<ReciboData | null>(null);

  private _gimnasioNombre = '';
  private _gimnasioTel = '';
  private _loaded = false;

  async mostrar(data: Omit<ReciboData, 'gimnasioNombre' | 'gimnasioTel'>): Promise<void> {
    await this.loadGimnasio();
    this.recibo.set({ ...data, gimnasioNombre: this._gimnasioNombre, gimnasioTel: this._gimnasioTel });
  }

  cerrar(): void {
    this.recibo.set(null);
  }

  private async loadGimnasio(): Promise<void> {
    if (this._loaded) return;
    const gimnasioId = this.auth.gimnasioId();
    if (!gimnasioId) return;

    const { data } = await this.supabase.client
      .from('gimnasios')
      .select('nombre, telefono')
      .eq('id', gimnasioId)
      .single();

    if (data) {
      this._gimnasioNombre = (data as { nombre: string; telefono?: string }).nombre;
      this._gimnasioTel = (data as { nombre: string; telefono?: string }).telefono ?? '';
      this._loaded = true;
    }
  }
}
