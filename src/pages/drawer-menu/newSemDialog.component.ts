import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Inject } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, FormBuilder} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, finalize, map, Observable, of } from 'rxjs';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { addTimeBy1HourMinus10Minutes, areFilesUploaded, convertTime, createKey, extractRoomNumber, formatLocalDateTime, getShortDayName, isMonday, isValidAnnualYear, isValidSemester, propagateMergedCells, propagateMergedCellsVertically } from '../../lib/utils';
import * as XLSX from 'xlsx';
import { ModuleService } from '../../service/module.service';
import { ClassGroupService } from '../../service/classGroup.service';
import { StudentService } from '../../service/studentService';
import { LabSessionService } from '../../service/labSession.service';
import { AttendanceService } from '../../service/attendance.service';
import { SemesterService } from '../../service/semester.service';

@Component({
  selector: 'app-newRoleDialog-page',
  standalone: true,
  templateUrl: './newSemDialog.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  providers: [  
    MatDatepickerModule,  
    DatePipe
  ],
  styleUrl: './newSemDialog.component.scss'
})

export class NewSemDialogComponent {
    submit: boolean = false;
    newSemesterForm: FormGroup;
    updateRoleForm: FormGroup;
    distinctRoles: string[] = [];
    selectedRole: string = '';
    displayPermissions: any[] = [];
    currentView: 'addRole' | 'updateRole' = 'addRole';
    allowedActions: string[] = ['read', 'write', 'delete', 'allow']
    selectedPermissions: { [key: string]: string[] } = {};

    errorMessage: string = '';
    toUpdateRole: string = '';

    selectedFiles: FileList | null = null;
    labFile: File | null = null;
    displayFiles: File[] = [];

    pages = [
        { title: 'Courses Page' },
        { title: 'Students Page' },
        { title: 'Lab Schedules Page'},
        { title: 'Absences Page'},
        { title: 'Accounts Management Page'}
      ];

    functions = [
        { title: 'Role Management'},
        { title: 'Create New User'},
        { title: 'Add New Semester'}
    ]
    
    pages_actions = ['Read', 'Write', 'Delete'];

    functions_actions = ['Allow'];

    constructor(
        public dialogRef: MatDialogRef<NewSemDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private userService: UserService,
        private rolePermissionService: RolePermissionService,
        private moduleService: ModuleService,
        private classGroupService: ClassGroupService,
        private studentService: StudentService,
        private labSessionService: LabSessionService,
        private attendanceService: AttendanceService,
        private semesterService: SemesterService,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private datePipe: DatePipe
    ) {
        this.newSemesterForm = this.fb.group({});
        this.updateRoleForm = this.fb.group({});
    }

    getControlName(page: string, action: string): string {
        return `${page}_${action}`.replace(/\s+/g, '_').toLowerCase();
      }

    ngOnInit() {
        this.newSemesterForm = this.fb.group({
            annnualYear_1: new FormControl('', Validators.required),
            annnualYear_2: new FormControl('', Validators.required),
            semester: new FormControl('', Validators.required),
            week1StartDate: new FormControl('', Validators.required),
            studentFiles: new FormControl([null], Validators.required)
        });

        this.updateRoleForm = this.fb.group({
            update_role: new FormControl('', Validators.required),
        });
            
        this.pages.forEach((page) => {
            this.pages_actions.forEach((action) => {
              const controlName = this.getControlName(page.title, action);
              this.updateRoleForm.addControl(controlName, new FormControl(false));
            });
          });
  
          this.functions.forEach((Function) => {
              this.functions_actions.forEach((action) => {
                const controlName = this.getControlName(Function.title, action);
                this.updateRoleForm.addControl(controlName, new FormControl(false));
              });
          });        
        
    }

    switchView(view: 'addRole' | 'updateRole'): void {
        this.currentView = view;
    }

    uploadStudentFiles(event: any) {
      const files: FileList = event.target.files;
      this.selectedFiles = files;

      const input = event.target as HTMLInputElement;
  
      if (input?.files) {
        const files: FileList = input.files;
  
        // Append new files to the list (avoiding duplicates)
        Array.from(files).forEach((file) => {
          if (!this.displayFiles.some(f => f.name === file.name && f.size === file.size)) {
            this.displayFiles.push(file);
          }
        });
      }
    }

    /*handleFileSelection(event: Event): void {
      const input = event.target as HTMLInputElement;
  
      if (input?.files) {
        const files: FileList = input.files;
  
        // Append new files to the list (avoiding duplicates)
        Array.from(files).forEach((file) => {
          if (!this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            this.selectedFiles.push(file);
          }
        });
      }
    }*/

    uploadLabFile(event: any){
      const files: FileList = event.target.files;
      if (files && files.length > 0) {
        this.labFile = files[0]; // Assign the first file in the FileList
      } else {
          console.error("No file selected.");
      }
    }

    parseClassData = (data: any) => {
      const lines = data.split("\n");
      let currentClass: any = null;
      const classes = [];
      let courseCode = "";
  
      lines.forEach((line: any) => {
          if (line.startsWith("Course:")) {
              courseCode = line.split(" ")[1];
          } else if (line.startsWith("Class Group:")) {
              if (currentClass) {
                  classes.push(currentClass);
              }
              currentClass = { students: [], courseCode: courseCode };
              currentClass.classGroup = line.split(":")[1].trim();
          } else if (line.startsWith('"Day-Time:') || line.startsWith("Day-Time:")) {
              const [day, _, startTime, __] = line.split(":")[1].trim().split(" ");
              const [endTime, ___] = line.split(":")[2].trim().split(" ");
  
              currentClass.dayOfWeek = day;
              currentClass.startTime = convertTime(startTime);
              currentClass.endTime = convertTime(endTime);
  
              currentClass.weeks = line
                  .match(/Wk([\d,]+)/)[1]
                  .split(",")
                  .map(Number);
          } else if (line.startsWith("Venue:")) {
              currentClass.venue = line.split(":")[1].trim();
          } else if (line.match(/^\d+\t/)) {
              const studentData = line.split("\t");
              currentClass.students.push({ name: studentData[1], vmsAcc: studentData[5].split("\r")[0] });
          }
      });
  
      if (currentClass) {
          classes.push(currentClass);
      }
  
      return classes;
    };

    processStudentFiles = (files: FileList) => {
      const fileReaders = [];
      const allClasses: any = [];
  
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const reader = new FileReader();
  
          fileReaders.push(
              new Promise<void>((resolve, reject) => {
                  // Check if the file is an Excel file
                  if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
                      reader.onload = (e) => {
                          const result = e?.target?.result;
                          if (result instanceof ArrayBuffer) {
                              const data = new Uint8Array(result);
                              const workbook = XLSX.read(data, { type: "array" });
                              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
                              // Convert the worksheet to plain text directly
                              const textData = XLSX.utils.sheet_to_txt(worksheet);
  
                              // Process the plain text data
                              const classes = this.parseClassData(textData);
                              allClasses.push(...classes);
                              resolve();
                          } else {
                              reject("Error reading Excel file");
                          }
                      };
                      reader.onerror = () => reject("Error reading Excel file");
                      reader.readAsArrayBuffer(file);
                  } else {
                      // Handle non-Excel files (assumes plain text format)
                      reader.onload = (e) => {
                          const result = e?.target?.result;
                          if (result) {
                            console.log(result);
                              const classes = this.parseClassData(result);
                              allClasses.push(...classes);
                              resolve();
                          } else {
                              reject("File read error");
                          }
                      };
                      reader.onerror = () => reject("File read error");
                      reader.readAsText(file);
                  }
              })
          );
      }
  
      return Promise.all(fileReaders).then(() => allClasses);
    };

    processLabWorksheet = (worksheet: any) => {
      const mergeCells = worksheet["!merges"] || [];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      // Propagate merged cells for labHeaders and roomHeaders
      const labHeaders = propagateMergedCells(rows[3], mergeCells, 3); // 0-based index for the 4th row
      const roomHeaders = propagateMergedCells(rows[4], mergeCells, 4); // 0-based index for the 5th row
      // Generate dayHeaders array to handle vertically merged cells
      const dayHeaders = propagateMergedCellsVertically(rows, mergeCells);
  
      let processedData = [];
  
      for (let rowNumber = 5; rowNumber < 60; rowNumber++) {
          let row: any = rows[rowNumber];
          if (!row) continue;
  
          const day = getShortDayName(dayHeaders[rowNumber]);
          const time = row[1]?.trim();
          if (!time) continue;
  
          const timeSplit = time.split("-");
          if (timeSplit.length !== 2) continue;
  
          const startTime = String(convertTime(timeSplit[0].trim())).padStart(4, "0");
          const endTime = String(convertTime(timeSplit[1].trim())).padStart(4, "0");
  
          for (let colIndex = 2; colIndex < 42; colIndex++) {
              if (colIndex === 22 || colIndex === 23) continue;
  
              const cellValue = row[colIndex]?.trim();
              if (cellValue) {
                  let courseCode = "";
                  let classGroup = "";
                  if (cellValue.includes("-")) {
                      const cellValues = cellValue.split("-");
                      courseCode = cellValues[0].trim();
                      classGroup = cellValues[1].trim().split(" ")[0].trim();
                      if (classGroup.endsWith("(wk)")) {
                          classGroup = classGroup.replace("(wk)", "");
                      }
                  } else {
                      courseCode = cellValue.split("(")[0].trim();
                  }
  
                  const labHeader = labHeaders[colIndex];
                  if (labHeader) {
                      const parts = labHeader.split(" ");
                      const lab = parts[0];
                      const week = parts.length > 1 ? parts[1].replace(/[()]/g, "") : "";
                      const roomHeader = roomHeaders[colIndex];
                      const room = roomHeader ? extractRoomNumber(roomHeader.trim()) : "";
  
                      processedData.push({
                          Lab: lab,
                          Week: week,
                          Room: room,
                          CourseCode: courseCode,
                          ClassGroup: classGroup,
                          Day: day,
                          StartTime: startTime,
                          EndTime: endTime,
                      });
                  }
              }
          }
      }
  
      return processedData;
    };

    readLabFile(file: File): Promise<any[]> {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
            reader.onload = (e) => {
              const result = e?.target?.result;
              if (result instanceof ArrayBuffer) {
                  const data = new Uint8Array(result);
                  const workbook = XLSX.read(data, { type: "array" });
                  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                  const processedLabData = this.processLabWorksheet(worksheet);
                  resolve(processedLabData);
              } else {
                  reject("File read failed");
              }
            };
            reader.readAsArrayBuffer(file);
          } else {
            // Handle non-Excel files (assumes plain text format)
            reader.onload = (e) => {
                const result = e?.target?.result;
                if (result) {
                  const processedLabData = this.processLabWorksheet(result);
                    resolve(processedLabData);
                } else {
                    reject("File read error");
                }
            };
            reader.onerror = () => reject("File read error");
            reader.readAsText(file);
          }         
      });
    }

    onRoleChange(event: Event): void {
        const selectedRole = (event.target as HTMLSelectElement).value;
        this.toUpdateRole = selectedRole;
        this.fetchPermissions(selectedRole);
    }

    fetchPermissions(role: string): void {
        this.rolePermissionService.getRolePermissions(role).subscribe({
            next: (response) => {
                this.displayPermissions = response;
                this.displayPermissions.forEach(item => {
                    const actions = item.actions.split(',');
                    this.selectedPermissions[item.permissionType] = actions;
                    
                    this.allowedActions.forEach((allowedAction) => {
                      const controlName = this.getControlName(item.permissionType, allowedAction);
            
                      if (this.updateRoleForm.contains(controlName)) {
                        // Update existing form control's value
                        this.updateRoleForm.get(controlName)?.setValue(actions.includes(allowedAction));
                      } else {
                        this.updateRoleForm.addControl(
                          controlName,
                          new FormControl(actions.includes(allowedAction))
                        );
                      }
                    });    
                })
                console.log(this.displayPermissions);
                console.log(this.selectedPermissions);

                
            }
        })
    }

    isChecked(permission: string, action: string): boolean {
        const parsed_permission = permission.toLowerCase().replace(/\s+/g, '_');
        
        return this.selectedPermissions[parsed_permission]?.includes(action.toLowerCase()) || false;
      }

    onActionChange(permission: any, action: string, event: Event): void {
        const isChecked = (event.target as HTMLInputElement).checked;
        console.log(`Permission: ${permission}, Action: ${action}, Checked: ${isChecked}`);

        //Perform logic based on the `isChecked` value
        if (isChecked) {
            // Add the action to the selected list
            this.addActionToPermission(permission, action);
        } else {
            // Remove the action from the selected list
            this.removeActionFromPermission(permission, action);
        }
    }

    addActionToPermission(permission: string, action: string): void {
        // Add the action to the selected permissions for the given permission type
        if (!this.selectedPermissions[permission]) {
          this.selectedPermissions[permission] = [];
        }
        if (!this.selectedPermissions[permission].includes(action)) {
          this.selectedPermissions[permission].push(action);
        }
      }
      
      removeActionFromPermission(permission: string, action: string): void {
        // Remove the action from the selected permissions for the given permission type
        if (this.selectedPermissions[permission]) {
          this.selectedPermissions[permission] = this.selectedPermissions[permission].filter(
            (a) => a !== action
          );
          if (this.selectedPermissions[permission].length === 0) {
            delete this.selectedPermissions[permission];
          }
        }
    }

    onClose(): void {
        this.dialogRef.close();
    }

    async createSemester(){
        this.submit = true;
        const annualYear = `AY${this.newSemesterForm.value.annnualYear_1}/${this.newSemesterForm.value.annnualYear_2}`
        const semesterID = `${annualYear} S${this.newSemesterForm.value.semester}`;
        const startDate = this.newSemesterForm.value.week1StartDate
          ? this.datePipe.transform(this.newSemesterForm.value.week1StartDate, 'yyyy-MM-dd')
          : '';
        //Convert to Date type just in case
        const week1StartDate = new Date(this.newSemesterForm.value.week1StartDate);
        console.log(annualYear);
        console.log(Number(this.newSemesterForm.value.semester));
        console.log(semesterID);
        console.log(startDate);            

        if (!isValidSemester(this.newSemesterForm.value.semester)) {
          this.toastr.error("Invalid Semester. Please enter a valid Semester (e.g. 1 or 2)");
          //return false;
        }
        else{
          this.toastr.success("Valid Semester");
        }

        if (!isValidAnnualYear(annualYear)) {
            this.toastr.error("Invalid Annual Year. Please enter a valid Annual Year (e.g. AY24/25)");
            //return false;
        }
        else{
          this.toastr.success("Valid Annual Year");
        }

        if (!isMonday(this.newSemesterForm.value.week1StartDate)) {
            this.toastr.error("Invalid Date. Please enter a valid Monday date as the Start Date of the Semester.");
            //return false;
        }
        else{
          this.toastr.success("Valid Monday date");
        }

        if (!areFilesUploaded(this.selectedFiles)) {
          this.toastr.error("Student Files not uploaded. Please upload the files.");
          //return false;
        }
        else{
          this.toastr.success("Valid Student files");
        }

        if (!areFilesUploaded(this.labFile)) {
          this.toastr.error("Lab Schedule file not uploaded. Please upload the file.");
          //return false;
        }
        else{
          this.toastr.success("Valid Lab Schedule file");
        }

        console.log("Attempting to create new semester");
        const semesterPayload = {
          semesterID: semesterID,
          semester: Number(this.newSemesterForm.value.semester),
          annualYear: annualYear,
          week1StartDate: week1StartDate,
        };

        this.semesterService.createSemester(semesterPayload).subscribe({             
          next: (response) => {
            switch(response.status){
                case "SUCCESS" : {
                    console.log('Creation of new semester successful:', response);
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
            this.submit = false;        
          },
          error: (err) => {
              console.error('Error creating semester:', err);
              //this.toastr.error(err.error.message);
              this.errorMessage = err.error.message || 'Error: Semester not created.';
              this.submit = false;          
          }
        })

        let processedLabData;
        let labDataMap = new Map();

        if(this.labFile){
          console.log("Processing lab file....");    
          processedLabData = await this.readLabFile(this.labFile);
          console.log(processedLabData);

          for (let i = 0; i < processedLabData.length; i++) {
            const labData = processedLabData[i];

            // Add to hashmap that maps CourseCode, ClassGroup, Week, Day, StartTime, EndTime to the Lab and Lab Room
            const lab = labData.Lab;
            const labRoom = labData.Room;
            const courseCode = labData.CourseCode;
            const classGroup = labData.ClassGroup;
            const week = labData.Week;
            const day = labData.Day;
            const startTime = labData.StartTime;
            const endTime = labData.EndTime;
            let key: [string, string, string, string | undefined, string, string] = [
                courseCode,
                classGroup,
                week,
                day,
                startTime,
                endTime,
            ];
            key = createKey(key);
            if (!labDataMap.has(key)) {
                labDataMap.set(key, { lab, labRoom });
            }

            // If any courses does not exist, create them
            /*console.log("Attempting to create new module if it does not exist");
            const courseModulePayload = {
              moduleCode: courseCode
            };
            this.moduleService.createModule(courseModulePayload).pipe(
              finalize(() => {
                // If any class groups do not exist, create them
                console.log("Attempting to create new class group if it does not exist:");
                const classGroupPayload = {
                  classGroupId: {
                    classGroupID: classGroup,
                    moduleCode: courseCode,
                    semesterID: semesterID,
                  },
                };
                this.classGroupService.createClassGroup(classGroupPayload).subscribe({             
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
                    this.submit = false;        
                  },
                  error: (err) => {
                      console.error('Error creating class group:', err);
                      //this.toastr.error(err.error.message);
                      this.errorMessage = err.error.message || 'Error: Class Group not created.';
                      this.submit = false;          
                  }
                })
              })
            ).subscribe({
              next: (response) => {
                switch(response.status){
                    case "SUCCESS" : {
                        console.log('Creation of new module successful:', response);
                        //this.toastr.success("Created New Module!", "SUCCESS");                        
                        break;
                      }
                      default: {
                        console.log('Error Message:', response);
                        //this.toastr.error(response.message, response.status);
                        this.errorMessage = response.message;
                        break;
                      }
                }
                this.submit = false;        
              },
              error: (err) => {
                  console.error('Error creating module:', err);
                  //this.toastr.error(err.error.message);
                  this.errorMessage = err.error.message || 'Error: Module not created.';
                  this.submit = false;          
              }
            })            
            this.toastr.success("Created Module!", "SUCCESS"); 
            this.toastr.success("Created Class Group!", "SUCCESS");*/
            
          }
          console.log(labDataMap);
          //setProgress(10); // Set progress to 10% after lab file processing
        } else {
            this.toastr.error("Lab File not uploaded. Please upload the file.","ERROR");
        }
        
        if(this.selectedFiles && this.newSemesterForm.value.week1StartDate){
          try {
            console.log("Processing student files....");
            const classes = await this.processStudentFiles(this.selectedFiles);
            
            console.log("Classes:", classes);
            const expectedTasks = classes.length;
            let processedClasses = 0;

            for (let classData of classes) {
                for (let student of classData.students) {
                    console.log("Attempting to create new student if it does not exist");
                    const studentPayload = {
                      studentID: student.vmsAcc,
                      fullName: student.name
                    };
                    this.studentService.createStudent(studentPayload).pipe(
                      finalize(() => {
                        console.log("Attempting to enroll student in class group if not yet enrolled");
                        const enrolmentPayload = {
                          classGroupEnrolledStudentsId: {
                            studentId: student.vmsAcc,
                            classGroupId: classData.classGroup,
                            moduleCode: classData.courseCode,
                            semesterID: semesterID,
                          }
                        };
                        this.classGroupService.enrollStudentInClassGroup(enrolmentPayload).subscribe({             
                          next: (response) => {
                            switch(response.status){
                                case "SUCCESS" : {
                                    console.log('Enrolement of student successful:', response);
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
                            this.submit = false;        
                          },
                          error: (err) => {
                              console.error('Error enrolling student:', err);
                              //this.toastr.error(err.error.message);
                              this.errorMessage = err.error.message || 'Error: Student not enrolled.';
                              this.submit = false;          
                          }
                        }) 
                      })) .subscribe({             
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
                        this.submit = false;        
                      },
                      error: (err) => {
                          console.error('Error creating student:', err);
                          //this.toastr.error(err.error.message);
                          this.errorMessage = err.error.message || 'Error: Student not created.';
                          this.submit = false;          
                      }
                    })                                     
                }

                const weeks = classData.weeks;
                for (let week of weeks) {
                    const isOdd = week % 2 === 1;
                    let startDateTime: any = week1StartDate;
                    startDateTime.setHours(
                        parseInt(classData.startTime.substring(0, 2)),
                        parseInt(classData.startTime.substring(2, 4)),
                        0,
                        0
                    );
                    startDateTime = formatLocalDateTime(startDateTime);
                    let endDateTime: any = week1StartDate;
                    endDateTime.setHours(
                        parseInt(classData.endTime.substring(0, 2)),
                        parseInt(classData.endTime.substring(2, 4)),
                        0,
                        0
                    );
                    endDateTime = formatLocalDateTime(endDateTime);
                    const calculatedDate = new Date(week1StartDate);
                    calculatedDate.setDate(week1StartDate.getDate() + (week - 1) * 7);

                    // Account for recess week
                    if (week >= 8) {
                        calculatedDate.setDate(calculatedDate.getDate() + 7);
                    }
                    calculatedDate.setHours(0, 0, 0, 0);

                    switch (classData.dayOfWeek) {
                        case "Tue":
                            calculatedDate.setDate(calculatedDate.getDate() + 1);
                            break;
                        case "Wed":
                            calculatedDate.setDate(calculatedDate.getDate() + 2);
                            break;
                        case "Thu":
                            calculatedDate.setDate(calculatedDate.getDate() + 3);
                            break;
                        case "Fri":
                            calculatedDate.setDate(calculatedDate.getDate() + 4);
                            break;
                        case "Sat":
                            calculatedDate.setDate(calculatedDate.getDate() + 5);
                            break;
                        case "Sun":
                            calculatedDate.setDate(calculatedDate.getDate() + 6);
                            break;
                        default:
                            break;
                    }

                    let labKey = [
                        classData.courseCode,
                        classData.classGroup,
                        isOdd ? "Odd" : "Even",
                        classData.dayOfWeek,
                        convertTime(classData.startTime),
                        convertTime(classData.endTime),
                    ];

                    labKey = createKey(labKey);

                    let labInfo = labDataMap.get(labKey);

                    if (!labInfo) {
                        const endTime = addTimeBy1HourMinus10Minutes(classData.startTime);

                        labKey = [
                            classData.courseCode,
                            classData.classGroup,
                            isOdd ? "Odd" : "Even",
                            classData.dayOfWeek,
                            convertTime(classData.startTime),
                            convertTime(endTime),
                        ];
                        labKey = createKey(labKey);
                        labInfo = labDataMap.get(labKey);

                        if (!labInfo) {
                            console.error(`Lab info not found for key: ${labKey}`);
                            continue;
                        }
                    }

                    console.log("Attempting to create new lab session");
                    const newLabSessionPayload = {
                      class_group_id: classData.classGroup,
                      module_code: classData.courseCode,
                      lab_name: labInfo.lab,
                      room: labInfo.labRoom,
                      date: this.datePipe.transform(calculatedDate, 'yyyy-MM-dd'),
                      startTime: startDateTime,
                      endTime: endDateTime,
                      labSessionID: `${classData.courseCode}-${classData.classGroup}-${labInfo.lab}-${labInfo.labRoom}-${week}-${classData.dayOfWeek}-${this.datePipe.transform(calculatedDate, 'yyyy-MM-dd')}-${classData.startTime}-${classData.endTime}`,
                      semesterID: semesterID,
                    };
                    
                    this.labSessionService.createLabSession(newLabSessionPayload).pipe(
                      finalize(() => {
                        for (let student of classData.students) {
                          console.log("Attempting to create new attendance");
                          const attendancePayload = {
                            absentID: null,
                            labSessionID: `${classData.courseCode}-${classData.classGroup}-${labInfo.lab}-${labInfo.labRoom}-${week}-${classData.dayOfWeek}-${this.datePipe.transform(calculatedDate, 'yyyy-MM-dd')}-${classData.startTime}-${classData.endTime}`,
                            remarks: "",
                            semesterID: semesterID,
                            status: "Pending",
                            isMakeUpSession: false,
                            studentID: student.vmsAcc,
                          }
  
                          this.attendanceService.createAttendance(attendancePayload).subscribe({             
                            next: (response) => {
                              switch(response.status){
                                  case "SUCCESS" : {
                                      console.log('Creation of attendance successful:', response);
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
                              this.submit = false;        
                            },
                            error: (err) => {
                                console.error('Error creating attendance:', err);
                                //this.toastr.error(err.error.message);
                                this.errorMessage = err.error.message || 'Error: Attendance not created.';
                                this.submit = false;          
                            }
                          })
                        }
                      })
                    ).subscribe({             
                      next: (response) => {
                        switch(response.status){
                            case "SUCCESS" : {
                                console.log('Creation of lab session successful:', response);
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

                processedClasses++;
                //setProgress(10 + (processedClasses / expectedTasks) * 90);
            }

            this.toastr.info("Uploaded data and created new semester", "SUCCESS");
            return true;
          } catch (err) {
              //setAlert("Error processing student files, please ensure student files are in the correct format.");
              console.error(err);
              return false;
          }
        } else {
            console.log("Student Files not uploaded. Please upload the files.");
            //setAlert("Student Files not uploaded. Please upload the files.");
            return false;
        }
        
      }

    updateRole(){
      this.submit = true;
        const formValues = this.updateRoleForm.value;

        // Group permissions by permissionType (page title)
        const pagePermissions = this.pages.map((page) => {
            const pages_actions = this.pages_actions
                .filter((action) => formValues[this.getControlName(page.title, action)])
                .join(',');

            return {
                permissionType: page.title.toLowerCase().replace(/\s+/g, '_'),
                actions: pages_actions ? pages_actions.toLowerCase() : 'na',
            };

        })

        const functionPermissions = this.functions.map((func) => {
            const functions_actions = this.functions_actions
            .filter((action) => formValues[this.getControlName(func.title, action)])
            .join(',');

            return {
                permissionType: func.title.toLowerCase().replace(/\s+/g, '_'),
                actions: functions_actions ? functions_actions.toLowerCase() : 'na',
            };
        })

        // Combine pages and functions permissions
        const permissions = [...pagePermissions, ...functionPermissions];

        console.log(permissions);

        const payload = {
            role: this.toUpdateRole,
            permissions: permissions,
        };

        console.log('API Payload:', payload);

        this.rolePermissionService.updateRole(payload).subscribe({
            next: (response) => {
                switch(response.status){
                    case "SUCCESS" : {
                        console.log('Updating of role successful:', response);
                        this.toastr.success("Updated Role!", "SUCCESS");
                        this.dialogRef.close();
                        break;
                      }
                      default: {
                        console.log('Error Message:', response);
                        this.errorMessage = response.message;
                        break;
                      }
                }
                this.submit = false;        
            },
            error: (err) => {
                console.error('Error updating role:', err);
                this.errorMessage = err.error.message || 'Error: Role not updated.';
                this.submit = false;          
            }
        });
    }
}