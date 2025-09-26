import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getRaygunInitializationStatus } from '../raygun.setup';

interface LogEntry {
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

@Component({
  selector: 'app-status-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-bold text-secondary-800 mb-4">
        Raygun Status & Activity Log
      </h2>
      
      <div class="mb-4 p-3 rounded-lg" 
           [class]="raygunStatus === 'initialized' ? 'bg-success-50 border border-success-200' : 
                    raygunStatus === 'error' ? 'bg-error-50 border border-error-200' : 
                    'bg-warning-50 border border-warning-200'">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full mr-3"
               [class]="raygunStatus === 'initialized' ? 'bg-success-500' : 
                        raygunStatus === 'error' ? 'bg-error-500' : 'bg-warning-500'">
          </div>
          <span class="font-medium">
            Raygun Status: 
            <span [class]="raygunStatus === 'initialized' ? 'text-success-700' : 
                          raygunStatus === 'error' ? 'text-error-700' : 'text-warning-700'">
              {{ raygunStatusText }}
            </span>
          </span>
        </div>
      </div>

      <div class="bg-secondary-50 rounded-lg p-4 h-64 overflow-y-auto">
        <h3 class="font-semibold text-secondary-700 mb-2">Activity Log:</h3>
        <div class="space-y-2">
          <div *ngFor="let entry of logEntries; trackBy: trackByTimestamp" 
               class="text-sm p-2 rounded border-l-4"
               [class]="getLogEntryClass(entry.type)">
            <span class="font-mono text-xs text-secondary-500 mr-2">
              {{ entry.timestamp | date:'HH:mm:ss.SSS' }}
            </span>
            <span [class]="getLogTextClass(entry.type)">
              {{ entry.message }}
            </span>
          </div>
          
          <div *ngIf="logEntries.length === 0" class="text-secondary-500 italic text-center py-4">
            No activity yet. Try triggering some Raygun events!
          </div>
        </div>
      </div>

      <button 
        (click)="clearLog()"
        class="mt-3 px-4 py-2 bg-secondary-500 text-white rounded hover:bg-secondary-600 transition-colors text-sm">
        Clear Log
      </button>
    </div>
  `
})
export class StatusPanelComponent implements OnInit, OnDestroy {
  raygunStatus: 'initializing' | 'initialized' | 'error' = 'initializing';
  raygunStatusText = 'Initializing...';
  logEntries: LogEntry[] = [];

  private raygunInitializedListener?: (event: CustomEvent) => void;
  private raygunErrorListener?: (event: CustomEvent) => void;
  private raygunNetworkListener?: (event: CustomEvent) => void;

  constructor() {}

  ngOnInit(): void {
    this.addLog('info', 'Component initialized - waiting for Raygun status...');
    
    // Check current status
    if (getRaygunInitializationStatus()) {
      this.updateRaygunStatus('initialized');
    }

    // Listen for Raygun initialization events
    this.raygunInitializedListener = (event: CustomEvent) => {
      this.updateRaygunStatus('initialized');
      this.addLog('success', `Raygun initialized with API key: ${event.detail.config.raygunApiKey}`);
    };

    this.raygunErrorListener = (event: CustomEvent) => {
      this.updateRaygunStatus('error');
      this.addLog('error', `Raygun initialization failed: ${event.detail.error.message}`);
    };

    this.raygunNetworkListener = (event: CustomEvent) => {
      const { method, url, browser } = event.detail;
      this.addLog('success', `🌐 Network request intercepted: ${method} ${url} (${browser})`);
    };

    window.addEventListener('raygun-initialized', this.raygunInitializedListener as EventListener);
    window.addEventListener('raygun-init-error', this.raygunErrorListener as EventListener);
    window.addEventListener('raygun-network-request', this.raygunNetworkListener as EventListener);

    // Listen for console logs to capture demo service activity
    this.interceptConsoleLog();
  }

  ngOnDestroy(): void {
    if (this.raygunInitializedListener) {
      window.removeEventListener('raygun-initialized', this.raygunInitializedListener as EventListener);
    }
    if (this.raygunErrorListener) {
      window.removeEventListener('raygun-init-error', this.raygunErrorListener as EventListener);
    }
    if (this.raygunNetworkListener) {
      window.removeEventListener('raygun-network-request', this.raygunNetworkListener as EventListener);
    }
  }

  private updateRaygunStatus(status: 'initializing' | 'initialized' | 'error'): void {
    this.raygunStatus = status;
    this.raygunStatusText = status === 'initialized' ? 'Ready' : 
                           status === 'error' ? 'Failed' : 'Initializing...';
  }

  private addLog(type: 'info' | 'success' | 'warning' | 'error', message: string): void {
    this.logEntries.unshift({
      timestamp: new Date(),
      type,
      message
    });

    // Keep only the last 50 entries
    if (this.logEntries.length > 50) {
      this.logEntries = this.logEntries.slice(0, 50);
    }
  }

  private interceptConsoleLog(): void {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('Raygun') || message.includes('Configuration') || message.includes('Triggering') || message.includes('sent to Raygun') || message.includes('🌐 Network request intercepted')) {
        this.addLog('info', message);
      }
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('Failed') || message.includes('Demo error thrown')) {
        this.addLog('error', message);
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('Raygun not available')) {
        this.addLog('warning', message);
      }
      originalWarn.apply(console, args);
    };
  }

  clearLog(): void {
    this.logEntries = [];
    this.addLog('info', 'Log cleared');
  }

  trackByTimestamp(index: number, item: LogEntry): number {
    return item.timestamp.getTime();
  }

  getLogEntryClass(type: string): string {
    const baseClasses = 'bg-white';
    switch (type) {
      case 'success': return `${baseClasses} border-success-400`;
      case 'error': return `${baseClasses} border-error-400`;
      case 'warning': return `${baseClasses} border-warning-400`;
      default: return `${baseClasses} border-primary-400`;
    }
  }

  getLogTextClass(type: string): string {
    switch (type) {
      case 'success': return 'text-success-800';
      case 'error': return 'text-error-800';
      case 'warning': return 'text-warning-800';
      default: return 'text-primary-800';
    }
  }
}
