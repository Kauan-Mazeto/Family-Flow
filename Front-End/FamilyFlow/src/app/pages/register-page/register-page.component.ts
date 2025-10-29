import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent {

  formBuilder = inject(FormBuilder);

  registerForm = this.formBuilder.group({
    email: [''],
    password: [''],
    nome: ['']
  });

  email: string = '';
  password: string = '';
  nome: string = '';
  error_message: string = '';
  email_error: string = '';
  password_error: string = '';
  nome_error: string = '';
  is_loading: boolean = false;

  constructor() { }

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

    // Simular loading
    this.is_loading = true;

    // Simular delay de rede
    setTimeout(() => {
      // Verificar se email já existe (simulação)
      if (this.email === 'admin@familyflow.com') {
        this.error_message = 'Este email já está em uso';
      } else {
        console.log('Registro realizado com sucesso!');
        alert('Conta criada com sucesso! Você pode fazer login agora.');
        // Aqui você pode navegar para a página de login
        // this.router.navigate(['/users/login']);
      }
      
      this.is_loading = false;
    }, 1000);
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
    // Limpa todas as mensagens de erro quando o usuário digita
    this.error_message = '';
    this.email_error = '';
    this.password_error = '';
    this.nome_error = '';
  }
}