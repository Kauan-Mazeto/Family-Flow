import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar se o usuário está logado
  if (authService.isLoggedIn()) {
    console.log('✅ Usuário autenticado, permitindo acesso');
    return true;
  } else {
    console.log('❌ Usuário não autenticado, redirecionando para login');
    router.navigate(['/users/login']);
    return false;
  }
};