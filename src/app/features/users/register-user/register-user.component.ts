import { Component, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService, RegisterPayload } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import {
  birthDateReasonable,
  formatIsoDateLocal,
  saMobilePhoneOptional
} from '../../../core/validators/profile.validators';

@Component({
  selector: 'app-register-user',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.scss'
})
export class RegisterUserComponent implements OnInit {
  private readonly maxRoles = 2;
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private roleService = inject(RoleService);
  private router = inject(Router);

  isSubmitting = signal(false);
  isLoadingRoles = signal(false);

  readonly maxBirthDate = formatIsoDateLocal(new Date());
  readonly minBirthDate = formatIsoDateLocal((() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d;
  })());

  // From ERD: User(Email, Password_hash, mfa_enabled, IsPEPstatus, AccountStatus)
  // Profile(Address), SecurityQuestion
  form = this.fb.group({
    // User fields
    email: ['', [Validators.required, Validators.email]],
    username: ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    // Profile fields
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    dateOfBirth: ['', [Validators.required, birthDateReasonable()]],
    phone: ['', saMobilePhoneOptional()],
    jobTitle: ['', Validators.required],
    // Role assignment (UserRole table)
    roleIds: this.fb.nonNullable.control<string[]>([], [this.minSelectedRolesValidator(1), this.maxSelectedRolesValidator(this.maxRoles)]),
  });

  roles: Array<{ id: string; name: string }> = [];
  private readonly defaultRoles: Array<{ id: string; name: string }> = [
    { id: 'DA', name: 'Department Admin' },
    { id: 'DO', name: 'Document Owner' },
    { id: 'SH', name: 'Stakeholder' }
  ];

  private isSelfSignupFlow(): boolean {
    return this.router.url.startsWith('/auth/register');
  }

  private navigateAfterRegisterOrCancel(): void {
    const target = this.isSelfSignupFlow() ? '/auth/login' : '/users/management';
    this.router.navigate([target]);
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.isLoadingRoles.set(true);
    this.roleService.getRoles()
      .pipe(finalize(() => this.isLoadingRoles.set(false)))
      .subscribe({
        next: (roles) => {
          const mappedRoles = (roles ?? []).map(role => ({
            id: role.roleId,
            name: role.roleName
          }));

          this.roles = mappedRoles.length > 0 ? mappedRoles : this.defaultRoles;
        },
        error: () => {
          this.roles = this.defaultRoles;
          this.toast.show('Could not load roles from API. Showing default roles.', 'error');
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.toast.show('Passwords do not match.', 'error'); return;
    }

    const raw = this.form.getRawValue();
    const selectedRoleIds = (raw.roleIds ?? []) as string[];
    const selectedRoleNames = this.roles
      .filter(r => selectedRoleIds.includes(r.id))
      .map(r => r.name);

    if (selectedRoleNames.length === 0 || selectedRoleNames.length > this.maxRoles) {
      this.toast.show('Please select one or two valid roles.', 'error');
      return;
    }

    const hasStakeholder = selectedRoleNames.some(
      n => n.trim().toLowerCase() === this.stakeholderRoleName.toLowerCase()
    );
    if (hasStakeholder && selectedRoleNames.length > 1) {
      this.toast.show('Stakeholder cannot be combined with other roles.', 'error');
      return;
    }

    const payload: RegisterPayload = {
      firstName: (raw.firstName ?? '').trim(),
      lastName: (raw.lastName ?? '').trim(),
      dateOfBirth: raw.dateOfBirth ?? '',
      phoneNumber: (raw.phone ?? '').trim(),
      jobTitle: (raw.jobTitle ?? '').trim(),
      username: (raw.username ?? '').trim().toLowerCase(),
      emailAddress: (raw.email ?? '').trim(),
      password: raw.password ?? '',
      roles: selectedRoleNames
    };

    this.isSubmitting.set(true);
    this.auth.register(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('User registered successfully.', 'success');
          this.navigateAfterRegisterOrCancel();
        },
        error: (error) => {
          const body = error?.error;
          let message =
            (typeof body === 'string' ? body : null)
            ?? body?.error
            ?? body?.title
            ?? body?.detail
            ?? body?.message;
          // ASP.NET ModelState dictionary
          if (!message && body?.errors && typeof body.errors === 'object') {
            const firstKey = Object.keys(body.errors)[0];
            const arr = firstKey ? body.errors[firstKey] : null;
            if (Array.isArray(arr) && arr[0]) message = String(arr[0]);
          }
          // IdentityResult errors: [{ code, description }] or OData-style
          if (!message && Array.isArray(body)) {
            const first = body[0] as { description?: string; Description?: string } | undefined;
            const d = first?.description ?? first?.Description;
            if (d) message = String(d);
          }
          this.toast.show(message || 'Registration failed. Please try again.', 'error');
        }
      });
  }

  /** Stakeholder cannot be combined with other roles; enforced here and on the API. */
  private readonly stakeholderRoleName = 'Stakeholder';

  private findStakeholderRoleId(): string | undefined {
    return this.roles.find(
      r => r.name.trim().toLowerCase() === this.stakeholderRoleName.toLowerCase()
    )?.id;
  }

  toggleRoleSelection(roleId: string, checked: boolean): void {
    const current = [ ...((this.form.controls.roleIds.value ?? []) as string[]) ];
    const alreadySelected = current.includes(roleId);
    const roleMeta = this.roles.find(r => r.id === roleId);
    const isStakeholder =
      (roleMeta?.name ?? '').trim().toLowerCase() === this.stakeholderRoleName.toLowerCase();
    const stakeholderId = this.findStakeholderRoleId();

    if (checked && !alreadySelected) {
      if (isStakeholder) {
        const hadOthers = stakeholderId
          ? current.some(id => id !== stakeholderId)
          : current.length > 0;
        this.form.controls.roleIds.setValue([roleId]);
        this.form.controls.roleIds.markAsTouched();
        this.cdr.markForCheck();
        if (hadOthers) {
          this.toast.show('Stakeholder is exclusive; other roles were cleared.', 'success');
        }
        return;
      }

      let next = stakeholderId ? current.filter(id => id !== stakeholderId) : [ ...current ];
      if (next.length >= this.maxRoles) {
        this.toast.show('You can select a maximum of two roles.', 'error');
        return;
      }
      next.push(roleId);
      this.form.controls.roleIds.setValue(next);
      this.form.controls.roleIds.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    if (!checked && alreadySelected) {
      const idx = current.indexOf(roleId);
      current.splice(idx, 1);
      this.form.controls.roleIds.setValue(current);
      this.form.controls.roleIds.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  selectedRoleCount(): number {
    return ((this.form.controls.roleIds.value ?? []) as string[]).length;
  }

  isRoleSelected(roleId: string): boolean {
    const selected = (this.form.controls.roleIds.value ?? []) as string[];
    return selected.includes(roleId);
  }

  private minSelectedRolesValidator(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? []) as string[];
      return value.length >= min ? null : { minSelectedRoles: true };
    };
  }

  private maxSelectedRolesValidator(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? []) as string[];
      return value.length <= max ? null : { maxSelectedRoles: true };
    };
  }

  cancel(): void { this.navigateAfterRegisterOrCancel(); }
}