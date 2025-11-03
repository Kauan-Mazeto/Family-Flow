import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/initial',
        pathMatch: 'full'
    },
    {
        path: 'initial',
        loadComponent: () => import('./pages/initial-page/initial-page.component').then(m => m.InitialPageComponent)
    },
    {
        path: 'users/login',
        loadChildren: () => import('./pages/login-page/login-page.routes').then(m => m.LOGIN_PAGE_ROUTES) 
    },
    {
        path: 'users/register',
        loadChildren: () => import('./pages/register-page/register-page.routes').then(m => m.REGISTER_PAGE_ROUTES)
    },
    {
        path: 'family/option',
        loadChildren: () => import('./pages/register-family-option/register-family-option.routes').then(m => m.REGISTER_FAMILY_OPTION_ROUTES)
    },
    {
        path: 'family/create',
        loadChildren: () => import('./pages/create-family/create-family.routes').then(m => m.CREATE_FAMILY_ROUTES)
    },
    {
        path: 'family/enter',
        loadChildren: () => import('./pages/enter-family/enter-family.routes').then(m => m.ENTER_FAMILY_ROUTES)
    },
    {
        path: 'family/dashboard',
        loadChildren: () => import('./pages/family-dashboard/family-dashboard.routes').then(m => m.FAMILY_DASHBOARD_ROUTES)
    }
];
