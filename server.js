const express = require('express');
const oracledb = require('oracledb');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));

// CORS — allow frontend origin (configurable via env var)
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({ origin: ALLOWED_ORIGIN }));

// Serve Angular static files in production
const staticPath = path.join(__dirname, 'dist', 'dcdma-tool', 'browser');
app.use(express.static(staticPath));

const DB_CONFIG = {
  user: process.env.ORACLE_USER || 'DCDMA',
  password: process.env.ORACLE_PASSWORD || 'dcdmapsp',
  connectString: process.env.ORACLE_CONNECT_STRING || 'ohyloral-d.naoxy.com:1527/HOPSPT'
};

// ─── Transactional Sessions ──────────────────────────────────────────────────
// Holds open Oracle connections keyed by session ID so that multiple requests
// share the same transaction. Auto-expires after 30 minutes of inactivity.
const sessions = new Map();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function cleanupSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) { return; }
  clearTimeout(session.timer);
  sessions.delete(sessionId);
  session.connection.execute('ROLLBACK')
    .catch(() => {})
    .finally(() => session.connection.close().catch(() => {}));
}

function touchSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) { return; }
  clearTimeout(session.timer);
  session.timer = setTimeout(() => cleanupSession(sessionId), SESSION_TIMEOUT_MS);
}

// POST /api/session/begin — open a new connection, return sessionId
app.post('/api/session/begin', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(DB_CONFIG);
    const sessionId = crypto.randomUUID();
    const timer = setTimeout(() => cleanupSession(sessionId), SESSION_TIMEOUT_MS);
    sessions.set(sessionId, { connection, timer });
    res.json({ sessionId });
  } catch (err) {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
    console.error('Session begin error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/execute — run DML/DDL statements within the session
app.post('/api/session/execute', async (req, res) => {
  const { sessionId, statements } = req.body;
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  if (!Array.isArray(statements) || !statements.length) {
    return res.status(400).json({ error: 'Missing or invalid statements array' });
  }
  touchSession(sessionId);
  const connection = session.connection;
  // Set a 30-second timeout per statement to prevent lock waits
  connection.callTimeout = 30 * 1000;
  const results = [];
  console.log(`[session/execute] Starting ${statements.length} statements for session ${sessionId.slice(0, 8)}...`);
  try {
    for (let idx = 0; idx < statements.length; idx++) {
      const stmt = statements[idx];
      if (!stmt.sql || typeof stmt.sql !== 'string') {
        results.push({ label: stmt.label || 'unknown', success: false, rowsAffected: 0, error: 'Missing sql' });
        continue;
      }
      try {
        console.log(`  [${idx + 1}/${statements.length}] ${stmt.label || stmt.sql.slice(0, 60)}...`);
        const result = await connection.execute(stmt.sql, stmt.binds || {}, { autoCommit: false });
        results.push({
          label: stmt.label || '',
          success: true,
          rowsAffected: result.rowsAffected || 0,
          error: ''
        });
      } catch (stmtErr) {
        console.log(`  [${idx + 1}/${statements.length}] FAILED: ${stmtErr.message}`);
        results.push({
          label: stmt.label || '',
          success: false,
          rowsAffected: 0,
          error: stmtErr.message
        });
        // Continue with remaining statements instead of stopping
        continue;
      }
    }
    console.log(`[session/execute] Done. ${results.filter(r => r.success).length}/${results.length} succeeded.`);
    res.json({ results });
  } catch (err) {
    console.error('Session execute error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/query — run a SELECT within the session (sees uncommitted changes)
app.post('/api/session/query', async (req, res) => {
  const { sessionId, sql } = req.body;
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid sql parameter' });
  }
  touchSession(sessionId);
  try {
    const result = await session.connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const columns = result.metaData ? result.metaData.map(col => col.name) : [];
    const rows = result.rows || [];
    res.json({ columns, rows });
  } catch (err) {
    console.error('Session query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/commit — commit and close
app.post('/api/session/commit', async (req, res) => {
  const { sessionId } = req.body;
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  clearTimeout(session.timer);
  sessions.delete(sessionId);
  try {
    await session.connection.execute('COMMIT');
    await session.connection.close();
    res.json({ committed: true });
  } catch (err) {
    console.error('Session commit error:', err.message);
    try { await session.connection.close(); } catch (_) {}
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/rollback — rollback and close
app.post('/api/session/rollback', async (req, res) => {
  const { sessionId } = req.body;
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  clearTimeout(session.timer);
  sessions.delete(sessionId);
  try {
    await session.connection.execute('ROLLBACK');
    await session.connection.close();
    res.json({ rolledBack: true });
  } catch (err) {
    console.error('Session rollback error:', err.message);
    try { await session.connection.close(); } catch (_) {}
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/cleanup — rollback and close ALL active sessions
app.post('/api/session/cleanup', async (req, res) => {
  const ids = [...sessions.keys()];
  for (const id of ids) {
    cleanupSession(id);
  }
  res.json({ cleaned: ids.length });
});

app.post('/api/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid sql parameter' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(DB_CONFIG);
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const columns = result.metaData ? result.metaData.map(col => col.name) : [];
    const rows = result.rows || [];

    res.json({ columns, rows });
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr.message);
      }
    }
  }
});

const PORT = process.env.PORT || 3000;

app.post('/api/execute', async (req, res) => {
  const { statements } = req.body;
  if (!Array.isArray(statements) || !statements.length) {
    return res.status(400).json({ error: 'Missing or invalid statements array' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(DB_CONFIG);

    // Group statements by wellId to apply savepoints per well
    const groups = [];
    let currentWell = null;
    let currentGroup = null;
    for (const stmt of statements) {
      if (stmt.wellId !== currentWell) {
        currentWell = stmt.wellId;
        currentGroup = { wellId: currentWell, statements: [] };
        groups.push(currentGroup);
      }
      currentGroup.statements.push(stmt);
    }

    const results = [];
    const failedWells = [];

    for (const group of groups) {
      const spName = 'SP_' + group.wellId.replace(/[^a-zA-Z0-9]/g, '_');
      await connection.execute(`SAVEPOINT ${spName}`);

      let groupFailed = false;
      for (let i = 0; i < group.statements.length; i++) {
        const stmt = group.statements[i];
        if (!stmt.sql || typeof stmt.sql !== 'string') {
          throw new Error(`Statement (${stmt.label || 'unknown'}): missing sql`);
        }

        if (groupFailed) {
          results.push({
            label: stmt.label || `Step`,
            wellId: stmt.wellId || '',
            success: false,
            rowsAffected: 0,
            error: 'Skipped (previous step failed)',
            sql: ''
          });
          continue;
        }

        try {
          const binds = stmt.binds || {};
          const result = await connection.execute(stmt.sql, binds);
          results.push({
            label: stmt.label || `Step`,
            wellId: stmt.wellId || '',
            success: true,
            rowsAffected: result.rowsAffected || 0,
            error: '',
            sql: ''
          });
        } catch (stmtErr) {
          groupFailed = true;
          await connection.execute(`ROLLBACK TO SAVEPOINT ${spName}`);
          failedWells.push({
            wellId: group.wellId,
            failedLabel: stmt.label,
            error: stmtErr.message
          });
          results.push({
            label: stmt.label || `Step`,
            wellId: stmt.wellId || '',
            success: false,
            rowsAffected: 0,
            error: stmtErr.message,
            sql: stmt.sql
          });
        }
      }
    }

    await connection.execute('COMMIT');
    res.json({
      committed: true,
      failedWells,
      results
    });
  } catch (err) {
    console.error('Execute error:', err.message);
    if (connection) {
      try { await connection.execute('ROLLBACK'); } catch (_) {}
    }
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (closeErr) {
        console.error('Error closing connection:', closeErr.message);
      }
    }
  }
});

// SPA catch-all — serve index.html for any non-API route
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
