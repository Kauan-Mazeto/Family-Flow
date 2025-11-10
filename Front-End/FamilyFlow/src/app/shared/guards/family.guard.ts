import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of, switchMap } from 'rxjs';

export const familyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ FamilyGuard - Verificando acesso ao dashboard');
  console.log('🔗 URL solicitada:', state.url);

  // Se já temos um usuário no cache, prosseguir com verificação de família
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    console.log('✅ FamilyGuard: Usuário já autenticado no cache:', currentUser.name);
    return checkFamily(authService, router);
  }

  // Se não temos usuário no cache, verificar no servidor primeiro
  console.log('🔄 FamilyGuard: Verificando autenticação no servidor...');
  
  return authService.getCurrentUserFromServer().pipe(
    map(response => {
      if (response && response.usuarioAtual) {
        console.log('✅ FamilyGuard: Usuário autenticado no servidor:', response.usuarioAtual.name);
        // Não retornamos aqui, precisamos verificar a família
        return null; // Indica que deve continuar para verificação de família
      } else {
        console.log('❌ FamilyGuard: Usuário não autenticado, redirecionando para login');
        router.navigate(['/users/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    }),
    // Depois da verificação de autenticação, verificar família
    switchMap((authResult: false | null) => {
      if (authResult === false) {
        return of(false); // Já redirecionou para login
      }
      return checkFamily(authService, router);
    }),
    catchError(error => {
      console.error('❌ FamilyGuard: Erro na verificação:', error);
      router.navigate(['/users/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};

// Função auxiliar para verificar família
function checkFamily(authService: AuthService, router: Router) {
  console.log('✅ FamilyGuard: Verificando família...');
  
  return authService.checkUserHasFamily().pipe(
    map((hasFamily: boolean) => {
      if (hasFamily) {
        console.log('✅ FamilyGuard: Usuário tem família, permitindo acesso ao dashboard');
        return true;
      } else {
        console.log('❌ FamilyGuard: Usuário NÃO tem família, redirecionando para escolha');
        router.navigate(['/family/option']);
        return false;
      }
    }),
    catchError((error: any) => {
      console.error('❌ FamilyGuard: Erro ao verificar família:', error);
      router.navigate(['/family/option']);
      return of(false);
    })
  );
}