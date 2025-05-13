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
import { StudentDTO, StudentService } from "../../service/studentService";

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

@Injectable({
    providedIn: 'root'
  })
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
    currentView: 'general' | 'specific' = 'general';
    semester: string = "";
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
    students: StudentDTO[] = [];

    constructor(private route: ActivatedRoute, private labSessionService: LabSessionService,
        private attendanceService: AttendanceService, private renderer: Renderer2, private el: ElementRef,
        private toastr: ToastrService, private rolePermissionService: RolePermissionService,
        private classGroupService: ClassGroupService, private customTimePipe: CustomTimePipe,
        private studentService: StudentService,
    ) {}

    ngOnInit() {
        // Fetch the ID from the URL
        this.courseId = this.route.snapshot.paramMap.get('id')!;
        this.labGroupId = this.route.snapshot.paramMap.get('classGroupId')!;
        this.semester = sessionStorage.getItem('semesterID')!;
        console.log('Selected Course and Lab group:', this.courseId, this.labGroupId);

        /*const labSessionDetails = sessionStorage.getItem('selectedLabSession');
        if(labSessionDetails){
            this.labSessionDetails = JSON.parse(labSessionDetails);
        }*/

        //console.log(this.labSessionDetails);

        //this.fetchAllAttendances(this.labSessionDetails.labSessionID);
        if(this.semester){
            this.fetchLabSessions(this.labGroupId, this.courseId, this.semester);            
        }
    }

    fetchLabSessions(classGroupId: string, moduleCode: string, semesterId: string){
        this.labSessionService.getSpecificLabSessions(classGroupId, moduleCode, semesterId).subscribe({
            next: (response) => {
                console.log(response);
                this.labSessions = response;
                this.labSessions.sort((b, a) => new Date(b.date).getTime() - new Date(a.date).getTime());
                this.dates = this.labSessions.map(labSession => labSession.date);
                this.fetchAllAttendances(this.labSessions[0].date);
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

    switchView(view: 'general' | 'specific'): void {
        this.currentView = view;

        /*if(view=='general'){
            const deleteLabSessionButton = document.getElementById('deleteLabSessionButton');
            if(deleteLabSessionButton){
                deleteLabSessionButton.style.display = "none"
            }
        }*/
    }

    onDateChange(e: Event){
        const selectedDate = (e.target as HTMLSelectElement).value;
        this.fetchAllAttendances(selectedDate);
        const deleteLabSessionButton = document.getElementById('deleteLabSessionButton');
        if(deleteLabSessionButton){
            deleteLabSessionButton.style.display = "inline-flex"
        }

        const addStudentToLabSessionButton = document.getElementById('addStudentToLabSession');
        if(addStudentToLabSessionButton){
            addStudentToLabSessionButton.style.display = "inline-flex"
        }

        const labSession = this.labSessions.find(item => item.date === selectedDate);
        const currentDisplayedLabTime = document.getElementById('labSessionTime');
        if(currentDisplayedLabTime){
            currentDisplayedLabTime.textContent = `${this.customTimePipe.transform(labSession?.startTime!)} - ${this.customTimePipe.transform(labSession?.endTime!)}`;
        }
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

    deleteLabSession(selectedDate: string){
        const sessionData = sessionStorage.getItem('userDetails');
        if (!sessionData) {
            //Perhaps use a toastr to display denied message
            console.log("deleteLabSession: sessionData not found");
            this.toastr.error("Access To Deleting Lab Sessions Denied");
        }
        else{
            console.log("deleteLabSession: sessionData found");
            const userDetails = JSON.parse(sessionData);
            this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
                next: (response: RolePermission[]) => {
                    const permission = response.find(
                        (item) => item.permissionType === 'courses_page'
                    );
                    
                    if (!permission || !permission.actions.includes('delete')) {
                        //Perhaps use a toastr to display denied message
                        console.log("Permission for deleting lab session not found")
                        this.toastr.error("Access To Deleting Lab Sessions Denied", "ERROR");
                    }
                    else{
                        this.confirmDeleteLabSession(selectedDate);
                    }
                    console.log("Permission check completed")
                },
                error: (err) => console.log("Error in permission check", err)
            });      
        }
    }


    confirmDeleteLabSession(selectedDate: string){
        console.log(selectedDate);
        let labSessionToDelete_ID = "";
        this.labSessions.forEach((labSession) => {
            if(selectedDate === labSession.date){
                labSessionToDelete_ID = labSession.labSessionID;
            }
        })

        Swal.fire({
            title: "Confirm deletion of this lab session?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Delete Lab Session!"
          }).then((result) => {
            if (result.isConfirmed) {
              this.labSessionService.deleteLabSession(labSessionToDelete_ID).subscribe({
                next: (response) => {
                    console.log(response);
                },
                error: (err) =>{
                    console.error(err.error.message);
                }
              })

              Swal.fire("Deleted!", "Lab Session deleted.", "success");
              const deleteLabSessionButton = document.getElementById(`deleteLabSessionButton`);
              if(deleteLabSessionButton){
                deleteLabSessionButton.style.display = "none"
              }
            }            
          });
    }

    addStudentToLabSession(){
        const sessionData = sessionStorage.getItem('userDetails');
        if (!sessionData) {
            //Perhaps use a toastr to display denied message
            console.log("addStudentToLabSession: sessionData not found");
            this.toastr.error("Access To Adding Student To Lab Sessions Denied");
        }
        else{
            console.log("addStudentToLabSession: sessionData found");
            const userDetails = JSON.parse(sessionData);
            this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
                next: (response: RolePermission[]) => {
                    const permission = response.find(
                        (item) => item.permissionType === 'courses_page'
                    );
                    
                    if (!permission || !permission.actions.includes('update')) {
                        //Perhaps use a toastr to display denied message
                        console.log("Permission for adding student to lab sessions not found")
                        this.toastr.error("Access To Adding Student To Lab Sessions Denied", "ERROR");
                    }
                    else{
                        this.studentService.getStudentsBySemester(this.semester!).subscribe({
                            next: (response) => {
                              this.students = response;
                              //console.log(this.students);
                              this.confirmAddStudentToLabSession();
                            },
                            error: (err) => console.log("Error in fetching students",  err)
                          })                        
                    }
                    console.log("Permission check completed")
                },
                error: (err) => console.log("Error in permission check", err)
            });      
        }
    }

    confirmAddStudentToLabSession(){
        let selectedStudent = "";
        if(this.students){
            Swal.fire({
                title: 'Search for student from this semester (Student ID) to add',
                html: `
                <style>
                    .student-item {
                        list-style: none;
                        padding: 8px 12px;
                        transition: background-color 0.2s;
                    }
                    .student-item:hover {
                        background-color: #dbeafe; /* light blue */
                    }
                    .student-item.selected {
                        background-color: #93c5fd; /* darker blue for selected item */
                    }
                </style>
                <input type="text" id="searchInput" class="swal2-input" placeholder="Search student...">
                <ul id="studentList">
                    ${this.students.map(student => `<li class="student-item" style="cursor: pointer;">${student.Student_ID}</li>`).join("")}
                </ul>
                `,
                showCancelButton: true,
                confirmButtonText: 'Select',
                preConfirm: () => {
                    if (!selectedStudent) {
                        Swal.showValidationMessage('Please select a student');
                    }
                    return selectedStudent;
                },
                didOpen: () => {
                    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                    const studentItems = document.querySelectorAll('.student-item');
            
                    studentItems.forEach((item) => {
                        (item as HTMLElement).style.display = 'none';
                    });

                    searchInput.addEventListener('keyup', () => {
                        const filter = searchInput.value.toLowerCase();
                        if(filter.length!=0){
                            studentItems.forEach((item) => {
                                const text = item.textContent?.toLowerCase();
                                (item as HTMLElement).style.display = text!.includes(filter) ? 'block' : 'none';
                            });
                        } else{
                            studentItems.forEach((item) => {
                                (item as HTMLElement).style.display = 'none';
                            });
                        }
                    });

                    studentItems.forEach((item) => {
                        item.addEventListener('click', () => {
                          studentItems.forEach(i => i.classList.remove('selected'));
                          item.classList.add('selected');
                          selectedStudent = item.textContent!;
                        });
                      });
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    console.log("Selected student:", result.value);

                    if(this.attendancesToDisplay.find(attendance => attendance.student.Student_ID === result.value)){
                        this.toastr.error("This student is already added to this lab session", "ERROR");
                        return;
                    }   

                    console.log(this.selectedDate);
                    let labSessionID = "";
                    this.labSessions.forEach((labSession) => {
                        if(this.selectedDate === labSession.date){
                            labSessionID = labSession.labSessionID;
                        }
                    })

                    console.log("Attempting to create new attendance");
                      const attendancePayload = {
                        absentID: null,
                        labSessionID: labSessionID,
                        remarks: "",
                        semesterID: this.semester,
                        status: "Pending",
                        //Probably need to query if it is a make up for this student
                        isMakeUpSession: false,
                        studentID: result.value,
                      }

                      this.attendanceService.createAttendance(attendancePayload).subscribe({             
                        next: (response) => {
                          switch(response.status){
                              case "SUCCESS" : {
                                  console.log('Creation of attendance successful:', response);
                                  this.toastr.success("Added Student to Lab Session!", "SUCCESS");
                                  break;
                                }                    
                                default: {
                                  console.log('Error Message:', response);
                                  this.toastr.error(response.message, response.status);
                                  break;
                                }
                          }
                        },
                        error: (err) => {
                            console.error('Error creating attendance:', err);
                            this.toastr.error(err.error.message || 'Error: Attendance not created.');        
                        }
                      })
                }
            });
        }
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

    confirmDeleteStudent(studentID: string){       
        Swal.fire({
            title: `Confirm removal of ${studentID} from ${this.labGroupId}?`,
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Remove student!"
          }).then((result) => {
                if (result.isConfirmed) {
                this.classGroupService.deleteStudentFromClassGroup(studentID, this.courseId, this.labGroupId, this.semester).subscribe({
                    next : (response) => {
                        console.log(response);
                        Swal.fire("Removed!", `Student ${studentID} successfully removed from ${this.labGroupId}`, "success");
                    },
                    error: (err) =>{
                        console.log(err);
                        console.error(err.error.message);
                        this.toastr.error(err.error.message, "ERROR");
                    }
                })
            }            
          });
    }

    deleteStudentFromClassGroup(studentID: string){
        const sessionData = sessionStorage.getItem('userDetails');
        if (!sessionData) {
            //Perhaps use a toastr to display denied message
            console.log("deleteStudentFromClassGroup: sessionData not found");
            this.toastr.error("Access To Removing Student Denied");
        }
        else{
            console.log("deleteStudentFromClassGroup: sessionData found");
            const userDetails = JSON.parse(sessionData);
            this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
                next: (response: RolePermission[]) => {
                    const permission = response.find(
                        (item) => item.permissionType === 'courses_page'
                    );
                    
                    if (!permission || !permission.actions.includes('delete')) {
                        //Perhaps use a toastr to display denied message
                        console.log("Permission for deleting student from class group not found")
                        this.toastr.error("Access To Removing Student Denied", "ERROR");
                    }
                    else{
                        this.confirmDeleteStudent(studentID);
                    }
                    console.log("Permission check completed")
                },
                error: (err) => console.log("Error in permission check", err)
            });      
        }
    }

    addStudentToLabGroup(){
        Swal.fire({
            title: `Add student from ${this.courseId} by searching using their Name/ID`,
            html: `
              <input type="text" id="searchInput" class="swal2-input" placeholder="Search student..." onkeyup="filterStudents()">
              <ul id="studentList">
              </ul>
            `,
            showCancelButton: true,
            confirmButtonText: 'Select',
            didOpen: () => {
              // Get elements inside Swal
              const searchInput = document.getElementById('searchInput') as HTMLInputElement;
              const studentItems = document.querySelectorAll('.student-item');
        
              // Filter function
              searchInput.addEventListener('keyup', () => {
                const filter = searchInput.value.toLowerCase();
                studentItems.forEach((item) => {
                  const text = item.textContent?.toLowerCase() || '';
                  (item as HTMLElement).style.display = text.includes(filter) ? 'block' : 'none';
                });
              });
        
              // Select student on click
              studentItems.forEach((item) => {
                item.addEventListener('click', () => {
                  Swal.fire(`You selected: ${item.textContent}`);
                });
              });
            }
          });
    }

}