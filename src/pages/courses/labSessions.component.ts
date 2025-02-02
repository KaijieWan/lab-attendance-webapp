import { DatePipe, CommonModule } from "@angular/common";
import { Component, NgModule, Pipe, PipeTransform } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet, RouterModule, ActivatedRoute, Router } from "@angular/router";
import { ClassGroupService } from "../../service/classGroup.service";
import { LabSessionService } from "../../service/labSession.service";
import moment from 'moment';

interface LabSessionDTO {
    date: string;
    startTime: string;
    endTime: string;
}

interface LabSessionDetailsDTO {
    date: string;
    startTime: string;
    endTime: string;
    classGroupID: {
        classGroupID: string;
        moduleCode: string;
        semesterID: string;
    }
    isMakeUpLabSession: boolean;
    lab: {
        id: {
            labName: string;
            room: number;
        };
        capacity: number;
    };
    labSessionID: string;
}

@Pipe({
    name: 'customTimePipe',
    standalone: true
})
export class CustomTimePipe implements PipeTransform {
    transform(value: any, args?: any): any {
      return moment(value,'HH:mm').format("HH:mm");
    }
}

@Component({
    selector: 'appLabSessionsPage',
    standalone: true,
    templateUrl: './labSessions.component.html',
  
    imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, RouterModule, CustomTimePipe],
    styleUrl: './labSessions.component.scss'
})

export class LabSessionsComponent{
    courseId: string = "";
    labGroupId: string = "";
    labSessions: LabSessionDetailsDTO[] = [];

    constructor(private route: ActivatedRoute, private labSessionService: LabSessionService,
        private router: Router
    ) {}

    ngOnInit() {
        // Fetch the ID from the URL
        this.courseId = this.route.snapshot.paramMap.get('id')!;
        this.labGroupId = this.route.snapshot.paramMap.get('classGroupId')!;
        const semester = sessionStorage.getItem('semesterID');
        console.log('Selected Course and Lab group:', this.courseId, this.labGroupId);

        if(semester){
            this.fetchLabSessions(this.labGroupId, this.courseId, semester);
        }
        
    }

    fetchLabSessions(classGroupId: string, moduleCode: string, semesterId: string){
        this.labSessionService.getSpecificLabSessions(classGroupId, moduleCode, semesterId).subscribe({
            next: (response) => {
                console.log(response);
                this.labSessions = response;
                this.labSessions.sort((b, a) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }
        })
    }

    navigateToLabSessionDetails(labSession: LabSessionDetailsDTO){
        sessionStorage.setItem('selectedLabSession', JSON.stringify(labSession));
        this.router.navigate([`/drawer/courses/${this.courseId}/labgroups/${this.labGroupId}/${labSession.date}`]);
    }


}