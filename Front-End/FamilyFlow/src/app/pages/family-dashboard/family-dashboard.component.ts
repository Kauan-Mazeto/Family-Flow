import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NavbarDataComponent, NavbarData } from '../../components/navbar/navbar.component';
import { NavbarAtalhosComponent } from '../../components/navbar-atalhos/navbar-atalhos.component';

@Component({
  selector: 'app-family-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarDataComponent, NavbarAtalhosComponent],
  templateUrl: './family-dashboard.component.html',
  styleUrls: ['./family-dashboard.component.scss']
})
export class FamilyDashboardComponent implements OnInit {
  
  authService = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  
  familyName: string = '';
  familyCode: string = '';
  userRole: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Dados do usuário
  userName: string = '';
  userEmail: string = '';
  isAdmin: boolean = false;

  // Dados para a navbar
  get navbarData(): NavbarData {
    return {
      familyName: this.familyName,
      familyCode: this.familyCode,
      userName: this.userName,
      userEmail: this.userEmail,
      userRole: this.userRole,
      isAdmin: this.isAdmin,
      isLoading: this.isLoading,
      errorMessage: this.errorMessage
    };
  }

  constructor() { }

  ngOnInit() {
    
    // VERIFICAÇÃO DE SEGURANÇA ADICIONAL NO COMPONENTE
    this.performSecurityCheck();
    
    // Carregar dados
    this.loadFamilyInfo();
    this.loadUserInfo();
    
    //saída do loading após 2 segundos no máximo
    setTimeout(() => {
      
      if (this.isLoading) {
        this.isLoading = false;
        
        // Se não carregou nada, usar valores padrão
        if (!this.familyName) {
          this.familyName = 'Minha Família';
          this.familyCode = 'FAM001';
        }
        if (!this.userName) {
          this.userName = 'Usuário';
          this.userEmail = 'usuario@email.com';
        }
        
        this.cdr.detectChanges();
      }
    }, 2000);
  }

  loadFamilyInfo() {
    
    this.authService.getUserFamily().subscribe({
      next: (response) => {
        // Verificar se realmente tem dados da família
        if (!response.familia || !response.familia.nome) {
          this.router.navigate(['/family/option']);
          return;
        }
        
        this.familyName = response.familia.nome;
        this.familyCode = response.familia.codigo;
        this.userRole = response.familia.role;
        this.isLoading = false;
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar informações da família:', error);
        
        // Se erro indica que usuário não tem família, redirecionar
        if (error.mensagem && error.mensagem.includes('não está em uma família')) {
          this.router.navigate(['/family/option']);
          return;
        }
        
        this.errorMessage = error.mensagem || 'Erro ao carregar informações da família';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUserInfo() {
    // Tentar obter dados do usuário do observable
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.userName = user.name || 'Usuário';
          this.userEmail = user.email || '';
          this.isAdmin = user.is_admin || false;
          
          this.cdr.detectChanges();
        } else {
          // Se não há dados no observable, tentar obter do backend
          this.getCurrentUser();
        }
      },
      error: (error) => {
        this.getCurrentUser(); // Fallback
      }
    });
  }

  getCurrentUser() {
    // Verificar se ainda há um usuário logado antes de fazer a chamada
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Método alternativo para obter dados do usuário
    this.authService.getCurrentUserFromServer().subscribe({
      next: (response) => {
        if (response.usuarioAtual) {
          this.userName = response.usuarioAtual.name || 'Usuário';
          this.userEmail = response.usuarioAtual.email || '';
          this.isAdmin = response.usuarioAtual.is_admin || false;
        }
      },
      error: (error) => {
        // Log do erro mas não fazer nada se usuário não estiver logado
        console.error('Erro ao obter usuário:', error);
        
        // Se erro 401, provavelmente usuário não está mais logado
        if (error.status === 401) {
          return;
        }

        // Para outros erros, usar dados básicos
        this.userName = 'Usuário Logado';
        this.userEmail = 'usuario@email.com';
        this.isAdmin = false;
      }
    });
  }

  /**
   * Verificação de segurança adicional no componente
   * Esta é a última linha de defesa contra acesso não autorizado
   */
  private performSecurityCheck() {
    
    // Verificar se usuário está logado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/users/login']);
      return;
    }

    // Verificar se tem família
    this.authService.checkUserHasFamily().subscribe({
      next: (hasFamily) => {
        if (!hasFamily) {
          this.router.navigate(['/family/option']);
          return;
        }
      },
      error: (error) => {
        this.router.navigate(['/family/option']);
      }
    });
  }

}
