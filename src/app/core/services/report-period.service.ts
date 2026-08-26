import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReportPeriodService {
  private readonly _desde = signal(firstDayISO());
  private readonly _hasta = signal(todayISO());
  private readonly _revision = signal(0);

  readonly desde = this._desde.asReadonly();
  readonly hasta = this._hasta.asReadonly();
  readonly revision = this._revision.asReadonly();
  readonly etiqueta = computed(() => `${this._desde()} → ${this._hasta()}`);

  setRange(desde: string, hasta: string): void {
    this._desde.set(desde);
    this._hasta.set(hasta);
  }

  refresh(): void {
    this._revision.update((value) => value + 1);
  }

  presetHoy(): void {
    const hoy = todayISO();
    this.setRange(hoy, hoy);
  }

  presetSemanaActual(): void {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    this.setRange(isoDate(start), todayISO());
  }

  presetMesActual(): void {
    this.setRange(firstDayISO(), todayISO());
  }

  presetMesAnterior(): void {
    const today = new Date();
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(firstOfThisMonth);
    lastOfLastMonth.setDate(0);
    this.setRange(isoDate(firstOfLastMonth), isoDate(lastOfLastMonth));
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
