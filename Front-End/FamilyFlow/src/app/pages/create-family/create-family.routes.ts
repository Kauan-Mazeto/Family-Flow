import { noFamilyGuard } from '../../shared/guards/no-family.guard';

export const CREATE_FAMILY_ROUTES = [
    {
        path: '',
        loadComponent: () => import('./create-family.component').then(m => m.CreateFamilyComponent),
        canActivate: [noFamilyGuard] // noFamilyGuard já inclui verificação de autenticação
    }
];