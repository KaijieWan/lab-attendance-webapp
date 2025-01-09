import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, NgModule } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideToastr } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe],
  styleUrl: './app.component.scss'
})
export class AppComponent{
  title = 'lab-attendance-webapp';
}

// Bootstrap the application using the routes
import { bootstrapApplication } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { AuthInterceptor } from '../lib/auth.interceptor';

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes),
      provideHttpClient(),
      provideAnimations(),
      provideToastr(),
      {
        provide: HTTP_INTERCEPTORS,
        useClass: AuthInterceptor,
        multi: true // Allow multiple interceptors
      }
    ],
});
