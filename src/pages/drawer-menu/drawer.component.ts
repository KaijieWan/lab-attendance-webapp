import { DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-drawer',
  standalone: true,
  templateUrl: './drawer.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, RouterModule],
  styleUrl: './drawer.component.scss'
})

export class DrawerComponent {
  date = new Date();
  constructor(private router: Router) {}

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

  navigateToDashboard(){
    this.router.navigate(['/dashboard']);
  }

}