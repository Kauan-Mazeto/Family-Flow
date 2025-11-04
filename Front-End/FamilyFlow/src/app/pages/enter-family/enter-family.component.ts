import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationFlowService } from '../../shared/services/registration-flow.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-enter-family',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enter-family.component.html',
  styleUrls: ['./enter-family.component.scss']
})
export class EnterFamilyComponent implements OnInit {

  navegador = inject(Router);
  registrationFlow = inject(RegistrationFlowService);
  authService = inject(AuthService);

  family_code: string = '';
  error_message: string = '';
  code_error: string = '';
  is_loading: boolean = false;

  constructor() { }

  ngOnInit() {
    // Verificar se os dados pessoais foram preenchidos
    if (!this.registrationFlow.hasUserData()) {
      console.log('Dados pessoais não encontrados, redirecionando para registro...');
      this.navegador.navigate(['/users/register']);
      return;
    }
  }

  // Validação do código da família
  is_valid_code(code: string): boolean {
    return code.length >= 6; // Código deve ter pelo menos 6 caracteres
  }

  // Função para entrar na família
  on_enter_family() {
    this.clear_errors();

    // Validações
    if (!this.family_code.trim()) {
      this.code_error = 'Digite o código da família';
      return;
    }

    if (!this.is_valid_code(this.family_code)) {
      this.code_error = 'Código deve ter pelo menos 6 caracteres';
      return;
    }

    this.is_loading = true;

    // Obter dados temporários do registro
    const tempData = this.registrationFlow.getTempData();
    if (!tempData) {
      this.error_message = 'Dados de registro não encontrados. Reinicie o processo.';
      this.navegador.navigate(['/register']);
      return;
    }

    // Preparar dados completos para registro com família
    const completeData = {
      email_usuario: tempData.email_usuario,
      senha_usuario: tempData.senha_usuario,
      nome_usuario: tempData.nome_usuario,
      family_option: 'join' as const,
      family_code: this.family_code.trim()
    };

    // Executar registro completo com entrada na família (método simplificado)
    this.authService.completeRegistrationWithFamilySimple(completeData).subscribe({
      next: (response) => {
        console.log('Registro e entrada na família realizados com sucesso:', response);
        this.is_loading = false;
        
        // Limpar dados temporários
        this.registrationFlow.clearTempData();
        
        // Redireciona para tela de login após registro completo
        this.navegador.navigate(['/users/login'], { 
          queryParams: { message: `Registro completo! Você entrou na família com sucesso! Faça login para continuar.` }
        });
      },
      error: (error) => {
        console.error('Erro no registro completo:', error);
        this.is_loading = false;
        
        if (error && error.mensagem) {
          // Verificar se é erro de código inválido
          if (error.mensagem.includes('inválido') || error.mensagem.includes('inexistente')) {
            this.code_error = error.mensagem;
          } else {
            this.error_message = error.mensagem;
          }
        } else {
          this.error_message = 'Erro ao entrar na família. Tente novamente.';
        }
      }
    });
  }

  // Limpar todas as mensagens de erro
  clear_errors() {
    this.error_message = '';
    this.code_error = '';
  }

  // Limpar mensagens de erro quando usuário digitar
  on_input_change() {
    this.clear_errors();
  }
}
