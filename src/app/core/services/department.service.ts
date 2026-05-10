import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiDepartmentDto {
  departmentId: number;
  departmentName: string;
  branchId: number;
  createdAt: string;
}

export interface SaveDepartmentPayload {
  departmentName: string;
  branchId: number;
}

export interface BranchListDto {
  branchId: number;
  branchName: string;
  city: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Department`;
  private branchBase = `${environment.apiUrl}/Branch`;

  getBranches(): Observable<BranchListDto[]> {
    return this.http.get<BranchListDto[]>(this.branchBase);
  }

  getAll(): Observable<ApiDepartmentDto[]> {
    return this.http.get<ApiDepartmentDto[]>(this.base);
  }

  create(payload: SaveDepartmentPayload): Observable<ApiDepartmentDto> {
    return this.http.post<ApiDepartmentDto>(this.base, payload);
  }

  update(departmentId: number, payload: SaveDepartmentPayload): Observable<ApiDepartmentDto> {
    return this.http.put<ApiDepartmentDto>(`${this.base}/${departmentId}`, payload);
  }

  delete(departmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${departmentId}`);
  }
}
