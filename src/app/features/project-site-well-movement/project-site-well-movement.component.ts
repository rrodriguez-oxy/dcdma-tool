import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  selectFull, selectSiteInfo,
  updateWellSite,
  updateCdAttachmentJournal,
  updateCdChangeHistoryParentLocator,
  updateCdChangeHistoryItemLocator,
  updateCdPolylineHeader,
  updateCdSurveyProgram,
  updateCdSurveyHeader,
  updateCdSurveyStation,
  updateCdVerticalSection,
  updateWellUserDefined1,
  insertDpProjectTargetWell,
  insertDpProjectTargetPointWell,
  updateCdProjTargWellLinkWell,
  insertDpProjectTargetWellbore,
  insertDpProjectTargetPointWellbore,
  updateCdProjectTargetWbLinkWellbore,
  insertDpProjectTargetScenarioDesign,
  insertDpProjectTargetPointScenarioDesign,
  updateCdProjTargScenarioLinkDesign,
  insertWellMoveAudit
} from './move-wells-queries';
import {
  searchSiteId as msSearchSiteId,
  searchProjectId as msSearchProjectId,
  selectProjectInfo as msSelectProjectInfo,
  selectFullSite as msSelectFullSite,
  updateCdSite as msUpdateCdSite,
  insertCdWellStatus as msInsertCdWellStatus,
  updateCdAttachmentJournal as msUpdateCdAttachmentJournal,
  updateCdChangeHistoryParentLocator as msUpdateCdChangeHistoryParentLocator,
  updateCdChangeHistoryItemLocator as msUpdateCdChangeHistoryItemLocator,
  updateCdPolylineHeader as msUpdateCdPolylineHeader,
  updateCdSurveyProgram as msUpdateCdSurveyProgram,
  updateCdSurveyHeader as msUpdateCdSurveyHeader,
  updateCdSurveyStation as msUpdateCdSurveyStation,
  updateCdVerticalSection as msUpdateCdVerticalSection,
  insertDpProjectTargetSite as msInsertDpProjectTargetSite,
  insertDpProjectTargetPointSite as msInsertDpProjectTargetPointSite,
  updateCdProjectTargetSiteLink as msUpdateCdProjectTargetSiteLink,
  insertDpProjectTargetWell as msInsertDpProjectTargetWell,
  insertDpProjectTargetPointWell as msInsertDpProjectTargetPointWell,
  updateCdProjTargWellLink as msUpdateCdProjTargWellLink,
  insertDpProjectTargetWellbore as msInsertDpProjectTargetWellbore,
  insertDpProjectTargetPointWellbore as msInsertDpProjectTargetPointWellbore,
  updateCdProjectTargetWbLink as msUpdateCdProjectTargetWbLink,
  insertDpProjectTargetScenario as msInsertDpProjectTargetScenario,
  insertDpProjectTargetPointScenario as msInsertDpProjectTargetPointScenario,
  updateCdProjTargScenarioLink as msUpdateCdProjTargScenarioLink,
  insertSiteMoveAudit,
  SiteAuditSqlGroups
} from './move-sites-queries';
import {
  searchPolicyId as mpSearchPolicyId,
  searchProjectId as mpSearchProjectId,
  selectFullProject as mpSelectFullProject,
  updateCdProject as mpUpdateCdProject,
  insertCdWellStatus as mpInsertCdWellStatus,
  updateCdAttachmentJournal as mpUpdateCdAttachmentJournal,
  updateCdChangeHistoryParentLocator as mpUpdateCdChangeHistoryParentLocator,
  updateCdChangeHistoryItemLocator as mpUpdateCdChangeHistoryItemLocator,
  updateCdPolylineHeader as mpUpdateCdPolylineHeader,
  updateCdSurveyProgram as mpUpdateCdSurveyProgram,
  updateCdSurveyHeader as mpUpdateCdSurveyHeader,
  insertProjectMoveAudit
} from './move-projects-queries';
import { apiLookWellId } from './queries/api-look-well-id';
import { DatabaseService, QueryResult, TransactionResultRow } from '../../services/database.service';
import { forkJoin } from 'rxjs';

interface ExecuteResultRow {
  wellId: string;
  label: string;
  success: boolean;
  error: string;
  sql: string;
}

interface MovementOption {
  id: string;
  title: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-project-site-well-movement',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Project Site Well Movement</h1>
        <a routerLink="/" class="back-link">← Back to Home</a>
      </header>
      
      <main class="page-content">
        <div class="content-card">
          @if (selectedOption()) {
            <div class="selected-header">
              <div class="selected-badge">
                <div class="badge-icon" [innerHTML]="getSelectedOptionIcon()"></div>
                <div class="badge-info">
                  <span class="badge-label">Selected Option:</span>
                  <h3 class="badge-title">{{ getSelectedOptionTitle() }}</h3>
                </div>
              </div>
              <button class="btn-change" (click)="clearSelection()">Change Selection</button>
            </div>
            
            <div class="selection-content">
              <p class="selection-description">{{ getSelectedOptionDescription() }}</p>

              @if (selectedOption() === 'move-wells') {
                <div class="action-buttons action-buttons-row">
                  <button
                    class="btn"
                    [class.btn-dark]="moveWellsMode() === 'multiple'"
                    [class.btn-light]="moveWellsMode() !== 'multiple'"
                    (click)="moveWellsMode.set('multiple')">
                    Move Multiple Wells to one site
                  </button>
                  <button
                    class="btn"
                    [class.btn-dark]="moveWellsMode() === 'single'"
                    [class.btn-light]="moveWellsMode() !== 'single'"
                    (click)="moveWellsMode.set('single')">
                    Move One Well to one site
                  </button>
                </div>

                @if (moveWellsMode() === 'multiple') {
                  <div class="panel">
                    <h3 class="panel-title">List of Well IDs</h3>
                    <div class="inline-form">
                      <label class="inline-label" for="wellEntry">Well ID:</label>
                      <input
                        id="wellEntry"
                        type="text"
                        class="form-input inline-input"
                        placeholder="Enter Well ID (e.g., UkS4La4tcJ)"
                        [ngModel]="wellEntryInput()"
                        (ngModelChange)="wellEntryInput.set($event)"
                        (keydown.enter)="addWellEntry()"
                      />
                      <button class="btn btn-add" [disabled]="!wellEntryInput().trim()" (click)="addWellEntry()">Add Entry</button>
                      <button class="btn btn-clear" [disabled]="!wellIdList().length" (click)="wellIdList.set([]); wellEntryInput.set('')">Clear List</button>
                    </div>
                    <p class="hint">&rarr; You can add multiple Well IDs. They will all be linked to the Target Site ID below.</p>

                    @if (wellIdList().length) {
                      <div class="well-list">
                        @for (entry of wellIdList(); track entry; let i = $index) {
                          <span class="well-chip">
                            {{ entry }}
                            <button class="chip-remove" (click)="removeWellEntry(i)">&times;</button>
                          </span>
                        }
                      </div>
                    }

                    <button class="btn btn-outline btn-sm" (click)="showSearch.set(!showSearch())">
                      <span class="chevron" [class.open]="showSearch()">&#9654;</span>
                      {{ showSearch() ? 'Hide' : 'Show' }} Well Search
                    </button>
                    @if (showSearch()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="wellId">API No / Well Common Name</label>
                            <input
                              id="wellId"
                              type="text"
                              class="form-input"
                              placeholder="Enter API No (e.g., 1234567890%) or Well Common Name"
                              [ngModel]="wellIdInput()"
                              (ngModelChange)="wellIdInput.set($event)"
                              (keydown.enter)="runSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!wellIdInput().trim() || queryLoading()"
                              (click)="runSearch()">
                              @if (queryLoading()) {
                                Loading...
                              } @else {
                                <span class="search-icon">&#128269;</span> Search
                              }
                            </button>
                            @if (generatedQuery()) {
                              <button class="btn btn-secondary" (click)="clearSearch()">Clear</button>
                            }
                          </div>
                        </div>

                        @if (queryError()) {
                          <div class="query-error">&#9888; {{ queryError() }}</div>
                        }

                        @if (queryResults(); as results) {
                          <div class="query-results-section">
                            <h4 class="results-title">Results ({{ results.rows.length }} row{{ results.rows.length !== 1 ? 's' : '' }})</h4>
                            @if (results.rows.length) {
                              <div class="results-table-wrap">
                                <table class="results-table">
                                  <thead>
                                    <tr>
                                      @for (col of results.columns; track col) {
                                        <th>{{ col }}</th>
                                      }
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    @for (row of results.rows; track $index) {
                                      <tr>
                                        @for (col of results.columns; track col) {
                                          <td>{{ row[col] }}</td>
                                        }
                                        <td>
                                          @if (isWellInList(row)) {
                                            <button class="btn-add-row" disabled>Selected</button>
                                          } @else {
                                            <button class="btn-add-row" (click)="addResultToList(row)">+ Add</button>
                                          }
                                        </td>
                                      </tr>
                                    }
                                  </tbody>
                                </table>
                              </div>
                            } @else {
                              <p class="hint">No results found.</p>
                            }
                          </div>
                        }


                      </div>
                    }
                  </div>

                  <div class="panel">
                    <h3 class="panel-title">Target Site ID</h3>
                    @if (targetSiteId()) {
                      <div class="selected-site">
                        <span class="well-chip site-chip">
                          {{ targetSiteId() }}
                          <button class="chip-remove" (click)="removeTargetSite()">&times;</button>
                        </span>
                      </div>
                      <p class="hint">&rarr; The Target Site ID applies to all the Well IDs you entered. Remove it to select a different one.</p>
                    } @else {
                      <div class="inline-form">
                        <label class="inline-label" for="targetSite">Target Site ID:</label>
                        <input
                          id="targetSite"
                          type="text"
                          class="form-input inline-input"
                          placeholder="Enter Target Site ID"
                          [ngModel]="targetSiteInput()"
                          (ngModelChange)="targetSiteInput.set($event)"
                        />
                        <button class="btn btn-update" [disabled]="!targetSiteInput().trim()" (click)="setTargetSiteId()">Set Target Site ID</button>
                      </div>
                      <p class="hint">&rarr; The Target Site ID applies to all the Well IDs you entered.</p>
                    }

                    <button class="btn btn-outline btn-sm" (click)="showSearchSite.set(!showSearchSite())">
                      <span class="chevron" [class.open]="showSearchSite()">&#9654;</span>
                      {{ showSearchSite() ? 'Hide' : 'Show' }} Search Site
                    </button>
                    @if (showSearchSite()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="siteIdSearch">Target Site Name</label>
                            <input
                              id="siteIdSearch"
                              type="text"
                              class="form-input"
                              placeholder="Enter Target Site Name (use % as wildcard)"
                              [ngModel]="siteIdInput()"
                              (ngModelChange)="siteIdInput.set($event)"
                              (keydown.enter)="runSiteSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!siteIdInput().trim() || siteQueryLoading()"
                              (click)="runSiteSearch()">
                              @if (siteQueryLoading()) {
                                Loading...
                              } @else {
                                <span class="search-icon">&#128269;</span> Search
                              }
                            </button>
                            @if (generatedSiteQuery()) {
                              <button class="btn btn-secondary" (click)="clearSiteSearch()">Clear</button>
                            }
                          </div>
                        </div>

                        @if (siteQueryError()) {
                          <div class="query-error">&#9888; {{ siteQueryError() }}</div>
                        }

                        @if (siteQueryResults(); as results) {
                          <div class="query-results-section">
                            <h4 class="results-title">Results ({{ results.rows.length }} row{{ results.rows.length !== 1 ? 's' : '' }})</h4>
                            @if (results.rows.length) {
                              <div class="results-table-wrap">
                                <table class="results-table">
                                  <thead>
                                    <tr>
                                      @for (col of results.columns; track col) {
                                        <th>{{ col }}</th>
                                      }
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    @for (row of results.rows; track $index) {
                                      <tr>
                                        @for (col of results.columns; track col) {
                                          <td>{{ row[col] }}</td>
                                        }
                                        <td>
                                          <button
                                            class="btn-add-row"
                                            [disabled]="!!targetSiteId()"
                                            (click)="selectSiteFromResult(row)">
                                            {{ targetSiteId() ? 'Selected' : '+ Select' }}
                                          </button>
                                        </td>
                                      </tr>
                                    }
                                  </tbody>
                                </table>
                              </div>
                            } @else {
                              <p class="hint">No results found.</p>
                            }
                          </div>
                        }


                      </div>
                    }
                  </div>

                  @if (wellIdList().length) {
                    <div class="panel">
                      <h3 class="panel-title">Movement Summary</h3>
                      <div class="summary-table-wrapper">
                        <table class="summary-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Well ID</th>
                              <th>Site ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (well of wellIdList(); track well; let i = $index) {
                              <tr>
                                <td>{{ i + 1 }}</td>
                                <td>{{ well }}</td>
                                <td>{{ getWellSiteId(well) || '—' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>

                      <div class="action-buttons action-buttons-row" style="margin-top:1.25rem">
                        <button
                          class="btn btn-primary"
                          [disabled]="!wellIdList().length || !targetSiteId() || previewLoading()"
                          (click)="runPreviewQuery()">
                          @if (previewLoading()) {
                            Loading...
                          } @else {
                            &#128269; Preview Query
                          }
                        </button>
                        <button
                          class="btn btn-dark"
                          [disabled]="!previewResults().length || executeLoading()"
                          (click)="runExecuteMovement()">
                          @if (executeLoading()) {
                            Executing...
                          } @else {
                            &#9654; Execute Movement
                          }
                        </button>
                      </div>

                      @if (previewError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ previewError() }}</div>
                      }

                      @if (previewResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Preview Results ({{ previewResults().length }} row{{ previewResults().length !== 1 ? 's' : '' }})</h4>
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead>
                                <tr>
                                  @for (col of previewColumns(); track col) {
                                    <th>{{ col }}</th>
                                  }
                                </tr>
                              </thead>
                              <tbody>
                                @for (row of previewResults(); track $index) {
                                  <tr>
                                    @for (col of previewColumns(); track col) {
                                      <td>{{ row[col] }}</td>
                                    }
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      }

                      @if (executeError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ executeError() }}</div>
                      }

                      @if (executeResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Execution Results</h4>
                          @for (group of groupedExecuteResults(); track group.wellId) {
                            <div class="exec-accordion">
                              <div class="exec-accordion-header" (click)="toggleExecuteWell(group.wellId)">
                                <span class="chevron" [class.open]="isExecuteWellExpanded(group.wellId)">&#9654;</span>
                                <span class="exec-well-id">{{ group.wellId }}</span>
                                <span class="exec-step-count">{{ group.rows.length }} steps</span>
                                @if (group.allSuccess) {
                                  <span class="exec-badge exec-badge-ok">&#10003; All OK</span>
                                } @else {
                                  <span class="exec-badge exec-badge-fail">&#10007; Rolled Back</span>
                                }
                              </div>
                              @if (isExecuteWellExpanded(group.wellId)) {
                                <div class="exec-accordion-body">
                                  <div class="results-table-wrap">
                                    <table class="results-table">
                                      <thead>
                                        <tr>
                                          <th>Step</th>
                                          <th>Query</th>
                                          <th>Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        @for (row of group.rows; track $index) {
                                          <tr [class.row-fail]="!row.success">
                                            <td>{{ $index + 1 }}</td>
                                            <td>{{ row.label }}</td>
                                            <td [style.color]="row.success ? '#16a34a' : '#dc2626'">{{ row.success ? '✓ OK' : '✗ ' + row.error }}</td>
                                          </tr>
                                          @if (!row.success && row.sql) {
                                            <tr class="row-fail-sql">
                                              <td colspan="3">
                                                <pre class="fail-sql-code">{{ row.sql }}</pre>
                                              </td>
                                            </tr>
                                          }
                                        }
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                }

                @if (moveWellsMode() === 'single') {
                  <div class="panel">
                    <h3 class="panel-title">Add Well &rarr; Site Pair</h3>
                    <div class="inline-form">
                      <label class="inline-label" for="singleWellId">Well ID:</label>
                      <input
                        id="singleWellId"
                        type="text"
                        class="form-input inline-input"
                        placeholder="Enter Well ID"
                        [ngModel]="singleWellId()"
                        (ngModelChange)="singleWellId.set($event)"
                      />
                      <label class="inline-label" for="singleSiteId">Site ID:</label>
                      <input
                        id="singleSiteId"
                        type="text"
                        class="form-input inline-input"
                        placeholder="Enter Target Site ID"
                        [ngModel]="singleSiteId()"
                        (ngModelChange)="singleSiteId.set($event)"
                        (keydown.enter)="addSinglePair()"
                      />
                      <button class="btn btn-add" [disabled]="!singleWellId().trim() || !singleSiteId().trim()" (click)="addSinglePair()">Add Pair</button>
                      <button class="btn btn-clear" (click)="clearSingleAll()">Clear All</button>
                    </div>
                    <p class="hint">&rarr; Each pair maps one Well ID to one Site ID. Add as many pairs as needed.</p>

                    <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap">
                      <button class="btn btn-outline btn-sm" (click)="toggleSingleWellSearch()">
                        <span class="chevron" [class.open]="showSingleWellSearch()">&#9654;</span>
                        {{ showSingleWellSearch() ? 'Hide' : 'Show' }} Well Search
                      </button>
                      <button class="btn btn-outline btn-sm" (click)="toggleSingleSiteSearch()">
                        <span class="chevron" [class.open]="showSingleSiteSearch()">&#9654;</span>
                        {{ showSingleSiteSearch() ? 'Hide' : 'Show' }} Site Search
                      </button>
                    </div>

                    @if (showSingleWellSearch()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="singleWellSearch">API No / Well Common Name</label>
                            <input
                              id="singleWellSearch"
                              type="text"
                              class="form-input"
                              placeholder="Enter API No (e.g., 1234567890) or Well Common Name (use % as wildcard)"
                              [ngModel]="singleWellSearchInput()"
                              (ngModelChange)="singleWellSearchInput.set($event)"
                              (keydown.enter)="runSingleWellSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!singleWellSearchInput().trim() || singleWellSearchLoading()"
                              (click)="runSingleWellSearch()">
                              @if (singleWellSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                            </button>
                            @if (singleWellSearchResults()) {
                              <button class="btn btn-secondary" (click)="clearSingleWellSearch()">Clear</button>
                            }
                          </div>
                        </div>
                        @if (singleWellSearchError()) { <div class="query-error">&#9888; {{ singleWellSearchError() }}</div> }
                        @if (singleWellSearchResults(); as results) {
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
                                        <td><button class="btn-add-row" (click)="selectSingleWellFromResult(row)">+ Select</button></td>
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

                    @if (showSingleSiteSearch()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="singleSiteSearch">Target Site Name</label>
                            <input
                              id="singleSiteSearch"
                              type="text"
                              class="form-input"
                              placeholder="Enter target Site Name (use % as wildcard)"
                              [ngModel]="singleSiteSearchInput()"
                              (ngModelChange)="singleSiteSearchInput.set($event)"
                              (keydown.enter)="runSingleSiteSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!singleSiteSearchInput().trim() || singleSiteSearchLoading()"
                              (click)="runSingleSiteSearch()">
                              @if (singleSiteSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                            </button>
                            @if (singleSiteSearchResults()) {
                              <button class="btn btn-secondary" (click)="clearSingleSiteSearch()">Clear</button>
                            }
                          </div>
                        </div>
                        @if (singleSiteSearchError()) { <div class="query-error">&#9888; {{ singleSiteSearchError() }}</div> }
                        @if (singleSiteSearchResults(); as results) {
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
                                        <td><button class="btn-add-row" (click)="selectSingleSiteFromResult(row)">+ Select</button></td>
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

                  @if (singlePairList().length) {
                    <div class="panel">
                      <h3 class="panel-title">Movement Pairs</h3>
                      <div class="summary-table-wrapper">
                        <table class="summary-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Well ID</th>
                              <th>Target Site ID</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (pair of singlePairList(); track $index; let i = $index) {
                              <tr>
                                <td>{{ i + 1 }}</td>
                                <td>{{ pair.wellId }}</td>
                                <td>{{ pair.siteId }}</td>
                                <td><button class="chip-remove" (click)="removeSinglePair(i)">&times;</button></td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>

                      <div class="action-buttons action-buttons-row" style="margin-top:1.25rem">
                        <button
                          class="btn btn-primary"
                          [disabled]="!singlePairList().length || singlePreviewLoading()"
                          (click)="runSinglePreviewQuery()">
                          @if (singlePreviewLoading()) { Loading... } @else { &#128269; Preview Query }
                        </button>
                        <button
                          class="btn btn-dark"
                          [disabled]="!singlePreviewResults().length || singleExecuteLoading()"
                          (click)="runSingleExecuteMovement()">
                          @if (singleExecuteLoading()) { Executing... } @else { &#9654; Execute Movement }
                        </button>
                      </div>

                      @if (singlePreviewError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ singlePreviewError() }}</div>
                      }

                      @if (singlePreviewResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Preview Results ({{ singlePreviewResults().length }} row{{ singlePreviewResults().length !== 1 ? 's' : '' }})</h4>
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead><tr>@for (col of singlePreviewColumns(); track col) { <th>{{ col }}</th> }</tr></thead>
                              <tbody>
                                @for (row of singlePreviewResults(); track $index) {
                                  <tr>@for (col of singlePreviewColumns(); track col) { <td>{{ row[col] }}</td> }</tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      }

                      @if (singleExecuteError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ singleExecuteError() }}</div>
                      }

                      @if (singleExecuteResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Execution Results</h4>
                          @for (group of groupedSingleExecuteResults(); track group.wellId) {
                            <div class="exec-accordion">
                              <div class="exec-accordion-header" (click)="toggleSingleExecuteWell(group.wellId)">
                                <span class="chevron" [class.open]="isSingleExecuteWellExpanded(group.wellId)">&#9654;</span>
                                <span class="exec-well-id">{{ group.wellId }}</span>
                                <span class="exec-step-count">{{ group.rows.length }} steps</span>
                                @if (group.allSuccess) {
                                  <span class="exec-badge exec-badge-ok">&#10003; All OK</span>
                                } @else {
                                  <span class="exec-badge exec-badge-fail">&#10007; Rolled Back</span>
                                }
                              </div>
                              @if (isSingleExecuteWellExpanded(group.wellId)) {
                                <div class="exec-accordion-body">
                                  <div class="results-table-wrap">
                                    <table class="results-table">
                                      <thead><tr><th>Step</th><th>Query</th><th>Status</th></tr></thead>
                                      <tbody>
                                        @for (row of group.rows; track $index) {
                                          <tr [class.row-fail]="!row.success">
                                            <td>{{ $index + 1 }}</td>
                                            <td>{{ row.label }}</td>
                                            <td [style.color]="row.success ? '#16a34a' : '#dc2626'">{{ row.success ? '✓ OK' : '✗ ' + row.error }}</td>
                                          </tr>
                                          @if (!row.success && row.sql) {
                                            <tr class="row-fail-sql"><td colspan="3"><pre class="fail-sql-code">{{ row.sql }}</pre></td></tr>
                                          }
                                        }
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                }
              } @else if (selectedOption() === 'move-projects') {
                <div class="action-buttons action-buttons-row">
                  <button
                    class="btn"
                    [class.btn-dark]="moveProjectsMode() === 'multiple'"
                    [class.btn-light]="moveProjectsMode() !== 'multiple'"
                    (click)="moveProjectsMode.set('multiple')">
                    Move Multiple Projects to one Business Unit
                  </button>
                  <button
                    class="btn"
                    [class.btn-dark]="moveProjectsMode() === 'single'"
                    [class.btn-light]="moveProjectsMode() !== 'single'"
                    (click)="moveProjectsMode.set('single')">
                    Move One Project to one Business Unit
                  </button>
                </div>

                @if (moveProjectsMode() === 'multiple') {
                  <div class="panel">
                    <h3 class="panel-title">List of Project IDs</h3>
                    <div class="inline-form">
                      <label class="inline-label" for="mpProjectEntry">Project ID:</label>
                      <input
                        id="mpProjectEntry"
                        type="text"
                        class="form-input inline-input"
                        placeholder="Enter Project ID"
                        [ngModel]="mpProjectEntryInput()"
                        (ngModelChange)="mpProjectEntryInput.set($event)"
                        (keydown.enter)="addMpProjectEntry()"
                      />
                      <button class="btn btn-add" [disabled]="!mpProjectEntryInput().trim()" (click)="addMpProjectEntry()">Add Entry</button>
                      <button class="btn btn-clear" [disabled]="!mpProjectIdList().length" (click)="clearMpMultiAll()">Clear List</button>
                    </div>
                    <p class="hint">&rarr; You can add multiple Project IDs. They will all be moved to the Target Business Unit below.</p>

                    @if (mpProjectIdList().length) {
                      <div class="well-list">
                        @for (entry of mpProjectIdList(); track entry; let i = $index) {
                          <span class="well-chip">
                            {{ entry }}
                            <button class="chip-remove" (click)="removeMpProjectEntry(i)">&times;</button>
                          </span>
                        }
                      </div>
                    }

                    <button class="btn btn-outline btn-sm" (click)="toggleMpProjectListSearch()">
                      <span class="chevron" [class.open]="mpShowProjectListSearch()">&#9654;</span>
                      {{ mpShowProjectListSearch() ? 'Hide' : 'Show' }} Project Search
                    </button>
                    @if (mpShowProjectListSearch()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="mpProjectListSearch">Project ID / Name</label>
                            <input
                              id="mpProjectListSearch"
                              type="text"
                              class="form-input"
                              placeholder="Enter Project ID or Name (use % as wildcard)"
                              [ngModel]="mpProjectListSearchInput()"
                              (ngModelChange)="mpProjectListSearchInput.set($event)"
                              (keydown.enter)="runMpProjectListSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!mpProjectListSearchInput().trim() || mpProjectListSearchLoading()"
                              (click)="runMpProjectListSearch()">
                              @if (mpProjectListSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                            </button>
                            @if (mpProjectListSearchResults()) {
                              <button class="btn btn-secondary" (click)="clearMpProjectListSearch()">Clear</button>
                            }
                          </div>
                        </div>
                        @if (mpProjectListSearchError()) { <div class="query-error">&#9888; {{ mpProjectListSearchError() }}</div> }
                        @if (mpProjectListSearchResults(); as results) {
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
                                        <td><button class="btn-add-row" (click)="addMpProjectFromResult(row)">+ Add</button></td>
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

                  <div class="panel">
                    <h3 class="panel-title">Target Business Unit (Policy ID)</h3>
                    @if (mpTargetPolicyId()) {
                      <div class="selected-site">
                        <span class="well-chip site-chip">
                          {{ mpTargetPolicyId() }}
                          <button class="chip-remove" (click)="removeMpTargetPolicy()">&times;</button>
                        </span>
                      </div>
                      <p class="hint">&rarr; The Target Business Unit applies to all the Project IDs you entered. Remove it to select a different one.</p>
                    } @else {
                      <div class="inline-form">
                        <label class="inline-label" for="mpTargetPolicy">Target Policy ID:</label>
                        <input
                          id="mpTargetPolicy"
                          type="text"
                          class="form-input inline-input"
                          placeholder="Enter Target Policy ID"
                          [ngModel]="mpTargetPolicyInput()"
                          (ngModelChange)="mpTargetPolicyInput.set($event)"
                        />
                        <button class="btn btn-update" [disabled]="!mpTargetPolicyInput().trim()" (click)="setMpTargetPolicyId()">Set Target Policy ID</button>
                      </div>
                      <p class="hint">&rarr; The Target Business Unit applies to all the Project IDs you entered.</p>
                    }

                    <button class="btn btn-outline btn-sm" (click)="toggleMpPolicyTargetSearch()">
                      <span class="chevron" [class.open]="mpShowPolicyTargetSearch()">&#9654;</span>
                      {{ mpShowPolicyTargetSearch() ? 'Hide' : 'Show' }} Business Unit Search
                    </button>
                    @if (mpShowPolicyTargetSearch()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="mpPolicyTargetSearch">Business Unit Name</label>
                            <input
                              id="mpPolicyTargetSearch"
                              type="text"
                              class="form-input"
                              placeholder="Enter Business Unit Name"
                              [ngModel]="mpPolicyTargetSearchInput()"
                              (ngModelChange)="mpPolicyTargetSearchInput.set($event)"
                              (keydown.enter)="runMpPolicyTargetSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!mpPolicyTargetSearchInput().trim() || mpPolicyTargetSearchLoading()"
                              (click)="runMpPolicyTargetSearch()">
                              @if (mpPolicyTargetSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                            </button>
                            @if (mpPolicyTargetSearchResults()) {
                              <button class="btn btn-secondary" (click)="clearMpPolicyTargetSearch()">Clear</button>
                            }
                          </div>
                        </div>
                        @if (mpPolicyTargetSearchError()) { <div class="query-error">&#9888; {{ mpPolicyTargetSearchError() }}</div> }
                        @if (mpPolicyTargetSearchResults(); as results) {
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
                                        <td>
                                          <button
                                            class="btn-add-row"
                                            [disabled]="!!mpTargetPolicyId()"
                                            (click)="selectMpTargetPolicyFromResult(row)">
                                            {{ mpTargetPolicyId() ? 'Selected' : '+ Select' }}
                                          </button>
                                        </td>
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

                  @if (mpProjectIdList().length) {
                    <div class="panel">
                      <h3 class="panel-title">Movement Summary</h3>
                      <div class="summary-table-wrapper">
                        <table class="summary-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Project ID</th>
                              <th>Target Policy ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (proj of mpProjectIdList(); track proj; let i = $index) {
                              <tr>
                                <td>{{ i + 1 }}</td>
                                <td>{{ proj }}</td>
                                <td>{{ mpTargetPolicyId() || '—' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>

                      <div class="action-buttons action-buttons-row" style="margin-top:1.25rem">
                        <button
                          class="btn btn-primary"
                          [disabled]="!mpProjectIdList().length || !mpTargetPolicyId() || mpMultiPreviewLoading()"
                          (click)="runMpMultiPreviewQuery()">
                          @if (mpMultiPreviewLoading()) { Loading... } @else { &#128269; Preview Query }
                        </button>
                        <button
                          class="btn btn-dark"
                          [disabled]="!mpMultiPreviewResults().length || mpMultiExecuteLoading()"
                          (click)="runMpMultiExecuteMovement()">
                          @if (mpMultiExecuteLoading()) { Executing... } @else { &#9654; Execute Movement }
                        </button>
                      </div>

                      @if (mpMultiPreviewError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ mpMultiPreviewError() }}</div>
                      }

                      @if (mpMultiPreviewResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Preview Results ({{ mpMultiPreviewResults().length }} row{{ mpMultiPreviewResults().length !== 1 ? 's' : '' }})</h4>
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead><tr>@for (col of mpMultiPreviewColumns(); track col) { <th>{{ col }}</th> }</tr></thead>
                              <tbody>
                                @for (row of mpMultiPreviewResults(); track $index) {
                                  <tr>@for (col of mpMultiPreviewColumns(); track col) { <td>{{ row[col] }}</td> }</tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      }

                      @if (mpMultiExecuteError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ mpMultiExecuteError() }}</div>
                      }

                      @if (mpMultiExecuteResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Execution Results</h4>
                          @for (group of groupedMpMultiExecuteResults(); track group.projectId) {
                            <div class="exec-accordion">
                              <div class="exec-accordion-header" (click)="toggleMpMultiExecuteProject(group.projectId)">
                                <span class="chevron" [class.open]="isMpMultiExecuteProjectExpanded(group.projectId)">&#9654;</span>
                                <span class="exec-well-id">{{ group.projectId }}</span>
                                <span class="exec-step-count">{{ group.rows.length }} steps</span>
                                @if (group.allSuccess) {
                                  <span class="exec-badge exec-badge-ok">&#10003; All OK</span>
                                } @else {
                                  <span class="exec-badge exec-badge-fail">&#10007; Rolled Back</span>
                                }
                              </div>
                              @if (isMpMultiExecuteProjectExpanded(group.projectId)) {
                                <div class="exec-accordion-body">
                                  <div class="results-table-wrap">
                                    <table class="results-table">
                                      <thead><tr><th>Step</th><th>Query</th><th>Status</th></tr></thead>
                                      <tbody>
                                        @for (row of group.rows; track $index) {
                                          <tr [class.row-fail]="!row.success">
                                            <td>{{ $index + 1 }}</td>
                                            <td>{{ row.label }}</td>
                                            <td [style.color]="row.success ? '#16a34a' : '#dc2626'">{{ row.success ? '✓ OK' : '✗ ' + row.error }}</td>
                                          </tr>
                                          @if (!row.success && row.sql) {
                                            <tr class="row-fail-sql"><td colspan="3"><pre class="fail-sql-code">{{ row.sql }}</pre></td></tr>
                                          }
                                        }
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                }

                @if (moveProjectsMode() === 'single') {
                <div class="panel">
                  <h3 class="panel-title">Add Project &rarr; Business Unit Pair</h3>
                  <div class="inline-form">
                    <label class="inline-label" for="mpProjectId">Project ID:</label>
                    <input
                      id="mpProjectId"
                      type="text"
                      class="form-input inline-input"
                      placeholder="Enter Project ID"
                      [ngModel]="mpProjectIdInput()"
                      (ngModelChange)="mpProjectIdInput.set($event)"
                    />
                    <label class="inline-label" for="mpPolicyId">Policy ID:</label>
                    <input
                      id="mpPolicyId"
                      type="text"
                      class="form-input inline-input"
                      placeholder="Enter Target Policy ID"
                      [ngModel]="mpPolicyIdInput()"
                      (ngModelChange)="mpPolicyIdInput.set($event)"
                      (keydown.enter)="addProjectPair()"
                    />
                    <button class="btn btn-add" [disabled]="!mpProjectIdInput().trim() || !mpPolicyIdInput().trim()" (click)="addProjectPair()">Add Pair</button>
                    <button class="btn btn-clear" [disabled]="!mpPairList().length" (click)="clearMpSingleAll()">Clear All</button>
                  </div>
                  <p class="hint">&rarr; Each pair maps one Project ID to one Target Business Unit (Policy ID). Add as many pairs as needed.</p>

                  <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap">
                    <button class="btn btn-outline btn-sm" (click)="toggleMpProjectSearch()">
                      <span class="chevron" [class.open]="mpShowProjectSearch()">&#9654;</span>
                      {{ mpShowProjectSearch() ? 'Hide' : 'Show' }} Project Search
                    </button>
                    <button class="btn btn-outline btn-sm" (click)="toggleMpPolicySearch()">
                      <span class="chevron" [class.open]="mpShowPolicySearch()">&#9654;</span>
                      {{ mpShowPolicySearch() ? 'Hide' : 'Show' }} Business Unit Search
                    </button>
                  </div>

                  @if (mpShowProjectSearch()) {
                    <div class="subsearch">
                      <div class="search-form search-form-single">
                        <div class="form-group">
                          <label for="mpProjectSearch">Project ID / Name</label>
                          <input
                            id="mpProjectSearch"
                            type="text"
                            class="form-input"
                            placeholder="Enter Project ID or Name (use % as wildcard)"
                            [ngModel]="mpProjectSearchInput()"
                            (ngModelChange)="mpProjectSearchInput.set($event)"
                            (keydown.enter)="runMpProjectSearch()"
                          />
                        </div>
                        <div class="search-actions">
                          <button
                            class="btn btn-primary"
                            [disabled]="!mpProjectSearchInput().trim() || mpProjectSearchLoading()"
                            (click)="runMpProjectSearch()">
                            @if (mpProjectSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                          </button>
                          @if (mpProjectSearchResults()) {
                            <button class="btn btn-secondary" (click)="clearMpProjectSearch()">Clear</button>
                          }
                        </div>
                      </div>
                      @if (mpProjectSearchError()) { <div class="query-error">&#9888; {{ mpProjectSearchError() }}</div> }
                      @if (mpProjectSearchResults(); as results) {
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
                                      <td><button class="btn-add-row" (click)="selectMpProjectFromResult(row)">+ Select</button></td>
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

                  @if (mpShowPolicySearch()) {
                    <div class="subsearch">
                      <div class="search-form search-form-single">
                        <div class="form-group">
                          <label for="mpPolicySearch">Business Unit Name</label>
                          <input
                            id="mpPolicySearch"
                            type="text"
                            class="form-input"
                            placeholder="Enter Business Unit Name"
                            [ngModel]="mpPolicySearchInput()"
                            (ngModelChange)="mpPolicySearchInput.set($event)"
                            (keydown.enter)="runMpPolicySearch()"
                          />
                        </div>
                        <div class="search-actions">
                          <button
                            class="btn btn-primary"
                            [disabled]="!mpPolicySearchInput().trim() || mpPolicySearchLoading()"
                            (click)="runMpPolicySearch()">
                            @if (mpPolicySearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                          </button>
                          @if (mpPolicySearchResults()) {
                            <button class="btn btn-secondary" (click)="clearMpPolicySearch()">Clear</button>
                          }
                        </div>
                      </div>
                      @if (mpPolicySearchError()) { <div class="query-error">&#9888; {{ mpPolicySearchError() }}</div> }
                      @if (mpPolicySearchResults(); as results) {
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
                                      <td><button class="btn-add-row" (click)="selectMpPolicyFromResult(row)">+ Select</button></td>
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

                @if (mpPairList().length) {
                  <div class="panel">
                    <h3 class="panel-title">Movement Pairs</h3>
                    <div class="summary-table-wrapper">
                      <table class="summary-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Project ID</th>
                            <th>Target Policy ID</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (pair of mpPairList(); track $index; let i = $index) {
                            <tr>
                              <td>{{ i + 1 }}</td>
                              <td>{{ pair.projectId }}</td>
                              <td>{{ pair.policyId }}</td>
                              <td><button class="chip-remove" (click)="removeProjectPair(i)">&times;</button></td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                    <div class="action-buttons action-buttons-row" style="margin-top:1.25rem">
                      <button
                        class="btn btn-primary"
                        [disabled]="!mpPairList().length || mpPreviewLoading()"
                        (click)="runMpPreviewQuery()">
                        @if (mpPreviewLoading()) { Loading... } @else { &#128269; Preview Query }
                      </button>
                      <button
                        class="btn btn-dark"
                        [disabled]="!mpPreviewResults().length || mpExecuteLoading()"
                        (click)="runMpExecuteMovement()">
                        @if (mpExecuteLoading()) { Executing... } @else { &#9654; Execute Movement }
                      </button>
                    </div>

                    @if (mpPreviewError()) {
                      <div class="query-error" style="margin-top:0.75rem">&#9888; {{ mpPreviewError() }}</div>
                    }

                    @if (mpPreviewResults().length) {
                      <div class="query-results-section" style="margin-top:1rem">
                        <h4 class="results-title">Preview Results ({{ mpPreviewResults().length }} row{{ mpPreviewResults().length !== 1 ? 's' : '' }})</h4>
                        <div class="results-table-wrap">
                          <table class="results-table">
                            <thead><tr>@for (col of mpPreviewColumns(); track col) { <th>{{ col }}</th> }</tr></thead>
                            <tbody>
                              @for (row of mpPreviewResults(); track $index) {
                                <tr>@for (col of mpPreviewColumns(); track col) { <td>{{ row[col] }}</td> }</tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    }

                    @if (mpExecuteError()) {
                      <div class="query-error" style="margin-top:0.75rem">&#9888; {{ mpExecuteError() }}</div>
                    }

                    @if (mpExecuteResults().length) {
                      <div class="query-results-section" style="margin-top:1rem">
                        <h4 class="results-title">Execution Results</h4>
                        @for (group of groupedMpExecuteResults(); track group.projectId) {
                          <div class="exec-accordion">
                            <div class="exec-accordion-header" (click)="toggleMpExecuteProject(group.projectId)">
                              <span class="chevron" [class.open]="isMpExecuteProjectExpanded(group.projectId)">&#9654;</span>
                              <span class="exec-well-id">{{ group.projectId }}</span>
                              <span class="exec-step-count">{{ group.rows.length }} steps</span>
                              @if (group.allSuccess) {
                                <span class="exec-badge exec-badge-ok">&#10003; All OK</span>
                              } @else {
                                <span class="exec-badge exec-badge-fail">&#10007; Rolled Back</span>
                              }
                            </div>
                            @if (isMpExecuteProjectExpanded(group.projectId)) {
                              <div class="exec-accordion-body">
                                <div class="results-table-wrap">
                                  <table class="results-table">
                                    <thead><tr><th>Step</th><th>Query</th><th>Status</th></tr></thead>
                                    <tbody>
                                      @for (row of group.rows; track $index) {
                                        <tr [class.row-fail]="!row.success">
                                          <td>{{ $index + 1 }}</td>
                                          <td>{{ row.label }}</td>
                                          <td [style.color]="row.success ? '#16a34a' : '#dc2626'">{{ row.success ? '✓ OK' : '✗ ' + row.error }}</td>
                                        </tr>
                                        @if (!row.success && row.sql) {
                                          <tr class="row-fail-sql"><td colspan="3"><pre class="fail-sql-code">{{ row.sql }}</pre></td></tr>
                                        }
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
                }
              } @else if (selectedOption() === 'move-sites') {
                <div class="action-buttons action-buttons-row">
                  <button
                    class="btn"
                    [class.btn-dark]="moveSitesMode() === 'multiple'"
                    [class.btn-light]="moveSitesMode() !== 'multiple'"
                    (click)="moveSitesMode.set('multiple')">
                    Move Multiple Sites to one project
                  </button>
                  <button
                    class="btn"
                    [class.btn-dark]="moveSitesMode() === 'single'"
                    [class.btn-light]="moveSitesMode() !== 'single'"
                    (click)="moveSitesMode.set('single')">
                    Move One Site to one project
                  </button>
                </div>

                @if (moveSitesMode() === 'multiple') {
                  <div class="panel">
                    <h3 class="panel-title">List of Site IDs</h3>
                    <div class="inline-form">
                      <label class="inline-label" for="msSiteEntry">Site ID:</label>
                      <input
                        id="msSiteEntry"
                        type="text"
                        class="form-input inline-input"
                        placeholder="Enter Site ID"
                        [ngModel]="msSiteEntryInput()"
                        (ngModelChange)="msSiteEntryInput.set($event)"
                        (keydown.enter)="addMsSiteEntry()"
                      />
                      <button class="btn btn-add" [disabled]="!msSiteEntryInput().trim()" (click)="addMsSiteEntry()">Add Entry</button>
                      <button class="btn btn-clear" [disabled]="!msSiteIdList().length" (click)="clearMsMultiAll()">Clear List</button>
                    </div>
                    <p class="hint">&rarr; You can add multiple Site IDs. They will all be linked to the Target Project ID below.</p>

                    @if (msSiteIdList().length) {
                      <div class="well-list">
                        @for (entry of msSiteIdList(); track entry; let i = $index) {
                          <span class="well-chip">
                            {{ entry }}
                            <button class="chip-remove" (click)="removeMsSiteEntry(i)">&times;</button>
                          </span>
                        }
                      </div>
                    }

                    <button class="btn btn-outline btn-sm" (click)="toggleMsSiteListSearch()">
                      <span class="chevron" [class.open]="msShowSiteListSearch()">&#9654;</span>
                      {{ msShowSiteListSearch() ? 'Hide' : 'Show' }} Site Search
                    </button>
                    @if (msShowSiteListSearch()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="msSiteListSearch">Target Site Name</label>
                            <input
                              id="msSiteListSearch"
                              type="text"
                              class="form-input"
                              placeholder="Enter Target Site Name (use % as wildcard)"
                              [ngModel]="msSiteListSearchInput()"
                              (ngModelChange)="msSiteListSearchInput.set($event)"
                              (keydown.enter)="runMsSiteListSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!msSiteListSearchInput().trim() || msSiteListSearchLoading()"
                              (click)="runMsSiteListSearch()">
                              @if (msSiteListSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                            </button>
                            @if (msSiteListSearchResults()) {
                              <button class="btn btn-secondary" (click)="clearMsSiteListSearch()">Clear</button>
                            }
                          </div>
                        </div>
                        @if (msSiteListSearchError()) { <div class="query-error">&#9888; {{ msSiteListSearchError() }}</div> }
                        @if (msSiteListSearchResults(); as results) {
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
                                        <td><button class="btn-add-row" (click)="addMsSiteFromResult(row)">+ Add</button></td>
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

                  <div class="panel">
                    <h3 class="panel-title">Target Project ID</h3>
                    @if (msTargetProjectId()) {
                      <div class="selected-site">
                        <span class="well-chip site-chip">
                          {{ msTargetProjectId() }}
                          <button class="chip-remove" (click)="removeMsTargetProject()">&times;</button>
                        </span>
                      </div>
                      <p class="hint">&rarr; The Target Project ID applies to all the Site IDs you entered. Remove it to select a different one.</p>
                    } @else {
                      <div class="inline-form">
                        <label class="inline-label" for="msTargetProject">Target Project ID:</label>
                        <input
                          id="msTargetProject"
                          type="text"
                          class="form-input inline-input"
                          placeholder="Enter Target Project ID"
                          [ngModel]="msTargetProjectInput()"
                          (ngModelChange)="msTargetProjectInput.set($event)"
                        />
                        <button class="btn btn-update" [disabled]="!msTargetProjectInput().trim()" (click)="setMsTargetProjectId()">Set Target Project ID</button>
                      </div>
                      <p class="hint">&rarr; The Target Project ID applies to all the Site IDs you entered.</p>
                    }

                    <button class="btn btn-outline btn-sm" (click)="toggleMsProjectTargetSearch()">
                      <span class="chevron" [class.open]="msShowProjectTargetSearch()">&#9654;</span>
                      {{ msShowProjectTargetSearch() ? 'Hide' : 'Show' }} Project Search
                    </button>
                    @if (msShowProjectTargetSearch()) {
                      <div class="subsearch">
                        <div class="search-form search-form-single">
                          <div class="form-group">
                            <label for="msProjectTargetSearch">Project ID / Name</label>
                            <input
                              id="msProjectTargetSearch"
                              type="text"
                              class="form-input"
                              placeholder="Enter Project ID or Name"
                              [ngModel]="msProjectTargetSearchInput()"
                              (ngModelChange)="msProjectTargetSearchInput.set($event)"
                              (keydown.enter)="runMsProjectTargetSearch()"
                            />
                          </div>
                          <div class="search-actions">
                            <button
                              class="btn btn-primary"
                              [disabled]="!msProjectTargetSearchInput().trim() || msProjectTargetSearchLoading()"
                              (click)="runMsProjectTargetSearch()">
                              @if (msProjectTargetSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                            </button>
                            @if (msProjectTargetSearchResults()) {
                              <button class="btn btn-secondary" (click)="clearMsProjectTargetSearch()">Clear</button>
                            }
                          </div>
                        </div>
                        @if (msProjectTargetSearchError()) { <div class="query-error">&#9888; {{ msProjectTargetSearchError() }}</div> }
                        @if (msProjectTargetSearchResults(); as results) {
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
                                        <td>
                                          <button
                                            class="btn-add-row"
                                            [disabled]="!!msTargetProjectId()"
                                            (click)="selectMsTargetProjectFromResult(row)">
                                            {{ msTargetProjectId() ? 'Selected' : '+ Select' }}
                                          </button>
                                        </td>
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

                  @if (msSiteIdList().length) {
                    <div class="panel">
                      <h3 class="panel-title">Movement Summary</h3>
                      <div class="summary-table-wrapper">
                        <table class="summary-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Site ID</th>
                              <th>Target Project ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (site of msSiteIdList(); track site; let i = $index) {
                              <tr>
                                <td>{{ i + 1 }}</td>
                                <td>{{ site }}</td>
                                <td>{{ msTargetProjectId() || '—' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>

                      <div class="action-buttons action-buttons-row" style="margin-top:1.25rem">
                        <button
                          class="btn btn-primary"
                          [disabled]="!msSiteIdList().length || !msTargetProjectId() || msMultiPreviewLoading()"
                          (click)="runMsMultiPreviewQuery()">
                          @if (msMultiPreviewLoading()) { Loading... } @else { &#128269; Preview Query }
                        </button>
                        <button
                          class="btn btn-dark"
                          [disabled]="!msMultiPreviewResults().length || msMultiExecuteLoading()"
                          (click)="runMsMultiExecuteMovement()">
                          @if (msMultiExecuteLoading()) { Executing... } @else { &#9654; Execute Movement }
                        </button>
                      </div>

                      @if (msMultiPreviewError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ msMultiPreviewError() }}</div>
                      }

                      @if (msMultiPreviewResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Preview Results ({{ msMultiPreviewResults().length }} row{{ msMultiPreviewResults().length !== 1 ? 's' : '' }})</h4>
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead><tr>@for (col of msMultiPreviewColumns(); track col) { <th>{{ col }}</th> }</tr></thead>
                              <tbody>
                                @for (row of msMultiPreviewResults(); track $index) {
                                  <tr>@for (col of msMultiPreviewColumns(); track col) { <td>{{ row[col] }}</td> }</tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      }

                      @if (msMultiExecuteError()) {
                        <div class="query-error" style="margin-top:0.75rem">&#9888; {{ msMultiExecuteError() }}</div>
                      }

                      @if (msMultiExecuteResults().length) {
                        <div class="query-results-section" style="margin-top:1rem">
                          <h4 class="results-title">Execution Results</h4>
                          @for (group of groupedMsMultiExecuteResults(); track group.siteId) {
                            <div class="exec-accordion">
                              <div class="exec-accordion-header" (click)="toggleMsMultiExecuteSite(group.siteId)">
                                <span class="chevron" [class.open]="isMsMultiExecuteSiteExpanded(group.siteId)">&#9654;</span>
                                <span class="exec-well-id">{{ group.siteId }}</span>
                                <span class="exec-step-count">{{ group.rows.length }} steps</span>
                                @if (group.allSuccess) {
                                  <span class="exec-badge exec-badge-ok">&#10003; All OK</span>
                                } @else {
                                  <span class="exec-badge exec-badge-fail">&#10007; Rolled Back</span>
                                }
                              </div>
                              @if (isMsMultiExecuteSiteExpanded(group.siteId)) {
                                <div class="exec-accordion-body">
                                  <div class="results-table-wrap">
                                    <table class="results-table">
                                      <thead><tr><th>Step</th><th>Query</th><th>Status</th></tr></thead>
                                      <tbody>
                                        @for (row of group.rows; track $index) {
                                          <tr [class.row-fail]="!row.success">
                                            <td>{{ $index + 1 }}</td>
                                            <td>{{ row.label }}</td>
                                            <td [style.color]="row.success ? '#16a34a' : '#dc2626'">{{ row.success ? '✓ OK' : '✗ ' + row.error }}</td>
                                          </tr>
                                          @if (!row.success && row.sql) {
                                            <tr class="row-fail-sql"><td colspan="3"><pre class="fail-sql-code">{{ row.sql }}</pre></td></tr>
                                          }
                                        }
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                }

                @if (moveSitesMode() === 'single') {
                <div class="panel">
                  <h3 class="panel-title">Add Site &rarr; Project Pair</h3>
                  <div class="inline-form">
                    <label class="inline-label" for="msSiteId">Site ID:</label>
                    <input
                      id="msSiteId"
                      type="text"
                      class="form-input inline-input"
                      placeholder="Enter Site ID"
                      [ngModel]="msSiteIdInput()"
                      (ngModelChange)="msSiteIdInput.set($event)"
                    />
                    <label class="inline-label" for="msProjectId">Project ID:</label>
                    <input
                      id="msProjectId"
                      type="text"
                      class="form-input inline-input"
                      placeholder="Enter Target Project ID"
                      [ngModel]="msProjectIdInput()"
                      (ngModelChange)="msProjectIdInput.set($event)"
                      (keydown.enter)="addSitePair()"
                    />
                    <button class="btn btn-add" [disabled]="!msSiteIdInput().trim() || !msProjectIdInput().trim()" (click)="addSitePair()">Add Pair</button>
                    <button class="btn btn-clear" [disabled]="!msPairList().length" (click)="clearMsSingleAll()">Clear All</button>
                  </div>
                  <p class="hint">&rarr; Each pair maps one Site ID to one Target Project ID. Add as many pairs as needed.</p>

                  <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap">
                    <button class="btn btn-outline btn-sm" (click)="toggleMsSiteSearch()">
                      <span class="chevron" [class.open]="msShowSiteSearch()">&#9654;</span>
                      {{ msShowSiteSearch() ? 'Hide' : 'Show' }} Site Search
                    </button>
                    <button class="btn btn-outline btn-sm" (click)="toggleMsProjectSearch()">
                      <span class="chevron" [class.open]="msShowProjectSearch()">&#9654;</span>
                      {{ msShowProjectSearch() ? 'Hide' : 'Show' }} Project Search
                    </button>
                  </div>

                  @if (msShowSiteSearch()) {
                    <div class="subsearch">
                      <div class="search-form search-form-single">
                        <div class="form-group">
                          <label for="msSiteSearch">Target Site Name</label>
                          <input
                            id="msSiteSearch"
                            type="text"
                            class="form-input"
                            placeholder="Enter Target Site Name (use % as wildcard)"
                            [ngModel]="msSiteSearchInput()"
                            (ngModelChange)="msSiteSearchInput.set($event)"
                            (keydown.enter)="runMsSiteSearch()"
                          />
                        </div>
                        <div class="search-actions">
                          <button
                            class="btn btn-primary"
                            [disabled]="!msSiteSearchInput().trim() || msSiteSearchLoading()"
                            (click)="runMsSiteSearch()">
                            @if (msSiteSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                          </button>
                          @if (msSiteSearchResults()) {
                            <button class="btn btn-secondary" (click)="clearMsSiteSearch()">Clear</button>
                          }
                        </div>
                      </div>
                      @if (msSiteSearchError()) { <div class="query-error">&#9888; {{ msSiteSearchError() }}</div> }
                      @if (msSiteSearchResults(); as results) {
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
                                      <td><button class="btn-add-row" (click)="selectMsSiteFromResult(row)">+ Select</button></td>
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

                  @if (msShowProjectSearch()) {
                    <div class="subsearch">
                      <div class="search-form search-form-single">
                        <div class="form-group">
                          <label for="msProjectSearch">Project ID / Name</label>
                          <input
                            id="msProjectSearch"
                            type="text"
                            class="form-input"
                            placeholder="Enter Project ID or Project Name"
                            [ngModel]="msProjectSearchInput()"
                            (ngModelChange)="msProjectSearchInput.set($event)"
                            (keydown.enter)="runMsProjectSearch()"
                          />
                        </div>
                        <div class="search-actions">
                          <button
                            class="btn btn-primary"
                            [disabled]="!msProjectSearchInput().trim() || msProjectSearchLoading()"
                            (click)="runMsProjectSearch()">
                            @if (msProjectSearchLoading()) { Loading... } @else { <span class="search-icon">&#128269;</span> Search }
                          </button>
                          @if (msProjectSearchResults()) {
                            <button class="btn btn-secondary" (click)="clearMsProjectSearch()">Clear</button>
                          }
                        </div>
                      </div>
                      @if (msProjectSearchError()) { <div class="query-error">&#9888; {{ msProjectSearchError() }}</div> }
                      @if (msProjectSearchResults(); as results) {
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
                                      <td><button class="btn-add-row" (click)="selectMsProjectFromResult(row)">+ Select</button></td>
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

                @if (msPairList().length) {
                  <div class="panel">
                    <h3 class="panel-title">Movement Pairs</h3>
                    <div class="summary-table-wrapper">
                      <table class="summary-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Site ID</th>
                            <th>Target Project ID</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (pair of msPairList(); track $index; let i = $index) {
                            <tr>
                              <td>{{ i + 1 }}</td>
                              <td>{{ pair.siteId }}</td>
                              <td>{{ pair.projectId }}</td>
                              <td><button class="chip-remove" (click)="removeSitePair(i)">&times;</button></td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                    <div class="action-buttons action-buttons-row" style="margin-top:1.25rem">
                      <button
                        class="btn btn-primary"
                        [disabled]="!msPairList().length || msPreviewLoading()"
                        (click)="runMsPreviewQuery()">
                        @if (msPreviewLoading()) { Loading... } @else { &#128269; Preview Query }
                      </button>
                      <button
                        class="btn btn-dark"
                        [disabled]="!msPreviewResults().length || msExecuteLoading()"
                        (click)="runMsExecuteMovement()">
                        @if (msExecuteLoading()) { Executing... } @else { &#9654; Execute Movement }
                      </button>
                    </div>

                    @if (msPreviewError()) {
                      <div class="query-error" style="margin-top:0.75rem">&#9888; {{ msPreviewError() }}</div>
                    }

                    @if (msPreviewResults().length) {
                      <div class="query-results-section" style="margin-top:1rem">
                        <h4 class="results-title">Preview Results ({{ msPreviewResults().length }} row{{ msPreviewResults().length !== 1 ? 's' : '' }})</h4>
                        <div class="results-table-wrap">
                          <table class="results-table">
                            <thead><tr>@for (col of msPreviewColumns(); track col) { <th>{{ col }}</th> }</tr></thead>
                            <tbody>
                              @for (row of msPreviewResults(); track $index) {
                                <tr>@for (col of msPreviewColumns(); track col) { <td>{{ row[col] }}</td> }</tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    }

                    @if (msExecuteError()) {
                      <div class="query-error" style="margin-top:0.75rem">&#9888; {{ msExecuteError() }}</div>
                    }

                    @if (msExecuteResults().length) {
                      <div class="query-results-section" style="margin-top:1rem">
                        <h4 class="results-title">Execution Results</h4>
                        @for (group of groupedMsExecuteResults(); track group.siteId) {
                          <div class="exec-accordion">
                            <div class="exec-accordion-header" (click)="toggleMsExecuteSite(group.siteId)">
                              <span class="chevron" [class.open]="isMsExecuteSiteExpanded(group.siteId)">&#9654;</span>
                              <span class="exec-well-id">{{ group.siteId }}</span>
                              <span class="exec-step-count">{{ group.rows.length }} steps</span>
                              @if (group.allSuccess) {
                                <span class="exec-badge exec-badge-ok">&#10003; All OK</span>
                              } @else {
                                <span class="exec-badge exec-badge-fail">&#10007; Rolled Back</span>
                              }
                            </div>
                            @if (isMsExecuteSiteExpanded(group.siteId)) {
                              <div class="exec-accordion-body">
                                <div class="results-table-wrap">
                                  <table class="results-table">
                                    <thead><tr><th>Step</th><th>Query</th><th>Status</th></tr></thead>
                                    <tbody>
                                      @for (row of group.rows; track $index) {
                                        <tr [class.row-fail]="!row.success">
                                          <td>{{ $index + 1 }}</td>
                                          <td>{{ row.label }}</td>
                                          <td [style.color]="row.success ? '#16a34a' : '#dc2626'">{{ row.success ? '✓ OK' : '✗ ' + row.error }}</td>
                                        </tr>
                                        @if (!row.success && row.sql) {
                                          <tr class="row-fail-sql"><td colspan="3"><pre class="fail-sql-code">{{ row.sql }}</pre></td></tr>
                                        }
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
                }
              } @else {
                <div class="action-buttons">
                  <button class="btn btn-primary">Continue with {{ getSelectedOptionTitle() }}</button>
                </div>
              }
            </div>
          } @else {
            <h2>Select Movement Type</h2>
            <p>Choose the type of movement operation you want to perform.</p>
            
            <div class="hexagon-grid">
              @for (option of options(); track option.id) {
                <div 
                  class="hexagon-wrapper"
                  (click)="selectOption(option.id)"
                  (keydown.enter)="selectOption(option.id)"
                  (keydown.space)="selectOption(option.id); $event.preventDefault()"
                  tabindex="0"
                  role="button">
                  <div class="hexagon">
                    <div class="hexagon-border">
                      <div class="hexagon-inner">
                        <div class="hexagon-content">
                          <div class="hex-icon" [innerHTML]="option.icon"></div>
                          <div class="hex-title">{{ option.title }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
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
    
    .hexagon.selected .hexagon-border {
      background: linear-gradient(135deg, #ff9966 0%, #C1272D 100%);
      box-shadow: 0 0 30px rgba(193, 39, 45, 0.6);
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
    
    .hexagon.selected .hexagon-inner {
      background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
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
    
    .hex-icon :global(svg) {
      width: 56px;
      height: 56px;
      stroke: white;
      fill: none;
      stroke-width: 2;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    }
    
    .hexagon.selected .hex-icon :global(svg) {
      stroke: #ff9966;
      filter: drop-shadow(0 0 10px rgba(255, 153, 102, 0.8));
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
    
    .hexagon.selected .hex-title {
      color: #ff9966;
    }
    
    .selected-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
      border-radius: 8px;
      margin-bottom: 2rem;
      border: 2px solid #C1272D;
      box-shadow: 0 4px 12px rgba(193, 39, 45, 0.3);
    }
    
    .selected-badge {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .badge-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #ff9966 0%, #C1272D 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .badge-icon :global(svg) {
      width: 36px;
      height: 36px;
      stroke: white;
      fill: none;
      stroke-width: 2;
    }
    
    .badge-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .badge-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-title {
      color: white;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .btn-change {
      padding: 0.5rem 1.25rem;
      background: white;
      color: #1a1a1a;
      border: 2px solid white;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    
    .btn-change:hover {
      background: transparent;
      color: white;
      border-color: #ff9966;
    }
    
    .selection-content {
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .selection-description {
      color: #4a4a4a;
      line-height: 1.6;
      font-size: 1.05rem;
      margin: 0 0 2rem 0;
    }
    
    .action-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
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
      box-shadow: 0 4px 12px rgba(193, 39, 45, 0.4);
    }

    .btn-dark {
      background: #1a1a1a;
      color: white;
    }

    .btn-dark:hover {
      background: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .btn-light {
      background: white;
      color: #1a1a1a;
      border: 2px solid #d1d5db;
    }

    .btn-light:hover {
      border-color: #1a1a1a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

    .action-buttons-row {
      flex-direction: row !important;
      flex-wrap: wrap;
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

    .btn-update {
      background: #2e7d32;
      color: white;
    }

    .btn-update:hover {
      background: #1b5e20;
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
      margin-top: 1rem;
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

    .selected-site {
      margin-bottom: 0.5rem;
    }

    .site-chip {
      font-size: 1rem;
      padding: 0.5rem 1rem;
      background: #dbeafe;
      color: #1e40af;
    }

    .summary-table-wrapper {
      overflow-x: auto;
    }

    .summary-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      font-size: 0.95rem;
    }

    .summary-table thead {
      background: #1e293b;
      color: #fff;
    }

    .summary-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      letter-spacing: 0.025em;
    }

    .summary-table tbody tr {
      transition: background 0.15s;
    }

    .summary-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    .summary-table tbody tr:hover {
      background: #e0f2fe;
    }

    .summary-table td {
      padding: 0.65rem 1rem;
      border-top: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .table-input {
      width: 100%;
      min-width: 120px;
      padding: 0.4rem 0.6rem;
      font-size: 0.9rem;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #fff;
    }

    .table-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    .btn-search-inline {
      background: none;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      cursor: pointer;
      padding: 0.35rem 0.6rem;
      font-size: 1rem;
      line-height: 1;
      transition: all 0.15s;
    }

    .btn-search-inline:hover,
    .btn-search-inline.active {
      background: #1e293b;
      color: #fff;
      border-color: #1e293b;
    }

    .search-row td {
      padding: 0;
      border-top: none;
    }

    .inline-search-panel {
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-top: 1px dashed #cbd5e1;
    }

    .inline-search-panel .inline-form {
      margin-bottom: 0.5rem;
    }

    .inline-search-panel .results-table {
      font-size: 0.85rem;
    }

    .subsearch {
      margin-top: 0.75rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .search-section {
      margin-top: 1rem;
    }

    .search-title {
      color: #1a1a1a;
      font-size: 1.25rem;
      margin: 0 0 1.25rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .search-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-items: end;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .search-form.search-form-single {
      grid-template-columns: 1fr;
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

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .query-result {
      margin-top: 1.5rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .query-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease;
    }

    .query-header:hover {
      background: linear-gradient(135deg, #34495e 0%, #222d38 100%);
    }

    .query-header h4 {
      margin: 0;
      color: white;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .chevron {
      display: inline-block;
      font-size: 0.7rem;
      transition: transform 0.25s ease;
    }

    .chevron.open {
      transform: rotate(90deg);
    }

    .btn-copy {
      padding: 0.35rem 0.85rem;
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-copy:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .query-code {
      margin: 0;
      padding: 1rem 1.25rem;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.82rem;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      max-height: 450px;
      overflow-y: auto;
    }

    .query-code code {
      font-family: inherit;
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

    .exec-accordion {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 0.5rem;
      overflow: hidden;
    }

    .exec-accordion-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
      color: white;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
    }

    .exec-accordion-header:hover {
      background: linear-gradient(135deg, #34495e 0%, #222d38 100%);
    }

    .exec-well-id {
      font-weight: 700;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.95rem;
    }

    .exec-step-count {
      color: rgba(255,255,255,0.6);
      font-size: 0.85rem;
    }

    .exec-badge {
      margin-left: auto;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .exec-badge-ok {
      background: #16a34a;
      color: white;
    }

    .exec-badge-fail {
      background: #dc2626;
      color: white;
    }

    .exec-accordion-body {
      padding: 0.5rem;
      background: #fafbfc;
    }

    .row-fail {
      background: #fef2f2 !important;
    }

    .row-fail-sql td {
      padding: 0 !important;
      border-top: none !important;
    }

    .fail-sql-code {
      margin: 0;
      padding: 0.75rem 1rem;
      background: #1e1e1e;
      color: #f87171;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.78rem;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow-y: auto;
      border-left: 3px solid #dc2626;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 1rem;
      }
      
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .page-header h1 {
        font-size: 1.5rem;
      }
      
      .content-card {
        padding: 2rem 1.5rem;
      }
      
      .selected-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .badge-title {
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
      
      .hex-icon :global(svg) {
        width: 44px;
        height: 44px;
      }
      
      .hex-title {
        font-size: 0.9rem;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSiteWellMovementComponent {
  private db = inject(DatabaseService);

  selectedOption = signal<string | null>(null);
  wellIdInput = signal('');
  newSiteIdInput = signal('');
  generatedQuery = signal('');
  copyLabel = signal('Copy');
  showQuery = signal(false);
  showSearch = signal(false);
  siteIdInput = signal('');
  generatedSiteQuery = signal('');
  copySiteLabel = signal('Copy');
  showSiteQuery = signal(false);
  showSearchSite = signal(false);
  moveWellsMode = signal<'multiple' | 'single' | null>('multiple');
  wellEntryInput = signal('');
  wellIdList = signal<string[]>([]);
  targetSiteId = signal('');
  targetSiteInput = signal('');
  queryLoading = signal(false);
  queryError = signal('');
  queryResults = signal<QueryResult | null>(null);
  siteQueryLoading = signal(false);
  siteQueryError = signal('');
  siteQueryResults = signal<QueryResult | null>(null);
  wellSiteOverrides = signal<Record<string, string>>({});
  summarySearchIndex = signal<number | null>(null);
  summarySearchInput = signal('');
  summarySearchLoading = signal(false);
  summarySearchError = signal('');
  summarySearchResults = signal<QueryResult | null>(null);
  previewLoading = signal(false);
  previewError = signal('');
  previewResults = signal<Record<string, unknown>[]>([]);
  previewColumns = signal<string[]>([]);
  executeLoading = signal(false);
  executeError = signal('');
  executeResults = signal<ExecuteResultRow[]>([]);
  expandedExecuteWells = signal<Set<string>>(new Set());

  // ── Single well mode signals ──
  singleWellId = signal('');
  singleSiteId = signal('');
  singlePairList = signal<{ wellId: string; siteId: string }[]>([]);
  showSingleWellSearch = signal(false);
  singleWellSearchInput = signal('');
  singleWellSearchLoading = signal(false);
  singleWellSearchError = signal('');
  singleWellSearchResults = signal<QueryResult | null>(null);
  showSingleSiteSearch = signal(false);
  singleSiteSearchInput = signal('');
  singleSiteSearchLoading = signal(false);
  singleSiteSearchError = signal('');
  singleSiteSearchResults = signal<QueryResult | null>(null);
  singlePreviewLoading = signal(false);
  singlePreviewError = signal('');
  singlePreviewResults = signal<Record<string, unknown>[]>([]);
  singlePreviewColumns = signal<string[]>([]);
  singleExecuteLoading = signal(false);
  singleExecuteError = signal('');
  singleExecuteResults = signal<ExecuteResultRow[]>([]);
  expandedSingleExecuteWells = signal<Set<string>>(new Set());

  // ── Move Sites mode signals ──
  moveSitesMode = signal<'multiple' | 'single'>('multiple');
  // Multiple mode signals (many sites → one project)
  msSiteEntryInput = signal('');
  msSiteIdList = signal<string[]>([]);
  msTargetProjectId = signal('');
  msTargetProjectInput = signal('');
  msShowSiteListSearch = signal(false);
  msSiteListSearchInput = signal('');
  msSiteListSearchLoading = signal(false);
  msSiteListSearchError = signal('');
  msSiteListSearchResults = signal<QueryResult | null>(null);
  msShowProjectTargetSearch = signal(false);
  msProjectTargetSearchInput = signal('');
  msProjectTargetSearchLoading = signal(false);
  msProjectTargetSearchError = signal('');
  msProjectTargetSearchResults = signal<QueryResult | null>(null);
  msMultiPreviewLoading = signal(false);
  msMultiPreviewError = signal('');
  msMultiPreviewResults = signal<Record<string, unknown>[]>([]);
  msMultiPreviewColumns = signal<string[]>([]);
  msMultiExecuteLoading = signal(false);
  msMultiExecuteError = signal('');
  msMultiExecuteResults = signal<{ siteId: string; label: string; success: boolean; error: string; sql: string }[]>([]);
  expandedMsMultiExecuteSites = signal<Set<string>>(new Set());
  // Single mode signals (each site → own project)
  msSiteIdInput = signal('');
  msProjectIdInput = signal('');
  msPairList = signal<{ siteId: string; projectId: string }[]>([]);
  msShowSiteSearch = signal(false);
  msSiteSearchInput = signal('');
  msSiteSearchLoading = signal(false);
  msSiteSearchError = signal('');
  msSiteSearchResults = signal<QueryResult | null>(null);
  msShowProjectSearch = signal(false);
  msProjectSearchInput = signal('');
  msProjectSearchLoading = signal(false);
  msProjectSearchError = signal('');
  msProjectSearchResults = signal<QueryResult | null>(null);
  msPreviewLoading = signal(false);
  msPreviewError = signal('');
  msPreviewResults = signal<Record<string, unknown>[]>([]);
  msPreviewColumns = signal<string[]>([]);
  msExecuteLoading = signal(false);
  msExecuteError = signal('');
  msExecuteResults = signal<{ siteId: string; label: string; success: boolean; error: string; sql: string }[]>([]);
  expandedMsExecuteSites = signal<Set<string>>(new Set());

  // ── Move Projects mode signals ──
  moveProjectsMode = signal<'multiple' | 'single'>('multiple');
  // Multiple mode signals (many projects → one business unit)
  mpProjectEntryInput = signal('');
  mpProjectIdList = signal<string[]>([]);
  mpTargetPolicyId = signal('');
  mpTargetPolicyInput = signal('');
  mpShowProjectListSearch = signal(false);
  mpProjectListSearchInput = signal('');
  mpProjectListSearchLoading = signal(false);
  mpProjectListSearchError = signal('');
  mpProjectListSearchResults = signal<QueryResult | null>(null);
  mpShowPolicyTargetSearch = signal(false);
  mpPolicyTargetSearchInput = signal('');
  mpPolicyTargetSearchLoading = signal(false);
  mpPolicyTargetSearchError = signal('');
  mpPolicyTargetSearchResults = signal<QueryResult | null>(null);
  mpMultiPreviewLoading = signal(false);
  mpMultiPreviewError = signal('');
  mpMultiPreviewResults = signal<Record<string, unknown>[]>([]);
  mpMultiPreviewColumns = signal<string[]>([]);
  mpMultiExecuteLoading = signal(false);
  mpMultiExecuteError = signal('');
  mpMultiExecuteResults = signal<{ projectId: string; label: string; success: boolean; error: string; sql: string }[]>([]);
  expandedMpMultiExecuteProjects = signal<Set<string>>(new Set());
  // Single mode signals (each project → own business unit)
  mpProjectIdInput = signal('');
  mpPolicyIdInput = signal('');
  mpPairList = signal<{ projectId: string; policyId: string }[]>([]);
  mpShowProjectSearch = signal(false);
  mpProjectSearchInput = signal('');
  mpProjectSearchLoading = signal(false);
  mpProjectSearchError = signal('');
  mpProjectSearchResults = signal<QueryResult | null>(null);
  mpShowPolicySearch = signal(false);
  mpPolicySearchInput = signal('');
  mpPolicySearchLoading = signal(false);
  mpPolicySearchError = signal('');
  mpPolicySearchResults = signal<QueryResult | null>(null);
  mpPreviewLoading = signal(false);
  mpPreviewError = signal('');
  mpPreviewResults = signal<Record<string, unknown>[]>([]);
  mpPreviewColumns = signal<string[]>([]);
  mpExecuteLoading = signal(false);
  mpExecuteError = signal('');
  mpExecuteResults = signal<{ projectId: string; label: string; success: boolean; error: string; sql: string }[]>([]);
  expandedMpExecuteProjects = signal<Set<string>>(new Set());

  options = signal<MovementOption[]>([
    {
      id: 'move-projects',
      title: 'Move Projects',
      description: 'Transfer entire projects between different locations or organizational units. This includes all associated sites, wells, and data.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>`
    },
    {
      id: 'move-sites',
      title: 'Move Sites',
      description: 'Relocate site records from one project to another. This operation moves all wells and related data within the site.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>`
    },
    {
      id: 'move-wells',
      title: 'Move Wells',
      description: 'Transfer individual wells between sites. This allows for precise reorganization of well data and associated reports.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>`
    }
  ]);
  
  selectOption(id: string): void {
    this.selectedOption.set(id);
  }
  
  clearSelection(): void {
    this.selectedOption.set(null);
    this.clearSearch();
    this.clearSiteSearch();
    this.moveWellsMode.set('multiple');
    this.wellEntryInput.set('');
    this.wellIdList.set([]);
    this.targetSiteId.set('');
    this.targetSiteInput.set('');
    this.wellSiteOverrides.set({});
    this.summarySearchIndex.set(null);
    this.summarySearchInput.set('');
    this.summarySearchResults.set(null);
    this.summarySearchError.set('');
    this.previewResults.set([]);
    this.previewColumns.set([]);
    this.previewError.set('');
    this.executeResults.set([]);
    this.executeError.set('');
    // Reset single mode
    this.singleWellId.set('');
    this.singleSiteId.set('');
    this.singlePairList.set([]);
    this.clearSingleWellSearch();
    this.clearSingleSiteSearch();
    this.singlePreviewResults.set([]);
    this.singlePreviewColumns.set([]);
    this.singlePreviewError.set('');
    this.singleExecuteResults.set([]);
    this.singleExecuteError.set('');
    // Reset move-sites mode
    this.moveSitesMode.set('multiple');
    this.msSiteEntryInput.set('');
    this.msSiteIdList.set([]);
    this.msTargetProjectId.set('');
    this.msTargetProjectInput.set('');
    this.clearMsSiteListSearch();
    this.clearMsProjectTargetSearch();
    this.msMultiPreviewResults.set([]);
    this.msMultiPreviewColumns.set([]);
    this.msMultiPreviewError.set('');
    this.msMultiExecuteResults.set([]);
    this.msMultiExecuteError.set('');
    this.msSiteIdInput.set('');
    this.msProjectIdInput.set('');
    this.msPairList.set([]);
    this.clearMsSiteSearch();
    this.clearMsProjectSearch();
    this.msPreviewResults.set([]);
    this.msPreviewColumns.set([]);
    this.msPreviewError.set('');
    this.msExecuteResults.set([]);
    this.msExecuteError.set('');
    // Reset move-projects mode
    this.moveProjectsMode.set('multiple');
    this.mpProjectEntryInput.set('');
    this.mpProjectIdList.set([]);
    this.mpTargetPolicyId.set('');
    this.mpTargetPolicyInput.set('');
    this.clearMpProjectListSearch();
    this.clearMpPolicyTargetSearch();
    this.mpMultiPreviewResults.set([]);
    this.mpMultiPreviewColumns.set([]);
    this.mpMultiPreviewError.set('');
    this.mpMultiExecuteResults.set([]);
    this.mpMultiExecuteError.set('');
    this.mpProjectIdInput.set('');
    this.mpPolicyIdInput.set('');
    this.mpPairList.set([]);
    this.clearMpProjectSearch();
    this.clearMpPolicySearch();
    this.mpPreviewResults.set([]);
    this.mpPreviewColumns.set([]);
    this.mpPreviewError.set('');
    this.mpExecuteResults.set([]);
    this.mpExecuteError.set('');
  }

  runPreviewQuery(): void {
    const wells = this.wellIdList();
    const siteId = this.targetSiteId();
    if (!wells.length || !siteId) {
      return;
    }

    this.previewLoading.set(true);
    this.previewError.set('');
    this.previewResults.set([]);
    this.previewColumns.set([]);

    const queries = wells.map(wellId => {
      const targetSite = this.getWellSiteId(wellId);
      const sql = selectFull(wellId, targetSite).trim();
      return this.db.executeQuery(sql);
    });

    forkJoin(queries).subscribe({
      next: (results) => {
        const allRows: Record<string, unknown>[] = [];
        let columns: string[] = [];
        for (const result of results) {
          if (result.columns.length && !columns.length) {
            columns = result.columns;
          }
          allRows.push(...result.rows);
        }
        this.previewColumns.set(columns);
        this.previewResults.set(allRows);
        this.previewLoading.set(false);
      },
      error: (err) => {
        this.previewError.set(err?.message ?? 'Preview query failed');
        this.previewLoading.set(false);
      }
    });
  }

  runExecuteMovement(): void {
    const wells = this.wellIdList();
    const previewRows = this.previewResults();
    if (!wells.length || !previewRows.length) {
      return;
    }

    this.executeLoading.set(true);
    this.executeError.set('');
    this.executeResults.set([]);

    const allSteps: { wellId: string; label: string; sql: string; binds?: Record<string, string> }[] = [];

    for (const row of previewRows) {
      const wellId = String(row['Well ID'] ?? '');
      const currPolicyId = String(row['Current Policy ID'] ?? '');
      const currProjId = String(row['Current Project ID'] ?? '');
      const currSiteId = String(row['Current Site ID'] ?? '');
      const newPolicyId = String(row['New Policy ID'] ?? '');
      const newProjId = String(row['New Project ID'] ?? '');
      const newSiteId = String(row['New Site ID'] ?? '');
      const newPolicyName = String(row['New Policy Name'] ?? '');

      // ── Move Wells to new site ──
      const moveWellsSqls = [
        updateWellSite(newSiteId, wellId, newPolicyId, newProjId).trim(),
        updateCdAttachmentJournal(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdChangeHistoryParentLocator(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdChangeHistoryItemLocator(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdPolylineHeader(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdSurveyProgram(wellId, currPolicyId, newPolicyId).trim(),
        updateCdSurveyHeader(wellId, currPolicyId, newPolicyId).trim(),
        updateCdSurveyStation(wellId, currProjId, newProjId).trim(),
        updateCdVerticalSection(wellId, currProjId, newProjId).trim(),
        updateWellUserDefined1(wellId, newPolicyName).trim()
      ];

      // ── Project Target Well associations ──
      const ptWellSqls = [
        insertDpProjectTargetWell(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        insertDpProjectTargetPointWell(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        updateCdProjTargWellLinkWell(newProjId, currProjId, wellId).trim()
      ];

      // ── Project Target Wellbore associations ──
      const ptWbSqls = [
        insertDpProjectTargetWellbore(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        insertDpProjectTargetPointWellbore(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        updateCdProjectTargetWbLinkWellbore(newProjId, currProjId, wellId).trim()
      ];

      // ── Project Target Design/Scenario associations ──
      const ptDesignSqls = [
        insertDpProjectTargetScenarioDesign(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        insertDpProjectTargetPointScenarioDesign(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        updateCdProjTargScenarioLinkDesign(newProjId, currProjId, wellId).trim()
      ];

      // Build labels for move-wells group
      const moveWellsLabels = [
        'Update Well Site', 'Update Attachment Journal',
        'Update CHJ Parent Locator', 'Update CHJ Item Locator',
        'Update Polyline Header', 'Update Survey Program',
        'Update Survey Header', 'Update Survey Station',
        'Update Vertical Section', 'Update Well User Defined 1'
      ];
      const ptWellLabels = ['Insert DP Project Target (Well)', 'Insert DP Target Point (Well)', 'Update Targ Well Link'];
      const ptWbLabels = ['Insert DP Project Target (Wellbore)', 'Insert DP Target Point (Wellbore)', 'Update Target WB Link'];
      const ptDesignLabels = ['Insert DP Project Target (Scenario)', 'Insert DP Target Point (Scenario)', 'Update Targ Scenario Link'];

      moveWellsSqls.forEach((sql, i) => allSteps.push({ wellId, label: moveWellsLabels[i], sql }));
      ptWellSqls.forEach((sql, i) => allSteps.push({ wellId, label: ptWellLabels[i], sql }));
      ptWbSqls.forEach((sql, i) => allSteps.push({ wellId, label: ptWbLabels[i], sql }));
      ptDesignSqls.forEach((sql, i) => allSteps.push({ wellId, label: ptDesignLabels[i], sql }));

      // ── Audit INSERT ──
      const generatedSql = selectFull(wellId, newSiteId).trim();
      const audit = insertWellMoveAudit(wellId, newSiteId, row, {
        generatedSql,
        sqlMoveWells: moveWellsSqls.join('\n'),
        sqlUpdatePtWell: ptWellSqls.join('\n'),
        sqlUpdatePtWb: ptWbSqls.join('\n'),
        sqlUpdatePtDesign: ptDesignSqls.join('\n')
      });
      allSteps.push({ wellId, label: 'Insert Audit Record', sql: audit.sql.trim(), binds: audit.binds });
    }

    const statements = allSteps.map(s => ({ sql: s.sql, label: s.label, wellId: s.wellId, binds: s.binds }));

    this.db.executeTransaction(statements).subscribe({
      next: (txResult) => {
        this.executeResults.set(
          txResult.results.map((r: TransactionResultRow) => ({
            wellId: r.wellId,
            label: r.label,
            success: r.success,
            error: r.error,
            sql: r.sql || ''
          }))
        );
        if (txResult.failedWells && txResult.failedWells.length) {
          const msgs = txResult.failedWells.map(
            (fw) => `Well ${fw.wellId}: "${fw.failedLabel}" — ${fw.error}`
          );
          this.executeError.set(
            `Rolled back ${txResult.failedWells.length} well(s):\n` + msgs.join('\n')
          );
          // Auto-expand failed wells
          const failedIds = new Set(txResult.failedWells.map(fw => fw.wellId));
          this.expandedExecuteWells.set(failedIds);
        }
        this.executeLoading.set(false);
      },
      error: (err) => {
        this.executeError.set(err?.error?.error ?? err?.message ?? 'Execution failed — all changes rolled back');
        this.executeLoading.set(false);
      }
    });
  }

  groupedExecuteResults(): { wellId: string; rows: ExecuteResultRow[]; allSuccess: boolean }[] {
    const results = this.executeResults();
    const map = new Map<string, ExecuteResultRow[]>();
    for (const row of results) {
      const list = map.get(row.wellId) || [];
      list.push(row);
      map.set(row.wellId, list);
    }
    return Array.from(map.entries()).map(([wellId, rows]) => ({
      wellId,
      rows,
      allSuccess: rows.every(r => r.success)
    }));
  }

  toggleExecuteWell(wellId: string): void {
    const current = this.expandedExecuteWells();
    const next = new Set(current);
    if (next.has(wellId)) {
      next.delete(wellId);
    } else {
      next.add(wellId);
    }
    this.expandedExecuteWells.set(next);
  }

  isExecuteWellExpanded(wellId: string): boolean {
    return this.expandedExecuteWells().has(wellId);
  }

  // ── Single Well Mode Methods ──

  runSingleWellSearch(): void {
    const apiNo = this.singleWellSearchInput().trim();
    if (!apiNo) { return; }
    this.singleWellSearchLoading.set(true);
    this.singleWellSearchError.set('');
    this.singleWellSearchResults.set(null);
    const sql = apiLookWellId(apiNo).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.singleWellSearchResults.set(result); this.singleWellSearchLoading.set(false); },
      error: (err) => { this.singleWellSearchError.set(err?.message ?? 'Search failed'); this.singleWellSearchLoading.set(false); }
    });
  }

  clearSingleWellSearch(): void {
    this.singleWellSearchInput.set('');
    this.singleWellSearchResults.set(null);
    this.singleWellSearchError.set('');
    this.showSingleWellSearch.set(false);
  }

  toggleSingleWellSearch(): void {
    const opening = !this.showSingleWellSearch();
    this.showSingleWellSearch.set(opening);
    if (opening) {
      this.showSingleSiteSearch.set(false);
    }
  }

  toggleSingleSiteSearch(): void {
    const opening = !this.showSingleSiteSearch();
    this.showSingleSiteSearch.set(opening);
    if (opening) {
      this.showSingleWellSearch.set(false);
    }
  }

  addSinglePair(): void {
    const wellId = this.singleWellId().trim();
    const siteId = this.singleSiteId().trim();
    if (!wellId || !siteId) { return; }
    this.singlePairList.set([...this.singlePairList(), { wellId, siteId }]);
    this.singleWellId.set('');
    this.singleSiteId.set('');
  }

  removeSinglePair(index: number): void {
    this.singlePairList.set(this.singlePairList().filter((_, i) => i !== index));
  }

  clearSingleAll(): void {
    this.singlePairList.set([]);
    this.singleWellId.set('');
    this.singleSiteId.set('');
    this.singleWellSearchInput.set('');
    this.singleWellSearchResults.set(null);
    this.singleWellSearchError.set('');
    this.singleSiteSearchInput.set('');
    this.singleSiteSearchResults.set(null);
    this.singleSiteSearchError.set('');
    this.singlePreviewResults.set([]);
    this.singlePreviewColumns.set([]);
    this.singlePreviewError.set('');
    this.singleExecuteResults.set([]);
    this.singleExecuteError.set('');
  }

  selectSingleWellFromResult(row: Record<string, unknown>): void {
    const id = String(row['WELL_ID'] ?? row['well_id'] ?? '');
    if (id) {
      this.singleWellId.set(id);
      this.singleWellSearchInput.set('');
      this.singleWellSearchResults.set(null);
      this.singleWellSearchError.set('');
      this.showSingleWellSearch.set(false);
    }
  }

  runSingleSiteSearch(): void {
    const siteId = this.singleSiteSearchInput().trim();
    if (!siteId) { return; }
    this.singleSiteSearchLoading.set(true);
    this.singleSiteSearchError.set('');
    this.singleSiteSearchResults.set(null);
    const sql = selectSiteInfo(siteId).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.singleSiteSearchResults.set(result); this.singleSiteSearchLoading.set(false); },
      error: (err) => { this.singleSiteSearchError.set(err?.message ?? 'Search failed'); this.singleSiteSearchLoading.set(false); }
    });
  }

  clearSingleSiteSearch(): void {
    this.singleSiteSearchInput.set('');
    this.singleSiteSearchResults.set(null);
    this.singleSiteSearchError.set('');
    this.showSingleSiteSearch.set(false);
  }

  selectSingleSiteFromResult(row: Record<string, unknown>): void {
    const siteId = String(row['Site ID'] ?? row['SITE_ID'] ?? row['site_id'] ?? '');
    if (siteId) {
      this.singleSiteId.set(siteId);
      this.singleSiteSearchInput.set('');
      this.singleSiteSearchResults.set(null);
      this.singleSiteSearchError.set('');
      this.showSingleSiteSearch.set(false);
    }
  }

  runSinglePreviewQuery(): void {
    const pairs = this.singlePairList();
    if (!pairs.length) { return; }

    this.singlePreviewLoading.set(true);
    this.singlePreviewError.set('');
    this.singlePreviewResults.set([]);
    this.singlePreviewColumns.set([]);

    const queries = pairs.map(pair => {
      const sql = selectFull(pair.wellId, pair.siteId).trim();
      return this.db.executeQuery(sql);
    });

    forkJoin(queries).subscribe({
      next: (results) => {
        const allRows: Record<string, unknown>[] = [];
        let columns: string[] = [];
        for (const result of results) {
          if (result.columns.length && !columns.length) {
            columns = result.columns;
          }
          allRows.push(...result.rows);
        }
        this.singlePreviewColumns.set(columns);
        this.singlePreviewResults.set(allRows);
        this.singlePreviewLoading.set(false);
      },
      error: (err) => {
        this.singlePreviewError.set(err?.message ?? 'Preview query failed');
        this.singlePreviewLoading.set(false);
      }
    });
  }

  runSingleExecuteMovement(): void {
    const previewRows = this.singlePreviewResults();
    if (!previewRows.length) { return; }

    this.singleExecuteLoading.set(true);
    this.singleExecuteError.set('');
    this.singleExecuteResults.set([]);

    const allSteps: { wellId: string; label: string; sql: string; binds?: Record<string, string> }[] = [];

    for (const row of previewRows) {
      const wellId = String(row['Well ID'] ?? '');
      const currPolicyId = String(row['Current Policy ID'] ?? '');
      const currProjId = String(row['Current Project ID'] ?? '');
      const currSiteId = String(row['Current Site ID'] ?? '');
      const newPolicyId = String(row['New Policy ID'] ?? '');
      const newProjId = String(row['New Project ID'] ?? '');
      const newSiteId = String(row['New Site ID'] ?? '');
      const newPolicyName = String(row['New Policy Name'] ?? '');

      const moveWellsSqls = [
        updateWellSite(newSiteId, wellId, newPolicyId, newProjId).trim(),
        updateCdAttachmentJournal(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdChangeHistoryParentLocator(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdChangeHistoryItemLocator(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdPolylineHeader(currPolicyId, currProjId, currSiteId, wellId, newPolicyId, newProjId, newSiteId).trim(),
        updateCdSurveyProgram(wellId, currPolicyId, newPolicyId).trim(),
        updateCdSurveyHeader(wellId, currPolicyId, newPolicyId).trim(),
        updateCdSurveyStation(wellId, currProjId, newProjId).trim(),
        updateCdVerticalSection(wellId, currProjId, newProjId).trim(),
        updateWellUserDefined1(wellId, newPolicyName).trim()
      ];
      const ptWellSqls = [
        insertDpProjectTargetWell(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        insertDpProjectTargetPointWell(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        updateCdProjTargWellLinkWell(newProjId, currProjId, wellId).trim()
      ];
      const ptWbSqls = [
        insertDpProjectTargetWellbore(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        insertDpProjectTargetPointWellbore(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        updateCdProjectTargetWbLinkWellbore(newProjId, currProjId, wellId).trim()
      ];
      const ptDesignSqls = [
        insertDpProjectTargetScenarioDesign(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        insertDpProjectTargetPointScenarioDesign(newProjId, currProjId, newSiteId, wellId, newPolicyId).trim(),
        updateCdProjTargScenarioLinkDesign(newProjId, currProjId, wellId).trim()
      ];

      const moveWellsLabels = [
        'Update Well Site', 'Update Attachment Journal',
        'Update CHJ Parent Locator', 'Update CHJ Item Locator',
        'Update Polyline Header', 'Update Survey Program',
        'Update Survey Header', 'Update Survey Station',
        'Update Vertical Section', 'Update Well User Defined 1'
      ];
      const ptWellLabels = ['Insert DP Project Target (Well)', 'Insert DP Target Point (Well)', 'Update Targ Well Link'];
      const ptWbLabels = ['Insert DP Project Target (Wellbore)', 'Insert DP Target Point (Wellbore)', 'Update Target WB Link'];
      const ptDesignLabels = ['Insert DP Project Target (Scenario)', 'Insert DP Target Point (Scenario)', 'Update Targ Scenario Link'];

      moveWellsSqls.forEach((sql, i) => allSteps.push({ wellId, label: moveWellsLabels[i], sql }));
      ptWellSqls.forEach((sql, i) => allSteps.push({ wellId, label: ptWellLabels[i], sql }));
      ptWbSqls.forEach((sql, i) => allSteps.push({ wellId, label: ptWbLabels[i], sql }));
      ptDesignSqls.forEach((sql, i) => allSteps.push({ wellId, label: ptDesignLabels[i], sql }));

      const generatedSql = selectFull(wellId, newSiteId).trim();
      const audit = insertWellMoveAudit(wellId, newSiteId, row, {
        generatedSql,
        sqlMoveWells: moveWellsSqls.join('\n'),
        sqlUpdatePtWell: ptWellSqls.join('\n'),
        sqlUpdatePtWb: ptWbSqls.join('\n'),
        sqlUpdatePtDesign: ptDesignSqls.join('\n')
      });
      allSteps.push({ wellId, label: 'Insert Audit Record', sql: audit.sql.trim(), binds: audit.binds });
    }

    const statements = allSteps.map(s => ({ sql: s.sql, label: s.label, wellId: s.wellId, binds: s.binds }));

    this.db.executeTransaction(statements).subscribe({
      next: (txResult) => {
        this.singleExecuteResults.set(
          txResult.results.map((r: TransactionResultRow) => ({
            wellId: r.wellId, label: r.label, success: r.success, error: r.error, sql: r.sql || ''
          }))
        );
        if (txResult.failedWells && txResult.failedWells.length) {
          const msgs = txResult.failedWells.map(fw => `Well ${fw.wellId}: "${fw.failedLabel}" — ${fw.error}`);
          this.singleExecuteError.set(`Rolled back:\\n` + msgs.join('\\n'));
          this.expandedSingleExecuteWells.set(new Set(txResult.failedWells.map(fw => fw.wellId)));
        }
        this.singleExecuteLoading.set(false);
      },
      error: (err) => {
        this.singleExecuteError.set(err?.error?.error ?? err?.message ?? 'Execution failed');
        this.singleExecuteLoading.set(false);
      }
    });
  }

  groupedSingleExecuteResults(): { wellId: string; rows: ExecuteResultRow[]; allSuccess: boolean }[] {
    const results = this.singleExecuteResults();
    const map = new Map<string, ExecuteResultRow[]>();
    for (const row of results) {
      const list = map.get(row.wellId) || [];
      list.push(row);
      map.set(row.wellId, list);
    }
    return Array.from(map.entries()).map(([wellId, rows]) => ({
      wellId, rows, allSuccess: rows.every(r => r.success)
    }));
  }

  toggleSingleExecuteWell(wellId: string): void {
    const current = this.expandedSingleExecuteWells();
    const next = new Set(current);
    if (next.has(wellId)) { next.delete(wellId); } else { next.add(wellId); }
    this.expandedSingleExecuteWells.set(next);
  }

  isSingleExecuteWellExpanded(wellId: string): boolean {
    return this.expandedSingleExecuteWells().has(wellId);
  }

  runSearch(): void {
    const wellId = this.wellIdInput().trim();
    if (wellId) {
      const sql = apiLookWellId(wellId).trim();
      this.generatedQuery.set(sql);
      this.showQuery.set(false);
      this.copyLabel.set('Copy');
      this.queryLoading.set(true);
      this.queryError.set('');
      this.queryResults.set(null);

      this.db.executeQuery(sql).subscribe({
        next: (result) => {
          this.queryResults.set(result);
          this.queryLoading.set(false);
        },
        error: (err) => {
          this.queryError.set(err?.message ?? 'Query failed');
          this.queryLoading.set(false);
        }
      });
      this.wellIdInput.set('');
    }
  }

  clearSearch(): void {
    this.wellIdInput.set('');
    this.newSiteIdInput.set('');
    this.generatedQuery.set('');
    this.copyLabel.set('Copy');
    this.showQuery.set(false);
    this.showSearch.set(false);
    this.queryResults.set(null);
    this.queryError.set('');
  }

  runSiteSearch(): void {
    const siteId = this.siteIdInput().trim();
    if (siteId) {
      const sql = selectSiteInfo(siteId).trim();
      this.generatedSiteQuery.set(sql);
      this.copySiteLabel.set('Copy');
      this.siteQueryLoading.set(true);
      this.siteQueryError.set('');
      this.siteQueryResults.set(null);

      this.db.executeQuery(sql).subscribe({
        next: (result) => {
          this.siteQueryResults.set(result);
          this.siteQueryLoading.set(false);
        },
        error: (err) => {
          this.siteQueryError.set(err?.message ?? 'Query failed');
          this.siteQueryLoading.set(false);
        }
      });
    }
  }

  clearSiteSearch(): void {
    this.siteIdInput.set('');
    this.generatedSiteQuery.set('');
    this.copySiteLabel.set('Copy');
    this.showSiteQuery.set(false);
    this.showSearchSite.set(false);
    this.siteQueryResults.set(null);
    this.siteQueryError.set('');
  }

  copySiteQuery(): void {
    navigator.clipboard.writeText(this.generatedSiteQuery()).then(() => {
      this.copySiteLabel.set('Copied!');
      setTimeout(() => this.copySiteLabel.set('Copy'), 2000);
    });
  }

  addWellEntry(): void {
    const value = this.wellEntryInput().trim();
    if (value && !this.wellIdList().includes(value)) {
      this.wellIdList.set([...this.wellIdList(), value]);
    }
    this.wellEntryInput.set('');
  }

  removeWellEntry(index: number): void {
    this.wellIdList.set(this.wellIdList().filter((_, i) => i !== index));
  }

  isWellInList(row: Record<string, unknown>): boolean {
    const id = String(row['WELL_ID'] ?? row['well_id'] ?? '');
    return this.wellIdList().includes(id);
  }

  addResultToList(row: Record<string, unknown>): void {
    const id = String(row['WELL_ID'] ?? row['well_id'] ?? '');
    if (id && !this.wellIdList().includes(id)) {
      this.wellIdList.set([...this.wellIdList(), id]);
    }
  }

  updateTargetSiteId(): void {
    // Target site ID is already bound via signal; this confirms the value.
  }

  setTargetSiteId(): void {
    const value = this.targetSiteInput().trim();
    if (value) {
      this.targetSiteId.set(value);
      this.targetSiteInput.set('');
    }
  }

  removeTargetSite(): void {
    this.targetSiteId.set('');
    this.clearSiteSearch();
  }

  selectSiteFromResult(row: Record<string, unknown>): void {
    const siteId = String(row['Site ID'] ?? row['SITE_ID'] ?? row['site_id'] ?? '');
    if (siteId) {
      this.targetSiteId.set(siteId);
    }
  }

  getWellSiteId(wellId: string): string {
    return this.wellSiteOverrides()[wellId] || this.targetSiteId();
  }

  updateWellSiteOverride(wellId: string, siteId: string): void {
    this.wellSiteOverrides.set({ ...this.wellSiteOverrides(), [wellId]: siteId });
  }

  toggleSummarySearch(index: number): void {
    if (this.summarySearchIndex() === index) {
      this.summarySearchIndex.set(null);
      this.summarySearchInput.set('');
      this.summarySearchResults.set(null);
      this.summarySearchError.set('');
    } else {
      this.summarySearchIndex.set(index);
      this.summarySearchInput.set('');
      this.summarySearchResults.set(null);
      this.summarySearchError.set('');
    }
  }

  runSummarySearch(): void {
    const siteId = this.summarySearchInput().trim();
    if (siteId) {
      const sql = selectSiteInfo(siteId).trim();
      this.summarySearchLoading.set(true);
      this.summarySearchError.set('');
      this.summarySearchResults.set(null);

      this.db.executeQuery(sql).subscribe({
        next: (result) => {
          this.summarySearchResults.set(result);
          this.summarySearchLoading.set(false);
        },
        error: (err) => {
          this.summarySearchError.set(err?.message ?? 'Query failed');
          this.summarySearchLoading.set(false);
        }
      });
    }
  }

  selectSummarySearchResult(wellId: string, row: Record<string, unknown>): void {
    const siteId = String(row['Site ID'] ?? row['SITE_ID'] ?? row['site_id'] ?? '');
    if (siteId) {
      this.updateWellSiteOverride(wellId, siteId);
      this.summarySearchIndex.set(null);
      this.summarySearchInput.set('');
      this.summarySearchResults.set(null);
      this.summarySearchError.set('');
    }
  }

  copyQuery(): void {
    navigator.clipboard.writeText(this.generatedQuery()).then(() => {
      this.copyLabel.set('Copied!');
      setTimeout(() => this.copyLabel.set('Copy'), 2000);
    });
  }
  
  // ── Move Sites methods ── (Multiple mode: many sites → one project)

  addMsSiteEntry(): void {
    const val = this.msSiteEntryInput().trim();
    if (!val) { return; }
    if (!this.msSiteIdList().includes(val)) {
      this.msSiteIdList.set([...this.msSiteIdList(), val]);
    }
    this.msSiteEntryInput.set('');
  }

  removeMsSiteEntry(index: number): void {
    this.msSiteIdList.set(this.msSiteIdList().filter((_, i) => i !== index));
  }

  setMsTargetProjectId(): void {
    const val = this.msTargetProjectInput().trim();
    if (val) { this.msTargetProjectId.set(val); }
  }

  removeMsTargetProject(): void {
    this.msTargetProjectId.set('');
    this.msTargetProjectInput.set('');
  }

  addMsSiteFromResult(row: Record<string, unknown>): void {
    const id = String(row['Site ID'] ?? row['SITE_ID'] ?? row['site_id'] ?? '');
    if (id && !this.msSiteIdList().includes(id)) {
      this.msSiteIdList.set([...this.msSiteIdList(), id]);
    }
  }

  runMsSiteListSearch(): void {
    const input = this.msSiteListSearchInput().trim();
    if (!input) { return; }
    this.msSiteListSearchLoading.set(true);
    this.msSiteListSearchError.set('');
    this.msSiteListSearchResults.set(null);
    const sql = msSearchSiteId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.msSiteListSearchResults.set(result); this.msSiteListSearchLoading.set(false); },
      error: (err) => { this.msSiteListSearchError.set(err?.message ?? 'Search failed'); this.msSiteListSearchLoading.set(false); }
    });
  }

  clearMsMultiAll(): void {
    this.msSiteIdList.set([]);
    this.msSiteEntryInput.set('');
    this.msTargetProjectId.set('');
    this.msTargetProjectInput.set('');
    this.clearMsSiteListSearch();
    this.clearMsProjectTargetSearch();
    this.msMultiPreviewResults.set([]);
    this.msMultiPreviewColumns.set([]);
    this.msMultiPreviewError.set('');
    this.msMultiExecuteResults.set([]);
    this.msMultiExecuteError.set('');
  }

  clearMsSingleAll(): void {
    this.msPairList.set([]);
    this.msSiteIdInput.set('');
    this.msProjectIdInput.set('');
    this.clearMsSiteSearch();
    this.clearMsProjectSearch();
    this.msPreviewResults.set([]);
    this.msPreviewColumns.set([]);
    this.msPreviewError.set('');
    this.msExecuteResults.set([]);
    this.msExecuteError.set('');
  }

  clearMsSiteListSearch(): void {
    this.msSiteListSearchInput.set('');
    this.msSiteListSearchResults.set(null);
    this.msSiteListSearchError.set('');
    this.msShowSiteListSearch.set(false);
  }

  toggleMsSiteListSearch(): void {
    const opening = !this.msShowSiteListSearch();
    this.msShowSiteListSearch.set(opening);
    if (opening) {
      this.msShowProjectTargetSearch.set(false);
    }
  }

  toggleMsProjectTargetSearch(): void {
    const opening = !this.msShowProjectTargetSearch();
    this.msShowProjectTargetSearch.set(opening);
    if (opening) {
      this.msShowSiteListSearch.set(false);
    }
  }

  runMsProjectTargetSearch(): void {
    const input = this.msProjectTargetSearchInput().trim();
    if (!input) { return; }
    this.msProjectTargetSearchLoading.set(true);
    this.msProjectTargetSearchError.set('');
    this.msProjectTargetSearchResults.set(null);
    const sql = msSearchProjectId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.msProjectTargetSearchResults.set(result); this.msProjectTargetSearchLoading.set(false); },
      error: (err) => { this.msProjectTargetSearchError.set(err?.message ?? 'Search failed'); this.msProjectTargetSearchLoading.set(false); }
    });
  }

  clearMsProjectTargetSearch(): void {
    this.msProjectTargetSearchInput.set('');
    this.msProjectTargetSearchResults.set(null);
    this.msProjectTargetSearchError.set('');
    this.msShowProjectTargetSearch.set(false);
  }

  selectMsTargetProjectFromResult(row: Record<string, unknown>): void {
    const id = String(row['Project ID'] ?? row['PROJECT_ID'] ?? row['project_id'] ?? '');
    if (id) {
      this.msTargetProjectId.set(id);
      this.msTargetProjectInput.set(id);
    }
  }

  runMsMultiPreviewQuery(): void {
    const sites = this.msSiteIdList();
    const projectId = this.msTargetProjectId();
    if (!sites.length || !projectId) { return; }

    this.msMultiPreviewLoading.set(true);
    this.msMultiPreviewError.set('');
    this.msMultiPreviewResults.set([]);
    this.msMultiPreviewColumns.set([]);

    const queries = sites.map(siteId => {
      const sql = msSelectFullSite(siteId, projectId).trim();
      return this.db.executeQuery(sql);
    });

    forkJoin(queries).subscribe({
      next: (results) => {
        const allRows: Record<string, unknown>[] = [];
        let columns: string[] = [];
        for (const result of results) {
          if (result.columns.length && !columns.length) {
            columns = result.columns;
          }
          allRows.push(...result.rows);
        }
        this.msMultiPreviewColumns.set(columns);
        this.msMultiPreviewResults.set(allRows);
        this.msMultiPreviewLoading.set(false);
      },
      error: (err) => {
        this.msMultiPreviewError.set(err?.message ?? 'Preview query failed');
        this.msMultiPreviewLoading.set(false);
      }
    });
  }

  runMsMultiExecuteMovement(): void {
    const previewRows = this.msMultiPreviewResults();
    if (!previewRows.length) { return; }

    this.msMultiExecuteLoading.set(true);
    this.msMultiExecuteError.set('');
    this.msMultiExecuteResults.set([]);

    const allSteps: { wellId: string; label: string; sql: string; binds?: Record<string, string> }[] = [];

    for (const row of previewRows) {
      const siteId = String(row['Site ID'] ?? '');
      const currPolicyId = String(row['Current Policy ID'] ?? '');
      const currProjId = String(row['Current Project ID'] ?? '');
      const newProjId = String(row['New Project ID'] ?? '');
      const policyId = String(row['New Policy ID'] ?? currPolicyId);
      const currProjName = String(row['Current Project Name'] ?? '');
      const newProjName = String(row['New Project Name'] ?? '');

      const moveSiteSqls = [
        msUpdateCdSite(newProjId, siteId, currProjId, policyId, currProjName, newProjName).trim(),
        msInsertCdWellStatus(policyId, currProjId, siteId, newProjId).trim(),
        msUpdateCdAttachmentJournal(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdChangeHistoryParentLocator(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdChangeHistoryItemLocator(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdPolylineHeader(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdSurveyProgram(siteId, policyId).trim(),
        msUpdateCdSurveyHeader(siteId, policyId).trim(),
        msUpdateCdSurveyStation(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdVerticalSection(newProjId, currProjId, siteId, policyId).trim()
      ];
      const moveSiteLabels = [
        'Update Site Project', 'Insert Well Status',
        'Update Attachment Journal', 'Update CHJ Parent Locator',
        'Update CHJ Item Locator', 'Update Polyline Header',
        'Update Survey Program', 'Update Survey Header',
        'Update Survey Station', 'Update Vertical Section'
      ];

      const ptSiteSqls = [
        msInsertDpProjectTargetSite(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointSite(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjectTargetSiteLink(newProjId, currProjId, siteId).trim()
      ];
      const ptSiteLabels = ['Insert DP Project Target (Site)', 'Insert DP Target Point (Site)', 'Update Target Site Link'];

      const ptWellSqls = [
        msInsertDpProjectTargetWell(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointWell(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjTargWellLink(newProjId, currProjId, siteId).trim()
      ];
      const ptWellLabels = ['Insert DP Project Target (Well)', 'Insert DP Target Point (Well)', 'Update Targ Well Link'];

      const ptWbSqls = [
        msInsertDpProjectTargetWellbore(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointWellbore(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjectTargetWbLink(newProjId, currProjId, siteId).trim()
      ];
      const ptWbLabels = ['Insert DP Project Target (Wellbore)', 'Insert DP Target Point (Wellbore)', 'Update Target WB Link'];

      const ptDesignSqls = [
        msInsertDpProjectTargetScenario(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointScenario(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjTargScenarioLink(newProjId, currProjId, siteId).trim()
      ];
      const ptDesignLabels = ['Insert DP Project Target (Scenario)', 'Insert DP Target Point (Scenario)', 'Update Targ Scenario Link'];

      moveSiteSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: moveSiteLabels[i], sql }));
      ptSiteSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptSiteLabels[i], sql }));
      ptWellSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptWellLabels[i], sql }));
      ptWbSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptWbLabels[i], sql }));
      ptDesignSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptDesignLabels[i], sql }));

      // ── Audit INSERT ──
      const generatedSql = msSelectFullSite(siteId, newProjId).trim();
      const audit = insertSiteMoveAudit(siteId, newProjId, row, {
        generatedSql,
        sqlMoveSites: moveSiteSqls.join('\n'),
        sqlUpdatePtSite: ptSiteSqls.join('\n'),
        sqlUpdatePtWell: ptWellSqls.join('\n'),
        sqlUpdatePtWb: ptWbSqls.join('\n'),
        sqlUpdatePtDesign: ptDesignSqls.join('\n')
      });
      allSteps.push({ wellId: siteId, label: 'Insert Audit Record', sql: audit.sql.trim(), binds: audit.binds });
    }

    const statements = allSteps.map(s => ({ sql: s.sql, label: s.label, wellId: s.wellId, binds: s.binds }));

    this.db.executeTransaction(statements).subscribe({
      next: (txResult) => {
        this.msMultiExecuteResults.set(
          txResult.results.map((r: TransactionResultRow) => ({
            siteId: r.wellId, label: r.label, success: r.success, error: r.error, sql: r.sql || ''
          }))
        );
        if (txResult.failedWells && txResult.failedWells.length) {
          const msgs = txResult.failedWells.map(fw => `Site ${fw.wellId}: "${fw.failedLabel}" — ${fw.error}`);
          this.msMultiExecuteError.set(`Rolled back:\n` + msgs.join('\n'));
          this.expandedMsMultiExecuteSites.set(new Set(txResult.failedWells.map(fw => fw.wellId)));
        }
        this.msMultiExecuteLoading.set(false);
      },
      error: (err) => {
        this.msMultiExecuteError.set(err?.error?.error ?? err?.message ?? 'Execution failed');
        this.msMultiExecuteLoading.set(false);
      }
    });
  }

  groupedMsMultiExecuteResults(): { siteId: string; rows: { siteId: string; label: string; success: boolean; error: string; sql: string }[]; allSuccess: boolean }[] {
    const results = this.msMultiExecuteResults();
    const map = new Map<string, { siteId: string; label: string; success: boolean; error: string; sql: string }[]>();
    for (const row of results) {
      const list = map.get(row.siteId) || [];
      list.push(row);
      map.set(row.siteId, list);
    }
    return Array.from(map.entries()).map(([siteId, rows]) => ({
      siteId, rows, allSuccess: rows.every(r => r.success)
    }));
  }

  toggleMsMultiExecuteSite(siteId: string): void {
    const current = this.expandedMsMultiExecuteSites();
    const next = new Set(current);
    if (next.has(siteId)) { next.delete(siteId); } else { next.add(siteId); }
    this.expandedMsMultiExecuteSites.set(next);
  }

  isMsMultiExecuteSiteExpanded(siteId: string): boolean {
    return this.expandedMsMultiExecuteSites().has(siteId);
  }

  // (Single mode: each site → own project)

  addSitePair(): void {
    const siteId = this.msSiteIdInput().trim();
    const projectId = this.msProjectIdInput().trim();
    if (!siteId || !projectId) { return; }
    this.msPairList.set([...this.msPairList(), { siteId, projectId }]);
    this.msSiteIdInput.set('');
    this.msProjectIdInput.set('');
  }

  removeSitePair(index: number): void {
    this.msPairList.set(this.msPairList().filter((_, i) => i !== index));
  }

  runMsSiteSearch(): void {
    const input = this.msSiteSearchInput().trim();
    if (!input) { return; }
    this.msSiteSearchLoading.set(true);
    this.msSiteSearchError.set('');
    this.msSiteSearchResults.set(null);
    const sql = msSearchSiteId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.msSiteSearchResults.set(result); this.msSiteSearchLoading.set(false); },
      error: (err) => { this.msSiteSearchError.set(err?.message ?? 'Search failed'); this.msSiteSearchLoading.set(false); }
    });
  }

  clearMsSiteSearch(): void {
    this.msSiteSearchInput.set('');
    this.msSiteSearchResults.set(null);
    this.msSiteSearchError.set('');
    this.msShowSiteSearch.set(false);
  }

  toggleMsSiteSearch(): void {
    const opening = !this.msShowSiteSearch();
    this.msShowSiteSearch.set(opening);
    if (opening) {
      this.msShowProjectSearch.set(false);
    }
  }

  toggleMsProjectSearch(): void {
    const opening = !this.msShowProjectSearch();
    this.msShowProjectSearch.set(opening);
    if (opening) {
      this.msShowSiteSearch.set(false);
    }
  }

  selectMsSiteFromResult(row: Record<string, unknown>): void {
    const id = String(row['Site ID'] ?? row['SITE_ID'] ?? row['site_id'] ?? '');
    if (id) { this.msSiteIdInput.set(id); }
  }

  runMsProjectSearch(): void {
    const input = this.msProjectSearchInput().trim();
    if (!input) { return; }
    this.msProjectSearchLoading.set(true);
    this.msProjectSearchError.set('');
    this.msProjectSearchResults.set(null);
    const sql = msSearchProjectId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.msProjectSearchResults.set(result); this.msProjectSearchLoading.set(false); },
      error: (err) => { this.msProjectSearchError.set(err?.message ?? 'Search failed'); this.msProjectSearchLoading.set(false); }
    });
  }

  clearMsProjectSearch(): void {
    this.msProjectSearchInput.set('');
    this.msProjectSearchResults.set(null);
    this.msProjectSearchError.set('');
    this.msShowProjectSearch.set(false);
  }

  selectMsProjectFromResult(row: Record<string, unknown>): void {
    const id = String(row['Project ID'] ?? row['PROJECT_ID'] ?? row['project_id'] ?? '');
    if (id) { this.msProjectIdInput.set(id); }
  }

  runMsPreviewQuery(): void {
    const pairs = this.msPairList();
    if (!pairs.length) { return; }

    this.msPreviewLoading.set(true);
    this.msPreviewError.set('');
    this.msPreviewResults.set([]);
    this.msPreviewColumns.set([]);

    const queries = pairs.map(pair => {
      const sql = msSelectFullSite(pair.siteId, pair.projectId).trim();
      return this.db.executeQuery(sql);
    });

    forkJoin(queries).subscribe({
      next: (results) => {
        const allRows: Record<string, unknown>[] = [];
        let columns: string[] = [];
        for (const result of results) {
          if (result.columns.length && !columns.length) {
            columns = result.columns;
          }
          allRows.push(...result.rows);
        }
        this.msPreviewColumns.set(columns);
        this.msPreviewResults.set(allRows);
        this.msPreviewLoading.set(false);
      },
      error: (err) => {
        this.msPreviewError.set(err?.message ?? 'Preview query failed');
        this.msPreviewLoading.set(false);
      }
    });
  }

  runMsExecuteMovement(): void {
    const previewRows = this.msPreviewResults();
    if (!previewRows.length) { return; }

    this.msExecuteLoading.set(true);
    this.msExecuteError.set('');
    this.msExecuteResults.set([]);

    const allSteps: { wellId: string; label: string; sql: string; binds?: Record<string, string> }[] = [];

    for (const row of previewRows) {
      const siteId = String(row['Site ID'] ?? '');
      const currPolicyId = String(row['Current Policy ID'] ?? '');
      const currProjId = String(row['Current Project ID'] ?? '');
      const newProjId = String(row['New Project ID'] ?? '');
      const policyId = String(row['New Policy ID'] ?? currPolicyId);
      const currProjName = String(row['Current Project Name'] ?? '');
      const newProjName = String(row['New Project Name'] ?? '');

      const moveSiteSqls = [
        msUpdateCdSite(newProjId, siteId, currProjId, policyId, currProjName, newProjName).trim(),
        msInsertCdWellStatus(policyId, currProjId, siteId, newProjId).trim(),
        msUpdateCdAttachmentJournal(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdChangeHistoryParentLocator(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdChangeHistoryItemLocator(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdPolylineHeader(policyId, currProjId, newProjId, siteId).trim(),
        msUpdateCdSurveyProgram(siteId, policyId).trim(),
        msUpdateCdSurveyHeader(siteId, policyId).trim(),
        msUpdateCdSurveyStation(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdVerticalSection(newProjId, currProjId, siteId, policyId).trim()
      ];
      const moveSiteLabels = [
        'Update Site Project', 'Insert Well Status',
        'Update Attachment Journal', 'Update CHJ Parent Locator',
        'Update CHJ Item Locator', 'Update Polyline Header',
        'Update Survey Program', 'Update Survey Header',
        'Update Survey Station', 'Update Vertical Section'
      ];

      const ptSiteSqls = [
        msInsertDpProjectTargetSite(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointSite(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjectTargetSiteLink(newProjId, currProjId, siteId).trim()
      ];
      const ptSiteLabels = ['Insert DP Project Target (Site)', 'Insert DP Target Point (Site)', 'Update Target Site Link'];

      const ptWellSqls = [
        msInsertDpProjectTargetWell(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointWell(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjTargWellLink(newProjId, currProjId, siteId).trim()
      ];
      const ptWellLabels = ['Insert DP Project Target (Well)', 'Insert DP Target Point (Well)', 'Update Targ Well Link'];

      const ptWbSqls = [
        msInsertDpProjectTargetWellbore(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointWellbore(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjectTargetWbLink(newProjId, currProjId, siteId).trim()
      ];
      const ptWbLabels = ['Insert DP Project Target (Wellbore)', 'Insert DP Target Point (Wellbore)', 'Update Target WB Link'];

      const ptDesignSqls = [
        msInsertDpProjectTargetScenario(newProjId, currProjId, siteId, policyId).trim(),
        msInsertDpProjectTargetPointScenario(newProjId, currProjId, siteId, policyId).trim(),
        msUpdateCdProjTargScenarioLink(newProjId, currProjId, siteId).trim()
      ];
      const ptDesignLabels = ['Insert DP Project Target (Scenario)', 'Insert DP Target Point (Scenario)', 'Update Targ Scenario Link'];

      moveSiteSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: moveSiteLabels[i], sql }));
      ptSiteSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptSiteLabels[i], sql }));
      ptWellSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptWellLabels[i], sql }));
      ptWbSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptWbLabels[i], sql }));
      ptDesignSqls.forEach((sql, i) => allSteps.push({ wellId: siteId, label: ptDesignLabels[i], sql }));

      // ── Audit INSERT ──
      const generatedSql = msSelectFullSite(siteId, newProjId).trim();
      const audit = insertSiteMoveAudit(siteId, newProjId, row, {
        generatedSql,
        sqlMoveSites: moveSiteSqls.join('\n'),
        sqlUpdatePtSite: ptSiteSqls.join('\n'),
        sqlUpdatePtWell: ptWellSqls.join('\n'),
        sqlUpdatePtWb: ptWbSqls.join('\n'),
        sqlUpdatePtDesign: ptDesignSqls.join('\n')
      });
      allSteps.push({ wellId: siteId, label: 'Insert Audit Record', sql: audit.sql.trim(), binds: audit.binds });
    }

    const statements = allSteps.map(s => ({ sql: s.sql, label: s.label, wellId: s.wellId, binds: s.binds }));

    this.db.executeTransaction(statements).subscribe({
      next: (txResult) => {
        this.msExecuteResults.set(
          txResult.results.map((r: TransactionResultRow) => ({
            siteId: r.wellId, label: r.label, success: r.success, error: r.error, sql: r.sql || ''
          }))
        );
        if (txResult.failedWells && txResult.failedWells.length) {
          const msgs = txResult.failedWells.map(fw => `Site ${fw.wellId}: "${fw.failedLabel}" — ${fw.error}`);
          this.msExecuteError.set(`Rolled back:\n` + msgs.join('\n'));
          this.expandedMsExecuteSites.set(new Set(txResult.failedWells.map(fw => fw.wellId)));
        }
        this.msExecuteLoading.set(false);
      },
      error: (err) => {
        this.msExecuteError.set(err?.error?.error ?? err?.message ?? 'Execution failed');
        this.msExecuteLoading.set(false);
      }
    });
  }

  groupedMsExecuteResults(): { siteId: string; rows: { siteId: string; label: string; success: boolean; error: string; sql: string }[]; allSuccess: boolean }[] {
    const results = this.msExecuteResults();
    const map = new Map<string, { siteId: string; label: string; success: boolean; error: string; sql: string }[]>();
    for (const row of results) {
      const list = map.get(row.siteId) || [];
      list.push(row);
      map.set(row.siteId, list);
    }
    return Array.from(map.entries()).map(([siteId, rows]) => ({
      siteId, rows, allSuccess: rows.every(r => r.success)
    }));
  }

  toggleMsExecuteSite(siteId: string): void {
    const current = this.expandedMsExecuteSites();
    const next = new Set(current);
    if (next.has(siteId)) { next.delete(siteId); } else { next.add(siteId); }
    this.expandedMsExecuteSites.set(next);
  }

  isMsExecuteSiteExpanded(siteId: string): boolean {
    return this.expandedMsExecuteSites().has(siteId);
  }

  // ── Move Projects methods ── (Multiple mode: many projects → one business unit)

  addMpProjectEntry(): void {
    const val = this.mpProjectEntryInput().trim();
    if (!val) { return; }
    if (!this.mpProjectIdList().includes(val)) {
      this.mpProjectIdList.set([...this.mpProjectIdList(), val]);
    }
    this.mpProjectEntryInput.set('');
  }

  removeMpProjectEntry(index: number): void {
    this.mpProjectIdList.set(this.mpProjectIdList().filter((_, i) => i !== index));
  }

  setMpTargetPolicyId(): void {
    const val = this.mpTargetPolicyInput().trim();
    if (val) { this.mpTargetPolicyId.set(val); }
  }

  removeMpTargetPolicy(): void {
    this.mpTargetPolicyId.set('');
    this.mpTargetPolicyInput.set('');
  }

  addMpProjectFromResult(row: Record<string, unknown>): void {
    const id = String(row['Project ID'] ?? row['PROJECT_ID'] ?? row['project_id'] ?? '');
    if (id && !this.mpProjectIdList().includes(id)) {
      this.mpProjectIdList.set([...this.mpProjectIdList(), id]);
    }
  }

  runMpProjectListSearch(): void {
    const input = this.mpProjectListSearchInput().trim();
    if (!input) { return; }
    this.mpProjectListSearchLoading.set(true);
    this.mpProjectListSearchError.set('');
    this.mpProjectListSearchResults.set(null);
    const sql = mpSearchProjectId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.mpProjectListSearchResults.set(result); this.mpProjectListSearchLoading.set(false); },
      error: (err) => { this.mpProjectListSearchError.set(err?.message ?? 'Search failed'); this.mpProjectListSearchLoading.set(false); }
    });
  }

  clearMpMultiAll(): void {
    this.mpProjectIdList.set([]);
    this.mpProjectEntryInput.set('');
    this.mpTargetPolicyId.set('');
    this.mpTargetPolicyInput.set('');
    this.clearMpProjectListSearch();
    this.clearMpPolicyTargetSearch();
    this.mpMultiPreviewResults.set([]);
    this.mpMultiPreviewColumns.set([]);
    this.mpMultiPreviewError.set('');
    this.mpMultiExecuteResults.set([]);
    this.mpMultiExecuteError.set('');
  }

  clearMpSingleAll(): void {
    this.mpPairList.set([]);
    this.mpProjectIdInput.set('');
    this.mpPolicyIdInput.set('');
    this.clearMpProjectSearch();
    this.clearMpPolicySearch();
    this.mpPreviewResults.set([]);
    this.mpPreviewColumns.set([]);
    this.mpPreviewError.set('');
    this.mpExecuteResults.set([]);
    this.mpExecuteError.set('');
  }

  clearMpProjectListSearch(): void {
    this.mpProjectListSearchInput.set('');
    this.mpProjectListSearchResults.set(null);
    this.mpProjectListSearchError.set('');
    this.mpShowProjectListSearch.set(false);
  }

  toggleMpProjectListSearch(): void {
    const opening = !this.mpShowProjectListSearch();
    this.mpShowProjectListSearch.set(opening);
    if (opening) {
      this.mpShowPolicyTargetSearch.set(false);
    }
  }

  toggleMpPolicyTargetSearch(): void {
    const opening = !this.mpShowPolicyTargetSearch();
    this.mpShowPolicyTargetSearch.set(opening);
    if (opening) {
      this.mpShowProjectListSearch.set(false);
    }
  }

  runMpPolicyTargetSearch(): void {
    const input = this.mpPolicyTargetSearchInput().trim();
    if (!input) { return; }
    this.mpPolicyTargetSearchLoading.set(true);
    this.mpPolicyTargetSearchError.set('');
    this.mpPolicyTargetSearchResults.set(null);
    const sql = mpSearchPolicyId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.mpPolicyTargetSearchResults.set(result); this.mpPolicyTargetSearchLoading.set(false); },
      error: (err) => { this.mpPolicyTargetSearchError.set(err?.message ?? 'Search failed'); this.mpPolicyTargetSearchLoading.set(false); }
    });
  }

  clearMpPolicyTargetSearch(): void {
    this.mpPolicyTargetSearchInput.set('');
    this.mpPolicyTargetSearchResults.set(null);
    this.mpPolicyTargetSearchError.set('');
    this.mpShowPolicyTargetSearch.set(false);
  }

  selectMpTargetPolicyFromResult(row: Record<string, unknown>): void {
    const id = String(row['Policy ID'] ?? row['POLICY_ID'] ?? row['policy_id'] ?? '');
    if (id) {
      this.mpTargetPolicyId.set(id);
      this.mpTargetPolicyInput.set(id);
    }
  }

  runMpMultiPreviewQuery(): void {
    const projects = this.mpProjectIdList();
    const policyId = this.mpTargetPolicyId();
    if (!projects.length || !policyId) { return; }

    this.mpMultiPreviewLoading.set(true);
    this.mpMultiPreviewError.set('');
    this.mpMultiPreviewResults.set([]);
    this.mpMultiPreviewColumns.set([]);

    const queries = projects.map(projectId => {
      const sql = mpSelectFullProject(projectId, policyId).trim();
      return this.db.executeQuery(sql);
    });

    forkJoin(queries).subscribe({
      next: (results) => {
        const allRows: Record<string, unknown>[] = [];
        let columns: string[] = [];
        for (const result of results) {
          if (result.columns.length && !columns.length) {
            columns = result.columns;
          }
          allRows.push(...result.rows);
        }
        this.mpMultiPreviewColumns.set(columns);
        this.mpMultiPreviewResults.set(allRows);
        this.mpMultiPreviewLoading.set(false);
      },
      error: (err) => {
        this.mpMultiPreviewError.set(err?.message ?? 'Preview query failed');
        this.mpMultiPreviewLoading.set(false);
      }
    });
  }

  runMpMultiExecuteMovement(): void {
    const previewRows = this.mpMultiPreviewResults();
    if (!previewRows.length) { return; }

    this.mpMultiExecuteLoading.set(true);
    this.mpMultiExecuteError.set('');
    this.mpMultiExecuteResults.set([]);

    const allSteps: { wellId: string; label: string; sql: string; binds?: Record<string, string> }[] = [];

    for (const row of previewRows) {
      const projectId = String(row['Project ID'] ?? '');
      const currPolicyId = String(row['Current Policy ID'] ?? '');
      const newPolicyId = String(row['New Policy ID'] ?? '');

      const moveProjectSqls = [
        mpUpdateCdProject(newPolicyId, projectId, currPolicyId).trim(),
        mpInsertCdWellStatus(currPolicyId, projectId).trim(),
        mpUpdateCdAttachmentJournal(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdChangeHistoryParentLocator(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdChangeHistoryItemLocator(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdPolylineHeader(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdSurveyProgram(newPolicyId, currPolicyId, projectId).trim(),
        mpUpdateCdSurveyHeader(newPolicyId, currPolicyId, projectId).trim()
      ];
      const moveProjectLabels = [
        'Update Project Policy', 'Insert Well Status',
        'Update Attachment Journal', 'Update CHJ Parent Locator',
        'Update CHJ Item Locator', 'Update Polyline Header',
        'Update Survey Program', 'Update Survey Header'
      ];

      moveProjectSqls.forEach((sql, i) => allSteps.push({ wellId: projectId, label: moveProjectLabels[i], sql }));

      // ── Audit INSERT ──
      const generatedSql = mpSelectFullProject(projectId, newPolicyId).trim();
      const audit = insertProjectMoveAudit(projectId, newPolicyId, row, {
        generatedSql,
        sqlMoveProjects: moveProjectSqls.join('\n')
      });
      allSteps.push({ wellId: projectId, label: 'Insert Audit Record', sql: audit.sql.trim(), binds: audit.binds });
    }

    const statements = allSteps.map(s => ({ sql: s.sql, label: s.label, wellId: s.wellId, binds: s.binds }));

    this.db.executeTransaction(statements).subscribe({
      next: (txResult) => {
        this.mpMultiExecuteResults.set(
          txResult.results.map((r: TransactionResultRow) => ({
            projectId: r.wellId, label: r.label, success: r.success, error: r.error, sql: r.sql || ''
          }))
        );
        if (txResult.failedWells && txResult.failedWells.length) {
          const msgs = txResult.failedWells.map(fw => `Project ${fw.wellId}: "${fw.failedLabel}" — ${fw.error}`);
          this.mpMultiExecuteError.set(`Rolled back:\n` + msgs.join('\n'));
          this.expandedMpMultiExecuteProjects.set(new Set(txResult.failedWells.map(fw => fw.wellId)));
        }
        this.mpMultiExecuteLoading.set(false);
      },
      error: (err) => {
        this.mpMultiExecuteError.set(err?.error?.error ?? err?.message ?? 'Execution failed');
        this.mpMultiExecuteLoading.set(false);
      }
    });
  }

  groupedMpMultiExecuteResults(): { projectId: string; rows: { projectId: string; label: string; success: boolean; error: string; sql: string }[]; allSuccess: boolean }[] {
    const results = this.mpMultiExecuteResults();
    const map = new Map<string, { projectId: string; label: string; success: boolean; error: string; sql: string }[]>();
    for (const row of results) {
      const list = map.get(row.projectId) || [];
      list.push(row);
      map.set(row.projectId, list);
    }
    return Array.from(map.entries()).map(([projectId, rows]) => ({
      projectId, rows, allSuccess: rows.every(r => r.success)
    }));
  }

  toggleMpMultiExecuteProject(projectId: string): void {
    const current = this.expandedMpMultiExecuteProjects();
    const next = new Set(current);
    if (next.has(projectId)) { next.delete(projectId); } else { next.add(projectId); }
    this.expandedMpMultiExecuteProjects.set(next);
  }

  isMpMultiExecuteProjectExpanded(projectId: string): boolean {
    return this.expandedMpMultiExecuteProjects().has(projectId);
  }

  // (Single mode: each project → own business unit)

  addProjectPair(): void {
    const projectId = this.mpProjectIdInput().trim();
    const policyId = this.mpPolicyIdInput().trim();
    if (!projectId || !policyId) { return; }
    this.mpPairList.set([...this.mpPairList(), { projectId, policyId }]);
    this.mpProjectIdInput.set('');
    this.mpPolicyIdInput.set('');
  }

  removeProjectPair(index: number): void {
    this.mpPairList.set(this.mpPairList().filter((_, i) => i !== index));
  }

  runMpProjectSearch(): void {
    const input = this.mpProjectSearchInput().trim();
    if (!input) { return; }
    this.mpProjectSearchLoading.set(true);
    this.mpProjectSearchError.set('');
    this.mpProjectSearchResults.set(null);
    const sql = mpSearchProjectId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.mpProjectSearchResults.set(result); this.mpProjectSearchLoading.set(false); },
      error: (err) => { this.mpProjectSearchError.set(err?.message ?? 'Search failed'); this.mpProjectSearchLoading.set(false); }
    });
  }

  clearMpProjectSearch(): void {
    this.mpProjectSearchInput.set('');
    this.mpProjectSearchResults.set(null);
    this.mpProjectSearchError.set('');
    this.mpShowProjectSearch.set(false);
  }

  toggleMpProjectSearch(): void {
    const opening = !this.mpShowProjectSearch();
    this.mpShowProjectSearch.set(opening);
    if (opening) {
      this.mpShowPolicySearch.set(false);
    }
  }

  toggleMpPolicySearch(): void {
    const opening = !this.mpShowPolicySearch();
    this.mpShowPolicySearch.set(opening);
    if (opening) {
      this.mpShowProjectSearch.set(false);
    }
  }

  selectMpProjectFromResult(row: Record<string, unknown>): void {
    const id = String(row['Project ID'] ?? row['PROJECT_ID'] ?? row['project_id'] ?? '');
    if (id) { this.mpProjectIdInput.set(id); }
  }

  runMpPolicySearch(): void {
    const input = this.mpPolicySearchInput().trim();
    if (!input) { return; }
    this.mpPolicySearchLoading.set(true);
    this.mpPolicySearchError.set('');
    this.mpPolicySearchResults.set(null);
    const sql = mpSearchPolicyId(input).trim();
    this.db.executeQuery(sql).subscribe({
      next: (result) => { this.mpPolicySearchResults.set(result); this.mpPolicySearchLoading.set(false); },
      error: (err) => { this.mpPolicySearchError.set(err?.message ?? 'Search failed'); this.mpPolicySearchLoading.set(false); }
    });
  }

  clearMpPolicySearch(): void {
    this.mpPolicySearchInput.set('');
    this.mpPolicySearchResults.set(null);
    this.mpPolicySearchError.set('');
    this.mpShowPolicySearch.set(false);
  }

  selectMpPolicyFromResult(row: Record<string, unknown>): void {
    const id = String(row['Policy ID'] ?? row['POLICY_ID'] ?? row['policy_id'] ?? '');
    if (id) { this.mpPolicyIdInput.set(id); }
  }

  runMpPreviewQuery(): void {
    const pairs = this.mpPairList();
    if (!pairs.length) { return; }

    this.mpPreviewLoading.set(true);
    this.mpPreviewError.set('');
    this.mpPreviewResults.set([]);
    this.mpPreviewColumns.set([]);

    const queries = pairs.map(pair => {
      const sql = mpSelectFullProject(pair.projectId, pair.policyId).trim();
      return this.db.executeQuery(sql);
    });

    forkJoin(queries).subscribe({
      next: (results) => {
        const allRows: Record<string, unknown>[] = [];
        let columns: string[] = [];
        for (const result of results) {
          if (result.columns.length && !columns.length) {
            columns = result.columns;
          }
          allRows.push(...result.rows);
        }
        this.mpPreviewColumns.set(columns);
        this.mpPreviewResults.set(allRows);
        this.mpPreviewLoading.set(false);
      },
      error: (err) => {
        this.mpPreviewError.set(err?.message ?? 'Preview query failed');
        this.mpPreviewLoading.set(false);
      }
    });
  }

  runMpExecuteMovement(): void {
    const previewRows = this.mpPreviewResults();
    if (!previewRows.length) { return; }

    this.mpExecuteLoading.set(true);
    this.mpExecuteError.set('');
    this.mpExecuteResults.set([]);

    const allSteps: { wellId: string; label: string; sql: string; binds?: Record<string, string> }[] = [];

    for (const row of previewRows) {
      const projectId = String(row['Project ID'] ?? '');
      const currPolicyId = String(row['Current Policy ID'] ?? '');
      const newPolicyId = String(row['New Policy ID'] ?? '');

      const moveProjectSqls = [
        mpUpdateCdProject(newPolicyId, projectId, currPolicyId).trim(),
        mpInsertCdWellStatus(currPolicyId, projectId).trim(),
        mpUpdateCdAttachmentJournal(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdChangeHistoryParentLocator(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdChangeHistoryItemLocator(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdPolylineHeader(currPolicyId, newPolicyId, projectId).trim(),
        mpUpdateCdSurveyProgram(newPolicyId, currPolicyId, projectId).trim(),
        mpUpdateCdSurveyHeader(newPolicyId, currPolicyId, projectId).trim()
      ];
      const moveProjectLabels = [
        'Update Project Policy', 'Insert Well Status',
        'Update Attachment Journal', 'Update CHJ Parent Locator',
        'Update CHJ Item Locator', 'Update Polyline Header',
        'Update Survey Program', 'Update Survey Header'
      ];

      moveProjectSqls.forEach((sql, i) => allSteps.push({ wellId: projectId, label: moveProjectLabels[i], sql }));

      // ── Audit INSERT ──
      const generatedSql = mpSelectFullProject(projectId, newPolicyId).trim();
      const audit = insertProjectMoveAudit(projectId, newPolicyId, row, {
        generatedSql,
        sqlMoveProjects: moveProjectSqls.join('\n')
      });
      allSteps.push({ wellId: projectId, label: 'Insert Audit Record', sql: audit.sql.trim(), binds: audit.binds });
    }

    const statements = allSteps.map(s => ({ sql: s.sql, label: s.label, wellId: s.wellId, binds: s.binds }));

    this.db.executeTransaction(statements).subscribe({
      next: (txResult) => {
        this.mpExecuteResults.set(
          txResult.results.map((r: TransactionResultRow) => ({
            projectId: r.wellId, label: r.label, success: r.success, error: r.error, sql: r.sql || ''
          }))
        );
        if (txResult.failedWells && txResult.failedWells.length) {
          const msgs = txResult.failedWells.map(fw => `Project ${fw.wellId}: "${fw.failedLabel}" — ${fw.error}`);
          this.mpExecuteError.set(`Rolled back:\n` + msgs.join('\n'));
          this.expandedMpExecuteProjects.set(new Set(txResult.failedWells.map(fw => fw.wellId)));
        }
        this.mpExecuteLoading.set(false);
      },
      error: (err) => {
        this.mpExecuteError.set(err?.error?.error ?? err?.message ?? 'Execution failed');
        this.mpExecuteLoading.set(false);
      }
    });
  }

  groupedMpExecuteResults(): { projectId: string; rows: { projectId: string; label: string; success: boolean; error: string; sql: string }[]; allSuccess: boolean }[] {
    const results = this.mpExecuteResults();
    const map = new Map<string, { projectId: string; label: string; success: boolean; error: string; sql: string }[]>();
    for (const row of results) {
      const list = map.get(row.projectId) || [];
      list.push(row);
      map.set(row.projectId, list);
    }
    return Array.from(map.entries()).map(([projectId, rows]) => ({
      projectId, rows, allSuccess: rows.every(r => r.success)
    }));
  }

  toggleMpExecuteProject(projectId: string): void {
    const current = this.expandedMpExecuteProjects();
    const next = new Set(current);
    if (next.has(projectId)) { next.delete(projectId); } else { next.add(projectId); }
    this.expandedMpExecuteProjects.set(next);
  }

  isMpExecuteProjectExpanded(projectId: string): boolean {
    return this.expandedMpExecuteProjects().has(projectId);
  }

  getSelectedOptionTitle(): string {
    const option = this.options().find(o => o.id === this.selectedOption());
    return option?.title || '';
  }
  
  getSelectedOptionDescription(): string {
    const option = this.options().find(o => o.id === this.selectedOption());
    return option?.description || '';
  }
  
  getSelectedOptionIcon(): string {
    const option = this.options().find(o => o.id === this.selectedOption());
    return option?.icon || '';
  }
}
