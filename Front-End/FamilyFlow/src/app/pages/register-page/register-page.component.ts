import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { RegisterRequest } from '../../shared/interfaces/auth.interface';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent implements OnInit, OnDestroy {

  authService = inject(AuthService);
  navegador = inject(Router);

  email: string = '';
  password: string = '';
  nome: string = '';
  error_message: string = '';
  email_error: string = '';
  password_error: string = '';
  nome_error: string = '';
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

  is_valid_password(password: string): boolean {
    return password.length >= 8;
  }

  // Validação de nome
  is_valid_nome(nome: string): boolean {
    return nome.trim().length >= 5;
  }

  // Método para fazer registro
  on_register() {
    console.log('Iniciando registro...');
    console.log('Nome:', this.nome);
    console.log('Email:', this.email);
    console.log('Password:', this.password);
    
    // Limpar erros anteriores
    this.clear_errors();
    
    // Validações básicas
    if (!this.nome) {
      this.nome_error = 'Nome é obrigatório';
      return;
    }

    if (!this.is_valid_nome(this.nome)) {
      this.nome_error = 'Nome deve ter pelo menos 5 caracteres';
      return;
    }

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

    if (!this.is_valid_password(this.password)) {
      this.password_error = 'Senha deve ter pelo menos 8 caracteres';
      return;
    }

    // Iniciar loading
    this.is_loading = true;

    // Preparar dados para o backend
    const registerData: RegisterRequest = {
      nome_usuario: this.nome,
      email_usuario: this.email,
      senha_usuario: this.password
    };

    console.log('Enviando dados para o backend:', registerData);

    // Fazer registro no backend
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registro realizado com sucesso!', response);
        this.is_loading = false;
        alert('Conta criada com sucesso! Você pode fazer login agora.');
        this.navegador.navigate(['/users/login']);
      },
      error: (error) => {
        console.log('Erro no registro:', error);
        console.error('Erro completo:', error);
        this.is_loading = false;
        
        // O AuthService já trata os erros e retorna a mensagem
        if (error && error.mensagem) {
          this.error_message = error.mensagem;
        } else {
          this.error_message = 'Erro ao criar conta. Tente novamente.';
        }
      }
    });
  }

  // Limpar todas as mensagens de erro
  clear_errors() {
    this.error_message = '';
    this.email_error = '';
    this.password_error = '';
    this.nome_error = '';
  }

  // Limpar mensagens de erro quando usuário digitar
  on_input_change() {
    this.clear_errors();
  }

  navigate_to_login() {
    this.navegador.navigate(['/users/login']);
  }
}