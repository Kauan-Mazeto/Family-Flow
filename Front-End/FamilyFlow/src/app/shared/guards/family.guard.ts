import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const familyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ FamilyGuard - Verificando acesso ao dashboard');
  console.log('🔗 URL solicitada:', state.url);

  // Verificar se o usuário está logado
  if (!authService.isLoggedIn()) {
    console.log('❌ Usuário não está logado, redirecionando para login');
    router.navigate(['/users/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  console.log('✅ Usuário está logado, verificando família...');

  // Se está logado, verificar se tem família
  return authService.checkUserHasFamily().pipe(
    map(hasFamily => {
      if (hasFamily) {
        console.log('✅ Usuário tem família, permitindo acesso ao dashboard');
        return true;
      } else {
        console.log('❌ Usuário NÃO tem família, bloqueando acesso ao dashboard');
        console.log('🔄 Redirecionando para escolha de família');
        router.navigate(['/family/option']);
        return false;
      }
    }),
    catchError(error => {
      console.error('❌ Erro ao verificar família do usuário:', error);
      console.log('🔄 Em caso de erro, redirecionando para escolha de família por segurança');
      // Em caso de erro, redirecionar para escolha de família por segurança
      router.navigate(['/family/option']);
      return of(false);
    })
  );
};