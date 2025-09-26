![](https://assets-global.website-files.com/5e2701b416b6d176f5007781/6344bbf42c1388b9f34a5c6f_logo-colour-stylised-2.svg)

# Raygun4js Angular 17.x Integration

This repository demonstrates the correct way to integrate raygun4js into an Angular 17.x application where the API key must be fetched dynamically from a REST service.

## Solution Overview

The solution uses immediate raygun4js initialization combined with dynamic API key fetching, ensuring:

- Non-blocking initialization (app continues even if API fails)
- Proper raygun4js integration pattern (based on proven working demo)
- Dynamic API key fetching from REST endpoint
- Angular ErrorHandler integration for automatic error reporting
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or bun or yarn

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Olwiba/Raygun-Angular-17.x.git
   cd Raygun-Angular-17.x
   npm install
   ```

2. **Start the application:**
   ```bash
   npm run dev
   ```
   
   This command starts both:
   - Mock API server on `http://localhost:3001`
   - Angular dev server on `http://localhost:4200`

3. **Open the application:**
   Navigate to `http://localhost:4200` in your browser

## Features

### Interactive Testing
- **Error Reporting**: Send error reports to test crash tracking functionality
- **Real User Monitoring**: Send RUM data to test performance monitoring

## Technical Implementation

### Key Components

#### 1. Raygun Setup with Angular ErrorHandler
```typescript
// raygun.setup.ts
import rg4js from 'raygun4js';
import { ErrorHandler, Injectable } from '@angular/core';

// Initialize Raygun immediately with dynamic API key
async function initializeRaygunWithDynamicKey(): Promise<void> {
  try {
    // Fetch config from API
    const config = await fetch(`${environment.apiUrl}${environment.configEndpoint}`);
    
    // Initialize Raygun with fetched configuration
    rg4js('apiKey', config.raygunApiKey);
    rg4js('enableCrashReporting', config.features.crashReporting);
    rg4js('enableRealUserMonitoring', config.features.realUserMonitoring);
  } catch (error) {
    // Graceful failure - don't block app
    console.error('Raygun initialization failed:', error);
  }
}

@Injectable()
export class RaygunErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Cross-browser compatibility handling
    const browser = getBrowserInfo();
    if (browser === 'Firefox') {
      // Firefox workaround for known raygun4js issues
      window.Raygun.send({ error: error });
    } else {
      // Chrome and other browsers
      rg4js('send', { error: error });
    }
  }
}
```

#### 2. App Configuration
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: ErrorHandler,
      useClass: RaygunErrorHandler
    }
  ]
};
```

#### 3. Mock API Endpoint
The application includes a mock API (`http://localhost:3001/config`) that simulates a backend service:

```json
{
  "raygunApiKey": "YOUR_RAYGUN_API_KEY",
  "environment": "development",
  "features": {
    "crashReporting": true,
    "realUserMonitoring": true
  }
}
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── status-panel.component.ts     # Real-time status monitoring
│   │   └── demo-controls.component.ts    # Interactive testing controls
│   ├── services/
│   │   └── demo.service.ts               # Testing functionality
│   ├── app.component.ts                  # Main application component
│   ├── app.config.ts                     # Angular configuration
│   └── raygun.setup.ts                   # Raygun initialization & ErrorHandler
├── environments/
│   ├── environment.ts                    # Development config
│   └── environment.prod.ts               # Production config
└── mock-api/
    └── db.json                          # Mock API data
```

## Adapting for Production

### 1. Update Environment Configuration
```typescript
// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com',
  configEndpoint: '/api/config'
};
```

### 2. Replace Mock API
Update the backend to serve the configuration at the specified endpoint:

```typescript
// Your backend endpoint should return:
{
  "raygunApiKey": "YOUR_RAYGUN_API_KEY",
  "environment": "production",
  "features": {
    "crashReporting": true,
    "realUserMonitoring": true
  }
}
```

### 3. Add Error Handling
Customize the error handling in `raygun.setup.ts` based on requirements:

```typescript
catch (error) {
  // Custom error handling logic
  console.error('Failed to initialize Raygun:', error);
  
  // Optional: Send to alternative error tracking
  // this.alternativeErrorService.log(error);
}
```

## Troubleshooting

### Common Issues

**Q: App shows "Initializing..." forever**
- Check if mock API is running on port 3001
- Verify network connectivity to configuration endpoint
- Check browser console for fetch errors

**Q: Raygun events not appearing**
- This application uses a demo API key for testing
- In production, ensure the Raygun API key is valid
- Check Raygun dashboard for incoming events
- **Firefox users**: Some raygun4js features use workarounds for browser compatibility

### Development Commands

```bash
# Start only the mock API
npm run serve:mock-api

# Start only Angular dev server  
npm run start

# Build for production
npm run build

# Run tests
npm run test
```
