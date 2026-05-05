import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatabaseService, QueryResult, SessionStatement } from '../../services/database.service';
import { apiLookWellId } from '../project-site-well-movement/queries/api-look-well-id';
import { getWaterDepth, getDatumInfo } from './queries/well-elevation-queries';
import { getWellRecordCounts } from './queries/well-record-counts-queries';
import { getTableDetailQuery } from './queries/well-detail-queries';
import { getWellUpdateQueries } from './queries/well-update-queries';

@Component({
  selector: 'app-update-well-elevations',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Update Well Elevations</h1>
        <a routerLink="/" class="back-link">← Back to Home</a>
      </header>

      <main class="page-content">
        <div class="content-card">
          @if (selectedOption()) {
            <div class="selected-header">
              <h2>{{ selectedOption() }}</h2>
              <button class="btn-change" (click)="clearSelection()">← Change Selection</button>
            </div>

            @if (selectedOption() === 'Update Well Elevations') {
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

                <!-- Well Data (two columns) -->
                @if (wellIdInput().trim() && (waterDepthResult() || datumResult())) {
                  <div class="well-data-columns">
                    <div class="well-data-col">
                      <h4 class="col-title">{{ waterDepthTitle() }}</h4>
                      @if (wellDataLoading()) { <p class="hint">Loading...</p> }
                      @else if (wellDataError()) { <div class="query-error">&#9888; {{ wellDataError() }}</div> }
                      @else if (waterDepthResult(); as wd) {
                        @if (wd.rows.length) {
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead><tr><th>{{ waterDepthTitle() }}</th></tr></thead>
                              <tbody>
                                @for (row of wd.rows; track $index) {
                                  <tr><td>{{ row['water_depth'] }}</td></tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        } @else { <p class="hint">No data found.</p> }
                      }
                    </div>
                    <div class="well-data-col">
                      <h4 class="col-title">Datum Information</h4>
                      <label class="toggle-label">
                        <input type="checkbox" [ngModel]="updateAllDatums()" (ngModelChange)="updateAllDatums.set($event)" />
                        Update all Datums
                      </label>
                      @if (wellDataLoading()) { <p class="hint">Loading...</p> }
                      @else if (wellDataError()) { <div class="query-error">&#9888; {{ wellDataError() }}</div> }
                      @else if (datumResult(); as dt) {
                        @if (dt.rows.length) {
                          <div class="results-table-wrap">
                            <table class="results-table">
                              <thead><tr>@for (col of dt.columns; track col) { <th>{{ col }}</th> }</tr></thead>
                              <tbody>
                                @for (row of dt.rows; track $index) {
                                  <tr>@for (col of dt.columns; track col) { <td>{{ row[col] }}</td> }</tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        } @else { <p class="hint">No datum data found.</p> }
                      }
                    </div>
                  </div>

                  <!-- New Elevation Inputs -->
                  <div class="well-data-columns" style="margin-top: 1rem;">
                    <div class="form-group">
                      <label for="newGroundElevation">Enter New Ground Elevation</label>
                      <div class="input-with-checkbox">
                        <input
                          id="newGroundElevation"
                          type="number"
                          step="0.1"
                          class="form-input"
                          placeholder="Enter new ground elevation"
                          [ngModel]="newGroundElevation()"
                          (ngModelChange)="newGroundElevation.set($event)"
                          [disabled]="noChangeGroundElevation()"
                        />
                        <label class="checkbox-label">
                          <input
                            type="checkbox"
                            [ngModel]="noChangeGroundElevation()"
                            (ngModelChange)="toggleNoChangeGround($event)"
                          />
                          No change in ground elevation
                        </label>
                      </div>
                    </div>
                    <div class="form-group">
                      @if (updateAllDatums()) {
                        <label for="datumFtToAdd">Ft. to add to all Datums</label>
                        <input
                          id="datumFtToAdd"
                          type="number"
                          step="0.1"
                          class="form-input"
                          placeholder="Enter ft. to add to all datums"
                          [ngModel]="datumFtToAdd()"
                          (ngModelChange)="datumFtToAdd.set($event)"
                        />
                      } @else {
                        <label for="newDatumElevation">New Datum Elevation</label>
                        <div class="input-with-readonly">
                          <input
                            id="newDatumElevation"
                            type="number"
                            step="0.1"
                            class="form-input"
                            placeholder="Enter new datum elevation"
                            [ngModel]="newDatumElevation()"
                            (ngModelChange)="newDatumElevation.set($event)"
                          />
                          @if (datumDifference() !== null) {
                            <div class="form-group readonly-field">
                              <label>Ft. to be added (New - Actual KB)</label>
                              <input type="text" class="form-input" [value]="datumDifference()" readonly />
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Execute Button -->
                  <div class="search-actions" style="margin-top: 1.5rem;">
                    <button
                      class="btn btn-primary"
                      [disabled]="!wellIdInput().trim() || (!newGroundElevation() && !noChangeGroundElevation()) || (updateAllDatums() ? !datumFtToAdd() : !newDatumElevation()) || executeLoading() || awaitingConfirm() || updateExecuted()"
                      (click)="executeUpdate()">
                      @if (executeLoading()) { Executing... } @else { &#9654; Execute Count of records to be Updated }
                    </button>
                  </div>
                  @if (executeError()) { <div class="query-error" style="margin-top: 0.75rem;">&#9888; {{ executeError() }}</div> }

                  <!-- Record Counts Results -->
                  @if (recordCountsResult()) {
                    <div class="query-results-section" style="margin-top: 1.5rem;">
                      <div class="results-header-row">
                        <h4 class="results-title">Record Counts ({{ filteredRecordCountColumns().length }} of {{ recordCountsResult()!.columns.length }} tables)</h4>
                        <div class="table-controls">
                          <label class="toggle-label">
                            <input type="checkbox" [ngModel]="filterNonZeroCounts()" (ngModelChange)="filterNonZeroCounts.set($event)" />
                            Hide zero counts
                          </label>
                          <button class="btn btn-outline btn-sm collapse-btn" (click)="recordCountsCollapsed.set(!recordCountsCollapsed())">
                            {{ recordCountsCollapsed() ? '&#9654; Show' : '&#9660; Hide' }} Table
                          </button>
                        </div>
                      </div>
                      @if (!recordCountsCollapsed()) {
                        <div class="results-table-wrap">
                          <table class="results-table">
                            <thead>
                              <tr>
                                <th>Table</th>
                                <th class="num-col">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (col of filteredRecordCountColumns(); track col) {
                                <tr [class.has-data]="recordCountsResult()!.rows[0][col] !== 0">
                                  <td>{{ col }}</td>
                                  <td class="num-col">{{ recordCountsResult()!.rows[0][col] }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      }
                    </div>
                  }

                  <!-- Detail Queries Section -->
                  @if (recordCountsResult() && nonZeroTables().length > 0) {
                    <div class="search-actions" style="margin-top: 1rem;">
                      <button
                        class="btn btn-primary"
                        [disabled]="detailLoading() || updateExecuted()"
                        (click)="executeDetailQueries()">
                        @if (detailLoading()) { Loading Details... } @else { &#128270; View Detail for Non-Zero Tables ({{ nonZeroTables().length }}) }
                      </button>
                    </div>
                    @if (detailError()) { <div class="query-error" style="margin-top: 0.75rem;">&#9888; {{ detailError() }}</div> }

                    @if (detailTablesList().length > 0) {
                      <div class="query-results-section" style="margin-top: 1rem;">
                        <div class="results-header-row">
                          <h4 class="results-title">Detail Data ({{ nonEmptyDetailTableCount() }} of {{ detailTablesList().length }} tables with data)</h4>
                          <div class="table-controls">
                            @if (!detailSectionCollapsed()) {
                              <button class="btn btn-outline btn-sm collapse-btn" (click)="toggleAllDetailCollapse()">
                                {{ allDetailCollapsed() ? '&#9654; Expand' : '&#9660; Collapse' }} All Tables
                              </button>
                            }
                            <button class="btn btn-outline btn-sm collapse-btn" (click)="detailSectionCollapsed.set(!detailSectionCollapsed())">
                              {{ detailSectionCollapsed() ? '&#9654; Show' : '&#9660; Hide' }} Table
                            </button>
                          </div>
                        </div>
                        @if (!detailSectionCollapsed()) {
                          <div class="detail-results-section">
                        @for (tableName of filteredDetailTablesList(); track tableName) {
                          @let dr = filteredDetailResults().get(tableName)!;
                          @let rawDr = detailResults().get(tableName)!;
                          @let visibleCols = getVisibleColumns(tableName);
                          @let allCols = dr.columns;
                          @let nullColCount = allCols.length - visibleCols.length;
                          @let nullRowCount = nullRowCounts().get(tableName) ?? 0;
                          <div class="detail-table-block" [class.empty-table]="dr.rows.length === 0">
                            <div class="detail-table-header" (click)="toggleDetailCollapse(tableName)">
                              <span class="detail-toggle">{{ isDetailCollapsed(tableName) ? '&#9654;' : '&#9660;' }}</span>
                              <strong>{{ tableName }}</strong>
                              <span class="detail-row-count">
                                @if (rawDr.rows.length === 0) {
                                  (no data)
                                } @else if (dr.rows.length === 0 && !isShowingNullRows(tableName)) {
                                  ({{ rawDr.rows.length }} row{{ rawDr.rows.length !== 1 ? 's' : '' }} all null)
                                } @else {
                                  ({{ dr.rows.length }}{{ nullRowCount > 0 && !isShowingNullRows(tableName) ? ' of ' + rawDr.rows.length : '' }} row{{ dr.rows.length !== 1 ? 's' : '' }}{{ nullColCount > 0 && !isShowingNullCols(tableName) ? ', ' + nullColCount + ' null col' + (nullColCount !== 1 ? 's' : '') + ' hidden' : '' }}{{ nullRowCount > 0 && !isShowingNullRows(tableName) ? ', ' + nullRowCount + ' null row' + (nullRowCount !== 1 ? 's' : '') + ' hidden' : '' }})
                                }
                              </span>
                              <div class="detail-null-toggles" (click)="$event.stopPropagation()">
                                @if (nullRowCount > 0) {
                                  <label class="detail-null-toggle">
                                    <input type="checkbox" [checked]="isShowingNullRows(tableName)" (change)="toggleShowNullRows(tableName)" />
                                    Show null rows
                                  </label>
                                }
                                @if (nullColCount > 0) {
                                  <label class="detail-null-toggle">
                                    <input type="checkbox" [checked]="isShowingNullCols(tableName)" (change)="toggleShowNullCols(tableName)" />
                                    Show null columns
                                  </label>
                                }
                              </div>
                            </div>
                            @if (!isDetailCollapsed(tableName) && dr.rows.length > 0) {
                              <div class="results-table-wrap">
                                <table class="results-table">
                                  <thead><tr>@for (col of (isShowingNullCols(tableName) ? allCols : visibleCols); track col) { <th>{{ col }}</th> }</tr></thead>
                                  <tbody>
                                    @for (row of dr.rows; track $index) {
                                      <tr>@for (col of (isShowingNullCols(tableName) ? allCols : visibleCols); track col) { <td [class.null-cell]="row[col] === null || row[col] === undefined">{{ row[col] ?? '' }}</td> }</tr>
                                    }
                                  </tbody>
                                </table>
                              </div>
                            }
                          </div>
                        }
                          </div>
                        }
                      </div>
                    }
                  }

                  <!-- Commit / Rollback -->
                  @if (awaitingConfirm() && !updateExecuted()) {
                    <div class="confirm-actions">
                      <p class="confirm-msg">&#9888; Review the record counts above. Run the update to apply changes, or Rollback to cancel.</p>
                      <div class="search-actions">
                        <button class="btn btn-primary" [disabled]="updateLoading()" (click)="runUpdate()">
                          @if (updateLoading()) { Updating... } @else { &#9654; Run Update }
                        </button>
                        <button class="btn btn-rollback" [disabled]="updateLoading()" (click)="rollback()">
                          &#10007; Rollback
                        </button>
                      </div>
                    </div>
                  }
                  @if (updateError()) { <div class="query-error" style="margin-top: 0.75rem;">&#9888; {{ updateError() }}</div> }

                  <!-- Update Results -->
                  @if (updateExecuted()) {
                    <div class="query-results-section" style="margin-top: 1.5rem;">
                      <div class="results-header-row">
                        <h4 class="results-title">Update Results ({{ updateResults().length }} statements executed)</h4>
                        <button class="btn btn-outline btn-sm collapse-btn" (click)="updateResultsSectionCollapsed.set(!updateResultsSectionCollapsed())">
                          {{ updateResultsSectionCollapsed() ? '&#9654; Show' : '&#9660; Hide' }} Table
                        </button>
                      </div>
                      @if (!updateResultsSectionCollapsed()) {
                        <div class="results-table-wrap">
                          <table class="results-table">
                            <thead>
                              <tr>
                                <th>Table</th>
                                <th class="num-col">Rows Affected</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (r of updateResults(); track $index) {
                                <tr [class.has-data]="r.success" [class.error-row]="!r.success">
                                  <td>{{ r.label }}</td>
                                  <td class="num-col">{{ r.rowsAffected }}</td>
                                  <td>{{ r.success ? '✓' : '✗ ' + r.error }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      }
                    </div>

                    <!-- Compare button -->
                    <div class="search-actions" style="margin-top: 1rem;">
                      <button class="btn btn-primary" [disabled]="comparisonLoading()" (click)="runComparison()">
                        @if (comparisonLoading()) { Comparing... } @else { &#128269; Compare Before &amp; After }
                      </button>
                    </div>
                    @if (comparisonError()) { <div class="query-error" style="margin-top: 0.75rem;">&#9888; {{ comparisonError() }}</div> }

                    <!-- Comparison Results -->
                    @if (comparisonExecuted()) {
                      <div class="query-results-section" style="margin-top: 1rem;">
                        <div class="results-header-row">
                          <h4 class="results-title">Comparison Results ({{ comparisonResults().size }} tables)</h4>
                          <div class="table-controls">
                            @if (!comparisonSectionCollapsed()) {
                              <button class="btn btn-outline btn-sm collapse-btn" (click)="toggleAllComparisonCollapse()">
                                {{ allComparisonCollapsed() ? '&#9654; Expand' : '&#9660; Collapse' }} All Tables
                              </button>
                            }
                            <button class="btn btn-outline btn-sm collapse-btn" (click)="comparisonSectionCollapsed.set(!comparisonSectionCollapsed())">
                              {{ comparisonSectionCollapsed() ? '&#9654; Show' : '&#9660; Hide' }} Table
                            </button>
                          </div>
                        </div>
                        @if (!comparisonSectionCollapsed()) {
                          @for (tableName of comparisonTablesList(); track tableName) {
                            @let tableData = comparisonResults().get(tableName)!;
                            <div class="detail-table-block" [class.comparison-match]="isComparisonMatch(tableName)" [class.comparison-mismatch]="!isComparisonMatch(tableName)">
                              <div class="detail-table-header" (click)="toggleComparisonCollapse(tableName)">
                                <span class="detail-toggle">{{ isComparisonCollapsed(tableName) ? '&#9654;' : '&#9660;' }}</span>
                                <strong>{{ tableName }}</strong>
                                <span class="detail-row-count">({{ tableData.rows.length }} value{{ tableData.rows.length !== 1 ? 's' : '' }} — {{ isComparisonMatch(tableName) ? 'All match ✓' : 'Mismatch found ✗' }})</span>
                              </div>
                              @if (!isComparisonCollapsed(tableName)) {
                                <div class="results-table-wrap">
                                  <table class="results-table">
                                    <thead>
                                      <tr>
                                        <th>Column</th>
                                        <th>Row</th>
                                        <th class="num-col">Before</th>
                                        <th class="num-col">After</th>
                                        <th class="num-col">Expected</th>
                                        <th class="num-col">KB Before</th>
                                        <th class="num-col">KB After</th>
                                        <th>Match</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      @for (row of tableData.rows; track $index) {
                                        <tr [class.match-row]="row.match" [class.mismatch-row]="!row.match">
                                          <td>{{ row.col }}</td>
                                          <td>{{ row.rowIdx + 1 }}</td>
                                          <td class="num-col">{{ row.before }}</td>
                                          <td class="num-col">{{ row.after }}</td>
                                          <td class="num-col">{{ row.expected }}</td>
                                          <td class="num-col">{{ row.kbBefore ?? '' }}</td>
                                          <td class="num-col">{{ row.kbAfter ?? '' }}</td>
                                          <td>{{ row.match ? '✓' : '✗' }}</td>
                                        </tr>
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              }
                            </div>
                          }
                        }
                      </div>
                    }

                    <!-- Commit / Rollback after update -->
                    <div class="confirm-actions" style="margin-top: 1.5rem;">
                      <p class="confirm-msg">&#9888; Review the results above. Commit to save changes permanently, or Rollback to undo everything.</p>
                      <div class="search-actions">
                        <button class="btn btn-commit" [disabled]="committing()" (click)="commit()">
                          @if (committing()) { Committing... } @else { &#10003; Commit }
                        </button>
                        <button class="btn btn-rollback" [disabled]="committing()" (click)="rollback()">
                          &#10007; Rollback
                        </button>
                      </div>
                    </div>
                  }
                  @if (committed()) {
                    <div class="commit-success">&#9989; Changes committed successfully.</div>
                  }
                  @if (rolledBack()) {
                    <div class="rollback-success">&#8634; All changes rolled back. No data was modified.</div>
                  }
                }
              </div>
            }

          } @else {
            <h2>Select Operation</h2>
            <p>Choose the operation you want to perform.</p>

            <div class="hexagon-grid">
              <div
                class="hexagon-wrapper"
                (click)="selectOption('Update Well Elevations')"
                (keydown.enter)="selectOption('Update Well Elevations')"
                (keydown.space)="selectOption('Update Well Elevations'); $event.preventDefault()"
                tabindex="0"
                role="button">
                <div class="hexagon">
                  <div class="hexagon-border">
                    <div class="hexagon-inner">
                      <div class="hexagon-content">
                        <div class="hex-icon">
                          <svg viewBox="0 0 24 24">
                            <path d="M3 21h18"/>
                            <path d="M3 7l9-4 9 4"/>
                            <path d="M6 10v8"/>
                            <path d="M12 7v14"/>
                            <path d="M18 10v8"/>
                          </svg>
                        </div>
                        <div class="hex-title">Update Well Elevations</div>
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

    .well-data-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .well-data-col {
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
    }

    .col-title {
      margin: 0 0 0.75rem 0;
      color: #1a1a1a;
      font-size: 1rem;
      font-weight: 700;
    }

    .input-with-checkbox {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .input-with-checkbox .form-input {
      flex: 1;
    }

    .input-with-readonly {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
    }

    .input-with-readonly .form-input {
      flex: 1;
    }

    .readonly-field {
      margin: 0;
    }

    .readonly-field input {
      background: #f3f4f6;
      cursor: default;
    }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #C1272D;
      cursor: pointer;
    }

    .num-col {
      text-align: right;
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

    .table-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
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

    .collapse-btn {
      margin-top: 0;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
    }

    .has-data {
      background: #fffbeb !important;
      font-weight: 600;
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

    .detail-results-section {
      margin-top: 1rem;
    }

    .detail-table-block {
      margin-bottom: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }

    .detail-table-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      background: #f1f5f9;
      cursor: pointer;
      user-select: none;
      font-size: 0.9rem;
    }

    .detail-table-header:hover {
      background: #e2e8f0;
    }

    .detail-toggle {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .detail-row-count {
      color: #6b7280;
      font-weight: 400;
      font-size: 0.85rem;
    }

    .detail-table-block .results-table-wrap {
      border: none;
      border-top: 1px solid #e2e8f0;
      border-radius: 0;
    }

    .detail-table-block.empty-table .detail-table-header {
      background: #fef9ee;
      border-left: 3px solid #fbbf24;
    }

    .detail-table-block.comparison-match .detail-table-header {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
    }

    .detail-table-block.comparison-mismatch .detail-table-header {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
    }

    .detail-table-block.comparison-match .results-table,
    .detail-table-block.comparison-mismatch .results-table {
      width: auto;
    }

    .detail-table-block.comparison-match .results-table th.num-col,
    .detail-table-block.comparison-match .results-table td.num-col,
    .detail-table-block.comparison-mismatch .results-table th.num-col,
    .detail-table-block.comparison-mismatch .results-table td.num-col {
      min-width: 90px;
      text-align: right;
      white-space: nowrap;
    }

    .match-row {
      background: #f0fdf4;
    }

    .mismatch-row {
      background: #fef2f2;
      font-weight: 600;
    }

    .error-row {
      background: #fef2f2;
      color: #b91c1c;
    }

    .detail-null-toggles {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-left: auto;
    }

    .detail-null-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      white-space: nowrap;
    }

    .detail-null-toggle input[type="checkbox"] {
      width: 14px;
      height: 14px;
      accent-color: #C1272D;
      cursor: pointer;
    }

    .null-cell {
      color: #d1d5db;
    }

    @media (max-width: 768px) {
      .well-data-columns {
        grid-template-columns: 1fr;
      }
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
export class UpdateWellElevationsComponent {
  private db = inject(DatabaseService);

  selectedOption = signal<string | null>(null);

  // Well ID signals
  wellIdInput = signal('');
  showWellSearch = signal(false);
  wellSearchInput = signal('');
  wellSearchLoading = signal(false);
  wellSearchError = signal('');
  wellSearchResults = signal<QueryResult | null>(null);

  // Well data signals
  wellDataLoading = signal(false);
  wellDataError = signal('');
  waterDepthResult = signal<QueryResult | null>(null);
  datumResult = signal<QueryResult | null>(null);

  // New elevation inputs
  newGroundElevation = signal('');
  newDatumElevation = signal('');
  noChangeGroundElevation = signal(false);
  updateAllDatums = signal(false);
  datumFtToAdd = signal('');

  currentKbElevation = computed(() => {
    const dt = this.datumResult();
    if (!dt || !dt.rows.length) { return null; }
    const defaultRow = dt.rows.find(r => r['Default Datum'] === 'Y');
    const row = defaultRow ?? dt.rows[0];
    const val = row['Datum Elevation'];
    return val !== null && val !== undefined ? Number(val) : null;
  });

  datumDifference = computed(() => {
    const kb = this.currentKbElevation();
    const newDatum = this.newDatumElevation();
    if (kb === null || !newDatum) { return null; }
    return Number(newDatum) - kb;
  });

  // Execution signals
  sessionId = signal('');
  executeLoading = signal(false);
  executeError = signal('');
  recordCountsResult = signal<QueryResult | null>(null);
  filterNonZeroCounts = signal(false);
  recordCountsCollapsed = signal(false);
  awaitingConfirm = signal(false);
  committing = signal(false);
  committed = signal(false);
  rolledBack = signal(false);

  // Update execution signals
  updateExecuted = signal(false);
  updateLoading = signal(false);
  updateError = signal('');
  updateResults = signal<Array<{ label: string; success: boolean; rowsAffected: number; error: string }>>([]);

  // Comparison signals
  comparisonLoading = signal(false);
  comparisonError = signal('');
  comparisonResults = signal<Map<string, { columns: string[]; rows: Array<{ col: string; rowIdx: number; before: unknown; after: unknown; expected: unknown; kbBefore: unknown; kbAfter: unknown; match: boolean }> }>>(new Map());
  comparisonExecuted = signal(false);
  comparisonSectionCollapsed = signal(true);
  comparisonCollapsed = signal<Set<string>>(new Set());

  updateResultsSectionCollapsed = signal(true);

  // Detail queries signals
  detailResults = signal<Map<string, QueryResult>>(new Map());
  detailLoading = signal(false);
  detailError = signal('');
  detailCollapsed = signal<Set<string>>(new Set());
  detailSectionCollapsed = signal(true);
  showNullRowsTables = signal<Set<string>>(new Set());
  showNullColsTables = signal<Set<string>>(new Set());
  private visibleColumnsCache = new Map<string, string[]>();

  filteredRecordCountColumns = computed(() => {
    const result = this.recordCountsResult();
    if (!result) { return []; }
    if (!this.filterNonZeroCounts()) { return result.columns; }
    return result.columns.filter(col => result.rows[0][col] !== 0);
  });

  nonZeroTables = computed(() => {
    const result = this.recordCountsResult();
    if (!result || !result.rows.length) { return []; }
    return result.columns.filter(col => result.rows[0][col] !== 0);
  });

  detailTablesList = computed(() => {
    const all = Array.from(this.detailResults().keys());
    const nonZero = new Set(this.nonZeroTables().map(t => t.toUpperCase()));
    return all.filter(t => nonZero.has(t.toUpperCase()));
  });

  allDetailCollapsed = computed(() => {
    const collapsed = this.detailCollapsed();
    const tables = this.filteredDetailTablesList();
    return tables.length > 0 && tables.every(t => collapsed.has(t));
  });

  filteredDetailResults = computed(() => {
    const raw = this.detailResults();
    const showNullTables = this.showNullRowsTables();
    const filtered = new Map<string, QueryResult>();
    for (const [table, result] of raw) {
      if (showNullTables.has(table)) {
        filtered.set(table, result);
        continue;
      }
      const depthCols = result.columns.filter(c => c !== 'TABLE_NAME' && c !== 'WELL_ID');
      const rows = result.rows.filter(row => depthCols.some(c => row[c] !== null && row[c] !== undefined));
      filtered.set(table, { columns: result.columns, rows });
    }
    return filtered;
  });

  filteredDetailTablesList = computed(() => {
    const filtered = this.filteredDetailResults();
    return this.detailTablesList().filter(t => filtered.has(t));
  });

  nonEmptyDetailTableCount = computed(() => {
    const filtered = this.filteredDetailResults();
    let count = 0;
    for (const table of this.detailTablesList()) {
      const result = filtered.get(table);
      if (result && result.rows.length > 0) { count++; }
    }
    return count;
  });

  nullRowCounts = computed(() => {
    const raw = this.detailResults();
    const counts = new Map<string, number>();
    for (const [table, result] of raw) {
      const depthCols = result.columns.filter(c => c !== 'TABLE_NAME' && c !== 'WELL_ID');
      const nonNullCount = result.rows.filter(row => depthCols.some(c => row[c] !== null && row[c] !== undefined)).length;
      counts.set(table, result.rows.length - nonNullCount);
    }
    return counts;
  });

  waterDepthTitle = computed(() => {
    const wd = this.waterDepthResult();
    if (wd && wd.rows.length && wd.rows[0]['is_offshore'] === 'Y') {
      return 'Water Depth';
    }
    return 'Ground Elevation';
  });

  waterDepthColumns = computed(() => {
    const wd = this.waterDepthResult();
    if (!wd) { return []; }
    return wd.columns.filter(col => col !== 'is_offshore');
  });

  comparisonTablesList = computed(() => {
    return Array.from(this.comparisonResults().keys());
  });

  isComparisonMatch(tableName: string): boolean {
    const tableData = this.comparisonResults().get(tableName);
    if (!tableData) { return true; }
    return tableData.rows.every(r => r.match);
  }

  isComparisonCollapsed(tableName: string): boolean {
    return this.comparisonCollapsed().has(tableName);
  }

  toggleComparisonCollapse(tableName: string): void {
    const set = new Set(this.comparisonCollapsed());
    if (set.has(tableName)) {
      set.delete(tableName);
    } else {
      set.add(tableName);
    }
    this.comparisonCollapsed.set(set);
  }

  toggleAllComparisonCollapse(): void {
    const allTables = this.comparisonTablesList();
    const allCollapsed = allTables.length > 0 && allTables.every(t => this.comparisonCollapsed().has(t));
    if (allCollapsed) {
      this.comparisonCollapsed.set(new Set());
    } else {
      this.comparisonCollapsed.set(new Set(allTables));
    }
  }

  allComparisonCollapsed = computed(() => {
    const tables = this.comparisonTablesList();
    return tables.length > 0 && tables.every(t => this.comparisonCollapsed().has(t));
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
    this.clearWellData();
  }

  clearWellData(): void {
    // Close the Oracle session if one is active
    const sid = this.sessionId();
    if (sid) {
      this.db.sessionRollback(sid).subscribe();
    }

    this.waterDepthResult.set(null);
    this.datumResult.set(null);
    this.wellDataError.set('');
    this.newGroundElevation.set('');
    this.newDatumElevation.set('');
    this.noChangeGroundElevation.set(false);
    this.updateAllDatums.set(false);
    this.datumFtToAdd.set('');
    // Reset execute / record counts
    this.sessionId.set('');
    this.executeLoading.set(false);
    this.recordCountsResult.set(null);
    this.filterNonZeroCounts.set(false);
    this.recordCountsCollapsed.set(false);
    this.awaitingConfirm.set(false);
    this.committed.set(false);
    this.rolledBack.set(false);
    this.committing.set(false);
    // Reset update results
    this.updateExecuted.set(false);
    this.updateLoading.set(false);
    this.updateError.set('');
    this.updateResults.set([]);
    this.updateResultsSectionCollapsed.set(true);
    // Reset comparison
    this.comparisonLoading.set(false);
    this.comparisonError.set('');
    this.comparisonResults.set(new Map());
    this.comparisonExecuted.set(false);
    this.comparisonSectionCollapsed.set(false);
    this.comparisonCollapsed.set(new Set());
    // Reset detail
    this.detailResults.set(new Map());
    this.detailLoading.set(false);
    this.detailError.set('');
    this.detailCollapsed.set(new Set());
    this.detailSectionCollapsed.set(true);
    this.showNullRowsTables.set(new Set());
    this.showNullColsTables.set(new Set());
    this.visibleColumnsCache.clear();
  }

  toggleNoChangeGround(checked: boolean): void {
    this.noChangeGroundElevation.set(checked);
    if (checked) {
      const wd = this.waterDepthResult();
      const value = wd?.rows.length ? String(wd.rows[0]['water_depth'] ?? '') : '';
      this.newGroundElevation.set(value);
    }
  }

  fetchWellData(wellId: string): void {
    this.wellDataLoading.set(true);
    this.wellDataError.set('');
    this.waterDepthResult.set(null);
    this.datumResult.set(null);

    forkJoin({
      waterDepth: this.db.executeQuery(getWaterDepth(wellId)),
      datum: this.db.executeQuery(getDatumInfo(wellId)),
    }).subscribe({
      next: (results) => {
        this.waterDepthResult.set(results.waterDepth);
        this.datumResult.set(results.datum);
        this.wellDataLoading.set(false);
      },
      error: (err) => {
        this.wellDataError.set(err?.message ?? 'Failed to fetch well data');
        this.wellDataLoading.set(false);
      }
    });
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
      this.fetchWellData(wellId);
    }
  }

  executeUpdate(): void {
    const wellId = this.wellIdInput().trim();
    if (!wellId) { return; }

    this.executeLoading.set(true);
    this.executeError.set('');
    this.recordCountsResult.set(null);
    this.awaitingConfirm.set(false);
    this.committed.set(false);
    this.rolledBack.set(false);

    // Cleanup any stale sessions first, then begin a new one
    this.db.sessionCleanup().subscribe({
      next: () => this.beginSession(wellId),
      error: () => this.beginSession(wellId) // proceed even if cleanup fails
    });
  }

  private beginSession(wellId: string): void {
    // Begin a session
    this.db.sessionBegin().subscribe({
      next: (res) => {
        this.sessionId.set(res.sessionId);
        // Execute the record counts query within the session
        const sql = getWellRecordCounts(wellId);
        this.db.sessionQuery(res.sessionId, sql).subscribe({
          next: (result) => {
            this.recordCountsResult.set(result);
            this.awaitingConfirm.set(true);
            this.executeLoading.set(false);
          },
          error: (err) => {
            this.executeError.set(err?.error?.error ?? err?.message ?? 'Query failed');
            this.executeLoading.set(false);
          }
        });
      },
      error: (err) => {
        this.executeError.set(err?.error?.error ?? err?.message ?? 'Failed to begin session');
        this.executeLoading.set(false);
      }
    });
  }

  commit(): void {
    const sid = this.sessionId();
    if (!sid) { return; }
    this.committing.set(true);
    this.db.sessionCommit(sid).subscribe({
      next: () => {
        this.committing.set(false);
        this.sessionId.set('');
        this.clearWellId();
        this.committed.set(true);
      },
      error: (err) => {
        this.executeError.set(err?.error?.error ?? err?.message ?? 'Commit failed');
        this.committing.set(false);
      }
    });
  }

  rollback(): void {
    const sid = this.sessionId();
    if (!sid) { return; }
    this.committing.set(true);
    this.db.sessionRollback(sid).subscribe({
      next: () => {
        this.committing.set(false);
        this.sessionId.set('');
        this.clearWellId();
        this.rolledBack.set(true);
      },
      error: (err) => {
        this.executeError.set(err?.error?.error ?? err?.message ?? 'Rollback failed');
        this.committing.set(false);
      }
    });
  }

  runUpdate(): void {
    const sid = this.sessionId();
    const wellId = this.wellIdInput().trim();
    if (!sid || !wellId) { return; }

    const ftToAdd = this.updateAllDatums()
      ? Number(this.datumFtToAdd())
      : Number(this.datumDifference());
    if (isNaN(ftToAdd) || ftToAdd === 0) { return; }

    const allStatements = getWellUpdateQueries(wellId, ftToAdd, this.updateAllDatums());

    // Filter to only tables with data (non-zero tables) plus CD_WELL, CD_DATUM (always included)
    const nonZero = new Set(this.nonZeroTables().map(t => t.toUpperCase().replace(/ /g, '_')));
    const alwaysInclude = new Set(['CD_WELL', 'CD_DATUM']);
    const filtered = allStatements.filter(s => {
      const tableName = s.label.replace(/ \(.*\)/, '').toUpperCase();
      return alwaysInclude.has(tableName) || nonZero.has(tableName);
    });

    const sessionStatements: SessionStatement[] = filtered.map(s => ({
      sql: s.sql,
      label: s.label
    }));

    this.updateLoading.set(true);
    this.updateError.set('');

    this.db.sessionExecute(sid, sessionStatements).subscribe({
      next: (res) => {
        this.updateResults.set(res.results);
        this.updateExecuted.set(true);
        this.updateLoading.set(false);
      },
      error: (err) => {
        this.updateError.set(err?.error?.error ?? err?.message ?? 'Update failed');
        this.updateLoading.set(false);
      }
    });
  }

  runComparison(): void {
    const sid = this.sessionId();
    const wellId = this.wellIdInput().trim();
    if (!sid || !wellId) { return; }

    this.comparisonLoading.set(true);
    this.comparisonError.set('');

    const nonZeroSet = new Set(this.nonZeroTables().map(t => t.toUpperCase().replace(/ /g, '_')));
    const tablesToCompare = Array.from(this.detailResults().keys())
      .filter(t => nonZeroSet.has(t.toUpperCase().replace(/ /g, '_')));

    const queries: Record<string, ReturnType<typeof this.db.sessionQuery>> = {};
    for (const table of tablesToCompare) {
      const sql = getTableDetailQuery(table, wellId, { skipExtraWhere: this.updateAllDatums() && table.toUpperCase() === 'CD_DATUM' });
      if (sql) {
        queries[table] = this.db.sessionQuery(sid, sql);
      }
    }

    if (!Object.keys(queries).length) {
      this.comparisonLoading.set(false);
      return;
    }

    const ftToAdd = this.updateAllDatums()
      ? Number(this.datumFtToAdd())
      : Number(this.datumDifference());

    forkJoin(queries).subscribe({
      next: (results) => {
        const compMap = new Map<string, { columns: string[]; rows: Array<{ col: string; rowIdx: number; before: unknown; after: unknown; expected: unknown; kbBefore: unknown; kbAfter: unknown; match: boolean }> }>();

        for (const [table, afterResult] of Object.entries(results)) {
          const beforeResult = this.detailResults().get(table);
          if (!beforeResult || !afterResult.rows.length) { continue; }

          const depthCols = beforeResult.columns.filter(c => c !== 'TABLE_NAME' && c !== 'WELL_ID');
          const comparisons: Array<{ col: string; rowIdx: number; before: unknown; after: unknown; expected: unknown; kbBefore: unknown; kbAfter: unknown; match: boolean }> = [];

          const isAddTable = table.toUpperCase() === 'CD_WELL' || table.toUpperCase() === 'CD_DATUM';

          // Separate KB fields from regular fields and build a lookup
          const kbFields = depthCols.filter(c => c.toUpperCase().includes('_KB'));
          const regularFields = depthCols.filter(c => !c.toUpperCase().includes('_KB'));
          const kbMap = new Map<string, string>(); // baseField -> kbField
          for (const kb of kbFields) {
            // Match KB field to its base: e.g. MD_HOLE_SECT_BASE_KB -> MD_HOLE_SECT_BASE
            const base = kb.replace(/_KB$/i, '');
            const match = regularFields.find(f => f.toUpperCase() === base.toUpperCase());
            if (match) {
              kbMap.set(match, kb);
            }
          }

          for (let i = 0; i < Math.min(beforeResult.rows.length, afterResult.rows.length); i++) {
            for (const col of regularFields) {
              const beforeVal = beforeResult.rows[i][col];
              const afterVal = afterResult.rows[i][col];

              if (beforeVal === null || beforeVal === undefined) { continue; }

              const numBefore = Number(beforeVal);
              if (isNaN(numBefore)) { continue; }

              let expected: number;
              if (isAddTable) {
                expected = numBefore + ftToAdd;
              } else {
                expected = numBefore - ftToAdd;
              }

              const numAfter = afterVal !== null && afterVal !== undefined ? Number(afterVal) : null;
              let match = numAfter !== null && Math.abs(numAfter - expected) < 0.0001;

              // Get paired KB field values
              let kbBefore: unknown = null;
              let kbAfter: unknown = null;
              const kbCol = kbMap.get(col);
              if (kbCol) {
                kbBefore = beforeResult.rows[i][kbCol];
                kbAfter = afterResult.rows[i][kbCol];
                // KB fields should remain the same
                if (kbBefore !== null && kbBefore !== undefined) {
                  const numKbBefore = Number(kbBefore);
                  const numKbAfter = kbAfter !== null && kbAfter !== undefined ? Number(kbAfter) : null;
                  if (!isNaN(numKbBefore) && (numKbAfter === null || Math.abs(numKbAfter - numKbBefore) > 0.0001)) {
                    match = false;
                  }
                }
              }

              comparisons.push({
                col,
                rowIdx: i,
                before: beforeVal,
                after: afterVal,
                expected,
                kbBefore,
                kbAfter,
                match
              });
            }

            // Also add KB fields that have no matching base field
            for (const kb of kbFields) {
              const base = kb.replace(/_KB$/i, '');
              const hasBase = regularFields.some(f => f.toUpperCase() === base.toUpperCase());
              if (hasBase) { continue; } // already handled above

              const beforeVal = beforeResult.rows[i][kb];
              const afterVal = afterResult.rows[i][kb];
              if (beforeVal === null || beforeVal === undefined) { continue; }

              const numBefore = Number(beforeVal);
              if (isNaN(numBefore)) { continue; }

              const numAfter = afterVal !== null && afterVal !== undefined ? Number(afterVal) : null;
              const match = numAfter !== null && Math.abs(numAfter - numBefore) < 0.0001;

              comparisons.push({
                col: kb,
                rowIdx: i,
                before: beforeVal,
                after: afterVal,
                expected: numBefore,
                kbBefore: null,
                kbAfter: null,
                match
              });
            }
          }

          if (comparisons.length > 0) {
            compMap.set(table, { columns: ['Column', 'Row', 'Before', 'After', 'Expected', 'KB Before', 'KB After', 'Match'], rows: comparisons });
          }
        }

        this.comparisonResults.set(compMap);
        this.comparisonCollapsed.set(new Set(compMap.keys()));
        this.comparisonExecuted.set(true);
        this.comparisonLoading.set(false);
      },
      error: (err) => {
        this.comparisonError.set(err?.error?.error ?? err?.message ?? 'Comparison queries failed');
        this.comparisonLoading.set(false);
      }
    });
  }

  executeDetailQueries(): void {
    const wellId = this.wellIdInput().trim();
    const allTables = this.recordCountsResult()?.columns ?? [];
    if (!wellId || !allTables.length) { return; }

    this.detailLoading.set(true);
    this.detailError.set('');
    this.detailResults.set(new Map());
    this.visibleColumnsCache.clear();
    this.showNullColsTables.set(new Set());
    this.showNullRowsTables.set(new Set());

    const queries: Record<string, ReturnType<typeof this.db.executeQuery>> = {};
    const updateAllDatums = this.updateAllDatums();
    for (const table of allTables) {
      const skipExtraWhere = updateAllDatums && table.toUpperCase().replace(/ /g, '_') === 'CD_DATUM';
      const sql = getTableDetailQuery(table, wellId, { skipExtraWhere });
      if (sql) {
        queries[table] = this.db.executeQuery(sql);
      }
    }

    if (!Object.keys(queries).length) {
      this.detailLoading.set(false);
      return;
    }

    forkJoin(queries).subscribe({
      next: (results) => {
        const map = new Map<string, QueryResult>();
        for (const [table, result] of Object.entries(results)) {
          map.set(table, result);
        }
        this.detailResults.set(map);
        this.detailCollapsed.set(new Set(map.keys()));
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailError.set(err?.error?.error ?? err?.message ?? 'Detail queries failed');
        this.detailLoading.set(false);
      }
    });
  }

  toggleDetailCollapse(tableName: string): void {
    const current = new Set(this.detailCollapsed());
    if (current.has(tableName)) {
      current.delete(tableName);
    } else {
      current.add(tableName);
    }
    this.detailCollapsed.set(current);
  }

  toggleAllDetailCollapse(): void {
    if (this.allDetailCollapsed()) {
      this.detailCollapsed.set(new Set());
    } else {
      this.detailCollapsed.set(new Set(this.filteredDetailTablesList()));
    }
  }

  isDetailCollapsed(tableName: string): boolean {
    return this.detailCollapsed().has(tableName);
  }

  getVisibleColumns(tableName: string): string[] {
    const cached = this.visibleColumnsCache.get(tableName);
    if (cached) { return cached; }
    const dr = this.filteredDetailResults().get(tableName);
    if (!dr) { return []; }
    const cols = dr.columns.filter(col => {
      if (col === 'TABLE_NAME' || col === 'WELL_ID') { return true; }
      return dr.rows.some(row => row[col] !== null && row[col] !== undefined);
    });
    this.visibleColumnsCache.set(tableName, cols);
    return cols;
  }

  isShowingNullCols(tableName: string): boolean {
    return this.showNullColsTables().has(tableName);
  }

  toggleShowNullCols(tableName: string): void {
    const current = new Set(this.showNullColsTables());
    if (current.has(tableName)) {
      current.delete(tableName);
    } else {
      current.add(tableName);
    }
    this.showNullColsTables.set(current);
  }

  isShowingNullRows(tableName: string): boolean {
    return this.showNullRowsTables().has(tableName);
  }

  toggleShowNullRows(tableName: string): void {
    const current = new Set(this.showNullRowsTables());
    if (current.has(tableName)) {
      current.delete(tableName);
    } else {
      current.add(tableName);
    }
    this.showNullRowsTables.set(current);
    this.visibleColumnsCache.delete(tableName);
  }
}
