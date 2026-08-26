import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-skeleton-list',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-list" [style.gap]="gap()">
      @for (item of items(); track $index) {
        <app-skeleton [width]="item.width" [height]="item.height" [rounded]="item.rounded ?? true"></app-skeleton>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .skeleton-list { display: grid; }
  `],
})
export class SkeletonListComponent {
  readonly gap = input<string>('var(--space-3)');
  readonly items = input<Array<{ width: string; height: string; rounded?: boolean }>>([]);
}
