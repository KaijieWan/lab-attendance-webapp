import { DatePipe, CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet, RouterModule, ActivatedRoute, Router } from "@angular/router";
import { ClassGroupService } from "../../service/classGroup.service";
import { ToastrModule, ToastrService } from "ngx-toastr";
import { CreateUserDialogComponent } from "../accManagement/createUserDialog.component";
import { RolePermissionService } from "../../service/rolePermission.service";
import { MatDialog } from "@angular/material/dialog";
import { CreateLabSessionComponent } from "./createLabSession.component";

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

interface RolePermission {
    permissionType: string,
    actions: string[];
}

@Component({
    selector: 'appClassGroupsPage',
    standalone: true,
    templateUrl: './classGroups.component.html',
  
    imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule],
    styleUrl: './classGroups.component.scss'
})

export class ClassGroupsComponent{
    courseId: string = "";
    classGroups: ClassGroupDTO[] = [];

    constructor(private route: ActivatedRoute, private classGroupService: ClassGroupService,
        private router: Router, private toastr: ToastrService, private rolePermissionService: RolePermissionService,
        private dialog: MatDialog,
    ) {}

    ngOnInit() {
        // Fetch the ID from the URL
        this.courseId = this.route.snapshot.paramMap.get('id')!;
        // Use this ID to fetch course details from your service
        console.log('Selected Course ID:', this.courseId);
        const semester = sessionStorage.getItem('semesterID');
        if(semester){
          this.fetchClassGroups(this.courseId, semester);
        }   
    }

    fetchClassGroups(moduleCode: string, semesterID: string){
        this.classGroupService.fetchClassGroupsByModuleAndSemester(moduleCode, semesterID).subscribe({
            next: (response) => {
                console.log(response);
                this.classGroups = response;
            }
        });
    }

    navigateToLabSessions(labGroupId: string){
        this.router.navigate([`/drawer/courses/${this.courseId}/labgroups/${labGroupId}`]);
    }

    openCreateLabSession(): void {
        console.log("openCreateLabSession");
        const sessionData = sessionStorage.getItem('userDetails');
        if (!sessionData) {
          //Perhaps use a toastr to display denied message
          console.log("openCreateLabSession: sessionData not found");
          this.toastr.error("Access To Creating New Lab Session Denied");
        }
        else{
          console.log("openCreateUserDialog: sessionData found");
          const userDetails = JSON.parse(sessionData);
          console.log(userDetails.user.role);
          this.rolePermissionService.getRolePermissions(userDetails.user.role.toString()).subscribe({
            next: (response: RolePermission[]) => {
              const permission = response.find(
                (item) => item.permissionType === 'courses_page'
              );
              console.log(permission);
              
              if (!permission || !permission.actions.includes('create')) {
                //Perhaps use a toastr to display denied message
                console.log("Permission for allow creating of new lab session not found")
                this.toastr.error("Access To Creating New Lab Session Denied", "ERROR");
              }
              else{
                const dialogRef = this.dialog.open(CreateLabSessionComponent, {
                  width: '1000px',
                  panelClass: 'custom-dialog-container',
                  data: { courseId: this.courseId }, // Optional data to pass to dialog
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

}