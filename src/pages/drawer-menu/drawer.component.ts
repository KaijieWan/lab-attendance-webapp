import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-drawer',
  standalone: true,
  templateUrl: './drawer.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, RouterModule, CommonModule],
  styleUrl: './drawer.component.scss'
})

export class DrawerComponent {
  date = new Date();
  username: string = '';
  name: string = '';
  constructor(private router: Router, private userService : UserService) {}

  getCurrentAcadYear(){
    const now = new Date();
    const sem = now.getMonth()+1 < 8 ? "Sem 2" : "Sem 1";
    const year = now.getMonth()+1 < 8 ? now.getFullYear()-1 : now.getFullYear()
    return `${year}-${year+1} ${sem}`
  }
  
  ngOnInit() {
    // Set an interval to update the time every second
    setInterval(() => {
      this.date = new Date();;
    }, 1000); // Update time every second (1000 ms)
    const id = localStorage.getItem("id");
    if(id){
      this.userService.getUser(parseInt(id)).subscribe({
        next: (response) => {
          this.username = response.username;
          this.name = response.name;
        }
      })
    }
    
  }

  navigateToDashboard(){
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

}