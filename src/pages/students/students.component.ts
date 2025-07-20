import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Pipe } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { StudentDTO, StudentService } from '../../service/studentService';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { RefreshService } from '../../app/shared/refresh.service';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { EnrollStudentDialogComponent } from './enrollStudentDialog.component';

interface RolePermission {
  permissionType: string,
  actions: string[];
}

@Pipe({name: 'round'})
export class RoundPipe {
  transform (input:number) {
    return Math.floor(input);
  }
}

@Component({
  selector: 'app-students-page',
  standalone: true,
  templateUrl: './students.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule],
  styleUrl: './students.component.scss'
})

export class StudentsComponent {
  currentPage: number = 0;
  studentsPerPage: number = 20;  // Change this number to control how many students per page
  totalPages: number = 0;
  students: StudentDTO[] = [];
  studentsToDisplay: StudentDTO[] = [];
  searchTerm$ = new Subject<string>();
  semesterID: string | null = "";
  semesterNo: any;

  constructor(private studentService: StudentService, private refreshService: RefreshService, private router: Router,
    private rolePermissionService: RolePermissionService, private toastr: ToastrService,
    private dialog: MatDialog
  ){
    this.studentService.getAllStudents().subscribe({
      next: (response) => {
        this.students = response;
        this.totalPages = Math.ceil(this.students.length/this.studentsPerPage);
        this.onPageChange(0);
      },
      error: (err) => console.log("Error in fetching students",  err)
    })

    this.refreshService.refresh$.subscribe(() => {
      this.semesterID = sessionStorage.getItem('semesterID');

      this.studentService.getStudentsBySemester(this.semesterID!).subscribe({
        next: (response) => {
          this.students = response;
          this.totalPages = Math.ceil(this.students.length/this.studentsPerPage);
          this.onPageChange(0);
        },
        error: (err) => console.log(`Error in fetching students for ${this.semesterID}`,  err)
      })
    }) 
  }

  ngOnInit() {    

    this.searchTerm$
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged() // Only emit if value changes
      )
      .subscribe((term) => {
        if (term) {
          // Filter students based on search term
          this.studentsToDisplay = this.students.filter(student =>
            student.Student_ID.toLowerCase().includes(term.toLowerCase()) ||
            student.fullName.toLowerCase().includes(term.toLowerCase())
          );
        } else {
          // Restore paginated format
          this.updateStudentsForCurrentPage();
        }
      });
  }
  fetchAllLabSessions() {
    throw new Error('Method not implemented.');
  }
  getUserData(userID: any) {
    throw new Error('Method not implemented.');
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.currentPage = newPage;
      this.updateStudentsForCurrentPage();
    }
  }

  updateStudentsForCurrentPage(): void {
    const startIndex = this.currentPage * this.studentsPerPage;
    const endIndex = startIndex + this.studentsPerPage;
    this.studentsToDisplay = this.students.slice(startIndex, endIndex);
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLSelectElement).value;
    this.searchTerm$.next(term); // Push the term into the Subject
  }

  navigateToStudentDetails(studentID: string, fullName: string){
    this.router.navigate([`/drawer/students/${studentID}`]);
    sessionStorage.setItem("selectedStudentName", fullName);
  }

  addNewStudent(){
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
        console.log("addNewStudent: sessionData not found");
        this.toastr.error("Access To Creating new Student Denied");
    }
    else{
        console.log("addNewStudent: sessionData found");
        const userDetails = JSON.parse(sessionData);
        this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
            next: (response: RolePermission[]) => {
                const permission = response.find(
                    (item) => item.permissionType === 'students_page'
                );
                
                if (!permission || !permission.actions.includes('create')) {
                    //Perhaps use a toastr to display denied message
                    console.log("Permission for creating new student not found")
                    this.toastr.error("Access To Creating new Student Denied", "ERROR");
                }
                else{
                    this.confirmCreateNewStudent();
                }
                console.log("Permission check completed")
            },
            error: (err) => console.log("Error in permission check", err)
        });      
    }
  }

  confirmCreateNewStudent(){  
    Swal.fire({
      title: 'Create new student - Enter student details',
      html: `
        <input type="text" id="input1" class="swal2-input" placeholder="Student ID">
        <input type="text" id="input2" class="swal2-input" placeholder="Student Name">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      preConfirm: () => {
        const input1 = (document.getElementById('input1') as HTMLInputElement).value.trim();
        const input2 = (document.getElementById('input2') as HTMLInputElement).value.trim();
    
        if (!input1 || !input2) {
          Swal.showValidationMessage('Please fill in both fields');
          return;
        }
    
        return { studentId: input1, studentName: input2 };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        console.log('Student ID:', result.value.studentId.toUpperCase());
        console.log('Student Name:', result.value.studentName.toUpperCase());
        const studentPayload = {
          studentID: result.value.studentId.toUpperCase(),
          fullName: result.value.studentName.toUpperCase()
        };

        this.studentService.createStudent(studentPayload).subscribe({             
          next: (response) => {
            switch(response.status){
                case "SUCCESS" : {
                    console.log('Creation of new student:', response);
                    this.toastr.success("Created New Student!", "SUCCESS");
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
              console.error('Error creating student:', err);
              this.toastr.error(err.error.message);         
          }
        })
      }
    });               

  }

  openEnrollDialog(studentID: string){
    console.log("openEnrollDialog");
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
      //Perhaps use a toastr to display denied message
      console.log("openEnrollDialog: sessionData not found");
      this.toastr.error("Access To Updating of Student Details Denied");
    }
    else{
      console.log("openEnrollDialog: sessionData found");
      const userDetails = JSON.parse(sessionData);
      console.log(userDetails.user.role);
      this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
        next: (response: RolePermission[]) => {
          const permission = response.find(
            (item) => item.permissionType === 'students_page'
          );
          console.log(permission);
          
          if (!permission || !permission.actions.includes('update')) {
            console.log("Permission for updating student details not found")
            this.toastr.error("Access To Updating of Student Details Denied", "ERROR");
          }
          else if(permission.actions.includes('update')){
            const dialogRef = this.dialog.open(EnrollStudentDialogComponent, {
              width: '700px',
              panelClass: 'custom-dialog-container',
              data: { studentID: studentID },
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

  /*
    this.studentService.createStudent(studentPayload).subscribe({             
                  next: (response) => {
                    switch(response.status){
                        case "SUCCESS" : {
                            console.log('Creation of new student:', response);
                            //this.toastr.success("Created New Class Group!", "SUCCESS");
                            break;
                          }                    
                          default: {
                            console.log('Error Message:', response);
                            //this.toastr.error(response.message, response.status);
                            this.errorMessage = response.message;
                            break;
                          }
                    }
                    //this.submit = false;        
                  },
                  error: (err) => {
                      console.error('Error creating student:', err);
                      //this.toastr.error(err.error.message);
                      this.errorMessage = err.error.message || 'Error: Student not created.';
                      this.submit = false;          
                  }
                })                                     
  */

}