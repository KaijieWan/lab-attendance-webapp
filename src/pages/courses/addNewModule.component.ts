import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Inject, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, FormArray, FormsModule, FormBuilder} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatExpansionPanel } from '@angular/material/expansion';
import {MatListModule} from '@angular/material/list'
import { debounceTime, finalize, map, Observable, of, scheduled } from 'rxjs';
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
import { addTimeBy1HourMinus10Minutes, areFilesUploaded, calculateSemesterWeek, convertTime, createKey, extractRoomNumber, formatLocalDateTime, getShortDayName, isMonday, isValidAnnualYear, isValidSemester, propagateMergedCells, propagateMergedCellsVertically} from '../../lib/utils' ;
import { LabSessionService } from '../../service/labSession.service';
import { AttendanceService } from '../../service/attendance.service';
import { StudentDTO, StudentService } from '../../service/studentService';
import { SemesterDTO, SemesterService } from '../../service/semester.service';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

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
  selector: 'app-addNewModule-page',
  standalone: true,
  templateUrl: './addNewModule.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule,
    MatExpansionModule, MatExpansionPanel, MatListModule, MatListModule, MatRadioModule, MatCheckboxModule,
    MatStepperModule, MatInputModule, MatButtonModule, MatFormFieldModule, FormsModule, MatDatepickerModule,
    MatSelectModule, MatOptionModule
  ],
  providers: [  
    MatDatepickerModule,  
    DatePipe
  ],
  styleUrl: './addNewModule.component.scss'
})

export class AddNewModuleComponent {
  @ViewChildren(MatExpansionPanel) dropdownPanels!: QueryList<MatExpansionPanel>;
  classGroups: ClassGroupDTO[] = [];
  semesters: SemesterDTO[] = [];
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
  selectedFiles: FileList | null = null;
  displayFiles: File[] = [];
  labFile: File | null = null;

  semester: string = "";
  week1StartDate: string="";

  newModuleForm: FormGroup;
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
      public dialogRef: MatDialogRef<AddNewModuleComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private userService: UserService,
      private rolePermissionService: RolePermissionService,
      private toastr: ToastrService,
      private moduleService: ModuleService,
      private classGroupService: ClassGroupService,
      private fb: FormBuilder,
      private datePipe: DatePipe,
      private labSessionService: LabSessionService,
      private attendanceService: AttendanceService,
      private semesterService: SemesterService,
      private studentService: StudentService,
  ) {
    this.newModuleForm = new FormGroup({          
      semester: new FormControl('', Validators.required),
      modules: new FormControl([], Validators.required),
      schedule: new FormControl([], Validators.required),
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

      this.semesterService.getAllSemesters().subscribe({
        next: (response) => {
          this.semesters = response;
        },
        error : (err) => {
          console.error("Error getting semesters: ", err.error.message);
        }
      })

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

      this.newModuleForm.get('module')?.valueChanges.subscribe(selectedModule => {
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

    isDragOver = false;

  //@Output() filesDropped = new EventEmitter<File[]>();
  droppedFiles: File[] = [];
  droppedLabFile: File[]= [];

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
      this.newModuleForm.get('modules')?.setValue(this.droppedFiles);
      this.newModuleForm.get('modules')?.markAsTouched();

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

  onDropLab(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);
      this.droppedLabFile.push(...files);
      this.newModuleForm.get('schedule')?.setValue(this.droppedLabFile);
      this.newModuleForm.get('schedule')?.markAsTouched();

      this.labFile = files[0];
    }
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files);
    this.newModuleForm.get('modules')?.setValue(this.droppedFiles);
    this.newModuleForm.get('modules')?.markAsTouched();
    //this.droppedFiles.push(...files);
  }

  uploadStudentFiles(event: any) {
    const input = event.target as HTMLInputElement;
    this.newModuleForm.get('modules')?.setValue(this.droppedFiles);
    this.newModuleForm.get('modules')?.markAsTouched();
  
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

            /*currentClass.weeks = line
              .match(/Wk([\d,]+)/)[1]
              .split(",")
              .map(Number);

              console.log("currentClass weeks: "+ currentClass.weeks);*/

              const weekMatch = line.match(/Wk([\d,\-]+)/); // match both comma and dash
              if (weekMatch) {
                const weekInfo = weekMatch[1];

                if (weekInfo.includes("-")) {
                  // handle range
                  const [startWeek, endWeek] = weekInfo.split("-").map(Number);
                  currentClass.weeks = [];
                  for (let i = startWeek; i <= endWeek; i++) {
                    currentClass.weeks.push(i);
                  }
                } else {
                  // handle comma-separated weeks
                  currentClass.weeks = weekInfo.split(",").map(Number);
                }

                console.log("currentClass weeks:", currentClass.weeks);
              }
        } else if (line.startsWith("Venue:")) {
            currentClass.venue = line.split(":")[1].trim();
        } else if (line.trimStart().match(/^\d+\t/)) {
            const studentData = line.split("\t");
            //const studentId = uuidv4();              
            currentClass.students.push({ name: studentData[1], vmsAcc: studentData[5].split("\r")[0] });
            //studentData[5].split("\r")[0]
        }
    });

    if (currentClass) {
        classes.push(currentClass);
    }

    return classes;
  };

  generateIDFromName(fullName: string): string {
    // Remove spaces and convert to uppercase
    const name = fullName.replace(/\s+/g, '').toUpperCase();

    // Sum of character codes
    const codeSum = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);

    // Get last 4 characters (or fewer if name is short)
    const suffix = name.slice(-4);

    return `ID${codeSum}${suffix}`;
  }

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

  async createSemester(){
    this.submit = true;

    let annualYear = "";
    let semesterID = "";
    let startDate = "";
    //Convert to Date type just in case
    let week1StartDate = new Date();

    this.semesterService.getSpecificSemester(this.newModuleForm.value.semester).subscribe({
      next: (response) => {
        console.log(response);

        annualYear = response.annualYear;
        semesterID = response.semesterID;
        startDate = response.week1StartDate         
        //Convert to Date type just in case
        week1StartDate = new Date(startDate);

        console.log(annualYear);
        console.log(week1StartDate);
        console.log(semesterID);
        console.log(startDate);

        this.submitDetails(annualYear, semesterID, week1StartDate, startDate);
        
      }
    })              
  }

  async submitDetails(annualYear: string, semesterID: string, week1StartDate: Date, startDate: string){
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
      }
      console.log(labDataMap);
      //setProgress(10); // Set progress to 10% after lab file processing
    } else {
        this.toastr.error("Lab File not uploaded. Please upload the file.","ERROR");
    }
    
    if(this.selectedFiles && startDate){
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
                        //this.submit = false;        
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
                    //this.submit = false;        
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
                    //this.submit = false;        
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

}