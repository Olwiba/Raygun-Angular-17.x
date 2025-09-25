import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoService } from '../services/demo.service';

@Component({
  selector: 'app-demo-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-secondary-800 mb-4">
        Raygun Testing Controls
      </h2>
      
      <p class="text-secondary-600 mb-6">
        Use these buttons to test Raygun functionality. Check the activity log below for real-time feedback 
        and open the browser's Developer Tools to see console output.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          (click)="triggerCrashError()"
          [disabled]="isLoading"
          class="px-6 py-3 bg-error-600 text-white rounded-lg hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
          {{ isLoading ? 'Processing...' : 'Send Error Report' }}
        </button>
        
        <button
          (click)="triggerRumEvent()"
          [disabled]="isLoading"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
          Send RUM Data
        </button>
      </div>

      <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 class="font-semibold text-primary-800 mb-2">
          Verification Methods
        </h4>
        <ul class="text-sm text-primary-700 space-y-1">
          <li>• <strong>Activity Log:</strong> Watch the log below for real-time feedback</li>
          <li>• <strong>Browser Console:</strong> Open DevTools (F12) to see detailed logging</li>
          <li>• <strong>Network Tab:</strong> Monitor API requests to the configuration endpoint</li>
          <li>• <strong>Raygun Dashboard:</strong> In production, events would appear in the Raygun dashboard</li>
        </ul>
      </div>
    </div>
  `
})
export class DemoControlsComponent {
  isLoading = false;

  constructor(private demoService: DemoService) {}

  async triggerCrashError(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    try {
      await this.demoService.triggerCrashReportingError();
    } catch (error) {
      // Expected - this is a demo crash
    } finally {
      setTimeout(() => this.isLoading = false, 1000);
    }
  }

  triggerRumEvent(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.demoService.triggerRealUserMonitoringEvent();
    setTimeout(() => this.isLoading = false, 500);
  }
}
