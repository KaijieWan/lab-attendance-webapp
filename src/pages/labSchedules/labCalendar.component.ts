import {Component, ViewChild, AfterViewInit, OnInit, CUSTOM_ELEMENTS_SCHEMA} from "@angular/core";
import { LabSessionService } from '../../service/labSession.service';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RefreshService } from '../../app/shared/refresh.service';
import moment from 'moment';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, EventInput } from '@fullcalendar/core'
import { CustomTimePipe } from "../courses/labSessionDetails.component";

export interface LabSession {
  isMakeUpLabSession: boolean;
  classGroupID: ClassGroupID;
  labID: LabID;
  classGroup: ClassGroup;
  lab: Lab;
  startTime: string;  // Format: "12:30:00"
  endTime: string;    // Format: "14:20:00"
  date: string;       // Format: "2025-03-25"
  labSessionID: string;
}

export interface ClassGroupID {
  classGroupID: string;
  moduleCode: string;
  semesterID: string;
}

export interface LabID {
  labName: string;
  room: number;
}

export interface ClassGroup {
  classGroupId: ClassGroupID;
  module: Module;
}

export interface Module {
  moduleCode: string;
}

export interface Lab {
  id: LabID;
  capacity: number;
}

@Component({
  selector: 'app-labCalendar',
  templateUrl: './labCalendar.component.html',
  styleUrls: ['./labCalendar.component.scss'],
  standalone: true,

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule,
    FormsModule, FullCalendarModule],
})
export class LabCalendarComponent {  
  labSessions: LabSession[] = [];
  lab: string = "";
  timePipe: any;

  //labs!: labs;

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

  constructor(private labSessionService: LabSessionService, private route: ActivatedRoute,
    private refreshService: RefreshService,
  ){
    this.timePipe = new CustomTimePipe();
  }

  calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek', // Shows the week view with time slots as intial view
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    slotMinTime: '08:00:00',  // Start time
    slotMaxTime: '20:00:00',  // End time
    allDaySlot: false,
    stickyHeaderDates: true,
    slotLabelInterval: '00:30:00',
    eventMaxStack: 2,

    //Time format: '2025-02-07T10:00:00'
    
    events: [] as EventInput,
    eventContent: (info: { event: { title: any; extendedProps: { 
      startTime: any; endTime: any; location: any; classGroup: any; 
      studentCount: any;
    }; }; }) => {
      return {
        html: `<b>${info.event.title}: </b> <br>
        ${info.event.extendedProps.classGroup}<br>
               📍 ${info.event.extendedProps.location}<br>
               ${this.timePipe.transform(info.event.extendedProps.startTime)}-${this.timePipe.transform(info.event.extendedProps.endTime)}<br>
               `
      };
    }
  };


  ngOnInit(): void {
    //const resourceMap = [{ resourceId: room, resourceTitle: "Room " + room }];
    //const { data: session } = useSession();
    //const [events, setEvents] = useState<Event[]>([]);
    //const { selectedSemester, week1StartDate } = useSemester();
    //const prevSelectedSemester = useRef(selectedSemester);

    // Convert the week1StartDate to a moment object
    /*const week1StartDateMoment = moment(week1StartDate, "YYYY-MM-DD");
    // Update the time to 8:30 AM
    week1StartDateMoment.set({ hour: 8, minute: 30, second: 0, millisecond: 0 });

    // Create a moment object for the maximum date which should be 15 weeks later
    const maxDate = week1StartDateMoment.clone().add(15, "weeks");
    // Update time to 7:30 PM
    maxDate.set({ hour: 19, minute: 30, second: 0, millisecond: 0 });*/

    //const [date, setDate] = useState(min([new Date(), maxDate.toDate()]));
    //const [view, setView] = useState(Views.WORK_WEEK);    

    this.lab = this.route.snapshot.paramMap.get('lab')!;

    if(this.labSessions.length == 0){
      this.refreshService.refresh$.subscribe(() => {
        const semester = sessionStorage.getItem('semesterID');
        if(semester){
          //this.refreshData(semester);
          this.fetchAllRooms(this.lab, semester);
        }
      })  
    }    
  }

  fetchAllRooms(labName: string, semester: string){
    console.log(this.labs.hardware);
    let hardwarelabMatch = this.labs.hardware.find(lab => lab.name === labName);
    if (hardwarelabMatch) {
      hardwarelabMatch.rooms.forEach(room => {
        this.refreshData(semester, room);
      })      
    }

    let softwarelabMatch = this.labs.software.find(lab => lab.name === labName);
    if (softwarelabMatch) {
      softwarelabMatch.rooms.forEach(room => {
        this.refreshData(semester, room);
      })      
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.labSessions.map(labSession => ({
        id: labSession.labSessionID,
        title: labSession.classGroupID.moduleCode,
        start: new Date(`${labSession.date}T${labSession.startTime}`).toISOString(),
        end: new Date(`${labSession.date}T${labSession.endTime}`).toISOString(),
        color: '#3788d8',
        extendedProps: {
          location: `Room ${labSession.labID.room}`,
          classGroup: labSession.classGroupID.classGroupID,
          startTime: labSession.startTime,
          endTime: labSession.endTime,
        }
      })) as EventInput
    };
  }

  refreshData(semester: string, room: string){
    this.labSessionService.getLabSessionsByLabAndRoomAndSemester(this.lab, room, semester).subscribe((response: [LabSession, number][]) => {
      this.labSessions = this.labSessions.concat(response.map((item => item[0])));
    });
  }    
}
