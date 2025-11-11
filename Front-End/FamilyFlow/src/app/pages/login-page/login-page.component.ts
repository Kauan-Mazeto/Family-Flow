import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { LoginRequest } from '../../shared/interfaces/auth.interface';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit, OnDestroy {

  authService = inject(AuthService);
  navegador = inject(Router);
  cdr = inject(ChangeDetectorRef);

  email: string = '';
  password: string = '';
  error_message: string = '';
  email_error: string = '';
  password_error: string = '';
  is_loading: boolean = false;

  // Subject para gerenciar unsubscribe
  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit() {
    // Observar o estado de loading do AuthService
    this.authService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.is_loading = loading;
      });

    // DESABILITADO TEMPORARIAMENTE - Verificação de usuário logado
    // Este redirecionamento automático estava causando loops
    
    // Só redirecionar se realmente estiver logado E se conseguir verificar a família
    if (this.authService.isLoggedIn()) {
      
      // Fazer uma verificação simples sem redirecionamento automático
      this.authService.checkUserHasFamily()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (error) => {
            // Limpar possível estado inconsistente
            this.authService.clearLocalState();
          }
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Validação de email
  is_valid_email(email: string): boolean {
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email_regex.test(email);
  }



  // Método para fazer login
  on_login() {
    this.clear_errors();
    
    // Validações básicas
    if (!this.email) {
      this.email_error = 'Email é obrigatório';
      return;
    }

    if (!this.password) {
      this.password_error = 'Senha é obrigatória';
      return;
    }

    // Iniciar loading
    this.is_loading = true;

    // Preparar dados para o backend
    const loginData: LoginRequest = {
      email: this.email,
      password: this.password
    };

    // Fazer login no backend
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.is_loading = false;
        
        // Verificar se o usuário tem família
        this.authService.checkUserHasFamily().subscribe({
          next: (hasFamily) => {
            if (hasFamily) {
              // Usuário tem família, redirecionar para dashboard
              this.navegador.navigate(['/family/dashboard']);
            } else {
              // Usuário não tem família, redirecionar para escolha de família
              console.log('Usuário não tem família, redirecionando para escolha de família');
              this.navegador.navigate(['/family/option']);
            }
          },
          error: (error) => {
            console.error('Erro ao verificar família do usuário:', error);
            // Em caso de erro na verificação, redirecionar para escolha de família por segurança
            this.navegador.navigate(['/family/option']);
          }
        });
      },
      error: (error) => {
        console.error('Erro no login - Componente:', error);
        
        // Tratar diferentes tipos de erro (handleLoginError já define is_loading = false)
        this.handleLoginError(error);
      }
    });
  }

  // Limpar todas as mensagens de erro
  clear_errors() {
    this.error_message = '';
    this.email_error = '';
    this.password_error = '';
  }

  // Limpar mensagens de erro quando usuário digitar
  on_input_change() {
    this.clear_errors();
  }

  // Tratar erros específicos do login
  handleLoginError(error: any) {
    // IMPORTANTE: Parar o loading primeiro
    this.is_loading = false;
    
    // Limpar erros anteriores
    this.clear_errors();
    
    if (error && error.erro_tipo) {
      // Verificar tipos específicos de erro
      switch (error.erro_tipo) {
        case 'USUARIO_NAO_EXISTE':
          this.email_error = 'Usuário não encontrado';
          break;
        default:
          this.error_message = error.mensagem || 'Erro no login.';
      }
    } else if (error && error.mensagem) {
      // Fallback para mensagens sem tipo específico
      const mensagem = error.mensagem.toLowerCase();
      
      if (mensagem.includes('usuário não encontrado')) {
        this.email_error = 'Usuário não encontrado';
      } else if (mensagem.includes('senha incorreta')) {
        this.password_error = 'Senha incorreta. Tente novamente.';
      } else if (mensagem.includes('email ou senha inválidos')) {
        this.error_message = 'Email ou senha incorretos. Verifique seus dados.';
      } else {
        this.error_message = error.mensagem;
      }
    } else {
      this.error_message = 'Erro ao conectar com o servidor. Tente novamente.';
    }
    
    // Forçar detecção de mudanças na view
    this.cdr.detectChanges();
  }

  navigate_to_register() {
    this.navegador.navigate(['/users/register']);
  }

}
