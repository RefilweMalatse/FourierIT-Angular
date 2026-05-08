import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

// ERD: Department(DepartmentID, BranchID, DepartmentName)
// Branch(BranchID, InstitutionID, BranchName, City)
export interface Department {
  id: string; name: string; code: string;
  managerName: string; branch: string;
  userCount: number; docCount: number;
  status: 'active' | 'inactive'; createdAt: string;
}

@Component({
  selector: 'app-departments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss'
})
export class DepartmentsComponent {
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);

  showModal    = signal(false);
  editId       = signal<string | null>(null);
  isSubmitting = signal(false);
  search       = signal('');

  // ERD: Department(DepartmentName) + Branch(BranchName, City) + Institution link
  form = this.fb.group({
    departmentName: ['', Validators.required],
    departmentCode: ['', [Validators.required, Validators.maxLength(5)]],
    branchId:       ['', Validators.required],
    managerName:    ['', Validators.required],
    location:       [''],
    description:    [''],
    email:          ['', Validators.email],
    phone:          [''],
  });

  branches = [
    { id: '1', name: 'Head Office — Johannesburg' },
    { id: '2', name: 'London Branch' },
    { id: '3', name: 'Singapore Branch' },
  ];

  departments = signal<Department[]>([
    { id:'1', name:'Finance',         code:'FIN', managerName:'John Smith',    branch:'Head Office', userCount:12, docCount:847, status:'active',   createdAt:'2024-01-15' },
    { id:'2', name:'Human Resources', code:'HR',  managerName:'Sarah Johnson', branch:'Head Office', userCount:8,  docCount:623, status:'active',   createdAt:'2024-01-20' },
    { id:'3', name:'Legal',           code:'LEG', managerName:'Michael Chen',  branch:'London Branch',userCount:6, docCount:445, status:'active',   createdAt:'2024-02-01' },
    { id:'4', name:'Operations',      code:'OPS', managerName:'Emma Davis',    branch:'Head Office', userCount:15, docCount:931, status:'active',   createdAt:'2024-02-10' },
    { id:'5', name:'Marketing',       code:'MKT', managerName:'James Wilson',  branch:'Head Office', userCount:10, docCount:531, status:'active',   createdAt:'2024-02-15' },
    { id:'6', name:'IT',              code:'IT',  managerName:'Lisa Anderson', branch:'Singapore Branch',userCount:9,docCount:412,status:'inactive', createdAt:'2024-03-01' },
  ]);

  get filtered() {
    const q = this.search().toLowerCase();
    return this.departments().filter(d =>
      d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }

  openCreate(): void { this.form.reset(); this.editId.set(null); this.showModal.set(true); }

  openEdit(dept: Department): void {
    this.editId.set(dept.id);
    this.form.patchValue({ departmentName: dept.name, departmentCode: dept.code, managerName: dept.managerName });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    // TODO: connect to DepartmentService API
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.toast.show(this.editId() ? 'Department updated.' : 'Department registered.', 'success');
      this.showModal.set(false);
    }, 800);
  }

  onDelete(id: string): void {
    this.departments.update(list => list.filter(d => d.id !== id));
    this.toast.show('Department deleted.', 'success');
  }
}