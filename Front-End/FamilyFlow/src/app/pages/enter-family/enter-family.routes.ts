import {  Routes } from '@angular/router';

export const ENTER_FAMILY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./enter-family.component').then(m => m.EnterFamilyComponent),
  }
];