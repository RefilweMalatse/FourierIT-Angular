import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

const TOKEN_KEY = 'docuvault_token';

export interface LoginPayload { username: string; password: string; }
export interface AuthResponse  { userName: string; email: string; token: string;}
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  jobTitle: string;
  username: string;
  emailAddress: string;
  password: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private base   = `${environment.apiUrl}/user`;

  currentUser     = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, payload).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        this.currentUser.set({
          id: '',
          firstName: '',
          lastName: '',
          email: res.email,
          role: ''
        });
      })
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, payload);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  isLoggedIn(): boolean     { return !!this.getToken(); }
}