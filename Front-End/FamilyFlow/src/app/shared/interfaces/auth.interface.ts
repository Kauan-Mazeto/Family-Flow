// Interface baseada no seu modelo Prisma User
export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

// Dados para login (baseado no seu controller)
export interface LoginRequest {
  email: string;
  password: string;
}

// Dados temporários do registro (antes de ir pro banco)
export interface TempRegisterData {
  nome_usuario: string;
  email_usuario: string;
  senha_usuario: string;
  family_option?: 'create' | 'join';
  family_name?: string;
  family_code?: string;
}

// Dados para registro (baseado no seu controller)
export interface RegisterRequest {
  email_usuario: string;
  senha_usuario: string;
  nome_usuario: string;
}

// Resposta de login (baseada no seu controller)
export interface LoginResponse {
  mensagem: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

// Resposta de registro (baseada no seu controller)
export interface RegisterResponse {
  mensagem: string;
  usuario: {
    id: number;
    name: string;
    email: string;
  };
}

// Resposta de usuário atual (baseada no seu controller)
export interface UserMeResponse {
  usuarioAtual: User;
}

// Resposta de erro (baseada nas suas respostas de erro)
export interface ErrorResponse {
  mensagem: string;
}

// Interface para criar família
export interface CreateFamilyRequest {
  nome_familia: string;
}

// Interface para entrar em família
export interface EnterFamilyRequest {
  codigo_familia_input: string;
}

// Resposta de criação de família
export interface CreateFamilyResponse {
  mensagem: string;
  familia: {
    id: number;
    nome: string;
    codigo: string;
  };
}

// Resposta de validação de código de família
export interface EnterFamilyResponse {
  codigo_familia: {
    id: number;
    name: string;
    family_code: string;
    created_by: number;
    created_at: string;
    updated_at: string;
  };
}

// Interface para o registro completo com família
export interface CompleteRegisterRequest {
  email_usuario: string;
  senha_usuario: string;
  nome_usuario: string;
  family_option: 'create' | 'join';
  family_name?: string;
  family_code?: string;
}