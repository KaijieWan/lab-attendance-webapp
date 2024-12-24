import { SocialAuthService } from '@abacritt/angularx-social-login';
import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router, provideRouter } from '@angular/router';
import { UserService } from '../../service/user.service';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  templateUrl: './accessDenied.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrls: ['./error.component.scss']
})

export class AccessDeniedComponent{
  date = new Date();
  title = 'lab-attendance-access-denied';
  errorMessage: string = '';
  successMessage: string= '';
  sending = false;
  constructor(private router: Router, private userService : UserService) {}
  
}