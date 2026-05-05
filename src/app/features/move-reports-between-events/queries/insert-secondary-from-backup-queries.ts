// ─── Insert Secondary Children From Backup ───────────────────────────────────
// Generates INSERT INTO ... SELECT * FROM ..._BK for secondary child tables
// (children of child tables). These must run AFTER the primary child inserts
// because they depend on the parent child rows already being present.

import { backupTableName } from './backup-suffix';

export interface InsertSecondaryQuery {
  tableName: string;
  sql: string;
}

export function insertSecondaryFromBackupQueries(suffix?: string): InsertSecondaryQuery[] {
  const sfx = suffix || 'BK';
  const ins = (table: string): InsertSecondaryQuery => ({
    tableName: table,
    sql: `INSERT INTO ${table} SELECT * FROM ${backupTableName(table, sfx)}`,
  });

  return [
    ins('CD_WEQP_CONV_PUMP'),
    ins('DM_COUNTER_WEIGHT'),
    ins('DM_PRIME_MOVER'),
    ins('DM_RIG_DECKLOG_REMARKS'),
    ins('DM_SAFETY_INCIDENT'),
    ins('DM_SLICKLINE_PURPOSE'),
    ins('DM_STIM_FET_TEST'),
    ins('DM_STIM_FLOWPATH'),
    ins('DM_STIM_FLOWPATH_STAGE'),
    ins('DM_STIM_FLUID_ADD'),
    ins('DM_STIM_FLUID_SCHEDULE'),
    ins('DM_STIM_PUMPING_DIAG'),
    ins('DM_STIM_PUMP_FB_TEST'),
    ins('DM_STIM_RES_INTERVAL'),
    ins('DM_STIM_STAGE'),
    ins('DM_STIM_STAGE_SUPPLEMENT'),
    ins('DM_STIM_STEP_TEST'),
    ins('DM_STIM_TREATMENT'),
    ins('DM_STIM_TREATMENT_AC_COMP'),
    ins('DM_STIM_TREATMENT_ADDITIVE'),
    ins('DM_STIM_TREATMENT_FLUID'),
    ins('DM_STIM_TREATMENT_PROPPANT'),
    ins('DM_TRANSFER_DETAIL'),
    ins('DM_TRANSFER_SUMMARY'),
    ins('DM_WEATHER_CURRENT'),
  ];
}
