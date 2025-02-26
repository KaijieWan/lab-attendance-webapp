import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Injectable } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { ModuleService } from '../../service/module.service';
import { LabSessionService } from '../../service/labSession.service';
import { RefreshService } from '../../app/shared/refresh.service';
import { isEmpty } from 'rxjs';
import { UserService } from '../../service/user.service';

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

  constructor(private moduleService: ModuleService, private labSessionService: LabSessionService, private refreshService: RefreshService,
    private router: Router, private userService: UserService,
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
  
}