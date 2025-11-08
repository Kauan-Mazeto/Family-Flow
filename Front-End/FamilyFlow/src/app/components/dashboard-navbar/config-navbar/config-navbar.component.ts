import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { environment } from '../../../../environments/environment';

interface UserData {
  id: number;
  name?: string;
  nome?: string;
  email: string;
  is_admin: boolean;
}

interface FamilyData {
  id: number;
  nome: string;
  codigo: string;
  role: string;
}

interface FamilyMember {
  id: number;
  name?: string;
  nome?: string;
  email: string;
  is_admin: boolean;
  role?: string;
}

@Component({
  selector: 'app-config-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-navbar.component.html',
  styleUrls: ['./config-navbar.component.scss']
})
export class ConfigNavbarComponent implements OnInit {

  // Usando injeção moderna do Angular 14+
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private authService = inject(AuthService);

  userData: UserData | null = null;
  familyData: FamilyData | null = null;
  familyMembers: FamilyMember[] = [];
  isLoading: boolean = true;
  isLoadingMembers: boolean = false;
  isPromotingMember: boolean = false;
  showMembersSection: boolean = false;
  familyCodeArray: string[] = [];
  isLeavingFamily: boolean = false;
  isDeletingAccount: boolean = false;
  private requestsCompleted = 0;

  ngOnInit() {
    this.loadUserData();
    this.loadFamilyData();
  }

  loadUserData() {
    // Usando o endpoint de verificação que retorna dados do usuário
    this.http.post<{usuario: UserData}>(`${environment.apiUrl}/users/verify`, {}, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.userData = response.usuario;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Erro ao carregar dados do usuário:', error);
        this.checkLoadingComplete();
      }
    });
  }

  loadFamilyData() {
    this.http.get<{familia: FamilyData}>(`${environment.apiUrl}/family/info`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.familyData = response.familia;
        if (this.familyData) {
          this.familyCodeArray = this.familyData.codigo.split('');
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Erro ao carregar dados da família:', error);
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete() {
    this.requestsCompleted++;
    // Verifica se ambas as requisições foram completadas (sucesso ou erro)
    if (this.requestsCompleted >= 2) {
      this.isLoading = false;
      this.cdr.detectChanges();
      
      // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        // Carregar membros da família se for admin
        if (this.isUserAdmin) {
          console.log('Usuário é admin, carregando membros da família...');
          this.showMembersSection = true;
          this.loadFamilyMembers();
        } else {
          console.log('Usuário não é admin, role:', this.familyData?.role);
          this.showMembersSection = false;
        }
        this.cdr.detectChanges();
      }, 0);
    }
  }

  // Método helper para verificar se o usuário é admin
  get isUserAdmin(): boolean {
    return this.familyData?.role === 'ADMIN';
  }

  // Método helper para obter o texto do role
  get userRoleText(): string {
    return this.isUserAdmin ? 'Administrador' : 'Membro';
  }

  // Método para obter apenas membros não-administradores (excluindo o próprio usuário)
  getNonAdminMembers(): FamilyMember[] {
    return this.familyMembers.filter(member => {
      const isNotAdmin = !member.is_admin && member.role !== 'ADMIN';
      const isNotCurrentUser = member.id !== this.userData?.id;
      return isNotAdmin && isNotCurrentUser;
    });
  }

  // Função para sair da família
  leaveFamily() {
    if (this.isLeavingFamily) return;
    
    const confirmLeave = confirm('Tem certeza que deseja sair da família? Você precisará de um novo código para entrar novamente.');
    if (!confirmLeave) return;

    this.isLeavingFamily = true;

    this.http.post(`${environment.apiUrl}/family/leave`, {}, {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        // Redirecionar diretamente para página de login para reautenticar
        this.router.navigate(['/users/login']);
      },
      error: (error) => {
        // Log do erro mas redirecionar por segurança
        console.error('Erro ao sair da família:', error);
        
        // Redirecionar mesmo com erro
        if (error.status === 401) {
          this.router.navigate(['/users/login']);
        } else {
          // Para outros erros, pode manter o usuário na página
          console.error('Erro específico:', error.error?.mensagem || 'Erro desconhecido');
        }
      },
      complete: () => {
        this.isLeavingFamily = false;
      }
    });
  }

  // Novos métodos para as ações rápidas
  copyFamilyCode() {
    if (this.familyData?.codigo) {
      navigator.clipboard.writeText(this.familyData.codigo).then(() => {
        // Código copiado silenciosamente
        console.log('Código copiado para a área de transferência');
      }).catch(err => {
        console.error('Erro ao copiar código:', err);
      });
    }
  }

  refreshData() {
    this.isLoading = true;
    this.requestsCompleted = 0;
    this.familyMembers = [];
    this.showMembersSection = false;
    this.loadUserData();
    this.loadFamilyData();
  }

  showAbout() {
    alert(`Family Flow v1.0.0\n\nUm sistema completo de gerenciamento familiar.\n\nDesenvolvido com Angular e Node.js`);
  }

  showHelp() {
    alert(`Ajuda do Family Flow\n\n• Use a aba Tarefas para gerenciar tarefas diárias e pontuais\n• Visualize o progresso no Gráfico de Tarefas\n• Compartilhe o código da família para adicionar novos membros\n• Administradores podem criar tarefas diárias para toda a família`);
  }

  // Método para carregar membros da família
  loadFamilyMembers() {
    if (!this.isUserAdmin) {
      console.log('Não é admin, não carregando membros');
      return;
    }
    
    console.log('Carregando membros da família...');
    this.isLoadingMembers = true;
    
    this.http.get<{membros: FamilyMember[]} | FamilyMember[]>(`${environment.apiUrl}${environment.endpoints.familyMembers}`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        // Verificar se a resposta tem a propriedade 'membros' ou se é diretamente o array
        if (response && typeof response === 'object' && 'membros' in response) {
          this.familyMembers = response.membros || [];
        } else if (Array.isArray(response)) {
          this.familyMembers = response;
        } else {
          this.familyMembers = [];
        }
        
        console.log('Resposta da API:', response);
        console.log('Membros da família carregados:', this.familyMembers);
        console.log('Quantidade de membros:', this.familyMembers.length);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar membros da família:', error);
        console.error('Status do erro:', error.status);
        console.error('Corpo do erro:', error.error);
        this.familyMembers = [];
        
        let errorMessage = 'Erro ao carregar membros da família.';
        if (error.status === 401) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.status === 403) {
          errorMessage = 'Você não tem permissão para ver os membros da família.';
        } else if (error.status === 404) {
          errorMessage = 'Endpoint não encontrado. Verifique se o backend está atualizado.';
        }
        
        // Log do erro
        console.error('Erro detalhado:', errorMessage, 'Status:', error.status);
      },
      complete: () => {
        this.isLoadingMembers = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método para promover membro a administrador
  promoteToAdmin(member: FamilyMember) {
    if (this.isPromotingMember || !this.isUserAdmin) return;

    const confirmPromote = confirm(
      `Tem certeza que deseja tornar ${member.name || member.nome || member.email} um administrador?\n\n` +
      'Administradores podem:\n' +
      '• Criar e gerenciar tarefas para toda a família\n' +
      '• Promover outros membros a administrador\n' +
      '• Acessar configurações avançadas da família'
    );

    if (!confirmPromote) return;

    this.isPromotingMember = true;



    this.http.post(`${environment.apiUrl}${environment.endpoints.promoteAdmin}`, {
      userId: member.id
    }, {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        console.log('Promoção bem-sucedida:', response);
        
        // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          // Recarregar a lista de membros da família para ter dados atualizados
          this.loadFamilyMembers();
        }, 0);
      },
      error: (error) => {
        console.error('Erro ao promover usuário:', error);
        
        let errorMessage = 'Erro ao promover membro a administrador.';
        
        if (error.error?.mensagem) {
          errorMessage = error.error.mensagem;
        } else if (error.status === 401) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.status === 403) {
          errorMessage = 'Você não tem permissão para promover membros.';
        } else if (error.status === 404) {
          errorMessage = 'Usuário não encontrado na família.';
        } else if (error.status === 400) {
          errorMessage = 'Dados inválidos ou usuário já é administrador.';
        }
        
        console.error('Erro na promoção:', errorMessage);
      },
      complete: () => {
        // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.isPromotingMember = false;
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Método para apagar conta do usuário
  deleteAccount() {
    if (this.isDeletingAccount) return;

    const confirmDelete = confirm(
      'ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n' +
      'Ao apagar sua conta:\n' +
      '• Todos os seus dados serão permanentemente excluídos\n' +
      '• Você será removido da sua família\n' +
      '• Suas tarefas serão perdidas\n' +
      '• Não será possível recuperar essas informações\n\n' +
      'Tem CERTEZA ABSOLUTA que deseja apagar sua conta?'
    );

    if (!confirmDelete) return;

    // Segunda confirmação para operação crítica
    const finalConfirm = confirm(
      'ÚLTIMA CONFIRMAÇÃO!\n\n' +
      'Digite "APAGAR" (em maiúsculas) na próxima mensagem para confirmar que deseja apagar permanentemente sua conta.'
    );

    if (!finalConfirm) return;

    const userInput = prompt('Digite "APAGAR" para confirmar:');
    if (userInput !== 'APAGAR') {
      // Operação cancelada silenciosamente
      return;
    }

    this.isDeletingAccount = true;

    this.authService.deleteAccount().subscribe({
      next: (response) => {
        // Redirecionar diretamente após sucesso
        this.router.navigate(['/initial']);
      },
      error: (error) => {
        // Log do erro mas redirecionar por segurança
        console.error('Erro ao apagar conta:', error);
        this.router.navigate(['/initial']);
      },
      complete: () => {
        this.isDeletingAccount = false;
      }
    });
  }
}