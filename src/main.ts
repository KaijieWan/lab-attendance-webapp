import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXlfcXVXRmZfWEF2XUpWYUE=');

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './pages/login/login.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';


// Registering Syncfusion license key

//ORg4AjUWIQA/Gnt2XFhhQlJHfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTH5Vd0RiWH9ac3xSQGhdWkZ/

//Ngo9BigBOggjHTQxAR8/V1NNaF1cWWhPYVJ+WmFZfVtgdVdMYF9bRHZPMyBoS35Rc0VlWH5ecHRWRmBZUk1zVEBU

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

/*bootstrapApplication(LoginComponent, {
  providers: [provideRouter([{ path: '', component: LoginComponent }])],
}).catch((err) => console.error(err));*/