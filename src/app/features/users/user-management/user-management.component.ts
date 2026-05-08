import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine?: string;
  postalCode?: string;
  province?: string;
  city?: string;
  suburb?: string;
  roleId: string;
  roleName: string;
  securityQuestion?: string;
  securityAnswer?: string;
  mfaEnabled?: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  showModal = signal(false);
  editId = signal<string | null>(null);
  isSubmitting = signal(false);
  search = signal('');

  roles = [
    { id: '1', name: 'Admin' },
    { id: '2', name: 'Editor' },
    { id: '3', name: 'Viewer' },
    { id: '4', name: 'Department Manager' },
  ];

  securityQuestions = [
    'What was the name of your first pet?',
    'What is your mother\'s maiden name?',
    'What city were you born in?',
    'What was the name of your primary school?',
  ];

  provinces = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'];

  users = signal<UserProfile[]>([
    { id: '1', firstName: 'Aisha', lastName: 'Nkosi', email: 'aisha.nkosi@fouriergroup.com', roleId: '1', roleName: 'Admin', status: 'Active', createdAt: '2024-12-08' },
    { id: '2', firstName: 'Daniel', lastName: 'Smith', email: 'daniel.smith@fouriergroup.com', roleId: '2', roleName: 'Editor', status: 'Active', createdAt: '2025-01-16' },
    { id: '3', firstName: 'Mia', lastName: 'Chen', email: 'mia.chen@fouriergroup.com', roleId: '3', roleName: 'Viewer', status: 'Inactive', createdAt: '2024-11-21' },
  ]);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    addressLine: [''],
    postalCode: [''],
    province: [''],
    city: [''],
    suburb: [''],
    roleId: ['', Validators.required],
    securityQuestion: [''],
    securityAnswer: [''],
    mfaEnabled: [false],
    status: ['Active'],
    password: [''],
    confirmPassword: [''],
  });

  get filtered() {
    const q = this.search().toLowerCase();
    return this.users().filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.roleName.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.form.reset({ status: 'Active', password: '', confirmPassword: '' });
    this.editId.set(null);
    this.showModal.set(true);
  }

  openEdit(user: UserProfile): void {
    this.editId.set(user.id);
    this.form.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      addressLine: user.addressLine || '',
      postalCode: user.postalCode || '',
      province: user.province || '',
      city: user.city || '',
      suburb: user.suburb || '',
      roleId: user.roleId,
      securityQuestion: user.securityQuestion || '',
      securityAnswer: user.securityAnswer || '',
      mfaEnabled: user.mfaEnabled || false,
      status: user.status,
      password: '',
      confirmPassword: '',
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value as {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      addressLine: string | null;
      postalCode: string | null;
      province: string | null;
      city: string | null;
      suburb: string | null;
      roleId: string | null;
      securityQuestion: string | null;
      securityAnswer: string | null;
      mfaEnabled: boolean | null;
      status: string | null;
      password: string | null;
      confirmPassword: string | null;
    };

    if (!this.editId() && (!value.password || !value.confirmPassword)) {
      this.toast.show('Password is required for new users.', 'error');
      return;
    }

    if (value.password || value.confirmPassword) {
      if (value.password !== value.confirmPassword) {
        this.toast.show('Passwords do not match.', 'error');
        return;
      }
    }

    const role = this.roles.find(r => r.id === value.roleId);
    const payload: UserProfile = {
      id: this.editId() ?? Date.now().toString(),
      firstName: value.firstName ?? '',
      lastName: value.lastName ?? '',
      email: value.email ?? '',
      phone: value.phone || undefined,
      addressLine: value.addressLine || undefined,
      postalCode: value.postalCode || undefined,
      province: value.province || undefined,
      city: value.city || undefined,
      suburb: value.suburb || undefined,
      roleId: value.roleId ?? '',
      roleName: role?.name ?? 'Unknown',
      securityQuestion: value.securityQuestion || undefined,
      securityAnswer: value.securityAnswer || undefined,
      mfaEnabled: value.mfaEnabled || false,
      status: (value.status as 'Active' | 'Inactive') ?? 'Active',
      createdAt: this.editId() ? this.users().find(u => u.id === this.editId())?.createdAt ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    };

    this.isSubmitting.set(true);
    setTimeout(() => {
      if (this.editId()) {
        this.users.update(list => list.map(item => item.id === payload.id ? payload : item));
        this.toast.show('User updated.', 'success');
      } else {
        this.users.update(list => [payload, ...list]);
        this.toast.show('User created.', 'success');
      }
      this.isSubmitting.set(false);
      this.showModal.set(false);
    }, 600);
  }

  onDelete(id: string): void {
    this.users.update(list => list.filter(user => user.id !== id));
    this.toast.show('User deleted.', 'success');
  }
}
