import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatabaseService, QueryResult, SessionExecuteRow } from '../../services/database.service';
import { apiLookWellId } from '../project-site-well-movement/queries/api-look-well-id';
import { compareRecords } from './queries/move-reports-queries';
import { backupQueries } from './queries/backup-queries';
import { updateBackupQueries } from './queries/update-backup-queries';
import { moveParentQueries } from './queries/move-parent-queries';
import { deleteQueries } from './queries/delete-queries';
import { insertFromBackupQueries } from './queries/insert-from-backup-queries';
import { insertSecondaryFromBackupQueries } from './queries/insert-secondary-from-backup-queries';
import { verifyRecordsAfterMove } from './queries/verify-records-queries';
import { dropBackupQueries } from './queries/drop-backup-queries';
import { backupSuffix } from './queries/backup-suffix';
import { compareEventProperties, moveEventPropertiesQueries, verifyEventProperties } from './queries/event-properties-queries';

interface RecordCountRow {
  tableName: string;
  sourceCount: number;
  targetCount: number;
  toMove: number;
  toAdd: number;
}

interface MoveStep {
  label: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  results: SessionExecuteRow[];
  queries: { label: string; sql: string }[];
  error: string;
  collapsed: boolean;
}

@Component({
  selector: 'app-move-reports-between-events',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Move Reports Between Events</h1>
        <a routerLink="/" class="back-link">← Back to Home</a>
      </header>
      
      <main class="page-content">
        <div class="content-card">
          @if (selectedOption()) {
            <div class="selected-header">
              <h2>{{ selectedOption() }}</h2>
              <button class="btn-change" (click)="clearSelection()">← Change Selection</button>
            </div>

            @if (selectedOption() === 'Move reports from one event to another') {
              <!-- Well ID -->
              <div class="panel">
                <h3 class="panel-title">Well ID</h3>
                <div class="inline-form">
                  <label class="inline-label" for="wellIdInput">Well ID:</label>
                  <input
                    id="wellIdInput"
                    type="text"
                    class="form-input inline-input"
                    placeholder="Enter Well ID (e.g., UkS4La4tcJ)"
                    [ngModel]="wellIdInput()"
                    (ngModelChange)="wellIdInput.set($event)"
                  />
                  @if (wellIdInput().trim()) {
                    <button class="btn btn-clear" (click)="clearWellId()">Clear</button>
                  }
                </div>

                <!-- Toggle Well Search -->
                <button class="btn btn-outline btn-sm" (click)="showWellSearch.set(!showWellSearch())">
                  &#9660; {{ showWellSearch() ? 'Hide' : 'Show' }} Well Search
                </button>

                @if (showWellSearch()) {
                  <div class="subsearch">
                    <div class="search-form search-form-single">
                      <div class="form-group">
                        <label for="wellSearch">API No / Well Common Name</label>
                        <input
                          id="wellSearch"
                          type="text"
                          class="form-input"
                          placeholder="Enter API No (e.g., 1234567890%) or Well Common Name"
                          [ngModel]="wellSearchInput()"
                          (ngModelChange)="wellSearchInput.set($event)"
                          (keydown.enter)="runWellSearch()"
                        />
                      </div>
                      <div class="search-actions">
                        <button
                          class="btn btn-primary"
                          [disabled]="!wellSearchInput().trim() || wellSearchLoading()"
                          (click)="runWellSearch()">
                          @if (wellSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                        </button>
                        @if (wellSearchResults()) {
                          <button class="btn btn-secondary" (click)="clearWellSearch()">Clear</button>
                        }
                      </div>
                    </div>
                    @if (wellSearchError()) { <div class="query-error">&#9888; {{ wellSearchError() }}</div> }
                    @if (wellSearchResults(); as results) {
                      <div class="query-results-section">
                        <h4 class="results-title">Results ({{ results.rows.length }} row{{ results.rows.length !== 1 ? 's' : '' }})</h4>
                        @if (results.rows.length) {
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead><tr>@for (col of results.columns; track col) { <th>{{ col }}</th> }<th></th></tr></thead>
                              <tbody>
                                @for (row of results.rows; track $index) {
                                  <tr>
                                    @for (col of results.columns; track col) { <td>{{ row[col] }}</td> }
                                    <td><button class="btn-add-row" (click)="selectWellFromResult(row)">+ Add</button></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        } @else { <p class="hint">No results found.</p> }
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Event Search -->
              <div class="panel">
                <h3 class="panel-title">Events</h3>
                <div class="search-actions">
                  <button
                    class="btn btn-primary"
                    [disabled]="!wellIdInput().trim() || eventSearchLoading()"
                    (click)="runEventSearch()">
                    @if (eventSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search Events }
                  </button>
                  @if (eventSearchResults()) {
                    <button class="btn btn-secondary" (click)="clearEventSearch()">Clear</button>
                  }
                </div>
                @if (eventSearchError()) { <div class="query-error">&#9888; {{ eventSearchError() }}</div> }

                @if (sourceEventId() && targetEventId() && eventSearchResults(); as results) {
                  <div class="selection-summary">
                    <h4 class="results-title">Selected Events</h4>
                    <div class="results-table-wrap">
                      <table class="results-table">
                        <thead>
                          <tr>
                            <th>Role</th>
                            @for (col of results.columns; track col) { <th>{{ col }}</th> }
                          </tr>
                        </thead>
                        <tbody>
                          @if (getEventRow(sourceEventId()); as srcRow) {
                            <tr class="source-row">
                              <td><strong>Source</strong></td>
                              @for (col of results.columns; track col) { <td>{{ srcRow[col] }}</td> }
                            </tr>
                          }
                          @if (getEventRow(targetEventId()); as tgtRow) {
                            <tr class="target-row">
                              <td><strong>Target</strong></td>
                              @for (col of results.columns; track col) { <td>{{ tgtRow[col] }}</td> }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                    <button class="btn btn-secondary btn-sm" (click)="clearEventSelections()">Change Selection</button>
                  </div>

                  <!-- Record Comparison -->
                  <div class="date-filter" style="margin-top: 1rem;">
                    <div class="inline-form">
                      <label class="inline-label" for="fromDate">From Date:</label>
                      <input
                        id="fromDate"
                        type="date"
                        class="form-input inline-input"
                        [ngModel]="fromDate()"
                        (ngModelChange)="fromDate.set($event); datesTouched.set(true)"
                      />
                      <label class="inline-label" for="toDate" style="margin-left: 1rem;">To Date:</label>
                      <input
                        id="toDate"
                        type="date"
                        class="form-input inline-input"
                        [ngModel]="toDate()"
                        (ngModelChange)="toDate.set($event); datesTouched.set(true)"
                      />
                    </div>
                    @if (datesTouched() && dateRangeError()) {
                      <span class="error-text" style="margin-left: 1rem; color: red;">{{ dateRangeError() }}</span>
                    }
                  </div>
                  <div class="search-actions" style="margin-top: 1rem;">
                    <button
                      class="btn btn-primary"
                      [disabled]="recordCountsLoading() || dateRangeError()"
                      (click)="runRecordCounts()">
                      @if (recordCountsLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Compare Records }
                    </button>
                    @if (recordCountsData().length) {
                      <button class="btn btn-secondary" (click)="clearRecordCounts()">Clear</button>
                    }
                  </div>
                  @if (recordCountsError()) { <div class="query-error">&#9888; {{ recordCountsError() }}</div> }
                  @if (recordCountsData().length) {
                    <div class="query-results-section">
                      <div class="results-header-row">
                        <h4 class="results-title">Record Comparison ({{ filteredRecordCountsData().length }} of {{ recordCountsData().length }} tables)</h4>
                        <button class="btn btn-outline btn-sm collapse-btn" (click)="recordCountsCollapsed.set(!recordCountsCollapsed())">
                          {{ recordCountsCollapsed() ? '&#9654; Show' : '&#9660; Hide' }} Table
                        </button>
                      </div>
                      @if (!recordCountsCollapsed()) {
                      <div class="toggle-row">
                        <label class="toggle-label">
                          <input type="checkbox" [ngModel]="filterNonZeroSource()" (ngModelChange)="filterNonZeroSource.set($event)" />
                          Show only tables with Source Event Record Count &ne; 0
                        </label>
                      </div>
                      <div class="results-table-wrap">
                        <table class="results-table">
                          <thead>
                            <tr>
                              <th>Table Name</th>
                              <th class="num-col">Source Event Record Count</th>
                              <th class="num-col">Target Event Record Count</th>
                              <th class="num-col">Count of Records to Move</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (row of filteredRecordCountsData(); track row.tableName) {
                              <tr [class.has-data]="row.sourceCount > 0 || row.targetCount > 0">
                                <td>{{ row.tableName }}</td>
                                <td class="num-col">{{ row.sourceCount }}</td>
                                <td class="num-col">{{ row.targetCount }}</td>
                                <td class="num-col">{{ row.toMove }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                      }
                    </div>
                  }

                  <!-- Move Execution -->
                  @if (recordCountsData().length && !moveSessionId()) {
                    <div class="search-actions" style="margin-top: 1.5rem;">
                      @if (moveError()) { <div class="query-error">&#9888; {{ moveError() }}</div> }
                      <button
                        class="btn btn-primary"
                        [disabled]="moveRunning()"
                        (click)="startMove()">
                        &#9654; Execute Move
                      </button>
                    </div>
                  }

                  @if (moveSessionId()) {
                    <div class="panel move-panel">
                      <h3 class="panel-title">Move Execution</h3>
                      @if (moveError()) { <div class="query-error">&#9888; {{ moveError() }}</div> }

                      <div class="move-steps">
                        @for (step of moveSteps(); track step.label) {
                          <div class="move-step" [class.step-done]="step.status === 'done'" [class.step-error]="step.status === 'error'" [class.step-running]="step.status === 'running'">
                            <span class="step-icon">
                              @if (step.status === 'pending') { &#9675; }
                              @if (step.status === 'running') { &#8987; }
                              @if (step.status === 'done') { &#9989; }
                              @if (step.status === 'error') { &#10060; }
                              @if (step.status === 'skipped') { &#9723; }
                            </span>
                            <span class="step-label">{{ step.label }}</span>
                            @if (step.results.length) {
                              <span class="step-detail">
                                ({{ countSuccessful(step.results) }}/{{ step.results.length }} succeeded)
                              </span>
                            }
                            @if (step.queries.length && step.status !== 'pending') {
                              <button class="btn-toggle-sql" (click)="toggleStepCollapsed(step)">
                                {{ step.collapsed ? '&#9654; SQL' : '&#9660; SQL' }}
                              </button>
                            }
                            @if (step.error) {
                              <span class="step-error-msg">{{ step.error }}</span>
                            }
                          </div>
                          @if (!step.collapsed && step.queries.length && step.status !== 'pending') {
                            <div class="step-sql-list">
                              @for (q of step.queries; track q.label; let i = $index) {
                                <div class="step-sql-item" [class.sql-error]="step.results[i] && !step.results[i].success">
                                  <span class="sql-table-name">{{ q.label }}</span>
                                  @if (step.results[i]) {
                                    <span class="sql-rows">{{ step.results[i].success ? step.results[i].rowsAffected + ' rows' : step.results[i].error }}</span>
                                  }
                                  <pre class="sql-code">{{ q.sql }}</pre>
                                </div>
                              }
                            </div>
                          }
                        }
                      </div>

                      <!-- Verification results -->
                      @if (verificationData().length) {
                        <div class="query-results-section">
                          <div class="results-header-row">
                            <h4 class="results-title">Post-Move Verification ({{ verificationData().length }} tables)</h4>
                            <button class="btn btn-outline btn-sm collapse-btn" (click)="verificationCollapsed.set(!verificationCollapsed())">
                              {{ verificationCollapsed() ? '&#9654; Show' : '&#9660; Hide' }} Table
                            </button>
                          </div>
                          @if (!verificationCollapsed()) {
                            <div class="results-table-wrap">
                              <table class="results-table">
                                <thead>
                                  <tr>
                                    <th rowspan="2">Table Name</th>
                                    <th class="num-col group-before" colspan="2">Count Before the Updates</th>
                                    <th class="num-col group-after" colspan="2">Count After the Updates</th>
                                  </tr>
                                  <tr>
                                    <th class="num-col group-before">Source</th>
                                    <th class="num-col group-before">Target</th>
                                    <th class="num-col group-after">Source</th>
                                    <th class="num-col group-after">Target</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (row of mergedVerificationData(); track row.tableName) {
                                    <tr [class.has-data]="row.sourceBefore > 0 || row.sourceAfter > 0 || row.targetBefore > 0 || row.targetAfter > 0">
                                      <td>{{ row.tableName }}</td>
                                      <td class="num-col col-before">{{ row.sourceBefore }}</td>
                                      <td class="num-col col-before">{{ row.targetBefore }}</td>
                                      <td class="num-col col-after">{{ row.sourceAfter }}</td>
                                      <td class="num-col col-after">{{ row.targetAfter }}</td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          }
                        </div>
                      }

                      <!-- Commit / Rollback -->
                      @if (moveAwaitingConfirm()) {
                        <div class="confirm-actions">
                          <p class="confirm-msg">&#9888; Review the verification results above. Commit to save changes permanently, or Rollback to undo everything.</p>
                          <div class="search-actions">
                            <button class="btn btn-commit" [disabled]="moveCommitting()" (click)="commitMove()">
                              @if (moveCommitting()) { Committing... } @else { &#10003; Commit }
                            </button>
                            <button class="btn btn-rollback" [disabled]="moveCommitting()" (click)="rollbackMove()">
                              &#10007; Rollback
                            </button>
                          </div>
                        </div>
                      }
                      @if (!moveAwaitingConfirm() && moveSessionId() && moveError()) {
                        <div class="confirm-actions">
                          <p class="confirm-msg">&#9888; The move failed. Rollback to release the database session and undo any partial changes.</p>
                          <div class="search-actions">
                            <button class="btn btn-rollback" [disabled]="moveCommitting()" (click)="rollbackMove()">
                              &#10007; Rollback
                            </button>
                          </div>
                        </div>
                      }
                      @if (moveCommitted()) {
                        <div class="commit-success">&#9989; Changes committed successfully. Backup tables dropped.</div>
                      }
                      @if (moveRolledBack()) {
                        <div class="rollback-success">&#8634; All changes rolled back. No data was modified.</div>
                      }
                    </div>
                  }
                }

                @if (!(sourceEventId() && targetEventId()) && eventSearchResults(); as results) {
                  <div class="query-results-section">
                    <h4 class="results-title">Results ({{ results.rows.length }} row{{ results.rows.length !== 1 ? 's' : '' }})</h4>
                    @if (results.rows.length) {
                      <div class="results-table-wrap">
                        <table class="results-table">
                          <thead>
                            <tr>
                              <th>Source Event</th>
                              @for (col of results.columns; track col) { <th>{{ col }}</th> }
                              <th>Target Event</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (row of results.rows; track $index) {
                              <tr [class.source-row]="sourceEventId() === '' + row['event_id']" [class.target-row]="targetEventId() === '' + row['event_id']">
                                <td class="radio-cell">
                                  <button
                                    class="btn-select"
                                    [class.selected]="sourceEventId() === '' + row['event_id']"
                                    (click)="selectSourceEvent('' + row['event_id'])">
                                    {{ sourceEventId() === '' + row['event_id'] ? '◉' : '○' }}
                                  </button>
                                </td>
                                @for (col of results.columns; track col) { <td>{{ row[col] }}</td> }
                                <td class="radio-cell">
                                  @if (sourceEventId() === '' + row['event_id']) {
                                    <span class="disabled-mark">—</span>
                                  } @else {
                                    <button
                                      class="btn-select target"
                                      [class.selected]="targetEventId() === '' + row['event_id']"
                                      (click)="selectTargetEvent('' + row['event_id'])">
                                      {{ targetEventId() === '' + row['event_id'] ? '◉' : '○' }}
                                    </button>
                                  }
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else { <p class="hint">No events found for this Well ID.</p> }
                  </div>
                }
              </div>
            }

            @if (selectedOption() === 'Move Event Properties') {
              <!-- Well ID -->
              <div class="panel">
                <h3 class="panel-title">Well ID</h3>
                <div class="inline-form">
                  <label class="inline-label" for="epWellIdInput">Well ID:</label>
                  <input
                    id="epWellIdInput"
                    type="text"
                    class="form-input inline-input"
                    placeholder="Enter Well ID (e.g., UkS4La4tcJ)"
                    [ngModel]="epWellIdInput()"
                    (ngModelChange)="epWellIdInput.set($event)"
                  />
                  @if (epWellIdInput().trim()) {
                    <button class="btn btn-clear" (click)="epClearWellId()">Clear</button>
                  }
                </div>

                <button class="btn btn-outline btn-sm" (click)="epShowWellSearch.set(!epShowWellSearch())">
                  &#9660; {{ epShowWellSearch() ? 'Hide' : 'Show' }} Well Search
                </button>

                @if (epShowWellSearch()) {
                  <div class="subsearch">
                    <div class="search-form search-form-single">
                      <div class="form-group">
                        <label for="epWellSearch">API No / Well Common Name</label>
                        <input
                          id="epWellSearch"
                          type="text"
                          class="form-input"
                          placeholder="Enter API No (e.g., 1234567890%) or Well Common Name"
                          [ngModel]="epWellSearchInput()"
                          (ngModelChange)="epWellSearchInput.set($event)"
                          (keydown.enter)="epRunWellSearch()"
                        />
                      </div>
                      <div class="search-actions">
                        <button
                          class="btn btn-primary"
                          [disabled]="!epWellSearchInput().trim() || epWellSearchLoading()"
                          (click)="epRunWellSearch()">
                          @if (epWellSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                        </button>
                        @if (epWellSearchResults()) {
                          <button class="btn btn-secondary" (click)="epClearWellSearch()">Clear</button>
                        }
                      </div>
                    </div>
                    @if (epWellSearchError()) { <div class="query-error">&#9888; {{ epWellSearchError() }}</div> }
                    @if (epWellSearchResults(); as results) {
                      <div class="query-results-section">
                        <h4 class="results-title">Results ({{ results.rows.length }} row{{ results.rows.length !== 1 ? 's' : '' }})</h4>
                        @if (results.rows.length) {
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead><tr>@for (col of results.columns; track col) { <th>{{ col }}</th> }<th></th></tr></thead>
                              <tbody>
                                @for (row of results.rows; track $index) {
                                  <tr>
                                    @for (col of results.columns; track col) { <td>{{ row[col] }}</td> }
                                    <td><button class="btn-add-row" (click)="epSelectWellFromResult(row)">+ Add</button></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        } @else { <p class="hint">No results found.</p> }
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Event Search -->
              <div class="panel">
                <h3 class="panel-title">Events</h3>
                <div class="search-actions">
                  <button
                    class="btn btn-primary"
                    [disabled]="!epWellIdInput().trim() || epEventSearchLoading()"
                    (click)="epRunEventSearch()">
                    @if (epEventSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search Events }
                  </button>
                  @if (epEventSearchResults()) {
                    <button class="btn btn-secondary" (click)="epClearEventSearch()">Clear</button>
                  }
                </div>
                @if (epEventSearchError()) { <div class="query-error">&#9888; {{ epEventSearchError() }}</div> }

                @if (epSourceEventId() && epTargetEventId() && epEventSearchResults(); as results) {
                  <div class="selection-summary">
                    <h4 class="results-title">Selected Events</h4>
                    <div class="results-table-wrap">
                      <table class="results-table">
                        <thead>
                          <tr>
                            <th>Role</th>
                            @for (col of results.columns; track col) { <th>{{ col }}</th> }
                          </tr>
                        </thead>
                        <tbody>
                          @if (epGetEventRow(epSourceEventId()); as srcRow) {
                            <tr class="source-row">
                              <td><strong>Source</strong></td>
                              @for (col of results.columns; track col) { <td>{{ srcRow[col] }}</td> }
                            </tr>
                          }
                          @if (epGetEventRow(epTargetEventId()); as tgtRow) {
                            <tr class="target-row">
                              <td><strong>Target</strong></td>
                              @for (col of results.columns; track col) { <td>{{ tgtRow[col] }}</td> }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                    <button class="btn btn-secondary btn-sm" (click)="epClearEventSelections()">Change Selection</button>
                  </div>

                  <!-- Compare Records -->
                  <div class="search-actions" style="margin-top: 1rem;">
                    <button
                      class="btn btn-primary"
                      [disabled]="epRecordCountsLoading()"
                      (click)="epRunRecordCounts()">
                      @if (epRecordCountsLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Compare Records }
                    </button>
                    @if (epRecordCountsData().length) {
                      <button class="btn btn-secondary" (click)="epClearRecordCounts()">Clear</button>
                    }
                  </div>
                  @if (epRecordCountsError()) { <div class="query-error">&#9888; {{ epRecordCountsError() }}</div> }
                  @if (epRecordCountsData().length) {
                    <div class="query-results-section">
                      <div class="results-header-row">
                        <h4 class="results-title">Record Comparison ({{ epFilteredRecordCountsData().length }} of {{ epRecordCountsData().length }} tables)</h4>
                        <button class="btn btn-outline btn-sm collapse-btn" (click)="epRecordCountsCollapsed.set(!epRecordCountsCollapsed())">
                          {{ epRecordCountsCollapsed() ? '&#9654; Show' : '&#9660; Hide' }} Table
                        </button>
                      </div>
                      @if (!epRecordCountsCollapsed()) {
                      <div class="toggle-row">
                        <label class="toggle-label">
                          <input type="checkbox" [ngModel]="epFilterNonZeroSource()" (ngModelChange)="epFilterNonZeroSource.set($event)" />
                          Show only tables with Source Event Record Count &ne; 0
                        </label>
                      </div>
                      <div class="results-table-wrap">
                        <table class="results-table">
                          <thead>
                            <tr>
                              <th>Table Name</th>
                              <th class="num-col">Source Event Record Count</th>
                              <th class="num-col">Target Event Record Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (row of epFilteredRecordCountsData(); track row.tableName) {
                              <tr [class.has-data]="row.sourceCount > 0 || row.targetCount > 0">
                                <td>{{ row.tableName }}</td>
                                <td class="num-col">{{ row.sourceCount }}</td>
                                <td class="num-col">{{ row.targetCount }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                      }
                    </div>
                  }

                  <!-- Execute Move -->
                  @if (epRecordCountsData().length && !epMoveSessionId()) {
                    <div class="search-actions" style="margin-top: 1.5rem;">
                      @if (epMoveError()) { <div class="query-error">&#9888; {{ epMoveError() }}</div> }
                      <button
                        class="btn btn-primary"
                        [disabled]="epMoveRunning()"
                        (click)="epStartMove()">
                        &#9654; Execute Move
                      </button>
                    </div>
                  }

                  @if (epMoveSessionId()) {
                    <div class="panel move-panel">
                      <h3 class="panel-title">Move Execution</h3>
                      @if (epMoveError()) { <div class="query-error">&#9888; {{ epMoveError() }}</div> }

                      <div class="move-steps">
                        @for (step of epMoveSteps(); track step.label) {
                          <div class="move-step" [class.step-done]="step.status === 'done'" [class.step-error]="step.status === 'error'" [class.step-running]="step.status === 'running'">
                            <span class="step-icon">
                              @if (step.status === 'pending') { &#9675; }
                              @if (step.status === 'running') { &#8987; }
                              @if (step.status === 'done') { &#9989; }
                              @if (step.status === 'error') { &#10060; }
                              @if (step.status === 'skipped') { &#9723; }
                            </span>
                            <span class="step-label">{{ step.label }}</span>
                            @if (step.results.length) {
                              <span class="step-detail">
                                ({{ epCountSuccessful(step.results) }}/{{ step.results.length }} succeeded)
                              </span>
                            }
                            @if (step.queries.length && step.status !== 'pending') {
                              <button class="btn-toggle-sql" (click)="epToggleStepCollapsed(step)">
                                {{ step.collapsed ? '&#9654; SQL' : '&#9660; SQL' }}
                              </button>
                            }
                            @if (step.error) {
                              <span class="step-error-msg">{{ step.error }}</span>
                            }
                          </div>
                          @if (!step.collapsed && step.queries.length && step.status !== 'pending') {
                            <div class="step-sql-list">
                              @for (q of step.queries; track q.label; let i = $index) {
                                <div class="step-sql-item" [class.sql-error]="step.results[i] && !step.results[i].success">
                                  <span class="sql-table-name">{{ q.label }}</span>
                                  @if (step.results[i]) {
                                    <span class="sql-rows">{{ step.results[i].success ? step.results[i].rowsAffected + ' rows' : step.results[i].error }}</span>
                                  }
                                  <pre class="sql-code">{{ q.sql }}</pre>
                                </div>
                              }
                            </div>
                          }
                        }
                      </div>

                      @if (epVerificationData().length) {
                        <div class="query-results-section" style="margin-top: 1rem;">
                          <h4 class="results-title">Verification — Before &amp; After</h4>
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead>
                                <tr>
                                  <th rowspan="2">Table Name</th>
                                  <th colspan="2" class="num-col group-header">Count Before the Updates</th>
                                  <th colspan="2" class="num-col group-header group-after">Count After the Updates</th>
                                </tr>
                                <tr>
                                  <th class="num-col">Source</th>
                                  <th class="num-col">Target</th>
                                  <th class="num-col group-after">Source</th>
                                  <th class="num-col group-after">Target</th>
                                </tr>
                              </thead>
                              <tbody>
                                @for (row of epMergedVerificationData(); track row.tableName) {
                                  <tr>
                                    <td>{{ row.tableName }}</td>
                                    <td class="num-col">{{ row.sourceBefore }}</td>
                                    <td class="num-col">{{ row.targetBefore }}</td>
                                    <td class="num-col group-after">{{ row.sourceAfter }}</td>
                                    <td class="num-col group-after">{{ row.targetAfter }}</td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      }

                      @if (epMoveAwaitingConfirm()) {
                        <div class="confirm-actions" style="margin-top: 1.5rem;">
                          <p><strong>Review the results above.</strong> Commit to make changes permanent, or Rollback to undo.</p>
                          <div class="search-actions">
                            <button class="btn btn-primary" [disabled]="epMoveCommitting()" (click)="epCommitMove()">&#10004; Commit</button>
                            <button class="btn btn-secondary" [disabled]="epMoveCommitting()" (click)="epRollbackMove()">&#10008; Rollback</button>
                          </div>
                        </div>
                      }

                      @if (epMoveCommitted()) {
                        <div class="success-msg" style="margin-top: 1rem;">&#9989; Move committed successfully.</div>
                      }
                      @if (epMoveRolledBack()) {
                        <div class="warn-msg" style="margin-top: 1rem;">&#9888; Move rolled back. No changes were applied.</div>
                      }
                      @if (epMoveError() && epMoveSessionId() && !epMoveAwaitingConfirm()) {
                        <div class="search-actions" style="margin-top: 1rem;">
                          <button class="btn btn-secondary" [disabled]="epMoveCommitting()" (click)="epRollbackMove()">&#10008; Rollback</button>
                        </div>
                      }
                    </div>
                  }
                }

                @if (!(epSourceEventId() && epTargetEventId()) && epEventSearchResults(); as results) {
                  <div class="query-results-section">
                    <h4 class="results-title">Results ({{ results.rows.length }} row{{ results.rows.length !== 1 ? 's' : '' }})</h4>
                    @if (results.rows.length) {
                      <div class="results-table-wrap">
                        <table class="results-table">
                          <thead>
                            <tr>
                              <th>Source Event</th>
                              @for (col of results.columns; track col) { <th>{{ col }}</th> }
                              <th>Target Event</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (row of results.rows; track $index) {
                              <tr [class.source-row]="epSourceEventId() === '' + row['event_id']" [class.target-row]="epTargetEventId() === '' + row['event_id']">
                                <td class="radio-cell">
                                  <button
                                    class="btn-select"
                                    [class.selected]="epSourceEventId() === '' + row['event_id']"
                                    (click)="epSelectSourceEvent('' + row['event_id'])">
                                    {{ epSourceEventId() === '' + row['event_id'] ? '◉' : '○' }}
                                  </button>
                                </td>
                                @for (col of results.columns; track col) { <td>{{ row[col] }}</td> }
                                <td class="radio-cell">
                                  @if (epSourceEventId() === '' + row['event_id']) {
                                    <span class="disabled-mark">—</span>
                                  } @else {
                                    <button
                                      class="btn-select target"
                                      [class.selected]="epTargetEventId() === '' + row['event_id']"
                                      (click)="epSelectTargetEvent('' + row['event_id'])">
                                      {{ epTargetEventId() === '' + row['event_id'] ? '◉' : '○' }}
                                    </button>
                                  }
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else { <p class="hint">No events found for this Well ID.</p> }
                  </div>
                }
              </div>
            }

          } @else {
            <h2>Select Operation</h2>
            <p>Choose the type of report movement you want to perform.</p>
            
            <div class="hexagon-grid">
              <div 
                class="hexagon-wrapper"
                (click)="selectOption('Move reports from one event to another')"
                (keydown.enter)="selectOption('Move reports from one event to another')"
                (keydown.space)="selectOption('Move reports from one event to another'); $event.preventDefault()"
                tabindex="0"
                role="button">
                <div class="hexagon">
                  <div class="hexagon-border">
                    <div class="hexagon-inner">
                      <div class="hexagon-content">
                        <div class="hex-icon">
                          <svg viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                            <line x1="12" y1="12" x2="12" y2="18"/>
                          </svg>
                        </div>
                        <div class="hex-title">Move Reports</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                class="hexagon-wrapper"
                (click)="selectOption('Move Event Properties')"
                (keydown.enter)="selectOption('Move Event Properties')"
                (keydown.space)="selectOption('Move Event Properties'); $event.preventDefault()"
                tabindex="0"
                role="button">
                <div class="hexagon">
                  <div class="hexagon-border">
                    <div class="hexagon-inner">
                      <div class="hexagon-content">
                        <div class="hex-icon">
                          <svg viewBox="0 0 24 24">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </div>
                        <div class="hex-title">Move Event Properties</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          }
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
      margin: 0 auto;
    }
    
    .content-card {
      background: white;
      border-radius: 8px;
      padding: 3rem 2.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .content-card h2 {
      color: #1a1a1a;
      margin-top: 0;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 2rem;
    }
    
    .content-card > p {
      color: #4a4a4a;
      font-size: 1.1rem;
      margin-bottom: 3rem;
      text-align: center;
    }
    
    .hexagon-grid {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      padding: 3rem 0;
      flex-wrap: wrap;
    }
    
    .hexagon-wrapper {
      cursor: pointer;
      transition: transform 0.3s ease;
      outline: none;
    }
    
    .hexagon-wrapper:hover {
      transform: scale(1.05);
    }
    
    .hexagon-wrapper:focus {
      outline: 3px solid #C1272D;
      outline-offset: 8px;
      border-radius: 8px;
    }
    
    .hexagon {
      position: relative;
      width: 200px;
      height: 230px;
      transition: all 0.3s ease;
    }
    
    .hexagon-border {
      position: absolute;
      width: 100%;
      height: 100%;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
      padding: 3px;
      transition: all 0.3s ease;
    }
    
    .hexagon:hover .hexagon-border {
      background: linear-gradient(135deg, #5a6678 0%, #3d4758 100%);
    }
    
    .hexagon-inner {
      width: 100%;
      height: 100%;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .hexagon:hover .hexagon-inner {
      background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
    }
    
    .hexagon-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      color: white;
    }
    
    .hex-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0.9;
    }
    
    .hex-icon :deep(svg) {
      width: 56px;
      height: 56px;
      stroke: white;
      fill: none;
      stroke-width: 2;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    }
    
    .hex-title {
      font-size: 1rem;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.95);
    }
    
    .selected-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    
    .selected-header h2 {
      color: white;
      margin: 0;
      font-size: 1.5rem;
      text-align: left;
    }
    
    .btn-change {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    
    .btn-change:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .panel {
      margin-top: 1.5rem;
      padding: 1.5rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: #fafbfc;
    }

    .panel-title {
      color: #1a1a1a;
      font-size: 1.35rem;
      margin: 0 0 1rem 0;
    }

    .inline-form {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .inline-label {
      font-weight: 700;
      font-size: 0.95rem;
      color: #1a1a1a;
      white-space: nowrap;
    }

    .inline-input {
      flex: 1;
      min-width: 200px;
    }

    .btn-add {
      background: #1565c0;
      color: white;
    }

    .btn-add:hover {
      background: #0d47a1;
    }

    .btn-clear {
      background: #C1272D;
      color: white;
    }

    .btn-clear:hover {
      background: #A01F25;
    }

    .btn-outline {
      background: transparent;
      color: #4a5568;
      border: 2px solid #d1d5db;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-outline:hover {
      border-color: #C1272D;
      color: #C1272D;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      margin-top: 1rem;
    }

    .subsearch {
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .search-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-items: end;
    }

    .search-form.search-form-single {
      grid-template-columns: 1fr;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-group label {
      font-weight: 600;
      font-size: 0.9rem;
      color: #374151;
    }

    .form-input {
      padding: 0.65rem 0.85rem;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.95rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      outline: none;
    }

    .form-input:focus {
      border-color: #C1272D;
      box-shadow: 0 0 0 3px rgba(193, 39, 45, 0.15);
    }

    .form-input::placeholder {
      color: #9ca3af;
    }

    .search-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .search-icon {
      margin-right: 0.35rem;
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

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-primary {
      background: #C1272D;
      color: white;
    }

    .btn-primary:hover {
      background: #A01F25;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(193, 39, 45, 0.4);
    }

    .btn-secondary {
      background: white;
      color: #1a1a1a;
      border: 2px solid #ddd;
    }

    .btn-secondary:hover {
      background: #f8f9fa;
      border-color: #C1272D;
      color: #C1272D;
    }

    .query-error {
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      color: #991b1b;
      font-size: 0.9rem;
    }

    .query-results-section {
      margin-top: 1rem;
    }

    .results-title {
      margin: 0 0 0.5rem 0;
      color: #1a1a1a;
      font-size: 0.95rem;
    }

    .results-table-wrap {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .results-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .results-table th {
      background: #f1f5f9;
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-weight: 700;
      color: #374151;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    .results-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1a1a1a;
    }

    .results-table tbody tr:hover {
      background: #f8fafc;
    }

    .btn-add-row {
      background: #1565c0;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.25rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }

    .btn-add-row:hover {
      background: #0d47a1;
    }

    .hint {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0.75rem 0 0 0;
    }

    .well-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .well-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: #e2e8f0;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .chip-remove {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0 0.15rem;
      line-height: 1;
      transition: color 0.2s;
    }

    .chip-remove:hover {
      color: #C1272D;
    }

    .radio-cell {
      text-align: center;
    }

    .btn-select {
      background: none;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      font-size: 1rem;
      cursor: pointer;
      color: #94a3b8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
      line-height: 1;
    }

    .btn-select:hover {
      border-color: #C1272D;
      color: #C1272D;
    }

    .btn-select.selected {
      background: #C1272D;
      border-color: #C1272D;
      color: white;
    }

    .btn-select.target.selected {
      background: #1565c0;
      border-color: #1565c0;
      color: white;
    }

    .disabled-mark {
      color: #d1d5db;
      font-size: 1.1rem;
    }

    .source-row {
      background: #fef2f2 !important;
    }

    .target-row {
      background: #eff6ff !important;
    }

    .radio-cell input[type="radio"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #C1272D;
    }

    .radio-cell input[type="radio"]:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }

    .selection-summary {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      border-radius: 6px;
      color: #065f46;
      font-size: 0.95rem;
    }

    .selection-summary p {
      margin: 0;
    }

    .results-table th.num-col,
    .num-col {
      text-align: right;
    }

    .results-table th.group-before {
      background: #e8f0fe;
      color: #1a56db;
      text-align: center;
      border-left: 2px solid #93b4f5;
    }

    .results-table th.group-after {
      background: #ecfdf5;
      color: #047857;
      text-align: center;
      border-left: 2px solid #6ee7b7;
    }

    .results-table td.col-before {
      background: #f8fbff;
    }

    .results-table td.col-after {
      background: #f8fdfb;
    }

    .has-data {
      background: #fffbeb !important;
      font-weight: 600;
    }

    .toggle-row {
      margin-bottom: 0.75rem;
    }

    .results-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .results-header-row .results-title {
      margin: 0;
    }

    .collapse-btn {
      margin-top: 0;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
    }

    .toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
    }

    .toggle-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #C1272D;
      cursor: pointer;
    }

    .move-panel {
      margin-top: 1.5rem;
      border-color: #C1272D;
    }

    .move-steps {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .move-step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f8fafc;
      border-radius: 4px;
      font-size: 0.9rem;
      border-left: 3px solid #d1d5db;
    }

    .move-step.step-done {
      border-left-color: #22c55e;
      background: #f0fdf4;
    }

    .move-step.step-error {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .move-step.step-running {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .step-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .step-label {
      font-weight: 600;
      color: #1a1a1a;
    }

    .step-detail {
      color: #6b7280;
      font-size: 0.85rem;
    }

    .step-error-msg {
      color: #dc2626;
      font-size: 0.85rem;
      margin-left: auto;
    }

    .btn-toggle-sql {
      margin-left: 0.5rem;
      padding: 1px 8px;
      font-size: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #f9fafb;
      color: #374151;
      cursor: pointer;
    }
    .btn-toggle-sql:hover {
      background: #e5e7eb;
    }

    .step-sql-list {
      margin: 0 0 0.5rem 2rem;
      border-left: 2px solid #e5e7eb;
      padding-left: 0.75rem;
    }

    .step-sql-item {
      margin-bottom: 0.5rem;
    }
    .step-sql-item.sql-error {
      border-left: 2px solid #dc2626;
      padding-left: 0.5rem;
    }

    .sql-table-name {
      font-weight: 600;
      font-size: 0.8rem;
      color: #1f2937;
    }

    .sql-rows {
      font-size: 0.75rem;
      color: #6b7280;
      margin-left: 0.5rem;
    }

    .sql-code {
      margin: 0.25rem 0 0 0;
      padding: 0.4rem 0.6rem;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.75rem;
      line-height: 1.4;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      color: #1f2937;
    }

    .confirm-actions {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #fffbeb;
      border: 1px solid #fbbf24;
      border-radius: 6px;
    }

    .confirm-msg {
      margin: 0 0 1rem 0;
      font-weight: 600;
      color: #92400e;
      font-size: 0.95rem;
    }

    .btn-commit {
      background: #16a34a;
      color: white;
    }

    .btn-commit:hover:not(:disabled) {
      background: #15803d;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
    }

    .btn-rollback {
      background: #dc2626;
      color: white;
    }

    .btn-rollback:hover:not(:disabled) {
      background: #b91c1c;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
    }

    .commit-success {
      margin-top: 1rem;
      padding: 1rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      color: #166534;
      font-weight: 600;
    }

    .rollback-success {
      margin-top: 1rem;
      padding: 1rem;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      color: #991b1b;
      font-weight: 600;
    }

    .group-header {
      text-align: center;
      font-weight: 700;
      border-bottom: 2px solid #e5e7eb;
    }

    .group-after,
    th.group-after,
    td.group-after {
      background: #ecfdf5;
    }

    thead tr:first-child th.group-after {
      border-left: 2px solid #6ee7b7;
    }

    thead tr:nth-child(2) th.group-after {
      border-left: none;
    }

    thead tr:nth-child(2) th.group-after:first-of-type {
      border-left: 2px solid #6ee7b7;
    }

    tbody td.group-after:first-of-type {
      border-left: 2px solid #6ee7b7;
    }

    @media (max-width: 768px) {
      .page-header h1 {
        font-size: 1.25rem;
      }
      
      .btn-change {
        width: 100%;
      }
      
      .hexagon-grid {
        gap: 1rem;
        padding: 2rem 0;
      }
      
      .hexagon {
        width: 160px;
        height: 184px;
      }
      
      .hex-icon :deep(svg) {
        width: 44px;
        height: 44px;
      }
      
      .hex-title {
        font-size: 0.9rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveReportsBetweenEventsComponent {
  private db = inject(DatabaseService);

  selectedOption = signal<string | null>(null);

  // Well ID signal
  wellIdInput = signal('');

  // Event search signals
  eventSearchLoading = signal(false);
  eventSearchError = signal('');
  eventSearchResults = signal<QueryResult | null>(null);
  sourceEventId = signal<string>('');
  targetEventId = signal<string>('');

  // Well search signals
  showWellSearch = signal(false);
  wellSearchInput = signal('');
  wellSearchLoading = signal(false);
  wellSearchError = signal('');
  wellSearchResults = signal<QueryResult | null>(null);

  // Date filter signals
  fromDate = signal('');
  toDate = signal('');
  datesTouched = signal(false);
  dateRangeError = computed(() => {
    const from = this.fromDate();
    const to = this.toDate();
    if (!from || !to) {
      return 'Both From Date and To Date are required.';
    }
    if (to < from) {
      return 'To Date must be equal to or later than From Date.';
    }
    return '';
  });

  // Record comparison signals
  recordCountsLoading = signal(false);
  recordCountsError = signal('');
  recordCountsData = signal<RecordCountRow[]>([]);
  filterNonZeroSource = signal(false);
  recordCountsCollapsed = signal(false);
  filteredRecordCountsData = computed(() => {
    const data = this.recordCountsData();
    if (!this.filterNonZeroSource()) {
      return data;
    }
    return data.filter(row => row.sourceCount !== 0);
  });

  // Move execution signals
  moveSessionId = signal('');
  moveBackupSuffix = signal('');
  moveRunning = signal(false);
  moveError = signal('');
  moveSteps = signal<MoveStep[]>([]);
  moveAwaitingConfirm = signal(false);
  moveCommitting = signal(false);
  moveCommitted = signal(false);
  moveRolledBack = signal(false);
  verificationData = signal<RecordCountRow[]>([]);
  verificationCollapsed = signal(false);
  mergedVerificationData = computed(() => {
    const before = this.recordCountsData();
    const after = this.verificationData();
    const beforeMap = new Map(before.map(r => [r.tableName, r]));
    return after.map(row => {
      const prev = beforeMap.get(row.tableName);
      return {
        tableName: row.tableName,
        sourceBefore: prev?.sourceCount ?? 0,
        sourceAfter: row.sourceCount,
        targetBefore: prev?.targetCount ?? 0,
        targetAfter: row.targetCount,
      };
    });
  });

  selectOption(option: string): void {
    this.selectedOption.set(option);
  }

  clearSelection(): void {
    this.selectedOption.set(null);
    this.clearWellId();
  }

  clearWellId(): void {
    this.wellIdInput.set('');
    this.showWellSearch.set(false);
    this.clearWellSearch();
    this.clearEventSearch();
  }

  runWellSearch(): void {
    const apiNo = this.wellSearchInput().trim();
    if (!apiNo) { return; }
    this.wellSearchLoading.set(true);
    this.wellSearchError.set('');
    this.wellSearchResults.set(null);
    const sql = apiLookWellId(apiNo).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.wellSearchResults.set(result); this.wellSearchLoading.set(false); },
      error: (err) => { this.wellSearchError.set(err?.message ?? 'Search failed'); this.wellSearchLoading.set(false); }
    });
  }

  clearWellSearch(): void {
    this.wellSearchInput.set('');
    this.wellSearchResults.set(null);
    this.wellSearchError.set('');
  }

  selectWellFromResult(row: Record<string, unknown>): void {
    const wellId = String(row['well_id'] ?? '');
    if (wellId) {
      this.wellIdInput.set(wellId);
      this.showWellSearch.set(false);
      this.clearWellSearch();
    }
  }

  runEventSearch(): void {
    const wellId = this.wellIdInput().trim();
    if (!wellId) { return; }
    this.eventSearchLoading.set(true);
    this.eventSearchError.set('');
    this.eventSearchResults.set(null);
    this.sourceEventId.set('');
    this.targetEventId.set('');
    const sql = `SELECT event_id "event_id", event_code "event_code", event_type "Event Name", event_objective_1 "Prim. Reason", TO_CHAR(date_ops_start, 'MM/DD/YYYY') "Start date", TO_CHAR(date_ops_end, 'MM/DD/YYYY') "End date" FROM dm_event WHERE well_id = '${wellId}' ORDER BY date_ops_start ASC`;
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.eventSearchResults.set(result); this.eventSearchLoading.set(false); },
      error: (err) => { this.eventSearchError.set(err?.message ?? 'Event search failed'); this.eventSearchLoading.set(false); }
    });
  }

  clearEventSearch(): void {
    this.eventSearchResults.set(null);
    this.eventSearchError.set('');
    this.sourceEventId.set('');
    this.targetEventId.set('');
  }

  selectSourceEvent(eventId: string): void {
    this.sourceEventId.set(eventId);
    if (this.targetEventId() === eventId) {
      this.targetEventId.set('');
    }
    this.fromDate.set('');
    this.toDate.set('');
    this.datesTouched.set(false);
    this.clearRecordCounts();
  }

  selectTargetEvent(eventId: string): void {
    this.targetEventId.set(eventId);
    this.fromDate.set('');
    this.toDate.set('');
    this.datesTouched.set(false);
    this.clearRecordCounts();
  }

  clearEventSelections(): void {
    this.sourceEventId.set('');
    this.targetEventId.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.datesTouched.set(false);
    this.clearRecordCounts();
  }

  getEventRow(eventId: string): Record<string, unknown> | undefined {
    const results = this.eventSearchResults();
    if (!results) { return undefined; }
    return results.rows.find(row => '' + row['event_id'] === eventId);
  }

  runRecordCounts(): void {
    const sourceId = this.sourceEventId();
    const targetId = this.targetEventId();
    if (!sourceId || !targetId) { return; }

    this.recordCountsLoading.set(true);
    this.recordCountsError.set('');
    this.recordCountsData.set([]);

    const wellId = this.wellIdInput().trim();
    const from = this.fromDate() || undefined;
    const to = this.toDate() || undefined;
    const queries = compareRecords(wellId, sourceId, targetId, from, to);

    const allRequests: Record<string, ReturnType<typeof this.db.executeQuery>> = {};
    queries.forEach((sql, i) => { allRequests[`q_${i}`] = this.db.executeQuery(sql); });

    forkJoin(allRequests).subscribe({
      next: (results) => {
        const data: RecordCountRow[] = [];
        for (const result of Object.values(results)) {
          for (const row of result.rows) {
            data.push({
              tableName: String(row['Table_name']),
              sourceCount: Number(row['sourceCount']) || 0,
              targetCount: Number(row['targetCount']) || 0,
              toMove: Number(row['toMove']) || 0,
              toAdd: Number(row['toAdd']) || 0,
            });
          }
        }
        data.sort((a, b) => a.tableName.localeCompare(b.tableName));
        this.recordCountsData.set(data);
        this.recordCountsLoading.set(false);
      },
      error: (err) => {
        const oracleMsg = err?.error?.error;
        this.recordCountsError.set(oracleMsg ?? err?.message ?? 'Failed to compare records');
        this.recordCountsLoading.set(false);
      }
    });
  }

  clearRecordCounts(): void {
    this.recordCountsData.set([]);
    this.recordCountsError.set('');
    this.moveSessionId.set('');
    this.moveBackupSuffix.set('');
    this.moveRunning.set(false);
    this.moveError.set('');
    this.moveSteps.set([]);
    this.moveAwaitingConfirm.set(false);
    this.moveCommitting.set(false);
    this.moveCommitted.set(false);
    this.moveRolledBack.set(false);
    this.verificationData.set([]);
  }

  // ─── Move Execution ──────────────────────────────────────────────────────
  async startMove(): Promise<void> {
    const wellId = this.wellIdInput().trim();
    const srcEventId = this.sourceEventId();
    const tgtEventId = this.targetEventId();
    const from = this.fromDate() || undefined;
    const to = this.toDate() || undefined;

    if (!wellId || !srcEventId || !tgtEventId) { return; }

    this.moveRunning.set(true);
    this.moveError.set('');
    this.moveCommitted.set(false);
    this.moveRolledBack.set(false);
    this.moveAwaitingConfirm.set(false);
    this.verificationData.set([]);

    const steps: MoveStep[] = [
      { label: '1. Drop old backup tables', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '2. Create backup tables', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '3. Update backup event IDs', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '4. Delete child records from source', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '5. Update event ID in parent records', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '6. Insert primary children into target', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '7. Insert secondary children into target', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '8. Verify record counts', status: 'pending', results: [], queries: [], error: '', collapsed: true },
    ];
    this.moveSteps.set([...steps]);

    try {
      // Build set of tables with non-zero source counts
      const activeTables = new Set<string>(
        this.recordCountsData()
          .filter(r => r.sourceCount !== 0)
          .map(r => r.tableName)
      );

      // Clean up any orphaned sessions from previous runs (non-fatal)
      try { await this.db.sessionCleanup().toPromise(); } catch (_) {}

      // Begin session
      const beginResult = await this.db.sessionBegin().toPromise();
      if (!beginResult?.sessionId) {
        throw new Error('Failed to begin database session');
      }
      const sid = beginResult.sessionId;
      this.moveSessionId.set(sid);

      const sfx = backupSuffix(wellId, tgtEventId);
      this.moveBackupSuffix.set(sfx);

      const filterByActive = <T extends { tableName: string }>(queries: T[]): T[] =>
        queries.filter(q => activeTables.has(q.tableName));

      // Step 1: Drop old backup tables (ignore "table doesn't exist" errors)
      const dropStmts = filterByActive(dropBackupQueries(sfx)).map(q => ({
        sql: `BEGIN EXECUTE IMMEDIATE '${q.sql.replace(/'/g, "''")}'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;`,
        label: q.tableName
      }));
      await this.runMoveStep(sid, 0, dropStmts);

      // Step 2: Create backup tables
      const bkQueries = filterByActive(backupQueries(wellId, srcEventId, from, to, sfx));
      await this.runMoveStep(sid, 1, bkQueries.map(q => ({ sql: q.sql, label: q.tableName })));

      // Step 3: Update backup event IDs
      const updBkQueries = filterByActive(updateBackupQueries(wellId, srcEventId, tgtEventId, sfx));
      await this.runMoveStep(sid, 2, updBkQueries.map(q => ({ sql: q.sql, label: q.tableName })));

      // Step 4: Delete child records
      const delQueries = filterByActive(deleteQueries(wellId, srcEventId, from, to));
      await this.runMoveStep(sid, 3, delQueries.map(q => ({ sql: q.sql, label: q.tableName })));

      // Step 5: Update event ID in parent records
      const parentQueries = filterByActive(moveParentQueries(wellId, srcEventId, tgtEventId, from, to));
      await this.runMoveStep(sid, 4, parentQueries.map(q => ({ sql: q.sql, label: q.tableName })));

      // Step 6: Insert primary children
      const insQueries = filterByActive(insertFromBackupQueries(sfx));
      await this.runMoveStep(sid, 5, insQueries.map(q => ({ sql: q.sql, label: q.tableName })));

      // Step 7: Insert secondary children
      const insSecQueries = filterByActive(insertSecondaryFromBackupQueries(sfx));
      await this.runMoveStep(sid, 6, insSecQueries.map(q => ({ sql: q.sql, label: q.tableName })));

      // Step 8: Verify (only active tables)
      await this.runVerificationStep(sid, 7, wellId, srcEventId, tgtEventId, from, to, activeTables);

      this.moveAwaitingConfirm.set(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message
        : (err as any)?.error?.error ?? (err as any)?.message ?? 'Move failed';
      this.moveError.set(msg);
      // Mark any running step as error
      const steps = this.moveSteps();
      for (const step of steps) {
        if (step.status === 'running') {
          step.status = 'error';
          if (!step.error) { step.error = msg; }
        }
      }
      this.moveSteps.set([...steps]);
    } finally {
      this.moveRunning.set(false);
    }
  }

  private async runMoveStep(sessionId: string, stepIndex: number, statements: { sql: string; label: string }[]): Promise<void> {
    const steps = this.moveSteps();
    if (!statements.length) {
      steps[stepIndex].status = 'skipped';
      this.moveSteps.set([...steps]);
      return;
    }
    steps[stepIndex].status = 'running';
    steps[stepIndex].queries = statements;
    this.moveSteps.set([...steps]);

    const result = await this.db.sessionExecute(sessionId, statements).toPromise();
    if (!result) {
      throw new Error(`Step ${stepIndex + 1} returned no result`);
    }

    steps[stepIndex].results = result.results;
    const failed = result.results.find(r => !r.success);
    if (failed) {
      steps[stepIndex].status = 'error';
      steps[stepIndex].error = failed.error;
      this.moveSteps.set([...steps]);
      throw new Error(`Step "${steps[stepIndex].label}" failed at ${failed.label}: ${failed.error}`);
    }

    steps[stepIndex].status = 'done';
    this.moveSteps.set([...steps]);
  }

  private async runVerificationStep(
    sessionId: string, stepIndex: number,
    wellId: string, srcEventId: string, tgtEventId: string,
    from?: string, to?: string, activeTables?: Set<string>
  ): Promise<void> {
    const steps = this.moveSteps();
    steps[stepIndex].status = 'running';
    this.moveSteps.set([...steps]);

    const queries = verifyRecordsAfterMove(wellId, srcEventId, tgtEventId, from, to, activeTables);
    steps[stepIndex].queries = queries.map((sql, i) => ({ sql, label: `Batch ${i + 1}` }));
    this.moveSteps.set([...steps]);
    const data: RecordCountRow[] = [];
    for (const sql of queries) {
      const result = await this.db.sessionQuery(sessionId, sql).toPromise();
      if (result) {
        for (const row of result.rows) {
          data.push({
            tableName: String(row['Table_name']),
            sourceCount: Number(row['Old_Event_Count']) || 0,
            targetCount: Number(row['New_Event_Count']) || 0,
            toMove: Number(row['Move_Acount']) || 0,
            toAdd: Number(row['Add_Count']) || 0,
          });
        }
      }
    }
    data.sort((a, b) => a.tableName.localeCompare(b.tableName));
    this.verificationData.set(data);

    steps[stepIndex].status = 'done';
    this.moveSteps.set([...steps]);
  }

  countSuccessful(results: SessionExecuteRow[]): number {
    return results.filter(r => r.success).length;
  }

  toggleStepCollapsed(step: MoveStep): void {
    step.collapsed = !step.collapsed;
    this.moveSteps.set([...this.moveSteps()]);
  }

  async commitMove(): Promise<void> {
    const sid = this.moveSessionId();
    if (!sid) { return; }
    this.moveCommitting.set(true);
    try {
      // Drop only backup tables that were created (non-zero source count)
      const activeTables = new Set<string>(
        this.recordCountsData()
          .filter(r => r.sourceCount !== 0)
          .map(r => r.tableName)
      );
      const filteredDropQueries = dropBackupQueries(this.moveBackupSuffix()).filter(q => activeTables.has(q.tableName));
      await this.db.sessionExecute(sid, filteredDropQueries.map(q => ({ sql: q.sql, label: q.tableName }))).toPromise();

      await this.db.sessionCommit(sid).toPromise();
      this.moveCommitted.set(true);
      this.moveAwaitingConfirm.set(false);
      this.moveSessionId.set('');
      this.wellIdInput.set('');
      this.showWellSearch.set(false);
      this.clearWellSearch();
      this.eventSearchResults.set(null);
      this.eventSearchError.set('');
      this.sourceEventId.set('');
      this.targetEventId.set('');
      this.fromDate.set('');
      this.toDate.set('');
      this.datesTouched.set(false);
      this.recordCountsData.set([]);
      this.recordCountsError.set('');
      this.filterNonZeroSource.set(false);
      this.verificationData.set([]);
      this.moveSteps.set([]);
      this.moveBackupSuffix.set('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Commit failed';
      this.moveError.set(msg);
    } finally {
      this.moveCommitting.set(false);
    }
  }

  async rollbackMove(): Promise<void> {
    const sid = this.moveSessionId();
    if (!sid) { return; }
    this.moveCommitting.set(true);
    try {
      // Drop backup tables (DDL, not affected by rollback)
      const activeTables = new Set<string>(
        this.recordCountsData()
          .filter(r => r.sourceCount !== 0)
          .map(r => r.tableName)
      );
      const filteredDropQueries = dropBackupQueries(this.moveBackupSuffix()).filter(q => activeTables.has(q.tableName));
      const dropStmts = filteredDropQueries.map(q => ({
        sql: `BEGIN EXECUTE IMMEDIATE '${q.sql.replace(/'/g, "''")}'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;`,
        label: q.tableName
      }));
      try { await this.db.sessionExecute(sid, dropStmts).toPromise(); } catch (_) {}

      await this.db.sessionRollback(sid).toPromise();
      this.moveRolledBack.set(true);
      this.moveAwaitingConfirm.set(false);
      this.moveSessionId.set('');
      this.recordCountsData.set([]);
      this.verificationData.set([]);
      this.moveSteps.set([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rollback failed';
      this.moveError.set(msg);
    } finally {
      this.moveCommitting.set(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Move Event Properties — signals & methods
  // ═══════════════════════════════════════════════════════════════════════════
  epWellIdInput = signal('');
  epShowWellSearch = signal(false);
  epWellSearchInput = signal('');
  epWellSearchLoading = signal(false);
  epWellSearchError = signal('');
  epWellSearchResults = signal<QueryResult | null>(null);

  epEventSearchLoading = signal(false);
  epEventSearchError = signal('');
  epEventSearchResults = signal<QueryResult | null>(null);
  epSourceEventId = signal('');
  epTargetEventId = signal('');

  epRecordCountsLoading = signal(false);
  epRecordCountsError = signal('');
  epRecordCountsData = signal<RecordCountRow[]>([]);
  epFilterNonZeroSource = signal(false);
  epRecordCountsCollapsed = signal(false);
  epFilteredRecordCountsData = computed(() => {
    const data = this.epRecordCountsData();
    if (!this.epFilterNonZeroSource()) {
      return data;
    }
    return data.filter(r => r.sourceCount !== 0);
  });

  epClearWellId(): void {
    this.epWellIdInput.set('');
    this.epShowWellSearch.set(false);
    this.epClearWellSearch();
    this.epClearEventSearch();
  }

  epRunWellSearch(): void {
    const apiNo = this.epWellSearchInput().trim();
    if (!apiNo) { return; }
    this.epWellSearchLoading.set(true);
    this.epWellSearchError.set('');
    this.epWellSearchResults.set(null);
    const sql = apiLookWellId(apiNo);
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.epWellSearchResults.set(result); this.epWellSearchLoading.set(false); },
      error: (err) => { this.epWellSearchError.set(err?.message ?? 'Search failed'); this.epWellSearchLoading.set(false); }
    });
  }

  epClearWellSearch(): void {
    this.epWellSearchInput.set('');
    this.epWellSearchResults.set(null);
    this.epWellSearchError.set('');
  }

  epSelectWellFromResult(row: Record<string, unknown>): void {
    const id = String(row['WELL_ID'] ?? row['well_id'] ?? '');
    if (id) {
      this.epWellIdInput.set(id);
      this.epWellSearchInput.set('');
      this.epWellSearchResults.set(null);
      this.epShowWellSearch.set(false);
    }
  }

  epRunEventSearch(): void {
    const wellId = this.epWellIdInput().trim();
    if (!wellId) { return; }
    this.epEventSearchLoading.set(true);
    this.epEventSearchError.set('');
    this.epEventSearchResults.set(null);
    this.epSourceEventId.set('');
    this.epTargetEventId.set('');
    const sql = `SELECT event_id "event_id", event_code "event_code", event_type "Event Name", event_objective_1 "Prim. Reason", TO_CHAR(date_ops_start, 'MM/DD/YYYY') "Start date", TO_CHAR(date_ops_end, 'MM/DD/YYYY') "End date" FROM dm_event WHERE well_id = '${wellId}' ORDER BY date_ops_start ASC`;
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.epEventSearchResults.set(result); this.epEventSearchLoading.set(false); },
      error: (err) => { this.epEventSearchError.set(err?.message ?? 'Event search failed'); this.epEventSearchLoading.set(false); }
    });
  }

  epClearEventSearch(): void {
    this.epEventSearchResults.set(null);
    this.epEventSearchError.set('');
    this.epSourceEventId.set('');
    this.epTargetEventId.set('');
    this.epClearRecordCounts();
  }

  epSelectSourceEvent(eventId: string): void {
    this.epSourceEventId.set(eventId);
    if (this.epTargetEventId() === eventId) {
      this.epTargetEventId.set('');
    }
    this.epClearRecordCounts();
  }

  epSelectTargetEvent(eventId: string): void {
    this.epTargetEventId.set(eventId);
    this.epClearRecordCounts();
  }

  epClearEventSelections(): void {
    this.epSourceEventId.set('');
    this.epTargetEventId.set('');
    this.epClearRecordCounts();
  }

  epGetEventRow(eventId: string): Record<string, unknown> | undefined {
    const results = this.epEventSearchResults();
    if (!results) { return undefined; }
    return results.rows.find(row => '' + row['event_id'] === eventId);
  }

  epRunRecordCounts(): void {
    const wellId = this.epWellIdInput().trim();
    const srcEventId = this.epSourceEventId();
    const tgtEventId = this.epTargetEventId();
    if (!wellId || !srcEventId || !tgtEventId) { return; }

    this.epRecordCountsLoading.set(true);
    this.epRecordCountsError.set('');
    this.epRecordCountsData.set([]);

    const sql = compareEventProperties(wellId, srcEventId, tgtEventId);
    this.db.executeQuery(sql).subscribe({
      next: (result) => {
        const data: RecordCountRow[] = result.rows.map(row => ({
          tableName: String(row['Table_name']),
          sourceCount: Number(row['Old_Event_Count']) || 0,
          targetCount: Number(row['New_Event_Count']) || 0,
          toMove: 0,
          toAdd: 0,
        }));
        data.sort((a, b) => a.tableName.localeCompare(b.tableName));
        this.epRecordCountsData.set(data);
        this.epRecordCountsLoading.set(false);
      },
      error: (err) => {
        this.epRecordCountsError.set(err?.error?.error ?? err?.message ?? 'Failed to compare records');
        this.epRecordCountsLoading.set(false);
      }
    });
  }

  epClearRecordCounts(): void {
    this.epRecordCountsData.set([]);
    this.epRecordCountsError.set('');
  }

  // ─── EP Move Execution ─────────────────────────────────────────────────────
  epMoveRunning = signal(false);
  epMoveError = signal('');
  epMoveSessionId = signal('');
  epMoveSteps = signal<MoveStep[]>([]);
  epMoveAwaitingConfirm = signal(false);
  epMoveCommitting = signal(false);
  epMoveCommitted = signal(false);
  epMoveRolledBack = signal(false);
  epVerificationData = signal<RecordCountRow[]>([]);
  epMergedVerificationData = computed(() => {
    const before = this.epRecordCountsData().filter(r => r.sourceCount !== 0);
    return this.epVerificationData()
      .filter(row => before.some(b => b.tableName === row.tableName))
      .map(row => {
        const prev = before.find(b => b.tableName === row.tableName);
        return {
          tableName: row.tableName,
          sourceBefore: prev?.sourceCount ?? 0,
          sourceAfter: row.sourceCount,
          targetBefore: prev?.targetCount ?? 0,
          targetAfter: row.targetCount,
        };
      });
  });

  async epStartMove(): Promise<void> {
    const wellId = this.epWellIdInput().trim();
    const srcEventId = this.epSourceEventId();
    const tgtEventId = this.epTargetEventId();
    if (!wellId || !srcEventId || !tgtEventId) { return; }

    this.epMoveRunning.set(true);
    this.epMoveError.set('');
    this.epMoveCommitted.set(false);
    this.epMoveRolledBack.set(false);
    this.epMoveAwaitingConfirm.set(false);
    this.epVerificationData.set([]);

    const steps: MoveStep[] = [
      { label: '1. Update event properties', status: 'pending', results: [], queries: [], error: '', collapsed: true },
      { label: '2. Verify record counts', status: 'pending', results: [], queries: [], error: '', collapsed: true },
    ];
    this.epMoveSteps.set([...steps]);

    try {
      const activeTables = new Set<string>(
        this.epRecordCountsData()
          .filter(r => r.sourceCount !== 0)
          .map(r => r.tableName)
      );

      try { await this.db.sessionCleanup().toPromise(); } catch (_) {}

      const beginResult = await this.db.sessionBegin().toPromise();
      if (!beginResult?.sessionId) {
        throw new Error('Failed to begin database session');
      }
      const sid = beginResult.sessionId;
      this.epMoveSessionId.set(sid);

      // Step 1: Update event properties
      const updateStmts = moveEventPropertiesQueries(wellId, srcEventId, tgtEventId)
        .filter(q => activeTables.has(q.tableName));
      await this.epRunMoveStep(sid, 0, updateStmts.map(q => ({ sql: q.sql, label: q.tableName })));

      // Step 2: Verify
      await this.epRunVerificationStep(sid, 1, wellId, srcEventId, tgtEventId, activeTables);

      this.epMoveAwaitingConfirm.set(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message
        : (err as any)?.error?.error ?? (err as any)?.message ?? 'Move failed';
      this.epMoveError.set(msg);
      const steps = this.epMoveSteps();
      for (const step of steps) {
        if (step.status === 'running') {
          step.status = 'error';
          if (!step.error) { step.error = msg; }
        }
      }
      this.epMoveSteps.set([...steps]);
    } finally {
      this.epMoveRunning.set(false);
    }
  }

  private async epRunMoveStep(sessionId: string, stepIndex: number, statements: { sql: string; label: string }[]): Promise<void> {
    const steps = this.epMoveSteps();
    if (!statements.length) {
      steps[stepIndex].status = 'skipped';
      this.epMoveSteps.set([...steps]);
      return;
    }
    steps[stepIndex].status = 'running';
    steps[stepIndex].queries = statements;
    this.epMoveSteps.set([...steps]);

    const result = await this.db.sessionExecute(sessionId, statements).toPromise();
    if (!result) {
      throw new Error(`Step ${stepIndex + 1} returned no result`);
    }

    steps[stepIndex].results = result.results;
    const failed = result.results.find(r => !r.success);
    if (failed) {
      steps[stepIndex].status = 'error';
      steps[stepIndex].error = failed.error;
      this.epMoveSteps.set([...steps]);
      throw new Error(`Step "${steps[stepIndex].label}" failed at ${failed.label}: ${failed.error}`);
    }

    steps[stepIndex].status = 'done';
    this.epMoveSteps.set([...steps]);
  }

  private async epRunVerificationStep(
    sessionId: string, stepIndex: number,
    wellId: string, srcEventId: string, tgtEventId: string,
    activeTables: Set<string>
  ): Promise<void> {
    const steps = this.epMoveSteps();
    steps[stepIndex].status = 'running';
    this.epMoveSteps.set([...steps]);

    const sql = verifyEventProperties(wellId, srcEventId, tgtEventId, activeTables);
    steps[stepIndex].queries = [{ sql, label: 'Verify counts' }];
    this.epMoveSteps.set([...steps]);

    const result = await this.db.sessionQuery(sessionId, sql).toPromise();
    const data: RecordCountRow[] = [];
    if (result) {
      for (const row of result.rows) {
        const tableName = String(row['Table_name']);
        if (activeTables.has(tableName)) {
          data.push({
            tableName,
            sourceCount: Number(row['Old_Event_Count']) || 0,
            targetCount: Number(row['New_Event_Count']) || 0,
            toMove: 0,
            toAdd: 0,
          });
        }
      }
    }
    data.sort((a, b) => a.tableName.localeCompare(b.tableName));
    this.epVerificationData.set(data);

    steps[stepIndex].status = 'done';
    this.epMoveSteps.set([...steps]);
  }

  epCountSuccessful(results: SessionExecuteRow[]): number {
    return results.filter(r => r.success).length;
  }

  epToggleStepCollapsed(step: MoveStep): void {
    step.collapsed = !step.collapsed;
    this.epMoveSteps.set([...this.epMoveSteps()]);
  }

  async epCommitMove(): Promise<void> {
    const sid = this.epMoveSessionId();
    if (!sid) { return; }
    this.epMoveCommitting.set(true);
    try {
      await this.db.sessionCommit(sid).toPromise();
      this.epMoveCommitted.set(true);
      this.epMoveAwaitingConfirm.set(false);
      this.epMoveSessionId.set('');
      this.epWellIdInput.set('');
      this.epShowWellSearch.set(false);
      this.epClearWellSearch();
      this.epEventSearchResults.set(null);
      this.epEventSearchError.set('');
      this.epSourceEventId.set('');
      this.epTargetEventId.set('');
      this.epRecordCountsData.set([]);
      this.epRecordCountsError.set('');
      this.epFilterNonZeroSource.set(false);
      this.epVerificationData.set([]);
      this.epMoveSteps.set([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Commit failed';
      this.epMoveError.set(msg);
    } finally {
      this.epMoveCommitting.set(false);
    }
  }

  async epRollbackMove(): Promise<void> {
    const sid = this.epMoveSessionId();
    if (!sid) { return; }
    this.epMoveCommitting.set(true);
    try {
      await this.db.sessionRollback(sid).toPromise();
      this.epMoveRolledBack.set(true);
      this.epMoveAwaitingConfirm.set(false);
      this.epMoveSessionId.set('');
      this.epRecordCountsData.set([]);
      this.epVerificationData.set([]);
      this.epMoveSteps.set([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rollback failed';
      this.epMoveError.set(msg);
    } finally {
      this.epMoveCommitting.set(false);
    }
  }
}
