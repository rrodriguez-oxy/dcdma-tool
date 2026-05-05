// ─── Event Properties Compare Records ────────────────────────────────────────
// Generates a single UNION ALL query comparing source/target event record counts
// for event-level property tables (no date filter needed).

export function compareEventProperties(
  wellId: string,
  srcEventId: string,
  tgtEventId: string
): string {
  const w = wellId;
  const src = srcEventId;
  const tgt = tgtEventId;

  const srcCnt = (t: string) =>
    `(SELECT COUNT(*) FROM ${t} WHERE well_id='${w}' AND event_id='${src}')`;
  const tgtCnt = (t: string) =>
    `(SELECT COUNT(*) FROM ${t} WHERE well_id='${w}' AND event_id='${tgt}')`;

  const tables = [
    'DM_EVENT_APPROVAL',
    'DM_EVENT_COMPLETION_LINK',
    'DM_EVENT_CONTRACT_LINK',
    'DM_EVENT_COST',
    'DM_EVENT_REMARKS',
    'DM_EVENT_STATUS',
    'DM_EVENT_TASKS',
    'DM_PARTNER_EVENT',
  ];

  const selects = tables.map(t =>
    `SELECT '${t}' AS "Table_name", ${srcCnt(t)} AS "Old_Event_Count", ${tgtCnt(t)} AS "New_Event_Count" FROM DUAL`
  );

  return selects.join('\nUNION ALL\n');
}

// ─── Move Event Properties ───────────────────────────────────────────────────
// Generates UPDATE statements to move event_id from source to target
// for each table that has source records.

export const EP_TABLES = [
  'DM_EVENT_APPROVAL',
  'DM_EVENT_COMPLETION_LINK',
  'DM_EVENT_CONTRACT_LINK',
  'DM_EVENT_COST',
  'DM_EVENT_REMARKS',
  'DM_EVENT_STATUS',
  'DM_EVENT_TASKS',
  'DM_PARTNER_EVENT',
];

export function moveEventPropertiesQueries(
  wellId: string,
  srcEventId: string,
  tgtEventId: string
): { tableName: string; sql: string }[] {
  return EP_TABLES.map(t => ({
    tableName: t,
    sql: `UPDATE ${t} c SET c.event_id = '${tgtEventId}' WHERE c.well_id = '${wellId}' AND c.event_id = '${srcEventId}'`,
  }));
}

// ─── Verify Event Properties After Move ──────────────────────────────────────
// Re-counts records after the move to confirm it worked.

export function verifyEventProperties(
  wellId: string,
  srcEventId: string,
  tgtEventId: string,
  tableFilter?: Set<string>
): string {
  const srcCnt = (t: string) =>
    `(SELECT COUNT(*) FROM ${t} WHERE well_id='${wellId}' AND event_id='${srcEventId}')`;
  const tgtCnt = (t: string) =>
    `(SELECT COUNT(*) FROM ${t} WHERE well_id='${wellId}' AND event_id='${tgtEventId}')`;

  const tables = tableFilter ? EP_TABLES.filter(t => tableFilter.has(t)) : EP_TABLES;
  const selects = tables.map(t =>
    `SELECT '${t}' AS "Table_name", ${srcCnt(t)} AS "Old_Event_Count", ${tgtCnt(t)} AS "New_Event_Count" FROM DUAL`
  );

  return selects.join('\nUNION ALL\n');
}
