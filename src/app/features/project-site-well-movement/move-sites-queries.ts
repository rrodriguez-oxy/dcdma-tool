// ─── Move Sites Queries ──────────────────────────────────────────────────────

// ─── Lookup / Preview ────────────────────────────────────────────────────────

export function searchSiteId(siteName: string): string {
  return `
    SELECT c.site_id "Site ID",
           c.site_name "Site Name",
           b.project_name "Field Name",
           a.customer_name "Business Unit"
    FROM cd_policy a, cd_project b, cd_site c
    WHERE a.policy_id = b.policy_id
      AND b.project_id = c.project_id
      AND c.site_name LIKE '${siteName}%'
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
  `;
}

export function selectProjectInfo(projectId: string): string {
  return `
    SELECT
        pr.project_id "Project ID",
        pr.project_name "Project Name",
        po.customer_name "Business Unit",
        po.policy_id "Policy ID"
    FROM
        CD_PROJECT pr,
        CD_POLICY po
    WHERE
        (pr.project_id = '${projectId}' OR pr.project_name LIKE '${projectId}%')
        AND po.policy_id = pr.policy_id
  `;
}

export function selectFullSite(siteId: string, newProjectId: string): string {
  return `
    SELECT
        NVL(po.customer_name, '*** Not Found ***') "Current Business Unit Name",
        NVL((SELECT po2.customer_name
             FROM cd_policy po2, cd_project pr2
             WHERE pr2.project_id = '${newProjectId}'
               AND po2.policy_id = pr2.policy_id
        ), '*** Not Found ***') "New Business Unit Name",

        NVL(pr.project_name, '*** Not Found ***') "Current Project Name",
        NVL((SELECT pr2.project_name
             FROM cd_project pr2
             WHERE pr2.project_id = '${newProjectId}'
        ), '*** Not Found ***') "New Project Name",

        NVL(s.site_name, '*** Not Found ***') "Site Name",

        CASE
            WHEN (SELECT COUNT(DISTINCT w.loc_state)
                  FROM cd_well w
                  WHERE s.site_id = w.site_id
                    AND w.loc_state IS NOT NULL
                    AND w.loc_state <> 'UNKNOWN') > 1
            THEN TO_CHAR('*** Multiple ***')
            ELSE TO_CHAR((SELECT DISTINCT w.loc_state
                          FROM cd_well w
                          WHERE s.site_id = w.site_id
                            AND w.loc_state IS NOT NULL
                            AND w.loc_state <> 'UNKNOWN'))
        END "State",

        CASE
            WHEN (SELECT COUNT(DISTINCT w.loc_county)
                  FROM cd_well w
                  WHERE s.site_id = w.site_id
                    AND w.loc_county IS NOT NULL
                    AND w.loc_county <> 'UNKNOWN') > 1
            THEN TO_CHAR('*** Multiple ***')
            ELSE TO_CHAR((SELECT DISTINCT w.loc_county
                          FROM cd_well w
                          WHERE s.site_id = w.site_id
                            AND w.loc_county IS NOT NULL
                            AND w.loc_county <> 'UNKNOWN'))
        END "County",

        s.site_id "Site ID",

        po.policy_id "Current Policy ID",
        NVL((SELECT pr2.policy_id
             FROM cd_policy po2, cd_project pr2
             WHERE pr2.project_id = '${newProjectId}'
               AND po2.policy_id = pr2.policy_id
        ), '*** Not Found ***') "New Policy ID",

        pr.project_id "Current Project ID",
        NVL((SELECT pr2.project_id
             FROM cd_project pr2
             WHERE pr2.project_id = '${newProjectId}'
        ), '*** Not Found ***') "New Project ID",

        NULL " ",

        (SELECT COUNT(*)
         FROM DM_REPORT_JOURNAL r, CD_WELL w
         WHERE r.date_report + 10 >= SYSDATE
           AND w.well_id = r.well_id
           AND w.site_id = s.site_id
           AND r.report_alias NOT IN ('GEN_AFE', 'GEN_PLAN')
        ) "Reports within Last 10 Days",

        (SELECT COUNT(*) FROM CD_SITE st
         WHERE st.project_id = pr.project_id
        ) "Sites in Current Project",

        (SELECT COUNT(*) FROM CD_SITE st, CD_WELL ww
         WHERE ww.site_id = st.site_id
           AND st.project_id = pr.project_id
        ) "Wells in Current Project",

        (SELECT COUNT(*) FROM CD_WELL ww
         WHERE ww.site_id = s.site_id
        ) "Wells in Current Site",

        (SELECT COUNT(*) FROM CD_ATTACHMENT_JOURNAL r
         WHERE r.attachment_locator LIKE '%+site_id=(' || s.site_id || '%'
        ) "Attachment Journal",

        (SELECT COUNT(*) FROM CD_CHANGE_HISTORY_JOURNAL r
         WHERE r.parent_locator LIKE '%+site_id=(' || s.site_id || '%'
        ) "Parent Change History Journal",

        (SELECT COUNT(*) FROM CD_CHANGE_HISTORY_JOURNAL r
         WHERE r.item_locator LIKE '%+site_id=(' || s.site_id || '%'
        ) "Item Change History Journal",

        (SELECT COUNT(*) FROM CD_POLYLINE_HEADER r
         WHERE r.attachment_locator LIKE '%+site_id=(' || s.site_id || '%'
        ) "Polyline Header",

        (SELECT COUNT(*) FROM CD_SURVEY_PROGRAM r, CD_WELL w
         WHERE r.well_id = w.well_id
           AND s.site_id = w.site_id
           AND r.policy_id = po.policy_id
        ) "Survey Program w Policy ID",

        (SELECT COUNT(*) FROM CD_SURVEY_HEADER r, CD_WELL w
         WHERE r.well_id = w.well_id
           AND s.site_id = w.site_id
           AND r.policy_id = po.policy_id
        ) "Survey Header w Policy ID",

        (SELECT COUNT(*) FROM CD_SURVEY_STATION r, CD_WELL w
         WHERE r.well_id = w.well_id
           AND s.site_id = w.site_id
           AND r.project_id = pr.project_id
        ) "Survey Station w Project ID",

        (SELECT COUNT(*) FROM CD_VERTICAL_SECTION r, CD_WELL w
         WHERE r.well_id = w.well_id
           AND s.site_id = w.site_id
           AND r.project_id = pr.project_id
        ) "Vertical Section w Project ID",

        (SELECT COUNT(*) FROM DP_PROJECT_TARGET r
         WHERE r.project_id = pr.project_id
        ) "Project Target",

        (SELECT COUNT(*) FROM DP_PROJECT_TARGET_POINT r
         WHERE r.project_id = pr.project_id
        ) "Target Point",

        (SELECT COUNT(*) FROM CD_PROJECT_TARGET_SITE_LINK r
         WHERE r.project_id = pr.project_id
           AND s.site_id = r.site_id
        ) "Target Site Link",

        (SELECT COUNT(*) FROM CD_PROJ_TARG_WELL_LINK r, CD_WELL w
         WHERE r.project_id = pr.project_id
           AND w.well_id = r.well_id
           AND s.site_id = w.site_id
        ) "Target Well Link",

        (SELECT COUNT(*) FROM CD_PROJECT_TARGET_WB_LINK r, CD_WELL w
         WHERE r.project_id = pr.project_id
           AND w.well_id = r.well_id
           AND s.site_id = w.site_id
        ) "Target Wellbore Link",

        (SELECT COUNT(*) FROM CD_PROJ_TARG_SCENARIO_LINK r, CD_WELL w
         WHERE r.project_id = pr.project_id
           AND w.well_id = r.well_id
           AND s.site_id = w.site_id
        ) "Target Scenario Link"

    FROM
        CD_PROJECT pr,
        CD_POLICY po,
        CD_SITE s
    WHERE
        po.policy_id = pr.policy_id
        AND pr.project_id = s.project_id
        AND s.site_id = '${siteId}'
  `;
}

// ─── Move Sites to New Project ───────────────────────────────────────────────

export function updateCdSite(
  newProjectId: string, siteId: string, currProjectId: string,
  policyId: string, currProjectName: string, newProjectName: string
): string {
  return `
    UPDATE cd_site
    SET project_id = '${newProjectId}',
        update_date = SYSDATE,
        update_user_id = 'McAleerA',
        update_app_id = 'DM Script',
        remarks = CASE
            WHEN remarks IS NULL
            THEN 'Permian Data Reorg - changed parent project from: ${currProjectName}/${currProjectId} to: ${newProjectName}/${newProjectId}.'
            ELSE REPLACE(
                TO_CHAR(TRIM(remarks) || '. ' || CHR(10) || 'Permian Data Reorg - changed parent project from: ${currProjectName}/${currProjectId} to: ${newProjectName}/${newProjectId}.'),
                '..', '.'
            )
        END
    WHERE site_id = '${siteId}'
      AND project_id = '${currProjectId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjectId}'
      )
  `;
}

export function insertCdWellStatus(
  policyId: string, currProjectId: string, siteId: string, newProjectId: string
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
        'Moved Site from original policy_id:${policyId} project_id:${currProjectId} Site_id:${siteId}',
        'Under Review',
        SYSDATE, 'McAleerA', 'DM Script',
        SYSDATE, 'McAleerA', 'DM Script'
    FROM CD_WELL w, CD_SITE s
    WHERE s.project_id = '${newProjectId}'
      AND s.site_id = '${siteId}'
      AND s.site_id = w.site_id
  `;
}

export function updateCdAttachmentJournal(
  policyId: string, currProjectId: string, newProjectId: string, siteId: string
): string {
  return `
    UPDATE cd_attachment_journal a
    SET a.attachment_locator = REPLACE(
        a.attachment_locator,
        'policy_id=(${policyId})+project_id=(${currProjectId})+site_id=(${siteId})',
        'policy_id=(${policyId})+project_id=(${newProjectId})+site_id=(${siteId})'
    )
    WHERE a.attachment_locator LIKE
        '%policy_id=(${policyId})+project_id=(${currProjectId})+site_id=(${siteId})%'
      AND SUBSTR(a.attachment_locator, INSTR(a.attachment_locator, 'well_id=(') + 9, 10)
          IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjectId}'
      )
  `;
}

export function updateCdChangeHistoryParentLocator(
  policyId: string, currProjectId: string, newProjectId: string, siteId: string
): string {
  return `
    UPDATE cd_change_history_journal h
    SET h.parent_locator = REPLACE(
        h.parent_locator,
        'policy_id=(${policyId})+project_id=(${currProjectId})+site_id=(${siteId})',
        'policy_id=(${policyId})+project_id=(${newProjectId})+site_id=(${siteId})'
    )
    WHERE h.parent_locator LIKE
        '%project_id=(${currProjectId})+site_id=(${siteId})%'
      AND SUBSTR(h.parent_locator, INSTR(h.parent_locator, 'well_id=(') + 9, 10)
          IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjectId}'
      )
  `;
}

export function updateCdChangeHistoryItemLocator(
  policyId: string, currProjectId: string, newProjectId: string, siteId: string
): string {
  return `
    UPDATE cd_change_history_journal h
    SET h.item_locator = REPLACE(
        h.item_locator,
        'policy_id=(${policyId})+project_id=(${currProjectId})+site_id=(${siteId})',
        'policy_id=(${policyId})+project_id=(${newProjectId})+site_id=(${siteId})'
    )
    WHERE h.item_locator LIKE
        '%policy_id=(${policyId})+project_id=(${currProjectId})+site_id=(${siteId})%'
      AND SUBSTR(h.item_locator, INSTR(h.item_locator, 'well_id=(') + 9, 10)
          IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjectId}'
      )
  `;
}

export function updateCdPolylineHeader(
  policyId: string, currProjectId: string, newProjectId: string, siteId: string
): string {
  return `
    UPDATE cd_polyline_header a
    SET a.attachment_locator = REPLACE(
        a.attachment_locator,
        'policy_id=(${policyId})+project_id=(${currProjectId})+site_id=(${siteId})',
        'policy_id=(${policyId})+project_id=(${newProjectId})+site_id=(${siteId})'
    )
    WHERE a.attachment_locator LIKE
        '%policy_id=(${policyId})+project_id=(${currProjectId})+site_id=(${siteId})%'
      AND SUBSTR(a.attachment_locator, INSTR(a.attachment_locator, 'well_id=(') + 9, 10)
          IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjectId}'
      )
  `;
}

export function updateCdSurveyProgram(siteId: string, policyId: string): string {
  return `
    UPDATE cd_survey_program su
    SET su.policy_id = '${policyId}'
    WHERE su.well_id IN (
        SELECT w.well_id
        FROM CD_WELL w, CD_SITE s, CD_PROJECT pr, CD_POLICY po
        WHERE w.site_id = s.site_id
          AND s.project_id = pr.project_id
          AND pr.policy_id = po.policy_id
          AND w.site_id = '${siteId}'
          AND po.policy_id = '${policyId}'
    )
  `;
}

export function updateCdSurveyHeader(siteId: string, policyId: string): string {
  return `
    UPDATE cd_survey_header su
    SET su.policy_id = '${policyId}'
    WHERE su.well_id IN (
        SELECT w.well_id
        FROM CD_WELL w, CD_SITE s, CD_PROJECT pr, CD_POLICY po
        WHERE w.site_id = s.site_id
          AND s.project_id = pr.project_id
          AND pr.policy_id = po.policy_id
          AND w.site_id = '${siteId}'
          AND po.policy_id = '${policyId}'
    )
  `;
}

export function updateCdSurveyStation(
  newProjectId: string, currProjectId: string, siteId: string, policyId: string
): string {
  return `
    UPDATE cd_survey_station su
    SET su.project_id = '${newProjectId}'
    WHERE su.project_id = '${currProjectId}'
      AND su.well_id IN (
          SELECT w.well_id
          FROM CD_WELL w, CD_SITE s, CD_PROJECT pr, CD_POLICY po
          WHERE w.site_id = s.site_id
            AND s.project_id = pr.project_id
            AND pr.policy_id = po.policy_id
            AND w.site_id = '${siteId}'
            AND po.policy_id = '${policyId}'
      )
  `;
}

export function updateCdVerticalSection(
  newProjectId: string, currProjectId: string, siteId: string, policyId: string
): string {
  return `
    UPDATE cd_vertical_section su
    SET su.project_id = '${newProjectId}'
    WHERE su.project_id = '${currProjectId}'
      AND su.well_id IN (
          SELECT w.well_id
          FROM CD_WELL w, CD_SITE s, CD_PROJECT pr, CD_POLICY po
          WHERE w.site_id = s.site_id
            AND s.project_id = pr.project_id
            AND pr.policy_id = po.policy_id
            AND w.site_id = '${siteId}'
            AND po.policy_id = '${policyId}'
      )
  `;
}

// ─── Update Project Target Site Associations ─────────────────────────────────

export function insertDpProjectTargetSite(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET (
        PROJECT_ID, PROJECT_TARGET_ID, DRILL_WELL_ID, DRILL_WELLBORE_ID, DRILL_DEF_SURVEY_HEADER_ID,
        COORD_TYPE, GEO_LATITUDE, GEO_LONGITUDE, GEO_MAP_EASTING, GEO_MAP_NORTHING,
        X_OFFSET, Y_OFFSET, AZIMUTH_START, AZIMUTH_END, DIP_ANGLE, DIP_DIRECTION,
        ALIGN_TARGET_ID, GEO_OFFSET_EAST_TARGET, GEO_OFFSET_NORTH_TARGET, TARGET_TYPE, TARGET_TVD,
        TARGET_DESCRIPTION, TARGET_HIDE, TARGET_INCLINATION, TARGET_AZIMUTH, TARGET_GEOMETRY,
        TARGET_NAME, TOLERANCE_HEADING, TOLERANCE_FORWARD, TOLERANCE_BACK, TOLERANCE_LEFT,
        TOLERANCE_RIGHT, TOLERANCE_UP, TOLERANCE_DOWN, DRILL_TOLERANCE, VERTICAL_TOLERANCE,
        IS_READONLY, IS_DRILLERS_TARGET, IS_POINT_MAP_COORD_LOCK, LAST_GOOD_CORRELATION_MD,
        PENETRATION_AZIMUTH, PENETRATION_INCLINATION, LOCK_PENETRATION, DRILL_CONFIDENCE,
        SEQUENCE_NO, CREATE_DATE, CREATE_USER_ID, CREATE_APP_ID, UPDATE_DATE, UPDATE_USER_ID, UPDATE_APP_ID
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.DRILL_WELL_ID, t.DRILL_WELLBORE_ID, t.DRILL_DEF_SURVEY_HEADER_ID,
           t.COORD_TYPE, t.GEO_LATITUDE, t.GEO_LONGITUDE, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING,
           t.X_OFFSET, t.Y_OFFSET, t.AZIMUTH_START, t.AZIMUTH_END, t.DIP_ANGLE, t.DIP_DIRECTION,
           t.ALIGN_TARGET_ID, t.GEO_OFFSET_EAST_TARGET, t.GEO_OFFSET_NORTH_TARGET, t.TARGET_TYPE,
           t.TARGET_TVD, t.TARGET_DESCRIPTION, t.TARGET_HIDE, t.TARGET_INCLINATION, t.TARGET_AZIMUTH,
           t.TARGET_GEOMETRY, t.TARGET_NAME, t.TOLERANCE_HEADING, t.TOLERANCE_FORWARD, t.TOLERANCE_BACK,
           t.TOLERANCE_LEFT, t.TOLERANCE_RIGHT, t.TOLERANCE_UP, t.TOLERANCE_DOWN, t.DRILL_TOLERANCE,
           t.VERTICAL_TOLERANCE, t.IS_READONLY, t.IS_DRILLERS_TARGET, t.IS_POINT_MAP_COORD_LOCK,
           t.LAST_GOOD_CORRELATION_MD, t.PENETRATION_AZIMUTH, t.PENETRATION_INCLINATION,
           t.LOCK_PENETRATION, t.DRILL_CONFIDENCE, t.SEQUENCE_NO,
           t.CREATE_DATE, t.CREATE_USER_ID, t.CREATE_APP_ID,
           SYSDATE, 'McAleerA', 'DM Script'
    FROM DP_PROJECT_TARGET t
         , CD_PROJECT_TARGET_SITE_LINK sl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND t.project_target_id = sl.project_target_id
      AND sl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND sl.site_id = '${siteId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function insertDpProjectTargetPointSite(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET_POINT (
        PROJECT_ID, PROJECT_TARGET_ID, TARGET_POINT_ID,
        COORDINATE_DOWN, POINT_TYPE, COORDINATE_EAST, COORDINATE_NORTH,
        COORDINATE_TVD, COORDINATE_UP, SEQUENCE_NO, GEO_MAP_EASTING, GEO_MAP_NORTHING, POINT_NAME
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.TARGET_POINT_ID, t.COORDINATE_DOWN, t.POINT_TYPE,
           t.COORDINATE_EAST, t.COORDINATE_NORTH, t.COORDINATE_TVD, t.COORDINATE_UP,
           t.SEQUENCE_NO, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING, t.POINT_NAME
    FROM DP_PROJECT_TARGET_POINT t
         , CD_PROJECT_TARGET_SITE_LINK sl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND sl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND sl.site_id = '${siteId}'
      AND t.project_target_id = sl.project_target_id
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET_POINT pr
          WHERE t.project_target_id = pr.project_target_id
            AND pr.project_id = '${newProjId}'
      )
  `;
}

export function updateCdProjectTargetSiteLink(
  newProjId: string, currProjId: string, siteId: string
): string {
  return `
    UPDATE CD_PROJECT_TARGET_SITE_LINK sl
    SET sl.project_id = '${newProjId}'
    WHERE sl.project_id = '${currProjId}'
      AND sl.site_id = '${siteId}'
      AND EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pt
          WHERE pt.project_id = '${newProjId}'
            AND sl.project_target_id = pt.project_target_id
      )
  `;
}

// ─── Update Project Target Well Associations ─────────────────────────────────

export function insertDpProjectTargetWell(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET (
        PROJECT_ID, PROJECT_TARGET_ID, DRILL_WELL_ID, DRILL_WELLBORE_ID, DRILL_DEF_SURVEY_HEADER_ID,
        COORD_TYPE, GEO_LATITUDE, GEO_LONGITUDE, GEO_MAP_EASTING, GEO_MAP_NORTHING,
        X_OFFSET, Y_OFFSET, AZIMUTH_START, AZIMUTH_END, DIP_ANGLE, DIP_DIRECTION,
        ALIGN_TARGET_ID, GEO_OFFSET_EAST_TARGET, GEO_OFFSET_NORTH_TARGET, TARGET_TYPE, TARGET_TVD,
        TARGET_DESCRIPTION, TARGET_HIDE, TARGET_INCLINATION, TARGET_AZIMUTH, TARGET_GEOMETRY,
        TARGET_NAME, TOLERANCE_HEADING, TOLERANCE_FORWARD, TOLERANCE_BACK, TOLERANCE_LEFT,
        TOLERANCE_RIGHT, TOLERANCE_UP, TOLERANCE_DOWN, DRILL_TOLERANCE, VERTICAL_TOLERANCE,
        IS_READONLY, IS_DRILLERS_TARGET, IS_POINT_MAP_COORD_LOCK, LAST_GOOD_CORRELATION_MD,
        PENETRATION_AZIMUTH, PENETRATION_INCLINATION, LOCK_PENETRATION, DRILL_CONFIDENCE,
        SEQUENCE_NO, CREATE_DATE, CREATE_USER_ID, CREATE_APP_ID, UPDATE_DATE, UPDATE_USER_ID, UPDATE_APP_ID
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.DRILL_WELL_ID, t.DRILL_WELLBORE_ID, t.DRILL_DEF_SURVEY_HEADER_ID,
           t.COORD_TYPE, t.GEO_LATITUDE, t.GEO_LONGITUDE, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING,
           t.X_OFFSET, t.Y_OFFSET, t.AZIMUTH_START, t.AZIMUTH_END, t.DIP_ANGLE, t.DIP_DIRECTION,
           t.ALIGN_TARGET_ID, t.GEO_OFFSET_EAST_TARGET, t.GEO_OFFSET_NORTH_TARGET, t.TARGET_TYPE,
           t.TARGET_TVD, t.TARGET_DESCRIPTION, t.TARGET_HIDE, t.TARGET_INCLINATION, t.TARGET_AZIMUTH,
           t.TARGET_GEOMETRY, t.TARGET_NAME, t.TOLERANCE_HEADING, t.TOLERANCE_FORWARD, t.TOLERANCE_BACK,
           t.TOLERANCE_LEFT, t.TOLERANCE_RIGHT, t.TOLERANCE_UP, t.TOLERANCE_DOWN, t.DRILL_TOLERANCE,
           t.VERTICAL_TOLERANCE, t.IS_READONLY, t.IS_DRILLERS_TARGET, t.IS_POINT_MAP_COORD_LOCK,
           t.LAST_GOOD_CORRELATION_MD, t.PENETRATION_AZIMUTH, t.PENETRATION_INCLINATION,
           t.LOCK_PENETRATION, t.DRILL_CONFIDENCE, t.SEQUENCE_NO,
           t.CREATE_DATE, t.CREATE_USER_ID, t.CREATE_APP_ID,
           SYSDATE, 'McAleerA', 'DM Script'
    FROM DP_PROJECT_TARGET t
         , CD_PROJ_TARG_WELL_LINK wl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND t.project_target_id = wl.project_target_id
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND wl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function insertDpProjectTargetPointWell(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET_POINT (
        PROJECT_ID, PROJECT_TARGET_ID, TARGET_POINT_ID,
        COORDINATE_DOWN, POINT_TYPE, COORDINATE_EAST, COORDINATE_NORTH,
        COORDINATE_TVD, COORDINATE_UP, SEQUENCE_NO, GEO_MAP_EASTING, GEO_MAP_NORTHING, POINT_NAME
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.TARGET_POINT_ID, t.COORDINATE_DOWN, t.POINT_TYPE,
           t.COORDINATE_EAST, t.COORDINATE_NORTH, t.COORDINATE_TVD, t.COORDINATE_UP,
           t.SEQUENCE_NO, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING, t.POINT_NAME
    FROM DP_PROJECT_TARGET_POINT t
         , CD_PROJ_TARG_WELL_LINK wl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND t.project_target_id = wl.project_target_id
      AND wl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET_POINT pr
          WHERE t.project_target_id = pr.project_target_id
            AND pr.project_id = '${newProjId}'
      )
  `;
}

export function updateCdProjTargWellLink(
  newProjId: string, currProjId: string, siteId: string
): string {
  return `
    UPDATE CD_PROJ_TARG_WELL_LINK wl
    SET wl.project_id = '${newProjId}'
    WHERE wl.project_id = '${currProjId}'
      AND wl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pt
          WHERE pt.project_id = '${newProjId}'
            AND wl.project_target_id = pt.project_target_id
      )
  `;
}

// ─── Update Project Target Wellbore Associations ─────────────────────────────

export function insertDpProjectTargetWellbore(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET (
        PROJECT_ID, PROJECT_TARGET_ID, DRILL_WELL_ID, DRILL_WELLBORE_ID, DRILL_DEF_SURVEY_HEADER_ID,
        COORD_TYPE, GEO_LATITUDE, GEO_LONGITUDE, GEO_MAP_EASTING, GEO_MAP_NORTHING,
        X_OFFSET, Y_OFFSET, AZIMUTH_START, AZIMUTH_END, DIP_ANGLE, DIP_DIRECTION,
        ALIGN_TARGET_ID, GEO_OFFSET_EAST_TARGET, GEO_OFFSET_NORTH_TARGET, TARGET_TYPE, TARGET_TVD,
        TARGET_DESCRIPTION, TARGET_HIDE, TARGET_INCLINATION, TARGET_AZIMUTH, TARGET_GEOMETRY,
        TARGET_NAME, TOLERANCE_HEADING, TOLERANCE_FORWARD, TOLERANCE_BACK, TOLERANCE_LEFT,
        TOLERANCE_RIGHT, TOLERANCE_UP, TOLERANCE_DOWN, DRILL_TOLERANCE, VERTICAL_TOLERANCE,
        IS_READONLY, IS_DRILLERS_TARGET, IS_POINT_MAP_COORD_LOCK, LAST_GOOD_CORRELATION_MD,
        PENETRATION_AZIMUTH, PENETRATION_INCLINATION, LOCK_PENETRATION, DRILL_CONFIDENCE,
        SEQUENCE_NO, CREATE_DATE, CREATE_USER_ID, CREATE_APP_ID, UPDATE_DATE, UPDATE_USER_ID, UPDATE_APP_ID
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.DRILL_WELL_ID, t.DRILL_WELLBORE_ID, t.DRILL_DEF_SURVEY_HEADER_ID,
           t.COORD_TYPE, t.GEO_LATITUDE, t.GEO_LONGITUDE, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING,
           t.X_OFFSET, t.Y_OFFSET, t.AZIMUTH_START, t.AZIMUTH_END, t.DIP_ANGLE, t.DIP_DIRECTION,
           t.ALIGN_TARGET_ID, t.GEO_OFFSET_EAST_TARGET, t.GEO_OFFSET_NORTH_TARGET, t.TARGET_TYPE,
           t.TARGET_TVD, t.TARGET_DESCRIPTION, t.TARGET_HIDE, t.TARGET_INCLINATION, t.TARGET_AZIMUTH,
           t.TARGET_GEOMETRY, t.TARGET_NAME, t.TOLERANCE_HEADING, t.TOLERANCE_FORWARD, t.TOLERANCE_BACK,
           t.TOLERANCE_LEFT, t.TOLERANCE_RIGHT, t.TOLERANCE_UP, t.TOLERANCE_DOWN, t.DRILL_TOLERANCE,
           t.VERTICAL_TOLERANCE, t.IS_READONLY, t.IS_DRILLERS_TARGET, t.IS_POINT_MAP_COORD_LOCK,
           t.LAST_GOOD_CORRELATION_MD, t.PENETRATION_AZIMUTH, t.PENETRATION_INCLINATION,
           t.LOCK_PENETRATION, t.DRILL_CONFIDENCE, t.SEQUENCE_NO,
           t.CREATE_DATE, t.CREATE_USER_ID, t.CREATE_APP_ID,
           SYSDATE, 'McAleerA', 'DM Script'
    FROM DP_PROJECT_TARGET t
         , CD_PROJECT_TARGET_WB_LINK wl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND t.project_target_id = wl.project_target_id
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND wl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function insertDpProjectTargetPointWellbore(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET_POINT (
        PROJECT_ID, PROJECT_TARGET_ID, TARGET_POINT_ID,
        COORDINATE_DOWN, POINT_TYPE, COORDINATE_EAST, COORDINATE_NORTH,
        COORDINATE_TVD, COORDINATE_UP, SEQUENCE_NO, GEO_MAP_EASTING, GEO_MAP_NORTHING, POINT_NAME
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.TARGET_POINT_ID, t.COORDINATE_DOWN, t.POINT_TYPE,
           t.COORDINATE_EAST, t.COORDINATE_NORTH, t.COORDINATE_TVD, t.COORDINATE_UP,
           t.SEQUENCE_NO, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING, t.POINT_NAME
    FROM DP_PROJECT_TARGET_POINT t
         , CD_PROJECT_TARGET_WB_LINK wl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND t.project_target_id = wl.project_target_id
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND wl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET_POINT pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function updateCdProjectTargetWbLink(
  newProjId: string, currProjId: string, siteId: string
): string {
  return `
    UPDATE CD_PROJECT_TARGET_WB_LINK wl
    SET wl.project_id = '${newProjId}'
    WHERE wl.project_id = '${currProjId}'
      AND wl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pt
          WHERE pt.project_id = '${newProjId}'
            AND wl.project_target_id = pt.project_target_id
      )
  `;
}

// ─── Update Project Target Design/Scenario Associations ──────────────────────

export function insertDpProjectTargetScenario(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET (
        PROJECT_ID, PROJECT_TARGET_ID, DRILL_WELL_ID, DRILL_WELLBORE_ID, DRILL_DEF_SURVEY_HEADER_ID,
        COORD_TYPE, GEO_LATITUDE, GEO_LONGITUDE, GEO_MAP_EASTING, GEO_MAP_NORTHING,
        X_OFFSET, Y_OFFSET, AZIMUTH_START, AZIMUTH_END, DIP_ANGLE, DIP_DIRECTION,
        ALIGN_TARGET_ID, GEO_OFFSET_EAST_TARGET, GEO_OFFSET_NORTH_TARGET, TARGET_TYPE, TARGET_TVD,
        TARGET_DESCRIPTION, TARGET_HIDE, TARGET_INCLINATION, TARGET_AZIMUTH, TARGET_GEOMETRY,
        TARGET_NAME, TOLERANCE_HEADING, TOLERANCE_FORWARD, TOLERANCE_BACK, TOLERANCE_LEFT,
        TOLERANCE_RIGHT, TOLERANCE_UP, TOLERANCE_DOWN, DRILL_TOLERANCE, VERTICAL_TOLERANCE,
        IS_READONLY, IS_DRILLERS_TARGET, IS_POINT_MAP_COORD_LOCK, LAST_GOOD_CORRELATION_MD,
        PENETRATION_AZIMUTH, PENETRATION_INCLINATION, LOCK_PENETRATION, DRILL_CONFIDENCE,
        SEQUENCE_NO, CREATE_DATE, CREATE_USER_ID, CREATE_APP_ID, UPDATE_DATE, UPDATE_USER_ID, UPDATE_APP_ID
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.DRILL_WELL_ID, t.DRILL_WELLBORE_ID, t.DRILL_DEF_SURVEY_HEADER_ID,
           t.COORD_TYPE, t.GEO_LATITUDE, t.GEO_LONGITUDE, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING,
           t.X_OFFSET, t.Y_OFFSET, t.AZIMUTH_START, t.AZIMUTH_END, t.DIP_ANGLE, t.DIP_DIRECTION,
           t.ALIGN_TARGET_ID, t.GEO_OFFSET_EAST_TARGET, t.GEO_OFFSET_NORTH_TARGET, t.TARGET_TYPE,
           t.TARGET_TVD, t.TARGET_DESCRIPTION, t.TARGET_HIDE, t.TARGET_INCLINATION, t.TARGET_AZIMUTH,
           t.TARGET_GEOMETRY, t.TARGET_NAME, t.TOLERANCE_HEADING, t.TOLERANCE_FORWARD, t.TOLERANCE_BACK,
           t.TOLERANCE_LEFT, t.TOLERANCE_RIGHT, t.TOLERANCE_UP, t.TOLERANCE_DOWN, t.DRILL_TOLERANCE,
           t.VERTICAL_TOLERANCE, t.IS_READONLY, t.IS_DRILLERS_TARGET, t.IS_POINT_MAP_COORD_LOCK,
           t.LAST_GOOD_CORRELATION_MD, t.PENETRATION_AZIMUTH, t.PENETRATION_INCLINATION,
           t.LOCK_PENETRATION, t.DRILL_CONFIDENCE, t.SEQUENCE_NO,
           t.CREATE_DATE, t.CREATE_USER_ID, t.CREATE_APP_ID,
           SYSDATE, 'McAleerA', 'DM Script'
    FROM DP_PROJECT_TARGET t
         , CD_PROJ_TARG_SCENARIO_LINK sl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND t.project_target_id = sl.project_target_id
      AND sl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND sl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function insertDpProjectTargetPointScenario(
  newProjId: string, currProjId: string, siteId: string, policyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET_POINT (
        PROJECT_ID, PROJECT_TARGET_ID, TARGET_POINT_ID,
        COORDINATE_DOWN, POINT_TYPE, COORDINATE_EAST, COORDINATE_NORTH,
        COORDINATE_TVD, COORDINATE_UP, SEQUENCE_NO, GEO_MAP_EASTING, GEO_MAP_NORTHING, POINT_NAME
    )
    SELECT '${newProjId}',
           t.PROJECT_TARGET_ID, t.TARGET_POINT_ID, t.COORDINATE_DOWN, t.POINT_TYPE,
           t.COORDINATE_EAST, t.COORDINATE_NORTH, t.COORDINATE_TVD, t.COORDINATE_UP,
           t.SEQUENCE_NO, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING, t.POINT_NAME
    FROM DP_PROJECT_TARGET_POINT t
         , CD_PROJ_TARG_SCENARIO_LINK sl
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND t.project_target_id = sl.project_target_id
      AND sl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${siteId}'
      AND sl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${policyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET_POINT pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function updateCdProjTargScenarioLink(
  newProjId: string, currProjId: string, siteId: string
): string {
  return `
    UPDATE CD_PROJ_TARG_SCENARIO_LINK sl
    SET sl.project_id = '${newProjId}'
    WHERE sl.project_id = '${currProjId}'
      AND sl.well_id IN (SELECT well_id FROM cd_well WHERE site_id = '${siteId}')
      AND EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pt
          WHERE pt.project_id = '${newProjId}'
            AND sl.project_target_id = pt.project_target_id
      )
  `;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface SiteAuditSqlGroups {
  generatedSql: string;
  sqlMoveSites: string;
  sqlUpdatePtSite: string;
  sqlUpdatePtWell: string;
  sqlUpdatePtWb: string;
  sqlUpdatePtDesign: string;
}

export interface SiteAuditInsertResult {
  sql: string;
  binds: Record<string, string>;
}

export function insertSiteMoveAudit(
  siteId: string, newProjectId: string, row: Record<string, unknown>,
  groups: SiteAuditSqlGroups
): SiteAuditInsertResult {
  const s = (key: string, maxLen = 200): string => {
    const val = String(row[key] ?? '').replace(/'/g, "''");
    return val.substring(0, maxLen);
  };
  const n = (key: string): string => {
    const val = row[key];
    return val == null ? 'NULL' : String(val);
  };

  const sql = `
    INSERT INTO SITE_MOVE_AUDIT (
        SITE_ID, NEW_PROJECT_ID,
        GENERATED_SQL,
        CURRENT_BUSINESS_UNIT_NAME, NEW_BUSINESS_UNIT_NAME,
        CURRENT_PROJECT_NAME, NEW_PROJECT_NAME,
        CURRENT_SITE_NAME, NEW_SITE_NAME,
        STATE, COUNTY,
        CURRENT_POLICY_ID, NEW_POLICY_ID,
        CURRENT_PROJECT_ID,
        REPORTS_WITHIN_LAST_10_DAYS,
        SITES_IN_CURRENT_PROJECT, WELLS_IN_CURRENT_PROJECT, WELLS_IN_CURRENT_SITE,
        ATTACHMENT_JOURNAL, PARENT_CHANGE_HISTORY_JOURNAL, ITEM_CHANGE_HISTORY_JOURNAL,
        POLYLINE_HEADER,
        SURVEY_PROGRAM_W_POLICY_ID, SURVEY_HEADER_W_POLICY_ID,
        SURVEY_STATION_W_PROJECT_ID, VERTICAL_SECTION_W_PROJECT_ID,
        PROJECT_TARGET, TARGET_POINT,
        TARGET_SITE_LINK, TARGET_WELL_LINK, TARGET_WELLBORE_LINK, TARGET_SCENARIO_LINK,
        SQL_TO_MOVE_SITES_TO_NEW_PROJECTS,
        SQL_TO_UPDATE_PT_SITE_ASSOC,
        SQL_TO_UPDATE_PT_WELL_ASSOC,
        SQL_TO_UPDATE_PT_WELLBORE_ASSOC,
        SQL_TO_UPDATE_PT_DESIGN_ASSOC,
        LOAD_DT
    ) VALUES (
        '${siteId}', '${newProjectId}',
        :generatedSql,
        '${s('Current Business Unit Name')}', '${s('New Business Unit Name')}',
        '${s('Current Project Name')}', '${s('New Project Name')}',
        '${s('Site Name')}', '${s('Site Name')}',
        '${s('State', 100)}', '${s('County', 100)}',
        '${s('Current Policy ID', 10)}', '${s('New Policy ID', 10)}',
        '${s('Current Project ID', 10)}',
        ${n('Reports within Last 10 Days')},
        ${n('Sites in Current Project')}, ${n('Wells in Current Project')}, ${n('Wells in Current Site')},
        ${n('Attachment Journal')}, ${n('Parent Change History Journal')}, ${n('Item Change History Journal')},
        ${n('Polyline Header')},
        ${n('Survey Program w Policy ID')}, ${n('Survey Header w Policy ID')},
        ${n('Survey Station w Project ID')}, ${n('Vertical Section w Project ID')},
        ${n('Project Target')}, ${n('Target Point')},
        ${n('Target Site Link')}, ${n('Target Well Link')}, ${n('Target Wellbore Link')}, ${n('Target Scenario Link')},
        :sqlMoveSites,
        :sqlUpdatePtSite,
        :sqlUpdatePtWell,
        :sqlUpdatePtWellbore,
        :sqlUpdatePtDesign,
        SYSDATE
    )
  `;

  const binds: Record<string, string> = {
    generatedSql: groups.generatedSql,
    sqlMoveSites: groups.sqlMoveSites,
    sqlUpdatePtSite: groups.sqlUpdatePtSite,
    sqlUpdatePtWell: groups.sqlUpdatePtWell,
    sqlUpdatePtWellbore: groups.sqlUpdatePtWb,
    sqlUpdatePtDesign: groups.sqlUpdatePtDesign
  };

  return { sql, binds };
}
