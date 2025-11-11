import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    FullCalendar: any;
  }
}

interface Task {
  id: number;
  title: string;
  description?: string;
  member_name?: string;
  member_id: number;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
  type_task: string;
  scheduled_date?: string;
  date_end?: string;
}

interface CalendarStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

@Component({
  selector: 'app-calendary-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendary-navbar.component.html',
  styleUrls: ['./calendary-navbar.component.scss'],
})
export class CalendaryNavbarComponent implements OnInit, AfterViewInit {
  @ViewChild('calendar', { static: false }) calendarRef!: ElementRef;

  // Propriedades do calendário
  calendar: any;
  currentView: string = 'dayGridMonth';
  currentTitle: string = '';
  isLoading: boolean = false;

  // Dados das tarefas
  punctualTasks: Task[] = [];
  calendarStats: CalendarStats | null = null;

  // Modal de tarefa
  showTaskModal: boolean = false;
  selectedTask: Task | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadPunctualTasks();
    this.loadFullCalendarLibrary();
  }

  ngAfterViewInit() {
    // A inicialização do calendário será feita após carregar a biblioteca
  }

  // Carregar biblioteca FullCalendar dinamicamente
  loadFullCalendarLibrary() {
    if (typeof window !== 'undefined' && !window.FullCalendar) {
      this.isLoading = true;
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js';
      script.async = true;
      script.onload = () => {
        this.initCalendar();
        this.isLoading = false;
      };
      script.onerror = () => {
        console.error('Erro ao carregar FullCalendar');
        this.isLoading = false;
      };
      document.head.appendChild(script);
    } else if (window.FullCalendar) {
      this.initCalendar();
    }
  }

  // Inicializar o calendário
  initCalendar() {
    if (!this.calendarRef?.nativeElement || !window.FullCalendar) {
      setTimeout(() => this.initCalendar(), 100);
      return;
    }

    this.calendar = new window.FullCalendar.Calendar(this.calendarRef.nativeElement, {
      initialView: this.currentView,
      locale: 'pt-br',
      height: 'auto',
      headerToolbar: false, // Usamos controles customizados
      
      // Configurações de tradução
      buttonText: {
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        list: 'Lista'
      },
      
      // Configurações de eventos
      events: this.getCalendarEvents(),
      eventClick: this.onEventClick.bind(this),
      
      // Configurações visuais
      dayMaxEvents: true,
      moreLinkClick: 'popover',
      
      // Callbacks
      datesSet: (info: any) => {
        this.currentTitle = info.view.title;
        this.cdr.detectChanges();
      }
    });

    this.calendar.render();
    this.currentTitle = this.calendar.view.title;
  }

  // Carregar tarefas pontuais
  loadPunctualTasks() {
    this.isLoading = true;
    
  this.http.get<{ tasks: Task[] }>(`${environment.apiUrl}/tasks/ponctual/user`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.punctualTasks = response.tasks;
        this.calculateStats();
        
        // Atualizar eventos do calendário se já estiver inicializado
        if (this.calendar) {
          this.calendar.removeAllEvents();
          this.calendar.addEventSource(this.getCalendarEvents());
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas pontuais:', error);
        this.isLoading = false;
      }
    });
  }

  // Converter tarefas para eventos do calendário
  getCalendarEvents() {
    return this.punctualTasks.map(task => ({
      id: task.id.toString(),
      title: `${task.title}`,
      start: task.date_end,
      allDay: true,
      backgroundColor: this.getTaskColor(task),
      borderColor: this.getTaskColor(task),
      textColor: this.getTextColor(task),
      extendedProps: {
        task: task,
        description: task.description,
        priority: task.priority,
        status: task.status,
        member_name: task.member_name
      }
    }));
  }

  // Obter cor da tarefa baseada na prioridade e status
  getTaskColor(task: Task): string {
    // Se a tarefa está concluída, usar cor específica
    if (task.status === 'CONCLUIDA') {
      return '#28a745'; // Verde do sistema
    }
    
    // Cores baseadas na prioridade
    switch (task.priority) {
      case 'ALTA':
        return '#dc3545'; // Vermelho
      case 'MEDIA':
        return '#d36d1a'; // Laranja do sistema
      case 'BAIXA':
        return '#007bff'; // Azul do sistema
      default:
        return '#6c757d'; // Cinza
    }
  }

  // Obter cor do texto baseada na cor de fundo
  getTextColor(task: Task): string {
    return '#ffffff'; // Branco para todos os casos
  }

  // Calcular estatísticas
  calculateStats() {
    const total = this.punctualTasks.length;
    const completed = this.punctualTasks.filter(task => task.status === 'CONCLUIDA').length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.calendarStats = {
      total,
      completed,
      pending,
      completionRate
    };
  }

  // Eventos do calendário
  onEventClick(info: any) {
    this.selectedTask = info.event.extendedProps.task;
    this.showTaskModal = true;
    this.cdr.detectChanges();
  }

  // Controles de navegação
  changeView(viewName: string) {
    this.currentView = viewName;
    if (this.calendar) {
      this.calendar.changeView(viewName);
    }
  }

  goToPrevious() {
    if (this.calendar) {
      this.calendar.prev();
    }
  }

  goToNext() {
    if (this.calendar) {
      this.calendar.next();
    }
  }

  goToToday() {
    if (this.calendar) {
      this.calendar.today();
    }
  }

  // Modal de tarefa
  closeTaskModal() {
    this.showTaskModal = false;
    this.selectedTask = null;
  }

  // Verificar se pode editar tarefa
  canEditTask(task: Task): boolean {
    // Aqui você pode implementar a lógica para verificar se o usuário atual
    // pode editar a tarefa (por exemplo, se é o responsável pela tarefa)
    return true; // Por enquanto, permitir edição para todos
  }

  // Completar tarefa
  completeTask(task: Task) {
    this.http.put(`${environment.apiUrl}/tasks/concluide/${task.id}`, {}, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        // Atualizar a tarefa localmente
        const taskIndex = this.punctualTasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.punctualTasks[taskIndex].status = 'CONCLUIDA';
          this.selectedTask = this.punctualTasks[taskIndex];
        }
        
        // Atualizar calendário e estatísticas
        this.updateCalendarEvents();
        this.calculateStats();
        
      },
      error: (error) => {
        alert('Erro ao marcar tarefa como concluída');
      }
    });
  }

  // Desmarcar tarefa como concluída
  uncompleteTask(task: Task) {
    this.http.put(`${environment.apiUrl}/tasks/ponctual/delete/${task.id}`, {}, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        // Atualizar a tarefa localmente
        const taskIndex = this.punctualTasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.punctualTasks[taskIndex].status = 'PENDENTE';
          this.selectedTask = this.punctualTasks[taskIndex];
        }
        
        // Atualizar calendário e estatísticas
        this.updateCalendarEvents();
        this.calculateStats();
      },
      error: (error) => {
        alert('Erro ao desmarcar tarefa');
      }
    });
  }

  // Atualizar eventos do calendário
  updateCalendarEvents() {
    if (this.calendar) {
      this.calendar.removeAllEvents();
      this.calendar.addEventSource(this.getCalendarEvents());
    }
  }

  // Formatação de dados para exibição
  formatDate(dateString?: string): string {
    if (!dateString) return 'Data não definida';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPriority(priority?: string): string {
    switch (priority) {
      case 'ALTA': return 'Alta';
      case 'MEDIA': return 'Média';
      case 'BAIXA': return 'Baixa';
      default: return 'Não definida';
    }
  }

  formatStatus(status?: string): string {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'CONCLUIDA': return 'Concluída';
      default: return 'Não definido';
    }
  }
}
