import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

interface Task {
  id: number;
  title: string;
  description: string;
  member_name: string;
  priority: string;
  status: string;
  type_task: string;
}

@Component({
  selector: 'app-task-navbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-navbar.component.html',
  styleUrls: ['./task-navbar.component.scss']
})

export class TaskNavbarComponent implements OnInit {
  
  activeTab: string = 'diarias';
  dailyTasks: Task[] = [];
  showCreateTaskModal: boolean = false;
  taskForm: FormGroup;
  familyMembers: FamilyMember[] = [];
  isLoading: boolean = false;
  isAdmin: boolean = false;

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
  }

  ngOnInit() {
    this.initializeComponent();
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
      next: (response) => {
        this.isAdmin = response.familia?.role === 'ADMIN';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erro ao verificar papel do usuário na família:', error);
        
        // Retry após 1 segundo em caso de erro
        setTimeout(() => {
          this.checkUserRole();
        }, 1000);
      }
    });
  }

  onTabClick(tabType: string) {
    this.activeTab = tabType;
    
    // Se mudou para a aba de tarefas diárias, recarregar os dados
    if (tabType === 'diarias') {
      this.loadDailyTasks();
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

  loadFamilyMembers() {
    this.http.get<{membros: FamilyMember[]}>(`${environment.apiUrl}/family/members`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
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
    this.http.get<{tasks: Task[]}>(`${environment.apiUrl}/tasks/daily/family`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.dailyTasks = response.tasks || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar tarefas diárias:', error);
        
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
            priority: response.task.priority,
            status: response.task.status,
            type_task: response.task.type_task
          };
          
          this.dailyTasks.push(newTask);
          
          // Recarregar a lista de tarefas para mostrar todas as tarefas da família
          this.loadDailyTasks();
          
          // Forçar detecção de mudanças
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
          console.error('❌ Erro ao criar tarefa:', error);
          this.isLoading = false;
        }
      });
    } else {
      nameControl?.markAsTouched();
    }
  }



}
