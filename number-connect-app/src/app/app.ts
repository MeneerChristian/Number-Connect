import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { ScoreDisplayComponent } from './components/score-display/score-display.component';
import { StatsBarComponent } from './components/stats-bar/stats-bar.component';
import { BoardComponent } from './components/board/board.component';
import { BottomControlsComponent } from './components/bottom-controls/bottom-controls.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    ScoreDisplayComponent,
    StatsBarComponent,
    BoardComponent,
    BottomControlsComponent
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      <app-score-display></app-score-display>
      <app-stats-bar></app-stats-bar>
      <app-board></app-board>
      <app-bottom-controls></app-bottom-controls>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--color-background);
      overflow: hidden;
    }

    app-board {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  `]
})
export class App {
  title = 'number-connect-web';
}
