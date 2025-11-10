import { Component, Input, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

export interface NavbarData {
  familyName: string;
  familyCode: string;
  userName: string;
  userEmail: string;
  userRole: string;
  isAdmin: boolean;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-navbar-data',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarDataComponent {
  
  cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  @Input() data: NavbarData = {
    familyName: '',
    familyCode: '',
    userName: '',
    userEmail: '',
    userRole: '',
    isAdmin: false,
    isLoading: true,
    errorMessage: ''
  };

  // Propriedade para controlar estado do logout
  isLoggingOut: boolean = false;

  constructor() { }

  // Função para fazer logout
  logoutUser() {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;
    
    // Fazer logout e redirecionar imediatamente
    this.authService.logout().subscribe({
      next: (response) => {
        // Usar setTimeout para garantir que a limpeza seja processada
        setTimeout(() => {
          this.router.navigate(['/initial']);
        }, 100);
      },
      error: (error) => {
        // Mesmo com erro, redirecionar para página inicial por segurança
        console.error('Erro no logout:', error);
        setTimeout(() => {
          this.router.navigate(['/initial']);
        }, 100);
      },
      complete: () => {
        this.isLoggingOut = false;
      }
    });
  }
}