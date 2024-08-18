import { Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  //templateUrl: './app.component.html',
  template: `
    <div class="navbar">
        <div class="navbar-brand">
            <img src="assets/images/ntu_logo.png" alt="NTU Logo" style="width:220px;height:128px;"> 
            <h1> 
                NTU Student Lab Attendance Portal
            </h1>
        </div>
        <div class="navbar-links">  
            <p>
                Academic Year: 
                <span name="academicYear">2024-2025 Sem 1</span>
            </p>
            <!-- Add other relevant information -->
        </div>
    </div>
    <form [formGroup]="profileForm" (ngSubmit)="handleSubmit()" class="form">
    <p>
      <label for="type">
        
          Domain
          <select name="type" formControlName="type">
            <option value="">-- Select User Type --</option>
            <option value="Lab_Executive">Lab Executive</option>
            <option value="Professor_Lecturer">Professor/Lecturer</option>
          </select>
        
      </label>
      <label for="email">
        Email:
        <input type="email" formControlName="email" name="email" />
      </label>
      <label for="password">
        Password:
        <input type="password" formControlName="password" name="password" />
      </label>
      <button type="submit" [disabled]="!profileForm.valid">Log In</button>
    </p>
    </form>
  `,
  imports: [ReactiveFormsModule, RouterOutlet],
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'lab-attendance-app';
  profileForm = new FormGroup({
    type: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  handleSubmit(){
    alert(this.profileForm.value.type + ' | ' + this.profileForm.value.email);
  }
}
