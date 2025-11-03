import { Routes } from '@angular/router';

export const INITIAL_PAGE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./initial-page.component').then(m => m.InitialPageComponent)
    }
];
