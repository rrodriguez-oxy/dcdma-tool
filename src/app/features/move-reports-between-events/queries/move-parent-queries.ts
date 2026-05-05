// ─── Move Parent Records Queries ─────────────────────────────────────────────
// Generates UPDATE statements to move parent/record-level rows from the source
// event to the target event. Only parent tables that own the date filter get
// an UPDATE; child tables are handled by delete-queries.ts & insert from backup.
// Some tables also set update_user_id, update_app_id, update_date.

export interface MoveParentQuery {
  tableName: string;
  sql: string;
}

export function moveParentQueries(
  wellId: string,
  srcEventId: string,
  tgtEventId: string,
  fromDate?: string,
  toDate?: string
): MoveParentQuery[] {
  const w = wellId;
  const src = srcEventId;
  const tgt = tgtEventId;
  const fd = fromDate || '1900-01-01';
  const td = toDate || '2099-12-31';
  const F = `TO_DATE('${fd}','YYYY-MM-DD')`;
  const T = `TO_DATE('${td}','YYYY-MM-DD')`;

  // ── Common filter fragments ──
  const dr = `c.date_report>=${F} AND c.date_report<=${T}`;

  const exRJ = `EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE j.well_id=c.well_id AND j.report_journal_id=c.report_journal_id AND j.event_id=c.event_id AND j.date_report>=${F} AND j.date_report<=${T})`;

  const exRJNoEvt = `EXISTS(SELECT 1 FROM DM_REPORT_JOURNAL j WHERE c.well_id=j.well_id AND c.report_journal_id=j.report_journal_id AND j.date_report>=${F} AND j.date_report<=${T})`;

  const asmFilter = `((c.date_report>=${F} AND c.date_report<=${T}) OR EXISTS(SELECT 1 FROM DM_BHA_RUN br WHERE br.well_id=c.well_id AND c.assembly_id=br.assembly_id AND br.date_in>=${F} AND br.date_in<=${T}))`;

  // ── SET clause variants ──
  const setEvt = `SET c.event_id='${tgt}'`;
  const setEvtAudit = `SET c.event_id='${tgt}', c.update_user_id='DCDMA', c.update_app_id='Move Event Children', c.update_date=SYSDATE`;

  // ── Helper builders ──
  const upd = (table: string, setCl: string, filter: string): MoveParentQuery => ({
    tableName: table,
    sql: `UPDATE ${table} c ${setCl} WHERE c.well_id='${w}' AND c.event_id='${src}' AND ${filter}`,
  });

  return [
    upd('CD_ASSEMBLY', setEvtAudit, asmFilter),
    upd('CD_CEMENT_JOB', setEvt, dr),
    upd('CD_HOLE_SECT_GROUP', setEvtAudit, `c.date_sect_start>=${F} AND c.date_sect_start<=${T}`),
    upd('CD_LESSON', setEvtAudit, exRJ),
    upd('CD_PERFORATE', setEvt, dr),
    upd('CD_PRESSURE_SURVEY', setEvt, exRJNoEvt),
    upd('CD_TEST', setEvt, exRJNoEvt),
    upd('CD_WELLHEAD', setEvt, exRJ),
    upd('DM_CASING', setEvtAudit, dr),
    upd('DM_CONV_PUMP', setEvt, exRJ),
    upd('DM_CORE', setEvt, dr),
    upd('DM_DAILY', setEvt, dr),
    upd('DM_DST', setEvt, dr),
    upd('DM_ESP', setEvt, exRJNoEvt),
    upd('DM_FISHING', setEvt, dr),
    upd('DM_FLUID_HAUL', setEvt, dr),
    upd('DM_GENERAL_WORK', setEvt, dr),
    upd('DM_GEOLOGY_DAILY', setEvt, dr),
    upd('DM_INCIDENT', setEvt, exRJNoEvt),
    upd('DM_KICK', setEvt, exRJNoEvt),
    upd('DM_LOG', setEvt, dr),
    upd('DM_MATERIAL_TRANSFER', setEvt, dr),
    upd('DM_OPER_EQUIP_FAIL', setEvtAudit, exRJ),
    upd('DM_PCP', setEvt, exRJNoEvt),
    upd('DM_PIPE_RUN', setEvt, dr),
    upd('DM_PLUNGER_LIFT', setEvt, exRJ),
    upd('DM_REPORT_JOURNAL', setEvtAudit, dr),
    upd('DM_SLICKLINE', setEvt, `c.date_start>=${F} AND c.date_start<=${T} AND c.date_end>=${F}`),
    upd('DM_STIM_JOB', setEvt, exRJ),
    upd('DM_UNDERWATER_OP', setEvt, dr),
    upd('DM_WB_OBSTRUCTION_STATUS', setEvt, `c.date_status>=${F} AND c.date_status<=${T}`),
    upd('DM_WELL_PLAN', setEvt, exRJ),
  ];
}
