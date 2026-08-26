import { Injectable, signal } from '@angular/core';

// ZKFinger SDK local service — install on the reception PC:
// https://www.zkteco.com/en/software/ZKFinger_SDK
// Default base URL: http://localhost:8088
const ZK_BASE = 'http://localhost:8088/ZKFinger';

export type ZKEstado = 'desconectado' | 'conectando' | 'listo' | 'capturando' | 'simulacion';

export interface ZKPlantilla {
  clienteId: string;
  template: string; // base64
}

export interface ZKResultadoIdentificacion {
  clienteId: string | null;
  template: string | null; // base64 — útil para enrolamiento
}

@Injectable({ providedIn: 'root' })
export class ZKTecoService {
  estado = signal<ZKEstado>('desconectado');
  esModoSimulacion = signal(false);

  private _plantillas: ZKPlantilla[] = [];
  private _identificandoTimer: ReturnType<typeof setInterval> | null = null;

  // ─── Inicialización ───────────────────────────────────────────────────────

  async inicializar(): Promise<boolean> {
    this.estado.set('conectando');
    try {
      const res = await fetch(`${ZK_BASE}/GetDeviceInfo`, { signal: AbortSignal.timeout(2000) });
      if (!res.ok) throw new Error('no device');
      this.estado.set('listo');
      this.esModoSimulacion.set(false);
      return true;
    } catch {
      // ZKFinger SDK not running — fall back to simulation mode
      this.estado.set('simulacion');
      this.esModoSimulacion.set(true);
      return false;
    }
  }

  // ─── Registro de plantillas (1:N matching) ────────────────────────────────

  async registrarPlantillas(plantillas: ZKPlantilla[]): Promise<void> {
    this._plantillas = plantillas;
    if (this.esModoSimulacion()) return;

    try {
      await fetch(`${ZK_BASE}/RegisterTemplates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: plantillas.map(p => ({ id: p.clienteId, template: p.template })) }),
      });
    } catch {
      // non-fatal — identification will still work via fallback
    }
  }

  // ─── Identificación continua (kiosk) ─────────────────────────────────────

  iniciarIdentificacion(onIdentificado: (resultado: ZKResultadoIdentificacion) => void): void {
    if (this.esModoSimulacion()) return; // simulation handled manually in the component

    this.estado.set('capturando');
    this._identificandoTimer = setInterval(async () => {
      try {
        const res = await fetch(`${ZK_BASE}/GetIdentifyResult`);
        if (!res.ok) return;
        const json = await res.json() as { matched: boolean; id?: string; template?: string };
        if (json.matched && json.id) {
          onIdentificado({ clienteId: json.id, template: json.template ?? null });
        }
      } catch {
        // ignore transient errors — keep polling
      }
    }, 800);
  }

  detenerIdentificacion(): void {
    if (this._identificandoTimer !== null) {
      clearInterval(this._identificandoTimer);
      this._identificandoTimer = null;
    }
    if (!this.esModoSimulacion()) {
      this.estado.set('listo');
      fetch(`${ZK_BASE}/StopIdentify`, { method: 'POST' }).catch(() => undefined);
    }
  }

  // ─── Captura de huella (enrolamiento) ────────────────────────────────────

  async capturarTemplate(): Promise<{ template: string | null; error: string | null }> {
    if (this.esModoSimulacion()) {
      return { template: null, error: 'Modo simulación: no hay lector conectado' };
    }

    this.estado.set('capturando');
    try {
      await fetch(`${ZK_BASE}/StartCapture`, { method: 'POST' });

      // Poll up to 15 seconds for the user to place their finger
      for (let i = 0; i < 30; i++) {
        await delay(500);
        const res = await fetch(`${ZK_BASE}/GetCaptureResult`);
        if (!res.ok) continue;
        const json = await res.json() as { captured: boolean; template?: string };
        if (json.captured && json.template) {
          this.estado.set('listo');
          return { template: json.template, error: null };
        }
      }
      this.estado.set('listo');
      return { template: null, error: 'Tiempo de espera agotado. Intenta de nuevo.' };
    } catch (e) {
      this.estado.set('listo');
      return { template: null, error: 'Error al comunicarse con el lector' };
    }
  }

  destroy(): void {
    this.detenerIdentificacion();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
