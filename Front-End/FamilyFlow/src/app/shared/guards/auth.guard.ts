import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  
  // Se já temos um usuário logado, permitir acesso imediatamente
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    return true;
  }
  
  return authService.getCurrentUserFromServer().pipe(
    map(response => {
      
      if (response && response.usuarioAtual) {
        return true;
      } else {
        router.navigate(['/users/login']);
        return false;
      }
    }),
    catchError(error => {
      console.error('AuthGuard: Erro ao verificar autenticação:', error);
      
      // Se for erro 401 (não autorizado), redirecionar para login
      if (error.status === 401) {
        console.log('AuthGuard: Erro 401 - Token inválido ou expirado');
      }
      
      router.navigate(['/users/login']);
      return of(false);
    })
  );
};