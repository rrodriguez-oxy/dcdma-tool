// ─── Backup Table Suffix ──────────────────────────────────────────────────────
// Generates a unique suffix for backup table names based on well_id and
// target event_id, so multiple users can run moves concurrently without
// conflicting backup table names.
//
// Example: TABLE_BK_ABC123_EVT456

export function backupSuffix(wellId: string, tgtEventId: string): string {
  const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const w = sanitize(wellId).substring(0, 20);
  const e = sanitize(tgtEventId).substring(0, 20);
  return `BK_${w}_${e}`;
}

export function backupTableName(table: string, suffix: string): string {
  return `${table}_${suffix}`;
}
