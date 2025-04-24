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
export class ClassGroupService {
    private classGroupUrl = `${backend_api}/api/v1/classGroup`;
    private classGroupEnrolledStudents = `${backend_api}/api/v1/classGroupEnrolledStudents`;

    constructor(private http: HttpClient) {}

    createClassGroup(classGroup: any) : Observable<MessageResponse> {
      return this.http.post<MessageResponse>(`${this.classGroupUrl}/createNewClassGroup`, classGroup);
    }

    enrollStudentInClassGroup(enrolment: any) : Observable<MessageResponse> {
      return this.http.post<MessageResponse>(`${this.classGroupEnrolledStudents}/createNewClassGroupEnrolledStudents`, enrolment);
    }

    fetchClassGroupsByModuleAndSemester(moduleCode: string, semesterID: string) : Observable<any> {
      return this.http.get<MessageResponse>(`${this.classGroupUrl}/specificClassGroups?module=${moduleCode}&semesterID=${semesterID}`);
    }

    fetchStudentsByModuleAndSemester(moduleCode: string, semesterId: string) : Observable<any> {
      return this.http.get<MessageResponse>(`${this.classGroupEnrolledStudents}/getStudentsByModuleAndSemester?moduleCode=${moduleCode}&semesterId=${semesterId}`);      
    }

    deleteStudentFromClassGroup(studentId: string, moduleCode: string, classGroupId: string, semesterId: string) : Observable<any> {
      return this.http.delete<MessageResponse>(`${this.classGroupUrl}/deleteStudentFromClassGroup?studentId=${studentId}&moduleCode=${moduleCode}&classGroupId=${classGroupId}&semesterId=${semesterId}`);            
    }

    addStudentToClassGroup(studentId: string, moduleCode: string, classGroupId: string, semesterId: string) : Observable<any> {      
      return this.http.post<MessageResponse>(`${this.classGroupUrl}/addStudentToClassGroup?studentId=${studentId}&moduleCode=${moduleCode}&classGroupId=${classGroupId}&semesterId=${semesterId}`, null);            
    }

}