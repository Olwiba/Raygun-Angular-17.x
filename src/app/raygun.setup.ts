import rg4js from 'raygun4js';
import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../environments/environment';

// Browser detection utility
export function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// Network interception for activity log
function setupNetworkInterception(): void {
  const browser = getBrowserInfo();
  
  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
    if (url.toString().includes('raygun.io')) {
      console.log(`🌐 Network request intercepted: ${method} ${url} (${browser})`);
      // Dispatch event for activity log
      window.dispatchEvent(new CustomEvent('raygun-network-request', {
        detail: { method, url: url.toString(), browser, timestamp: new Date() }
      }));
    }
    return originalXHROpen.call(this, method, url, async ?? true, username, password);
  };

  // Intercept fetch for completeness
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('raygun.io')) {
      console.log(`🌐 Network request intercepted: ${init?.method || 'GET'} ${url} (${browser})`);
      window.dispatchEvent(new CustomEvent('raygun-network-request', {
        detail: { method: init?.method || 'GET', url, browser, timestamp: new Date() }
      }));
    }
    return originalFetch.apply(this, [input, init]);
  };
}

// Initialize Raygun immediately with dynamic API key
let isRaygunInitialized = false;
let raygunConfig: any = null;

async function initializeRaygunWithDynamicKey(): Promise<void> {
  try {
    console.log('Fetching Raygun configuration...');
    
    // Fetch configuration from API
    const configResponse = await fetch(`${environment.apiUrl}${environment.configEndpoint}`);
    
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch configuration: ${configResponse.status}`);
    }

    const config = await configResponse.json();
    raygunConfig = config; // Store config globally
    console.log('Configuration fetched successfully');

    // Initialize Raygun with the fetched configuration
    rg4js('apiKey', config.raygunApiKey);
    rg4js('setVersion', config.version);
    rg4js('enableCrashReporting', config.features.crashReporting);
    
    // For Firefox, we need to ensure RUM is properly enabled with extra steps
    const browser = getBrowserInfo();
    if (browser === 'Firefox') {
      console.log('Firefox detected - using enhanced RUM initialization');
      rg4js('enableRealUserMonitoring', config.features.realUserMonitoring);
      rg4js('enablePulse', config.features.realUserMonitoring);
      
      // Add extra delay for Firefox RUM initialization
      setTimeout(() => {
        console.log('Firefox: RUM initialization complete');
        window.dispatchEvent(new CustomEvent('firefox-rum-ready'));
        // Set up automatic RUM collection to match Chrome functionality
        setupFirefoxAutoRUM();
      }, 1000);
    } else {
      rg4js('enableRealUserMonitoring', config.features.realUserMonitoring);
    }

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

// Manual RUM API fallback for Firefox
async function sendRumEventViaAPI(eventData: any): Promise<void> {
  if (!raygunConfig) return;
  
  try {
    console.log('Firefox: Sending RUM event via direct API...');
    
    // Based on Chrome's working requests, construct RUM payload
    const rumPayload = {
      eventData: [{
        type: eventData.type,
        name: eventData.name,
        duration: eventData.duration,
        customData: eventData.customData,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }],
      sessionId: `session-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: {
        identifier: 'demo-user',
        isAnonymous: true
      }
    };

    const response = await fetch(`https://api.raygun.io/events?apikey=${raygunConfig.raygunApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ApiKey': raygunConfig.raygunApiKey
      },
      body: JSON.stringify(rumPayload)
    });

    if (response.ok) {
      console.log('Firefox: RUM event sent successfully via direct API');
    } else {
      console.error('Firefox: RUM API request failed:', response.status, response.statusText);
    }
    
  } catch (apiError) {
    console.error('Firefox: Direct RUM API failed:', apiError);
  }
}

// Automatic RUM data collection for Firefox (since raygun4js RUM is broken)
function setupFirefoxAutoRUM(): void {
  if (getBrowserInfo() !== 'Firefox' || !raygunConfig) return;
  
  console.log('Firefox: Setting up automatic RUM collection...');
  
  // 1. Send initial page view
  setTimeout(async () => {
    try {
      const pageViewPayload = {
        type: 'pageView', 
        path: window.location.pathname + window.location.search,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        referrer: document.referrer
      };
      
      await sendRumEventViaAPI(pageViewPayload);
      console.log('Firefox: Initial page view sent');
    } catch (error) {
      console.error('Firefox: Failed to send initial page view:', error);
    }
  }, 1500);
  
  // 2. Track performance metrics
  setTimeout(async () => {
    try {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        const perfPayload = {
          type: 'performanceTiming',
          name: 'page-load',
          duration: perfData.loadEventEnd - perfData.fetchStart,
          customData: {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            responseTime: perfData.responseEnd - perfData.requestStart
          }
        };
        
        await sendRumEventViaAPI(perfPayload);
        console.log('Firefox: Performance metrics sent');
      }
    } catch (error) {
      console.error('Firefox: Failed to send performance metrics:', error);
    }
  }, 3000);
}

// Custom Error Handler with Firefox workaround
@Injectable()
export class RaygunErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Angular Error Handler caught:', error);
    
    if (isRaygunInitialized) {
      try {
        const browser = getBrowserInfo();
        
        if (browser === 'Firefox') {
          // Firefox workaround - use window.Raygun directly
          const windowRaygun = (window as any).Raygun;
          if (windowRaygun && raygunConfig) {
            windowRaygun.init(raygunConfig.raygunApiKey);
            windowRaygun.send({ error: error });
            console.log('Error sent via Firefox ErrorHandler workaround');
          }
        } else {
          // Chrome/other browsers - use normal rg4js wrapper
          rg4js('send', { error: error });
          console.log('Error sent to Raygun via ErrorHandler');
        }
      } catch (raygunError) {
        console.error('Failed to send via ErrorHandler:', raygunError);
      }
    }
  }
}

// Manual error reporting with Firefox workaround
export async function sendErrorToRaygun(error: Error): Promise<void> {
  if (isRaygunInitialized) {
    try {
      const browser = getBrowserInfo();
      
      if (browser === 'Firefox') {
        // Firefox workaround - use window.Raygun directly
        console.log('Using Firefox workaround for error reporting');
        const windowRaygun = (window as any).Raygun;
        if (windowRaygun && raygunConfig) {
          windowRaygun.init(raygunConfig.raygunApiKey);
          windowRaygun.send({ error: error });
          console.log('Error sent via Firefox workaround');
        }
      } else {
        // Chrome/other browsers - use normal rg4js wrapper
        rg4js('send', { error: error });
        console.log('Error sent via rg4js wrapper');
      }
    } catch (raygunError) {
      console.error('Failed to send error to Raygun:', raygunError);
    }
  }
}

// RUM event reporting with Firefox workaround
export async function sendRumEventToRaygun(eventData: any): Promise<void> {
  if (isRaygunInitialized) {
    try {
      const browser = getBrowserInfo();
      console.log('Sending RUM event...');
      
      if (browser === 'Firefox') {
        // Firefox: Use direct API since raygun4js RUM is broken
        console.log('Firefox: Using direct API for RUM (raygun4js RUM broken in Firefox)');
        await sendRumEventViaAPI(eventData);
      } else {
        // Chrome/other browsers - use working rg4js wrapper
        rg4js('trackEvent', eventData);
        console.log('RUM event sent via rg4js wrapper');
      }
    } catch (raygunError) {
      console.error('Failed to send RUM event to Raygun:', raygunError);
    }
  }
}

export function getRaygunInitializationStatus(): boolean {
  return isRaygunInitialized;
}

// Start initialization immediately when module loads
setupNetworkInterception();
initializeRaygunWithDynamicKey();
