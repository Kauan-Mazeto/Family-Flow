import { Routes } from '@angular/router';
import { registrationFlowGuard } from '../../shared/guards/registration-flow.guard';

export const REGISTER_FAMILY_OPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./register-family-option.component').then(m => m.RegisterFamilyOptionComponent),
    canActivate: [registrationFlowGuard] // Verificar apenas se tem dados temporários do registro
  }
];