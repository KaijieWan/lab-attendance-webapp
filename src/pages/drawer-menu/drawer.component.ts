import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Injectable, ViewChild } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { UserService } from '../../service/user.service';
import { ToastrService } from 'ngx-toastr';
import { RolePermissionService } from '../../service/rolePermission.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NewSemDialogComponent } from './newSemDialog.component';
import { SemesterDTO, SemesterService } from '../../service/semester.service';
import { CoursesComponent } from '../courses/courses.component';
import { RefreshService } from '../../app/shared/refresh.service';
import { LabSessionService } from '../../service/labSession.service';

interface RolePermission{
  permissionType: string,
  actions: string[];
}

@Component({
  selector: 'app-drawer',
  standalone: true,
  templateUrl: './drawer.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, RouterModule, CommonModule, MatDialogModule, MatButtonModule, CoursesComponent],
  styleUrl: './drawer.component.scss',
})

@Injectable({
  providedIn: 'root'
})
export class DrawerComponent {
  date = new Date();
  username: string = '';
  name: string = '';
  semesters: SemesterDTO[] = [];
  semesterID: string = "";
  semesterCourses: string[] = [];

  constructor(private router: Router, private userService : UserService, private toastr: ToastrService,
    private rolePermissionService: RolePermissionService, private dialog: MatDialog,
    private semesterService: SemesterService, private refreshService: RefreshService,
    private labSessionService: LabSessionService, private eRef: ElementRef
  ) {}

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
    
    this.semesterService.getAllSemesters().subscribe({
      next: (response) => {
        this.semesters = response;
      },
      error : (err) => {
        console.error("Error getting semesters: ", err.error.message);
      }
    })
    
    const dropdown = document.getElementById('dropdown');
    const dropdownArrow = document.getElementById('arrow-icon')    
    if(dropdown && dropdownArrow){
      dropdown.addEventListener("mouseover", function() {
        dropdownArrow.textContent = "arrow_drop_up"
      });

      dropdown.addEventListener("mouseleave", function() {
        dropdownArrow.textContent = "arrow_drop_down"
      })
    }

    const dropdownMenuList = document.getElementById('dropdownMenuList');
    const dropdownMenu = document.getElementById('dropdown-menu');
    if(dropdownMenuList && dropdownMenu){
      dropdownMenuList.addEventListener("click", function() {
        dropdownMenu.style.display = "none"
      });
    }
  }

  changeSemester(semesterID: string){
    this.semesterID = semesterID;
    sessionStorage.setItem('semesterID', semesterID);
    let week1StartDate: Date = new Date(
      this.semesters.find((semester) => semester.semester_ID === semesterID)?.week1StartDate ?? new Date()
    );
    sessionStorage.setItem('week1StartDate', week1StartDate.toISOString());
    
    
    this.refreshService.triggerRefresh();

    //Try to call the labSession API to preload the courses data first
    // just in case the user changes the semester before going to the
    // courses page. Then check on the courses page to see if 
    // there is any courses data loaded already, if there is don't need
    // to call the API and reload the courses data again
    this.labSessionService.getDistinctModules(semesterID).subscribe({
      next: (response) => {
        console.log("Drawer component: " + response);
        this.semesterCourses = response;
        sessionStorage.setItem('selectedCourses', JSON.stringify(this.semesterCourses));
      },
      error : (err) => {
        console.error('Error fetching modules:', err);
      }
    })
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
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

}