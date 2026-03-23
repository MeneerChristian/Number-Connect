import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="help-overlay" role="dialog" aria-label="How to Play" (click)="close()">
      <div class="help-container" (click)="$event.stopPropagation()">

        <div class="help-header">
          <h2 class="help-title">How to Play</h2>
          <button class="close-button" aria-label="Close help" (click)="close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="tab-bar" role="tablist">
          <button
            *ngFor="let tab of tabs; let i = index"
            class="tab-pill"
            [class.active]="activeTab === i"
            role="tab"
            [attr.aria-selected]="activeTab === i"
            [attr.aria-controls]="'tabpanel-' + i"
            (click)="setTab(i)">
            {{ tab }}
          </button>
        </div>

        <div class="tab-content">

          <!-- Tab 0: Match -->
          <div *ngIf="activeTab === 0" role="tabpanel" id="tabpanel-0" class="panel">
            <div class="example">
              <p class="example-label">Equal numbers</p>
              <div class="mini-board cols-4" aria-hidden="true">
                <div class="mini-cell occupied selected">3</div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell occupied selected">3</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
              </div>
              <p class="example-text">Tap two <strong>equal</strong> numbers to clear them.</p>
            </div>
            <div class="example">
              <p class="example-label">Sum to 10</p>
              <div class="mini-board cols-4" aria-hidden="true">
                <div class="mini-cell occupied selected">3</div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell occupied selected">7</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
              </div>
              <p class="example-text">Or two numbers that <strong>sum to 10</strong> (e.g. 3 + 7, 2 + 8, 1 + 9, 4 + 6).</p>
            </div>
          </div>

          <!-- Tab 1: Paths -->
          <div *ngIf="activeTab === 1" role="tabpanel" id="tabpanel-1" class="panel">
            <div class="example">
              <p class="example-label">Straight line</p>
              <div class="mini-board cols-5" aria-hidden="true">
                <div class="mini-cell occupied selected">4</div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell occupied selected">4</div>
              </div>
              <p class="example-text">Connect through empty cells in a straight line: horizontal, vertical, or diagonal.</p>
            </div>
            <div class="example">
              <p class="example-label">Scan-order wrap</p>
              <div class="mini-board cols-5" aria-hidden="true">
                <div class="mini-cell occupied">2</div>
                <div class="mini-cell occupied">5</div>
                <div class="mini-cell occupied">8</div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell occupied selected">6</div>
                <div class="mini-cell occupied selected">6</div>
                <div class="mini-cell empty path"></div>
                <div class="mini-cell occupied">1</div>
                <div class="mini-cell occupied">3</div>
                <div class="mini-cell occupied">9</div>
              </div>
              <p class="example-text">Numbers can also connect by <strong>scan order</strong> &mdash; wrapping from the end of one row to the start of the next, passing only through empty cells.</p>
            </div>
          </div>

          <!-- Tab 2: Blocked -->
          <div *ngIf="activeTab === 2" role="tabpanel" id="tabpanel-2" class="panel">
            <div class="example">
              <p class="example-label">Blocked path</p>
              <div class="mini-board cols-4" aria-hidden="true">
                <div class="mini-cell occupied selected-fail">5</div>
                <div class="mini-cell occupied blocker">2</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied selected-fail">5</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell empty"></div>
              </div>
              <p class="example-text">An occupied cell in the path <strong>blocks</strong> the connection. The blocker shakes and highlights red. Clear the blocking numbers first!</p>
            </div>
          </div>

          <!-- Tab 3: + -->
          <div *ngIf="activeTab === 3" role="tabpanel" id="tabpanel-3" class="panel">
            <div class="example">
              <p class="example-label">Before</p>
              <div class="mini-board cols-5" aria-hidden="true">
                <div class="mini-cell occupied">3</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied">7</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied">2</div>
                <div class="mini-cell pristine"></div>
                <div class="mini-cell pristine"></div>
                <div class="mini-cell pristine"></div>
                <div class="mini-cell pristine"></div>
                <div class="mini-cell pristine"></div>
              </div>
              <div class="arrow-down" aria-hidden="true">&#x25BC;</div>
              <p class="example-label">After pressing +</p>
              <div class="mini-board cols-5" aria-hidden="true">
                <div class="mini-cell occupied">3</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied">7</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied">2</div>
                <div class="mini-cell occupied new-highlight">3</div>
                <div class="mini-cell occupied new-highlight">7</div>
                <div class="mini-cell occupied new-highlight">2</div>
                <div class="mini-cell pristine"></div>
                <div class="mini-cell pristine"></div>
              </div>
              <p class="example-text">The <strong>+</strong> button copies all remaining numbers and appends them after the last used cell. Uses are limited per stage.</p>
            </div>
          </div>

          <!-- Tab 4: More -->
          <div *ngIf="activeTab === 4" role="tabpanel" id="tabpanel-4" class="panel">
            <div class="example">
              <p class="example-label">Row removal</p>
              <div class="mini-board cols-5" aria-hidden="true">
                <div class="mini-cell occupied">3</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied">7</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied">2</div>
                <div class="mini-cell empty removing"></div>
                <div class="mini-cell empty removing"></div>
                <div class="mini-cell empty removing"></div>
                <div class="mini-cell empty removing"></div>
                <div class="mini-cell empty removing"></div>
                <div class="mini-cell occupied">1</div>
                <div class="mini-cell empty"></div>
                <div class="mini-cell occupied">4</div>
                <div class="mini-cell occupied">8</div>
                <div class="mini-cell empty"></div>
              </div>
              <p class="example-text">Fully empty rows are <strong>removed</strong> automatically, keeping the board compact. Numbers never fall &mdash; they stay in place.</p>
            </div>
            <div class="example">
              <p class="example-label">Scoring &amp; stages</p>
              <p class="example-text">Earn <strong>stars</strong> for each match. Clear all numbers from the board to complete the stage and advance. Spend stars on <strong>hints</strong> to reveal a valid match.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--color-background);
      z-index: 300;
      display: flex;
      flex-direction: column;
      animation: fade-in 0.15s ease;
    }

    .help-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
    }

    .help-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 8px 0 16px;
      flex-shrink: 0;
    }

    .help-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .close-button {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      transition: opacity var(--duration-fast);
    }

    .close-button:hover {
      opacity: 0.7;
    }

    .close-button svg {
      width: 24px;
      height: 24px;
    }

    .tab-bar {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      overflow-x: auto;
      flex-shrink: 0;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .tab-bar::-webkit-scrollbar {
      display: none;
    }

    .tab-pill {
      padding: 6px 16px;
      border-radius: 16px;
      border: 1.5px solid var(--color-border);
      background: var(--color-background);
      color: var(--color-text-secondary);
      font-size: 14px;
      font-weight: 500;
      font-family: var(--font-primary);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--duration-fast);
      flex-shrink: 0;
    }

    .tab-pill.active {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px 16px 24px;
    }

    .example {
      margin-bottom: 24px;
    }

    .example-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 8px 0;
    }

    .example-text {
      font-size: 15px;
      line-height: 1.5;
      color: var(--color-text-primary);
      margin: 8px 0 0 0;
    }

    .arrow-down {
      text-align: center;
      font-size: 20px;
      color: var(--color-text-secondary);
      margin: 8px 0;
    }

    /* Mini Board */
    .mini-board {
      display: grid;
      gap: 2px;
      background: var(--color-border);
      padding: 2px;
      border-radius: 4px;
      width: fit-content;
    }

    .mini-board.cols-4 {
      grid-template-columns: repeat(4, 40px);
    }

    .mini-board.cols-5 {
      grid-template-columns: repeat(5, 40px);
    }

    .mini-cell {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 18px;
      font-weight: 500;
      border-radius: 2px;
    }

    .mini-cell.occupied {
      background: var(--color-background);
      color: var(--color-text-primary);
    }

    .mini-cell.empty {
      background: var(--color-cleared-bg);
    }

    .mini-cell.pristine {
      background: var(--color-background);
      border: 1.5px dashed var(--color-border);
    }

    .mini-cell.selected {
      background: var(--color-selected-bg);
      border: 2px solid var(--color-selected-border);
      color: var(--color-primary);
      font-weight: 600;
    }

    .mini-cell.path {
      background: rgba(33, 150, 243, 0.1);
    }

    .mini-cell.selected-fail {
      background: rgba(255, 82, 82, 0.15);
      border: 2px solid var(--color-error);
      color: var(--color-error);
      font-weight: 600;
    }

    .mini-cell.blocker {
      background: rgba(255, 82, 82, 0.1);
      border: 2px solid rgba(255, 82, 82, 0.4);
      color: var(--color-error);
    }

    .mini-cell.new-highlight {
      background: rgba(76, 175, 80, 0.15);
      border: 2px solid var(--color-success);
      color: var(--color-success);
      font-weight: 600;
    }

    .mini-cell.removing {
      background: var(--color-cleared-bg);
      opacity: 0.4;
      border: 1.5px dashed var(--color-error);
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class HelpModalComponent {
  @Output() closeHelp = new EventEmitter<void>();

  activeTab = 0;
  tabs = ['Match', 'Paths', 'Blocked', '+', 'More'];

  setTab(index: number): void {
    this.activeTab = index;
  }

  close(): void {
    this.closeHelp.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }
}
