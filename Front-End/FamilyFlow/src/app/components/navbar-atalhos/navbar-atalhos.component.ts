import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface NavbarAtalho {
  nome: string;
  icone: string;
  rota: string;
  ativo?: boolean;
}

@Component({
  selector: 'app-navbar-atalhos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar-atalhos.component.html',
  styleUrls: ['./navbar-atalhos.component.scss']
})
export class NavbarAtalhosComponent {
  
  atalhos: NavbarAtalho[] = [
    {
      nome: 'Família',
      icone: 'fas fa-home',
      rota: '/family/dashboard',
      ativo: true
    },
    {
      nome: 'Tarefas',
      icone: 'fas fa-tasks',
      rota: '/family/tarefas',
      ativo: false
    },
    {
      nome: 'Calendário',
      icone: 'fas fa-calendar-alt',
      rota: '/family/calendario',
      ativo: false
    }
  ];

  constructor() { }

  onAtalhoClick(atalho: NavbarAtalho) {
    // Marcar apenas o atalho clicado como ativo
    this.atalhos.forEach(item => item.ativo = false);
    atalho.ativo = true;
    
    console.log(`Navegando para: ${atalho.rota}`);
  }
}