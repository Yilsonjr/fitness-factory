import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { SecondaryNavComponent } from '../../shared/components/secondary-nav/secondary-nav.component';
import { ReportPeriodService } from '../../core/services/report-period.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, RouterOutlet, SecondaryNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Reportes</h1>
          <p class="subtitle">Divididos por dominio para evitar una pantalla interminable.</p>
        </div>
        <button class="btn-secondary" type="button" (click)="aplicar()">↻ Actualizar</button>
      </div>

      <app-secondary-nav [items]="navItems" ariaLabel="Secciones de reportes" />

      <section class="card filters">
        <div class="field">
          <label for="rep-desde">Desde</label>
          <input id="rep-desde" type="date" [(ngModel)]="desde" name="desde" />
        </div>
        <div class="field">
          <label for="rep-hasta">Hasta</label>
          <input id="rep-hasta" type="date" [(ngModel)]="hasta" name="hasta" />
        </div>
        <div class="presets" aria-label="Presets de fechas">
          <button type="button" class="preset" (click)="presetHoy()">Hoy</button>
          <button type="button" class="preset" (click)="presetSemana()">Esta semana</button>
          <button type="button" class="preset" (click)="presetMes()">Este mes</button>
          <button type="button" class="preset" (click)="presetMesAnterior()">Mes anterior</button>
        </div>
      </section>

      <router-outlet />
    </div>
  `,
  styleUrl: './reportes.component.css',
})
export class ReportesComponent implements OnInit {
  readonly navItems = [
    { label: 'General', route: '/reportes/general', exact: true },
    { label: 'Finanzas', route: '/reportes/finanzas', exact: true },
    { label: 'Membresías', route: '/reportes/membresias', exact: true },
    { label: 'Ventas', route: '/reportes/ventas', exact: true },
    { label: 'Caja', route: '/reportes/caja', exact: true },
  ];

  desde = firstDayISO();
  hasta = todayISO();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private periodo: ReportPeriodService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.desde = params.get('desde') ?? this.desde;
    this.hasta = params.get('hasta') ?? this.hasta;
    this.periodo.setRange(this.desde, this.hasta);
  }

  aplicar(): void {
    this.periodo.setRange(this.desde, this.hasta);
    this.periodo.refresh();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { desde: this.desde, hasta: this.hasta },
      queryParamsHandling: 'merge',
    });
  }

  presetHoy(): void {
    const hoy = todayISO();
    this.desde = hoy;
    this.hasta = hoy;
    this.aplicar();
  }

  presetSemana(): void {
    const hoy = new Date();
    const day = hoy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() + diff);
    this.desde = isoDate(inicio);
    this.hasta = todayISO();
    this.aplicar();
  }

  presetMes(): void {
    this.desde = firstDayISO();
    this.hasta = todayISO();
    this.aplicar();
  }

  presetMesAnterior(): void {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    this.desde = isoDate(inicio);
    this.hasta = isoDate(fin);
    this.aplicar();
  }
}

function todayISO(): string {
  return isoDate(new Date());
}

function firstDayISO(): string {
  const date = new Date();
  date.setDate(1);
  return isoDate(date);
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
