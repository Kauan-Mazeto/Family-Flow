import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/users/login',
        pathMatch: 'full'
    },
    {
        path: 'users/login',
        loadChildren: () => import('./pages/login-page/login-page.routes').then(m => m.LOGIN_PAGE_ROUTES) 
    }
];
