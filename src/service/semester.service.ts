import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { errorContext } from 'rxjs/internal/util/errorContext';
import { backend_api } from '../environments/environment';

export interface MessageResponse {
  message: string;
  status: string;
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

  }