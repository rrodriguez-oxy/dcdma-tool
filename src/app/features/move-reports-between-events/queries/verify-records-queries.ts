// ─── Verify Records After Move ───────────────────────────────────────────────
// Generates batched UNION ALL queries that re-count records in both events
// after the move has been applied. Used to verify the operation succeeded.
// Columns: Table_name, Old_Event_Count (source), New_Event_Count (target),
//          Move_Acount, Add_Count

export function verifyRecordsAfterMove(
  wellId: string,
  srcEventId: string,
  tgtEventId: string,
  fromDate?: string,
  toDate?: string,
  tableFilter?: Set<string>
): string[] {
  const w = wellId;
  const src = srcEventId;
  const tgt = tgtEventId;
  const fd = fromDate || '1900-01-01';
  const td = toDate || '2099-12-31';
  const F = `TO_DATE('${fd}','YYYY-MM-DD')`;
  const T = `TO_DATE('${td}','YYYY-MM-DD')`;

  // ── Scalar helpers ──
  const srcCnt = (t: string) =>
    `(SELECT COUNT(*) FROM ${t} WHERE well_id='${w}' AND event_id='${src}')`;
  const tgtCnt = (t: string) =>
    `(SELECT COUNT(*) FROM ${t} WHERE well_id='${w}' AND event_id='${tgt}')`;
  const mCnt = (t: string, filter: string) =>
    `(SELECT COUNT(*) FROM ${t} c WHERE c.well_id='${w}' AND c.event_id='${src}' AND ${filter})`;
  const aCnt = (t: string) =>
    `(SELECT COUNT(*) FROM ${t} c WHERE c.well_id='${w}' AND c.event_id='${src}')`;

  // ── Common filter fragments ──
  const dr = `c.date_report>=${F} AND c.date_report<=${T}`;

  const exDaily = `EXISTS(SELECT 1 FROM DM_DAILY d WHERE d.well_id=c.well_id AND d.daily_id=c.daily_id AND d.event_id=c.event_id AND d.date_report>=${F} AND d.date_report<=${T})`;

  const exDailyNoEvt = `EXISTS(SELECT 1 FROM DM_DAILY d WHERE d.well_id=c.well_id AND d.daily_id=c.daily_id AND d.date_report>=${F} AND d.date_report<=${T})`;

  const exRJ = `EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=c.well_id AND j.report_journal_id=c.report_journal_id AND j.event_id=c.event_id AND j.date_report>=${F} AND j.date_report<=${T})`;

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

  const asmFilter = `((c.date_report>=${F} AND c.date_report<=${T}) OR EXISTS(SELECT 1 FROM DM_BHA_RUN br WHERE br.well_id=c.well_id AND c.assembly_id=br.assembly_id AND br.date_in>=${F} AND br.date_in<=${T}))`;

  const viaAsm = `c.assembly_id IN (SELECT a.assembly_id FROM CD_ASSEMBLY a WHERE a.well_id=c.well_id AND a.event_id=c.event_id AND (a.date_report>=${F} AND a.date_report<=${T} OR EXISTS(SELECT 1 FROM DM_BHA_RUN br WHERE br.well_id=c.well_id AND c.assembly_id=br.assembly_id AND br.date_in>=${F} AND br.date_in<=${T})))`;

  const viaAsmRJ = `c.assembly_id IN (SELECT a.assembly_id FROM CD_ASSEMBLY a WHERE a.well_id=c.well_id AND a.event_id=c.event_id AND EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=a.well_id AND j.report_journal_id=a.report_journal_id AND j.event_id=a.event_id AND j.date_report>=${F} AND j.date_report<=${T}))`;

  const sjStage = `${viaSJ} AND c.stage_id IN (SELECT ss.stage_id FROM DM_STIM_STAGE ss WHERE ss.well_id=c.well_id AND ss.event_id=c.event_id AND ss.stim_job_id=c.stim_job_id)`;

  const slDates = `c.date_start>=${F} AND c.date_start<=${T} AND c.date_end>=${F}`;

  const viaSL = `c.slickline_id IN (SELECT sl.slickline_id FROM DM_SLICKLINE sl WHERE sl.well_id=c.well_id AND sl.event_id=c.event_id AND sl.date_start>=${F} AND sl.date_start<=${T} AND sl.date_end>=${F})`;

  // ── Per-table definitions: [name, moveExpr, addExpr] ──
  type R = [string, string, string];
  const mv  = (t: string, f: string): R => [t, mCnt(t, f), '0'];
  const add = (t: string): R => [t, '0', aCnt(t)];
  const full = (t: string): R => [t, aCnt(t), '0'];

  const rows: R[] = [
    mv('CD_ASSEMBLY', asmFilter),
    mv('CD_ASSEMBLY_COMP', viaAsm),
    mv('CD_CEMENT_JOB', dr),
    mv('CD_FLUID', exDaily),
    mv('CD_HOLE_SECT_GROUP', `c.date_sect_start>=${F} AND c.date_sect_start<=${T}`),
    mv('CD_LESSON', exRJ),
    mv('CD_PERFORATE', dr),
    mv('CD_PRESSURE_SURVEY', exRJNoEvt),
    mv('CD_TEST', exRJNoEvt),
    mv('CD_WELLHEAD', exRJ),
    mv('CD_WELLHEAD_COMP', viaWH),
    mv('CD_WELLHEAD_COMP_OUTLET', viaWH),
    mv('CD_WELLHEAD_COMPLETION_LINK', viaWH),
    mv('CD_WELLHEAD_HANGER', viaWH),
    mv('CD_WELLHEAD_HANGER_CONTROL', viaWH),
    mv('CD_WELLHEAD_TEST', viaWH),
    mv('CD_WEQP_CONV_PUMP', viaCP),
    mv('CD_WEQP_GRAVEL_PACK_SCREEN', viaAsmRJ),
    mv('DM_ACTIVITY', exDaily),
    mv('DM_AFE_EVENT_LINK', `EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=c.well_id AND j.event_id=c.event_id AND j.date_report>=${F} AND j.date_report<=${T} AND j.afe_id IS NOT NULL)`),
    mv('DM_ANCHOR_OP', exDaily),
    mv('DM_BHA_OP', exDaily),
    mv('DM_BIT_OP', exDaily),
    mv('DM_BOILER_OP', exDaily),
    add('DM_BULK'),
    mv('DM_BULK_TRAN', exDaily),
    mv('DM_CARBIDE_LAG', viaGD),
    mv('DM_CASING', dr),
    mv('DM_CENTRIFUGE_OP', exDaily),
    mv('DM_CHROMATOGRAPHY', viaGD),
    add('DM_COMPANY'),
    mv('DM_COMPANY_DAILY', exDaily),
    mv('DM_CONV_PUMP', exRJ),
    mv('DM_CORE', dr),
    mv('DM_COUNTER_WEIGHT', viaCP),
    mv('DM_CREW_OP', exDaily),
    mv('DM_CUTTINGS', exDaily),
    mv('DM_DAILY', dr),
    mv('DM_DAILYCOST', exDailyNoEvt),
    mv('DM_DAILY_COMPLETION', exDaily),
    mv('DM_DAILY_CT_OP', exDaily),
    mv('DM_DAILY_DITCH_MAGNET', exDaily),
    mv('DM_DAILY_FLARING', exDaily),
    mv('DM_DAILY_EQUIPMENT', exDaily),
    mv('DM_DAILY_GLV_TEST', exDaily),
    mv('DM_DAILY_NOTIFICATION', exDaily),
    mv('DM_DAILY_SSSV_TEST', exDaily),
    mv('DM_DAILY_UBD', exDaily),
    mv('DM_DEGASSER_OP', exDaily),
    mv('DM_DISCHARGE', exDaily),
    mv('DM_DISPOSAL', exDaily),
    mv('DM_DRILLINE_OP', exDaily),
    mv('DM_DST', dr),
    mv('DM_ENVIRONMENTAL', exDaily),
    mv('DM_ESP', exRJNoEvt),
    mv('DM_FISHING', dr),
    mv('DM_FISHING_FREE_POINT', viaFish),
    mv('DM_FISHING_RESPONSIBLE', viaFish),
    mv('DM_FISHING_RESULTS', viaFish),
    mv('DM_FISHING_STRING_SHOT', viaFish),
    mv('DM_FLUID_BALANCE', exDaily),
    mv('DM_FLUID_HAUL', dr),
    mv('DM_FLUID_HAUL_DETAIL', viaFH),
    mv('DM_FLUID_INPUT', viaFB),
    mv('DM_FLUID_LOSS', exDaily),
    mv('DM_FLUID_LOSS_HOLE_SECT', viaFL),
    mv('DM_GAS_LIFT', exRJ),
    mv('DM_GAS_PEAK', viaGD),
    mv('DM_GENERAL_WORK', dr),
    mv('DM_GEOLOGY_DAILY', dr),
    mv('DM_GRAVEL_PACK', exRJNoEvt),
    mv('DM_GUIDELINE_OP', exDaily),
    ['DM_HOTNOTE', '0', mCnt('DM_HOTNOTE', `c.date_from>=${F} AND c.date_from<=${T} AND c.date_to>=${F}`)],
    mv('DM_HSE', exDaily),
    mv('DM_HYDROCLONE_OP', exDaily),
    mv('DM_INCIDENT', exRJNoEvt),
    mv('DM_INCIDENT_COST', viaINC),
    mv('DM_INCIDENT_DETAIL', viaINC),
    mv('DM_INTERMEDIATE_CIRC', viaCAS),
    mv('DM_KICK', exRJNoEvt),
    mv('DM_LOG', dr),
    mv('DM_MATERIAL_TRANSFER', dr),
    mv('DM_MOTOR_OP', exDaily),
    mv('DM_MUDGAS', viaGD),
    full('DM_MUD_PRODUCT'),
    mv('DM_MUD_PRODUCT_TRAN', exDaily),
    mv('DM_MUD_VOLUME', exDaily),
    mv('DM_OPER_EQUIP_FAIL', exRJ),
    mv('DM_OPER_EQUIP_FAIL_STATUS', viaOEF),
    mv('DM_PCP', exRJNoEvt),
    add('DM_PERSONNEL'),
    mv('DM_PERSONNEL_DAILY', exDaily),
    mv('DM_PIPE_DATA', viaPR),
    mv('DM_PIPE_RUN', dr),
    mv('DM_PIPE_TALLY', viaPR),
    mv('DM_PIT_OP', exDaily),
    mv('DM_PLUNGER_ACC', viaPL),
    mv('DM_PLUNGER_LIFT', exRJ),
    mv('DM_PLUNGER_LIFT_STAGE_SYSTEM', viaPL),
    mv('DM_PRIME_MOVER', viaCP),
    mv('DM_PRODUCED', exDaily),
    mv('DM_PROD_EQUIP_FAIL', exRJ),
    mv('DM_PUMP_JACK', viaCP),
    mv('DM_PUMP_OP', exDaily),
    mv('DM_RECOVERY', exDaily),
    mv('DM_REPORT_JOURNAL', dr),
    mv('DM_RIG_ACTIVITY', exDaily),
    mv('DM_RIG_DECKLOG', exDaily),
    mv('DM_RIG_DECKLOG_REMARKS', exDaily),
    add('DM_RIG_OPERATION_EVENT_LINK'),
    mv('DM_RISERLINE_OP', exDaily),
    mv('DM_RISER_OP', exDaily),
    mv('DM_SAFETY', exDaily),
    mv('DM_SAFETY_INCIDENT', exDaily),
    mv('DM_SAFETY_KICK_DETECT', exDaily),
    mv('DM_SHAKERSCREEN_OP', exDaily),
    mv('DM_SHAKER_OP', exDaily),
    mv('DM_SLICKLINE', slDates),
    mv('DM_SLICKLINE_DAILY', exDaily),
    mv('DM_SLICKLINE_PURPOSE', exDaily),
    mv('DM_SLICKLINE_SOLID', viaSL),
    mv('DM_SPILLS', exDaily),
    mv('DM_STIM_FET_TEST', viaSJ),
    mv('DM_STIM_FLOWBACK', viaSJ),
    mv('DM_STIM_FLOWPATH', viaSJ),
    mv('DM_STIM_FLOWPATH_STAGE', viaSJ),
    mv('DM_STIM_FLUID', viaSJ),
    mv('DM_STIM_FLUID_ADD', viaSJ),
    mv('DM_STIM_FLUID_SCHEDULE', sjStage),
    mv('DM_STIM_JOB', exRJ),
    mv('DM_STIM_PUMPING_DIAG', viaSJ),
    mv('DM_STIM_PUMP_FB_TEST', viaSJ),
    mv('DM_STIM_RES_INTERVAL', viaSJ),
    mv('DM_STIM_STAGE', viaSJ),
    mv('DM_STIM_STAGE_SUPPLEMENT', sjStage),
    mv('DM_STIM_STEP_TEST', viaSJ),
    mv('DM_STIM_TREATMENT', viaSJ),
    mv('DM_STIM_TREATMENT_AC_COMP', viaSJ),
    mv('DM_STIM_TREATMENT_ADDITIVE', viaSJ),
    mv('DM_STIM_TREATMENT_FLUID', viaSJ),
    mv('DM_STIM_TREATMENT_PROPPANT', viaSJ),
    mv('DM_SUPPORT_VESSEL_DAILY', exDaily),
    mv('DM_TRANSFER_DETAIL', viaMT),
    mv('DM_TRANSFER_SUMMARY', viaMT),
    mv('DM_UNDERWATER_DETAIL', viaUO),
    mv('DM_UNDERWATER_EQUIPMENT', viaUO),
    add('DM_UNDERWATER_MATERIAL'),
    mv('DM_UNDERWATER_MATERIAL_TRAN', viaUO),
    mv('DM_UNDERWATER_OP', dr),
    mv('DM_UNDERWATER_PERS', viaUO),
    mv('DM_VESSEL_BULK_TRAN', exDaily),
    mv('DM_WB_OBSTRUCTION_STATUS', `c.date_status>=${F} AND c.date_status<=${T}`),
    mv('DM_WEATHER_CHECK', exDaily),
    mv('DM_WEATHER_CURRENT', exDaily),
    mv('DM_WELLBORE_ZONE_ACTIVITY', exDaily),
    mv('DM_WELL_PLAN', exRJ),
    mv('DM_WELL_PLAN_OFFSET', viaWP),
    mv('DM_WORK_DETAIL', viaGW),
  ];

  // ── Filter to active tables if provided ──
  const activeRows = tableFilter ? rows.filter(([name]) => tableFilter.has(name)) : rows;

  // ── Build batched UNION ALL queries ──
  const selects = activeRows.map(([name, moveExpr, addExpr]) =>
    `SELECT '${name}' "Table_name", ${srcCnt(name)} "Old_Event_Count", ${tgtCnt(name)} "New_Event_Count", ${moveExpr} "Move_Acount", ${addExpr} "Add_Count" FROM DUAL`
  );

  const batchSize = 15;
  const batches: string[] = [];
  for (let i = 0; i < selects.length; i += batchSize) {
    batches.push(selects.slice(i, i + batchSize).join('\nUNION ALL\n'));
  }
  return batches;
}
