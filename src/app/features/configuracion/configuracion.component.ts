import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SecondaryNavComponent } from '../../shared/components/secondary-nav/secondary-nav.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [RouterOutlet, SecondaryNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Configuración</h1>
          <p class="subtitle">Organizada por responsabilidad para evitar una pantalla interminable.</p>
        </div>
      </div>

      <app-secondary-nav [items]="navItems" ariaLabel="Secciones de configuración" />

      <router-outlet />
    </div>
  `,
  styleUrl: './configuracion.component.css',
})
export class ConfiguracionComponent {
  readonly navItems = [
    { label: 'General', route: '/configuracion/general', exact: true },
    { label: 'Membresías', route: '/configuracion/membresias', exact: true },
    { label: 'Operación', route: '/configuracion/operacion', exact: true },
    { label: 'Usuarios y acceso', route: '/configuracion/usuarios', exact: true },
  ];
}
