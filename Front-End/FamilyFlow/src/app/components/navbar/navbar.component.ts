import { Component, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NavbarData {
  familyName: string;
  familyCode: string;
  userName: string;
  userEmail: string;
  userRole: string;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-navbar-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarDataComponent {
  
  cdr = inject(ChangeDetectorRef);
  
  @Input() data: NavbarData = {
    familyName: '',
    familyCode: '',
    userName: '',
    userEmail: '',
    userRole: '',
    isLoading: true,
    errorMessage: ''
  };

  constructor() { }
}