import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../../core/services/clientes.service';
import { Cliente } from '../../../core/models';

export type ClienteBusqueda = Pick<Cliente, 'id' | 'nombre' | 'apellido' | 'cedula' | 'telefono'>;

@Component({
  selector: 'app-client-search',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label [for]="inputId()">{{ label() }}</label>
      @if (selected()) {
        <div class="selected">
          <strong>{{ selected()!.nombre }} {{ selected()!.apellido }}</strong>
          <ng-content />
          <button type="button" class="link" (click)="clear()">Cambiar</button>
        </div>
      } @else {
        <input
          [id]="inputId()"
          type="text"
          [(ngModel)]="term"
          [name]="inputId()"
          [placeholder]="placeholder()"
          (input)="onInput()"
        />
        <div class="results">
          @for (c of resultados(); track c.id) {
            <button type="button" class="result" (click)="select(c)">
              <strong>{{ c.nombre }} {{ c.apellido }}</strong>
              <span>{{ c.cedula || 'Sin cédula' }} · {{ c.telefono || 'Sin teléfono' }}</span>
            </button>
          } @empty {
            @if (term.trim().length > 1) {
              <div class="empty">Sin resultados</div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: .4rem; }
    label { color: var(--text-secondary, #94a3b8); font-size: .85rem; }
    input { background: var(--bg-primary, #0f172a); color: var(--text-primary, #f1f5f9); border: 1px solid var(--border, #334155); border-radius: 10px; padding: .8rem .9rem; width: 100%; box-sizing: border-box; }
    input:focus-visible { border-color: var(--primary); box-shadow: var(--shadow-focus); outline: none; }
    .results { display: flex; flex-direction: column; gap: .5rem; margin-top: .5rem; }
    .result { text-align: left; border: 1px solid var(--border, #334155); background: var(--bg-row-hover); color: var(--text-primary, #f1f5f9); border-radius: 10px; padding: .75rem .85rem; cursor: pointer; display: flex; flex-direction: column; gap: .1rem; }
    .result span { color: var(--text-secondary, #94a3b8); font-size: .85rem; }
    .result:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
    .selected { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; padding: .5rem 0; }
    .selected strong { color: var(--text-primary, #f1f5f9); }
    .link { background: none; border: 0; color: var(--primary, #3b82f6); cursor: pointer; padding: 0; font-size: .85rem; }
    .empty { color: var(--text-secondary, #94a3b8); font-size: .85rem; }
  `],
})
export class ClientSearchComponent {
  readonly inputId = input<string>('client-search');
  readonly label = input<string>('Cliente');
  readonly placeholder = input<string>('Buscar por nombre, cédula o teléfono');
  readonly selected = input<ClienteBusqueda | null>(null);

  readonly clienteSelected = output<ClienteBusqueda>();
  readonly clienteCleared = output<void>();

  term = '';
  resultados = signal<ClienteBusqueda[]>([]);

  constructor(private clientes: ClientesService) {}

  async onInput() {
    if (this.term.trim().length < 2) {
      this.resultados.set([]);
      return;
    }
    this.resultados.set((await this.clientes.buscar(this.term.trim())) as ClienteBusqueda[]);
  }

  select(cliente: ClienteBusqueda) {
    this.term = cliente.nombre + ' ' + cliente.apellido;
    this.resultados.set([]);
    this.clienteSelected.emit(cliente);
  }

  clear() {
    this.term = '';
    this.resultados.set([]);
    this.clienteCleared.emit();
  }
}
