import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router, provideRouter } from '@angular/router';
import { UserService } from '../../service/user.service';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrls: ['./login.component.scss']
})

export class LoginComponent{
  date = new Date();
  title = 'lab-attendance-login';
  errorMessage: string = '';
  loading = false;
  constructor(private router: Router, private userService : UserService) {}

  profileForm = new FormGroup({
    username: new FormControl('', [Validators.required, usernameValidator()]),
    password: new FormControl('', Validators.required),
  });

  login() {
    console.log('Form Status:', this.profileForm.status); // Should be INVALID if any field is empty
    console.log('Form Errors:', this.profileForm.errors); // Log validation errors
    console.log('Controls:', this.profileForm.controls);

    const usernameControl = this.profileForm.get('username');
    const passwordControl = this.profileForm.get('password');

    console.log('Username Value:', usernameControl?.value);
    console.log('Username Errors:', usernameControl?.errors);
    console.log('Password Value:', passwordControl?.value);

    // Check for required fields and validation errors
    if (!usernameControl?.value || !passwordControl?.value) {
      this.errorMessage = 'Username and password are required.';
      return;
    }

    if (usernameControl.invalid) {
      this.errorMessage = 'Username must be alphanumeric and 4-20 characters long.';
      console.log('Error Message:', this.errorMessage);
      return;
    }

    if (passwordControl.invalid) {
      this.errorMessage = 'Password is required.';
      console.log('Error Message:', this.errorMessage);
      return;
    }
  
    console.log('Attempting login with:', this.profileForm.value);

    this.loading = true;
    this.userService.login({ username: usernameControl.value, password: passwordControl.value }).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        // Handle token and user id storage
        localStorage.setItem('authToken', response.token);
        sessionStorage.setItem('authToken', response.token);
        localStorage.setItem('id', response.user.id.toString());
        sessionStorage.setItem('id', response.user.id.toString());
        this.router.navigate(['/drawer']); // Redirect after login
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.loading = false;
        this.errorMessage = err.error.message || 'Login failed. Please try again.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  forgetPass(){
    this.router.navigate(['/forgetPass'])
  }

  navigateToSignupPage(){
    this.router.navigate(['/signup'])
  }

  toResetPass(){
    this.router.navigate(['/resetPass']);
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

export function usernameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/; // Matches alphabets and alphanumeric usernames (4-20 chars)
    const valid = usernameRegex.test(control.value);
    return valid ? null : { invalidUsername: true };
  };
}


// Bootstrap the application using the routes
/*import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from '../../app/app.component';
import { routes } from '../../app/app.routes';

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes)],
});*/

