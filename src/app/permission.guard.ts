import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RolePermissionService } from '../service/rolePermission.service';

interface RolePermission {
    permissionType: string,
    actions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PermissionGuard implements CanActivate {
  constructor(
    private rolePermissionService: RolePermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const sessionData = sessionStorage.getItem('userDetails');
    if (!sessionData) {
      this.router.navigate(['/drawer/access-denied']);
      return of(false);
    }

    const userDetails = JSON.parse(sessionData);
    const permissionType = route.data['permissionType']; // Define this in route metadata
    return this.rolePermissionService.getRolePermissions(userDetails.user.role).pipe(
      map((response: RolePermission[]) => {
        const permission = response.find(
          (item) => item.permissionType === permissionType
        );
        if (!permission || !permission.actions.includes('read')) {
          this.router.navigate(['/drawer/access-denied']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/drawer/access-denied']);
        return of(false);
      })
    );
  }
}
