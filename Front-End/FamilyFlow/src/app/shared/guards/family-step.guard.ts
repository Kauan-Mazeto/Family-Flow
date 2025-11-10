import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { RegistrationFlowService } from '../services/registration-flow.service';

export const familyStepGuard: CanActivateFn = (route, state) => {
  const registrationFlow = inject(RegistrationFlowService);
  const router = inject(Router);

  // Verificar se os dados pessoais foram preenchidos
  if (!registrationFlow.hasUserData()) {
    console.log('Dados pessoais não encontrados, redirecionando para registro');
    router.navigate(['/users/register']);
    return false;
  }

  // Verificar se uma opção de família foi escolhida
  const tempData = registrationFlow.getTempData();
  if (!tempData?.family_option) {
    console.log('Opção de família não escolhida, redirecionando para página de opções');
    router.navigate(['/family/option']);
    return false;
  }

  // Verificar se está na rota correta baseada na opção escolhida
  const currentUrl = state.url;
  
  if (tempData.family_option === 'create' && !currentUrl.includes('/family/create')) {
    console.log('Usuário escolheu criar família, redirecionando para criação');
    router.navigate(['/family/create']);
    return false;
  }
  
  if (tempData.family_option === 'join' && !currentUrl.includes('/family/enter')) {
    console.log('Usuário escolheu entrar em família, redirecionando para entrada');
    router.navigate(['/family/enter']);
    return false;
  }

  console.log('Dados do fluxo de registro válidos, permitindo acesso');
  return true;
};