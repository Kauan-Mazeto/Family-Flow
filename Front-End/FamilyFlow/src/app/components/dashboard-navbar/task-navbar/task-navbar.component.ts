import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-navbar.component.html',
  styleUrls: ['./task-navbar.component.scss']
})

export class TaskNavbarComponent {
  
  activeTab: string = 'diarias';
  dailyTasks: any;

  constructor() { }

  onTabClick(tabType: string) {
    this.activeTab = tabType;
  }

  get isTabActive() {
    return {
      diarias: this.activeTab === 'diarias',
      pontuais: this.activeTab === 'pontuais'
    };
  }

}
