import { DatePipe, CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet, RouterModule, ActivatedRoute, Router } from "@angular/router";
import { ClassGroupService } from "../../service/classGroup.service";

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
        private router: Router
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

}