import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface TransactionStatement {
  sql: string;
  label: string;
  wellId: string;
  binds?: Record<string, unknown>;
}

export interface TransactionResultRow {
  label: string;
  wellId: string;
  success: boolean;
  rowsAffected: number;
  error: string;
  sql: string;
}

export interface FailedWellInfo {
  wellId: string;
  failedLabel: string;
  error: string;
}

export interface TransactionResult {
  committed: boolean;
  failedWells: FailedWellInfo[];
  error?: string;
  results: TransactionResultRow[];
}

// ─── Session types ───────────────────────────────────────────────────────────
export interface SessionBeginResult {
  sessionId: string;
}

export interface SessionStatement {
  sql: string;
  label: string;
  binds?: Record<string, unknown>;
}

export interface SessionExecuteRow {
  label: string;
  success: boolean;
  rowsAffected: number;
  error: string;
}

export interface SessionExecuteResult {
  results: SessionExecuteRow[];
}

export interface SessionCommitResult {
  committed: boolean;
}

export interface SessionRollbackResult {
  rolledBack: boolean;
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  executeQuery(sql: string): Observable<QueryResult> {
    return this.http.post<QueryResult>(`${this.baseUrl}/query`, { sql });
  }

  executeTransaction(statements: TransactionStatement[]): Observable<TransactionResult> {
    return this.http.post<TransactionResult>(`${this.baseUrl}/execute`, { statements });
  }

  // ─── Transactional session methods ───────────────────────────────────────
  sessionBegin(): Observable<SessionBeginResult> {
    return this.http.post<SessionBeginResult>(`${this.baseUrl}/session/begin`, {});
  }

  sessionExecute(sessionId: string, statements: SessionStatement[]): Observable<SessionExecuteResult> {
    return this.http.post<SessionExecuteResult>(`${this.baseUrl}/session/execute`, { sessionId, statements });
  }

  sessionQuery(sessionId: string, sql: string): Observable<QueryResult> {
    return this.http.post<QueryResult>(`${this.baseUrl}/session/query`, { sessionId, sql });
  }

  sessionCommit(sessionId: string): Observable<SessionCommitResult> {
    return this.http.post<SessionCommitResult>(`${this.baseUrl}/session/commit`, { sessionId });
  }

  sessionRollback(sessionId: string): Observable<SessionRollbackResult> {
    return this.http.post<SessionRollbackResult>(`${this.baseUrl}/session/rollback`, { sessionId });
  }

  sessionCleanup(): Observable<{ cleaned: number }> {
    return this.http.post<{ cleaned: number }>(`${this.baseUrl}/session/cleanup`, {});
  }
}
