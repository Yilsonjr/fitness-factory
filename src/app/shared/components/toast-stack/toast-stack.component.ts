import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastTone } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.messages(); track toast.id) {
        <article class="toast" [class.is-success]="toast.tone === 'success'" [class.is-error]="toast.tone === 'error'" [class.is-info]="toast.tone === 'info'" [class.is-warning]="toast.tone === 'warning'">
          <div class="toast-copy">
            <strong>{{ toast.title }}</strong>
            <p>{{ toast.message }}</p>
          </div>
          <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" [attr.aria-label]="'Cerrar aviso: ' + toast.title">×</button>
        </article>
      }
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      right: var(--space-4);
      bottom: var(--space-4);
      z-index: 120;
      width: min(100%, 24rem);
      pointer-events: none;
    }

    .toast-stack {
      display: grid;
      gap: var(--space-3);
    }

    .toast {
      pointer-events: auto;
      display: flex;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-card);
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      box-shadow: var(--shadow-lg);
    }

    .toast.is-success { border-color: var(--color-success-subtle); }
    .toast.is-error { border-color: var(--color-danger-subtle); }
    .toast.is-info { border-color: var(--primary-subtle); }
    .toast.is-warning { border-color: var(--color-warning-subtle); }

    .toast-copy {
      display: grid;
      gap: var(--space-1);
      min-width: 0;
    }

    strong {
      color: var(--text-primary);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: var(--text-sm);
      line-height: 1.4;
    }

    .toast-close {
      border: 0;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: var(--text-xl);
      line-height: 1;
      padding: 0;
      align-self: flex-start;
    }

    .toast-close:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
      border-radius: var(--radius-sm);
    }

    @media (max-width: 768px) {
      :host {
        left: var(--space-4);
        right: var(--space-4);
        width: auto;
      }
    }
  `],
})
export class ToastStackComponent {
  readonly toastService = inject(ToastService);
}
