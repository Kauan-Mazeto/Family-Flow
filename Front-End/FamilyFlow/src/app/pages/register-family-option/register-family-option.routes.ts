import { Routes } from '@angular/router';
import { noFamilyGuard } from '../../shared/guards/no-family.guard';

export const REGISTER_FAMILY_OPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./register-family-option.component').then(m => m.RegisterFamilyOptionComponent),
    canActivate: [noFamilyGuard] // noFamilyGuard já inclui verificação de autenticação
  }
];