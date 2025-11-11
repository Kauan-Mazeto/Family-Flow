import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RegistrationFlowService } from '../../shared/services/registration-flow.service';

@Component({
  selector: 'app-register-family-option',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-family-option.component.html',
  styleUrls: ['./register-family-option.component.scss']
})
export class RegisterFamilyOptionComponent implements OnInit {

  registrationFlow = inject(RegistrationFlowService);
  navegador = inject(Router);

  constructor() { }

  ngOnInit() {
    // Verificar se os dados pessoais foram preenchidos
    if (!this.registrationFlow.hasUserData()) {
      this.navegador.navigate(['/users/register']);
      return;
    }
  }

  // Escolher criar família
  selectCreateFamily() {
    this.registrationFlow.setFamilyOption('create');
    this.navegador.navigate(['/family/create']);
  }

  // Escolher entrar em família
  selectJoinFamily() {
    this.registrationFlow.setFamilyOption('join');
    this.navegador.navigate(['/family/enter']);
  }

}
