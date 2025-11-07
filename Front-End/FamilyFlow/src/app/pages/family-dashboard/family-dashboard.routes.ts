import { Routes } from '@angular/router';
import { FamilyDashboardComponent } from './family-dashboard.component';
import { familyGuard } from '../../shared/guards/family.guard';
import { dashboardGuard } from '../../shared/guards/dashboard.guard';

export const FAMILY_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: FamilyDashboardComponent,
    canActivate: [familyGuard, dashboardGuard] // Dupla proteção: guarda geral + guarda específica
  }
];
