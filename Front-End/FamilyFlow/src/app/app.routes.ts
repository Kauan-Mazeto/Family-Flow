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
    }
];
