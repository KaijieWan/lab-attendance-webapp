import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Inject } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, FormBuilder, FormArray} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, map, Observable, of } from 'rxjs';
import { RolePermissionService } from '../../service/rolePermission.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';


@Component({
  selector: 'app-newRoleDialog-page',
  standalone: true,
  templateUrl: './newRoleDialog.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, MatDialogModule, MatButtonModule, CommonModule],
  styleUrl: './newRoleDialog.component.scss'
})

export class NewRoleDialogComponent {
    submit: boolean = false;
    rolePermissionsForm: FormGroup;
    updateRoleForm: FormGroup;
    distinctRoles: string[] = [];
    selectedRole: string = '';
    displayPermissions: any[] = [];
    currentView: 'addRole' | 'updateRole' = 'addRole';
    allowedActions: string[] = ['read', 'write', 'delete', 'allow']
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
        { title: 'Create New User'},
        { title: 'Add New Semester'}
    ]
    
    pages_actions = ['Read', 'Write', 'Delete'];

    functions_actions = ['Allow'];

    constructor(
        public dialogRef: MatDialogRef<NewRoleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private userService: UserService,
        private rolePermissionService: RolePermissionService,
        private fb: FormBuilder,
        private toastr: ToastrService,
    ) {
        this.rolePermissionsForm = this.fb.group({});
        this.updateRoleForm = this.fb.group({});
    }

    getControlName(page: string, action: string): string {
        return `${page}_${action}`.replace(/\s+/g, '_').toLowerCase();
      }

    ngOnInit() {
        this.rolePermissionsForm = this.fb.group({
            create_role: new FormControl('', Validators.required),
            reports_to: this.fb.array([]),
        });

        this.updateRoleForm = this.fb.group({
            update_role: new FormControl('', Validators.required),
            reports_to: this.fb.array([]),
        });
    
        // Dynamically create form controls for each page and action [Create role]
        this.pages.forEach((page) => {
          this.pages_actions.forEach((action) => {
            const controlName = this.getControlName(page.title, action);
            this.rolePermissionsForm.addControl(controlName, new FormControl(false));
          });
        });

        this.functions.forEach((Function) => {
            this.functions_actions.forEach((action) => {
              const controlName = this.getControlName(Function.title, action);
              this.rolePermissionsForm.addControl(controlName, new FormControl(false));
            });
        });

        this.rolePermissionService.getDistinctRoles().subscribe({
            next: (response) => {
              this.distinctRoles = response;
            }
        })

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

    onRoleChange(event: Event): void {
        const selectedRole = (event.target as HTMLSelectElement).value;
        this.toUpdateRole = selectedRole;
        this.fetchPermissions(selectedRole);
    }

    fetchPermissions(role: string): void {
        this.rolePermissionService.getRolePermissions(role).subscribe({
            next: (response) => {
                this.displayPermissions = response;
                this.reportingRoles = this.displayPermissions[0].reportsTo.split(',');
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

    onCheckboxChangeCreateRole(event: any, item: string) {
      const reportsTo: FormArray = this.rolePermissionsForm.get('reports_to') as FormArray;
    
      if (event.target.checked) {
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
    
      if (event.target.checked) {
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

    createRole(){
        this.submit = true;
        const formValues = this.rolePermissionsForm.value;

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