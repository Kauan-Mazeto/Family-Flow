import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard: Verificando autenticação...');
  
  // Se já temos um usuário logado, permitir acesso imediatamente
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    console.log('✅ AuthGuard: Usuário já autenticado no cache:', currentUser.name);
    return true;
  }

  // Se não temos usuário no cache, verificar no servidor
  console.log('🔄 AuthGuard: Nenhum usuário no cache, verificando no servidor...');
  
  return authService.getCurrentUserFromServer().pipe(
    map(response => {
      console.log('📡 AuthGuard: Resposta do servidor:', response);
      
      if (response && response.usuarioAtual) {
        console.log('✅ AuthGuard: Usuário autenticado no servidor:', response.usuarioAtual.name);
        return true;
      } else {
        console.log('❌ AuthGuard: Nenhum usuário encontrado no servidor');
        router.navigate(['/users/login']);
        return false;
      }
    }),
    catchError(error => {
      console.error('❌ AuthGuard: Erro ao verificar autenticação:', error);
      console.error('❌ AuthGuard: Status do erro:', error.status);
      console.error('❌ AuthGuard: Mensagem do erro:', error.message);
      
      // Se for erro 401 (não autorizado), redirecionar para login
      if (error.status === 401) {
        console.log('❌ AuthGuard: Erro 401 - Token inválido ou expirado');
      }
      
      router.navigate(['/users/login']);
      return of(false);
    })
  );
};