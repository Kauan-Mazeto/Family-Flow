import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-initial-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './initial-page.component.html',
  styleUrls: ['./initial-page.component.scss']
})
export class InitialPageComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  navigateToLogin($event: Event) {
    $event.preventDefault();
    this.router.navigate(['/users/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/users/register']);
  }

}
