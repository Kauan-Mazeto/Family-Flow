import {  Routes } from '@angular/router';
import { noFamilyGuard } from '../../shared/guards/no-family.guard';

export const ENTER_FAMILY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./enter-family.component').then(m => m.EnterFamilyComponent),
    canActivate: [noFamilyGuard] // noFamilyGuard já inclui verificação de autenticação
  }
];