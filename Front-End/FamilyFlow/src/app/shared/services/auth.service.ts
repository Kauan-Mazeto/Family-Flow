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
    // Verificar se usuário está autenticado ao inicializar
    // this.checkCurrentUser(); // Temporariamente desabilitado para debug
  }

  /**
   * Fazer login (baseado na sua rota POST /users/login)
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.loadingSubject.next(true);
    console.log('AuthService: 🔐 Fazendo login para:', credentials.email);
    console.log('AuthService: URL completa:', `${this.API_URL}${this.endpoints.login}`);
    
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
      timeout(10000), // 10 segundos de timeout
      map(response => {
        console.log('AuthService: ✅ Login realizado com sucesso:', response);
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
    this.loadingSubject.next(true);
    
    return this.http.post<UserMeResponse>(
      `${this.API_URL}${this.endpoints.userMe}`,
      {}, // Body vazio, dados vêm do token/cookie
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response.usuarioAtual) {
          this.currentUserSubject.next(response.usuarioAtual);
        }
        this.loadingSubject.next(false);
        return response;
      }),
      catchError(this.handleError.bind(this))
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
        this.currentUserSubject.next(null);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
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
   * Verificar se há usuário autenticado no servidor
   */
  private checkCurrentUser(): void {
    this.getCurrentUserFromServer().subscribe({
      next: (response) => {
        // Usuário está autenticado
        console.log('Usuário já autenticado:', response.usuarioAtual);
      },
      error: (error) => {
        // Usuário não está autenticado ou token expirou
        console.log('Usuário não autenticado');
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Criar família (baseado na rota POST /family/create)
   */
  createFamily(familyData: CreateFamilyRequest): Observable<CreateFamilyResponse> {
    this.loadingSubject.next(true);
    console.log('AuthService: 🏠 Iniciando criação de família:', familyData);
    console.log('AuthService: 🔗 URL:', `${this.API_URL}${this.endpoints.createFamily}`);
    console.log('AuthService: 🍪 Cookies disponíveis:', document.cookie);
    
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
        console.log('AuthService: 📥 Resposta completa da criação de família:', fullResponse);
        const response = fullResponse.body as CreateFamilyResponse;
        console.log('AuthService: ✅ Família criada com sucesso:', response);
        this.loadingSubject.next(false);
        return response;
      }),
      catchError((error) => {
        console.error('AuthService: ❌ ERRO DETALHADO na criação de família:');
        console.error('AuthService: 🔍 Erro completo:', error);
        console.error('AuthService: 📊 Status HTTP:', error.status);
        console.error('AuthService: 📝 Corpo do erro:', error.error);
        console.error('AuthService: 🌐 URL da requisição:', error.url);
        console.error('AuthService: � Headers da resposta:', error.headers);
        
        if (error.status === 401) {
          console.error('AuthService: 🚫 ERRO 401 - Não autenticado!');
          console.error('AuthService: 🍪 Cookies no momento do erro:', document.cookie);
        } else if (error.status === 0) {
          console.error('AuthService: 🔗 ERRO 0 - Problema de conexão/CORS!');
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
    console.log('AuthService: 🔍 Testando status de autenticação...');
    return this.http.post(`${this.API_URL}${this.endpoints.userMe}`, {}, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(response => {
        console.log('AuthService: ✅ Usuário autenticado:', response);
        return response;
      }),
      catchError(error => {
        console.error('AuthService: ❌ Usuário não autenticado:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Método de teste para verificar se a autenticação está funcionando
   */
  testAuth(): Observable<any> {
    console.log('AuthService: 🧪 TESTE DE AUTENTICAÇÃO');
    console.log('AuthService: 🍪 Cookies disponíveis:', document.cookie);
    
    return this.http.get(
      `${this.API_URL}/family/test-auth`,
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      map(response => {
        console.log('AuthService: ✅ TESTE AUTH - Usuário autenticado:', response);
        return response;
      }),
      catchError(error => {
        console.error('AuthService: ❌ TESTE AUTH - Falha na autenticação:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Método de teste público para debugar criação de família
   */
  testCreateFamilyDirect(familyName: string): Observable<any> {
    console.log('AuthService: 🧪 TESTE DIRETO - Criando família:', familyName);
    console.log('AuthService: 🍪 Cookies disponíveis:', document.cookie);
    
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
        console.log('AuthService: ✅ TESTE - Família criada:', response);
        return response;
      }),
      catchError(error => {
        console.error('AuthService: ❌ TESTE - Erro:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Método de teste para verificar conectividade com o backend
   */
  testBackendConnection(): Observable<any> {
    console.log('AuthService: Testando conexão com backend...');
    return this.http.get(`${this.API_URL}/users/register`, { observe: 'response' }).pipe(
      map(response => {
        console.log('AuthService: Backend respondeu:', response.status);
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
   * @deprecated Use enterFamily() instead - este método faz a mesma coisa
   */
  validateFamilyCode(codeData: EnterFamilyRequest): Observable<EnterFamilyResponse> {
    return this.enterFamily(codeData);
  }

  /**
   * Registro completo com família - primeiro registra usuário, depois cria/entra na família
   */
  completeRegistrationWithFamily(userData: CompleteRegisterRequest): Observable<RegisterResponse> {
    this.loadingSubject.next(true);
    
    console.log('AuthService: Iniciando registro completo com família:', userData);

    // Desabilitado modo de desenvolvimento para usar backend real

    // Primeiro registra o usuário
    const registerData: RegisterRequest = {
      email_usuario: userData.email_usuario,
      senha_usuario: userData.senha_usuario,
      nome_usuario: userData.nome_usuario
    };

    return this.register(registerData).pipe(
      switchMap(registerResponse => {
        console.log('AuthService: ✅ Registro concluído com sucesso:', registerResponse);
        console.log('AuthService: 🔄 Iniciando login automático...');
        
        // Após registrar, faz login automático para obter autenticação
        const loginData: LoginRequest = {
          email: userData.email_usuario,
          password: userData.senha_usuario
        };

        return this.login(loginData).pipe(
          switchMap(loginResponse => {
            console.log('AuthService: ✅ Login concluído com sucesso:', loginResponse);
            console.log('AuthService: � Testando autenticação antes de criar família...');
            
            // Aguardar um pouco para garantir que o cookie seja definido
            console.log('AuthService: ⏱️ Aguardando cookie ser definido...');
            return new Observable(observer => {
              setTimeout(() => {
                observer.next(loginResponse);
                observer.complete();
              }, 1000); // Aguardar 1 segundo
            }).pipe(
              switchMap(() => {
                console.log('AuthService: 🔍 Testando autenticação após delay...');
                return this.testAuthenticationStatus();
              }),
              switchMap(authTest => {
                console.log('AuthService: ✅ Autenticação confirmada:', authTest);
                console.log('AuthService: �🔄 Processando família...');
                
                // Após confirmar autenticação, cria ou entra na família
                if (userData.family_option === 'create' && userData.family_name) {
                  console.log('AuthService: 🏠 Criando família:', userData.family_name);
                  return this.createFamily({ nome_familia: userData.family_name }).pipe(
                    map(familyResponse => {
                      console.log('AuthService: ✅ Família criada com sucesso:', familyResponse);
                      return registerResponse; // Retorna a resposta original do registro
                    })
                  );
                } else if (userData.family_option === 'join' && userData.family_code) {
                  console.log('AuthService: 🔗 Entrando na família com código:', userData.family_code);
                  return this.enterFamily({ codigo_familia_input: userData.family_code }).pipe(
                    map(familyResponse => {
                      console.log('AuthService: ✅ Entrada na família realizada:', familyResponse);
                      return registerResponse; // Retorna a resposta original do registro
                    })
                  );
                }
                console.error('AuthService: ❌ Opção de família inválida:', userData.family_option);
                return throwError(() => ({ mensagem: 'Opção de família inválida' }));
              }),
              catchError(authError => {
                console.error('AuthService: ❌ Falha na autenticação após login:', authError);
                return throwError(() => ({ mensagem: 'Falha na autenticação. Tente fazer login novamente.' }));
              })
            );
          })
        );
      }),
      finalize(() => {
        console.log('AuthService: 🏁 Finalizando processo de registro completo');
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('AuthService: ❌ Erro no registro completo:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Registro completo otimizado - foco na criação correta do usuário e família
   */  
  completeRegistrationWithFamilySimple(userData: CompleteRegisterRequest): Observable<RegisterResponse> {
    this.loadingSubject.next(true);
    
    console.log('AuthService: 🚀 INICIANDO PROCESSO COMPLETO:', userData);

    // 1. Registrar usuário
    const registerData: RegisterRequest = {
      email_usuario: userData.email_usuario,
      senha_usuario: userData.senha_usuario,
      nome_usuario: userData.nome_usuario
    };

    return this.register(registerData).pipe(
      switchMap(registerResponse => {
        console.log('AuthService: ✅ USUÁRIO CRIADO NO BANCO:', registerResponse);
        
        // 2. Fazer login para obter autenticação
        const loginData: LoginRequest = {
          email: userData.email_usuario,
          password: userData.senha_usuario
        };

        return this.login(loginData).pipe(
          switchMap(loginResponse => {
            console.log('AuthService: ✅ LOGIN REALIZADO:', loginResponse);
            console.log('AuthService: 🍪 Cookies definidos:', document.cookie);
            
            // 3. Se deve criar família, fazer isso agora que está autenticado
            if (userData.family_option === 'create' && userData.family_name) {
              console.log('AuthService: 🏗️ CRIANDO FAMÍLIA:', userData.family_name);
              
              // Primeiro, testar se a autenticação está funcionando
              return this.testAuth().pipe(
                switchMap(authTest => {
                  console.log('AuthService: ✅ TESTE DE AUTH PASSOU:', authTest);
                  
                  // Agora criar a família com dados confirmados
                  console.log('AuthService: 🔧 FAZENDO REQUISIÇÃO PARA CRIAR FAMÍLIA...');
                  console.log('AuthService: 🔗 URL:', `${this.API_URL}${this.endpoints.createFamily}`);
                  console.log('AuthService: 📤 Dados enviados:', { nome_familia: userData.family_name });
                  console.log('AuthService: 🍪 Cookies atuais:', document.cookie);
              
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
                  console.log('AuthService: 📥 RESPOSTA COMPLETA DO BACKEND:', fullResponse);
                  const familyResponse = fullResponse.body as CreateFamilyResponse;
                  console.log('AuthService: ✅ FAMÍLIA CRIADA E USUÁRIO ADICIONADO COMO ADMIN:', familyResponse);
                  return registerResponse;
                }),
                catchError(familyError => {
                  console.error('AuthService: ❌ ERRO DETALHADO NA CRIAÇÃO DE FAMÍLIA:');
                  console.error('AuthService: 🔍 Erro completo:', familyError);
                  console.error('AuthService: 📊 Status HTTP:', familyError.status);
                  console.error('AuthService: 📝 Corpo da resposta:', familyError.error);
                  console.error('AuthService: 🌐 URL que falhou:', familyError.url);
                  console.error('AuthService: 📋 Headers de resposta:', familyError.headers);
                  console.error('AuthService: 💬 Mensagem:', familyError.message);
                  
                  // Log específico para erro 500
                  if (familyError.status === 500) {
                    console.error('AuthService: 🚨 ERRO 500 - ERRO INTERNO DO SERVIDOR NO BACKEND!');
                    console.error('AuthService: 🔍 Possíveis causas:');
                    console.error('AuthService: - Erro no banco de dados');
                    console.error('AuthService: - Erro na transação do Prisma');
                    console.error('AuthService: - Erro na validação do middleware authToken');
                    console.error('AuthService: - req.usuario pode estar undefined');
                  }
                  
                  // Usuário foi criado com sucesso, família falhou
                  console.warn('AuthService: ⚠️ USUÁRIO CRIADO, MAS FAMÍLIA FALHOU');
                  return throwError(() => ({
                    mensagem: `Usuário criado, mas erro na família: ${familyError.error?.mensagem || 'Erro interno do servidor'}`
                  }));
                })
              );
                })
              );
              
            } else if (userData.family_option === 'join' && userData.family_code) {
              console.log('AuthService: 🔗 ENTRANDO NA FAMÍLIA:', userData.family_code);
              
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
                  console.log('AuthService: ✅ ENTROU NA FAMÍLIA:', familyResponse);
                  return registerResponse;
                }),
                catchError(familyError => {
                  console.error('AuthService: ❌ ERRO AO ENTRAR NA FAMÍLIA:', familyError);
                  return throwError(() => ({
                    mensagem: `Usuário criado, mas erro ao entrar na família: ${familyError.error?.mensagem || 'Erro desconhecido'}`
                  }));
                })
              );
              
            } else {
              console.log('AuthService: ✅ REGISTRO CONCLUÍDO SEM FAMÍLIA');
              return of(registerResponse);
            }
          })
        );
      }),
      finalize(() => {
        console.log('AuthService: 🏁 PROCESSO FINALIZADO');
        this.loadingSubject.next(false);
      }),
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
      
      if (error.error instanceof ErrorEvent) {
        // Erro do lado cliente
        console.log('AuthService: Erro do lado cliente');
        errorMessage = `Erro de rede: ${error.error.message || 'Problema de conexão'}`;
      } else if (error.message?.includes('Timeout')) {
        // Erro de timeout
        console.log('AuthService: Timeout - possível problema de CORS');
        errorMessage = 'Timeout: Verifique se o backend está rodando na porta 8080';
      } else {
        // Erro do backend
        console.log('AuthService: Erro do backend');
        if (error.error && error.error.mensagem) {
          errorMessage = error.error.mensagem;
        } else {
          switch (error.status) {
            case 0:
              errorMessage = 'Erro de conexão: Verifique se o backend está rodando na porta 8080';
              break;
            case 400:
              errorMessage = 'Dados inválidos ou incompletos';
              break;
            case 401:
              errorMessage = 'Email ou senha inválidos';
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
      // Erro não-HTTP (pode ser um objeto de erro personalizado)
      console.log('AuthService: Erro não-HTTP:', typeof error, error);
      
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
    
    console.log('AuthService: Mensagem de erro final:', errorMessage);
    
    const errorResponse: ErrorResponse = {
      mensagem: errorMessage
    };
    
    return throwError(() => errorResponse);
  }
}