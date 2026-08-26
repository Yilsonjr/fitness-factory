import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'frozen';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'status-badge',
    '[class.is-success]': 'tone() === "success"',
    '[class.is-warning]': 'tone() === "warning"',
    '[class.is-danger]': 'tone() === "danger"',
    '[class.is-frozen]': 'tone() === "frozen"',
    '[class.is-neutral]': 'tone() === "neutral"',
  },
  template: `
    <span class="status-badge-label">{{ label() }}</span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      padding: var(--space-1) var(--space-3);
      border: 1px solid transparent;
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      white-space: nowrap;
      line-height: 1.2;
    }

    :host(.is-neutral) {
      background: var(--color-neutral-subtle);
      color: var(--text-secondary);
    }

    :host(.is-success) {
      background: var(--color-success-subtle);
      color: var(--color-success-text);
    }

    :host(.is-warning) {
      background: var(--color-warning-subtle);
      color: var(--color-warning-text);
    }

    :host(.is-danger) {
      background: var(--color-danger-subtle);
      color: var(--color-danger-text);
    }

    :host(.is-frozen) {
      background: var(--color-frozen-subtle);
      color: var(--color-frozen-text);
    }

    .status-badge-label {
      display: inline-flex;
      align-items: center;
    }
  `],
})
export class StatusBadgeComponent {
  readonly label = input<string>('');
  readonly tone = input<StatusBadgeTone>('neutral');
}
