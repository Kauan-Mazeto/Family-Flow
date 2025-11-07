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
    console.log('🔐 Componente de login carregado');
    console.log('🔐 Status de login:', this.authService.isLoggedIn());
    
    // Só redirecionar se realmente estiver logado E se conseguir verificar a família
    if (this.authService.isLoggedIn()) {
      console.log('🔐 Usuário parece estar logado, mas permitindo acesso à tela de login');
      console.log('🔐 Para debug: verificando se consegue acessar dados do usuário...');
      
      // Fazer uma verificação simples sem redirecionamento automático
      this.authService.checkUserHasFamily()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (hasFamily) => {
            console.log('✅ Verificação de família bem-sucedida:', hasFamily);
            console.log('ℹ️ Usuário pode fazer login normalmente ou será redirecionado após login bem-sucedido');
          },
          error: (error) => {
            console.log('❌ Erro na verificação de família - usuário pode não estar realmente logado:', error);
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
    console.log('Enviando dados para o backend:', loginData);
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso!', response);
        this.is_loading = false;
        
        // Verificar se o usuário tem família
        console.log('🔍 Verificando se usuário tem família...');
        this.authService.checkUserHasFamily().subscribe({
          next: (hasFamily) => {
            console.log('✅ Verificação de família concluída:', hasFamily);
            if (hasFamily) {
              // Usuário tem família, redirecionar para dashboard
              console.log('👨‍👩‍👧‍👦 Usuário tem família, redirecionando para dashboard');
              this.navegador.navigate(['/family/dashboard']);
            } else {
              // Usuário não tem família, redirecionar para escolha de família
              console.log('❌ Usuário não tem família, redirecionando para escolha de família');
              this.navegador.navigate(['/family/option']);
            }
          },
          error: (error) => {
            console.error('❌ Erro ao verificar família do usuário:', error);
            // Em caso de erro na verificação, redirecionar para escolha de família por segurança
            console.log('🔄 Redirecionando para escolha de família por segurança');
            this.navegador.navigate(['/family/option']);
          }
        });
      },
      error: (error) => {
        console.log('Erro no login - Componente:', error);
        console.log('Tipo do erro:', typeof error);
        console.log('Tem erro_tipo?', error?.erro_tipo);
        console.log('Mensagem:', error?.mensagem);
        
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
    
    console.log('=== DEBUG ERRO ===');
    console.log('Erro recebido no handleLoginError:', error);
    console.log('Tem erro_tipo?', error?.erro_tipo);
    console.log('Mensagem:', error?.mensagem);
    console.log('==================');
    
    if (error && error.erro_tipo) {
      console.log('Entrando no switch com erro_tipo:', error.erro_tipo);
      // Verificar tipos específicos de erro
      switch (error.erro_tipo) {
        case 'USUARIO_NAO_EXISTE':
          console.log('Definindo email_error');
          this.email_error = 'Usuário não encontrado';
          console.log('email_error definido como:', this.email_error);
          break;
        case 'SENHA_INCORRETA':
          console.log('Definindo password_error');
          this.password_error = 'Senha incorreta. Tente novamente.';
          console.log('password_error definido como:', this.password_error);
          break;
        default:
          console.log('Erro tipo não reconhecido, usando mensagem geral');
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
    console.log('Forçou detectChanges - email_error:', this.email_error);
    console.log('Forçou detectChanges - password_error:', this.password_error);
    console.log('Forçou detectChanges - error_message:', this.error_message);
  }

  navigate_to_register() {
    this.navegador.navigate(['/users/register']);
  }

}
