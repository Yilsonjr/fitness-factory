import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="skeleton" [style.width]="width()" [style.height]="height()" [class.rounded]="rounded()"></span>
  `,
  styles: [`
    :host { display: inline-block; }
    .skeleton {
      display: inline-block;
      width: 100%;
      background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card) 50%, var(--bg-elevated) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    .rounded { border-radius: var(--radius-md); }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly rounded = input<boolean>(true);
}
