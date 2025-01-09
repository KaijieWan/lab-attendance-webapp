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
  export class LabSessionService {
    private labSessionUrl = `${backend_api}/api/v1/labSession`;

    constructor(private http: HttpClient) {}

    createLabSession(labSession: any) : Observable<MessageResponse> {
      return this.http.post<MessageResponse>(`${this.labSessionUrl}/createNewLabSession`, labSession);
    }

  }