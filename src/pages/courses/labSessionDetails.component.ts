import { DatePipe, CommonModule } from "@angular/common";
import { Component, ElementRef, NgModule, Pipe, PipeTransform, Renderer2 } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet, RouterModule, ActivatedRoute } from "@angular/router";
import { ClassGroupService } from "../../service/classGroup.service";
import { LabSessionService } from "../../service/labSession.service";
import moment from 'moment';
import { AttendanceService } from "../../service/attendance.service";
import { ToastrModule, ToastrService } from "ngx-toastr";
import Swal from 'sweetalert2';

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

@Pipe({
    name: 'customTimePipe',
    standalone: true
})
export class CustomTimePipe implements PipeTransform {
    transform(value: any, args?: any): any {
      return moment(value,'HH:mm').format("HH:mm");
    }
}

@Component({
    selector: 'appLabSessionDetailsPage',
    standalone: true,
    templateUrl: './labSessionDetails.component.html',
  
    imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule, CustomTimePipe, CommonModule, FormsModule],
    styleUrl: './labSessionDetails.component.scss'
})

export class LabSessionDetailsComponent{
    courseId: string = "";
    labGroupId: string = "";
    labSessionDetails: LabSessionDetailsDTO = {
        date: "",
        startTime: "",
        endTime: "",
        classGroupID: {
            classGroupID: "",
            moduleCode: "",
            semesterID: ""
        },
        isMakeUpLabSession: false,
        lab: {
            id: {
                labName: "",
                room: 0
            },
            capacity: 0
        },
        labSessionID: ""
    };
    attendancesToDisplay: any[] = [];
    labSessions: LabSessionDetailsDTO[] = [];
    dates: string[] = [];
    selectedDate: string = "";

    constructor(private route: ActivatedRoute, private labSessionService: LabSessionService,
        private attendanceService: AttendanceService, private renderer: Renderer2, private el: ElementRef,
        private toastr: ToastrService
    ) {}

    ngOnInit() {
        // Fetch the ID from the URL
        this.courseId = this.route.snapshot.paramMap.get('id')!;
        this.labGroupId = this.route.snapshot.paramMap.get('classGroupId')!;
        const semester = sessionStorage.getItem('semesterID');
        console.log('Selected Course and Lab group:', this.courseId, this.labGroupId);

        /*const labSessionDetails = sessionStorage.getItem('selectedLabSession');
        if(labSessionDetails){
            this.labSessionDetails = JSON.parse(labSessionDetails);
        }*/

        //console.log(this.labSessionDetails);

        //this.fetchAllAttendances(this.labSessionDetails.labSessionID);
        if(semester){
            this.fetchLabSessions(this.labGroupId, this.courseId, semester);
        }
    }

    fetchLabSessions(classGroupId: string, moduleCode: string, semesterId: string){
        this.labSessionService.getSpecificLabSessions(classGroupId, moduleCode, semesterId).subscribe({
            next: (response) => {
                console.log(response);
                this.labSessions = response;
                this.labSessions.sort((b, a) => new Date(b.date).getTime() - new Date(a.date).getTime());
                this.dates = this.labSessions.map(labSession => labSession.date);
            }
        })
    }

    fetchAllAttendances(date: string){
        const labSession = this.labSessions.find(item => item.date === date);
        const labSessionId = labSession?.labSessionID;
        if(labSessionId){
            this.attendanceService.getAllAttendancesByLabSessionId(labSessionId).subscribe({
                next: (response) => {
                    console.log(response);
                    this.attendancesToDisplay = response;
                },
                error: (err) => {
                    console.error(err.error.message);
                }
            })
        }        
    }

    onDateChange(e: Event){
        const selectedDate = (e.target as HTMLSelectElement).value;
        this.fetchAllAttendances(selectedDate);
    }

    onStatusChange(newStatus: string, studentId: string) {
        console.log(`Status for student ${studentId} changed to: ${newStatus}`);
        // You can trigger additional logic here, e.g., opening a pop-up, showing a toast, or updating the backend.
        const submitChangeButton = document.getElementById(`submitChangeButton_${studentId}`);
        if(submitChangeButton){
            submitChangeButton.style.display = "block"
        }
        sessionStorage.setItem(studentId, newStatus);
      }

      submitStatusChange(studentId:string, attendanceID: string){
        Swal.fire({
            title: "Confirm change of status?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Submit changes!"
          }).then((result) => {
            if (result.isConfirmed) {
              const attendanceChangePayload = {
                attendanceID: Number(attendanceID),
                status: sessionStorage.getItem(studentId),
                approverUsername: sessionStorage.getItem('id'),
              }
              this.attendanceService.markAttendance(attendanceChangePayload).subscribe({
                next: (response) => {
                    console.log(response);
                },
                error: (err) =>{
                    console.error(err.error.message);
                }
              })

              Swal.fire("Submitted!", "Status of attendace changed.", "success");
              const submitChangeButton = document.getElementById(`submitChangeButton_${studentId}`);
              if(submitChangeButton){
                submitChangeButton.style.display = "none"
              }
            }
            
          });
      }

      openRemarksDialog(studentName: string, originalRemarks: string, attendanceID: string){
        Swal.fire({
            title: `Remarks for ${studentName}'s attendance`,
            input: 'text',
            inputPlaceholder: `${originalRemarks}`,
            showCancelButton: true,
            confirmButtonText: 'Submit',
            preConfirm: (value) => {
              if (value.length > 1000) {
                    Swal.showValidationMessage('!');
                    return false;
                }
              else if (value.length == 0){
                    Swal.showValidationMessage('Please enter a remark or select Cancel!');
                    return false;
              }
                return value;
            }
          }).then((result) => {
            if (result.isConfirmed) {
              const remarksPayload = {
                attendanceID: Number(attendanceID),
                newRemarks: result.value,
              }
              console.log(`Remarks entered for ${studentName}`, result.value);
              this.attendanceService.updateRemarks(remarksPayload).subscribe({
                next: (response) => {
                    console.log(response);
                },
                error: (err) =>{
                    console.error(err.error.message);
                }
              })

              Swal.fire('Submitted!', `Remarks entered: ${result.value}`, 'success');
            }
          });
      }

}