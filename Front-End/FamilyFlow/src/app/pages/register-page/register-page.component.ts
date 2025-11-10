import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { RegistrationFlowService } from '../../shared/services/registration-flow.service';
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
  registrationFlow = inject(RegistrationFlowService);
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
    console.log('Iniciando processo de registro...');
    
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

    // Salvar dados temporariamente (não registra no banco ainda)
    console.log('Salvando dados temporários:', { nome: this.nome, email: this.email });
    
    this.registrationFlow.setUserData(this.nome, this.email, this.password);
    
    console.log('Dados salvos, navegando para /family/option');
    
    // Navegar para a próxima etapa: escolher opção de família
    this.navegador.navigate(['/family/option']).then(success => {
      if (success) {
        console.log('Navegação para /family/option bem-sucedida');
      } else {
        console.error('Falha na navegação para /family/option');
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