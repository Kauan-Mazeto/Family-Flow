import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of, switchMap } from 'rxjs';

export const familyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se já temos um usuário no cache, prosseguir com verificação de família
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    return checkFamily(authService, router);
  }
  
  return authService.getCurrentUserFromServer().pipe(
    map(response => {
      if (response && response.usuarioAtual) {
        // Não retornamos aqui, precisamos verificar a família
        return null; // Indica que deve continuar para verificação de família
      } else {
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
      console.error('FamilyGuard: Erro na verificação:', error);
      router.navigate(['/users/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};

// Função auxiliar para verificar família
function checkFamily(authService: AuthService, router: Router) {
  
  return authService.checkUserHasFamily().pipe(
    map((hasFamily: boolean) => {
      if (hasFamily) {
        return true;
      } else {
        router.navigate(['/family/option']);
        return false;
      }
    }),
    catchError((error: any) => {
      console.error('FamilyGuard: Erro ao verificar família:', error);
      router.navigate(['/family/option']);
      return of(false);
    })
  );
}