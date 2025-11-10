import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CreateTaskRequest {
  desc_task: string;
  name_task: string;
  member_task: string;
  priority_task: string;
  status_task: string; // Sempre 'PENDENTE' - gerenciado automaticamente pelo backend
  type_task: string;
}

interface TaskApiResponse {
  mensagem: string;
  task: Task;
}

interface Task {
  id: number;
  title: string;
  description: string;
  member_name: string;
  member_id: number;
  priority: string;
  status: string;
  type_task: string;
  completed_at?: string;
  scheduled_date?: string;
  date_end?: string;
  _loading?: boolean;
}
@Component({
  selector: 'app-task-navbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-navbar.component.html',
  styleUrls: ['./task-navbar.component.scss']
})

export class TaskNavbarComponent implements OnInit, AfterViewInit {
  
  @ViewChild('taskChart') taskChartRef!: ElementRef<HTMLCanvasElement>;
  
  activeTab: string = 'diarias';
  dailyTasks: Task[] = [];
  punctualTasks: Task[] = [];
  showCreateTaskModal: boolean = false;
  showCreatePunctualTaskModal: boolean = false;
  taskForm: FormGroup;
  punctualTaskForm: FormGroup;
  familyMembers: FamilyMember[] = [];
  isLoading: boolean = false;
  isAdmin: boolean = false;
  currentUserId: number = 0;
  
  // Chart instance
  private chart: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.taskForm = this.fb.group({
      description: [''],
      name: ['', Validators.required],
      member: [''],
      priority: ['MEDIA']
    });

    this.punctualTaskForm = this.fb.group({
      description: [''],
      name: ['', Validators.required],
      priority: ['MEDIA'],
      scheduled_date: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.initializeComponent();
  }

  ngAfterViewInit() {
    // O gráfico será inicializado quando a aba for ativada
  }

  private initializeComponent() {
    // Fazer as verificações de forma sequencial
    this.checkUserRole();
    this.loadFamilyMembers();
    
    // Aguardar um pouco antes de carregar as tarefas para garantir que a autenticação esteja pronta
    setTimeout(() => {
      this.loadDailyTasks();
    }, 500);
  }

  checkUserRole() {
    this.http.get<{familia: any}>(`${environment.apiUrl}/family/info`, {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        this.isAdmin = response.familia?.role === 'ADMIN';
        this.currentUserId = response.familia?.user_id || 0;
        console.log('👤 ID do usuário atual:', this.currentUserId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(' Erro ao verificar papel do usuário na família:', error);
        
        // Retry após 1 segundo em caso de erro
        setTimeout(() => {
          this.checkUserRole();
        }, 1000);
      }
    });
  }

  onTabClick(tabType: string) {
    this.activeTab = tabType;
    
    // Carregar dados conforme a aba selecionada
    if (tabType === 'diarias') {
      this.loadDailyTasks();
    } else if (tabType === 'pontuais') {
      this.loadPunctualTasks();
    } else if (tabType === 'grafico') {
      // Aguardar o DOM ser atualizado antes de inicializar o gráfico
      setTimeout(() => {
        this.initChart();
      }, 100);
    }
  }

  get isTabActive() {
    return {
      diarias: this.activeTab === 'diarias',
      pontuais: this.activeTab === 'pontuais',
      grafico: this.activeTab === 'grafico'
    };
  }

  openCreateTaskModal() {
    this.showCreateTaskModal = true;
  }

  closeCreateTaskModal() {
    this.showCreateTaskModal = false;
    this.taskForm.reset({
      priority: 'MEDIA',
      member: this.familyMembers.length > 0 ? this.familyMembers[0].id.toString() : ''
    });
  }

  selectPredefinedTask(taskName: string, taskDescription: string) {
    this.taskForm.patchValue({
      name: taskName,
      description: taskDescription
    });
  }

  openCreatePunctualTaskModal() {
    this.showCreatePunctualTaskModal = true;
  }

  closeCreatePunctualTaskModal() {
    this.showCreatePunctualTaskModal = false;
    this.punctualTaskForm.reset({
      priority: 'MEDIA'
    });
  }

  loadFamilyMembers() {
    this.http.get<{membros: FamilyMember[]}>(`${environment.apiUrl}/family/members`, {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        this.familyMembers = response.membros;
        
        // Define o primeiro membro como padrão no formulário
        if (this.familyMembers.length > 0) {
          this.taskForm.patchValue({
            member: this.familyMembers[0].id.toString()
          });
        }
      },
      error: (error) => {
        // Fallback para dados mock em caso de erro
        this.familyMembers = [];
      }
    });
  }

  loadDailyTasks() {
    console.log('🔄 Carregando tarefas diárias...');
    console.log('🔗 Endpoint:', `${environment.apiUrl}/tasks/daily/family`);
    
    this.http.get<{tasks: Task[]}>(`${environment.apiUrl}/tasks/daily/family`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        console.log('📋 Resposta do servidor (tarefas diárias):', response);
        this.dailyTasks = response.tasks || [];
        console.log('📋 Tarefas diárias carregadas:', this.dailyTasks.length);
        
        // Log detalhado das tarefas
        this.dailyTasks.forEach((task, index) => {
          console.log(`  ${index + 1}. Tarefa "${task.title}":`, {
            id: task.id,
            member_id: task.member_id,
            member_name: task.member_name,
            status: task.status,
            priority: task.priority
          });
        });
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas diárias:', error);
        
        // Se for erro 401 (não autenticado), tentar novamente em 1 segundo
        if (error.status === 401) {
          setTimeout(() => {
            this.loadDailyTasks();
          }, 1000);
        } else {
          this.dailyTasks = [];
          this.cdr.detectChanges();
        }
      }
    });
  }

  loadPunctualTasks() {
    console.log('🔄 Carregando tarefas pontuais...');
    console.log('🔗 Endpoint:', `${environment.apiUrl}/tasks/punctual/user`);
    this.isLoading = true;
    this.http.get<{tasks: Task[]}>(`${environment.apiUrl}/tasks/punctual/user`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        console.log('📋 Resposta do servidor (tarefas pontuais):', response);
        this.punctualTasks = response.tasks || [];
        console.log('📋 Tarefas pontuais carregadas:', this.punctualTasks.length);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas pontuais:', error);
        this.isLoading = false;
        // Se for erro 401 (não autenticado), tentar novamente em 1 segundo
        if (error.status === 401) {
          setTimeout(() => {
            this.loadPunctualTasks();
          }, 1000);
        } else {
          this.punctualTasks = [];
          this.cdr.detectChanges();
        }
      }
    });
  }

  onSubmitTask() {
    const nameControl = this.taskForm.get('name');
    if (nameControl && nameControl.valid && nameControl.value?.trim()) {
      this.isLoading = true;
      
      const formData = this.taskForm.value;
      const selectedMember = this.familyMembers.find(m => m.id === parseInt(formData.member));
      
      // Se não selecionou membro, usar o primeiro da lista (ou o usuário logado)
      let memberToAssign = selectedMember;
      if (!memberToAssign && this.familyMembers.length > 0) {
        memberToAssign = this.familyMembers[0]; // Usa o primeiro membro da lista
      }

      const taskData: CreateTaskRequest = {
        desc_task: formData.description || 'Sem descrição',
        name_task: formData.name,
        member_task: memberToAssign?.name || 'Admin',
        priority_task: formData.priority,
        status_task: 'PENDENTE',
        type_task: 'diaria'
      };
      
      // Enviar dados para o backend
      this.http.post<{task: any}>(`${environment.apiUrl}/tasks/create/daily`, taskData, {
        withCredentials: true
      }).subscribe({
        next: (response) => {
          // Adicionar a nova tarefa à lista usando os dados retornados do backend
          const newTask: Task = {
            id: response.task.id,
            title: response.task.title,
            description: response.task.description,
            member_name: response.task.member_name,
            member_id: response.task.member_id,
            priority: response.task.priority,
            status: response.task.status,
            type_task: response.task.type_task
          };
          
          this.dailyTasks.push(newTask);
          
          // Recarregar a lista de tarefas para mostrar todas as tarefas da família
          this.loadDailyTasks();
          
          //detecção de mudanças
          this.cdr.detectChanges();
          
          // Limpar formulário
          this.taskForm.reset({
            description: '',
            name: '',
            member: '',
            priority: 'MEDIA'
          });
          
          this.closeCreateTaskModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao criar tarefa:', error);
          this.isLoading = false;
        }
      });
    } else {
      nameControl?.markAsTouched();
    }
  }

  onSubmitPunctualTask() {
    const nameControl = this.punctualTaskForm.get('name');
    const dateControl = this.punctualTaskForm.get('scheduled_date');
    
    console.log('🚀 Iniciando criação de tarefa pontual...');
    console.log('📝 Estado do formulário:', this.punctualTaskForm.value);
    console.log('✅ Nome válido:', nameControl?.valid);
    console.log('📅 Data válida:', dateControl?.valid);
    
    if (nameControl && nameControl.valid && nameControl.value?.trim() && 
        dateControl && dateControl.valid && dateControl.value) {
      this.isLoading = true;
      
      const formData = this.punctualTaskForm.value;
      
      const taskData = {
        desc_task: formData.description || '',
        name_task: formData.name,
        priority_task: formData.priority,
        scheduled_date: formData.scheduled_date
      };
      
      console.log('📤 Dados que serão enviados:', taskData);
      console.log('🔗 Endpoint:', `${environment.apiUrl}/tasks/create/punctual`);
      
      // Enviar dados para o backend
      this.http.post<{task: any}>(`${environment.apiUrl}/tasks/create/punctual`, taskData, {
        withCredentials: true
      }).subscribe({
        next: (response) => {
          console.log('✅ Tarefa pontual criada:', response.task);
          
          // Adicionar a nova tarefa à lista
          const newTask: Task = {
            id: response.task.id,
            title: response.task.title,
            description: response.task.description,
            member_name: response.task.member_name,
            member_id: response.task.member_id,
            priority: response.task.priority,
            status: response.task.status,
            type_task: response.task.type_task,
            scheduled_date: response.task.date_end
          };
          
          this.punctualTasks.push(newTask);
          
          // Recarregar a lista de tarefas pontuais
          this.loadPunctualTasks();
          
          // Reset do formulário
          this.punctualTaskForm.reset({
            description: '',
            name: '',
            priority: 'MEDIA',
            scheduled_date: ''
          });
          
          this.closeCreatePunctualTaskModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erro ao criar tarefa pontual:', error);
          console.error('❌ Status do erro:', error.status);
          console.error('❌ Mensagem do erro:', error.error);
          console.error('❌ URL que falhou:', error.url);
          this.isLoading = false;
        }
      });
    } else {
      nameControl?.markAsTouched();
      dateControl?.markAsTouched();
    }
  }

  // Métodos para o sistema Kanban
  getAssignedTasks(): Task[] {
    return this.dailyTasks.filter(task => {
      const status = (task.status || '').toUpperCase();
      const type = (task.type_task || '').toLowerCase();
      return (status === 'PENDENTE' || status === 'EM_ANDAMENTO') && type === 'diaria';
    });
  }

  getCompletedTasks(): Task[] {
    return this.dailyTasks.filter(task => {
      const status = (task.status || '').toUpperCase();
      const type = (task.type_task || '').toLowerCase();
      return status === 'CONCLUIDA' && type === 'diaria';
    });
  }

  // Métodos para tarefas pontuais
  getAssignedPunctualTasks(): Task[] {
    return this.punctualTasks.filter(task => task.status === 'PENDENTE' || task.status === 'EM_ANDAMENTO');
  }

  getCompletedPunctualTasks(): Task[] {
    return this.punctualTasks.filter(task => task.status === 'CONCLUIDA');
  }

  onTaskComplete(task: Task) {
  console.log('🎯 Completando tarefa:', task.title);
  console.log('🎯 ID da tarefa:', task.id);
  console.log('🎯 Status atual:', task.status);
  console.log('🎯 URL da requisição:', `${environment.apiUrl}/tasks/conclude/${task.id}`);
    
    // Verificar se o usuário pode editar esta tarefa
    if (!this.canEditTask(task)) {
      alert('Apenas o responsável pela tarefa pode marcá-la como concluída.');
      return;
    }
    
    console.log('🎯 onTaskComplete called for:', task.id, task.title);

      // Marcar como loading para bloquear UI
      task._loading = true;
      this.cdr.detectChanges();

      // Otimisticamente atualizar UI para concluída
      const previousStatus = task.status;
      const previousCompletedAt = task.completed_at;
      task.status = 'CONCLUIDA';
      task.completed_at = new Date().toISOString();
      this.cdr.detectChanges();

      this.http.patch<TaskApiResponse>(`${environment.apiUrl}/tasks/conclude/${task.id}`, { status_task: 'CONCLUIDA' }, {
        withCredentials: true
      }).subscribe({
        next: (response) => {
          console.log('✅ Tarefa marcada como concluída no backend:', task.id);
          task._loading = false;
          // Atualizar com valores do backend se fornecidos
          if (response && response.task) {
            const idx = this.dailyTasks.findIndex(t => t.id === task.id);
            if (idx !== -1) {
              this.dailyTasks[idx] = { ...this.dailyTasks[idx], ...response.task } as Task;
            }
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Erro ao completar tarefa:', error);
          console.error('❌ Status do erro:', error.status);
          console.error('❌ Mensagem do erro:', error.error);
          console.error('❌ URL da requisição:', error.url);
          
          // Reverter mudanças locais
          task.status = previousStatus;
          task.completed_at = previousCompletedAt;
          task._loading = false;
          this.cdr.detectChanges();
          
          let errorMessage = 'Erro ao marcar tarefa como concluída. Tente novamente.';
          if (error.status === 0) {
            errorMessage = 'Servidor não está respondendo. Verifique se o backend está rodando.';
          } else if (error.status === 500) {
            errorMessage = 'Erro interno do servidor. Verifique os logs do backend.';
          } else if (error.error?.mensagem) {
            errorMessage = error.error.mensagem;
          }
          
          alert(errorMessage);
        }
      });
  }

  onTaskUncomplete(task: Task) {
    console.log('🔄 Desmarcando tarefa como concluída:', task.title);
    
    // Verificar se o usuário pode editar esta tarefa
    if (!this.canEditTask(task)) {
      alert('Apenas o responsável pela tarefa pode desmarcá-la.');
      return;
    }
    
    console.log('🔄 onTaskUncomplete called for:', task.id, task.title);

      task._loading = true;
      this.cdr.detectChanges();

      const previousStatus = task.status;
      const previousCompletedAt = task.completed_at;
      task.status = 'PENDENTE';
      task.completed_at = undefined;
      this.cdr.detectChanges();

      this.http.patch<TaskApiResponse>(`${environment.apiUrl}/tasks/${task.id}/uncomplete`, {}, {
        withCredentials: true
      }).subscribe({
        next: (response) => {
          console.log('✅ Tarefa desmarcada no backend:', task.id);
          task._loading = false;
          if (response && response.task) {
            const idx = this.dailyTasks.findIndex(t => t.id === task.id);
            if (idx !== -1) {
              this.dailyTasks[idx] = { ...this.dailyTasks[idx], ...response.task } as Task;
            }
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Erro ao desmarcar tarefa:', error);
          console.error('❌ Status do erro:', error.status);
          console.error('❌ Mensagem do erro:', error.error);
          console.error('❌ URL da requisição:', error.url);
          
          // Reverter
          task.status = previousStatus;
          task.completed_at = previousCompletedAt;
          task._loading = false;
          this.cdr.detectChanges();
          
          let errorMessage = 'Erro ao desmarcar tarefa. Tente novamente.';
          if (error.status === 0) {
            errorMessage = 'Servidor não está respondendo. Verifique se o backend está rodando.';
          } else if (error.status === 500) {
            errorMessage = 'Erro interno do servidor. Verifique os logs do backend.';
          } else if (error.error?.mensagem) {
            errorMessage = error.error.mensagem;
          }
          
          alert(errorMessage);
        }
      });
  }

  onDeleteTask(task: Task) {
    if (confirm(`Tem certeza que deseja deletar a tarefa "${task.title}"?`)) {
      console.log('🗑️ Deletando tarefa:', task.title);
      
      let deleteRequest;
      if (task.type_task === 'diaria') {
        deleteRequest = this.http.delete<TaskApiResponse>(`${environment.apiUrl}/tasks/diaries/delete/${task.id}`, {
          withCredentials: true
        });
      } else if (task.type_task === 'pontual') {
        deleteRequest = this.http.delete<TaskApiResponse>(`${environment.apiUrl}/tasks/ponctual/delete?id=${task.id}`, {
          withCredentials: true
        });
      } else {
        alert('Tipo de tarefa desconhecido. Não foi possível deletar.');
        return;
      }

      deleteRequest.subscribe({
        next: (response) => {
          console.log('✅ Tarefa deletada no backend');
          
          // Remover localmente das tarefas diárias
          this.dailyTasks = this.dailyTasks.filter(t => t.id !== task.id);
          
          // Remover localmente das tarefas pontuais
          this.punctualTasks = this.punctualTasks.filter(t => t.id !== task.id);
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Erro ao deletar tarefa:', error);
          // Recarregar tarefas em caso de erro
          if (this.isTabActive.diarias) {
            this.loadDailyTasks();
          } else if (this.isTabActive.pontuais) {
            this.loadPunctualTasks();
          }
        }
      });
    }
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: {[key: string]: string} = {
      'BAIXA': 'Baixa',
      'MEDIA': 'Média', 
      'ALTA': 'Alta'
    };
    return priorityMap[priority] || priority;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canEditTask(task: Task): boolean {
    // Usuário pode editar se é o responsável pela tarefa
    console.log('🔍 Verificando permissão para editar tarefa:');
    console.log('  - ID da tarefa:', task.id, '- Título:', task.title);
    console.log('  - member_id da tarefa:', task.member_id);
    console.log('  - currentUserId:', this.currentUserId);
    console.log('  - Pode editar:', task.member_id === this.currentUserId);
    
    return task.member_id === this.currentUserId;
  }

  testClick(task: Task) {
    console.log('🖱️ TESTE: Click no checkbox da tarefa:', task.id, task.title);
    console.log('🖱️ TESTE: Pode editar?', this.canEditTask(task));
    console.log('🖱️ TESTE: Loading?', task._loading);
    console.log('🖱️ TESTE: Disabled?', !this.canEditTask(task) || task._loading);
  }

  formatScheduledDate(dateString: string): string {
    if (!dateString) return 'Sem data';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Métodos para o gráfico
  initChart() {
    if (this.taskChartRef && this.taskChartRef.nativeElement) {
      this.loadChartLibrary().then(() => {
        this.createChart();
      });
    }
  }

  private loadChartLibrary(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof (window as any).Chart !== 'undefined') {
        resolve((window as any).Chart);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
          resolve((window as any).Chart);
        };
        document.head.appendChild(script);
      }
    });
  }

  private createChart() {
    const ctx = this.taskChartRef.nativeElement.getContext('2d');
    const Chart = (window as any).Chart;

    if (this.chart) {
      this.chart.destroy();
    }

    const data = this.getChartData();
    
    // Se não há dados, não criar gráfico
    if (data.values.every(val => val === 0)) {
      return;
    }
    
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.colors,
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverBorderWidth: 4,
          hoverBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Usaremos nossa própria legenda
          },
          title: {
            display: true,
            text: 'Tarefas Concluídas por Membro',
            font: {
              size: 18,
              weight: 'bold'
            },
            color: '#d36d1a',
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} tarefas (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 1000
        }
      }
    });
  }

  private getChartData() {
    const memberTaskCounts = this.familyMembers.map((member, index) => ({
      name: member.name,
      count: this.getCompletedTasksCount(member.id),
      color: this.getChartColor(index)
    }));

    return {
      labels: memberTaskCounts.map(m => m.name),
      values: memberTaskCounts.map(m => m.count),
      colors: memberTaskCounts.map(m => m.color)
    };
  }

  getCompletedTasksCount(memberId: number): number {
    return this.dailyTasks.filter(task => 
      task.member_id === memberId && task.status === 'CONCLUIDA'
    ).length;
  }

  getChartColor(index: number): string {
    // Cores do sistema: laranja navbar, azul kanban, verde kanban
    const colors = [
      '#d36d1a', // Laranja navbar
      '#007bff', // Azul kanban
      '#28a745', // Verde kanban
      '#ffc107', // Amarelo (complementar)
      '#6f42c1', // Roxo (complementar)
      '#dc3545', // Vermelho (complementar)
      '#17a2b8', // Ciano (complementar)
      '#fd7e14'  // Laranja claro (complementar)
    ];
    return colors[index % colors.length];
  }

  getCompletedDailyTasks(): Task[] {
    return this.dailyTasks.filter(task => task.status === 'CONCLUIDA');
  }

  getCompletionRate(): number {
    if (this.dailyTasks.length === 0) return 0;
    const completed = this.getCompletedDailyTasks().length;
    return Math.round((completed / this.dailyTasks.length) * 100);
  }

}
