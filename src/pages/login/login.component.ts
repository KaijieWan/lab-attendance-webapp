import { SocialAuthService } from '@abacritt/angularx-social-login';
import { DatePipe } from '@angular/common';
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

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe],
  styleUrls: ['./login.component.scss']
})

export class LoginComponent{
  date = new Date();
  title = 'lab-attendance-login';
  errorMessage: string = '';
  constructor(private router: Router, private userService : UserService) {}

  profileForm = new FormGroup({
    username: new FormControl('', [Validators.required, usernameValidator()]),
    password: new FormControl('', Validators.required),
  });

  login() {
    if (!this.profileForm.value.username || !this.profileForm.value.password) {
      this.errorMessage = 'Username and password are required.';
      return;
    }
    console.log('Attempting login with:', this.profileForm.value);

    this.userService.login({ username: this.profileForm.value.username, password: this.profileForm.value.password }).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        // Handle token storage
        localStorage.setItem('authToken', response.token);
        this.router.navigate(['/drawer']); // Redirect after login
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage = err.error.message || 'Login failed. Please try again.';
      },
    });
  }
  
  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  /*navigateToDashboard(){
    if (this.profileForm.valid) {
      // Perform form submission actions login
      alert(this.profileForm.value.email);
      this.router.navigate(['/drawer']);
    } else {
      // Handle validation errors
      alert('Form is invalid');
    }
  }*/

  navigateToSignupPage(){
    this.router.navigate(['/signup'])
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
    const usernameRegex = /^[a-zA-Z0-9]{4,20}$/; // Alphanumeric, 4-20 characters
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

