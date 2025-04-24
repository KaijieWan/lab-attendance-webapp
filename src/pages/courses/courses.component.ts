import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Injectable } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { ModuleService } from '../../service/module.service';
import { LabSessionService } from '../../service/labSession.service';
import { RefreshService } from '../../app/shared/refresh.service';
import { isEmpty } from 'rxjs';
import { UserService } from '../../service/user.service';
import { ToastrService } from 'ngx-toastr';
import { ClassGroupService } from '../../service/classGroup.service';
import { RolePermissionService } from '../../service/rolePermission.service';
import { CreateLabSessionComponent } from './createLabSession.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddNewModuleComponent } from './addNewModule.component';

interface ClassGroupDTO {
  classGroupId: {
      classGroupID: string;
      moduleCode: string
      semesterID: string;
  },
  module:{
      moduleCode: string
  }
}

interface RolePermission {
  permissionType: string,
  actions: string[];
}

@Component({
  selector: 'appCoursesPage',
  standalone: true,
  templateUrl: './courses.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule],
  styleUrl: './courses.component.scss'
})

@Injectable({
  providedIn: 'root'
})
export class CoursesComponent {
  semesterCourses: string[] = [];
  modulesAssigned: string = "";
  role: string = "";
  classGroups: ClassGroupDTO[] = [];
  courseId: string = "";

  constructor(private moduleService: ModuleService, private labSessionService: LabSessionService, private refreshService: RefreshService,
    private router: Router, private userService: UserService, private classGroupService: ClassGroupService,
    private toastr: ToastrService, private rolePermissionService: RolePermissionService, private dialog: MatDialog,
  ){
    const id = sessionStorage.getItem("id");    
    if(id){
      this.userService.getUser(parseInt(id)).subscribe({
        next: (response) => {
          this.modulesAssigned = response.modulesAssigned;
          this.role = response.role;
        }
      })
    }

    const storedCourses = sessionStorage.getItem('selectedCourses');
    const courses = storedCourses ? JSON.parse(storedCourses) : [];
    if(this.role==="super-admin"){
      this.semesterCourses = courses;
    }
    else{
      this.semesterCourses = courses.filter((item: string) => this.modulesAssigned.includes(item));  
    }
    
    if(this.semesterCourses.length == 0){
      this.refreshService.refresh$.subscribe(() => {
        const semester = sessionStorage.getItem('semesterID');
        if(semester){
          this.refreshData(semester);
        }
      })  
    }
  }
  
  ngOnInit() {
    
  }

  refreshData(semester: string){
    this.labSessionService.getDistinctModules(semester).subscribe({
      next: (response) => {
        console.log("Courses component: " + response);
        if(this.role==="super-admin"){
          this.semesterCourses = response;
        }
        else{
          this.semesterCourses = response.filter((item: string) => this.modulesAssigned.includes(item));
        }        
      },
      error: (err) => {
        console.error('Error fetching modules:', err);
      },
    })
  }

  navigateToLabGroups(courseId: string) {
    this.router.navigate([`/drawer/courses/${courseId}/labgroups`]);
  }

  fetchClassGroups(moduleCode: string, semesterID: string){
    this.classGroupService.fetchClassGroupsByModuleAndSemester(moduleCode, semesterID).subscribe({
        next: (response) => {
            console.log(response);
            this.classGroups = response;
        }
    });
}

openCreateLabSession(): void {
    console.log("openCreateLabSession");
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
      //Perhaps use a toastr to display denied message
      console.log("openCreateLabSession: sessionData not found");
      this.toastr.error("Access To Creating New Lab Session Denied");
    }
    else{
      console.log("openCreateUserDialog: sessionData found");
      const userDetails = JSON.parse(sessionData);
      console.log(userDetails.user.role);
      this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
        next: (response: RolePermission[]) => {
          const permission = response.find(
            (item) => item.permissionType === 'courses_page'
          );
          console.log(permission);
          
          if (!permission || !permission.actions.includes('create')) {
            //Perhaps use a toastr to display denied message
            console.log("Permission for allow creating of new lab session not found")
            this.toastr.error("Access To Creating New Lab Session Denied", "ERROR");
          }
          else{
            const dialogRef = this.dialog.open(CreateLabSessionComponent, {
              width: '1000px',
              panelClass: 'custom-dialog-container',
              data: { courseId: this.courseId }, // Optional data to pass to dialog
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

  openAddNewModules(){
    console.log("openAddNewModules");
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
      //Perhaps use a toastr to display denied message
      console.log("openAddNewModules: sessionData not found");
      this.toastr.error("Access To Creating New Lab Session Denied");
    }
    else{
      console.log("openAddNewModules: sessionData found");
      const userDetails = JSON.parse(sessionData);
      console.log(userDetails.user.role);
      this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
        next: (response: RolePermission[]) => {
          const permission = response.find(
            (item) => item.permissionType === 'courses_page'
          );
          console.log(permission);
          
          if (!permission || !permission.actions.includes('create')) {
            //Perhaps use a toastr to display denied message
            console.log("Permission for allowing adding of new modules not found")
            this.toastr.error("Access To Adding New Modules Denied", "ERROR");
          }
          else{
            const dialogRef = this.dialog.open(AddNewModuleComponent, {
              width: '1000px',
              panelClass: 'custom-dialog-container',
              data: { courseId: this.courseId }, // Optional data to pass to dialog
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