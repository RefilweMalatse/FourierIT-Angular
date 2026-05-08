import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register-stakeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-stakeholder.component.html',
  styleUrl: './register-stakeholder.component.scss'
})
export class RegisterStakeholderComponent {
  private fb     = inject(FormBuilder);
  private toast  = inject(ToastService);
  private router = inject(Router);

  isSubmitting = signal(false);

  // ERD: InstitutionMembers(UserID, InstitutionID, MemberID, Date)
  // ClientEnlistment(UserID, InstitutionID, Date, Status)
  form = this.fb.group({
    name:            ['', Validators.required],
    surname:         ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phone:           ['', Validators.required],
    organizationName:['', Validators.required],
    institutionId:   ['', Validators.required],
    // Type from ERD context (Auditor/Partner/Internal/External)
    stakeholderType: ['', Validators.required],
    // ClientEnlistment status
    enlistmentStatus:['Active'],
    // Access (maps to Role)
    roleId:          ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    // IsPEPstatus from User table
    isPEP:           [false],
  });

  stakeholderTypes = ['Auditor', 'Partner', 'Internal', 'External'];

  institutions = [
    { id: '1', name: 'Fourier Group Headquarters' },
    { id: '2', name: 'Fourier Group Europe' },
    { id: '3', name: 'Fourier Group Asia Pacific' },
  ];

  roles = [
    { id: '1', name: 'Read-Only' },
    { id: '2', name: 'Read & Download' },
    { id: '3', name: 'Full Access' },
  ];

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.toast.show('Passwords do not match.', 'error'); return;
    }
    this.isSubmitting.set(true);
    // TODO: connect to StakeholderService API
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.toast.show('Stakeholder registered successfully.', 'success');
      this.router.navigate(['/stakeholders/all']);
    }, 800);
  }

  cancel(): void { this.router.navigate(['/stakeholders/all']); }
}