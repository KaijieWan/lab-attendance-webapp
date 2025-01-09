import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { CanActivateFn, provideRouter } from '@angular/router';
import { GoogleLoginProvider, SocialLoginModule, SocialAuthServiceConfig} from '@abacritt/angularx-social-login';
import { MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MsalService, MsalGuard, MsalBroadcastService, MsalInterceptor, MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideToastr } from 'ngx-toastr';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthInterceptor } from '../lib/auth.interceptor';

/*
// Define MSAL instance
export function MSALInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: 'YOUR_CLIENT_ID',  // Replace with your client ID
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: 'http://localhost:4200' // Replace with your redirect URI
    }
  });
}

// MSAL Guard Configuration
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['user.read']  // Define scopes your app needs
    }
  };
}

// MSAL Interceptor Configuration
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
      ['https://graph.microsoft.com/v1.0/me', ['user.read']]
    ])
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    }
  ]*/

    export const authGuard: CanActivateFn = () => {
      const token = localStorage.getItem('authToken');
      return !!token; // Allow access if token exists
    };

    export const appConfig: ApplicationConfig = {
      providers: [
        provideRouter(routes),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(),
        provideAnimations(),
        provideToastr(),
        importProvidersFrom(MatNativeDateModule),
        provideHttpClient(withInterceptorsFromDi()),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true // Allow multiple interceptors
        }
      ],
    };    
