import { Component } from '@angular/core';
import { StatusPanelComponent } from './components/status-panel.component';
import { DemoControlsComponent } from './components/demo-controls.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StatusPanelComponent, DemoControlsComponent],
  template: `
    <div class="min-h-screen bg-secondary-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-secondary-200">
        <div class="max-w-4xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">R</span>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-secondary-900">Raygun4js Angular 17.x Integration</h1>
                <p class="text-sm text-secondary-600">Dynamic API Key Integration with APP_INITIALIZER</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-secondary-500">Angular {{ angularVersion }}</div>
              <div class="text-xs text-secondary-400">raygun4js {{ raygunVersion }}</div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-4xl mx-auto px-6 py-8">
        <!-- Demo Controls -->
        <app-demo-controls></app-demo-controls>

        <!-- Status Panel -->
        <app-status-panel></app-status-panel>
      </main>
    </div>
  `
})
export class AppComponent {
  angularVersion = '17.3.0';
  raygunVersion = '3.1.4';
}
