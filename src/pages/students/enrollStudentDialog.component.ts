import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Inject, QueryList, ViewChildren } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, FormBuilder, FormArray, FormsModule} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatExpansionPanel } from '@angular/material/expansion';
import { debounceTime, forkJoin, map, Observable, of } from 'rxjs';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ClassGroupService } from '../../service/classGroup.service';
import { ModuleService } from '../../service/module.service';
import { LabSession } from '../labSchedules/labCalendar.component';
import { LabSessionService } from '../../service/labSession.service';
import { SemesterDTO, SemesterService } from '../../service/semester.service';

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

@Component({
  selector: 'app-newRoleDialog-page',
  standalone: true,
  templateUrl: './enrollStudentDialog.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule,
     MatExpansionModule, MatExpansionPanel, MatListModule, MatRadioModule, MatCheckboxModule,
     MatStepperModule, MatInputModule, MatButtonModule, MatFormFieldModule, FormsModule,
     MatSelectModule, MatOptionModule
  ],
  styleUrl: './enrollStudentDialog.component.scss'
})

export class EnrollStudentDialogComponent {
  @ViewChildren(MatExpansionPanel) dropdownPanels!: QueryList<MatExpansionPanel>;

    submit: boolean = false;
    labGroupEnrolmentForm: FormGroup;
    currentView: 'addRole' | 'updateRole' = 'addRole';
    allowedActions: string[] = ['Read, Create, Delete, Update', 'Read, Update', 'Read', 'No Access', 'Allow', 'Do Not Allow']
    selectedPermissions: { [key: string]: string[] } = {};

    errorMessage: string = '';
    toUpdateRole: string = '';
    reportingRoles: string[] = [];
    studentID: string = "";
    classGroups: ClassGroupDTO[] = [];
    modules: string[] = [];
    labSessions: LabSession[] = [];
    allSemesterModules: string[] = [];
    semesters: SemesterDTO[]= [];
    semester: string = "";
    moduleGroups = new Map<string, any[]>();
    selectedModules: string[] = [];
    selectedLabGroups = new Map<string, string[]>();

    pages = [
        { title: 'Courses Page' },
        { title: 'Students Page' },
        { title: 'Lab Schedules Page'},
        { title: 'Absences Page'},
        { title: 'Accounts Management Page'}
      ];

    functions = [
        { title: 'Role Management'},
        //{ title: 'User Management'},
        { title: 'Add New Semester'}
    ]
    
    pages_actions = ['Read, Create, Delete, Update', 'Read, Update', 'Read', 'NA'];

    functions_actions = ['Allow', 'Do Not Allow'];

    constructor(
        public dialogRef: MatDialogRef<EnrollStudentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private userService: UserService,
        private rolePermissionService: RolePermissionService,
        private fb: FormBuilder,
        private toastr: ToastrService, private classGroupService: ClassGroupService,
        private labSessionService: LabSessionService, private semesterService: SemesterService
    ) {
        this.labGroupEnrolmentForm = this.fb.group({
          enrolModules: this.fb.array([]),
          enrolLabGroups: this.fb.group({})
        });
    }

    fetchClassGroups(moduleCode: string){
      //Latest semester
      this.classGroupService.fetchClassGroupsByModuleAndSemester(moduleCode, this.semester).subscribe({
          next: (response) => {
              //console.log(response);
              //this.classGroups = response;
              return response;
          }
      });
    }

    fetchModules(semesterID: string){
      this.labSessionService.getAllLabSessions().subscribe((response: LabSession[]) =>{
        this.labSessions = response;
        this.labSessions = this.labSessions.filter((labSession) => labSession.classGroupID.semesterID == semesterID);
        this.allSemesterModules = Array.from(
          new Set(this.labSessions.map(item => item.classGroup.module.moduleCode))
        );
      })
    }

    getControlName(page: string): string {
        return `${page}`.replace(/\s+/g, '_').toLowerCase();
    }

    formatTitle(text: string): string {
      return text
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    formatPageAction(text: string): string {
      return text
        .split(',')                      // Split string by commas
        .map(action => action.trim())    // Trim spaces
        .map(action => action.charAt(0).toUpperCase() + action.slice(1)) // Capitalize
        .join(', ');   
    }

    formatFunctionAction(text: string){
      return text
      .split('_')                      // Split string by commas
      .map(action => action.trim())    // Trim spaces
      .map(action => action.charAt(0).toUpperCase() + action.slice(1)) // Capitalize
      .join(' '); 
    }

    getLatestSemester(){
      const latestAnnualYear = this.semesters.reduce((prev, current) =>
        Number(current.annualYear.at(-2)) > Number(prev.annualYear.at(-2)) ? current : prev
      );
      const sameAnnualYear = this.semesters.filter((semester) => latestAnnualYear.annualYear === semester.annualYear)
      console.log(sameAnnualYear);
      this.semester = (sameAnnualYear.find(s => Number(s.semester) === 2) || sameAnnualYear.find(s => Number(s.semester) === 1) )?.semester_ID!;
      console.log(this.semester);
    }

    ngOnInit() {
      this.studentID = this.data.studentID;

      this.semesterService.getAllSemesters().subscribe({
        next: (response) => {
          this.semesters = response;
          this.getLatestSemester();
          this.fetchAllCurrentModules();
          //console.log(this.moduleGroups);          
        },
        error : (err) => {
          console.error("Error getting semesters: ", err.error.message);
        }
      })
      
      //this.fetchClassGroups();
      
    }

    assignLabGroups(){
      console.log(this.selectedModules);
      this.selectedModules.forEach((module) => {
        const keys = Object.keys(this.moduleGroups.get(module) ?? {});
        this.selectedLabGroups.set(module, keys);
      })
      console.log(this.selectedLabGroups);

      const enrolLabGroups = this.labGroupEnrolmentForm.get('enrolLabGroups') as FormGroup;

      this.selectedModules.forEach((moduleCode) => {
        enrolLabGroups.addControl(moduleCode, this.fb.control(''));
      });

    }

    get enrolLabGroupsFormGroup(): FormGroup {
      return this.labGroupEnrolmentForm.get('enrolLabGroups') as FormGroup;
    }

    allSelectedModuleControlsAdded(): boolean {
      const group = this.labGroupEnrolmentForm.get('enrolLabGroups') as FormGroup;
      return this.selectedModules.every(mod => group.contains(mod));
    }
    

    fetchAllCurrentModules(){
      this.labSessionService.getAllLabSessions().subscribe((response: LabSession[]) =>{
        this.labSessions = response;
        this.labSessions = this.labSessions.filter((labSession) => labSession.classGroupID.semesterID == this.semester);
        this.allSemesterModules = Array.from(
          new Set(this.labSessions.map(item => item.classGroup.module.moduleCode))
        );
        this.allSemesterModules.forEach((module) => {
          this.classGroupService.fetchStudentsByModuleAndSemester(module, this.semester).subscribe({
            next: (response) => {
              //console.log("Response for module", module, response);
              this.moduleGroups.set(module, response);
            }
          })
        })

      })
    }

    isModuleDisabled(module: string){
      //console.log(this.moduleGroups.get(module));
      const groups = Object.values(this.moduleGroups.get(module) || {});
      //console.log(groups);
      return groups.some((group: any[]) =>
        group.some((student: any) => student["Student_ID"] === this.studentID)
      );              
    }

    ngAfterViewInit(){
      this.dropdownPanels.toArray();
    }

    switchView(view: 'addRole' | 'updateRole'): void {
        this.currentView = view;
    }

    onRoleChange(event: MatSelectChange): void {
      console.log("onRoleChange called!", event.value);
      const selectedRole = event.value;
      this.toUpdateRole = selectedRole;
    }


    onPanelOpened(openedPanel: MatExpansionPanel){
      this.dropdownPanels.forEach((item) => {
        if(openedPanel!==item){
          item.close();
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

    onCheckboxChange(event: any, item: string) {
      const enrolModules: FormArray = this.labGroupEnrolmentForm.get('enrolModules') as FormArray;    
      if (event.checked) {
        // Add item if checked
        enrolModules.push(new FormControl(item));
      } else {
        // Remove item if unchecked
        const index = enrolModules.controls.findIndex(x => x.value === item);
        if (index > -1) {
          enrolModules.removeAt(index);
        }
      }

      this.selectedModules = this.labGroupEnrolmentForm.value.enrolModules;
      //console.log(this.selectedModules);
    }

    isReportingRoleChecked(reportingRole: string){
      return this.reportingRoles?.includes(reportingRole) || false;
    }

    removeSpaces(action: string): string {
      return action.replace(/\s/g, '').toLowerCase();
    }

    underscoreSpaces(action: string): string {
      return action.replace(/\s/g, '_');
    }

    enrol(){
        this.submit = true;
        //Enroll the student into the respective class groups
        this.labGroupEnrolmentForm.value.enrolModules.join(',');
        const enrolmentObservables = Object.entries(this.labGroupEnrolmentForm.get('enrolLabGroups')?.value || {}).map(
          ([module, group]) => {
            const enrolmentPayload = {
              classGroupEnrolledStudentsId: {
                studentId: this.studentID,
                classGroupId: group,
                moduleCode: module,
                semesterID: this.semester,
              }
            };
            return this.classGroupService.enrollStudentInClassGroup(enrolmentPayload);
          }
        );
        
        forkJoin(enrolmentObservables).subscribe({
          next: (responses) => {
            let allSuccessful = true;
            for (const response of responses) {
              switch (response.status) {
                case 'SUCCESS':
                  console.log('Enrolment successful:', response);
                  break;
                default:
                  allSuccessful = false;
                  console.log('Enrolment failed:', response);
                  this.toastr.error(response.message, response.status);
                  this.errorMessage = response.message;
                  break;
              }
            }
        
            if (allSuccessful) {
              this.toastr.success('All enrolments were successful!', 'SUCCESS');
              this.submit = false;
              this.dialogRef.close();
            }
          },
          error: (err) => {
            console.error('Error in one or more enrolments:', err);
            this.toastr.error(err.error?.message || 'Error during enrolment.');
            this.errorMessage = err.error?.message || 'Unknown error during enrolment.';
            this.submit = false;
          }
        });
        
        
    }
}