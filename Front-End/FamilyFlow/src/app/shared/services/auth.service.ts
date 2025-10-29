import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  User, 
  LoginRequest, 
  RegisterRequest,
  LoginResponse, 
  RegisterResponse,
  UserMeResponse,
  ErrorResponse
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
    console.log('AuthService: Fazendo login para:', credentials.email);
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
        console.log('AuthService: Resposta recebida:', response);
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
   * Tratamento de erros HTTP baseado nas suas respostas de erro
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    console.error('AuthService: Erro HTTP capturado:', error);
    console.error('AuthService: Status do erro:', error.status);
    console.error('AuthService: Mensagem do erro:', error.message);
    console.error('AuthService: Body do erro:', error.error);
    
    let errorMessage = 'Erro desconhecido';
    
    if (error.error instanceof ErrorEvent) {
      // Erro do lado cliente
      console.log('AuthService: Erro do lado cliente');
      errorMessage = `Erro: ${error.error.message}`;
    } else if (error.message?.includes('Timeout')) {
      // Erro de timeout
      console.log('AuthService: Timeout - possível problema de CORS');
      errorMessage = 'Timeout: Verifique se o backend está rodando e tem CORS habilitado';
    } else {
      // Erro do backend - baseado nas suas respostas
      console.log('AuthService: Erro do backend');
      if (error.error && error.error.mensagem) {
        errorMessage = error.error.mensagem;
      } else {
        switch (error.status) {
          case 0:
            errorMessage = 'Erro de CORS ou conexão - O backend precisa habilitar CORS para localhost:4200';
            break;
          case 400:
            errorMessage = 'Dados obrigatórios não fornecidos';
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
            errorMessage = `Erro ${error.status}: ${error.message}`;
        }
      }
    }
    
    const errorResponse: ErrorResponse = {
      mensagem: errorMessage
    };
    
    return throwError(() => errorResponse);
  }
}