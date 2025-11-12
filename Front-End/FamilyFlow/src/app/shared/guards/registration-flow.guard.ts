import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { RegistrationFlowService } from '../services/registration-flow.service';

export const registrationFlowGuard: CanActivateFn = (route, state) => {
  const registrationFlow = inject(RegistrationFlowService);
  const router = inject(Router);

  // Verificar se os dados pessoais foram preenchidos (primeira etapa do registro)
  if (registrationFlow.hasUserData()) {
    return true;
  } else {
    router.navigate(['/users/register']);
    return false;
  }
};