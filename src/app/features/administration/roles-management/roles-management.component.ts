import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

// ERD: Role(RoleID, RoleName), Permission(PermissionID, PermissionKey), RolePermission(RoleID, PermissionID)
export interface Permission { id: string; key: string; label: string; }
export interface Role { id: string; name: string; description: string; permissions: string[]; userCount: number; }

@Component({
  selector: 'app-roles-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles-management.component.html',
  styleUrl: './roles-management.component.scss'
})
export class RolesManagementComponent {
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);

  showModal    = signal(false);
  editId       = signal<string | null>(null);
  isSubmitting = signal(false);

  // ERD: Permission table (PermissionKey)
  allPermissions: Permission[] = [
    { id: '1', key: 'Create',             label: 'Create' },
    { id: '2', key: 'Read',               label: 'Read' },
    { id: '3', key: 'Update',             label: 'Update' },
    { id: '4', key: 'Delete',             label: 'Delete' },
    { id: '5', key: 'Share',              label: 'Share Documents' },
    { id: '6', key: 'ManageUsers',        label: 'Manage Users' },
    { id: '7', key: 'SystemSettings',     label: 'System Settings' },
    { id: '8', key: 'Reports',            label: 'Reports' },
    { id: '9', key: 'Download',           label: 'Download' },
    { id: '10', key: 'ManageDeptUsers',   label: 'Manage Dept. Users' },
  ];

  form = this.fb.group({
    roleName:    ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', Validators.required],
    permissions: [[] as string[]],
  });

  roles = signal<Role[]>([
    { id: '1', name: 'Admin',              description: 'Full system access and control',          permissions: ['Create','Read','Update','Delete','ManageUsers','SystemSettings'], userCount: 3 },
    { id: '2', name: 'Editor',             description: 'Can create and edit documents',           permissions: ['Create','Read','Update','Share'], userCount: 12 },
    { id: '3', name: 'Viewer',             description: 'Read-only access to documents',           permissions: ['Read','Download'], userCount: 28 },
    { id: '4', name: 'Department Manager', description: 'Manage department documents and users',   permissions: ['Create','Read','Update','Delete','ManageDeptUsers'], userCount: 5 },
  ]);

  isChecked(key: string): boolean {
    return (this.form.value.permissions ?? []).includes(key);
  }

  togglePermission(key: string): void {
    const current = this.form.value.permissions ?? [];
    const updated = current.includes(key)
      ? current.filter(p => p !== key)
      : [...current, key];
    this.form.patchValue({ permissions: updated });
  }

  openCreate(): void {
    this.form.reset({ permissions: [] });
    this.editId.set(null);
    this.showModal.set(true);
  }

  openEdit(role: Role): void {
    this.editId.set(role.id);
    this.form.patchValue({ roleName: role.name, description: role.description, permissions: role.permissions });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if ((this.form.value.permissions ?? []).length === 0) {
      this.toast.show('Select at least one permission.', 'error'); return;
    }
    this.isSubmitting.set(true);
    // TODO: connect to RoleService API
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.toast.show(this.editId() ? 'Role updated.' : 'Role created.', 'success');
      this.showModal.set(false);
    }, 600);
  }

  onDelete(id: string): void {
    this.roles.update(list => list.filter(r => r.id !== id));
    this.toast.show('Role deleted.', 'success');
  }
}