import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-family-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './family-navbar.component.html',
  styleUrls: ['./family-navbar.component.scss']
})

export class FamilyNavbarComponent {
  
  activeTab: string = 'diarias'; // Por padrão, "Tarefas Diárias" está ativa

  constructor() { }

  onTabClick(tabType: string) {
    this.activeTab = tabType;
    console.log(`🔄 Aba ativa: ${tabType}`);
  }

  get isTabActive() {
    return {
      diarias: this.activeTab === 'diarias',
      pontuais: this.activeTab === 'pontuais'
    };
  }

}
