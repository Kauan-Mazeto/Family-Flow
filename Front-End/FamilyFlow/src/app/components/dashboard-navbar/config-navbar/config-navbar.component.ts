import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
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

  userData: UserData | null = null;
  familyData: FamilyData | null = null;
  isLoading: boolean = true;
  familyCodeArray: string[] = [];
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
        console.error('❌ Erro ao carregar dados do usuário:', error);
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
        console.error('❌ Erro ao carregar dados da família:', error);
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
}