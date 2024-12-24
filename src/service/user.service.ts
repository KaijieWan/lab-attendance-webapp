import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { errorContext } from 'rxjs/internal/util/errorContext';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface ResetPassRequest {
  newPassword: string;
  token: string;
}

export interface MessageResponse {
  message: string;
  status: string;
}

export interface UserResponse {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

export interface UpdatePassRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserRequest {
  email: string;
  name: string;
  role: string;
  username: string;
}

export interface UserDTO {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

export interface PaginatedResponse {
  content: UserDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // Current page
}

export interface CreateUserRequest{
  username: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private authUrl = 'http://localhost:8081/api/auth'; // Backend Auth URL
  private userUrl = 'http://localhost:8081/api/v1/users'
  unsubscribe: any;

  constructor(private http: HttpClient) {}

  //Authentication related services
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials);
  }

  logout(){
    // Clear authentication token from storage
    console.log("Removal of token")
    localStorage.removeItem('authToken'); 
    sessionStorage.removeItem('authToken'); // Remove session if stored here
  }

  checkUserByEmail(email : string) : Observable<Boolean> {
    return this.http.get<any>(`${this.userUrl}/search?email=${email}`).pipe(
      map((response) => {
        const userEmail = response.content[0]?.email;
        console.log(userEmail);
        return userEmail === email;
      }),
      catchError(() => of(false))
    );
  }

  sendPassResetLink(email: string) : Observable<string> {
    return this.http.post<any>(`${this.authUrl}/password-reset/send-link?email=${email}`, '').pipe(
      map((response) => {
        return response.token;
      }),
      //catchError(() => of("FAILED"))
    );
  }

  resetPassword(credentials: ResetPassRequest) : Observable<string> {
    return this.http.post<any>(`${this.authUrl}/password-reset/change-password`, credentials).pipe(
      map((response) =>{
        console.log("Response: ", response);
        return response.status;
      })
    );
  }

  checkExpiredToken(token: string): Observable<Boolean> {
    return this.http.post<any>(`${this.authUrl}/is-expired?token=${token}`, '').pipe(
      map((response) => {
        console.log(response);
        if(response.status=="INVALID"){
          return false;
        }
        return true
      }),
      catchError(() => of(false)) 
    )
  }

  //User related services
  getUser(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.userUrl}/${id}`);
  }

  getAllUsers(page: number, size: number) : Observable<PaginatedResponse> {
    return this.http.get<PaginatedResponse>(`${this.userUrl}?page=${page}&size=${size}`);
  }

  updatePassword(credentials: UpdatePassRequest, id: number) : Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.userUrl}/${id}/password`, credentials);
  }

  updateUser(credentials: UpdateUserRequest, id: number) : Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.userUrl}/${id}`, credentials);
  }

  createUser(credentials: CreateUserRequest) : Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.userUrl}/create`, credentials);
  }

};