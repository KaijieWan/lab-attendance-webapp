import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Inject, QueryList, ViewChildren } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, FormBuilder, FormArray, FormsModule} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatExpansionPanel } from '@angular/material/expansion';
import { debounceTime, map, Observable, of } from 'rxjs';
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

@Component({
  selector: 'app-newRoleDialog-page',
  standalone: true,
  templateUrl: './newRoleDialog.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule,
     MatExpansionModule, MatExpansionPanel, MatListModule, MatRadioModule, MatCheckboxModule,
     MatStepperModule, MatInputModule, MatButtonModule, MatFormFieldModule, FormsModule,
     MatSelectModule, MatOptionModule
  ],
  styleUrl: './newRoleDialog.component.scss'
})

export class NewRoleDialogComponent {
  @ViewChildren(MatExpansionPanel) dropdownPanels!: QueryList<MatExpansionPanel>;

    submit: boolean = false;
    rolePermissionsForm: FormGroup;
    updateRoleForm: FormGroup;
    distinctRoles: string[] = [];
    selectedRole: string = '';
    displayPermissions: any[] = [];
    currentView: 'addRole' | 'updateRole' = 'addRole';
    allowedActions: string[] = ['Read, Create, Delete, Update', 'Read, Update', 'Read', 'No Access', 'Allow', 'Do Not Allow']
    selectedPermissions: { [key: string]: string[] } = {};

    errorMessage: string = '';
    toUpdateRole: string = '';
    reportingRoles: string[] = [];

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
        public dialogRef: MatDialogRef<NewRoleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private userService: UserService,
        private rolePermissionService: RolePermissionService,
        private fb: FormBuilder,
        private toastr: ToastrService,
    ) {
        this.rolePermissionsForm = this.fb.group({
          create_role: new FormControl('', Validators.required),
          reports_to: this.fb.array([]),
        });

        this.updateRoleForm = this.fb.group({
          update_role: new FormControl('', Validators.required),
          reports_to: this.fb.array([]),
        });

        this.pages.forEach(page => {
          this.rolePermissionsForm.addControl(page.title, new FormControl('', Validators.required));          
        });

        this.functions.forEach((Function) => {
          this.rolePermissionsForm.addControl(Function.title, new FormControl('', Validators.required));
        });

        this.pages.forEach(page => {
          this.updateRoleForm.addControl(
            this.getControlName(page.title),
            new FormControl(null)
          );
        });

        this.functions.forEach(func => {
          this.updateRoleForm.addControl(
            this.getControlName(func.title),
            new FormControl(null)
          );
        });
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

    ngOnInit() {
        this.rolePermissionService.getDistinctRoles().subscribe({
            next: (response) => {
              this.distinctRoles = response;
            }
        })        
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
      this.fetchPermissions(selectedRole);
    }

    fetchPermissions(role: string): void {
        this.rolePermissionService.getRolePermissions(role).subscribe({
            next: (response) => {
                console.log(response);
                this.displayPermissions = response;
                this.reportingRoles = this.displayPermissions[0].reportsTo.split(',');
                const reportsTo: FormArray = this.updateRoleForm.get('reports_to') as FormArray;
                this.reportingRoles.forEach(role => {
                  if (!reportsTo.value.includes(role)) {
                    reportsTo.push(new FormControl(role));
                  }
                });

                this.displayPermissions.forEach(item => {
                  const pageActions = item.actions=="na" ? item.actions.toUpperCase() : this.formatPageAction(item.actions);
                  const functionActions = this.formatFunctionAction(item.actions);
                  const controlName = this.getControlName(this.formatTitle(item.permissionType));
                  console.log(this.formatTitle(item.permissionType));

                  console.log(`Formatted Page Actions: ${pageActions}`);
                  console.log(`Formatted Function Actions: ${functionActions}`);
                  console.log(`Control Name: ${controlName}`);              
                    
                  // Check if the stored action is in the allowed list
                  if(this.pages_actions.includes(pageActions)){
                    console.log(`Setting value: ${pageActions} for ${controlName}`);
                    this.updateRoleForm.get(controlName)?.setValue(this.removeSpaces(pageActions.toLowerCase()) || null);
                  } else {
                    console.log(`Action ${pageActions} not found in pages_actions!`);
                  }

                  if(this.functions_actions.includes(functionActions)){
                    console.log(`Setting value: ${functionActions} for ${controlName}`);
                    this.updateRoleForm.get(controlName)?.setValue(this.underscoreSpaces(functionActions.toLowerCase()) || null);
                  } else {
                    console.log(`Action ${functionActions} not found in functions_actions!`);
                  }
                  
                  
                })
            }
        })
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

    onCheckboxChangeCreateRole(event: any, item: string) {
      const reportsTo: FormArray = this.rolePermissionsForm.get('reports_to') as FormArray;
    
      if (event.checked) {
        // Add item if checked
        reportsTo.push(new FormControl(item));
      } else {
        // Remove item if unchecked
        const index = reportsTo.controls.findIndex(x => x.value === item);
        if (index > -1) {
          reportsTo.removeAt(index);
        }
      }
    }

    onCheckboxChangeUpdateRole(event: any, item: string){
      const reportsTo: FormArray = this.updateRoleForm.get('reports_to') as FormArray;
    
      if (event.checked) {
        // Add item if checked
        reportsTo.push(new FormControl(item));
      } else {
        // Remove item if unchecked
        const index = reportsTo.controls.findIndex(x => x.value === item);
        if (index > -1) {
          reportsTo.removeAt(index);
        }
      }
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

    createRole(){
        this.submit = true;
        const formValues = this.rolePermissionsForm.value;

        // Group permissions by permissionType (page title)
        const pagePermissions = this.pages.map((page) => {
            return {
                permissionType: page.title.toLowerCase().replace(/\s+/g, '_'),                
                actions: formValues[page.title],
            };
        })

        const functionPermissions = this.functions.map((func) => {
            return {
                permissionType: func.title.toLowerCase().replace(/\s+/g, '_'),
                actions: formValues[func.title],
            };
        })
        console.log(this.rolePermissionsForm.value);

        // Combine pages and functions permissions
        const permissions = [...pagePermissions, ...functionPermissions];

        console.log(permissions);

        const payload = {
            role: this.rolePermissionsForm.value.create_role,
            reportsTo: this.rolePermissionsForm.value.reports_to.join(','),
            permissions: permissions,
        };

        console.log('API Payload:', payload);

        this.rolePermissionService.createRole(payload).subscribe({
            next: (response) => {
                switch(response.status){
                    case "SUCCESS" : {
                        console.log('Creation of new role successful:', response);
                        this.toastr.success("Created New Role!", "SUCCESS");
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
                console.error('Error creating role:', err);
                this.errorMessage = err.error.message || 'Error: Role not created.';
                this.submit = false;          
            }
        });
    }

    updateRole(){
        this.submit = true;
        const formValues = this.updateRoleForm.value;       

        // Group permissions by permissionType (page title)
        const pagePermissions = this.pages.map((page) => {
          const controlName = this.getControlName(page.title); 
          return {
              permissionType: page.title.toLowerCase().replace(/\s+/g, '_'),                
              actions: formValues[controlName],
            };
        })

        const functionPermissions = this.functions.map((func) => {
          const controlName = this.getControlName(func.title);
            return {
                permissionType: func.title.toLowerCase().replace(/\s+/g, '_'),
                actions: formValues[controlName],
            };
        })
        console.log(this.rolePermissionsForm.value);

        // Combine pages and functions permissions
        const permissions = [...pagePermissions, ...functionPermissions];

        console.log(permissions);

        const payload = {
            role: this.toUpdateRole,
            reportsTo: this.updateRoleForm.value.reports_to.join(','),
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