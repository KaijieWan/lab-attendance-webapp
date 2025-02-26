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
import { AccHierarchyComponent } from './accHierarchy.component';
import Swal from 'sweetalert2';
import { ModuleService } from '../../service/module.service';


interface RolePermission {
  permissionType: string,
  actions: string[];
}

@Component({
  selector: 'app-accManagement-page',
  standalone: true,
  templateUrl: './accManagement.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, MatDialogModule, MatButtonModule, AccHierarchyComponent],
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
  filtererdUsersBasedOnRole: UserDTO[] = [];
  roleFiltered: boolean = false;
  roles: string[] = [];
  distinctRoles: string[] = [];
  totalPages = 0;
  currentPage = 0;
  pageSize = 15;
  searchTerm$ = new Subject<string>();
  modules: string[] = [];

  constructor(private router: Router, private userService : UserService, private dialog: MatDialog,
    private rolePermissionService: RolePermissionService, private toastr: ToastrService,
    private moduleService: ModuleService
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
        if(this.roleFiltered){
          this.usersToDisplay = term
          ? this.filtererdUsersBasedOnRole.filter(user =>
              user.name.toLowerCase().includes(term.toLowerCase()) ||
              user.role.toLowerCase().includes(term.toLowerCase()) ||
              user.email.toLowerCase().includes(term.toLowerCase()) ||
              user.username.toLowerCase().includes(term.toLowerCase())
            )
          : [...this.filtererdUsersBasedOnRole];
        }
        else{
          this.usersToDisplay = term
          ? this.users.filter(user =>
              user.name.toLowerCase().includes(term.toLowerCase()) ||
              user.role.toLowerCase().includes(term.toLowerCase()) ||
              user.email.toLowerCase().includes(term.toLowerCase()) ||
              user.username.toLowerCase().includes(term.toLowerCase())
            )
          : [...this.users];
        }        
      });

      this.rolePermissionService.getDistinctRoles().subscribe({
        next: (response) => {
          this.distinctRoles = response;
        }
      })

      this.moduleService.getAllModules().subscribe({
        next: (response) => {
          this.modules = response.map((item: { moduleCode: any; }) => item.moduleCode);
          this.modules.sort((b, a) => b.localeCompare(a, undefined, { numeric: true }));
          console.log("Modules: " + this.modules);
        }
      })
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
    this.filtererdUsersBasedOnRole = this.users.filter(user => user.role === role);
    this.roleFiltered = true;

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
    this.roleFiltered = false;
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

  openUserDialog(username: string, currentRole: string, modulesAssigned: string, id: string){
    Swal.fire({
      title: `Edit ${username}'s Details`,
      html: `
        <label for="role">Role:</label>
        <select id="role" class="swal2-input">
          <option value="" disabled>Select available role</option>
        </select>
        <br><br>
        <label for="module-list"><b>Assigned Modules:</b></label>
        <br>
        <div id="module-list">
          ${this.modules
            .map(
              (module) => `
                <div class="swal-checkbox-container">
                  <input type="checkbox" value="${module}" class="module-checkbox"
                  ${modulesAssigned.includes(module) ? 'checked' : ''}>
                  <label class="swal-label">${module}</label>
                </div>
              `
            )
            .join('')}
        </div>
      `,
      customClass: {
        popup: 'swal-popup',
      },
      didOpen: () => {
        // Get the select element
        const selectElement = document.getElementById("role") as HTMLSelectElement;

        // Populate dropdown with distinctRoles array
        this.distinctRoles.forEach((role) => {
          let option = document.createElement("option");
          option.value = role;
          option.textContent = role;
          selectElement.appendChild(option);
        });

        // Set the selected value to currentRole
        if (currentRole) {
          selectElement.value = currentRole;
        }

        /*const selectedModules = Array.from(document.querySelectorAll('.module-checkbox:checked'))
          .map((checkbox) => (checkbox as HTMLInputElement).value);*/

        //return selectedModules;
      },
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const selectedRole = (document.getElementById("role") as HTMLSelectElement).value;

        const selectedModules = Array.from(document.querySelectorAll('.module-checkbox:checked'))
          .map((checkbox) => (checkbox as HTMLInputElement).value)
          .join(',');

        return { role: selectedRole, modules: selectedModules };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Final Confirmation",
          text: "Confirm Edit?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Confirm!",
          cancelButtonText: "Cancel"
        }).then((finalResult) => {
          if(finalResult.isConfirmed){
            let updatedModules = result.value?.modules;
            console.log(updatedModules);

            let updatedRole = "";

            if(result.value?.role){
              updatedRole = result.value?.role
            }            

            if(!updatedModules){
              updatedModules = "na";
            }
            
            console.log('User updated:', updatedModules, result.value?.role);

            this.userService.updateUser({email: "", username: "", name: "", role: updatedRole, modulesAssigned: updatedModules}, parseInt(id)).subscribe({
              next: (response) => {
                console.log(response);
                switch(response.status) {
                  case "SUCCESS" : {
                    console.log('Update successful:', response);
                    Swal.fire('Updated!', `Role: ${updatedRole}; Modules Assigned: ${updatedModules}`, 'success');
                    break;
                  }
                  default: {
                    console.log('Error Message:', response);
                    Swal.fire("Error!", "Something went wrong.", "error");
                    break;
                  }
                }
              },
              error: (err) => {
                console.error('Update failed:', err.error.message);
                Swal.fire("Error!", "Something went wrong.", "error");
              },              
            })

            
          }})
        
      }
    });
  }

  navigateToHierarchy(){
    this.router.navigate([`/drawer/accManagement/accHierarchy`])
  }

  handleNodeClick(roleName: string) {
    console.log('Received node click event from child:', roleName);
    this.onRoleSelected(roleName);
  }
}