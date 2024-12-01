import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, NgModule } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router, provideRouter } from '@angular/router';
import { routes } from './app.routes';

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
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes),
      provideHttpClient(),
    ],
});
