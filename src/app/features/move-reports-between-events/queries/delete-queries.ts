// ─── Delete Source Queries ────────────────────────────────────────────────────
// Generates DELETE statements to remove records from the source event tables
// after they have been backed up and inserted into the target event.
// Only child/detail tables with date-aware filters are included.
// Parent tables and add-only tables are excluded.

export interface DeleteQuery {
  tableName: string;
  sql: string;
}

export function deleteQueries(
  wellId: string,
  eventId: string,
  fromDate?: string,
  toDate?: string
): DeleteQuery[] {
  const w = wellId;
  const e = eventId;
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

  const viaSL = `c.slickline_id IN (SELECT sl.slickline_id FROM DM_SLICKLINE sl WHERE sl.well_id=c.well_id AND sl.event_id=c.event_id AND sl.date_start>=${F} AND sl.date_start<=${T} AND sl.date_end>=${F})`;

  // ── Build DELETE statements ──
  const del = (table: string, filter: string): DeleteQuery => ({
    tableName: table,
    sql: `DELETE FROM ${table} c WHERE c.well_id='${w}' AND c.event_id='${e}' AND ${filter}`,
  });

  return [
    del('CD_ASSEMBLY_COMP', viaAsm),
    del('CD_FLUID', exDaily),
    del('CD_WELLHEAD_COMP', viaWH),
    del('CD_WELLHEAD_COMP_OUTLET', viaWH),
    del('CD_WELLHEAD_COMPLETION_LINK', viaWH),
    del('CD_WELLHEAD_HANGER', viaWH),
    del('CD_WELLHEAD_HANGER_CONTROL', viaWH),
    del('CD_WELLHEAD_TEST', viaWH),
    del('CD_WEQP_CONV_PUMP', viaCP),
    del('CD_WEQP_GRAVEL_PACK_SCREEN', viaAsmRJ),
    del('DM_ACTIVITY', exDaily),
    del('DM_AFE_EVENT_LINK', `EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=c.well_id AND j.event_id=c.event_id AND j.date_report>=${F} AND j.date_report<=${T} AND j.afe_id IS NOT NULL)`),
    del('DM_ANCHOR_OP', exDaily),
    del('DM_BHA_OP', exDaily),
    del('DM_BIT_OP', exDaily),
    del('DM_BOILER_OP', exDaily),
    del('DM_BULK_TRAN', exDaily),
    del('DM_CARBIDE_LAG', viaGD),
    del('DM_CENTRIFUGE_OP', exDaily),
    del('DM_CHROMATOGRAPHY', viaGD),
    del('DM_COMPANY_DAILY', exDaily),
    del('DM_COUNTER_WEIGHT', viaCP),
    del('DM_CREW_OP', exDaily),
    del('DM_CUTTINGS', exDaily),
    del('DM_DAILYCOST', exDaily),
    del('DM_DAILY_COMPLETION', exDaily),
    del('DM_DAILY_CT_OP', exDaily),
    del('DM_DAILY_DITCH_MAGNET', exDaily),
    del('DM_DAILY_EQUIPMENT', exDaily),
    del('DM_DAILY_FLARING', exDaily),
    del('DM_DAILY_GLV_TEST', exDaily),
    del('DM_DAILY_NOTIFICATION', exDaily),
    del('DM_DAILY_SSSV_TEST', exDaily),
    del('DM_DAILY_UBD', exDaily),
    del('DM_DEGASSER_OP', exDaily),
    del('DM_DISCHARGE', exDaily),
    del('DM_DISPOSAL', exDaily),
    del('DM_DRILLINE_OP', exDaily),
    del('DM_ENVIRONMENTAL', exDaily),
    del('DM_FISHING_FREE_POINT', viaFish),
    del('DM_FISHING_RESPONSIBLE', viaFish),
    del('DM_FISHING_RESULTS', viaFish),
    del('DM_FISHING_STRING_SHOT', viaFish),
    del('DM_FLUID_BALANCE', exDaily),
    del('DM_FLUID_HAUL_DETAIL', viaFH),
    del('DM_FLUID_INPUT', viaFB),
    del('DM_FLUID_LOSS', exDaily),
    del('DM_FLUID_LOSS_HOLE_SECT', viaFL),
    del('DM_GAS_LIFT', exRJNoEvt),
    del('DM_GAS_PEAK', viaGD),
    del('DM_GRAVEL_PACK', exRJNoEvt),
    del('DM_GUIDELINE_OP', exDaily),
    del('DM_HOTNOTE', `c.date_from>=${F} AND c.date_from<=${T} AND c.date_to>=${F}`),
    del('DM_HSE', exDaily),
    del('DM_HYDROCLONE_OP', exDaily),
    del('DM_INCIDENT_COST', viaINC),
    del('DM_INCIDENT_DETAIL', viaINC),
    del('DM_INTERMEDIATE_CIRC', viaCAS),
    del('DM_MOTOR_OP', exDaily),
    del('DM_MUDGAS', viaGD),
    del('DM_MUD_PRODUCT_TRAN', exDaily),
    del('DM_MUD_VOLUME', exDaily),
    del('DM_OPER_EQUIP_FAIL_STATUS', viaOEF),
    del('DM_PERSONNEL_DAILY', exDaily),
    del('DM_PIPE_DATA', viaPR),
    del('DM_PIPE_TALLY', viaPR),
    del('DM_PIT_OP', exDaily),
    del('DM_PLUNGER_ACC', viaPL),
    del('DM_PLUNGER_LIFT_STAGE_SYSTEM', viaPL),
    del('DM_PRIME_MOVER', viaCP),
    del('DM_PRODUCED', exDaily),
    del('DM_PROD_EQUIP_FAIL', exRJNoEvt),
    del('DM_PUMP_JACK', viaCP),
    del('DM_PUMP_OP', exDaily),
    del('DM_RECOVERY', exDaily),
    del('DM_RIG_ACTIVITY', exDaily),
    del('DM_RIG_DECKLOG', exDaily),
    del('DM_RIG_DECKLOG_REMARKS', exDaily),
    del('DM_RISERLINE_OP', exDaily),
    del('DM_RISER_OP', exDaily),
    del('DM_SAFETY', exDaily),
    del('DM_SAFETY_INCIDENT', exDaily),
    del('DM_SAFETY_KICK_DETECT', exDaily),
    del('DM_SHAKERSCREEN_OP', exDaily),
    del('DM_SHAKER_OP', exDaily),
    del('DM_SLICKLINE_DAILY', exDaily),
    del('DM_SLICKLINE_PURPOSE', exDaily),
    del('DM_SLICKLINE_SOLID', viaSL),
    del('DM_SPILLS', exDaily),
    del('DM_STIM_FET_TEST', viaSJ),
    del('DM_STIM_FLOWBACK', viaSJ),
    del('DM_STIM_FLOWPATH', viaSJ),
    del('DM_STIM_FLOWPATH_STAGE', viaSJ),
    del('DM_STIM_FLUID', viaSJ),
    del('DM_STIM_FLUID_ADD', viaSJ),
    del('DM_STIM_FLUID_SCHEDULE', sjStage),
    del('DM_STIM_PUMPING_DIAG', viaSJ),
    del('DM_STIM_PUMP_FB_TEST', viaSJ),
    del('DM_STIM_RES_INTERVAL', viaSJ),
    del('DM_STIM_STAGE', viaSJ),
    del('DM_STIM_STAGE_SUPPLEMENT', sjStage),
    del('DM_STIM_STEP_TEST', viaSJ),
    del('DM_STIM_TREATMENT', viaSJ),
    del('DM_STIM_TREATMENT_AC_COMP', viaSJ),
    del('DM_STIM_TREATMENT_ADDITIVE', viaSJ),
    del('DM_STIM_TREATMENT_FLUID', viaSJ),
    del('DM_STIM_TREATMENT_PROPPANT', viaSJ),
    del('DM_SUPPORT_VESSEL_DAILY', exDaily),
    del('DM_TRANSFER_DETAIL', viaMT),
    del('DM_TRANSFER_SUMMARY', viaMT),
    del('DM_UNDERWATER_DETAIL', viaUO),
    del('DM_UNDERWATER_EQUIPMENT', viaUO),
    del('DM_UNDERWATER_MATERIAL_TRAN', viaUO),
    del('DM_UNDERWATER_PERS', viaUO),
    del('DM_VESSEL_BULK_TRAN', exDaily),
    del('DM_WEATHER_CHECK', exDaily),
    del('DM_WEATHER_CURRENT', exDaily),
    del('DM_WELLBORE_ZONE_ACTIVITY', exDaily),
    del('DM_WELL_PLAN_OFFSET', viaWP),
    del('DM_WORK_DETAIL', viaGW),
  ];
}
