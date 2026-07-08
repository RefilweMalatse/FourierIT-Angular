import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditEventType } from '../../../core/models/institution.models';
import { ApiRoleDto, RolesManagementService } from '../../../core/services/roles-management.service';

// ERD: Role(RoleID, RoleName)
export interface Role { id: string; name: string; }

@Component({
  selector: 'app-roles-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles-management.component.html',
  styleUrl: './roles-management.component.scss'
})
export class RolesManagementComponent {
  readonly auth = inject(AuthService);
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);
  private rolesService = inject(RolesManagementService);

  showModal    = signal(false);
  editId       = signal<string | null>(null);
  isSubmitting = signal(false);
  isLoading = signal(false);

  form = this.fb.group({
    roleId:      ['', [Validators.required, Validators.maxLength(450)]],
    roleName:    ['', [Validators.required, Validators.maxLength(50)]],
  });

  roles = signal<Role[]>([]);

  constructor() {
    this.loadRoles();
  }

  openCreate(): void {
    this.form.reset({ roleId: '', roleName: '' });
    this.editId.set(null);
    this.showModal.set(true);
  }

  openEdit(role: Role): void {
    this.editId.set(role.id);
    this.form.patchValue({ roleId: role.id, roleName: role.name });
    this.form.controls.roleId.disable();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.form.controls.roleId.enable();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const raw = this.form.getRawValue();
    const roleId = (raw.roleId ?? '').trim();
    const roleName = (raw.roleName ?? '').trim();

    this.isSubmitting.set(true);
    const request$ = this.editId()
      ? this.rolesService.update(this.editId()!, { roleName, newRoleId: this.editId()! })
      : this.rolesService.create({ roleId, roleName });

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.auth.logActivity(this.editId() ? AuditEventType.UPDATE : AuditEventType.CREATE, `Role ${roleName} saved`);
          this.toast.show(this.editId() ? 'Role updated.' : 'Role created.', 'success');
          this.closeModal();
          this.loadRoles();
        },
        error: (error) => {
          const message = error?.error?.error || error?.error?.title || error?.error?.message || 'Failed to save role.';
          this.toast.show(message, 'error');
        }
      });
  }

  onDelete(id: string): void {
    this.rolesService.delete(id).subscribe({
      next: () => {
        this.auth.logActivity(AuditEventType.DELETE, `Deleted role ${id}`);
        this.roles.update(list => list.filter(r => r.id !== id));
        this.toast.show('Role deleted.', 'success');
      },
      error: (error) => {
        const message = error?.error?.error || error?.error?.title || error?.error?.message || 'Failed to delete role.';
        this.toast.show(message, 'error');
      }
    });
  }

  private loadRoles(): void {
    this.isLoading.set(true);
    this.rolesService.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (roles) => {
          this.roles.set((roles ?? []).map((r: ApiRoleDto) => ({ id: r.roleId, name: r.roleName })));
        },
        error: (error) => {
          this.roles.set([]);
          const message = error?.error?.error || error?.error?.title || error?.error?.message || 'Failed to load roles.';
          this.toast.show(message, 'error');
        }
      });
  }
}