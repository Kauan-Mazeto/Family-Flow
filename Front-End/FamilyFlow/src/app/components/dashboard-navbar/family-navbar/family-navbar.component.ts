import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_admin: boolean;
}

@Component({
  selector: 'app-family-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './family-navbar.component.html',
  styleUrls: ['./family-navbar.component.scss']
})

export class FamilyNavbarComponent implements OnInit {

  familyMembers: FamilyMember[] = [];
  totalMembers: number = 0;
  isLoading: boolean = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadFamilyMembers();
  }

  loadFamilyMembers() {
    this.http.get<{membros: FamilyMember[]}>(`${environment.apiUrl}/family/members`, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.familyMembers = response.membros;
        this.totalMembers = this.familyMembers.length;
        this.isLoading = false;
        
        // Força a detecção de mudanças
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar membros da família:', error);
        this.isLoading = false;
        this.familyMembers = [];
        this.totalMembers = 0;
        
        // Força a detecção de mudanças mesmo em caso de erro
        this.cdr.detectChanges();
      }
    });
  }

}
