import { SocialAuthService } from '@abacritt/angularx-social-login';
import { DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, FormBuilder} from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router, provideRouter } from '@angular/router';
import { passwordMatchValidator } from '../../app/shared/passwordMatchValidator';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe],
  styleUrl: './login.component.scss'
})

export class SignupComponent {
    date = new Date();
    title = 'lab-attendance-signup';
    constructor(private router: Router, private fb: FormBuilder) {
      this.profileForm = this.fb.group(
        {
          password: ['', [Validators.required, Validators.minLength(6)]],
          password_again: ['', Validators.required],
        },
        { validator: passwordMatchValidator('password', 'password_again') } // Apply custom validator here
      );
    }

    profileForm = new FormGroup({
      fullName: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]),
      type: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
      password_again: new FormControl('', Validators.required)
    });
    

    navigateToLogin(){
      //Perform creation of account in the backend
      this.router.navigate(['login'])
    }

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