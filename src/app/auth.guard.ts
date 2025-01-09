import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RolePermissionService } from '../service/rolePermission.service';
import { LoginResponse, UserService } from '../service/user.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private rolePermissionService: RolePermissionService, private userService: UserService) {}

  canActivate(): Observable<boolean> {
    const token = localStorage.getItem('authToken');
    const sessionData = sessionStorage.getItem('userDetails');

    if (sessionData && token) {
      const userDetails = JSON.parse(sessionData);
      const username = userDetails.user.username;
      return this.userService.checkValidToken(token, username).pipe(
        map((isValid) => {
          console.log(isValid);
          if (!isValid) {
            this.router.navigate(['/login']); // Redirect on invalid token
          }
          return isValid; // Ensure true is returned if valid
        }),
        catchError(() => {
          this.router.navigate(['/login']); // Redirect on error
          return of(false); // Return false on error
        })
      );
      
    }
    else{
      this.router.navigate(['/login']);
      return of(false);
    }

    return of(false);
  }

}
