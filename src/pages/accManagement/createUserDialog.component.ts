import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Inject } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, map, Observable, of } from 'rxjs';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';


@Component({
  selector: 'app-createUserDialog-page',
  standalone: true,
  templateUrl: './createUserDialog.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule],
  styleUrl: './createUserDialog.component.scss'
})

export class CreateUserDialogComponent {
  passwordStrength: string = '';
  submit: boolean = false;
  errorMessage: string = '';
  distinctRoles: string[] = [];
  selectedRole: string = '';

  constructor(
      public dialogRef: MatDialogRef<CreateUserDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private userService: UserService,
      private rolePermissionService: RolePermissionService,
      private toastr: ToastrService,
  ) {}

    ngOnInit(): void {
      this.rolePermissionService.getDistinctRoles().subscribe({
        next: (response) => {
          this.distinctRoles = response;
        }
      })
    }

    onClose(): void {
        this.dialogRef.close();
    }

    matchPasswordsValidator: ValidatorFn = (group: AbstractControl) => {
      const newPassword = group.get('newPassword')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      return newPassword === confirmPassword ? null : { mismatch: true };
    };

    profileForm = new FormGroup({
      username: new FormControl('', [Validators.minLength(3), Validators.required]),
      name: new FormControl('', [Validators.minLength(5), Validators.required]),
      email: new FormControl('',[Validators.email, Validators.required]),
      role: new FormControl('', Validators.required),
      newPassword: new FormControl('', [Validators.minLength(8), Validators.required],
      [this.passwordAsyncValidator.bind(this)] ),
      confirmPassword: new FormControl('', Validators.required),
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

    submitDetails(){
      console.log("submitDetails() called")
      this.submit = true;
      const username = this.profileForm.value.username;
      const name = this.profileForm.value.name;
      const email = this.profileForm.value.email;
      const role = this.profileForm.value.role;
      const password = this.profileForm.value.confirmPassword;

      if(username && name && email && role && password){
        this.userService.createUser({
          username: username,
          name: name,
          email: email,
          role: role,
          password: password
        } ).subscribe({
          next: (response) => {
            console.log(response);
            this.submit = false;
            switch(response.status) {
              case "SUCCESS" : {
                console.log('Creation of new user successful:', response);
                this.toastr.info("Created New User!", "SUCCESS");
                this.dialogRef.close();
                break;
              }
              default: {
                console.log('Error Message:', response);
                this.errorMessage = response.message;
                break;
              }
            }
          },
          error: (err) => {
            console.error('Creation of new user failed:', err);
            this.errorMessage = err.error.message || 'Error: User not created.';
            this.submit = false;
          },
          complete: () => {
            this.submit = false;
          },
        })
      }
      
    }
}