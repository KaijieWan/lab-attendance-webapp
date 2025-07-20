import { DatePipe, CommonModule } from "@angular/common";
import { Component, ElementRef, Injectable, NgModule, Pipe, PipeTransform, Renderer2 } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet, RouterModule, ActivatedRoute } from "@angular/router";
import { ClassGroupService } from "../../service/classGroup.service";
import { LabSessionService } from "../../service/labSession.service";
import moment from 'moment';
import { AttendanceService } from "../../service/attendance.service";
import { ToastrModule, ToastrService } from "ngx-toastr";
import Swal from 'sweetalert2';
import { RolePermissionService } from "../../service/rolePermission.service";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatOptionModule } from "@angular/material/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { RefreshService } from "../../app/shared/refresh.service";
import { CustomTimePipe } from "../courses/labSessionDetails.component";

export type StudentAttendance = {
    isMakeUpSession: boolean;
    student: {
        studentEnrolledClassGroupSet: [];
        fullName: string;
        student_ID: string;
    };
    labsession: {
        classGroupID: {
            classGroupID: string;
            moduleCode: string;
            semesterID: string;
        };
        labID: {
            labName: string;
            room: number;
        };
        classGroup: {
            classGroupId: {
                classGroupID: string;
                moduleCode: string;
                semesterID: string;
            };
            module: {
                classGroups: [];
                moduleCode: string;
            };
            studentEnrolledClassGroups: [];
        };
        lab: {
            id: {
                labName: string;
                room: number;
            };
        };
        endTime: string;
        date: string;
        labSessionID: string;
        startTime: string;
    };
    absentDetails: null;
    semester: {
        semester_ID: string;
        semester: number;
        annualYear: string;
        week1StartDate: string;
        semesterID: string;
    };
    status: string;
    absent_ID: string | null;
    lab_SessionID: string;
    semester_ID: string;
    student_ID: string;
    remarks: string;
    attendance_ID: number;
};

interface RolePermission {
    permissionType: string,
    actions: string[];
}

interface LabSessionDetailsDTO {
    date: string;
    startTime: string;
    endTime: string;
    classGroupID: {
        classGroupID: string;
        moduleCode: string;
        semesterID: string;
    };
    isMakeUpLabSession: boolean;
    lab: {
        id: {
            labName: string;
            room: number;
        };
        capacity: number;
    };
    labSessionID: string;
}

@Component({
    selector: 'appStudentDetailsPage',
    standalone: true,
    templateUrl: './studentDetails.component.html',
  
    imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule, CommonModule, FormsModule,
        MatCardModule, MatIconModule, MatBadgeModule, MatButtonModule, MatSelectModule, MatTableModule, CustomTimePipe,
        MatDialogModule, MatButtonModule, CommonModule, MatListModule, MatFormFieldModule, FormsModule, MatOptionModule
    ],
    styleUrl: './studentDetails.component.scss'
})

export class StudentDetailsComponent{
    studentID: string = "";
    semester: string = "";
    studentName: string = "";
    attendanceData: StudentAttendance[] = [];
    overallAttendance: string = "";
    alert: string = ""
    semesterMessage: string = "No semester selected";
    textColor: string = 'red';
    attendanceModules: string[] = [];

    constructor(private route: ActivatedRoute, private attendanceService: AttendanceService, private refreshService: RefreshService,        
        private customTimePipe: CustomTimePipe,
    ){}

    getStatusColor(status: string): string {
        switch (status) {
          case 'Present':
            return 'green';
          case 'Absent':
            return 'red';
          case 'Late':
            return 'orange';
          case 'Excused':
            return 'blue';
          case 'Pending':
            return 'orange';
          case 'Withdrawn':
            return 'gray';
          default:
            return 'black';
        }
      }
      

    ngOnInit() {
        // Fetch the ID from the URL
        this.studentID = this.route.snapshot.paramMap.get('studentID')!;
        this.studentName = sessionStorage.getItem('selectedStudentName')!;
        this.overallAttendance = "0";

        this.refreshService.refresh$.subscribe(() => {
            this.attendanceData = [];
            this.attendanceModules = [];
            this.overallAttendance = "0";
            this.alert = "";

            this.semester = sessionStorage.getItem('semesterID')!;
            //console.log('Selected Student:', this.studentID, this.semester);
            this.semesterMessage = this.semester;

            this.fetchAttendanceByStudentIdAndSemester(this.semester, this.studentID);
        })        
    }

    fetchAttendanceByStudentIdAndSemester(semesterID: string, studentID: string){
        this.attendanceService.getAttendanceByStudentIdAndSemester(semesterID, studentID).subscribe({
            next: (response) => {
                this.attendanceData = response;
                console.log(this.attendanceData);
                this.overallAttendance = this.calculateOverallAttendance(this.attendanceData).toFixed(2);
                if(this.overallAttendance<"75.00"){
                    this.textColor = "red";
                }else{
                    this.textColor = "green";
                }
                console.log(this.overallAttendance);

                this.attendanceModules = Array.from(
                    new Set(this.attendanceData.map(item => item.labsession.classGroupID.moduleCode))
                  );
            },
            error: (err) => {
                console.error("Error fetching attendance: ", err);
                this.alert = "No attendance data found for this student in the specified semester"
            }
        })
    }

    calculateOverallAttendance(data: StudentAttendance[]) {
        const relevantStatuses = data.filter(
            (attendance) =>
                ["Present", "Absent", "Late", "Excused"].includes(attendance.status) && !attendance.isMakeUpSession
        );
        const presentCount = relevantStatuses.filter(
            (attendance) =>
                attendance.status === "Present" || attendance.status === "Excused" || attendance.status === "Late"
        ).length;
        const totalCount = relevantStatuses.length;
        return totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
    }

    getFilteredAttendance(module: string) {
        return this.attendanceData.filter(attendance => attendance.labsession.classGroupID.moduleCode === module);
      }
}