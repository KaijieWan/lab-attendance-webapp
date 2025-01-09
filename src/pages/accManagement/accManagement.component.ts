import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserDTO, UserService } from '../../service/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CreateUserDialogComponent } from './createUserDialog.component';
import { NewRoleDialogComponent } from './newRoleDialog.component';
import { catchError, map, of } from 'rxjs';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '../../lib/auth.interceptor';

interface RolePermission {
  permissionType: string,
  actions: string[];
}

@Component({
  selector: 'app-accManagement-page',
  standalone: true,
  templateUrl: './accManagement.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, MatDialogModule, MatButtonModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // Allow multiple interceptors
    }
  ],
  styleUrl: './accManagement.component.scss'
})

export class AccManagementComponent {
  users: UserDTO[] = [];
  totalPages = 0;
  currentPage = 0;
  pageSize = 15;

  constructor(private router: Router, private userService : UserService, private dialog: MatDialog,
    private rolePermissionService: RolePermissionService, private toastr: ToastrService
  ) {}
  
  ngOnInit() {
    this.fetchUsers(this.currentPage, this.pageSize);
  }

  fetchUsers(page: number, size: number): void {
    this.userService.getAllUsers(page, size).subscribe({
      next: (response) => {
        this.users = response.content;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    })
  }

  onPageChange(newPage: number): void {
    this.fetchUsers(newPage, this.pageSize);
  }

  openCreateUserDialog(): void {
    console.log("openCreateUserDialog");
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
      //Perhaps use a toastr to display denied message
      console.log("openCreateUserDialog: sessionData not found");
      this.toastr.error("Access To Creating New User Denied");
    }
    else{
      console.log("openCreateUserDialog: sessionData found");
      const userDetails = JSON.parse(sessionData);
      console.log(userDetails.user.role);
      this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
        next: (response: RolePermission[]) => {
          const permission = response.find(
            (item) => item.permissionType === 'create_new_user'
          );
          console.log(permission);
          
          if (!permission || !permission.actions.includes('allow')) {
            //Perhaps use a toastr to display denied message
            console.log("Permission for allow creating of user not found")
            this.toastr.error("Access To Creating New User Denied", "ERROR");
          }
          else{
            const dialogRef = this.dialog.open(CreateUserDialogComponent, {
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

  openNewRoleDialog(): void {
    console.log("openCreateUserDialog");
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
      //Perhaps use a toastr to display denied message
      console.log("openCreateUserDialog: sessionData not found");
      this.toastr.error("Access To Role Management Denied");
    }
    else{
      console.log("openCreateUserDialog: sessionData found");
      const userDetails = JSON.parse(sessionData);
      console.log(userDetails.user.role);
      this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
        next: (response: RolePermission[]) => {
          const permission = response.find(
            (item) => item.permissionType === 'role_management'
          );
          console.log(permission);
          
          if (!permission || !permission.actions.includes('allow')) {
            //Perhaps use a toastr to display denied message
            console.log("Permission for allow creating of user not found")
            this.toastr.error("Access To Role Management Denied", "ERROR");
          }
          else{
            const dialogRef = this.dialog.open(NewRoleDialogComponent, {
              width: '1000px',
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
}