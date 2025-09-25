import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RaygunErrorHandler } from './raygun.setup';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter([]),
    {
      provide: ErrorHandler,
      useClass: RaygunErrorHandler
    }
  ]
};
