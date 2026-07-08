import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuditEventType } from '../models/institution.models';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (!auth.isAdmin()) {
    auth.logActivity(AuditEventType.ACCESS_DENIED, 'Blocked access to admin-only route');
    return router.createUrlTree(['/dashboard']);
  }

  auth.logActivity(AuditEventType.PAGE_VIEW, 'Viewed admin-only route');
  return true;
};
