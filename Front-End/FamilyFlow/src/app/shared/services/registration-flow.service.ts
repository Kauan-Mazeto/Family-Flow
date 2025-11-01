import { Injectable } from '@angular/core';
import { TempRegisterData } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class RegistrationFlowService {
  private tempData: TempRegisterData | null = null;

  constructor() { }

  // Salvar dados pessoais iniciais
  setUserData(nome: string, email: string, senha: string) {
    this.tempData = {
      nome_usuario: nome,
      email_usuario: email,
      senha_usuario: senha
    };
  }

  // Salvar opção de família
  setFamilyOption(option: 'create' | 'join') {
    if (this.tempData) {
      this.tempData.family_option = option;
    }
  }

  // Salvar dados da família criada
  setFamilyName(name: string) {
    if (this.tempData) {
      this.tempData.family_name = name;
    }
  }

  // Salvar código da família para entrar
  setFamilyCode(code: string) {
    if (this.tempData) {
      this.tempData.family_code = code;
    }
  }

  // Obter dados completos
  getTempData(): TempRegisterData | null {
    return this.tempData;
  }

  // Verificar se os dados pessoais estão completos
  hasUserData(): boolean {
    return this.tempData?.nome_usuario && 
           this.tempData?.email_usuario && 
           this.tempData?.senha_usuario ? true : false;
  }

  // Verificar se o fluxo está completo
  isFlowComplete(): boolean {
    if (!this.hasUserData()) return false;
    
    if (this.tempData?.family_option === 'create') {
      return !!this.tempData.family_name;
    } else if (this.tempData?.family_option === 'join') {
      return !!this.tempData.family_code;
    }
    
    return false;
  }

  // Limpar dados temporários
  clearTempData() {
    this.tempData = null;
  }

  // Obter dados para o backend
  getRegisterData() {
    if (!this.tempData) return null;
    
    return {
      nome_usuario: this.tempData.nome_usuario,
      email_usuario: this.tempData.email_usuario,
      senha_usuario: this.tempData.senha_usuario
    };
  }

  // Obter dados da família
  getFamilyData() {
    if (!this.tempData) return null;
    
    return {
      option: this.tempData.family_option,
      name: this.tempData.family_name,
      code: this.tempData.family_code
    };
  }
}