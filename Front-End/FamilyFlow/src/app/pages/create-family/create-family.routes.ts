import { familyStepGuard } from '../../shared/guards/family-step.guard';

export const CREATE_FAMILY_ROUTES = [
    {
        path: '',
        loadComponent: () => import('./create-family.component').then(m => m.CreateFamilyComponent),
        canActivate: [familyStepGuard] // Verificar fluxo de registro para criar família
    }
];