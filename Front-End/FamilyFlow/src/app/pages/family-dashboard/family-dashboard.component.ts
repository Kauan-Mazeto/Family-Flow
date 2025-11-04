import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  cdr = inject(ChangeDetectorRef);
  
  familyName: string = '';
  familyCode: string = '';
  userRole: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Dados do usuário
  userName: string = '';
  userEmail: string = '';

  // Dados para a navbar
  get navbarData(): NavbarData {
    return {
      familyName: this.familyName,
      familyCode: this.familyCode,
      userName: this.userName,
      userEmail: this.userEmail,
      userRole: this.userRole,
      isLoading: this.isLoading,
      errorMessage: this.errorMessage
    };
  }

  constructor() { }

  ngOnInit() {
    console.log('🚀 FamilyDashboardComponent: Iniciando carregamento...');
    
    // Carregar dados
    this.loadFamilyInfo();
    this.loadUserInfo();
    
    // Forçar saída do loading após 2 segundos no máximo
    setTimeout(() => {
      console.log('⏰ Timeout: Verificando estado do loading...');
      console.log('🔍 Estado atual isLoading:', this.isLoading);
      console.log('🔍 Dados atuais:', {
        familyName: this.familyName,
        userName: this.userName,
        userRole: this.userRole
      });
      
      if (this.isLoading) {
        console.log('⚠️ Ainda em loading, forçando saída...');
        this.isLoading = false;
        
        // Se não carregou nada, usar valores padrão
        if (!this.familyName) {
          console.log('📝 Definindo familyName padrão');
          this.familyName = 'Minha Família';
          this.familyCode = 'FAM001';
        }
        if (!this.userName) {
          console.log('📝 Definindo userName padrão');
          this.userName = 'Usuário';
          this.userEmail = 'usuario@email.com';
        }
        
        this.cdr.detectChanges();
        console.log('🔄 ChangeDetectorRef.detectChanges() chamado no timeout');
      } else {
        console.log('✅ Loading já foi desabilitado normalmente');
      }
    }, 2000);
  }

  loadFamilyInfo() {
    console.log('👨‍👩‍👧‍👦 Carregando informações da família...');
    console.log('🔍 Estado atual isLoading:', this.isLoading);
    
    this.authService.getUserFamily().subscribe({
      next: (response) => {
        console.log('✅ Family info received:', response);
        this.familyName = response.familia.nome;
        this.familyCode = response.familia.codigo;
        this.userRole = response.familia.role;
        this.isLoading = false;
        
        console.log('🔄 Definindo isLoading = false');
        console.log('📊 Dados atualizados:', {
          familyName: this.familyName,
          userRole: this.userRole,
          isLoading: this.isLoading
        });
        
        this.cdr.detectChanges();
        console.log('🔄 ChangeDetectorRef.detectChanges() chamado');
      },
      error: (error) => {
        console.error('❌ Error loading family info:', error);
        this.errorMessage = error.mensagem || 'Erro ao carregar informações da família';
        this.isLoading = false;
        console.log('🔄 Definindo isLoading = false (erro)');
        this.cdr.detectChanges();
      }
    });
  }

  loadUserInfo() {
    console.log('👤 Carregando informações do usuário...');
    // Tentar obter dados do usuário do observable
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          console.log('✅ User data from observable:', user);
          this.userName = user.name || 'Usuário';
          this.userEmail = user.email || '';
          
          console.log('👤 Dados do usuário atualizados:', {
            userName: this.userName,
            userEmail: this.userEmail
          });
          
          this.cdr.detectChanges();
        } else {
          console.log('⚠️ No user data in observable, trying to get current user...');
          // Se não há dados no observable, tentar obter do backend
          this.getCurrentUser();
        }
      },
      error: (error) => {
        console.error('❌ Error loading user info:', error);
        this.getCurrentUser(); // Fallback
      }
    });
  }

  getCurrentUser() {
    console.log('🔄 Tentando obter usuário do servidor...');
    // Método alternativo para obter dados do usuário
    this.authService.getCurrentUserFromServer().subscribe({
      next: (response) => {
        console.log('✅ User data from /me endpoint:', response);
        if (response.usuarioAtual) {
          this.userName = response.usuarioAtual.name || 'Usuário';
          this.userEmail = response.usuarioAtual.email || '';
        }
      },
      error: (error) => {
        console.error('❌ Error getting current user:', error);
        // Se falhar, usar dados básicos
        this.userName = 'Usuário Logado';
        this.userEmail = 'usuario@email.com';
      }
    });
  }

  onTarefasClick(showTarefas: boolean) {
    console.log('📋 Evento tarefas recebido:', showTarefas);
    // Evento recebido do navbar-atalhos, mas a lógica agora está no próprio navbar-atalhos
  }

}
