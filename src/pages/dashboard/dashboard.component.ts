import { DatePipe } from '@angular/common';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe],
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent {
  
}