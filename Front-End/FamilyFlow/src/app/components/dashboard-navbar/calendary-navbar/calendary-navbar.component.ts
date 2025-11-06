import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendary-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendary-navbar.component.html',
  styleUrls: ['./calendary-navbar.component.scss'],
})
export class CalendaryNavbarComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
