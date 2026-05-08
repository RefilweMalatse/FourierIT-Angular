import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

const TOKEN_KEY = 'docuvault_token';

export interface LoginPayload { email: string; password: string; }
export interface AuthResponse  { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private base   = `${environment.apiUrl}/auth`;

  currentUser     = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  login(payload: LoginPayload): Observable<AuthResponse> {
    if (payload.email === 'user@gmail.com' && payload.password === 'password123') {
      const dummyUser: User = { id: '1', email: 'user@gmail.com', firstName: 'User', lastName: 'Name', role: 'admin' };
      const response: AuthResponse = { token: 'dummy_token', user: dummyUser };
      return of(response).pipe(
        tap(res => {
          localStorage.setItem(TOKEN_KEY, res.token);
          this.currentUser.set(res.user);
        })
      );
    } else {
      return throwError(() => new Error('Invalid credentials'));
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  isLoggedIn(): boolean     { return !!this.getToken(); }
}