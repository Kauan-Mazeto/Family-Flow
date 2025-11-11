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
  status_task: string; // Sempre 'PENDENTE'
  type_task: string;
  date_start: string;
  date_end: string;
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
  date_start?: string;
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
    
    const rota = this.isAdmin
      ? `${environment.apiUrl}/tasks/daily/family`
      : `${environment.apiUrl}/tasks/daily/user`;
    this.http.get<{tasks: Task[]}>(rota, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.dailyTasks = response.tasks || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas diárias:', error);
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
    this.isLoading = true;
  this.http.get<{tasks: Task[]}>(`${environment.apiUrl}/tasks/ponctual/user`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.punctualTasks = response.tasks || [];
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

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const taskData: CreateTaskRequest = {
          desc_task: formData.description || 'Sem descrição',
          name_task: formData.name,
          member_task: String(memberToAssign?.id || this.currentUserId),
          priority_task: formData.priority,
          status_task: 'PENDENTE',
          type_task: 'diaria',
          date_start: dateStr,
          date_end: dateStr
      };
      
      // Só admin pode criar tarefa diária
      if (!this.isAdmin) {
        return;
      }
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
            type_task: response.task.type_task,
            date_start: response.task.date_start
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
    
    if (nameControl && nameControl.valid && nameControl.value?.trim() && 
        dateControl && dateControl.valid && dateControl.value) {
      this.isLoading = true;
      
      const formData = this.punctualTaskForm.value;
      
      // Validação de data
      let scheduledDate = formData.scheduled_date;
      if (!scheduledDate || isNaN(Date.parse(scheduledDate))) {
        alert('Selecione uma data válida para a tarefa pontual.');
        this.isLoading = false;
        return;
      }
      // Garante formato YYYY-MM-DD
      const dateObj = new Date(scheduledDate);
      const formattedDate = dateObj.toISOString().slice(0, 10);
      const taskData = {
        desc_task: formData.description || '',
        name_task: formData.name,
        priority_task: formData.priority,
        status_task: 'PENDENTE',
        type_task: 'pontual',
        date_start: formattedDate,
        date_end: formattedDate
      };
      
      // Enviar dados para o backend
  this.http.post<{task_info: any}>(`${environment.apiUrl}/tasks/create/ponctual`, taskData, {
          withCredentials: true
        }).subscribe({
          next: (response) => {
            // Adicionar a nova tarefa à lista
            const task = response.task_info;
            const newTask: Task = {
              id: task.id,
              title: task.title,
              description: task.description,
              member_name: task.member_name,
              member_id: task.member_id,
              priority: task.priority,
              status: task.status,
              type_task: task.type_task,
              scheduled_date: task.date_end
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
    if (this.isAdmin) {
      // Admin vê todas as tarefas diárias pendentes/em andamento
      return this.dailyTasks.filter(task => {
        const status = (task.status || '').toUpperCase();
        const type = (task.type_task || '').toLowerCase();
        return (status === 'PENDENTE' || status === 'EM_ANDAMENTO') && type === 'diaria';
      });
    } else {
      // Membro vê apenas as suas tarefas diárias pendentes/em andamento
      return this.dailyTasks.filter(task => {
        const status = (task.status || '').toUpperCase();
        const type = (task.type_task || '').toLowerCase();
        return (status === 'PENDENTE' || status === 'EM_ANDAMENTO') && type === 'diaria' && task.member_id === this.currentUserId;
      });
    }
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
    
    // Verificar se o usuário pode editar esta tarefa
    if (!this.canEditTask(task)) {
      return;
    }
    

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
        }
      });
  }

  onTaskUncomplete(task: Task) {
    
    // Verificar se o usuário pode editar esta tarefa
    if (!this.canEditTask(task)) {
      return;
    }

      task._loading = true;
      this.cdr.detectChanges();

      const previousStatus = task.status;
      const previousCompletedAt = task.completed_at;
      task.status = 'PENDENTE';
      task.completed_at = undefined;
      this.cdr.detectChanges();

      this.http.patch<TaskApiResponse>(`${environment.apiUrl}/tasks/conclude/${task.id}`, { status_task: 'PENDENTE' }, {
        withCredentials: true
      }).subscribe({
        next: (response) => {
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
        }
  });
  }

  onDeleteTask(task: Task) {
    if (confirm(`Tem certeza que deseja deletar a tarefa "${task.title}"?`)) {
      
      let deleteRequest;
      if (task.type_task === 'diaria') {
        deleteRequest = this.http.delete<TaskApiResponse>(`${environment.apiUrl}/tasks/daily/delete/${task.id}`, {
          withCredentials: true
        });
      } else if (task.type_task === 'pontual') {
        // Envia o título da tarefa no corpo do DELETE
        deleteRequest = this.http.request<TaskApiResponse>('delete', `${environment.apiUrl}/tasks/ponctual/delete`, {
          body: { task_remove: task.title },
          withCredentials: true
        });
      } else {
        alert('Tipo de tarefa desconhecido. Não foi possível deletar.');
        return;
      }

      deleteRequest.subscribe({
        next: (response) => {
          
          // Remover localmente das tarefas diárias
          this.dailyTasks = this.dailyTasks.filter(t => t.id !== task.id);
          
          // Remover localmente das tarefas pontuais
          this.punctualTasks = this.punctualTasks.filter(t => t.id !== task.id);
          
          this.cdr.detectChanges();
        },
        error: (error) => {
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

    // Converte a string para um objeto Date
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
    
    return task.member_id === this.currentUserId;
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
            display: false
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
    const colors = [
      '#d36d1a',
      '#007bff',
      '#28a745',
      '#ffc107',
      '#6f42c1',
      '#dc3545', 
      '#17a2b8',
      '#fd7e14'  
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
