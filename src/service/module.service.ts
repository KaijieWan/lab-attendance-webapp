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
  export class ModuleService {
    private moduleUrl = `${backend_api}/api/v1/module`;

    constructor(private http: HttpClient) {}

    createModule(module: any) : Observable<MessageResponse> {
      return this.http.post<MessageResponse>(`${this.moduleUrl}/createNewModule`, module);
    }

    getAllModules() : Observable<any> {
      return this.http.get<MessageResponse>(`${this.moduleUrl}`);
    }

  }