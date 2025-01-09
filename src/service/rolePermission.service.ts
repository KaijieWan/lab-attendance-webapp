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
  export class RolePermissionService {
    private rolePermissionUrl = `${backend_api}/api/v1/roles`;

    constructor(private http: HttpClient) {}

    getDistinctRoles() : Observable<string[]> {
        return this.http.get<string[]>(`${this.rolePermissionUrl}/distinctRoles`);
    }

    getRolePermissions(role: string) : Observable<any> {
      return this.http.get<any>(`${this.rolePermissionUrl}/rolePermissions?role=${role}`);
    }

    createRole(credentials: any) : Observable<MessageResponse> {
        return this.http.post<MessageResponse>(`${this.rolePermissionUrl}/createRole`, credentials);
    }
    
    updateRole(credentials: any) : Observable<MessageResponse> {
      return this.http.put<MessageResponse>(`${this.rolePermissionUrl}/updateRole`, credentials);
    }
    
  }