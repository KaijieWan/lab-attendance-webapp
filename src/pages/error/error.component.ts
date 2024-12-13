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
  selector: 'app-error',
  standalone: true,
  templateUrl: './error.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrls: ['./error.component.scss']
})

export class ErrorComponent{
  date = new Date();
  title = 'lab-attendance-error';
  errorMessage: string = '';
  successMessage: string= '';
  sending = false;
  constructor(private router: Router, private userService : UserService) {}

  getCurrentAcadYear(){
    const now = new Date();
    const sem = now.getMonth()+1 < 8 ? "Sem 2" : "Sem 1";
    const year = now.getMonth()+1 < 8 ? now.getFullYear()-1 : now.getFullYear()
    return `${year}-${year+1} ${sem}`
  }
  
  // Set an interval to update the time every second
  ngOnInit() {
    setInterval(() => {
      this.date = new Date();;
    }, 1000); // Update time every second (1000 ms)
  }
  
}