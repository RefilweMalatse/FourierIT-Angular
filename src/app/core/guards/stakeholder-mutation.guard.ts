import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Redirects stakeholder viewers away from routes that only perform mutations (e.g. register stakeholder). */
export const stakeholderMutationGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/auth/login']);
  if (!auth.isStakeholderViewer()) return true;
  if (state.url.includes('/stakeholders/add')) return router.createUrlTree(['/stakeholders/all']);
  return true;
};
