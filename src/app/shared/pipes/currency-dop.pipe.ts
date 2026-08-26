import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyDop' })
export class CurrencyDopPipe implements PipeTransform {
  private static readonly formatter = new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  });

  transform(value: number | null | undefined): string {
    return CurrencyDopPipe.formatter.format(value ?? 0);
  }
}
