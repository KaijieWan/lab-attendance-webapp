import { SocialAuthService } from '@abacritt/angularx-social-login';
import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
import { Router, provideRouter } from '@angular/router';
import { UserService } from '../../service/user.service';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { debounceTime, delay, map, Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-pass',
  standalone: true,
  templateUrl: './resetPass.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrls: ['./resetPass.component.scss']
})

export class ResetPassComponent{
  date = new Date();
  title = 'lab-attendance-reset-pass';
  sending = false;
  passwordStrength: string = '';
  token: string | null = null;
  errorMessage: string = '';
  successMessage = '';
  //If invalid deny reset password portion, if valid show the rest of the reset password portion
  constructor(private router: Router, private userService : UserService, private route: ActivatedRoute,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    // Set an interval to update the time every second
    setInterval(() => {
      this.date = new Date();;
    }, 1000); // Update time every second (1000 ms)

    this.token = this.route.snapshot.queryParamMap.get('token'); // Get the token from the URL
    console.log(this.token);

    if (this.token) {
      this.userService.checkExpiredToken(this.token).subscribe({
        next: (response) =>{
          if(response==true){
            console.log("Token valid and not expired");
          }
          else{
            console.log('Error Message: Token Invalid or Expired');
            this.router.navigate(['/error'])
          }
        },
        error: (err) => {
          console.error('Error:', err);
          this.router.navigate(['/error'])
          return;
        },
      });
    } else {
      this.router.navigate(['/error']); // Redirect to an error page if no token is provided
    }
  }

  matchPasswordsValidator: ValidatorFn = (group: AbstractControl) => {
    const newPassword = group.get('newPass')?.value;
    const confirmPassword = group.get('confirmPass')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  };

  profileForm = new FormGroup({
    newPass: new FormControl('', [Validators.required, Validators.minLength(8)],
    [this.passwordAsyncValidator.bind(this)] ),
    confirmPass: new FormControl('', [Validators.required]),
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

  getCurrentAcadYear(){
    const now = new Date();
    const sem = now.getMonth()+1 < 8 ? "Sem 2" : "Sem 1";
    const year = now.getMonth()+1 < 8 ? now.getFullYear()-1 : now.getFullYear()
    return `${year}-${year+1} ${sem}`
  }

  resetPassword(){
    this.sending = true;
    const newPassword = this.profileForm.value.newPass;

    console.log('New password:', this.profileForm.value.newPass);
    console.log('Token:', this.token);

    if(newPassword && this.token){
      this.userService.resetPassword({newPassword: newPassword, token: this.token}).subscribe({
        next: (response) => {
          console.log(response);
          if(response=="SUCCESS"){
            this.sending = false;
            console.log('Reset successful:', response);
            this.successMessage = 'Password reset successful'
            this.errorMessage = '';
            setTimeout(() => {
              console.log("Wait for 2 secs")
              this.toastr.success("Password reset successful", "SUCCESS")
              this.router.navigate(['/login']); // Redirect to login
            }, 2000);
          }
          else{
            this.errorMessage = 'Password reset failed'
            console.log('Error Message:', response);
          }
        },
        error: (err) => {
          console.error('Reset of password failed:', err);
          this.sending = false;
          this.errorMessage = err.error.message || 'Password reset failed.';
          this.successMessage = ''
        },
        complete: () => {
          this.sending = false;
        },
      });
    }
  }
  
}