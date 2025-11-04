import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FamilyNavbarComponent } from '../dashboard-navbar/family-navbar/family-navbar.component';

export interface NavbarAtalho {
  nome: string;
  icone: string;
  rota: string;
  ativo?: boolean;
}

@Component({
  selector: 'app-navbar-atalhos',
  standalone: true,
  imports: [CommonModule, RouterModule, FamilyNavbarComponent],
  templateUrl: './navbar-atalhos.component.html',
  styleUrls: ['./navbar-atalhos.component.scss']
})
export class NavbarAtalhosComponent {
  
  @Output() tarefasClicked = new EventEmitter<boolean>();
  showFamilyNavbar: boolean = false;
  
  atalhos: NavbarAtalho[] = [
    {
      nome: 'Tarefas',
      icone: 'fas fa-tasks',
      rota: '/family/tarefas',
      ativo: true
    },
    {
      nome: 'Família',
      icone: 'fas fa-home',
      rota: '/family/dashboard',
      ativo: false
    },
    {
      nome: 'Calendário',
      icone: 'fas fa-calendar-alt',
      rota: '/family/calendario',
      ativo: false
    },
    {
      nome: 'Configurações',
      icone: 'fas fa-gear',
      rota: '/family/despesas',
      ativo: false
    }
  ];

  constructor() { }

  onAtalhoClick(atalho: NavbarAtalho) {
    // Marcar apenas o atalho clicado como ativo
    this.atalhos.forEach(item => item.ativo = false);
    atalho.ativo = true;

    // Controlar exibição do family-navbar e emitir evento
    if (atalho.nome === 'Tarefas') {
      this.showFamilyNavbar = true; // Mostrar family-navbar
      this.tarefasClicked.emit(true); // Emitir evento para o componente pai
      console.log('📋 Exibindo family-navbar');
    } else {
      this.showFamilyNavbar = false; // Esconder family-navbar
      this.tarefasClicked.emit(false); // Emitir evento para o componente pai
      console.log(`🔗 Navegando para: ${atalho.rota}`);
    }
  }
}