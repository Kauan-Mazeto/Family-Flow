import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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

    // Se o usuário já estiver logado, redirecionar
    if (this.authService.isLoggedIn()) {
      this.navegador.navigate(['/dashboard/initial']);
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

    if (!this.is_valid_email(this.email)) {
      this.email_error = 'Email inválido';
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
    console.log('URL da requisição:', `http://localhost:8080/users/login`);
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso!', response);
        this.is_loading = false;
        alert('Login realizado com sucesso!');
        this.navegador.navigate(['/family/dashboard']);
      },
      error: (error) => {
        console.log('Erro no login:', error);
        console.error('Erro completo:', error);
        this.is_loading = false;
        
        // O AuthService já trata os erros e retorna a mensagem
        if (error && error.mensagem) {
          this.error_message = error.mensagem;
        } else {
          this.error_message = 'Erro ao conectar com o servidor';
        }
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

  navigate_to_register() {
    this.navegador.navigate(['/users/register']);
  }

}
