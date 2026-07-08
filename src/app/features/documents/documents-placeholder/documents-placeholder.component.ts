import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-documents-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-placeholder.component.html',
  styleUrl: './documents-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsPlaceholderComponent {
  private route = inject(ActivatedRoute);
  readonly title =
    this.route.snapshot.data?.['documentPageTitle']
    ?? 'Documents';

  readonly message = this.route.snapshot.data?.['subtitle'] ?? 'Coming soon.';
}
