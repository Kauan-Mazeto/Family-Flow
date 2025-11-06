import { Component, OnInit } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.taskForm = this.fb.group({
      description: [''],
      name: ['', Validators.required],
      member: [''],
      priority: ['MEDIA']
    });
  }

  ngOnInit() {
    this.loadFamilyMembers();
    this.loadDailyTasks();
  }

  onTabClick(tabType: string) {
    this.activeTab = tabType;
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
    this.dailyTasks = [];
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
          
          // Adicionar a nova tarefa à lista
          const newTask: Task = {
            id: response.task?.id || Date.now(), // Usar timestamp como fallback
            title: formData.name,
            description: formData.description,
            member_name: selectedMember?.name || 'Não atribuído',
            priority: formData.priority,
            status: 'PENDENTE',
            type_task: 'diaria'
          };
          
          this.dailyTasks.push(newTask);
          
          this.closeCreateTaskModal();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          // TODO: Mostrar mensagem de erro para o usuário
        }
      });
    } else {
      nameControl?.markAsTouched();
    }
  }



}
