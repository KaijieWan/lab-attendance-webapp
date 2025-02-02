import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { ModuleService } from '../../service/module.service';
import { LabSessionService } from '../../service/labSession.service';
import { RefreshService } from '../../app/shared/refresh.service';
import { isEmpty } from 'rxjs';

@Component({
  selector: 'appCoursesPage',
  standalone: true,
  templateUrl: './courses.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule],
  styleUrl: './courses.component.scss'
})

export class CoursesComponent {
  semesterCourses: string[] = [];

  constructor(private moduleService: ModuleService, private labSessionService: LabSessionService, private refreshService: RefreshService,
    private router: Router
  ){
  }
  
  ngOnInit() {
    const storedCourses = sessionStorage.getItem('selectedCourses');
    const courses = storedCourses ? JSON.parse(storedCourses) : [];
    this.semesterCourses = courses;
    if(this.semesterCourses.length == 0){
      this.refreshService.refresh$.subscribe(() => {
        const semester = sessionStorage.getItem('semesterID');
        if(semester){
          this.refreshData(semester);
        }
      })  
    }
  }

  refreshData(semester: string){
    this.labSessionService.getDistinctModules(semester).subscribe({
      next: (response) => {
        console.log("Courses component: " + response);
        this.semesterCourses = response;
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