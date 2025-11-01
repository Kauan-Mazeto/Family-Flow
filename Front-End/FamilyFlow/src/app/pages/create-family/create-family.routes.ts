import { Router } from "@angular/router";

export const CREATE_FAMILY_ROUTES = [
    {
        path: '',
        loadComponent: () => import('./create-family.component').then(m => m.CreateFamilyComponent),
    }
];