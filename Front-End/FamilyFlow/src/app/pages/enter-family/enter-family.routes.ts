import {  Routes } from '@angular/router';
import { familyStepGuard } from '../../shared/guards/family-step.guard';

export const ENTER_FAMILY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./enter-family.component').then(m => m.EnterFamilyComponent),
    canActivate: [familyStepGuard] // Verificar fluxo de registro para entrar em família
  }
];