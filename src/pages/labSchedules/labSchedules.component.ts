import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Injectable, ViewChild } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { RefreshService } from '../../app/shared/refresh.service';
import moment, { duration } from 'moment';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth'
import { Calendar, EventInput, CalendarOptions, ViewContentArg } from '@fullcalendar/core'
import { UserService } from '../../service/user.service';
import { UserResponse } from '../../service/user.service';
import { LabSessionService } from '../../service/labSession.service';
import { ClassGroupService } from '../../service/classGroup.service';
import { LabSession, ClassGroup, ClassGroupID, Lab, LabID, Module } from './labCalendar.component';
import tippy from "tippy.js";
import { CustomTimePipe } from "../courses/labSessionDetails.component";
import Swal from 'sweetalert2';
import { generateRandomColor } from '../../lib/utils';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';

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

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule, FormsModule, FullCalendarModule, MatSelectModule, 
    MatOptionModule, MatCheckbox],
  styleUrl: './labSchedules.component.scss'
})



export class LabSchedulesComponent {
  currentView: 'courses' | 'labRoom' | 'semester' = 'courses';
  user!: UserResponse;
  labSessions: LabSession[] = [];
  tempArray: LabSession[] = [];
  timePipe: any;
  lastSetDate: Date | null = null;
  lastView: string = "";
  semesterID: string | null = "";
  semesterNo: string = "";
  week1StartDate: Date | null = null;

  allSemesterModules: string[] = [];

  modulesFiltered: string[] = [];
  labRoomsFiltered: string[] = [];
  personalModulesFiltered: boolean = false;
  filteredLabs: string[] = [];
  filteredModules: string[] = [];
  allLabs: string[] = [];

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
  moduleColorMap!: Map<string, string>;
  
  constructor(private router: Router, private userService: UserService, private refreshService: RefreshService,
    private labSessionService: LabSessionService, private classGroupService: ClassGroupService,
    private cdRef: ChangeDetectorRef
  ){
    this.timePipe = new CustomTimePipe();
    const userID = sessionStorage.getItem('id');
    this.allLabs = [...this.labs.hardware.map(lab => lab.name), ...this.labs.software.map(lab => lab.name)]

    this.refreshService.refresh$.subscribe(() => {
      this.semesterID = sessionStorage.getItem('semesterID');
      if(sessionStorage.getItem('week1StartDate')){
        const storedDateString = sessionStorage.getItem('week1StartDate');
        console.log(storedDateString);
        this.week1StartDate = storedDateString ? new Date(storedDateString) : null;
      }      
      if(this.semesterID){
        this.semesterNo = this.semesterNo = this.semesterID?.slice(9);
        this.fetchAllLabSessions();
      }      
      if(userID){
        this.getUserData(userID);
      }
    })
  }

  fetchAllLabSessions(){
    this.labSessionService.getAllLabSessions().subscribe((response: LabSession[]) =>{
      this.labSessions = response;
      this.labSessions = this.labSessions.filter((labSession) => labSession.classGroupID.semesterID == this.semesterID);
      this.tempArray = [... this.labSessions];
      console.log(this.labSessions);
      this.allSemesterModules = Array.from(
        new Set(this.labSessions.map(item => item.classGroup.module.moduleCode))
      );

      this.moduleColorMap = new Map<string, string>();

      this.allSemesterModules.forEach((code, index) => {
        const randomColor = generateRandomColor();
        this.moduleColorMap.set(code, randomColor);
      });
      console.log(this.allSemesterModules);      
      setTimeout(() => this.initializeCoursesView(), 500);
      this.cdRef.detectChanges();

    })
  }

  getUserData(userID: string){
    const semesterID = sessionStorage.getItem('semesterID');    
    if(semesterID){
      this.semesterNo = semesterID?.slice(9);
      this.userService.getUser(parseInt(userID)).subscribe({
        next: (response) => {
          this.user = response;
          this.user.modules = this.user.modulesAssigned.split(',');
          console.log("User Modules: " + this.user.modules);
  
          /*this.user.modules.forEach(module => {
            this.getClassGroups(module, semesterID)
          })*/
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
        
        //this.initializeCoursesView();
      }
    })
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin],
    initialView: 'timeGridWeek', // Shows the week view with time slots as intial view
    initialDate: new Date(),
    views: {
      semester: {
        type: 'multiMonthYear',
        duration: {months: 5},
        multiMonthMaxColumns: 2, // Controls the number of columns (months per row)
        validRange: {
          start: '2025-01-01',  // Start of the semester (January 2025)
          end: '2025-05-31',     // End of the semester (May 2025)
        },
      },      
    },
    headerToolbar: {
      left: 'today',
      center: 'title,prev,next',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,semester',
    },
    datesSet: (dateInfo) => {
      const calendarApi = dateInfo.view.calendar;
      const newDate = new Date(dateInfo.startStr); // Start date of the current view
      let switchDate = "";
      
      // Prevent unnecessary updates
      if (this.lastSetDate && this.lastSetDate.getTime() === newDate.getTime()) {
        return;
      }
      
      this.lastSetDate = newDate; // Store the new start date
      
      // Wait a bit before switching to avoid conflicting updates
      setTimeout(() => {
        if (dateInfo.view.type === 'semester') {
          if(this.semesterNo=="2"){
            switchDate = `${(new Date()).getFullYear()}-01-01`;
            calendarApi.gotoDate(switchDate);
          }
          else if(this.semesterNo=="1"){
            switchDate = `${(new Date()).getFullYear()}-08-01`;
            calendarApi.gotoDate(switchDate);
          }
        } else if(this.lastView !== dateInfo.view.type) {
          console.log('Switching to normal view, resetting to current date');
          calendarApi.gotoDate(new Date());
        }

        // Store the last view
        this.lastView = dateInfo.view.type;
      }, 10);
    },

    viewDidMount: (viewInfo) => {
      const calendarApi = viewInfo.view.calendar;
      let switchDate = ""
    
      // Reset the calendar based on the view type
      if (viewInfo.view.type === 'semester') {
        console.log('Semester view mounted, setting initial date to the first day of the semester');
        if(this.semesterNo=="2"){
          switchDate = `${(new Date()).getFullYear()}-01-01`;
          calendarApi.gotoDate(switchDate);
        }
        else if(this.semesterNo=="1"){
          switchDate = `${(new Date()).getFullYear()}-08-01`;
          calendarApi.gotoDate(switchDate);
        }        
      } else {
        console.log('Non-semester view mounted, setting initial date to current date');
        calendarApi.gotoDate(new Date());
      }
    },
    slotMinTime: '08:30:00',  // Start time
    slotMaxTime: '19:30:00',  // End time
    allDaySlot: false,
    stickyHeaderDates: true,
    slotLabelInterval: '01:00:00',
    slotDuration: '00:30:00',
    eventMaxStack: 2,
    hiddenDays: [0],
    weekNumbers: true,
    weekText: "Wk",
    weekNumberCalculation: (date) => {
      return this.getCustomWeekNumber(date);
    },
    weekNumberDidMount: (info) => {
      const weekNumber = info.num; // Get the current week number
      const skippedWeek = -2; // Set the week number you want to hide/replace
    
      if (weekNumber === skippedWeek) {
        info.el.innerText = "Recess"; // Replace with text
      }
    },

    //Time format: '2025-02-07T10:00:00'
    
    eventContent: (info: { event: { title: any; extendedProps: { 
      startTime: any; endTime: any; location: any; classGroup: any; 
      studentCount: any; labName: any;
    }; }; }) => {
      return {
        html: `<b>${info.event.title}: </b> <br>
        ${info.event.extendedProps.classGroup}<br>
              ${info.event.extendedProps.labName}<br>`
      };
    },
    multiMonthMinWidth: 100,
    
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

      events: this.tempArray.map(labSession => ({
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

  initializeCoursesView(){
    console.log("initializeCoursesView() called");
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin],
      initialView: 'timeGridWeek', // Shows the week view with time slots as intial view
      initialDate: new Date(),
      views: {
        semester: {
          type: 'multiMonthYear',
          duration: {months: 5},
          multiMonthMaxColumns: 2, // Controls the number of columns (months per row)
          /*validRange: {
            start: '2025-01-01',  // Start of the semester (January 2025)
            end: '2025-05-31',     // End of the semester (May 2025)
          },*/
        },      
      },
      headerToolbar: {
        left: 'today',
        center: 'title,prev,next',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,semester',
      },
      datesSet: (dateInfo) => {
        const calendarApi = dateInfo.view.calendar;
        const newDate = new Date(dateInfo.startStr); // Start date of the current view
        let switchDate = "";
        
        // Prevent unnecessary updates
        if (this.lastSetDate && this.lastSetDate.getTime() === newDate.getTime()) {
          return;
        }
        
        this.lastSetDate = newDate; // Store the new start date
        
        // Wait a bit before switching to avoid conflicting updates
        setTimeout(() => {
          if (dateInfo.view.type === 'semester') {
            if(this.semesterNo=="2"){
              switchDate = `${(new Date()).getFullYear()}-01-01`;
              console.log(switchDate);
              calendarApi.gotoDate(switchDate);
            }
            else if(this.semesterNo=="1"){
              switchDate = `${(new Date()).getFullYear()}-08-01`;
              calendarApi.gotoDate(switchDate);
            }
          } else if(this.lastView !== dateInfo.view.type) {
            console.log('Switching to normal view, resetting to current date');
            calendarApi.gotoDate(new Date());
          }

          this.lastView = dateInfo.view.type;
        }, 10);
      },

      viewDidMount: (viewInfo) => {
        const calendarApi = viewInfo.view.calendar;
        let switchDate = ""
      
        // Reset the calendar based on the view type
        if (viewInfo.view.type === 'semester') {
          console.log('Semester view mounted, setting initial date to the first day of the semester');
          if(this.semesterNo=="2"){
            switchDate = `${(new Date()).getFullYear()}-01-01`;
            console.log(switchDate);
            calendarApi.gotoDate(switchDate);
          }
          else if(this.semesterNo=="1"){
            switchDate = `${(new Date()).getFullYear()}-08-01`;
            calendarApi.gotoDate(switchDate);
          }
          
        } else {
          console.log('Non-semester view mounted, setting initial date to current date');
          calendarApi.gotoDate(new Date());
        }
      },
      slotMinTime: '08:30:00',  // Start time
      slotMaxTime: '19:30:00',  // End time
      allDaySlot: false,
      stickyHeaderDates: true,
      slotLabelInterval: '01:00:00',
      slotDuration: '00:30:00',
      eventMaxStack: 2,
      hiddenDays: [0],
      weekNumbers: true,
      weekText: "Wk",
      weekNumberCalculation: (date) => {
        return this.getCustomWeekNumber(date);
      },

      //Time format: '2025-02-07T10:00:00'
      
      eventContent: (info: { event: { title: any; extendedProps: { 
        startTime: any; endTime: any; location: any; classGroup: any; 
        studentCount: any; labName: any
      }; }; }) => {
        return {
          html: `<b>${info.event.title}: </b> <br>
          ${info.event.extendedProps.classGroup}<br>
                ${info.event.extendedProps.labName}<br>`
        };
      },
      multiMonthMinWidth: 100,
      
      eventDidMount: (info) => {
        const startTime = this.timePipe.transform(info.event.extendedProps['startTime']);
        const endTime = this.timePipe.transform(info.event.extendedProps['endTime']);
        // Apply border or background color
        const moduleCode = info.event.title;
        const color = this.moduleColorMap.get(moduleCode);
        info.el.style.borderLeft = `5px solid ${color}`;
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
        
        events: this.tempArray.map(labSession => ({
          id: labSession.labSessionID,
          title: labSession.classGroupID.moduleCode,
          start: new Date(`${labSession.date}T${labSession.startTime}`).toISOString(),
          end: new Date(`${labSession.date}T${labSession.endTime}`).toISOString(),
          color: this.moduleColorMap.get(labSession.classGroupID.moduleCode) || '#3788d8',
          extendedProps: {
            labName: labSession.labID.labName,
            location: `Room ${labSession.labID.room}`,
            classGroup: labSession.classGroupID.classGroupID,
            startTime: labSession.startTime,
            endTime: labSession.endTime,
          }
        })) as EventInput
    }
    //this.cdRef.detectChanges();
  }

  getCustomWeekNumber(date: Date): number {
    const firstMonday = this.week1StartDate;
    let weekNumber: number = 0;
  
    if(firstMonday){
      const diffInDays = Math.floor((date.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
      weekNumber = Math.ceil(diffInDays / 7) + 1; // Calculate week number

      if (weekNumber === 8) {
        return -2;
      } else if (weekNumber > 7) {
        return weekNumber - 1; // Shift all weeks after Week 6 down by 1
      }
    }  
    
    return weekNumber; 
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

        this.tempArray = this.tempArray.concat(response);
      }
    )
  }

  isDisabled(item: string){
    if(this.filteredModules.length==0){
      return false;
    }
    else if(this.filteredModules.includes("Your Modules") && item == "Your Modules"){
      return false;
    }
    else if(this.filteredModules.includes("Your Modules") && item != "Your Modules"){
      return true;
    }
    else if(!this.filteredModules.includes("Your Modules") && item != "Your Modules"){
      return false;
    }
    else{
      return true;
    }
  }

  filter(){
    if(!this.filteredModules.includes("Your Modules")){
      this.tempArray = this.labSessions.filter((labSession) => {
        const matchesLab = this.filteredLabs.length === 0 || this.filteredLabs.includes(labSession.labID.labName);
        const matchesModule = this.filteredModules.length === 0 || this.filteredModules.includes(labSession.classGroupID.moduleCode);
        return matchesLab && matchesModule;
      });
    }
    else{
      //Filter based on personal modules
      this.tempArray = this.labSessions.filter((labSession) => {
        const matchesLab = this.filteredLabs.length === 0 || this.filteredLabs.includes(labSession.labID.labName);
        const matchesModule = this.user.modules.length === 0 || this.user.modules.includes(labSession.classGroupID.moduleCode);
        return matchesLab && matchesModule;
      });
      console.log(this.tempArray);
    }

    //Reinitialize the calendar with the filtered data
    setTimeout(() => this.initializeCoursesView(), 300);
    this.cdRef.detectChanges();
  }

  navigateToLabSchedule(labRoom: string){
    this.router.navigate([`/drawer/labSchedules/labCalender/${labRoom}`]);
  }
  
}