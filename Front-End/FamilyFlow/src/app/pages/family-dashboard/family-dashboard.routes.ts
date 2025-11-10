import { Routes } from '@angular/router';
import { FamilyDashboardComponent } from './family-dashboard.component';
import { familyGuard } from '../../shared/guards/family.guard';

export const FAMILY_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: FamilyDashboardComponent,
    canActivate: [familyGuard] // FamilyGuard agora faz verificação completa: autenticação + família
  }
];
