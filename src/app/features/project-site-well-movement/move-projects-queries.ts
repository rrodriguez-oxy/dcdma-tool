// ─── Move Project Queries ──────────────────────────────────────────────────────

// ─── Lookup / Preview ────────────────────────────────────────────────────────

export function searchPolicyId(policyName: string): string {
  return `
    SELECT po.policy_id "Policy ID",
           po.customer_name "Business Unit"
    FROM cd_policy po
    WHERE po.customer_name LIKE '${policyName}%'
  `;
}

export function searchProjectId(projectName: string): string {
  return `
    SELECT b.project_id "Project ID",
           b.project_name "Project Name",
           a.customer_name "Business Unit"
    FROM cd_policy a, cd_project b
    WHERE a.policy_id = b.policy_id
      AND b.project_name LIKE '${projectName}%'
    ORDER BY 1
  `;
}

export function selectFullProject(projectId: string, newPolicyId: string): string {
  return `
    SELECT
        NVL(po.customer_name, '*** Not Found ***') "Current Business Unit Name",
        NVL((SELECT po2.customer_name
             FROM cd_policy po2
             WHERE po2.policy_id = '${newPolicyId}'
        ), '*** Not Found ***') "New Policy Name",

        NVL(pr.project_name, '*** Not Found ***') "Project Name",

        CASE
            WHEN (SELECT COUNT(DISTINCT w.loc_state)
                  FROM cd_well w, cd_site s
                  WHERE s.site_id = w.site_id
                    AND s.project_id = pr.project_id
                    AND w.loc_state IS NOT NULL
                    AND w.loc_state <> 'UNKNOWN') > 1
            THEN TO_CHAR('*** Multiple ***')
            ELSE TO_CHAR((SELECT DISTINCT w.loc_state
                          FROM cd_well w, cd_site s
                          WHERE s.site_id = w.site_id
                            AND s.project_id = pr.project_id
                            AND w.loc_state IS NOT NULL
                            AND w.loc_state <> 'UNKNOWN'))
        END "State",

        CASE
            WHEN (SELECT COUNT(DISTINCT w.loc_county)
                  FROM cd_well w, cd_site s
                  WHERE s.site_id = w.site_id
                    AND s.project_id = pr.project_id
                    AND w.loc_county IS NOT NULL
                    AND w.loc_county <> 'UNKNOWN') > 1
            THEN TO_CHAR('*** Multiple ***')
            ELSE TO_CHAR((SELECT DISTINCT w.loc_county
                          FROM cd_well w, cd_site s
                          WHERE s.site_id = w.site_id
                            AND s.project_id = pr.project_id
                            AND w.loc_county IS NOT NULL
                            AND w.loc_county <> 'UNKNOWN'))
        END "County",

        po.policy_id "Current Policy ID",
        NVL((SELECT po2.policy_id
             FROM cd_policy po2
             WHERE po2.policy_id = '${newPolicyId}'
        ), '*** Not Found ***') "New Policy ID",

        pr.project_id "Project ID",

        NULL " ",

        (SELECT COUNT(*)
         FROM DM_REPORT_JOURNAL r, CD_WELL w, CD_SITE s
         WHERE r.date_report + 10 >= SYSDATE
           AND w.well_id = r.well_id
           AND w.site_id = s.site_id
           AND s.project_id = pr.project_id
           AND r.report_alias NOT IN ('GEN_AFE', 'GEN_PLAN')
        ) "Reports within 10 Days",

        (SELECT COUNT(*) FROM CD_SITE st
         WHERE st.project_id = pr.project_id
        ) "Sites in Current Project",

        (SELECT COUNT(*) FROM CD_SITE st, CD_WELL ww
         WHERE ww.site_id = st.site_id
           AND st.project_id = pr.project_id
        ) "Wells in Current Project",

        (SELECT COUNT(*) FROM CD_ATTACHMENT_JOURNAL r
         WHERE r.attachment_locator LIKE '%+project_id=(' || pr.project_id || '%'
        ) "Attachment Journal",

        (SELECT COUNT(*) FROM CD_CHANGE_HISTORY_JOURNAL r
         WHERE r.parent_locator LIKE '%+project_id=(' || pr.project_id || '%'
        ) "Parent Change History Journal",

        (SELECT COUNT(*) FROM CD_CHANGE_HISTORY_JOURNAL r
         WHERE r.item_locator LIKE '%+project_id=(' || pr.project_id || '%'
        ) "Item Change History Journal",

        (SELECT COUNT(*) FROM CD_POLYLINE_HEADER r
         WHERE r.attachment_locator LIKE '%+project_id=(' || pr.project_id || '%'
        ) "Polyline Header",

        (SELECT COUNT(*) FROM CD_SURVEY_PROGRAM r, CD_WELL w, CD_SITE s
         WHERE r.well_id = w.well_id
           AND r.policy_id = po.policy_id
           AND s.site_id = w.site_id
           AND s.project_id = pr.project_id
        ) "Survey Program w Policy ID",

        (SELECT COUNT(*) FROM CD_SURVEY_HEADER r, CD_WELL w, CD_SITE s
         WHERE r.well_id = w.well_id
           AND r.policy_id = po.policy_id
           AND s.site_id = w.site_id
           AND s.project_id = pr.project_id
        ) "Survey Header w Policy ID",

        (SELECT COUNT(*) FROM DP_PROJECT_TARGET r
         WHERE r.project_id = pr.project_id
        ) "Project Target"

    FROM
        CD_PROJECT pr,
        CD_POLICY po
    WHERE
        po.policy_id = pr.policy_id
        AND pr.project_id = '${projectId}'
  `;
}

// ─── Move Projects to New Business Unit ──────────────────────────────────────

export function updateCdProject(
  newPolicyId: string, projectId: string, currPolicyId: string
): string {
  return `
    UPDATE cd_project
    SET policy_id = '${newPolicyId}'
    WHERE project_id = '${projectId}'
      AND policy_id = '${currPolicyId}'
      AND EXISTS (
          SELECT 1213 FROM CD_POLICY p
          WHERE p.policy_id = '${newPolicyId}'
      )
  `;
}

export function insertCdWellStatus(
  currPolicyId: string, projectId: string
): string {
  return `
    INSERT INTO CD_WELL_STATUS (
        WELL_ID, WELL_STATUS_ID, STATUS_DATE, COMMENTS, STATUS_DESC,
        CREATE_DATE, CREATE_USER_ID, CREATE_APP_ID,
        UPDATE_DATE, UPDATE_USER_ID, UPDATE_APP_ID
    )
    SELECT
        w.well_id,
        generate_key(5),
        SYSDATE,
        'Moved Project from original policy_id:${currPolicyId} project_id:${projectId} Site_id:' || w.site_id,
        'Under Review',
        SYSDATE, 'Permian Data Reorg', 'Permian Data Reorg',
        SYSDATE, 'Permian Data Reorg', 'Permian Data Reorg'
    FROM CD_WELL w, CD_SITE s
    WHERE s.project_id = '${projectId}'
      AND s.site_id = w.site_id
  `;
}

export function updateCdAttachmentJournal(
  currPolicyId: string, newPolicyId: string, projectId: string
): string {
  return `
    UPDATE cd_attachment_journal a
    SET a.attachment_locator = REPLACE(
        a.attachment_locator,
        'policy_id=(${currPolicyId})+project_id=(${projectId})',
        'policy_id=(${newPolicyId})+project_id=(${projectId})'
    )
    WHERE a.attachment_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${projectId})%'
      AND SUBSTR(a.attachment_locator, INSTR(a.attachment_locator, 'well_id=(') + 9, 10)
          IN (SELECT w.well_id
              FROM cd_well w, cd_site si, cd_project p
              WHERE w.site_id = si.site_id
                AND si.project_id = '${projectId}')
  `;
}

export function updateCdChangeHistoryParentLocator(
  currPolicyId: string, newPolicyId: string, projectId: string
): string {
  return `
    UPDATE cd_change_history_journal h
    SET h.parent_locator = REPLACE(
        h.parent_locator,
        'policy_id=(${currPolicyId})+project_id=(${projectId})',
        'policy_id=(${newPolicyId})+project_id=(${projectId})'
    )
    WHERE h.parent_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${projectId})%'
      AND SUBSTR(h.parent_locator, INSTR(h.parent_locator, 'well_id=(') + 9, 10)
          IN (SELECT w.well_id
              FROM cd_well w, cd_site si, cd_project p
              WHERE w.site_id = si.site_id
                AND si.project_id = '${projectId}')
  `;
}

export function updateCdChangeHistoryItemLocator(
  currPolicyId: string, newPolicyId: string, projectId: string
): string {
  return `
    UPDATE cd_change_history_journal h
    SET h.item_locator = REPLACE(
        h.item_locator,
        'policy_id=(${currPolicyId})+project_id=(${projectId})',
        'policy_id=(${newPolicyId})+project_id=(${projectId})'
    )
    WHERE h.item_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${projectId})%'
      AND SUBSTR(h.item_locator, INSTR(h.item_locator, 'well_id=(') + 9, 10)
          IN (SELECT w.well_id
              FROM cd_well w, cd_site si, cd_project p
              WHERE w.site_id = si.site_id
                AND si.project_id = '${projectId}')
  `;
}

export function updateCdPolylineHeader(
  currPolicyId: string, newPolicyId: string, projectId: string
): string {
  return `
    UPDATE cd_polyline_header a
    SET a.attachment_locator = REPLACE(
        a.attachment_locator,
        'policy_id=(${currPolicyId})+project_id=(${projectId})',
        'policy_id=(${newPolicyId})+project_id=(${projectId})'
    )
    WHERE a.attachment_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${projectId})%'
      AND SUBSTR(a.attachment_locator, INSTR(a.attachment_locator, 'well_id=(') + 9, 10)
          IN (SELECT w.well_id
              FROM cd_well w, cd_site si, cd_project p
              WHERE w.site_id = si.site_id
                AND si.project_id = '${projectId}')
  `;
}

export function updateCdSurveyProgram(
  newPolicyId: string, currPolicyId: string, projectId: string
): string {
  return `
    UPDATE cd_survey_program su
    SET su.policy_id = '${newPolicyId}'
    WHERE su.policy_id = '${currPolicyId}'
      AND su.well_id IN (
          SELECT w.well_id
          FROM cd_well w, cd_site si, cd_project p
          WHERE su.well_id = w.well_id
            AND w.site_id = si.site_id
            AND si.project_id = '${projectId}'
      )
      AND EXISTS (
          SELECT 1213 FROM CD_POLICY p
          WHERE p.policy_id = '${newPolicyId}'
      )
  `;
}

export function updateCdSurveyHeader(
  newPolicyId: string, currPolicyId: string, projectId: string
): string {
  return `
    UPDATE cd_survey_header su
    SET su.policy_id = '${newPolicyId}'
    WHERE su.policy_id = '${currPolicyId}'
      AND su.well_id IN (
          SELECT w.well_id
          FROM cd_well w, cd_site si, cd_project p
          WHERE su.well_id = w.well_id
            AND w.site_id = si.site_id
            AND si.project_id = '${projectId}'
      )
      AND EXISTS (
          SELECT 1213 FROM CD_POLICY p
          WHERE p.policy_id = '${newPolicyId}'
      )
  `;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface ProjectAuditSqlGroups {
  generatedSql: string;
  sqlMoveProjects: string;
}

export interface ProjectAuditInsertResult {
  sql: string;
  binds: Record<string, string>;
}

export function insertProjectMoveAudit(
  projectId: string, newPolicyId: string, row: Record<string, unknown>,
  groups: ProjectAuditSqlGroups
): ProjectAuditInsertResult {
  const s = (key: string, maxLen = 200): string => {
    const val = String(row[key] ?? '').replace(/'/g, "''");
    return val.substring(0, maxLen);
  };
  const n = (key: string): string => {
    const val = row[key];
    return val == null ? 'NULL' : String(val);
  };

  const sql = `
    INSERT INTO PROJECT_MOVE_AUDIT (
        PROJECT_ID, NEW_POLICY_ID,
        GENERATED_SQL,
        CURRENT_POLICY_COMPANY_NAME, NEW_POLICY_COMPANY_NAME,
        PROJECT_NAME,
        STATE, COUNTY,
        CURRENT_POLICY_ID, NEW_POLICY_ID_VERIFIED, PROJECT_ID_VERIFIED,
        REPORTS_WITHIN_LAST_10_DAYS,
        SITES_IN_CURRENT_PROJECT, WELLS_IN_CURRENT_PROJECT,
        ATTACHMENT_JOURNAL, PARENT_CHANGE_HISTORY_JOURNAL, ITEM_CHANGE_HISTORY_JOURNAL,
        POLYLINE_HEADER,
        SURVEY_PROGRAM_W_POLICY_ID, SURVEY_HEADER_W_POLICY_ID,
        PROJECT_TARGET,
        SQL_TO_MOVE_PROJECTS_TO_NEW_POLICYS,
        LOAD_DT
    ) VALUES (
        '${projectId}', '${newPolicyId}',
        :generatedSql,
        '${s('Current Business Unit Name')}', '${s('New Policy Name')}',
        '${s('Project Name')}',
        '${s('State', 100)}', '${s('County', 100)}',
        '${s('Current Policy ID', 10)}', '${s('New Policy ID', 10)}', '${s('Project ID', 10)}',
        ${n('Reports within 10 Days')},
        ${n('Sites in Current Project')}, ${n('Wells in Current Project')},
        ${n('Attachment Journal')}, ${n('Parent Change History Journal')}, ${n('Item Change History Journal')},
        ${n('Polyline Header')},
        ${n('Survey Program w Policy ID')}, ${n('Survey Header w Policy ID')},
        ${n('Project Target')},
        :sqlMoveProjects,
        SYSDATE
    )
  `;

  const binds: Record<string, string> = {
    generatedSql: groups.generatedSql,
    sqlMoveProjects: groups.sqlMoveProjects
  };

  return { sql, binds };
}
