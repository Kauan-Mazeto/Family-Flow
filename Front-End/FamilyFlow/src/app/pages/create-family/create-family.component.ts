import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationFlowService } from '../../shared/services/registration-flow.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-create-family',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-family.component.html',
  styleUrls: ['./create-family.component.scss']
})
export class CreateFamilyComponent implements OnInit {

  navegador = inject(Router);
  registrationFlow = inject(RegistrationFlowService);
  authService = inject(AuthService);

  family_name: string = '';
  error_message: string = '';
  name_error: string = '';
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

  // Validação do nome da família
  is_valid_name(name: string): boolean {
    return name.trim().length >= 3;
  }

  // Função para criar família
  completeRegistration() {

    
    if (!this.family_name.trim()) {
      this.error_message = 'Digite um nome para sua família';
      return;
    }

    if (!this.is_valid_name(this.family_name)) {
      this.name_error = 'O nome da família deve ter pelo menos 3 caracteres';
      return;
    }

    this.is_loading = true;
    this.clear_errors();
    

    
    // Obter dados temporários do registro
    const tempData = this.registrationFlow.getTempData();
    if (!tempData) {
      console.error('CreateFamily: Dados temporários não encontrados');
      this.error_message = 'Dados de registro não encontrados. Reinicie o processo.';
      this.navegador.navigate(['/register']);
      return;
    }

    console.log('CreateFamily: Dados temporários encontrados:', {
      nome: tempData.nome_usuario,
      email: tempData.email_usuario,
      familia: this.family_name.trim()
    });

    // Preparar dados completos para registro com família
    const completeData = {
      email_usuario: tempData.email_usuario,
      senha_usuario: tempData.senha_usuario,
      nome_usuario: tempData.nome_usuario,
      family_option: 'create' as const,
      family_name: this.family_name.trim()
    };



    // Executar registro completo com criação de família (método simplificado)
    this.authService.completeRegistrationWithFamilySimple(completeData).subscribe({
      next: (response) => {

        this.is_loading = false;
        
        // Limpar dados temporários
        this.registrationFlow.clearTempData();
        
        // Redireciona para tela de login após registro completo
        this.navegador.navigate(['/users/login'], { 
          queryParams: { message: `Registro completo! Família "${this.family_name}" criada com sucesso! Faça login para continuar.` }
        });
      },
      error: (error) => {
        console.error('CreateFamily: Erro no registro completo:', error);
        console.error('CreateFamily: Tipo do erro:', typeof error);
        console.error('CreateFamily: Propriedades do erro:', Object.keys(error || {}));
        
        this.is_loading = false;
        
        // Melhor tratamento de erro
        let errorMessage = 'Erro ao criar família. Tente novamente.';
        
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.mensagem) {
            errorMessage = error.mensagem;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.error && error.error.mensagem) {
            errorMessage = error.error.mensagem;
          } else {
            // Se chegou até aqui, tentar extrair qualquer informação útil
            errorMessage = `Erro inesperado: ${JSON.stringify(error)}`.substring(0, 100);
          }
        }
        
        this.error_message = errorMessage;
        console.log('CreateFamily: Mensagem de erro final:', errorMessage);
      }
    });
  }

  // Limpar todas as mensagens de erro
  clear_errors() {
    this.error_message = '';
    this.name_error = '';
  }

  // Limpar mensagens de erro quando usuário digitar
  on_input_change() {
    this.clear_errors();
  }

  // Função chamada pelo formulário HTML
  on_create_family() {
    this.completeRegistration();
  }

}
