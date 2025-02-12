import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';

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

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrl: './labSchedules.component.scss'
})



export class LabSchedulesComponent {
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
  
  constructor(private router: Router){}

  navigateToLabSchedule(labRoom: string){
    this.router.navigate([`/drawer/labSchedules/labCalender/${labRoom}`]);
  }
  
}