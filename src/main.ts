import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './pages/login/login.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { registerLicense } from '@syncfusion/ej2-base';

// Registering Syncfusion license key
registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF1cXGFCeEx3WmFZfVtgdVdMZVVbR3RPIiBoS35Rc0VmWXdfcXVdQ2ddU0ZyVEBV');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

/*bootstrapApplication(LoginComponent, {
  providers: [provideRouter([{ path: '', component: LoginComponent }])],
}).catch((err) => console.error(err));*/