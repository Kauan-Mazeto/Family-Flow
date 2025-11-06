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
        console.log('✅ Resposta completa do endpoint /users/verify:', JSON.stringify(response, null, 2));
        this.userData = response.usuario;
        console.log('👤 Dados do usuário carregados:', JSON.stringify(this.userData, null, 2));
        if (this.userData) {
          console.log('🔍 Campo name:', this.userData.name);
          console.log('🔍 Campo nome:', (this.userData as any).nome);
          console.log('🔍 Todas as propriedades do usuário:', Object.keys(this.userData));
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar dados do usuário:', error);
        console.error('❌ Detalhes do erro:', error.error);
        this.checkLoadingComplete();
      }
    });
  }

  loadFamilyData() {
    this.http.get<{familia: FamilyData}>(`${environment.apiUrl}/family/info`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        console.log('✅ Resposta completa do endpoint /family/info:', JSON.stringify(response, null, 2));
        this.familyData = response.familia;
        if (this.familyData) {
          this.familyCodeArray = this.familyData.codigo.split('');
          console.log('🏠 Dados da família carregados:', JSON.stringify(this.familyData, null, 2));
          console.log('🔤 Código da família dividido:', this.familyCodeArray);
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar dados da família:', error);
        console.error('❌ Detalhes do erro:', error.error);
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
      console.log('✅ Carregamento das configurações concluído');
    }
  }
}