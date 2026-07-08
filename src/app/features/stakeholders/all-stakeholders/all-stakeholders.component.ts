import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

export interface Stakeholder {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  organizationName: string;
  institutionId: string;
  institutionName: string;
  stakeholderType: string;
  roleId: string;
  roleName: string;
  enlistmentStatus: string;
  isPEP: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-all-stakeholders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './all-stakeholders.component.html',
  styleUrl: './all-stakeholders.component.scss'
})
export class AllStakeholdersComponent {
  readonly auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  showModal = signal(false);
  editId = signal<string | null>(null);
  isSubmitting = signal(false);
  search = signal('');

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

  stakeholderTypes = ['Auditor', 'Partner', 'Internal', 'External'];

  stakeholders = signal<Stakeholder[]>([
    { id: '1', name: 'Lindiwe', surname: 'Maseko', email: 'lindiwe.maseko@fouriergroup.com', phone: '+27 82 111 2222', organizationName: 'Fourier Group HQ', institutionId: '1', institutionName: 'Fourier Group Headquarters', stakeholderType: 'Internal', roleId: '3', roleName: 'Full Access', enlistmentStatus: 'Active', isPEP: false, createdAt: '2025-05-02' },
    { id: '2', name: 'Ayesha', surname: 'Patel', email: 'ayesha.patel@fouriergroup.eu', phone: '+44 20 7946 0100', organizationName: 'Fourier Group Europe', institutionId: '2', institutionName: 'Fourier Group Europe', stakeholderType: 'Partner', roleId: '2', roleName: 'Read & Download', enlistmentStatus: 'Active', isPEP: false, createdAt: '2025-03-18' },
    { id: '3', name: 'Omar', surname: 'Abdullah', email: 'omar.abdullah@fouriergroup.sg', phone: '+65 6123 4567', organizationName: 'Fourier Group Asia Pacific', institutionId: '3', institutionName: 'Fourier Group Asia Pacific', stakeholderType: 'Auditor', roleId: '1', roleName: 'Read-Only', enlistmentStatus: 'Pending', isPEP: false, createdAt: '2025-04-09' },
  ]);

  form = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    organizationName: ['', Validators.required],
    institutionId: ['', Validators.required],
    stakeholderType: ['', Validators.required],
    roleId: ['', Validators.required],
    enlistmentStatus: ['Active'],
    isPEP: [false],
    password: [''],
    confirmPassword: [''],
  });

  get filtered() {
    const q = this.search().toLowerCase();
    return this.stakeholders().filter(s =>
      `${s.name} ${s.surname}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.organizationName.toLowerCase().includes(q) ||
      s.stakeholderType.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.form.reset({ enlistmentStatus: 'Active', isPEP: false, password: '', confirmPassword: '' });
    this.editId.set(null);
    this.showModal.set(true);
  }

  openEdit(stakeholder: Stakeholder): void {
    this.editId.set(stakeholder.id);
    this.form.patchValue({
      name: stakeholder.name,
      surname: stakeholder.surname,
      email: stakeholder.email,
      phone: stakeholder.phone,
      organizationName: stakeholder.organizationName,
      institutionId: stakeholder.institutionId,
      stakeholderType: stakeholder.stakeholderType,
      roleId: stakeholder.roleId,
      enlistmentStatus: stakeholder.enlistmentStatus,
      isPEP: stakeholder.isPEP,
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
      name: string | null;
      surname: string | null;
      email: string | null;
      phone: string | null;
      organizationName: string | null;
      institutionId: string | null;
      stakeholderType: string | null;
      roleId: string | null;
      enlistmentStatus: string | null;
      isPEP: boolean | null;
      password: string | null;
      confirmPassword: string | null;
    };
    if (!this.editId() && (!value.password || !value.confirmPassword)) {
      this.toast.show('Password and confirmation are required.', 'error');
      return;
    }

    if (value.password || value.confirmPassword) {
      if (value.password !== value.confirmPassword) {
        this.toast.show('Passwords do not match.', 'error');
        return;
      }
    }

    const role = this.roles.find(r => r.id === value.roleId);
    const inst = this.institutions.find(i => i.id === value.institutionId);
    const payload: Stakeholder = {
      id: this.editId() ?? Date.now().toString(),
      name: value.name ?? '',
      surname: value.surname ?? '',
      email: value.email ?? '',
      phone: value.phone ?? '',
      organizationName: value.organizationName ?? '',
      institutionId: value.institutionId ?? '',
      institutionName: inst?.name ?? 'Unknown',
      stakeholderType: value.stakeholderType ?? '',
      roleId: value.roleId ?? '',
      roleName: role?.name ?? 'Unknown',
      enlistmentStatus: value.enlistmentStatus ?? 'Active',
      isPEP: !!value.isPEP,
      createdAt: this.editId() ? this.stakeholders().find(s => s.id === this.editId())?.createdAt ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    };

    this.isSubmitting.set(true);
    setTimeout(() => {
      if (this.editId()) {
        this.stakeholders.update(list => list.map(item => item.id === payload.id ? payload : item));
        this.toast.show('Stakeholder updated.', 'success');
      } else {
        this.stakeholders.update(list => [payload, ...list]);
        this.toast.show('Stakeholder registered.', 'success');
      }
      this.isSubmitting.set(false);
      this.showModal.set(false);
    }, 600);
  }

  onDelete(id: string): void {
    this.stakeholders.update(list => list.filter(item => item.id !== id));
    this.toast.show('Stakeholder deleted.', 'success');
  }
}
