import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const dashboardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar se o usuário está logado
  if (!authService.isLoggedIn()) {
    router.navigate(['/users/login']);
    return false;
  }


  // Verificar se tem família
  return authService.checkUserHasFamily().pipe(
    map(hasFamily => {
      if (hasFamily) {
        return true;
      } else {
        router.navigate(['/family/option']);
        return false;
      }
    }),
    catchError(error => {
      console.error('BLOQUEADO: Erro na verificação', error);
      router.navigate(['/family/option']);
      return of(false);
    })
  );
};