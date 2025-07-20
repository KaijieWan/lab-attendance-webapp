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
import { concatMap, debounceTime, finalize, forkJoin, map, Observable, of } from 'rxjs';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { ModuleService } from '../../service/module.service';
import Swal from 'sweetalert2';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioGroup, MatRadioModule } from '@angular/material/radio';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ClassGroupService } from '../../service/classGroup.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { areFilesUploaded, calculateSemesterWeek} from '../../lib/utils' ;
import { LabSessionService } from '../../service/labSession.service';
import { AttendanceService } from '../../service/attendance.service';
import { StudentDTO } from '../../service/studentService';
import * as XLSX from 'xlsx';

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
  templateUrl: './createAdHocSession.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule,
    MatExpansionModule, MatExpansionPanel, MatListModule, MatListModule, MatRadioModule, MatCheckboxModule,
    MatStepperModule, MatInputModule, MatButtonModule, MatFormFieldModule, FormsModule, MatDatepickerModule,
    MatSelectModule, MatOptionModule, MatRadioGroup
  ],
  providers: [  
    MatDatepickerModule,  
    DatePipe
  ],
  styleUrl: './createAdHocSession.component.scss'
})

export class CreateAdHocSessionComponent {
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
  selectedFiles: FileList | null = null;
  displayFiles: File[] = [];
  studentIDs: string[] = [];
  currentLabRoom: Map<string, [string, string]> = new Map();

  constructor(
      public dialogRef: MatDialogRef<CreateAdHocSessionComponent>,
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
    /*this.newLabSessionForm = new FormGroup({          
      labName: new FormControl('', Validators.required),
      labRoom: new FormControl('', Validators.required),
      date: new FormControl('', Validators.required),
      start_time: new FormControl('', Validators.required),
      end_time: new FormControl('', Validators.required),
      //classGroup: new FormControl('', Validators.required),
      studentList: new FormControl([], Validators.required),
      module: new FormControl('', Validators.required),
      uploadMethod: new FormControl('', Validators.required),
      courseName: new FormControl('', Validators.required),
      classGroups: new FormControl([], Validators.required),
    });*/

    this.newLabSessionForm = this.fb.group({      
      date: new FormControl('', Validators.required),
      start_time: new FormControl('', Validators.required),
      end_time: new FormControl('', Validators.required),
      studentList: new FormControl([], Validators.required),
      module: new FormControl('', Validators.required),
      uploadMethod: new FormControl('', Validators.required),
      courseName: new FormControl(''),
      classGroups: this.fb.array([]),
      classGroupNames: this.fb.array([]),   
      labDetailsMethod: new FormControl('', Validators.required),
      labName: new FormControl(''),
      labRoom: new FormControl(''),
      /*currentLabName: new FormControl(''),
      currentLabRoom: new FormControl(''),*/
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

      /*this.newLabSessionForm.get('module')?.valueChanges.subscribe(selectedModule => {
        this.fetchClassGroups(selectedModule, this.semester);        
      });*/
      
    }

    getLab(group: string): string {
      return this.currentLabRoom.get(group)?.[0] || '';
    }

    getLabRoom(group: string): string {
      return this.currentLabRoom.get(group)?.[1] || '';
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

    checkUploadMethod(){
      if(this.newLabSessionForm.get('uploadMethod')?.value == "current"){        
        const classGroupsArray = this.newLabSessionForm.get('classGroups') as FormArray;
        this.newLabSessionForm.get('classGroupNames')?.value.forEach((classGroupName: string) => {
          this.currentLabRoom.set(classGroupName, ["", ""]);
          this.newLabSessionForm.addControl(classGroupName, new FormControl(["", ""]));
          /*classGroupsArray.push(
            this.fb.group({
              classGroupName: [classGroupName],
              labName: [''],
              labRoom: ['']
            })
          );*/
        });
        
      }
      this.newLabSessionForm.get('classGroupNames')?.value.forEach((classGroupName: string) => {
          console.log(this.newLabSessionForm.get(classGroupName)?.value);
      });
      
    }

    currentLabChange(event: any, classGroup: string) {
      const selectedValue = event.value;
      const item = this.currentLabRoom.get(classGroup)
      if(item){
        item[0] = selectedValue;
      }
      console.log(this.currentLabRoom);
    }

    currentLabRoomChange(event: any, classGroup: string) {
      const selectedValue = event.value;
      const item = this.currentLabRoom.get(classGroup)
      if(item){
        item[1] = selectedValue;
      }
      console.log(this.currentLabRoom);

      const hasEmptyRoom = Array.from(this.currentLabRoom.values()).some(
        ([labName, labRoom]) => labName === '' || labRoom === ''
      );
      
      if (hasEmptyRoom) {
        this.newLabSessionForm.get('labDetailsMethod')?.setValue('Filler');
        this.newLabSessionForm.get('labDetailsMethod')?.markAsTouched();
        console.log("labDetailsMethod marked as touched");
      }
    }

    changeModule(module: string){
      this.fetchClassGroups(module, this.semester);
      this.newLabSessionForm.get('studentList')?.setValue(['Filler']);
      this.newLabSessionForm.get('studentList')?.markAsTouched();
    }

    toggleUpload(){
      //Set the form controls and arrays as empty and untouched everytime the method is toggled
      this.newLabSessionForm.get('studentList')?.setValue([]);
      this.droppedFiles = [];
      this.newLabSessionForm.get('studentList')?.markAsUntouched();

      const classGroups: FormArray = this.newLabSessionForm.get('classGroupNames') as FormArray;
      classGroups.clear();
      this.currentLabRoom.clear();

      this.newLabSessionForm.get('labDetailsMethod')?.markAsUntouched();      
    }

    markUploadLabRoom(){
      this.newLabSessionForm.get('labDetailsMethod')?.markAsTouched();
      this.newLabSessionForm.get('labDetailsMethod')?.setValue('Filler');
      console.log("labDetailsMethod marked as touched");
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

  isDragOver = false;
  droppedFiles: File[] = [];

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDropModule(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);
      this.droppedFiles.push(...files);
      this.newLabSessionForm.get('studentList')?.setValue(this.droppedFiles);
      this.newLabSessionForm.get('studentList')?.markAsTouched();

      const dataTransfer = new DataTransfer();

      // Add previously selected files (if any)
      if (this.selectedFiles) {
        Array.from(this.selectedFiles).forEach(file => dataTransfer.items.add(file));
      }
      // Add new dropped files
      files.forEach(file => dataTransfer.items.add(file));
      this.selectedFiles = dataTransfer.files;
    }
  }

  uploadStudentFiles(event: any) {
    const input = event.target as HTMLInputElement;
    this.newLabSessionForm.get('modules')?.setValue(this.droppedFiles);
    this.newLabSessionForm.get('modules')?.markAsTouched();
  
    if (input?.files) {
      this.selectedFiles = input.files;
      console.log("Student files uploaded:", this.selectedFiles);
  
      Array.from(input.files).forEach((file) => {
        if (!this.displayFiles.some(f => f.name === file.name && f.size === file.size)) {
          this.displayFiles.push(file);
        }
      });
    }
  }

  onCheckboxChangeAddGroup(event: any, item: string){
    const classGroups: FormArray = this.newLabSessionForm.get('classGroupNames') as FormArray;
  
    if (event.checked) {
      // Add item if checked
      classGroups.push(new FormControl(item));
    } else {
      // Remove item if unchecked
      const index = classGroups.controls.findIndex(x => x.value === item);
      if (index > -1) {
        classGroups.removeAt(index);
      }
    }

    console.log(classGroups.value);
  }

  readStudentIdsFromExcel(files: File[]) {
    if (!files || files.length === 0) return;
  
    const file = files[0]; // Expecting only one file
    const reader = new FileReader();

    if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")){
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
    
        const sheetName = workbook.SheetNames[0]; // Take the first sheet
        const worksheet = workbook.Sheets[sheetName];
    
        const jsonData = XLSX.utils.sheet_to_json<{ [key: string]: any }>(worksheet, { defval: '' });
    
        // Assuming the column is titled "Student ID" or the first column if untitled
        const studentIds = jsonData.map(row => {
          const keys = Object.keys(row);
          return row[keys[0]]?.toString().trim();
        }).filter(id => !!id);
    
        console.log('Extracted Student IDs:', studentIds);
        this.studentIDs = studentIds;
      };    
      reader.readAsArrayBuffer(file);
    }
  }

    submitDetails(){
      console.log("submitDetails() called")
      if (!areFilesUploaded(this.selectedFiles)) {
        this.toastr.error("Student Files not uploaded. Please upload the files.");
        return;
      }
      else{
        this.toastr.success("Valid Student files");
      }
      
      console.log(this.newLabSessionForm.value);

      this.submit = true;
      const labName = this.newLabSessionForm.value.labName;
      const labRoom = this.newLabSessionForm.value.labRoom;
      const date = this.newLabSessionForm.value.date;
      const start_time = this.newLabSessionForm.value.start_time;
      const end_time = this.newLabSessionForm.value.end_time;
      const classGroup = "NA";
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

      /*if(this.selectedFiles){
        console.log("Attempting to create new class group if it does not exist:");
        const classGroupPayload = {
          classGroupId: {
            classGroupID: classGroup,
            moduleCode: module,
            semesterID: this.semester,
          },
        };
        this.classGroupService.createClassGroup(classGroupPayload).pipe(finalize(() => {              
          const enrolmentRequests = this.studentIDs.map((student) => {
            const enrolmentPayload = {
              classGroupEnrolledStudentsId: {
                studentId: student,
                classGroupId: classGroup,
                moduleCode: module,
                semesterID: this.semester,
              }
            };              
            return this.classGroupService.enrollStudentInClassGroup(enrolmentPayload);
          });
              
          forkJoin(enrolmentRequests).subscribe({
            next: (responses) => {
              responses.forEach((response) => {
                switch (response.status) {
                  case "SUCCESS":
                    console.log('Student enrolment successful:', response);
                    break;
                  default:
                    console.log('Error Message:', response);
                    this.errorMessage = response.message;
                    break;
                }
              });
              this.submit = false; // Only set to false once ALL are done
              console.log("All student enrolements are completed.");
              //this.dialogRef.close();
              concatMap(() => {
                console.log("Attempting to create new Ad Hoc session");
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
      
                return this.labSessionService.createLabSession(newLabSessionPayload).pipe(
                  finalize(() => {
                    const attendanceRequests = this.studentIDs.map((student) => {
                      const attendancePayload = {
                        absentID: null,
                        labSessionID: `${module}-${classGroup}-${labName}-${labRoom}-${week}-${dayOfWeek}-${this.datePipe.transform(date, 'yyyy-MM-dd')}-${startTimeWithoutSemiColon}-${endTimeWithoutSemiColon}`,
                        remarks: "",
                        semesterID: this.semester,
                        status: "Pending",
                        isMakeUpSession: false,
                        studentID: student,
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
                            console.log('Creation of Ad Hoc session successful:', response);
                            this.toastr.success("Created Ad Hoc Session!", "SUCCESS");
                                          
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
                      console.error('Error creating Ad Hoc session:', err);
                      //this.toastr.error(err.error.message);
                      this.errorMessage = err.error.message || 'Error: Ad Hoc session not created.';
                      this.submit = false;          
                  }
                })
              })
            },
            error: (err) => {
              console.error('Error enrolling student:', err);
              this.errorMessage = err.error?.message || 'Error: Student not enrolled.';
              this.submit = false;
            }
          });
        })).subscribe({             
          next: (response) => {
            switch(response.status){
                case "SUCCESS" : {
                    console.log('Creation of new class group successful:', response);
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
              console.error('Error creating class group:', err);
              //this.toastr.error(err.error.message);
              this.errorMessage = 'Error: Class Group not created.';
              this.submit = false;          
          }
        })


        
        }*/
      }

}