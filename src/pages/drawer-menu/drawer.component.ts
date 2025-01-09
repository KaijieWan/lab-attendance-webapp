import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { UserService } from '../../service/user.service';
import { ToastrService } from 'ngx-toastr';
import { RolePermissionService } from '../../service/rolePermission.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NewSemDialogComponent } from './newSemDialog.component';

interface RolePermission{
  permissionType: string,
  actions: string[];
}

@Component({
  selector: 'app-drawer',
  standalone: true,
  templateUrl: './drawer.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, RouterModule, CommonModule, MatDialogModule, MatButtonModule],
  styleUrl: './drawer.component.scss'
})

export class DrawerComponent {
  date = new Date();
  username: string = '';
  name: string = '';
  constructor(private router: Router, private userService : UserService, private toastr: ToastrService,
    private rolePermissionService: RolePermissionService, private dialog: MatDialog
  ) {}

  getCurrentAcadYear(){
    const now = new Date();
    const sem = now.getMonth()+1 < 8 ? "Sem 2" : "Sem 1";
    const year = now.getMonth()+1 < 8 ? now.getFullYear()-1 : now.getFullYear()
    return `${year}-${year+1} ${sem}`
  }

  semesters = [
    { title: 'AY2024/2025 Sem 1' },
    { title: 'AY2024/2025 Sem 2' },
    { title: 'AY2025/2026 Sem 1'},
  ];
  
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
    
    const arrowIcon = document.getElementById('arrow-icon');
    const semDropdown = document.getElementById('dropdown');
    if(arrowIcon && semDropdown){
      semDropdown.addEventListener('mouseover', () => {
        arrowIcon.textContent = 'arrow_drop_up';
      });
      
      semDropdown.addEventListener('mouseout', () => {
          arrowIcon.textContent = 'arrow_drop_down';
      });
    }    
  }

  openAddSemDialog(){
    console.log("openCreateUserDialog");
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
      //Perhaps use a toastr to display denied message
      console.log("openCreateUserDialog: sessionData not found");
      this.toastr.error("Access To Adding New Semester Denied", "ERROR");
    }
    else{
      console.log("openCreateUserDialog: sessionData found");
      const userDetails = JSON.parse(sessionData);
      console.log(userDetails.user.role);
      this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
        next: (response: RolePermission[]) => {
          const permission = response.find(
            (item) => item.permissionType === 'add_new_semester'
          );
          console.log(permission);
          
          if (!permission || !permission.actions.includes('allow')) {
            //Perhaps use a toastr to display denied message
            console.log("Permission for adding new semesters not found")
            this.toastr.error("Access To Adding New Semester Denied", "ERROR");
          }
          else{
            const dialogRef = this.dialog.open(NewSemDialogComponent, {
              width: '700px',
              panelClass: 'custom-dialog-container',
              //data: { name: 'Angular User' }, // Optional data to pass to dialog
            });
      
            dialogRef.afterClosed().subscribe(result => {
              console.log('Dialog closed. Result:', result);
            });
          }
          console.log("Permission check completed")
        },
        error: (err) => console.log("Error in permission check", err)
      });      
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