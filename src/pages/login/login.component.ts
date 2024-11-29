import { SocialAuthService } from '@abacritt/angularx-social-login';
import { DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router, provideRouter } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe],
  styleUrl: './login.component.scss'
})
export class LoginComponent{
  date = new Date();
  title = 'lab-attendance-login';
  constructor(private router: Router) {}

  profileForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });


  navigateToDashboard(){
    if (this.profileForm.valid) {
      // Perform form submission actions login
      alert(this.profileForm.value.email);
      this.router.navigate(['/drawer']);
    } else {
      // Handle validation errors
      alert('Form is invalid');
    }
  }

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

// Bootstrap the application using the routes
import { bootstrapApplication } from '@angular/platform-browser';

/*bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes)],
});*/
