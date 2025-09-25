import rg4js from 'raygun4js';
import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../environments/environment';

// Initialize Raygun immediately with dynamic API key - hybrid approach
let isRaygunInitialized = false;

async function initializeRaygunWithDynamicKey(): Promise<void> {
  try {
    console.log('Fetching Raygun configuration...');
    
    // Fetch configuration from API
    const configResponse = await fetch(`${environment.apiUrl}${environment.configEndpoint}`);
    
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch configuration: ${configResponse.status}`);
    }

    const config = await configResponse.json();
    console.log('Configuration fetched successfully:', JSON.stringify(config, null, 2));

    // Initialize Raygun with the fetched configuration - using working demo pattern
    rg4js('apiKey', config.raygunApiKey);
    rg4js('setVersion', config.version);
    rg4js('enableCrashReporting', config.features.crashReporting);
    rg4js('enableRealUserMonitoring', config.features.realUserMonitoring);

    isRaygunInitialized = true;
    console.log('Raygun initialized successfully with dynamic API key!');

    // Dispatch event to notify components (for status panel)
    window.dispatchEvent(new CustomEvent('raygun-initialized', { 
      detail: { config, timestamp: new Date() }
    }));

  } catch (error) {
    console.error('Failed to initialize Raygun:', error);
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('raygun-init-error', { 
      detail: { error, timestamp: new Date() }
    }));
    
    // Don't throw - allow the app to continue running
  }
}

// Start initialization immediately when module loads
initializeRaygunWithDynamicKey();

// Custom Error Handler that reports errors to Raygun - exact same pattern as working demo
@Injectable()
export class RaygunErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Angular Error Handler caught:', error);
    if (isRaygunInitialized) {
      rg4js('send', {
        error: error
      });
      console.log('Error sent to Raygun via ErrorHandler');
    } else {
      console.warn('Raygun not yet initialized - error would be sent once ready');
    }
  }
}

// Export functions for manual error reporting - using working demo pattern
export function sendErrorToRaygun(error: Error): void {
  console.log('Sending manual error to Raygun...');
  if (isRaygunInitialized) {
    rg4js('send', {
      error: error
    });
    console.log('Manual error sent to Raygun (check Network tab for raygun.io requests)');
  } else {
    console.warn('Raygun not yet initialized - error would be sent once ready');
  }
}

export function sendRumEventToRaygun(eventData: any): void {
  console.log('Sending RUM event to Raygun...');
  if (isRaygunInitialized) {
    rg4js('trackEvent', eventData);
    console.log('RUM event sent to Raygun (check Network tab for raygun.io requests)');
  } else {
    console.warn('Raygun not yet initialized - RUM event would be sent once ready');
  }
}

export function getRaygunInitializationStatus(): boolean {
  return isRaygunInitialized;
}
