import { DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-courses-page',
  standalone: true,
  templateUrl: './profile.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe],
  styleUrl: './profile.component.scss'
})

export class ProfileComponent {
  
}