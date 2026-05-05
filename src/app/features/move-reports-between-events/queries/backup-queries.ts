// ─── Backup Queries ──────────────────────────────────────────────────────────
// Generates CREATE TABLE ... AS SELECT backup statements for each table
// before moving records between events. Only tables that have a date-aware
// filter produce a backup query; tables with no filter are skipped.

import { backupTableName } from './backup-suffix';

export interface BackupQuery {
  tableName: string;
  sql: string;
}

export function backupQueries(
  wellId: string,
  eventId: string,
  fromDate?: string,
  toDate?: string,
  suffix?: string
): BackupQuery[] {
  const w = wellId;
  const e = eventId;
  const sfx = suffix || 'BK';
  const fd = fromDate || '1900-01-01';
  const td = toDate || '2099-12-31';
  const F = `TO_DATE('${fd}','YYYY-MM-DD')`;
  const T = `TO_DATE('${td}','YYYY-MM-DD')`;

  // ── Common filter fragments ──
  const exDaily = `EXISTS(SELECT 1 FROM DM_DAILY d WHERE d.well_id=c.well_id AND d.daily_id=c.daily_id AND d.event_id=c.event_id AND d.date_report>=${F} AND d.date_report<=${T})`;

  const exRJNoEvt = `EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE c.well_id=j.well_id AND c.report_journal_id=j.report_journal_id AND j.date_report>=${F} AND j.date_report<=${T})`;

  const viaWH = `c.wellhead_id IN (SELECT w.wellhead_id FROM CD_WELLHEAD w WHERE w.well_id=c.well_id AND w.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=w.well_id AND j.report_journal_id=w.report_journal_id AND j.event_id=w.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const viaCP = `c.conv_pump_id IN (SELECT cp.conv_pump_id FROM DM_CONV_PUMP cp WHERE cp.well_id=c.well_id AND cp.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=cp.well_id AND j.report_journal_id=cp.report_journal_id AND j.event_id=cp.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const viaPL = `c.plunger_lift_id IN (SELECT pl.plunger_lift_id FROM DM_PLUNGER_LIFT pl WHERE pl.well_id=c.well_id AND pl.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=pl.well_id AND j.report_journal_id=pl.report_journal_id AND j.event_id=pl.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const viaSJ = `c.stim_job_id IN (SELECT sj.stim_job_id FROM DM_STIM_JOB sj WHERE sj.well_id=c.well_id AND sj.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=sj.well_id AND j.report_journal_id=sj.report_journal_id AND j.event_id=sj.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const viaOEF = `c.failure_id IN (SELECT ef.failure_id FROM DM_OPER_EQUIP_FAIL ef WHERE ef.well_id=c.well_id AND ef.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=ef.well_id AND j.report_journal_id=ef.report_journal_id AND j.event_id=ef.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const viaINC = `c.incident_id IN (SELECT i.incident_id FROM DM_INCIDENT i WHERE i.well_id=c.well_id AND i.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=i.well_id AND j.report_journal_id=i.report_journal_id AND j.event_id=i.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const viaWP = `c.well_plan_id IN (SELECT wp.well_plan_id FROM DM_WELL_PLAN wp WHERE wp.well_id=c.well_id AND wp.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=wp.well_id AND j.report_journal_id=wp.report_journal_id AND j.event_id=wp.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const viaFish = `EXISTS(SELECT 1 FROM DM_FISHING f WHERE f.well_id=c.well_id AND f.fishing_id=c.fishing_id AND f.event_id=c.event_id AND f.date_report>=${F} AND f.date_report<=${T})`;

  const viaFH = `EXISTS(SELECT 1 FROM DM_FLUID_HAUL f WHERE f.well_id=c.well_id AND f.fluid_haul_id=c.fluid_haul_id AND f.event_id=c.event_id AND f.date_report>=${F} AND f.date_report<=${T})`;

  const viaGD = `c.geology_daily_id IN (SELECT gd.geology_daily_id FROM DM_GEOLOGY_DAILY gd WHERE gd.well_id=c.well_id AND gd.event_id=c.event_id AND gd.date_report>=${F} AND gd.date_report<=${T})`;

  const viaPR = `c.pipe_run_id IN (SELECT pr.pipe_run_id FROM DM_PIPE_RUN pr WHERE pr.well_id=c.well_id AND pr.event_id=c.event_id AND pr.date_report>=${F} AND pr.date_report<=${T})`;

  const viaMT = `c.transfer_id IN (SELECT mt.transfer_id FROM DM_MATERIAL_TRANSFER mt WHERE mt.well_id=c.well_id AND mt.event_id=c.event_id AND mt.date_report>=${F} AND mt.date_report<=${T})`;

  const viaUO = `EXISTS(SELECT 1 FROM DM_UNDERWATER_OP uo WHERE uo.well_id=c.well_id AND uo.underwater_op_id=c.underwater_op_id AND uo.event_id=c.event_id AND uo.date_report>=${F} AND uo.date_report<=${T})`;

  const viaFB = `c.fluid_balance_id IN (SELECT fb.fluid_balance_id FROM DM_FLUID_BALANCE fb WHERE fb.well_id=c.well_id AND EXISTS(SELECT 1 FROM DM_DAILY d WHERE d.well_id=fb.well_id AND d.daily_id=fb.daily_id AND d.event_id=fb.event_id AND d.date_report>=${F} AND d.date_report<=${T}))`;

  const viaFL = `c.fluid_loss_id IN (SELECT fl.fluid_loss_id FROM DM_FLUID_LOSS fl WHERE fl.well_id=c.well_id AND EXISTS(SELECT 1 FROM DM_DAILY d WHERE d.well_id=fl.well_id AND d.daily_id=fl.daily_id AND d.event_id=fl.event_id AND d.date_report>=${F} AND d.date_report<=${T}))`;

  const viaCAS = `EXISTS(SELECT 1 FROM DM_CASING ca WHERE ca.well_id=c.well_id AND ca.casing_id=c.casing_id AND ca.event_id=c.event_id AND ca.date_report>=${F} AND ca.date_report<=${T})`;

  const viaGW = `EXISTS(SELECT 1 FROM DM_GENERAL_WORK gw WHERE gw.well_id=c.well_id AND gw.general_work_id=c.general_work_id AND gw.event_id=c.event_id AND gw.date_report>=${F} AND gw.date_report<=${T})`;

  const viaAsm = `c.assembly_id IN (SELECT a.assembly_id FROM CD_ASSEMBLY a WHERE a.well_id=c.well_id AND a.event_id=c.event_id AND ((a.date_report>=${F} AND a.date_report<=${T}) OR EXISTS(SELECT 1 FROM DM_BHA_RUN br WHERE br.well_id=c.well_id AND c.assembly_id=br.assembly_id AND br.date_in>=${F} AND br.date_in<=${T})))`;

  const viaAsmRJ = `c.assembly_id IN (SELECT a.assembly_id FROM CD_ASSEMBLY a WHERE a.well_id=c.well_id AND a.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=a.well_id AND j.report_journal_id=a.report_journal_id AND j.event_id=a.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const sjStage = `${viaSJ} AND c.stage_id IN (SELECT ss.stage_id FROM DM_STIM_STAGE ss WHERE ss.well_id=c.well_id AND ss.event_id=c.event_id AND ss.stim_job_id=c.stim_job_id)`;

  const viaSL = `EXISTS(SELECT 1 FROM DM_SLICKLINE sl WHERE sl.well_id=c.well_id AND sl.event_id=c.event_id AND sl.date_start>=${F} AND sl.date_start<=${T} AND sl.date_end>=${F})`;

  // ── Build backup SQL ──
  const bk = (table: string, filter: string): BackupQuery => ({
    tableName: table,
    sql: `CREATE TABLE ${backupTableName(table, sfx)} AS SELECT * FROM ${table} c WHERE c.well_id='${w}' AND c.event_id='${e}' AND ${filter}`,
  });

  const bkAll = (table: string): BackupQuery => ({
    tableName: table,
    sql: `CREATE TABLE ${backupTableName(table, sfx)} AS SELECT * FROM ${table} c WHERE c.well_id='${w}' AND c.event_id='${e}'`,
  });

  return [
    bk('CD_ASSEMBLY_COMP', viaAsm),
    bk('CD_FLUID', exDaily),
    bk('CD_WELLHEAD_COMP', viaWH),
    bk('CD_WELLHEAD_COMP_OUTLET', viaWH),
    bk('CD_WELLHEAD_COMPLETION_LINK', viaWH),
    bk('CD_WELLHEAD_HANGER', viaWH),
    bk('CD_WELLHEAD_HANGER_CONTROL', viaWH),
    bk('CD_WELLHEAD_TEST', viaWH),
    bk('CD_WEQP_CONV_PUMP', viaCP),
    bk('CD_WEQP_GRAVEL_PACK_SCREEN', viaAsmRJ),
    bk('DM_ACTIVITY', exDaily),
    bk('DM_AFE_EVENT_LINK', `EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=c.well_id AND j.event_id=c.event_id AND j.date_report>=${F} AND j.date_report<=${T} AND j.afe_id IS NOT NULL)`),
    bk('DM_ANCHOR_OP', exDaily),
    bk('DM_BHA_OP', exDaily),
    bk('DM_BIT_OP', exDaily),
    bk('DM_BOILER_OP', exDaily),
    bkAll('DM_BULK'),
    bk('DM_BULK_TRAN', exDaily),
    bk('DM_CARBIDE_LAG', viaGD),
    bk('DM_CENTRIFUGE_OP', exDaily),
    bk('DM_CHROMATOGRAPHY', viaGD),
    bkAll('DM_COMPANY'),
    bk('DM_COMPANY_DAILY', exDaily),
    bk('DM_COUNTER_WEIGHT', viaCP),
    bk('DM_CREW_OP', exDaily),
    bk('DM_CUTTINGS', exDaily),
    bk('DM_DAILYCOST', exDaily),
    bk('DM_DAILY_COMPLETION', exDaily),
    bk('DM_DAILY_CT_OP', exDaily),
    bk('DM_DAILY_DITCH_MAGNET', exDaily),
    bk('DM_DAILY_FLARING', exDaily),
    bk('DM_DAILY_EQUIPMENT', exDaily),
    bk('DM_DAILY_GLV_TEST', exDaily),
    bk('DM_DAILY_NOTIFICATION', exDaily),
    bk('DM_DAILY_SSSV_TEST', exDaily),
    bk('DM_DAILY_UBD', exDaily),
    bk('DM_DEGASSER_OP', exDaily),
    bk('DM_DISCHARGE', exDaily),
    bk('DM_DISPOSAL', exDaily),
    bk('DM_DRILLINE_OP', exDaily),
    bk('DM_ENVIRONMENTAL', exDaily),
    bk('DM_FISHING_FREE_POINT', viaFish),
    bk('DM_FISHING_RESPONSIBLE', viaFish),
    bk('DM_FISHING_RESULTS', viaFish),
    bk('DM_FISHING_STRING_SHOT', viaFish),
    bk('DM_FLUID_BALANCE', exDaily),
    bk('DM_FLUID_HAUL_DETAIL', viaFH),
    bk('DM_FLUID_INPUT', viaFB),
    bk('DM_FLUID_LOSS', exDaily),
    bk('DM_FLUID_LOSS_HOLE_SECT', viaFL),
    bk('DM_GAS_LIFT', exRJNoEvt),
    bk('DM_GAS_PEAK', viaGD),
    bk('DM_GRAVEL_PACK', exRJNoEvt),
    bk('DM_GUIDELINE_OP', exDaily),
    bk('DM_HOTNOTE', `c.date_from>=${F} AND c.date_from<=${T} AND c.date_to>=${F}`),
    bk('DM_HSE', exDaily),
    bk('DM_HYDROCLONE_OP', exDaily),
    bk('DM_INCIDENT_COST', viaINC),
    bk('DM_INCIDENT_DETAIL', viaINC),
    bk('DM_INTERMEDIATE_CIRC', viaCAS),
    bk('DM_MOTOR_OP', exDaily),
    bk('DM_MUDGAS', viaGD),
    bkAll('DM_MUD_PRODUCT'),
    bk('DM_MUD_PRODUCT_TRAN', exDaily),
    bk('DM_MUD_VOLUME', exDaily),
    bk('DM_OPER_EQUIP_FAIL_STATUS', viaOEF),
    bkAll('DM_PERSONNEL'),
    bk('DM_PERSONNEL_DAILY', exDaily),
    bk('DM_PIPE_DATA', viaPR),
    bk('DM_PIPE_TALLY', viaPR),
    bk('DM_PIT_OP', exDaily),
    bk('DM_PLUNGER_ACC', viaPL),
    bk('DM_PLUNGER_LIFT_STAGE_SYSTEM', viaPL),
    bk('DM_PRIME_MOVER', viaCP),
    bk('DM_PRODUCED', exDaily),
    bk('DM_PROD_EQUIP_FAIL', exRJNoEvt),
    bk('DM_PUMP_JACK', viaCP),
    bk('DM_PUMP_OP', exDaily),
    bk('DM_RECOVERY', exDaily),
    bk('DM_RIG_ACTIVITY', exDaily),
    bk('DM_RIG_DECKLOG', exDaily),
    bk('DM_RIG_DECKLOG_REMARKS', exDaily),
    bkAll('DM_RIG_OPERATION_EVENT_LINK'),
    bk('DM_RISERLINE_OP', exDaily),
    bk('DM_RISER_OP', exDaily),
    bk('DM_SAFETY', exDaily),
    bk('DM_SAFETY_INCIDENT', exDaily),
    bk('DM_SAFETY_KICK_DETECT', exDaily),
    bk('DM_SHAKERSCREEN_OP', exDaily),
    bk('DM_SHAKER_OP', exDaily),
    bk('DM_SLICKLINE_DAILY', exDaily),
    bk('DM_SLICKLINE_PURPOSE', exDaily),
    bk('DM_SLICKLINE_SOLID', viaSL),
    bk('DM_SPILLS', exDaily),
    bk('DM_STIM_FET_TEST', viaSJ),
    bk('DM_STIM_FLOWBACK', viaSJ),
    bk('DM_STIM_FLOWPATH', viaSJ),
    bk('DM_STIM_FLOWPATH_STAGE', viaSJ),
    bk('DM_STIM_FLUID', viaSJ),
    bk('DM_STIM_FLUID_ADD', viaSJ),
    bk('DM_STIM_FLUID_SCHEDULE', sjStage),
    bk('DM_STIM_PUMPING_DIAG', viaSJ),
    bk('DM_STIM_PUMP_FB_TEST', viaSJ),
    bk('DM_STIM_RES_INTERVAL', viaSJ),
    bk('DM_STIM_STAGE', viaSJ),
    bk('DM_STIM_STAGE_SUPPLEMENT', sjStage),
    bk('DM_STIM_STEP_TEST', viaSJ),
    bk('DM_STIM_TREATMENT', viaSJ),
    bk('DM_STIM_TREATMENT_AC_COMP', viaSJ),
    bk('DM_STIM_TREATMENT_ADDITIVE', viaSJ),
    bk('DM_STIM_TREATMENT_FLUID', viaSJ),
    bk('DM_STIM_TREATMENT_PROPPANT', viaSJ),
    bk('DM_SUPPORT_VESSEL_DAILY', exDaily),
    bk('DM_TRANSFER_DETAIL', viaMT),
    bk('DM_TRANSFER_SUMMARY', viaMT),
    bk('DM_UNDERWATER_DETAIL', viaUO),
    bk('DM_UNDERWATER_EQUIPMENT', viaUO),
    bkAll('DM_UNDERWATER_MATERIAL'),
    bk('DM_UNDERWATER_MATERIAL_TRAN', viaUO),
    bk('DM_UNDERWATER_PERS', viaUO),
    bk('DM_VESSEL_BULK_TRAN', exDaily),
    bk('DM_WEATHER_CHECK', exDaily),
    bk('DM_WEATHER_CURRENT', exDaily),
    bk('DM_WELLBORE_ZONE_ACTIVITY', exDaily),
    bk('DM_WELL_PLAN_OFFSET', viaWP),
    bk('DM_WORK_DETAIL', viaGW),
  ];
}
