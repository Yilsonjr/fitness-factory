import { Routes } from '@angular/router';
import { authGuard, adminGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'clientes',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/clientes/lista/clientes-lista.component').then(m => m.ClientesListaComponent),
          },
          {
            path: 'nuevo',
            loadComponent: () =>
              import('./features/clientes/formulario/cliente-form.component').then(m => m.ClienteFormComponent),
          },
          {
            path: ':id/asistencias',
            loadComponent: () =>
              import('./features/clientes/asistencias/cliente-asistencias.component').then(m => m.ClienteAsistenciasComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/clientes/detalle/cliente-detalle.component').then(m => m.ClienteDetalleComponent),
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/clientes/formulario/cliente-form.component').then(m => m.ClienteFormComponent),
          },
        ],
      },
      {
        path: 'membresias',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/membresias/lista/membresias-lista.component').then(m => m.MembresiasListaComponent),
          },
          {
            path: 'asignar',
            loadComponent: () =>
              import('./features/membresias/formulario/membresia-form.component').then(m => m.MembresiaFormComponent),
          },
        ],
      },
      {
        path: 'caja',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/caja/turno/turno-caja.component').then(m => m.TurnoCajaComponent),
          },
          {
            path: 'cobrar',
            loadComponent: () =>
              import('./features/caja/pagos/registro-pago.component').then(m => m.RegistroPagoComponent),
          },
        ],
      },
      {
        path: 'productos',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/productos/lista/productos-lista.component').then(m => m.ProductosListaComponent),
          },
          {
            path: 'inventario',
            loadComponent: () =>
              import('./features/productos/inventario/productos-inventario.component').then(m => m.ProductosInventarioComponent),
          },
          {
            path: 'nuevo',
            canActivate: [adminGuard],
            loadComponent: () =>
              import('./features/productos/formulario/producto-form.component').then(m => m.ProductoFormComponent),
          },
          {
            path: ':id/editar',
            canActivate: [adminGuard],
            loadComponent: () =>
              import('./features/productos/formulario/producto-form.component').then(m => m.ProductoFormComponent),
          },
        ],
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/punto-venta.component').then(m => m.PuntoVentaComponent),
      },
      {
        path: 'reportes',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'general',
          },
          {
            path: 'general',
            loadComponent: () =>
              import('./features/reportes/general/reportes-general.component').then(m => m.ReportesGeneralComponent),
          },
          {
            path: 'finanzas',
            loadComponent: () =>
              import('./features/reportes/finanzas/reportes-finanzas.component').then(m => m.ReportesFinanzasComponent),
          },
          {
            path: 'membresias',
            loadComponent: () =>
              import('./features/reportes/membresias/reportes-membresias.component').then(m => m.ReportesMembresiasComponent),
          },
          {
            path: 'ventas-anuladas',
            redirectTo: 'ventas/anuladas',
            pathMatch: 'full',
          },
          {
            path: 'ventas',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/reportes/ventas/reportes-ventas.component').then(m => m.ReportesVentasComponent),
              },
              {
                path: 'anuladas',
                loadComponent: () =>
                  import('./features/reportes/ventas-anuladas/ventas-anuladas.component').then(m => m.VentasAnuladasComponent),
              },
            ],
          },
          {
            path: 'caja',
            loadComponent: () =>
              import('./features/reportes/caja/reportes-caja.component').then(m => m.ReportesCajaComponent),
          },
        ],
      },
      {
        path: 'configuracion',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'general',
          },
          {
            path: 'general',
            loadComponent: () =>
              import('./features/configuracion/general/config-general.component').then(m => m.ConfigGeneralComponent),
          },
          {
            path: 'membresias',
            loadComponent: () =>
              import('./features/configuracion/membresias/config-membresias.component').then(m => m.ConfigMembresiasComponent),
          },
          {
            path: 'operacion',
            loadComponent: () =>
              import('./features/configuracion/operacion/config-operacion.component').then(m => m.ConfigOperacionComponent),
          },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./features/configuracion/usuarios/config-usuarios.component').then(m => m.ConfigUsuariosComponent),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
