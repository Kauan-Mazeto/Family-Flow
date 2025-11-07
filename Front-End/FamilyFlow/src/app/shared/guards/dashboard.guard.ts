import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const dashboardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ DashboardGuard - PROTEÇÃO ESPECÍFICA DO DASHBOARD');
  console.log('🔗 URL:', state.url);

  // Verificar se o usuário está logado
  if (!authService.isLoggedIn()) {
    console.log('❌ BLOQUEADO: Usuário não autenticado');
    router.navigate(['/users/login']);
    return false;
  }

  console.log('✅ Usuário autenticado, verificando família...');

  // Verificar se tem família
  return authService.checkUserHasFamily().pipe(
    map(hasFamily => {
      if (hasFamily) {
        console.log('✅ ACESSO LIBERADO: Usuário tem família');
        return true;
      } else {
        console.log('❌ BLOQUEADO: Usuário não tem família');
        router.navigate(['/family/option']);
        return false;
      }
    }),
    catchError(error => {
      console.error('❌ BLOQUEADO: Erro na verificação', error);
      router.navigate(['/family/option']);
      return of(false);
    })
  );
};