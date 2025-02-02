import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, Pipe } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { StudentDTO, StudentService } from '../../service/studentService';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Pipe({name: 'round'})
export class RoundPipe {
  transform (input:number) {
    return Math.floor(input);
  }
}

@Component({
  selector: 'app-students-page',
  standalone: true,
  templateUrl: './students.component.html',

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule],
  styleUrl: './students.component.scss'
})

export class StudentsComponent {
  currentPage: number = 0;
  studentsPerPage: number = 20;  // Change this number to control how many students per page
  totalPages: number = 0;
  students: StudentDTO[] = [];
  studentsToDisplay: StudentDTO[] = [];
  searchTerm$ = new Subject<string>();

  constructor(private studentService: StudentService){    
  }

  ngOnInit() {
    this.studentService.getAllStudents().subscribe({
      next: (response) => {
        this.students = response;
        this.totalPages = Math.ceil(this.students.length/this.studentsPerPage);
        this.onPageChange(0);
      },
      error: (err) => console.log("Error in fetching students",  err)
    })

    this.searchTerm$
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged() // Only emit if value changes
      )
      .subscribe((term) => {
        if (term) {
          // Filter students based on search term
          this.studentsToDisplay = this.students.filter(student =>
            student.Student_ID.toLowerCase().includes(term.toLowerCase()) ||
            student.fullName.toLowerCase().includes(term.toLowerCase())
          );
        } else {
          // Restore paginated format
          this.updateStudentsForCurrentPage();
        }
      });
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.currentPage = newPage;
      this.updateStudentsForCurrentPage();
    }
  }

  updateStudentsForCurrentPage(): void {
    const startIndex = this.currentPage * this.studentsPerPage;
    const endIndex = startIndex + this.studentsPerPage;
    this.studentsToDisplay = this.students.slice(startIndex, endIndex);
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLSelectElement).value;
    this.searchTerm$.next(term); // Push the term into the Subject
  }

}