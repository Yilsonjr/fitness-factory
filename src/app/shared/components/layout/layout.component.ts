import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastStackComponent } from '../toast-stack/toast-stack.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { ReciboModalComponent } from '../recibo-modal/recibo-modal.component';
import { ReciboService } from '../../../core/services/recibo.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TitleCasePipe, NgOptimizedImage, BreadcrumbsComponent, ToastStackComponent, ReciboModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#main-content" class="skip-link">Saltar al contenido</a>
    <div class="layout" [class.sidebar-collapsed]="collapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            @if (collapsed()) {
              <img ngSrc="/logo.png" alt="Fitness Factory" width="36" height="36" class="logo-icon" priority />
            } @else {
              <img ngSrc="/logo horizontal.png" alt="Fitness Factory" width="160" height="36" class="logo-horizontal" priority />
            }
          </div>
          <button class="btn-collapse" (click)="toggleSidebar()" [attr.aria-label]="collapsed() ? 'Expandir barra lateral' : 'Colapsar barra lateral'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (collapsed()) {
                <path d="M9 18l6-6-6-6"/>
              } @else {
                <path d="M15 18l-6-6 6-6"/>
              }
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav" aria-label="Navegación principal">
          <a routerLink="/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Dashboard' : null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            @if (!collapsed()) { <span>Dashboard</span> }
          </a>

          <a routerLink="/clientes" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Clientes' : null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            @if (!collapsed()) { <span>Clientes</span> }
          </a>

          <a routerLink="/membresias" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Membresías' : null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <path d="M1 10h22"/>
            </svg>
            @if (!collapsed()) { <span>Membresías</span> }
          </a>

          <a routerLink="/caja" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Caja' : null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            @if (!collapsed()) { <span>Caja</span> }
          </a>

          <a routerLink="/pos" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Punto de Venta' : null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            @if (!collapsed()) { <span>Punto de Venta</span> }
          </a>

          <a routerLink="/productos" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Productos' : null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="12"/>
            </svg>
            @if (!collapsed()) { <span>Productos</span> }
          </a>

          <a routerLink="/acceso" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Acceso biométrico' : null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 2C9.5 2 7.5 4 7.5 7c0 4 4.5 9 4.5 9s4.5-5 4.5-9c0-3-2-5-4.5-5z"/>
              <line x1="9.5" y1="7" x2="9.5" y2="13"/>
              <line x1="11" y1="6" x2="11" y2="14"/>
              <line x1="12.5" y1="5.5" x2="12.5" y2="14"/>
              <line x1="14" y1="6.5" x2="14" y2="13"/>
            </svg>
            @if (!collapsed()) { <span>Acceso</span> }
          </a>

          @if (auth.isAdmin()) {
            <div class="nav-divider"></div>

            <a routerLink="/reportes" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Reportes' : null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 20V10"/>
                <path d="M12 20V4"/>
                <path d="M6 20v-6"/>
              </svg>
              @if (!collapsed()) { <span>Reportes</span> }
            </a>

            <a routerLink="/configuracion" routerLinkActive="active" ariaCurrentWhenActive="page" class="nav-item" [attr.aria-label]="collapsed() ? 'Configuración' : null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              @if (!collapsed()) { <span>Configuración</span> }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              {{ auth.usuario()?.nombre?.charAt(0) ?? 'U' }}
            </div>
            @if (!collapsed()) {
              <div class="user-details">
                <span class="user-name">{{ auth.usuario()?.nombre }}</span>
                <span class="user-role">{{ auth.usuario()?.rol | titlecase }}</span>
              </div>
            }
          </div>
          <button class="btn-logout" (click)="auth.logout()" aria-label="Cerrar sesión">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main id="main-content" class="main-content">
        <app-breadcrumbs />
        <router-outlet />
      </main>

      <app-toast-stack />
      @if (reciboService.recibo()) { <app-recibo-modal /> }
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary, #0f172a);
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      width: 260px;
      background: var(--bg-card, #1e293b);
      border-right: 1px solid var(--border, #334155);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 50;
    }

    .sidebar-collapsed .sidebar {
      width: 72px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--border, #334155);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-horizontal {
      height: 36px;
      width: auto;
      object-fit: contain;
      display: block;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      object-fit: contain;
      display: block;
    }

    .skip-link {
      position: absolute;
      top: -100%;
      left: 0;
      background: var(--brand, #B7F500);
      color: var(--brand-contrast, #0d1000);
      padding: 0.5rem 1rem;
      border-radius: 0 0 8px 0;
      font-weight: 600;
      z-index: 200;
      text-decoration: none;
    }

    .skip-link:focus-visible {
      top: 0;
    }

    .btn-collapse {
      background: none;
      border: none;
      color: var(--text-secondary, #94a3b8);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 6px;
      transition: color 0.2s;
    }

    .btn-collapse:hover {
      color: var(--text-primary, #f1f5f9);
    }

    /* ===== NAV ===== */
    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0.5rem;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 1rem;
      color: var(--text-secondary, #94a3b8);
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s, background 0.2s;
      margin-bottom: 2px;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary, #f1f5f9);
    }

    .nav-item.active {
      background: var(--brand-soft, rgba(183, 245, 0, 0.10));
      color: var(--brand, #B7F500);
      font-weight: var(--font-semibold);
    }

    .nav-divider {
      height: 1px;
      background: var(--border, #334155);
      margin: 0.75rem 1rem;
    }

    .sidebar-collapsed .nav-item {
      justify-content: center;
      padding: 0.7rem;
    }

    /* ===== FOOTER ===== */
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--border, #334155);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary, #3b82f6);
      color: var(--text-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary, #f1f5f9);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--text-secondary, #94a3b8);
    }

    .btn-logout {
      background: none;
      border: none;
      color: var(--text-secondary, #94a3b8);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: color 0.2s;
    }

    .btn-logout:hover {
      color: var(--color-danger);
    }

    /* ===== MAIN ===== */
    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      transition: margin-left 0.3s ease;
      min-height: 100vh;
    }

    .sidebar-collapsed .main-content {
      margin-left: 72px;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .sidebar {
        width: 72px;
      }
      .logo-horizontal, .user-details, .nav-item span {
        display: none !important;
      }
      .logo-icon {
        display: block !important;
      }
      .main-content {
        margin-left: 72px;
      }
      .nav-item {
        justify-content: center;
        padding: 0.7rem;
      }
      .btn-collapse {
        display: none;
      }
      .sidebar-footer {
        justify-content: center;
      }
      .btn-logout {
        display: none;
      }
    }
  `],
})
export class LayoutComponent {
  collapsed = signal(false);

  constructor(public auth: AuthService, public reciboService: ReciboService) {}

  toggleSidebar() {
    this.collapsed.update(v => !v);
  }
}
