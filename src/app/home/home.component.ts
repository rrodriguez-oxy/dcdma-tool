import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Card {
  id: number;
  icon: SafeHtml;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-home',
  imports: [],
  template: `
    <header class="header">
      <h1>{{ title() }}</h1>
      <p class="subtitle">Select an option to get started</p>
    </header>

    <main class="main-content">
      <div class="cards-container">
        @for (card of cards(); track card.id) {
          <div 
            class="card"
            (click)="selectCard(card.id)"
            (keydown.enter)="selectCard(card.id)"
            (keydown.space)="selectCard(card.id); $event.preventDefault()"
            tabindex="0"
            role="button">
            <div class="card-icon" [innerHTML]="card.icon"></div>
            <h2 class="card-title">{{ card.title }}</h2>
            <p class="card-description">{{ card.description }}</p>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .header {
      background: linear-gradient(180deg, rgba(20, 20, 25, 0.95) 0%, rgba(30, 20, 22, 0.9) 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      border-bottom: 3px solid #C1272D;
    }

    .header h1 {
      margin: 0 0 1rem 0;
      font-size: 3rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .subtitle {
      margin: 0;
      font-size: 1.25rem;
      opacity: 0.9;
      font-weight: 300;
      letter-spacing: 0.5px;
    }

    .main-content {
      flex: 1;
      padding: 4rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .card {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 8px;
      padding: 2.5rem 2rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 3px solid transparent;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: #C1272D;
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .card:hover::before {
      transform: scaleX(1);
    }

    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(193, 39, 45, 0.3);
    }

    .card:focus {
      outline: 3px solid #C1272D;
      outline-offset: 3px;
    }

    .card-icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      color: #C1272D;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
      background: linear-gradient(135deg, rgba(193, 39, 45, 0.1) 0%, rgba(193, 39, 45, 0.05) 100%);
      border-radius: 50%;
      width: 100px;
      margin-left: auto;
      margin-right: auto;
    }

    .card-icon :deep(svg) {
      width: 56px;
      height: 56px;
      stroke: #C1272D;
      filter: drop-shadow(0 2px 4px rgba(193, 39, 45, 0.2));
    }

    .card-title {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-description {
      margin: 0;
      color: #4a4a4a;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    @media (max-width: 768px) {
      .header {
        padding: 2rem 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .cards-container {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .main-content {
        padding: 2rem 1rem;
      }

      .card {
        padding: 2rem 1.5rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  protected readonly title = signal('DCDMA Tool');
  
  protected readonly cards = signal<Card[]>([
    {
      id: 1,
      icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M8 16V4"/><path d="M16 16V8"/><path d="M12 16V12"/><circle cx="8" cy="4" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="12" cy="12" r="2"/></svg>`),
      title: 'Project Site Well Movement',
      description: 'Manage well movement operations across project sites',
      route: '/project-site-well-movement'
    },
    {
      id: 2,
      icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/><path d="M17 3l4 4-4 4"/></svg>`),
      title: 'Move Reports and/or Engineering Data',
      description: 'Transfer reports and engineering data to a different wellbore',
      route: '/move-reports-engineering-data'
    },
    {
      id: 3,
      icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/><polyline points="17 8 12 13 17 18"/></svg>`),
      title: 'Move Reports and Event Details from Event to Event',
      description: 'Relocate reports from one event to another',
      route: '/move-reports-between-events'
    },
    {
      id: 4,
      icon: this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="currentColor" stroke="currentColor" stroke-width="0"><rect x="27" y="2" width="10" height="5" rx="1.5"/><path d="M30 7 L23 30 L27 30 L30 7 Z"/><path d="M34 7 L41 30 L37 30 L34 7 Z"/><path d="M25.5 16 L28 16 L38.5 28 L36 28 Z"/><path d="M38.5 16 L36 16 L25.5 28 L28 28 Z"/><rect x="20" y="30" width="24" height="4" rx="0.5"/><rect x="24" y="34" width="4.5" height="18"/><rect x="35.5" y="34" width="4.5" height="18"/><path d="M22 52 L20 52 L17 52 L22 34 L24 34 Z"/><path d="M42 52 L44 52 L47 52 L42 34 L40 34 Z"/><rect x="15" y="52" width="34" height="4" rx="1.5"/></svg>`),
      title: 'Update Well Elevations',
      description: 'Update elevation data for wells across project sites',
      route: '/update-well-elevations'
    }
  ]);

  protected selectCard(id: number): void {
    const card = this.cards().find(c => c.id === id);
    if (card) {
      this.router.navigate([card.route]);
    }
  }
}
