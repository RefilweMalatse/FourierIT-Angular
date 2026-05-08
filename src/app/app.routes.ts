import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      
      { path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard/dashboard.component')
          .then(m => m.DashboardComponent) },
      { path: 'users/management',
        loadComponent: () => import('./features/users/user-management/user-management.component')
          .then(m => m.UserManagementComponent) },
      { path: 'users/register',
        loadComponent: () => import('./features/users/register-user/register-user.component')
          .then(m => m.RegisterUserComponent) },
      { path: 'users/roles',
        loadComponent: () => import('./features/administration/roles-management/roles-management.component')
          .then(m => m.RolesManagementComponent) },
      { path: 'administration/institutions',
        loadComponent: () => import('./features/administration/institutions/institutions.component')
          .then(m => m.InstitutionsComponent) },
      { path: 'administration/roles',
        loadComponent: () => import('./features/administration/roles-management/roles-management.component')
          .then(m => m.RolesManagementComponent) },
      { path: 'stakeholders/all',
        loadComponent: () => import('./features/stakeholders/all-stakeholders/all-stakeholders.component')
          .then(m => m.AllStakeholdersComponent) },
      { path: 'stakeholders/add',
        loadComponent: () => import('./features/stakeholders/register-stakeholder/register-stakeholder.component')
          .then(m => m.RegisterStakeholderComponent) },
      { path: 'departments/all',
        loadComponent: () => import('./features/departments/departments/departments.component')
          .then(m => m.DepartmentsComponent) },
      { path: 'departments/register',
        loadComponent: () => import('./features/departments/departments/departments.component')
          .then(m => m.DepartmentsComponent) },
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];