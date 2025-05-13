import { CommonModule, DatePipe } from '@angular/common';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RefreshService } from '../../app/shared/refresh.service';
import { StudentDTO, StudentService } from '../../service/studentService';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { ClassGroupService } from '../../service/classGroup.service';
import { LabSessionService } from '../../service/labSession.service';
import { LabSession } from '../labSchedules/labCalendar.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';



@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatCardModule, MatIconModule,
     MatBadgeModule, MatButtonModule, MatSelectModule, MatTableModule, MatDialogModule, MatButtonModule, CommonModule, 
      MatListModule, MatFormFieldModule, FormsModule, MatOptionModule],
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent {
  students: StudentDTO[] = [];
  totalStudents = 0;
  totalAbsences = 35;
  pendingAbsences = 10;
  awaitingMakeUpAbsences = 5;
  selectedSemester: string = "";
  semesterID: string = "";
  labSessions: LabSession[]= [];
  
  selectedModule: string | null = null;
  modules: string[] = [];
  totalStudentsInModule = 0;
  attendanceRateByModule = 88.5;
  pendingAbsencesByModule = 5;
  lowAttendanceStudentsByModule = [{ studentName: 'John Doe', studentId: 'A123', attendanceRate: 65 }];
  attendanceDataByModule = [
    { name: 'Week 1', Attendance: 85 },
    { name: 'Week 2', Attendance: 90 },
    //...
  ];
  colorScheme = { domain: ['#2563eb'] };

  currentPage = 1;
  totalPages = 1;
  currentStudents = this.lowAttendanceStudentsByModule;
  indexOfFirstStudent = 0;

  statCards = [
    { title: 'Total Students', value: this.totalStudentsInModule, icon: 'user', description: 'Enrolled in selected module' },
    { title: 'Overall Attendance Rate', value: `${this.attendanceRateByModule.toFixed(1)}%`, icon: 'calendar', description: 'For the selected module' },
    { title: 'Pending Approval Absences', value: this.pendingAbsencesByModule, icon: 'x-circle', description: 'Requires administrative action' },
    { title: 'Students with Low Attendance', value: `${this.lowAttendanceStudentsByModule.length} Students`, icon: 'user-x', description: 'Below 75% attendance' }
  ];

  displayedColumns: string[] = ['name', 'id', 'attendance', 'action'];

  handleModuleSelect(value: string) {
    this.selectedModule = value;
    // Fetch and update related data...
  }

  handlePreviousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  handleNextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goToProfile(studentId: string) {
    window.location.href = `/students/${studentId}`;
  }

  constructor(private refreshService: RefreshService, private studentService: StudentService, private classGroupService: ClassGroupService,
    private labSessionService: LabSessionService
  ){
    this.studentService.getAllStudents().subscribe({
      next: (response) => {
        this.students = response;
        this.totalStudents = this.students.length;
        this.selectedSemester = "Across All Semesters"
      },
      error: (err) => console.log("Error in fetching students",  err)
    })

    this.refreshService.refresh$.subscribe(() => {
      this.semesterID = sessionStorage.getItem('semesterID')!;

      this.studentService.getStudentsBySemester(this.semesterID!).subscribe({
        next: (response) => {
          this.students = response;
          this.selectedSemester = this.semesterID;
          this.totalStudents = this.students.length;
        },
        error: (err) => console.log(`Error in fetching students for ${this.semesterID}`,  err)
      })

      this.labSessionService.getAllLabSessions().subscribe((response: LabSession[]) =>{
        this.labSessions = response;
        this.labSessions = this.labSessions.filter((labSession) => labSession.classGroupID.semesterID == this.semesterID);
        this.modules = Array.from(
          new Set(this.labSessions.map(item => item.classGroup.module.moduleCode))
        );
      })
    })

    
    
  }

  onModuleChange(selectedValue: string): void {
    this.selectedModule = selectedValue;
    this.classGroupService.fetchStudentsByModuleAndSemester(selectedValue, this.semesterID).subscribe({
      next: (response) => {        
        //console.log("Response for module", selectedValue, response);
        const groups = Object.values(response);
        console.log("Response for module", groups);
        this.totalStudentsInModule = (groups as any[][]).reduce((sum, arr) => sum + arr.length, 0);
      }
    })
  
    this.updateModuleAnalytics(selectedValue);
  }

  private updateModuleAnalytics(moduleCode: string): void {
    // You might be fetching data from a service or filtering local data
    /*const moduleData = this.analyticsService.getModuleAnalytics(moduleCode);
  
    this.totalStudentsInModule = moduleData.totalStudents;
    this.attendanceRateByModule = moduleData.attendanceRate;
    this.pendingAbsencesByModule = moduleData.pendingAbsences;
    this.lowAttendanceStudentsByModule = moduleData.lowAttendanceStudents;
    this.attendanceDataByModule = moduleData.weeklyAttendance; // for chart*/
  }
  
}