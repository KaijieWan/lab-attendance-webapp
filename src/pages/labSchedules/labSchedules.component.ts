import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Injectable } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { RefreshService } from '../../app/shared/refresh.service';
import moment from 'moment';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth'
import { Calendar, EventInput, CalendarOptions } from '@fullcalendar/core'
import { UserService } from '../../service/user.service';
import { UserResponse } from '../../service/user.service';
import { LabSessionService } from '../../service/labSession.service';
import { ClassGroupService } from '../../service/classGroup.service';
import { LabSession, ClassGroup, ClassGroupID, Lab, LabID, Module } from './labCalendar.component';
import tippy from "tippy.js";
import { CustomTimePipe } from "../courses/labSessionDetails.component";


export interface labs {
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
}

@Component({
  selector: 'app-labSchedules-page',
  standalone: true,
  templateUrl: './labSchedules.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, FormsModule, FullCalendarModule,
  ],
  styleUrl: './labSchedules.component.scss'
})



export class LabSchedulesComponent {
  currentView: 'courses' | 'labRoom' | 'semester' = 'courses';
  user!: UserResponse;
  labSessions: LabSession[] = [];
  timePipe: any;

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
  
  constructor(private router: Router, private userService: UserService, private refreshService: RefreshService,
    private labSessionService: LabSessionService, private classGroupService: ClassGroupService,
    private cdRef: ChangeDetectorRef
  ){
    this.timePipe = new CustomTimePipe();
    const userID = sessionStorage.getItem('id');

    this.refreshService.refresh$.subscribe(() => {      
      if(userID){
        this.getUserData(userID);
      }
    })
  }

  getUserData(userID: string){
    const semesterID = sessionStorage.getItem('semesterID');
    if(semesterID){
      this.userService.getUser(parseInt(userID)).subscribe({
        next: (response) => {
          this.user = response;
          this.user.modules = this.user.modulesAssigned.split(',');
          console.log("User Modules: " + this.user.modules);
  
          this.user.modules.forEach(module => {
            this.getClassGroups(module, semesterID)
          })
        }
      })
    }

    setTimeout(() => this.initializeCoursesView(), 500);
  }
    

  getClassGroups(module: string, semesterID: string){
    this.classGroupService.fetchClassGroupsByModuleAndSemester(module, semesterID).subscribe({
      next: (response) => {
        console.log(response);
        response.forEach((item: { classGroupId: { classGroupID: any; }; }) => {
          this.refreshData(item.classGroupId.classGroupID, module, semesterID);
        })
        
        this.initializeCoursesView();
        this.cdRef.detectChanges();
      }
    })
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin],
    initialView: 'timeGridWeek', // Shows the week view with time slots as intial view
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    slotMinTime: '08:30:00',  // Start time
    slotMaxTime: '19:30:00',  // End time
    allDaySlot: false,
    stickyHeaderDates: true,
    slotLabelInterval: '01:00:00',
    slotDuration: '00:30:00',
    eventMaxStack: 2,
    hiddenDays: [0],

    //Time format: '2025-02-07T10:00:00'
    
    events: [] as EventInput,
    eventContent: (info: { event: { title: any; extendedProps: { 
      startTime: any; endTime: any; location: any; classGroup: any; 
      studentCount: any; labName: any,
    }; }; }) => {
      return {
        html: `<b>${info.event.title}: </b> <br>
        ${info.event.extendedProps.classGroup}<br>
               📍 ${info.event.extendedProps.location}<br>`
      };
    }
  };

  initializeCoursesView(){
    this.calendarOptions = {
      ...this.calendarOptions,
                events: this.labSessions.map(labSession => ({
                  id: labSession.labSessionID,
                  title: labSession.classGroupID.moduleCode,
                  start: new Date(`${labSession.date}T${labSession.startTime}`).toISOString(),
                  end: new Date(`${labSession.date}T${labSession.endTime}`).toISOString(),
                  color: '#3788d8',
                  extendedProps: {
                    labName: labSession.labID.labName,
                    location: `Room ${labSession.labID.room}`,
                    classGroup: labSession.classGroupID.classGroupID,
                    startTime: labSession.startTime,
                    endTime: labSession.endTime,
                  }
                })) as EventInput
    };
    this.cdRef.detectChanges();
  }

  ngOnInit(){

  } 

  switchView(view: 'courses' | 'labRoom' | 'semester'): void {
    this.currentView = view;
    const semesterID = sessionStorage.getItem('semesterID');

    if(this.currentView=="courses"){
      const userID = sessionStorage.getItem('id');
      if(userID){
        this.getUserData(userID);
      }

      this.calendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin],
                  initialView: 'timeGridWeek', // Shows the week view with time slots as intial view
                  headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  },
                  slotMinTime: '08:30:00',  // Start time
                  slotMaxTime: '19:30:00',  // End time
                  allDaySlot: false,
                  stickyHeaderDates: true,
                  slotLabelInterval: '01:00:00',
                  slotDuration: '00:30:00',
                  eventMaxStack: 2,
                  hiddenDays: [0],

                  //Time format: '2025-02-07T10:00:00'
                  
                  eventContent: (info: { event: { title: any; extendedProps: { 
                    startTime: any; endTime: any; location: any; classGroup: any; 
                    studentCount: any;
                  }; }; }) => {
                    return {
                      html: `<b>${info.event.title}: </b> <br>
                      ${info.event.extendedProps.classGroup}<br>
                            📍 ${info.event.extendedProps.location}<br>`
                    };
                  },
                  events: this.labSessions.map(labSession => ({
                    id: labSession.labSessionID,
                    title: labSession.classGroupID.moduleCode,
                    start: new Date(`${labSession.date}T${labSession.startTime}`).toISOString(),
                    end: new Date(`${labSession.date}T${labSession.endTime}`).toISOString(),
                    color: '#3788d8',
                    extendedProps: {
                      labName: labSession.labID.labName,
                      location: `Room ${labSession.labID.room}`,
                      classGroup: labSession.classGroupID.classGroupID,
                      startTime: labSession.startTime,
                      endTime: labSession.endTime,
                    }
                  })) as EventInput
      };
    }

    if(this.currentView=="semester"){
      
      
      this.calendarOptions = {
        ...this.calendarOptions,
        initialView: 'semester',
        multiMonthMinWidth: 100,
        multiMonthMaxColumns: 2, // Controls the number of columns (months per row)
        hiddenDays: [0, 6],
        eventDidMount: (info) => {
          const startTime = this.timePipe.transform(info.event.extendedProps['startTime']);
          const endTime = this.timePipe.transform(info.event.extendedProps['endTime']);
          tippy(info.el, {
            
           content: `<strong>${info.event.title}</strong><br>
                👥${info.event.extendedProps['classGroup']}<br>
                ${info.event.extendedProps['labName']}<br>
                📍 ${info.event.extendedProps['location']}<br>
                🕒 ${startTime} - ${endTime}<br>
           `,
           allowHTML: true
           
           })
         },
         

        initialDate: "2025-01-01",
        views: {
          semester: {
            type: 'multiMonth',
            duration: { months: 5 }
          }
        },
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,semester', // Include Multi-Month in view options
        },

        
        events: this.labSessions.map(labSession => ({
          id: labSession.labSessionID,
          title: labSession.classGroupID.moduleCode,
          start: new Date(`${labSession.date}T${labSession.startTime}`).toISOString(),
          end: new Date(`${labSession.date}T${labSession.endTime}`).toISOString(),
          color: '#3788d8',
          extendedProps: {
            labName: labSession.labID.labName,
            location: `Room ${labSession.labID.room}`,
            classGroup: labSession.classGroupID.classGroupID,
            startTime: labSession.startTime,
            endTime: labSession.endTime,
          }
        })) as EventInput
      };
    }
  }

  refreshData(classGroupId: string, moduleCode: string, semseterId: string){
    this.labSessionService.getSpecificLabSessions(classGroupId, moduleCode, semseterId).subscribe((response: LabSession[]) =>{
        //console.log("labSession:", response);

        this.labSessions = this.labSessions.concat(response);
      }
    )
  }  

  navigateToLabSchedule(labRoom: string){
    this.router.navigate([`/drawer/labSchedules/labCalender/${labRoom}`]);
  }
  
}