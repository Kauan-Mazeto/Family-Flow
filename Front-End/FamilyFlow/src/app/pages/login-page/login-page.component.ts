import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  formBuilder = inject(FormBuilder);

  loginForm = this.formBuilder.group({
    email: [''],
    password: ['']
  });

  email: string = '';
  password: string = '';
  error_message: string = '';
  email_error: string = '';
  password_error: string = '';
  is_loading: boolean = false;

  navegador = inject(Router);

  // Usuários mockados para teste
  private valid_users = [
    { email: 'admin@familyflow.com', password: '123456' },
    { email: 'user@test.com', password: 'senha123' },
    { email: 'familia@email.com', password: 'family2024' }
  ];

  constructor() { }

  ngOnInit() {
    
  }

  // Validação de email
  is_valid_email(email: string): boolean {
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email_regex.test(email);
  }

  // Validação da senha
  is_valid_password(password: string): boolean {
    return password.length >= 6;
  }

  // Validar credenciais
  validate_credentials(email: string, password: string): boolean {
    return this.valid_users.some(user => 
      user.email === email && user.password === password
    );
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

    if (!this.is_valid_password(this.password)) {
      this.password_error = 'Senha deve ter pelo menos 6 caracteres';
      return;
    }

    // Simular loading
    this.is_loading = true;

    // Simular delay de rede
    setTimeout(() => {
      if (this.validate_credentials(this.email, this.password)) {
        alert('Login realizado com sucesso!');
        console.log('Usuário logado:', this.email);

      } else {
        this.error_message = 'Email ou senha incorretos';
      }
      
      this.is_loading = false;
    }, 1000);
  }

  // Limpar todas as mensagens de erro
  clear_errors() {
    this.error_message = '';
    this.email_error = '';
    this.password_error = '';
  }

  // Limpar mensagem de erro quando usuário digitar
  on_input_change() {
    this.clear_errors();
  }

  // Validação em tempo real do email
  on_email_change() {
    if (this.email && !this.is_valid_email(this.email)) {
      this.email_error = 'Email inválido';
    } else {
      this.email_error = '';
    }
  }

  // Validação em tempo real da senha
  on_password_change() {
    if (this.password && !this.is_valid_password(this.password)) {
      this.password_error = 'Senha deve ter pelo menos 6 caracteres';
    } else {
      this.password_error = '';
    }
  }

  navigate_to_register() {
    this.navegador.navigate(['/register']);
  }

}
