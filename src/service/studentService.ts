import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { errorContext } from 'rxjs/internal/util/errorContext';
import { backend_api } from '../environments/environment';

export interface MessageResponse {
  message: string;
  status: string;
}

export interface StudentDTO {
  Student_ID: string;
  fullName: string;
}

@Injectable({
    providedIn: 'root',
  })
  export class StudentService {
    private studentUrl = `${backend_api}/api/v1/student`;

    constructor(private http: HttpClient) {}

    createStudent(student: any) : Observable<MessageResponse> {
        return this.http.post<MessageResponse>(`${this.studentUrl}/createNewStudent`, student);
    }

    getAllStudents() : Observable<any> {
      return this.http.get<any>(`${this.studentUrl}`);
    }

  }