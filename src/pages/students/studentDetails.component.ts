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
  
    imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule, CommonModule, FormsModule],
    styleUrl: './studentDetails.component.scss'
})

export class StudentDetailsComponent{
    studentID: string = "";
    semester: string ="";

    constructor(private route: ActivatedRoute){}

    ngOnInit() {
        // Fetch the ID from the URL
        this.studentID = this.route.snapshot.paramMap.get('studentID')!;
        this.semester = sessionStorage.getItem('semesterID')!;
        console.log('Selected Course and Lab group:', this.studentID, this.semester);
    }    
}