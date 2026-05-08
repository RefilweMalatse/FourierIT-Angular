import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}">
          <span class="toast__icon">
            @if (toast.type === 'success') { ✓ }
            @if (toast.type === 'error')   { ✕ }
            @if (toast.type === 'warning') { ⚠ }
            @if (toast.type === 'info')    { ℹ }
          </span>
          <span class="toast__msg">{{ toast.message }}</span>
          <button class="toast__close" (click)="toastSvc.dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 10px; z-index: 1000;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 9px; min-width: 280px;
      font-size: 13.5px; font-weight: 500;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from { transform: translateX(60px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .toast--success { background: #e6f9f0; color: #1e7a50; border-left: 4px solid #3dba7e; }
    .toast--error   { background: #fdf2f2; color: #c0392b; border-left: 4px solid #e05252; }
    .toast--warning { background: #fff8e6; color: #b07d00; border-left: 4px solid #f0a500; }
    .toast--info    { background: #eaf2fb; color: #1a5c99; border-left: 4px solid #2e6da4; }
    .toast__icon    { font-size: 15px; font-weight: 700; }
    .toast__msg     { flex: 1; }
    .toast__close   { background: none; border: none; cursor: pointer; font-size: 18px; opacity: 0.5; }
    .toast__close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  toastSvc = inject(ToastService);
}