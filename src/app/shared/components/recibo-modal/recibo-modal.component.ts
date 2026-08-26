import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReciboService } from '../../../core/services/recibo.service';
import { CurrencyDopPipe } from '../../pipes/currency-dop.pipe';

@Component({
  selector: 'app-recibo-modal',
  imports: [CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (recibo.recibo(); as r) {
      <div class="backdrop" (click)="recibo.cerrar()" aria-hidden="true"></div>
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recibo-title"
      >
        <div class="modal-actions no-print">
          <button class="btn-print" (click)="imprimir()">Imprimir recibo</button>
          <button class="btn-close" (click)="recibo.cerrar()" aria-label="Cerrar recibo">×</button>
        </div>

        <div class="recibo" id="recibo-print">
          <header class="recibo-header">
            <h1 id="recibo-title">{{ r.gimnasioNombre }}</h1>
            @if (r.gimnasioTel) { <p>Tel: {{ r.gimnasioTel }}</p> }
            <p class="recibo-tipo">{{ tipoLabel(r.tipo) }}</p>
          </header>

          <div class="recibo-meta">
            <div><span>Recibo</span><strong>#{{ r.numero }}</strong></div>
            <div><span>Fecha</span><strong>{{ formatFecha(r.fecha) }}</strong></div>
            <div><span>Hora</span><strong>{{ formatHora(r.fecha) }}</strong></div>
            <div><span>Cliente</span><strong>{{ r.clienteNombre }}</strong></div>
            <div><span>Cajero</span><strong>{{ r.cajero }}</strong></div>
          </div>

          <table class="recibo-items" aria-label="Detalle del recibo">
            <thead>
              <tr>
                <th scope="col">Descripción</th>
                <th scope="col" class="right">Cant.</th>
                <th scope="col" class="right">Precio</th>
              </tr>
            </thead>
            <tbody>
              @for (item of r.items; track item.descripcion) {
                <tr>
                  <td>{{ item.descripcion }}</td>
                  <td class="right">{{ item.cantidad ?? 1 }}</td>
                  <td class="right">{{ item.precio | currencyDop }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="recibo-total">
            <span>Total</span>
            <strong>{{ r.total | currencyDop }}</strong>
          </div>

          <div class="recibo-footer">
            <p>Método de pago: {{ metodoPagoLabel(r.metodo) }}</p>
            <p class="thanks">¡Gracias por su visita!</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal, 100);
      display: grid;
      place-items: center;
      padding: var(--space-4);
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
    }

    .modal {
      position: relative;
      z-index: 1;
      width: min(100%, 400px);
      background: #ffffff;
      border-radius: var(--radius-card);
      overflow: hidden;
      display: grid;
    }

    .modal-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
    }

    .btn-print {
      background: var(--primary);
      color: var(--text-on-primary);
      border: none;
      border-radius: var(--radius-md);
      padding: .5rem 1rem;
      font-weight: var(--font-semibold);
      cursor: pointer;
      font-size: var(--text-sm);
    }

    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 .25rem;
    }

    /* ── Recibo (papel) ── */
    .recibo {
      background: #fff;
      color: #111;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      padding: 1.5rem 1.25rem;
      line-height: 1.5;
      max-height: 75vh;
      overflow-y: auto;
    }

    .recibo-header {
      text-align: center;
      margin-bottom: 1rem;
      padding-bottom: .75rem;
      border-bottom: 1px dashed #555;
    }

    .recibo-header h1 {
      font-size: 1rem;
      font-weight: bold;
      margin: 0 0 .2rem;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    .recibo-header p { margin: .15rem 0; font-size: .8rem; color: #444; }
    .recibo-tipo { font-weight: bold; color: #111 !important; margin-top: .4rem !important; }

    .recibo-meta {
      margin-bottom: .75rem;
      padding-bottom: .75rem;
      border-bottom: 1px dashed #555;
    }

    .recibo-meta div {
      display: flex;
      justify-content: space-between;
      gap: .5rem;
      font-size: .8rem;
    }

    .recibo-meta span { color: #555; }
    .recibo-meta strong { color: #111; text-align: right; }

    .recibo-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: .75rem;
    }

    .recibo-items th {
      font-size: .75rem;
      text-transform: uppercase;
      color: #555;
      border-bottom: 1px solid #ccc;
      padding: .2rem 0;
    }

    .recibo-items td {
      font-size: .8rem;
      padding: .25rem 0;
    }

    .right { text-align: right; }

    .recibo-total {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-top: 1px dashed #555;
      padding-top: .6rem;
      margin-bottom: .75rem;
    }

    .recibo-total span { font-size: .85rem; color: #555; }
    .recibo-total strong { font-size: 1.1rem; font-weight: bold; }

    .recibo-footer {
      text-align: center;
      font-size: .75rem;
      color: #555;
      border-top: 1px dashed #555;
      padding-top: .6rem;
    }

    .thanks { font-weight: bold; color: #111; margin-top: .35rem; }

    /* ── Print ── */
    @media print {
      :host {
        position: static;
        display: block;
        padding: 0;
      }

      .backdrop, .no-print { display: none !important; }

      .modal {
        width: 80mm;
        border-radius: 0;
        box-shadow: none;
      }

      .recibo {
        max-height: none;
        overflow: visible;
        padding: .5rem;
      }
    }
  `],
})
export class ReciboModalComponent {
  recibo = inject(ReciboService);

  imprimir(): void {
    window.print();
  }

  tipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      membresia: 'Comprobante de Membresía',
      venta: 'Comprobante de Venta',
      cobro: 'Comprobante de Pago',
    };
    return map[tipo] ?? 'Comprobante';
  }

  metodoPagoLabel(metodo: string): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
    };
    return map[metodo] ?? metodo;
  }

  formatFecha(d: Date): string {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d);
  }

  formatHora(d: Date): string {
    return new Intl.DateTimeFormat('es-DO', { timeStyle: 'short', hour12: true }).format(d);
  }
}
