import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, throwError, timeout, switchMap, finalize, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  User, 
  LoginRequest, 
  RegisterRequest,
  LoginResponse, 
  RegisterResponse,
  UserMeResponse,
  ErrorResponse,
  CreateFamilyRequest,
  CreateFamilyResponse,
  EnterFamilyRequest,
  EnterFamilyResponse,
  CompleteRegisterRequest
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly endpoints = environment.endpoints;
  
  // Subject para gerenciar o estado do usuário logado
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Subject para gerenciar o estado de loading
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    // O guard será responsável por verificar a autenticação quando necessário
  }

  /**
   * Fazer login (baseado na sua rota POST /users/login)
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.loadingSubject.next(true);

    
    return this.http.post<LoginResponse>(
      `${this.API_URL}${this.endpoints.login}`, 
      credentials,
      { 
        withCredentials: true, // Habilitar cookies já que CORS está configurado
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      timeout(10000),
      map(response => {
        if (response.user) {
          // Converter para o formato User completo
          const user: User = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            is_active: true, // Assumindo que está ativo se fez login
            is_admin: false, // Vai ser definido quando buscar dados completos
            avatar_url: undefined,
            created_at: new Date().toISOString()
          };
          this.currentUserSubject.next(user);
          
          // Buscar dados completos do usuário após login bem-sucedido
          this.getCurrentUserFromServer().subscribe({
            next: (fullUserData) => {
              if (fullUserData.usuarioAtual) {
                const completeUser: User = {
                  id: fullUserData.usuarioAtual.id,
                  name: fullUserData.usuarioAtual.name,
                  email: fullUserData.usuarioAtual.email,
                  is_active: fullUserData.usuarioAtual.is_active,
                  is_admin: fullUserData.usuarioAtual.is_admin,
                  avatar_url: fullUserData.usuarioAtual.avatar_url,
                  created_at: fullUserData.usuarioAtual.created_at
                };
                this.currentUserSubject.next(completeUser);
              }
            },
            error: (error) => {
            }
          });
        }
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Registrar usuário (baseado na sua rota POST /users/register)
   */
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<RegisterResponse>(
      `${this.API_URL}${this.endpoints.register}`, 
      userData
    ).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Buscar dados completos do usuário atual (baseado na sua rota POST /users/me)
   */
  getCurrentUserFromServer(): Observable<UserMeResponse> {
    
    // Verificar se há cookie tokenAuth
    const cookies = document.cookie.split(';');
    const tokenAuth = cookies.find(cookie => cookie.trim().startsWith('tokenAuth='));
    
    this.loadingSubject.next(true);
    
    return this.http.post<UserMeResponse>(
      `${this.API_URL}${this.endpoints.userMe}`,
      {}, // Body vazio, dados vêm do token/cookie
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        observe: 'response' // Para ver headers da resposta
      }
    ).pipe(
      map(fullResponse => {
        const response = fullResponse.body as UserMeResponse;
        
        if (response && response.usuarioAtual) {
          this.currentUserSubject.next(response.usuarioAtual);
        }
        
        this.loadingSubject.next(false);
        return response;
      }),
      catchError((error) => {
        console.error('AuthService: Erro na verificação do usuário:', error);
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Fazer logout (baseado na sua rota POST /users/logout)
   */
  logout(): Observable<any> {
    return this.http.post(
      `${this.API_URL}${this.endpoints.logout}`,
      {},
      { withCredentials: true }
    ).pipe(
      map(response => {
        // Limpar estado do usuário após logout
        this.currentUserSubject.next(null);
        this.clearLocalState();
        return response;
      }),
      catchError(error => {
        // Mesmo com erro no logout, limpar estado local
        this.currentUserSubject.next(null);
        this.clearLocalState();
        return this.handleError(error);
      })
    );
  }

  /**
   * Apagar conta do usuário permanentemente
   */
  deleteAccount(): Observable<any> {
    return this.http.delete(
      `${this.API_URL}${this.endpoints.deleteAccount}`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        // Limpar estado do usuário após apagar conta
        this.currentUserSubject.next(null);
        this.clearLocalState();
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Limpar estado local de autenticação (para resolver estados inconsistentes)
   */
  clearLocalState(): void {
    this.currentUserSubject.next(null);
    
    // Limpar possíveis dados no localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userToken');
    }
    
    // Limpar possíveis dados no sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userToken');
    }
    
  }

  /**
   * Verificar se usuário está logado
   */
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Carregar informações do usuário atual
   */
  loadUserInfo(): void {
    this.getCurrentUserFromServer().subscribe({
      next: (response) => {
        if (response.usuarioAtual) {
          const user: User = {
            id: response.usuarioAtual.id,
            name: response.usuarioAtual.name,
            email: response.usuarioAtual.email,
            is_active: response.usuarioAtual.is_active,
            is_admin: response.usuarioAtual.is_admin,
            avatar_url: response.usuarioAtual.avatar_url,
            created_at: response.usuarioAtual.created_at
          };
          this.currentUserSubject.next(user);
        }
      },
      error: z => {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Verificar se há usuário autenticado no servidor
   */
  private checkCurrentUser(): void {
    this.getCurrentUserFromServer().subscribe({
      error: (error) => {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Criar família (baseado na rota POST /family/create)
   */
  createFamily(familyData: CreateFamilyRequest): Observable<CreateFamilyResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<CreateFamilyResponse>(
      `${this.API_URL}${this.endpoints.createFamily}`,
      familyData,
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        observe: 'response' // Para ver toda a resposta
      }
    ).pipe(
      map(fullResponse => {
        const response = fullResponse.body as CreateFamilyResponse;
        this.loadingSubject.next(false);
        return response;
      }),
      catchError((error) => {
        console.error('AuthService:  ERRO DETALHADO na criação de família:');
        console.error('AuthService:  Erro completo:', error);
        console.error('AuthService:  Status HTTP:', error.status);
        console.error('AuthService:  Corpo do erro:', error.error);
        console.error('AuthService:  URL da requisição:', error.url);
        console.error('AuthService:  Headers da resposta:', error.headers);
        
        if (error.status === 401) {
          console.error('AuthService:  ERRO 401 - Não autenticado!');
          console.error('AuthService:  Cookies no momento do erro:', document.cookie);
        } else if (error.status === 0) {
          console.error('AuthService:  ERRO 0 - Problema de conexão/CORS!');
        }
        
        return this.handleError(error);
      })
    );
  }

  /**
   * Entrar na família (baseado na rota POST /family/enter)
   * Este método adiciona o usuário à família, não apenas valida
   */
  enterFamily(codeData: EnterFamilyRequest): Observable<EnterFamilyResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<EnterFamilyResponse>(
      `${this.API_URL}${this.endpoints.enterFamily}`,
      codeData,
      { withCredentials: true }
    ).pipe(
      map(response => {
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Método de teste para verificar se o usuário está autenticado
   */
  testAuthenticationStatus(): Observable<any> {
    return this.http.post(`${this.API_URL}${this.endpoints.userMe}`, {}, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('AuthService:  Usuário não autenticado:', error);
        return throwError(() => error);
      })
    );
  }



  /**
   * Método de teste público para debugar criação de família
   */
  testCreateFamilyDirect(familyName: string): Observable<any> {
    
    return this.http.post(
      `${this.API_URL}${this.endpoints.createFamily}`,
      { nome_familia: familyName },
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        observe: 'response'
      }
    ).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('AuthService:  TESTE - Erro:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Método de teste para verificar conectividade com o backend
   */
  testBackendConnection(): Observable<any> {
    return this.http.get(`${this.API_URL}/users/register`, { observe: 'response' }).pipe(
      map(response => {
        return { status: 'ok', message: 'Backend conectado' };
      }),
      catchError(error => {
        console.error('AuthService: Erro de conexão:', error);
        return throwError(() => ({ message: 'Backend não está respondendo' }));
      })
    );
  }

  /**
   * Validar código de família (baseado na rota POST /family/enter)
   */
  validateFamilyCode(codeData: EnterFamilyRequest): Observable<EnterFamilyResponse> {
    return this.enterFamily(codeData);
  }

  /**
   * Registro completo com família - primeiro registra usuário, depois cria/entra na família
   */
  completeRegistrationWithFamily(userData: CompleteRegisterRequest): Observable<RegisterResponse> {
    this.loadingSubject.next(true);
    

    // Desabilitado modo de desenvolvimento para usar backend real

    // Primeiro registra o usuário
    const registerData: RegisterRequest = {
      email_usuario: userData.email_usuario,
      senha_usuario: userData.senha_usuario,
      nome_usuario: userData.nome_usuario
    };

    return this.register(registerData).pipe(
      switchMap(registerResponse => {
        
        // Após registrar, faz login automático para obter autenticação
        const loginData: LoginRequest = {
          email: userData.email_usuario,
          password: userData.senha_usuario
        };

        return this.login(loginData).pipe(
          switchMap(loginResponse => {
            
            return new Observable(observer => {
              setTimeout(() => {
                observer.next(loginResponse);
                observer.complete();
              }, 1000); // Aguardar 1 segundo
            }).pipe(
              switchMap(() => {
                return this.testAuthenticationStatus();
              }),
              switchMap(authTest => {
                
                // Após confirmar autenticação, cria ou entra na família
                if (userData.family_option === 'create' && userData.family_name) {
                  return this.createFamily({ nome_familia: userData.family_name }).pipe(
                    map(familyResponse => {
                      return registerResponse; // Retorna a resposta original do registro
                    })
                  );
                } else if (userData.family_option === 'join' && userData.family_code) {
                  return this.enterFamily({ codigo_familia_input: userData.family_code }).pipe(
                    map(familyResponse => {
                      return registerResponse; // Retorna a resposta original do registro
                    })
                  );
                }
                return throwError(() => ({ mensagem: 'Opção de família inválida' }));
              }),
              catchError(authError => {
                return throwError(() => ({ mensagem: 'Falha na autenticação. Tente fazer login novamente.' }));
              })
            );
          })
        );
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        return this.handleError(error);
      })
    );
  }

  completeRegistrationWithFamilySimple(userData: CompleteRegisterRequest): Observable<RegisterResponse> {
    this.loadingSubject.next(true);

    // 1. Registrar usuário
    const registerData: RegisterRequest = {
      email_usuario: userData.email_usuario,
      senha_usuario: userData.senha_usuario,
      nome_usuario: userData.nome_usuario
    };

    return this.register(registerData).pipe(
      switchMap(registerResponse => {
        
        // 2. Fazer login para obter autenticação
        const loginData: LoginRequest = {
          email: userData.email_usuario,
          password: userData.senha_usuario
        };

        return this.login(loginData).pipe(
          switchMap(loginResponse => {
            
            // 3. Se deve criar família, fazer isso agora que está autenticado
            if (userData.family_option === 'create' && userData.family_name) {
              
              return this.http.post<CreateFamilyResponse>(
                `${this.API_URL}${this.endpoints.createFamily}`,
                { nome_familia: userData.family_name },
                { 
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  observe: 'response' // Para ver resposta completa
                }
              ).pipe(
                map(fullResponse => {
                  const familyResponse = fullResponse.body as CreateFamilyResponse;
                  return registerResponse;
                }),
                catchError(familyError => {
                  
                  // Usuário foi criado com sucesso, família falhou
                  console.warn('AuthService:  USUÁRIO CRIADO, MAS FAMÍLIA FALHOU');
                  return throwError(() => ({
                    mensagem: `Usuário criado, mas erro na família: ${familyError.error?.mensagem || 'Erro interno do servidor'}`
                  }));
                })
              );
              
            } else if (userData.family_option === 'join' && userData.family_code) {
              
              return this.http.post<EnterFamilyResponse>(
                `${this.API_URL}${this.endpoints.enterFamily}`,
                { codigo_familia_input: userData.family_code },
                { 
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                }
              ).pipe(
                map(familyResponse => {
                  return registerResponse;
                }),
                catchError(familyError => {
                  return throwError(() => ({
                    mensagem: `Usuário criado, mas erro ao entrar na família: ${familyError.error?.mensagem || 'Erro desconhecido'}`
                  }));
                })
              );
              
            } else {
              return of(registerResponse);
            }
          })
        );
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obter informações da família do usuário atual
   */
  getUserFamily(): Observable<{familia: {id: number, nome: string, codigo: string, role: string}}> {
    
    return this.http.get<{familia: {id: number, nome: string, codigo: string, role: string}}>(
      `${this.API_URL}/family/info`,
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Tratamento de erros HTTP baseado nas suas respostas de erro
   */
  private handleError(error: any): Observable<never> {
    this.loadingSubject.next(false);
    console.error('AuthService: Erro capturado:', error);
    
    let errorMessage = 'Erro desconhecido no servidor';
    
    // Verificar se é um HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      console.error('AuthService: HttpErrorResponse - Status:', error.status);
      console.error('AuthService: HttpErrorResponse - Message:', error.message);
      console.error('AuthService: HttpErrorResponse - Body:', error.error);
      
      if (error.message?.includes('Timeout')) {
        // Erro de timeout
        errorMessage = 'Timeout: Verifique se o backend está rodando na porta 8080';
      } else {
        // Erro do backend
        if (error.error && error.error.mensagem) {
          errorMessage = error.error.mensagem;
          
          // Tratar tipos específicos de erro
          if (error.error.erro_tipo) {
            switch (error.error.erro_tipo) {
              case 'USUARIO_NAO_EXISTE':
                errorMessage = 'Usuário não encontrado. Verifique seu email.';
                break;
              case 'SENHA_INCORRETA':
                errorMessage = 'Senha incorreta. Tente novamente.';
                break;
              case 'USUARIO_INATIVO':
                errorMessage = 'Sua conta foi desativada. Entre em contato com o suporte.';
                break;
              case 'CAMPOS_OBRIGATORIOS':
                errorMessage = 'Todos os campos são obrigatórios.';
                break;
              case 'EMAIL_FORMATO_INVALIDO':
                errorMessage = 'Formato de email inválido.';
                break;
              case 'SENHA_MUITO_CURTA':
                errorMessage = 'Senha deve ter pelo menos 8 caracteres.';
                break;
            }
          }
        } else {
          switch (error.status) {
            case 0:
              errorMessage = 'Erro de conexão: Verifique se o backend está rodando na porta 8080';
              break;
            case 400:
              errorMessage = 'Dados inválidos ou incompletos';
              break;
            case 401:
              errorMessage = 'Credenciais inválidas';
              break;
            case 403:
              errorMessage = 'Acesso negado';
              break;
            case 404:
              errorMessage = 'Usuário não encontrado';
              break;
            case 409:
              errorMessage = 'Email já cadastrado';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor';
              break;
            default:
              errorMessage = `Erro HTTP ${error.status}: ${error.message || 'Erro no servidor'}`;
          }
        }
      }
    } else {
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && error.mensagem) {
        errorMessage = error.mensagem;
      } else if (error && error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Erro inesperado na aplicação';
      }
    }
    
    
    // Se o erro original tem erro_tipo, preservar essa informação
    let errorResponse: ErrorResponse = {
      mensagem: errorMessage
    };
    
    if (error instanceof HttpErrorResponse && error.error && error.error.erro_tipo) {
      errorResponse.erro_tipo = error.error.erro_tipo;
    }
    
    return throwError(() => errorResponse);
  }

  /**
   * Verificar se o usuário tem família
   */
  checkUserHasFamily(): Observable<boolean> {
    return this.getCurrentUserFromServer().pipe(
      map(response => {
        // Se user_active_system existe e não contém mensagem de erro, usuário tem família
        return !!(response.user_active_system && response.user_active_system.family_id);
      }),
      catchError(() => {
        // Em caso de erro, assumir que não tem família
        return of(false);
      })
    );
  }
}