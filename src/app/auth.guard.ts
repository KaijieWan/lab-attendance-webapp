import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RolePermissionService } from '../service/rolePermission.service';
import { LoginResponse } from '../service/user.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private rolePermissionService: RolePermissionService) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken'); // Check for a valid token
    if (token) {
      return true; // Allow access
    } else {
      this.router.navigate(['/login']); // Redirect to login if unauthorized
      return false;
    }
  }

}
