import { Routes } from '@angular/router';

export const REGISTER_PAGE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./register-page.component').then(m => m.RegisterPageComponent),
  }
];
