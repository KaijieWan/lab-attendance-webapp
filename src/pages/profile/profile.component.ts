import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn, ValidationErrors} from '@angular/forms';
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
  original_name: string = '';
  original_email: string = '';
  form_name: string = '';
  form_email: string = '';
  username: string = '';
  role: string = '';

  saving: boolean = false;
  passwordStrength: string = '';
  token: string | null = null;
  name_email_error: string = '';
  password_error: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private router: Router, private userService : UserService) {}

  matchPasswordsValidator: ValidatorFn = (group: AbstractControl) => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  };

  // Custom validator for optional minLength
  /*optionalMinLength(min: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // If the field is empty, return null (valid)
      if (!value || value.trim() === '') {
        return null;
      }

      // If the field has a value, enforce minLength validation
      return value.length >= min
        ? null
        : { minLength: { requiredLength: min, actualLength: value.length } };
    };
  } */

  ngOnInit() {
    const id = localStorage.getItem("id");
    if(id){
      this.userService.getUser(parseInt(id)).subscribe({
        next: (response) => {
          this.original_name = response.name;
          this.original_email = response.email;
          this.form_name = response.name;
          this.form_email = response.email;

          this.username = response.username;
          this.role = response.role;
        }
      })
    }
  }

  profileForm = new FormGroup({
    name: new FormControl('', Validators.minLength(5)),
    email: new FormControl('', Validators.email),
    oldPassword: new FormControl(''),
    newPassword: new FormControl('', [Validators.minLength(8)],
    [this.passwordAsyncValidator.bind(this)] ),
    confirmPassword: new FormControl(''),
  },
  { validators: this.matchPasswordsValidator });

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
    console.log("saveDetails called")
    console.log('Original Name:', this.original_name);
    console.log('Original Email:', this.original_email);
    
    this.saving = true;
    const newPassword = this.profileForm.value.newPassword;
    const oldPassword = this.profileForm.value.oldPassword;
    const email = this.profileForm.value.email;
    const name = this.profileForm.value.name;
    const id = localStorage.getItem("id");

    console.log('Form Name:', name);
    console.log('Form Email:', email);

    //console.log('New password:', this.profileForm.value.newPassword);
    //console.log('Token:', this.token);
    if(oldPassword && newPassword && id){
      this.userService.updatePassword({oldPassword: oldPassword, newPassword: newPassword}, parseInt(id)).subscribe({
        next: (response) => {
          console.log(response);
          this.saving = false;
          switch(response.status) {
            case "SUCCESS" : {
              console.log('Update password successful:', response);
              this.successMessage = 'Password Saved.'
              this.password_error = '';
              break;
            }
            case "VALIDATION_ERROR" : {
              console.log('Validation error:', response);
              this.password_error = response.message;
              this.successMessage = '';
              break;
            }
            default: {
              this.password_error = 'Error: Password not saved.'
              this.successMessage = '';
              console.log('Error Message:', response);
              break;
            }
          }
        },
        error: (err) => {
          console.error('Update of password failed:', err);
          this.saving = false;
          this.password_error = err.error.message || 'Error: Password not saved.';
          this.successMessage = ''
        },
        complete: () => {
          this.saving = false;
        },
      });
    }

    if(email && name && id){
      console.log("Email & name & id check");
      if(email != this.original_email || name != this.original_name){
        console.log("Email & name similarity check");
        this.userService.updateUser({email: email, name: name, username: this.username, role: this.role, modulesAssigned: ""}, parseInt(id)).subscribe({
          next: (response) => {
            console.log(response);
            this.saving = false;
            switch(response.status) {
              case "SUCCESS" : {
                console.log('Email/Name update successful:', response);
                this.successMessage = 'Name/Email Saved.'
                this.name_email_error = '';
                break;
              }
              default: {
                this.name_email_error = 'Error: Name/Email not saved.'
                this.successMessage = '';
                console.log('Error Message:', response);
                break;
              }
            }
          },
          error: (err) => {
            console.error('Update of email/name failed:', err);
            this.saving = false;
            this.name_email_error = err.error.message || 'Error: Name/Email not saved.';
            this.successMessage = ''
          },
          complete: () => {
            this.saving = false;
          },
        });
      }
      this.saving = false;
    }

    
    //this.saving = false;
  }
}