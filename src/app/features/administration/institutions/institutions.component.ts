import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

export interface Institution {
  id: string;
  name: string;
  verifiedDomain: string;
  regNumber: string;
  type: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-institutions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './institutions.component.html',
  styleUrl: './institutions.component.scss'
})
export class InstitutionsComponent {
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);

  showModal    = signal(false);
  editId       = signal<string | null>(null);
  isSubmitting = signal(false);
  search       = signal('');

  // ERD: Institution(InstitutionName, VerifiedDomain, RegNumber, TypeID)
  // Branch(BranchName, City)
  form = this.fb.group({
    institutionName: ['', Validators.required],
    verifiedDomain:  ['', Validators.required],
    regNumber:       ['', Validators.required],
    typeId:          ['', Validators.required],
    phone:           ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    // Branch info
    branchName:      [''],
    city:            [''],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  institutionTypes = [
    { id: '1', name: 'Bank' },
    { id: '2', name: 'Insurance' },
    { id: '3', name: 'Investment Firm' },
    { id: '4', name: 'Government' },
    { id: '5', name: 'NGO' },
  ];

  // Mock data matching ERD Institution table
  institutions = signal<Institution[]>([
    { id: '1', name: 'Fourier Group Headquarters', verifiedDomain: 'fouriergroup.com', regNumber: 'FG-HQ-001', type: 'Investment Firm', status: 'active' },
    { id: '2', name: 'Fourier Group Europe',       verifiedDomain: 'fouriergroup.eu',  regNumber: 'FG-EU-002', type: 'Investment Firm', status: 'active' },
    { id: '3', name: 'Fourier Group Asia Pacific', verifiedDomain: 'fouriergroup.sg',  regNumber: 'FG-AP-003', type: 'Investment Firm', status: 'active' },
  ]);

  get filtered() {
    const q = this.search().toLowerCase();
    return this.institutions().filter(i =>
      i.name.toLowerCase().includes(q) || i.verifiedDomain.toLowerCase().includes(q)
    );
  }

  openCreate(): void { this.form.reset(); this.editId.set(null); this.showModal.set(true); }

  openEdit(inst: Institution): void {
    this.editId.set(inst.id);
    this.form.patchValue({ institutionName: inst.name, verifiedDomain: inst.verifiedDomain, regNumber: inst.regNumber });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    // TODO: connect to InstitutionService API
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.toast.show(this.editId() ? 'Institution updated.' : 'Institution registered.', 'success');
      this.showModal.set(false);
    }, 800);
  }

  onDelete(id: string): void {
    this.institutions.update(list => list.filter(i => i.id !== id));
    this.toast.show('Institution deleted.', 'success');
  }
}