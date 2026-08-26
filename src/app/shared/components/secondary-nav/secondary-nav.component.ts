import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SecondaryNavItem {
  label: string;
  route: string;
  exact?: boolean;
  description?: string;
}

@Component({
  selector: 'app-secondary-nav',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="secondary-nav" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item.route) {
        <a
          class="nav-item"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
          ariaCurrentWhenActive="page"
        >
          <span>{{ item.label }}</span>
          @if (item.description) {
            <small>{{ item.description }}</small>
          }
        </a>
      }
    </nav>
  `,
  styles: [`
    :host { display: block; }

    .secondary-nav {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .nav-item {
      display: inline-flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-secondary);
      text-decoration: none;
      transition: var(--transition-fast);
    }

    .nav-item:hover {
      color: var(--text-primary);
      border-color: var(--border-hover, var(--border));
      background: var(--bg-elevated);
    }

    .nav-item.active {
      background: var(--primary-subtle);
      border-color: var(--primary);
      color: var(--primary);
    }

    span {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
    }

    small {
      font-size: var(--text-xs);
      color: inherit;
      opacity: 0.85;
    }

    @media (max-width: 768px) {
      .secondary-nav {
        flex-direction: column;
      }

      .nav-item {
        width: 100%;
        border-radius: var(--radius-md);
      }
    }
  `],
})
export class SecondaryNavComponent {
  readonly items = input<SecondaryNavItem[]>([]);
  readonly ariaLabel = input('Navegación secundaria');
}
