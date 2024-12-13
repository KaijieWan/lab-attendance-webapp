import { Routes, RouterModule } from '@angular/router';
import { DrawerComponent } from '../pages/drawer-menu/drawer.component'
import { AppComponent } from './app.component';
import { LoginComponent } from '../pages/login/login.component';
import { SignupComponent } from '../pages/login/signup.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { CoursesComponent } from '../pages/courses/courses.component';
import { StudentsComponent } from '../pages/students/students.component';
import { LabSchedulesComponent } from '../pages/labSchedules/labSchedules.component';
import { AbsencesComponent } from '../pages/absences/absences.component';
import { ProfileComponent } from '../pages/profile/profile.component';
import { AccManagementComponent } from '../pages/accManagement/accManagement.component';
import { SettingsComponent } from '../pages/settings/settings.component';
import { ForgetPassComponent } from '../pages/login/forgetPass.component';
import { ResetPassComponent } from '../pages/login/resetPass.component';
import { ErrorComponent } from '../pages/error/error.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
    //{ path: '', component: LoginComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'forgetPass', component: ForgetPassComponent },
    { path: 'resetPass', component: ResetPassComponent },
    { path: 'error', component: ErrorComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'drawer', component: DrawerComponent, canActivate: [AuthGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'courses', component: CoursesComponent },
            { path: 'students', component: StudentsComponent },
            { path: 'labSchedules', component: LabSchedulesComponent },
            { path: 'absences', component: AbsencesComponent },
            { path: 'profile', component: ProfileComponent },
            { path: 'accManagement', component: AccManagementComponent },
            { path: 'settings', component: SettingsComponent },
            //{ path: 'dashboard', component: DashboardComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
     }
];
