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