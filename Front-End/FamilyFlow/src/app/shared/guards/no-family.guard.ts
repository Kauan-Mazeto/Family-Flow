import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const noFamilyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar se o usuário está logado
  if (!authService.isLoggedIn()) {
    router.navigate(['/users/login']);
    return false;
  }

  // Se está logado, verificar se NÃO tem família (para páginas de escolha/criação)
  return authService.checkUserHasFamily().pipe(
    map(hasFamily => {
      if (!hasFamily) {
        return true;
      } else {
        router.navigate(['/family/dashboard']);
        return false;
      }
    }),
    catchError(error => {
      console.error('Erro ao verificar família do usuário:', error);
      // Em caso de erro, permitir acesso à página de escolha por segurança
      return of(true);
    })
  );
};