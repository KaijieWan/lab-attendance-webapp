import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Inject, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, FormArray, FormsModule, FormBuilder} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatExpansionPanel } from '@angular/material/expansion';
import {MatListModule} from '@angular/material/list'
import { debounceTime, finalize, forkJoin, map, Observable, of } from 'rxjs';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { ModuleService } from '../../service/module.service';
import Swal from 'sweetalert2';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ClassGroupService } from '../../service/classGroup.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { calculateSemesterWeek} from '../../lib/utils' ;
import { LabSessionService } from '../../service/labSession.service';
import { AttendanceService } from '../../service/attendance.service';
import { StudentDTO } from '../../service/studentService';

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

interface Students {
  fullName: string;
  Student_ID: string;
};

@Component({
  selector: 'app-createLabSession-page',
  standalone: true,
  templateUrl: './createLabSession.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule,
    MatExpansionModule, MatExpansionPanel, MatListModule, MatListModule, MatRadioModule, MatCheckboxModule,
    MatStepperModule, MatInputModule, MatButtonModule, MatFormFieldModule, FormsModule, MatDatepickerModule,
    MatSelectModule, MatOptionModule
  ],
  providers: [  
    MatDatepickerModule,  
    DatePipe
  ],
  styleUrl: './createLabSession.component.scss'
})

export class CreateLabSessionComponent {
  @ViewChildren(MatExpansionPanel) dropdownPanels!: QueryList<MatExpansionPanel>;
  classGroups: ClassGroupDTO[] = [];
  labs = {
    hardware: [
      { name: "HWLAB1" , rooms: ["1", "2"] },
      { name: "HWLAB2", rooms: ["1", "2", "3", "4"] },
      { name: "HWLAB3", rooms: ["1", "2"] },
      { name: "HPL", rooms: ["1", "2"] },
    ],
    software: [
      { name: "SWLAB1", rooms: ["1", "2"] },
      { name: "SWLAB2", rooms: ["1", "2"] },
      { name: "SWLAB3", rooms: ["1", "2", "3"] },
      { name: "SPL", rooms: ["1", "2"] },
    ],
  };
  displayLabNames: string[]= [];
  displayLabRoomNumbers: string[] = [];

  semester: string = "";
  week1StartDate: string="";

  newLabSessionForm: FormGroup;
  passwordStrength: string = '';
  submit: boolean = false;
  errorMessage: string = '';
  distinctRoles: string[] = [];
  selectedRole: string = '';
  modules: string[]= [];
  assignAllModules: boolean = false;
  courseId: string = "";
  students: Students[] = [];

  semesterCourses: string[] = [];
  modulesAssigned: string = "";
  role: string = "";

  constructor(
      public dialogRef: MatDialogRef<CreateLabSessionComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private userService: UserService,
      private rolePermissionService: RolePermissionService,
      private toastr: ToastrService,
      private moduleService: ModuleService,
      private classGroupService: ClassGroupService,
      private fb: FormBuilder,
      private datePipe: DatePipe,
      private labSessionService: LabSessionService,
      private attendanceService: AttendanceService
  ) {
    this.newLabSessionForm = new FormGroup({          
      labName: new FormControl('', Validators.required),
      labRoom: new FormControl('', Validators.required),
      date: new FormControl('', Validators.required),
      start_time: new FormControl('', Validators.required),
      end_time: new FormControl('', Validators.required),
      classGroup: new FormControl('', Validators.required),
      module: new FormControl('', Validators.required),
    });

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
  };

    ngAfterViewInit(){
      this.dropdownPanels.toArray();
    }

    ngOnInit(): void {
      this.courseId = this.data.courseId;

      this.semester = sessionStorage.getItem('semesterID')!;
      this.week1StartDate = sessionStorage.getItem('week1StartDate')!;
      console.log(sessionStorage.getItem('week1StartDate'));
      if(this.semester){
        //this.fetchClassGroups(this.courseId, this.semester);
        this.fetchModules(this.semester);
      }

      this.rolePermissionService.getDistinctRoles().subscribe({
        next: (response) => {
          this.distinctRoles = response;
        }
      })

      const hardwareLabNames = this.labs.hardware.map(lab => lab.name);
      const softwareLabNames = this.labs.software.map(lab => lab.name);
      this.displayLabNames = [...hardwareLabNames, ...softwareLabNames];

      this.newLabSessionForm.get('module')?.valueChanges.subscribe(selectedModule => {
        this.fetchClassGroups(selectedModule, this.semester);        
      });
    }

    changeLab(labName: string){
      this.checkNumberOfRooms(labName);
    }

    checkNumberOfRooms(labName: string) {
      for (const lab of [...this.labs.hardware, ...this.labs.software]) {
        if (labName === lab.name) {
          this.displayLabRoomNumbers = lab.rooms;
        }
      }
    }

    fetchModules(semseterID: string){
      this.labSessionService.getDistinctModules(semseterID).subscribe({
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

    fetchClassGroups(moduleCode: string, semesterID: string){
      this.classGroupService.fetchClassGroupsByModuleAndSemester(moduleCode, semesterID).subscribe({
          next: (response) => {
              console.log(response);
              this.classGroups = response;
          }
      });
    }

    getFormattedTime = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    };

    getDayOfWeek = (date: Date) => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[date.getUTCDay()];
  };
  

    onClose(): void {
        this.dialogRef.close();
    }

    submitDetails(){
      console.log("submitDetails() called")
      console.log(this.newLabSessionForm.value);

      this.submit = true;
      const labName = this.newLabSessionForm.value.labName;
      const labRoom = this.newLabSessionForm.value.labRoom;
      const date = this.newLabSessionForm.value.date;
      const start_time = this.newLabSessionForm.value.start_time;
      const end_time = this.newLabSessionForm.value.end_time;
      const classGroup = this.newLabSessionForm.value.classGroup;
      const module = this.newLabSessionForm.value.module;

      const week1StartDate = new Date(this.week1StartDate);
      const calculatedDate = new Date(date);
      const week = calculateSemesterWeek(week1StartDate, calculatedDate);
            
      if (week == -1) {
          // Recess week should not be able to create lab session
          this.toastr.error("Selected date is in recess week, not able to create lab session");
          return;
      }

      const dayOfWeek = this.getDayOfWeek(calculatedDate);

      let startTimeWithoutSemiColon = start_time.replace(":", "");
      console.log(startTimeWithoutSemiColon); 
      let endTimeWithoutSemiColon = end_time.replace(":", "");
      console.log(endTimeWithoutSemiColon); 

      calculatedDate.setHours(0, 0, 0, 0);

      if (week < 1 || week > 16) {
        this.toastr.error("Selected date is out of the semester range");
        return;
      }

      this.classGroupService.fetchStudentsByModuleAndSemester(module, this.semester).subscribe({
        next: (response) => {
          console.log(response);
          this.students = response[`${classGroup}`];
          console.log(this.students);

          console.log("Attempting to create new lab session");
          const newLabSessionPayload = {
            class_group_id: classGroup,
            module_code: module,
            lab_name: labName,
            room: labRoom,
            date: this.datePipe.transform(date, 'yyyy-MM-dd'),
            startTime: this.getFormattedTime(start_time),
            endTime: this.getFormattedTime(end_time),
            labSessionID: `${module}-${classGroup}-${labName}-${labRoom}-${week}-${dayOfWeek}-${this.datePipe.transform(date, 'yyyy-MM-dd')}-${startTimeWithoutSemiColon}-${endTimeWithoutSemiColon}`,
            semesterID: this.semester,
          };      
          console.log(newLabSessionPayload);

          this.labSessionService.createLabSession(newLabSessionPayload).pipe(
            finalize(() => {
              const attendanceRequests = this.students.map((student) => {
                const attendancePayload = {
                  absentID: null,
                  labSessionID: `${module}-${classGroup}-${labName}-${labRoom}-${week}-${dayOfWeek}-${this.datePipe.transform(date, 'yyyy-MM-dd')}-${startTimeWithoutSemiColon}-${endTimeWithoutSemiColon}`,
                  remarks: "",
                  semesterID: this.semester,
                  status: "Pending",
                  isMakeUpSession: false,
                  studentID: student.Student_ID,
                };
              
                return this.attendanceService.createAttendance(attendancePayload);
              });
              
              forkJoin(attendanceRequests).subscribe({
                next: (responses) => {
                  responses.forEach((response) => {
                    switch (response.status) {
                      case "SUCCESS":
                        console.log('Creation of attendance successful:', response);
                        break;
                      default:
                        console.log('Error Message:', response);
                        this.errorMessage = response.message;
                        break;
                    }
                  });
                  this.submit = false; // Only set to false once ALL are done
                  console.log("All attendance creations are completed.");
                  this.dialogRef.close();
                },
                error: (err) => {
                  console.error('Error creating attendance:', err);
                  this.errorMessage = err.error?.message || 'Error: Attendance not created.';
                  this.submit = false;
                }
              });          
            })
          ).subscribe({             
            next: (response) => {
              switch(response.status){
                  case "SUCCESS" : {
                      console.log('Creation of lab session successful:', response);
                      this.toastr.success("Created New Class Group!", "SUCCESS");
                                    
                      break;
                    }                    
                    default: {
                      console.log('Error Message:', response);
                      this.toastr.error(response.message, response.status);
                      this.errorMessage = response.message;
                      break;
                    }
              }
              this.submit = false;        
            },
            error: (err) => {
                console.error('Error creating lab session:', err);
                //this.toastr.error(err.error.message);
                this.errorMessage = err.error.message || 'Error: Lab session not created.';
                this.submit = false;          
            }
          })
        }
      })

      
      
    }
}