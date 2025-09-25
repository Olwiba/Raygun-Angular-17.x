import { Injectable } from '@angular/core';
import { sendErrorToRaygun, sendRumEventToRaygun, getRaygunInitializationStatus } from '../raygun.setup';

@Injectable({
  providedIn: 'root'
})
export class DemoService {
  constructor() {}

  async triggerCrashReportingError(): Promise<void> {
    try {
      console.log('Triggering crash reporting error...');
      
      // Simulate a JavaScript error
      const errorObject = new Error('Demo crash reporting error - This is intentional for testing purposes');
      errorObject.name = 'DemoCrashError';
      
      // Send error to Raygun using the working demo pattern
      sendErrorToRaygun(errorObject);
      
      // Also throw the error to demonstrate actual crash behavior
      // This will be caught by our RaygunErrorHandler
      throw errorObject;
    } catch (error) {
      console.error('Demo error thrown:', error);
      // In a real application, this error would be caught by Raygun automatically
    }
  }

  triggerRealUserMonitoringEvent(): void {
    console.log('Triggering Real User Monitoring event...');
    
    try {
      // Send RUM timing event using the proper setup
      sendRumEventToRaygun({
        type: 'customTiming',
        name: 'demo-user-action',
        duration: Math.floor(Math.random() * 1000) + 100, // Random duration between 100-1100ms
        customData: {
          feature: 'realUserMonitoring',
          timestamp: new Date().toISOString(),
          userAction: 'Manual RUM test triggered',
          browserInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform
          }
        }
      });
    } catch (error) {
      console.error('Failed to send RUM event:', error);
    }
  }


}
