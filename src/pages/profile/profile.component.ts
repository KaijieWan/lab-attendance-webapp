import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { debounceTime, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-courses-page',
  standalone: true,
  templateUrl: './profile.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrl: './profile.component.scss'
})

export class ProfileComponent {
  name: string = '';
  email: string = '';
  saving: boolean = false;
  passwordStrength: string = '';
  token: string | null = null;
  errorMessage: string = '';
  successMessage = '';

  constructor(private router: Router, private userService : UserService) {}

  matchPasswordsValidator: ValidatorFn = (group: AbstractControl) => {
    const newPassword = group.get('newPass')?.value;
    const confirmPassword = group.get('confirmPass')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  };

  profileForm = new FormGroup({
    name: new FormControl('', Validators.minLength(5)),
    email: new FormControl('', Validators.email),
    oldPassword: new FormControl('', ),
    newPassword: new FormControl('', Validators.minLength(8),
    [this.passwordAsyncValidator.bind(this)] ),
    confirmPassword: new FormControl(''),
  },
  { validators: this.matchPasswordsValidator });

  ngOnInit() {
    const id = localStorage.getItem("id");
    if(id){
      this.userService.getUser(parseInt(id)).subscribe({
        next: (response) => {
          this.name = response.name;
          this.email = response.email;
        }
      })
    }
  }

  passwordAsyncValidator(control: any): Observable<any> {
    const value = control.value || '';
    // Simulate server-side validation
    return of(value).pipe(
      debounceTime(300),
      map((password) => {
        if (!/[A-Z]/.test(password)) return { needsUppercase: true }; // Must have uppercase
        if (!/\d/.test(password)) return { needsNumber: true };       // Must have number
        return null; // Valid
      })
    );
  }

  checkPasswordStrength(password: string): void {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const lengthValid = password.length >= 8;

    const strength =
      [hasUpperCase, hasLowerCase, hasNumber, lengthValid].filter(Boolean)
        .length;

    // Update password strength
    if (strength <= 2) {
      this.passwordStrength = 'Weak';
    } else if (strength === 3) {
      this.passwordStrength = 'Medium';
    } else {
      this.passwordStrength = 'Strong';
    }
  }

  saveDetails(){

  }
}