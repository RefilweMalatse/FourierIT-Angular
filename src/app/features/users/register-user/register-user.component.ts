import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register-user',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.scss'
})
export class RegisterUserComponent {
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);
  private router = inject(Router);

  isSubmitting = signal(false);

  // From ERD: User(Email, Password_hash, mfa_enabled, IsPEPstatus, AccountStatus)
  // Profile(Address), SecurityQuestion
  form = this.fb.group({
    // User fields
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    // Profile fields
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    phone:           [''],
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

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.toast.show('Passwords do not match.', 'error'); return;
    }
    this.isSubmitting.set(true);
    // TODO: connect to AuthService / UserService API call
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.toast.show('User registered successfully.', 'success');
      this.router.navigate(['/users/management']);
    }, 800);
  }

  cancel(): void { this.router.navigate(['/users/management']); }
}