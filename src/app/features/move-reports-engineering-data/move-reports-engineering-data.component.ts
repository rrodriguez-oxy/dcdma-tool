import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-move-reports-engineering-data',
  imports: [RouterLink],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Move Reports and Engineering Data</h1>
        <a routerLink="/" class="back-link">← Back to Home</a>
      </header>
      
      <main class="page-content">
        <div class="content-card">
          <h2>Transfer Reports and Data to Different Wellbore</h2>
          <p>Move reports and engineering data between wellbores efficiently and securely.</p>
          
          <div class="feature-section">
            <h3>Transfer Process</h3>
            <ul>
              <li>Select source wellbore</li>
              <li>Select destination wellbore</li>
              <li>Choose reports and engineering data to transfer</li>
              <li>Validate data integrity</li>
              <li>Execute transfer and verify</li>
            </ul>
          </div>
          
          <div class="action-buttons">
            <button class="btn btn-primary">Start Transfer</button>
            <button class="btn btn-secondary">View Transfer Log</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      padding: 2rem;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #C1272D;
    }
    
    .page-header h1 {
      color: white;
      margin: 0;
      font-size: 2rem;
    }
    
    .back-link {
      color: #C1272D;
      text-decoration: none;
      font-weight: 600;
      padding: 0.5rem 1rem;
      background: white;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    
    .back-link:hover {
      background: #C1272D;
      color: white;
    }
    
    .page-content {
      max-width: 1200px;
    }
    
    .content-card {
      background: white;
      border-radius: 8px;
      padding: 2.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .content-card h2 {
      color: #1a1a1a;
      margin-top: 0;
      margin-bottom: 1rem;
    }
    
    .content-card p {
      color: #4a4a4a;
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    
    .feature-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 6px;
    }
    
    .feature-section h3 {
      color: #1a1a1a;
      margin-top: 0;
    }
    
    .feature-section ul {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }
    
    .feature-section li {
      margin: 0.75rem 0;
      color: #4a4a4a;
    }
    
    .action-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background: #C1272D;
      color: white;
    }
    
    .btn-primary:hover {
      background: #A01F25;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(193, 39, 45, 0.3);
    }
    
    .btn-secondary {
      background: #f8f9fa;
      color: #1a1a1a;
      border: 2px solid #ddd;
    }
    
    .btn-secondary:hover {
      background: #e9ecef;
      border-color: #C1272D;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveReportsEngineeringDataComponent {}
