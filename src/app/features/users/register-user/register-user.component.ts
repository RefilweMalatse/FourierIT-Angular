import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService, RegisterPayload } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-register-user',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.scss'
})
export class RegisterUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private roleService = inject(RoleService);
  private router = inject(Router);

  isSubmitting = signal(false);
  isLoadingRoles = signal(false);

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
    dateOfBirth: ['', Validators.required],
    phone: [''],
    jobTitle: ['', Validators.required],
    // Address (from ERD: Address table)
    addressLine:     [''],
    postalCode:      [''],
    province:        [''],
    city:            [''],
    suburb:          [''],
    // Role assignment (UserRole table)
    roleId:          ['', Validators.required],
    // Security (UserSecurityQuestion)
    securityQuestion: ['', Validators.required],
    securityAnswer:   ['', Validators.required],
    // MFA (from ERD: mfa_enabled)
    mfaEnabled:      [false],
    // Account status
    accountStatus:   ['Active'],
  });

  roles: Array<{ id: string; name: string }> = [];

  securityQuestions = [
    'What was the name of your first pet?',
    'What is your mother\'s maiden name?',
    'What city were you born in?',
    'What was the name of your primary school?',
  ];

  provinces = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'];

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.isLoadingRoles.set(true);
    this.roleService.getRoles()
      .pipe(finalize(() => this.isLoadingRoles.set(false)))
      .subscribe({
        next: (roles) => {
          this.roles = (roles ?? []).map(role => ({
            id: role.roleId,
            name: role.roleName
          }));
        },
        error: () => {
          this.roles = [];
          this.toast.show('Could not load roles from API. Ensure you are logged in as Department Admin.', 'error');
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.toast.show('Passwords do not match.', 'error'); return;
    }

    const raw = this.form.getRawValue();
    const selectedRoleName = this.roles.find(r => r.id === raw.roleId)?.name;
    if (!selectedRoleName) {
      this.toast.show('Please select a valid role.', 'error');
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
      role: selectedRoleName
    };

    this.isSubmitting.set(true);
    this.auth.register(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('User registered successfully.', 'success');
          this.router.navigate(['/users/management']);
        },
        error: (error) => {
          const message = error?.error?.error || error?.error?.title || error?.error?.message || 'Registration failed. Please try again.';
          this.toast.show(message, 'error');
        }
      });
  }

  cancel(): void { this.router.navigate(['/users/management']); }
}