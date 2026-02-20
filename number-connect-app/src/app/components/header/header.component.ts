import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Observable } from 'rxjs';
import { GameStats } from '../../models/game.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <button class="back-button" aria-label="Back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      
      <div class="score-container" *ngIf="stats$ | async as stats">
        <svg class="star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="score-text">{{ stats.currentScore }}</span>
      </div>
      
      <button class="settings-button" aria-label="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </button>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 16px;
      background: var(--color-background);
      border-bottom: 1px solid var(--color-border);
    }
    
    .back-button,
    .settings-button {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-primary);
      transition: opacity var(--duration-fast);
    }
    
    .back-button:hover,
    .settings-button:hover {
      opacity: 0.7;
    }
    
    .back-button svg,
    .settings-button svg {
      width: 24px;
      height: 24px;
    }
    
    .score-container {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-surface);
      padding: 8px 16px;
      border-radius: 16px;
      min-width: 80px;
      justify-content: center;
    }
    
    .star-icon {
      width: 20px;
      height: 20px;
      fill: #FFC107;
    }
    
    .score-text {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
  `]
})
export class HeaderComponent {
  stats$: Observable<GameStats>;
  
  constructor(private gameService: GameService) {
    this.stats$ = this.gameService.stats$;
  }
}