import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { RegistrationFlowService } from '../services/registration-flow.service';

export const registrationFlowGuard: CanActivateFn = (route, state) => {
  const registrationFlow = inject(RegistrationFlowService);
  const router = inject(Router);

  // Verificar se os dados pessoais foram preenchidos (primeira etapa do registro)
  if (registrationFlow.hasUserData()) {
    console.log('Dados pessoais encontrados, permitindo acesso à página de opção de família');
    return true;
  } else {
    console.log('Dados pessoais não encontrados, redirecionando para registro');
    router.navigate(['/users/register']);
    return false;
  }
};