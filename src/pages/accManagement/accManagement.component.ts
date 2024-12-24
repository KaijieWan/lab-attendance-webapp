import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserDTO, UserService } from '../../service/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CreateUserDialogComponent } from './createUserDialog.component';
import { NewRoleDialogComponent } from './newRoleDialog.component';

@Component({
  selector: 'app-accManagement-page',
  standalone: true,
  templateUrl: './accManagement.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, MatDialogModule, MatButtonModule],
  styleUrl: './accManagement.component.scss'
})

export class AccManagementComponent {
  users: UserDTO[] = [];
  totalPages = 0;
  currentPage = 0;
  pageSize = 15;

  constructor(private router: Router, private userService : UserService, private dialog: MatDialog) {}
  
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
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '700px',
      panelClass: 'custom-dialog-container',
      //data: { name: 'Angular User' }, // Optional data to pass to dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed. Result:', result);
    });
  }

  openNewRoleDialog(): void {
    const dialogRef = this.dialog.open(NewRoleDialogComponent, {
      width: '1000px',
      panelClass: 'custom-dialog-container',
      //data: { name: 'Angular User' }, // Optional data to pass to dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed. Result:', result);
    });
  }
}