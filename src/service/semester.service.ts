import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { errorContext } from 'rxjs/internal/util/errorContext';
import { backend_api } from '../environments/environment';

export interface MessageResponse {
  message: string;
  status: string;
}

export interface SemesterDTO {
  semester_ID: string;
  semester: string;
  annualYear: string;
  week1StartDate: Date;
}

@Injectable({
    providedIn: 'root',
  })
  export class SemesterService {
    private semesterUrl = `${backend_api}/api/v1/semester`;

    constructor(private http: HttpClient) {}

    createSemester(newSemester: any) : Observable<MessageResponse> {
      return this.http.post<MessageResponse>(`${this.semesterUrl}/createNewSemester`, newSemester);
    }

    getAllSemesters() : Observable<any> {
      return this.http.get<MessageResponse>(`${this.semesterUrl}`);
    }

    getSpecificSemester(semesterId: string) : Observable<any> {
      return this.http.get<MessageResponse>(`${this.semesterUrl}/getSemesterByID?semesterId=${semesterId}`);      
    }

  }