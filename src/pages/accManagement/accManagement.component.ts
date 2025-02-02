import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserDTO, UserService } from '../../service/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CreateUserDialogComponent } from './createUserDialog.component';
import { NewRoleDialogComponent } from './newRoleDialog.component';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, Subject } from 'rxjs';
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
  usersToDisplay: UserDTO[] = [];
  roles: string[] = [];
  totalPages = 0;
  currentPage = 0;
  pageSize = 15;
  searchTerm$ = new Subject<string>();

  constructor(private router: Router, private userService : UserService, private dialog: MatDialog,
    private rolePermissionService: RolePermissionService, private toastr: ToastrService
  ) {}
  
  ngOnInit() {
    this.fetchUsers(this.currentPage, this.pageSize);

    const filter = document.getElementById('filter');
    const filterList = document.getElementById('filter_list');
    if(filter && filterList){
      filter.addEventListener('click', (event) => {
        filterList.style.display="block";

        // Prevent the click from propagating to the document
        event.stopPropagation();

        // Add an event listener to the document
        document.addEventListener("click", () => {
          filterList.style.display = "none";
        });
      });
    }

    this.searchTerm$
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged() // Only emit if value changes
      )
      .subscribe((term) => {
        this.usersToDisplay = term
          ? this.users.filter(user =>
              user.name.toLowerCase().includes(term.toLowerCase()) ||
              user.role.toLowerCase().includes(term.toLowerCase()) ||
              user.email.toLowerCase().includes(term.toLowerCase()) ||
              user.username.toLowerCase().includes(term.toLowerCase())
            )
          : [...this.users];
      });
  }

  handleOutsideClick = (event: MouseEvent):void => {
    const filterList = document.getElementById("filter_list");
  
    if (filterList) {
      const isClickInside = filterList.contains(event.target as Node);
      filterList.style.display = "none";
      if (!isClickInside) {
        //filterList.style.display = "none";
        // Remove the event listener after hiding
        document.removeEventListener("click", this.handleOutsideClick);
      }
    }
  };

  onRoleSelected(role: string){
    this.usersToDisplay = this.users.filter(user => user.role === role);
    const filterList = document.getElementById('filter_list');
    const filterStatus = document.getElementById("filter_status");
    if (filterList && filterStatus) {
      //console.log('Hiding filter list'); // Log that we're hiding the filter list
      filterList.style.display = "none"; // Hide the filter list
      filterStatus.style.display = "block"      
    } else {
      console.error('Filter list not found'); // Log if the element is not found
    }
  }

  onSort(compareString: string){
    const filterStatus = document.getElementById('filter_status');
    if(filterStatus){
      filterStatus.style.display = "block"
    }
    switch(compareString){
      case "username": 
        this.usersToDisplay = this.usersToDisplay.sort((a,b) => a.username.localeCompare(b.username));
        break;
      case "name": 
        this.usersToDisplay = this.usersToDisplay.sort((a,b) => a.name.localeCompare(b.name));
        break;
      case "email": 
        this.usersToDisplay = this.usersToDisplay.sort((a,b) => a.email.localeCompare(b.email));
        break;
    }    
  }

  clearFilter() {
    this.usersToDisplay = [...this.users];
    const filterStatus = document.getElementById("filter_status");
    if (filterStatus) {
      filterStatus.style.display = "none"; // Hide the filter list
    }
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLSelectElement).value;
    this.searchTerm$.next(term); // Push the term into the Subject
  }

  fetchUsers(page: number, size: number): void {
    this.userService.getAllUsers(page, size).subscribe({
      next: (response) => {
        this.users = response.content;
        this.usersToDisplay = [...this.users];
        this.roles = this.users.map(user => user.role);
        console.log(this.roles);
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

  navigateToHierarchy(){
    this.router.navigate([`/drawer/accManagement/accHierarchy`])
  }
}