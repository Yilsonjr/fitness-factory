import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confirm-backdrop" (click)="cancel.emit()"></div>
    <div
      #dialog
      class="confirm-dialog"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId()"
      tabindex="-1"
      (keydown)="onKeydown($event)"
    >
      <div class="confirm-header">
        <div>
          <h2 [id]="titleId()">{{ title() }}</h2>
          @if (description()) {
            <p>{{ description() }}</p>
          }
        </div>
        <button type="button" class="close-btn" (click)="cancel.emit()" [attr.aria-label]="cancelLabel()">×</button>
      </div>

      <div class="confirm-body">
        <ng-content select="[dialog-body]"></ng-content>
      </div>

      <div class="confirm-actions">
        <ng-content select="[dialog-actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: grid;
      place-items: center;
      padding: var(--space-4);
    }

    .confirm-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
    }

    .confirm-dialog {
      position: relative;
      z-index: 1;
      width: min(100%, 42rem);
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: var(--space-5);
      box-shadow: var(--shadow-lg);
      display: grid;
      gap: var(--space-4);
      outline: none;
    }

    .confirm-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
    }

    h2 {
      margin: 0;
      color: var(--text-primary);
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
    }

    p {
      margin: var(--space-1) 0 0;
      color: var(--text-secondary);
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .close-btn {
      border: 0;
      background: transparent;
      color: var(--text-secondary);
      font-size: var(--text-2xl);
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }

    .close-btn:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
      border-radius: var(--radius-sm);
    }

    :host(:focus-visible) {
      outline: none;
    }

    @media (max-width: 768px) {
      .confirm-dialog { padding: var(--space-4); }
      .confirm-header,
      .confirm-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .confirm-actions > * {
        width: 100%;
      }
    }
  `],
})
export class ConfirmDialogComponent implements AfterViewInit {
  readonly title = input<string>('Confirmar');
  readonly description = input<string>('');
  readonly cancelLabel = input<string>('Cancelar');
  readonly titleId = input<string>('confirm-dialog-title');

  readonly cancel = output<void>();

  @ViewChild('dialog') private dialogRef?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    queueMicrotask(() => this.focusFirstElement());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel.emit();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.dialogRef?.nativeElement.ownerDocument?.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirstElement(): void {
    const firstFocusable = this.getFocusableElements()[0];
    (firstFocusable ?? this.dialogRef?.nativeElement)?.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const root = this.dialogRef?.nativeElement;
    if (!root) return [];

    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.offsetParent !== null);
  }
}
