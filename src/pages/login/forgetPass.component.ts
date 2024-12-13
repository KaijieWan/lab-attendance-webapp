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
  selector: 'app-forget-pass',
  standalone: true,
  templateUrl: './forgetPass.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrls: ['./login.component.scss']
})

export class ForgetPassComponent{
  date = new Date();
  title = 'lab-attendance-forget-pass';
  errorMessage: string = '';
  successMessage: string= '';
  sending = false;
  constructor(private router: Router, private userService : UserService) {}

  profileForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  getCurrentAcadYear(){
    const now = new Date();
    const sem = now.getMonth()+1 < 8 ? "Sem 2" : "Sem 1";
    const year = now.getMonth()+1 < 8 ? now.getFullYear()-1 : now.getFullYear()
    return `${year}-${year+1} ${sem}`
  }
  
  emailCheck(){
    const email = this.profileForm.value.email?.trim();
    if(!email){
      this.errorMessage = 'Email is required.';
      this.successMessage = "";
      console.log('Error Message:', this.errorMessage);
      return;
    }

    this.userService.checkUserByEmail(email).subscribe({
      next: (response) =>{
        if(response==true){
          console.log("User found");
          this.sendLink();
          this.sending = true;
        }
        else{
          this.errorMessage = 'User does not exist.';
          this.successMessage = "";
          console.log('Error Message:', this.errorMessage);
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.errorMessage = err.error.message || "An error occurred.";
        this.successMessage = "";
        return;
      },
    })
  }

  sendLink(){
    if(!this.profileForm.value.email){
      this.errorMessage = 'Email is required.';
      this.successMessage = "";
      this.sending = false;
      console.log('Error Message:', this.errorMessage);
      return;
    }

    this.userService.sendPassResetLink(this.profileForm.value.email).subscribe({
      next: (response) => {
        if (response === "FAILED") {
          this.errorMessage = "Failed to send password reset link.";
          this.successMessage = "";
          this.sending = false;
          console.log('Error Message:', this.errorMessage)
        } else {
          this.successMessage = "Password reset link sent successfully!";
          this.sending = false;
          this.errorMessage = "";
          localStorage.setItem('authToken', response);
          console.log('Token:', response);
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.errorMessage = err.error.message || "Sending Link: Error occurred.";
        this.successMessage = "";
        this.sending = false;
      },
    })
  }
  
  // Set an interval to update the time every second
  ngOnInit() {
    setInterval(() => {
      this.date = new Date();;
    }, 1000); // Update time every second (1000 ms)
  }

  ngOnDestroy() {
    this.userService.unsubscribe();
  }
  
}