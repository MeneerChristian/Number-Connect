import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Observable } from 'rxjs';
import { GameStats } from '../../models/game.models';

@Component({
  selector: 'app-bottom-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bottom-controls" *ngIf="stats$ | async as stats">
      <button class="control-button add-button" 
              (click)="onAddClick()"
              [disabled]="stats.addsRemaining <= 0"
              aria-label="Add numbers">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <span class="badge" *ngIf="stats.addsRemaining > 0">{{ stats.addsRemaining }}</span>
      </button>
      
      <button class="control-button hint-button" 
              (click)="onHintClick()"
              [disabled]="stats.hintsRemaining <= 0"
              aria-label="Get hint">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
        </svg>
        <span class="badge" *ngIf="stats.hintsRemaining > 0">{{ stats.hintsRemaining }}</span>
      </button>
    </div>
  `,
  styles: [`
    .bottom-controls {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 80px;
      padding: 16px 24px;
      background: var(--color-background);
      border-top: 1px solid var(--color-border);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 5;
    }
    
    .control-button {
      position: relative;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--duration-fast);
      background: var(--color-background);
      box-shadow: var(--shadow-md);
    }
    
    .control-button:hover:not(:disabled) {
      transform: scale(0.95);
      box-shadow: var(--shadow-sm);
    }
    
    .control-button:active:not(:disabled) {
      transform: scale(0.90);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .control-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #E0E0E0;
    }
    
    .control-button svg {
      width: 28px;
      height: 28px;
    }
    
    .add-button {
      background: var(--color-primary);
      color: white;
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
    }
    
    .add-button:hover:not(:disabled) {
      box-shadow: 0 2px 4px rgba(33, 150, 243, 0.4);
    }
    
    .hint-button {
      background: #FFC107;
      color: white;
      box-shadow: 0 4px 8px rgba(255, 193, 7, 0.4);
    }
    
    .hint-button:hover:not(:disabled) {
      box-shadow: 0 2px 4px rgba(255, 193, 7, 0.4);
    }
    
    .badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-background);
    }
    
    .hint-button .badge {
      background: #4CAF50;
    }
  `]
})
export class BottomControlsComponent {
  stats$: Observable<GameStats>;
  
  constructor(private gameService: GameService) {
    this.stats$ = this.gameService.stats$;
  }
  
  onAddClick(): void {
    this.gameService.addNumbers();
  }
  
  onHintClick(): void {
    const hint = this.gameService.getHint();
    // The hint will be handled by the board component through the service
  }
}