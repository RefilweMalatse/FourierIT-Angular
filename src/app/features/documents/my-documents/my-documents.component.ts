import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-documents.component.html',
  styleUrl: './my-documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyDocumentsComponent {}
