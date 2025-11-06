import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskNavbarComponent } from '../dashboard-navbar/task-navbar/task-navbar.component';
import { FamilyNavbarComponent } from "../dashboard-navbar/family-navbar/family-navbar.component";
import { CalendaryNavbarComponent } from '../dashboard-navbar/calendary-navbar/calendary-navbar.component';
import { ConfigNavbarComponent } from '../dashboard-navbar/config-navbar/config-navbar.component';

export interface NavbarAtalho {
  nome: string;
  icone: string;
  rota: string;
  ativo?: boolean;
}

@Component({
  selector: 'app-navbar-atalhos',
  standalone: true,
  imports: [CommonModule, RouterModule, TaskNavbarComponent, FamilyNavbarComponent, CalendaryNavbarComponent, ConfigNavbarComponent],
  templateUrl: './navbar-atalhos.component.html',
  styleUrls: ['./navbar-atalhos.component.scss']
})
export class NavbarAtalhosComponent implements OnInit {
  
  @Output() tarefasClicked = new EventEmitter<boolean>();
  showTaskNavbar: boolean = true; // Mostrar por padrão quando entrar no dashboard
  showFamilyNavbar: boolean = false;
  showCalendaryNavbar: boolean = false;
  showConfigNavbar: boolean = false;
  
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

  ngOnInit() {
    this.tarefasClicked.emit(true);
  }

  onAtalhoClick(atalho: NavbarAtalho) {
    // Marcar apenas o atalho clicado como ativo
    this.atalhos.forEach(item => item.ativo = false);
    atalho.ativo = true;

    // Resetar todos os navbars
    this.showTaskNavbar = false;
    this.showFamilyNavbar = false;
    this.showCalendaryNavbar = false;
    this.showConfigNavbar = false;

    // Controlar exibição baseado no atalho clicado
    if (atalho.nome === 'Tarefas') {
      this.showTaskNavbar = true;
      this.tarefasClicked.emit(true);
    } else if (atalho.nome === 'Família') {
      this.showFamilyNavbar = true;
      this.tarefasClicked.emit(false);
    } else if (atalho.nome == 'Calendário') {
      this.showCalendaryNavbar = true;
    } else if (atalho.nome == 'Configurações') {
      this.showConfigNavbar = true;
    } else {
      this.tarefasClicked.emit(false);
    }
  }
}