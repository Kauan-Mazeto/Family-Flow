import { Routes } from '@angular/router';

export const REGISTER_FAMILY_OPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./register-family-option.component').then(m => m.RegisterFamilyOptionComponent),
  }
];