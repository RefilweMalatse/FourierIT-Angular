import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Users with only the Document Owner role may not open full-app routes; send them to My Documents. */
export const restrictDocumentOwnerOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/auth/login']);
  if (auth.isDocumentOwnerOnly()) return router.createUrlTree(['/my-documents']);
  return true;
};
