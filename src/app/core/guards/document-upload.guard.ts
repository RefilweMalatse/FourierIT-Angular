import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Only Document Owners who are not Department Admins may open the upload route. */
export const documentUploadGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/auth/login']);
  if (!auth.canUploadDocuments()) return router.createUrlTree(['/documents/all']);
  return true;
};
