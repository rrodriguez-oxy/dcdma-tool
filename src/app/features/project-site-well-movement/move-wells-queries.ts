// ─── Move Info ────────────────────────────────────────────────────────────────

export function selectSiteInfo(siteId: string): string {
  return `
    SELECT
        s.site_id "Site ID",
        s.site_name "Site Name",
        pr.project_name "Project Name",
        po.customer_name "Business Unit"
    FROM
        CD_SITE s,
        CD_PROJECT pr,
        CD_POLICY po
    WHERE
        (s.site_id LIKE '${siteId}' OR s.site_name LIKE '${siteId}')
        AND pr.project_id = s.project_id
        AND po.policy_id = pr.policy_id
  `;
}

export function selectFull(wellId: string, newSiteId: string): string {
  return `
    SELECT
        NVL(po.customer_name,'*** Null ***') "Current Business Unit",
        NVL((SELECT po2.customer_name
             FROM cd_policy po2, cd_project pr2, cd_site s2
             WHERE (s2.site_id = '${newSiteId}' OR s2.site_name = '${newSiteId}')
               AND pr2.project_id = s2.project_id
               AND po2.policy_id = pr2.policy_id
        ),'*** Not Found ***') "New Policy Name",

        NVL(pr.project_name,'*** Null ***') "Current Project Name",
        NVL((SELECT pr2.project_name
             FROM cd_project pr2, cd_site s2
             WHERE (s2.site_id = '${newSiteId}' OR s2.site_name = '${newSiteId}')
               AND pr2.project_id = s2.project_id
        ),'*** Not Found ***') "New Project Name",

        NVL(s.site_name,'*** Null ***') "Current Site Name",
        NVL((SELECT s2.site_name
             FROM cd_site s2
             WHERE s2.site_id = '${newSiteId}' OR s2.site_name = '${newSiteId}'
        ),'*** Not Found ***') "New Site Name",

        w.well_common_name "Well Name",
        w.api_no "API-10",
        w.loc_state State,
        w.loc_county County,
        w.well_desc "Org Seq #",
        w.well_desc_alternate "Org Seq Description",
        w.well_id "Well ID",

        po.policy_id "Current Policy ID",
        NVL((SELECT pr2.policy_id
             FROM cd_project pr2, cd_site s2
             WHERE (s2.site_id = '${newSiteId}' OR s2.site_name = '${newSiteId}')
               AND s2.project_id = pr2.project_id
        ),'*** Not Found ***') "New Policy ID",

        pr.project_id "Current Project ID",
        NVL((SELECT pr2.project_id
             FROM cd_project pr2, cd_site s2
             WHERE (s2.site_id = '${newSiteId}' OR s2.site_name = '${newSiteId}')
               AND s2.project_id = pr2.project_id
        ),'*** Not Found ***') "New Project ID",

        s.site_id "Current Site ID",
        NVL((SELECT s2.site_id
             FROM cd_site s2
             WHERE s2.site_id = '${newSiteId}' OR s2.site_name = '${newSiteId}'
        ),'*** Not Found ***') "New Site ID",

        NULL " ",

        (SELECT COUNT(*)
         FROM DM_REPORT_JOURNAL R
         WHERE R.DATE_REPORT + 10 >= SYSDATE
           AND W.WELL_ID = R.WELL_ID
           AND R.REPORT_ALIAS NOT IN ('GEN_AFE','GEN_PLAN')
        ) "Reports within 10 Days",

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
         WHERE r.attachment_locator LIKE '%+well_id=(' || w.well_id || '%'
        ) "Attachment Journal",

        (SELECT COUNT(*) FROM CD_CHANGE_HISTORY_JOURNAL r
         WHERE r.parent_locator LIKE '%+well_id=(' || w.well_id || '%'
        ) "Parent Change History Journal",

        (SELECT COUNT(*) FROM CD_CHANGE_HISTORY_JOURNAL r
         WHERE r.item_locator LIKE '%+well_id=(' || w.well_id || '%'
        ) "Item Change History Journal",

        (SELECT COUNT(*) FROM CD_POLYLINE_HEADER r
         WHERE r.attachment_locator LIKE '%+well_id=(' || w.well_id || '%'
        ) "Polyline Header",

        (SELECT COUNT(*) FROM CD_SURVEY_PROGRAM r
         WHERE r.well_id = w.well_id
           AND r.policy_id = po.policy_id
        ) "Survey Program w Policy ID",

        (SELECT COUNT(*) FROM CD_SURVEY_HEADER r
         WHERE r.well_id = w.well_id
           AND r.policy_id = po.policy_id
        ) "Survey Header w Policy ID",

        (SELECT COUNT(*) FROM CD_SURVEY_STATION r
         WHERE r.well_id = w.well_id
           AND r.project_id = pr.project_id
        ) "Survey Station w Project ID",

        (SELECT COUNT(*) FROM CD_VERTICAL_SECTION r
         WHERE w.well_id = r.well_id
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
           AND w.site_id = r.site_id
        ) "Target Site Link",

        (SELECT COUNT(*) FROM CD_PROJ_TARG_WELL_LINK r
         WHERE r.project_id = pr.project_id
           AND w.well_id = r.well_id
        ) "Targ Well Link",

        (SELECT COUNT(*) FROM CD_PROJECT_TARGET_WB_LINK r
         WHERE r.project_id = pr.project_id
           AND w.well_id = r.well_id
        ) "Target Wellbore Link",

        (SELECT COUNT(*) FROM CD_PROJ_TARG_SCENARIO_LINK r
         WHERE r.project_id = pr.project_id
           AND w.well_id = r.well_id
        ) "Target Scenario Link"

    FROM
        CD_PROJECT pr,
        CD_POLICY po,
        CD_SITE s,
        CD_WELL w

    WHERE
        po.policy_id = pr.policy_id
        AND pr.project_id = s.project_id
        AND s.site_id = w.site_id
        AND (w.well_id = '${wellId}'
             OR w.well_common_name = '${wellId}'
             OR w.well_legal_name = '${wellId}')
  `;
}

// ─── Move Wells ──────────────────────────────────────────────────────────────

export function updateWellSite(newSiteId: string, wellId: string, newPolicyId: string, newProjId: string): string {
  return `
    UPDATE cd_well
    SET site_id = '${newSiteId}'
    WHERE well_id = '${wellId}'
      AND '${newSiteId}' IN (
          SELECT s.site_id
          FROM CD_SITE s
               JOIN CD_PROJECT pr ON s.project_id = pr.project_id
               JOIN CD_POLICY po ON pr.policy_id = po.policy_id
          WHERE s.site_id = '${newSiteId}'
            AND pr.project_id = '${newProjId}'
            AND po.policy_id = '${newPolicyId}'
      )
  `;
}

export function updateCdAttachmentJournal(
  currPolicyId: string, currProjId: string, currSiteId: string, wellId: string,
  newPolicyId: string, newProjId: string, newSiteId: string
): string {
  return `
    UPDATE cd_attachment_journal a
    SET a.attachment_locator = REPLACE(
        a.attachment_locator,
        'policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})',
        'policy_id=(${newPolicyId})+project_id=(${newProjId})+site_id=(${newSiteId})+well_id=(${wellId})'
    )
    WHERE a.attachment_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})%'
  `;
}

export function updateCdChangeHistoryParentLocator(
  currPolicyId: string, currProjId: string, currSiteId: string, wellId: string,
  newPolicyId: string, newProjId: string, newSiteId: string
): string {
  return `
    UPDATE cd_change_history_journal a
    SET a.parent_locator = REPLACE(
        a.parent_locator,
        'policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})',
        'policy_id=(${newPolicyId})+project_id=(${newProjId})+site_id=(${newSiteId})+well_id=(${wellId})'
    )
    WHERE a.parent_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})%'
  `;
}

export function updateCdChangeHistoryItemLocator(
  currPolicyId: string, currProjId: string, currSiteId: string, wellId: string,
  newPolicyId: string, newProjId: string, newSiteId: string
): string {
  return `
    UPDATE cd_change_history_journal a
    SET a.item_locator = REPLACE(
        a.item_locator,
        'policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})',
        'policy_id=(${newPolicyId})+project_id=(${newProjId})+site_id=(${newSiteId})+well_id=(${wellId})'
    )
    WHERE a.item_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})%'
  `;
}

export function updateCdPolylineHeader(
  currPolicyId: string, currProjId: string, currSiteId: string, wellId: string,
  newPolicyId: string, newProjId: string, newSiteId: string
): string {
  return `
    UPDATE cd_polyline_header a
    SET a.attachment_locator = REPLACE(
        a.attachment_locator,
        'policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})',
        'policy_id=(${newPolicyId})+project_id=(${newProjId})+site_id=(${newSiteId})+well_id=(${wellId})'
    )
    WHERE a.attachment_locator LIKE
        '%policy_id=(${currPolicyId})+project_id=(${currProjId})+site_id=(${currSiteId})+well_id=(${wellId})%'
  `;
}

export function updateCdSurveyProgram(wellId: string, currPolicyId: string, newPolicyId: string): string {
  return `
    UPDATE cd_survey_program su
    SET su.policy_id = '${newPolicyId}'
    WHERE su.well_id = '${wellId}'
      AND su.policy_id = '${currPolicyId}'
      AND EXISTS (
        SELECT 1 FROM CD_POLICY p WHERE p.policy_id = '${newPolicyId}'
      )
  `;
}

export function updateCdSurveyHeader(wellId: string, currPolicyId: string, newPolicyId: string): string {
  return `
    UPDATE cd_survey_header su
    SET su.policy_id = '${newPolicyId}'
    WHERE su.well_id = '${wellId}'
      AND su.policy_id = '${currPolicyId}'
      AND EXISTS (
        SELECT 1 FROM CD_POLICY p WHERE p.policy_id = '${newPolicyId}'
      )
  `;
}

export function updateCdSurveyStation(wellId: string, currProjId: string, newProjId: string): string {
  return `
    UPDATE cd_survey_station su
    SET su.project_id = '${newProjId}'
    WHERE su.well_id = '${wellId}'
      AND su.project_id = '${currProjId}'
      AND EXISTS (
        SELECT 1 FROM CD_PROJECT p WHERE p.project_id = '${newProjId}'
      )
  `;
}

export function updateCdVerticalSection(wellId: string, currProjId: string, newProjId: string): string {
  return `
    UPDATE cd_vertical_section su
    SET su.project_id = '${newProjId}'
    WHERE su.well_id = '${wellId}'
      AND su.project_id = '${currProjId}'
      AND EXISTS (
        SELECT 1 FROM CD_PROJECT p WHERE p.project_id = '${newProjId}'
      )
  `;
}

export function updateWellUserDefined1(wellId: string, userDefinedValue: string): string {
  return `
    UPDATE cd_well
    SET user_defined_1 = '${userDefinedValue}'
    WHERE well_id = '${wellId}'
  `;
}

// ─── Update Project Target Well Associations ─────────────────────────────────

export function insertDpProjectTargetWell(
  newProjId: string, currProjId: string, newSiteId: string, wellId: string, newPolicyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET (
        PROJECT_ID, PROJECT_TARGET_ID, DRILL_well_id, DRILL_WELLBORE_ID, DRILL_DEF_SURVEY_HEADER_ID,
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
           t.PROJECT_TARGET_ID, t.DRILL_well_id, t.DRILL_WELLBORE_ID, t.DRILL_DEF_SURVEY_HEADER_ID,
           t.COORD_TYPE, t.GEO_LATITUDE, t.GEO_LONGITUDE, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING,
           t.X_OFFSET, t.Y_OFFSET, t.AZIMUTH_START, t.AZIMUTH_END, t.DIP_ANGLE, t.DIP_DIRECTION,
           t.ALIGN_TARGET_ID, t.GEO_OFFSET_EAST_TARGET, t.GEO_OFFSET_NORTH_TARGET, t.TARGET_TYPE,
           t.TARGET_TVD, t.TARGET_DESCRIPTION, t.TARGET_HIDE, t.TARGET_INCLINATION, t.TARGET_AZIMUTH,
           t.TARGET_GEOMETRY, t.TARGET_NAME, t.TOLERANCE_HEADING, t.TOLERANCE_FORWARD, t.TOLERANCE_BACK,
           t.TOLERANCE_LEFT, t.TOLERANCE_RIGHT, t.TOLERANCE_UP, t.TOLERANCE_DOWN, t.DRILL_TOLERANCE,
           t.VERTICAL_TOLERANCE, t.IS_READONLY, t.IS_DRILLERS_TARGET, t.IS_POINT_MAP_COORD_LOCK,
           t.LAST_GOOD_CORRELATION_MD, t.PENETRATION_AZIMUTH, t.PENETRATION_INCLINATION,
           t.LOCK_PENETRATION, t.DRILL_CONFIDENCE, t.SEQUENCE_NO, t.CREATE_DATE, t.CREATE_USER_ID, t.CREATE_APP_ID,
           SYSDATE, 'McAleerA', 'DM Script'
    FROM DP_PROJECT_TARGET t
         , CD_PROJ_TARG_WELL_LINK wl
         , CD_WELL w
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${newSiteId}'
      AND t.project_target_id = wl.project_target_id
      AND s.site_id = w.site_id
      AND wl.well_id = w.well_id
      AND w.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${newPolicyId}'
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
  newProjId: string, currProjId: string, newSiteId: string, wellId: string, newPolicyId: string
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
         , CD_WELL w
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${newSiteId}'
      AND t.project_target_id = wl.project_target_id
      AND s.site_id = w.site_id
      AND wl.well_id = w.well_id
      AND w.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${newPolicyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET_POINT pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function updateCdProjTargWellLinkWell(newProjId: string, currProjId: string, wellId: string): string {
  return `
    UPDATE CD_PROJ_TARG_WELL_LINK wl
    SET wl.project_id = '${newProjId}'
    WHERE wl.project_id = '${currProjId}'
      AND wl.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pt
          WHERE pt.project_id = '${newProjId}'
            AND wl.project_target_id = pt.project_target_id
      )
      AND NOT EXISTS (
          SELECT 123 FROM CD_PROJ_TARG_WELL_LINK twl
          WHERE twl.project_id = '${newProjId}'
            AND twl.well_id = '${wellId}'
            AND twl.project_target_id = wl.project_target_id
      )
  `;
}

// ─── Update Project Target Wellbore Associations ─────────────────────────────

export function insertDpProjectTargetWellbore(
  newProjId: string, currProjId: string, newSiteId: string, wellId: string, newPolicyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET (
        PROJECT_ID, PROJECT_TARGET_ID, DRILL_well_id, DRILL_WELLBORE_ID, DRILL_DEF_SURVEY_HEADER_ID,
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
           t.PROJECT_TARGET_ID, t.DRILL_well_id, t.DRILL_WELLBORE_ID, t.DRILL_DEF_SURVEY_HEADER_ID,
           t.COORD_TYPE, t.GEO_LATITUDE, t.GEO_LONGITUDE, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING,
           t.X_OFFSET, t.Y_OFFSET, t.AZIMUTH_START, t.AZIMUTH_END, t.DIP_ANGLE, t.DIP_DIRECTION,
           t.ALIGN_TARGET_ID, t.GEO_OFFSET_EAST_TARGET, t.GEO_OFFSET_NORTH_TARGET, t.TARGET_TYPE,
           t.TARGET_TVD, t.TARGET_DESCRIPTION, t.TARGET_HIDE, t.TARGET_INCLINATION, t.TARGET_AZIMUTH,
           t.TARGET_GEOMETRY, t.TARGET_NAME, t.TOLERANCE_HEADING, t.TOLERANCE_FORWARD, t.TOLERANCE_BACK,
           t.TOLERANCE_LEFT, t.TOLERANCE_RIGHT, t.TOLERANCE_UP, t.TOLERANCE_DOWN, t.DRILL_TOLERANCE,
           t.VERTICAL_TOLERANCE, t.IS_READONLY, t.IS_DRILLERS_TARGET, t.IS_POINT_MAP_COORD_LOCK,
           t.LAST_GOOD_CORRELATION_MD, t.PENETRATION_AZIMUTH, t.PENETRATION_INCLINATION,
           t.LOCK_PENETRATION, t.DRILL_CONFIDENCE, t.SEQUENCE_NO, t.CREATE_DATE, t.CREATE_USER_ID, t.CREATE_APP_ID,
           SYSDATE, 'McAleerA', 'DM Script'
    FROM DP_PROJECT_TARGET t
         , CD_PROJECT_TARGET_WB_LINK wl
         , CD_WELL w
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${newSiteId}'
      AND t.project_target_id = wl.project_target_id
      AND s.site_id = w.site_id
      AND wl.well_id = w.well_id
      AND w.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${newPolicyId}'
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
  newProjId: string, currProjId: string, newSiteId: string, wellId: string, newPolicyId: string
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
         , CD_WELL w
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND wl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${newSiteId}'
      AND t.project_target_id = wl.project_target_id
      AND s.site_id = w.site_id
      AND wl.well_id = w.well_id
      AND w.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${newPolicyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET_POINT pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function updateCdProjectTargetWbLinkWellbore(newProjId: string, currProjId: string, wellId: string): string {
  return `
    UPDATE CD_PROJECT_TARGET_WB_LINK wl
    SET wl.project_id = '${newProjId}'
    WHERE wl.project_id = '${currProjId}'
      AND wl.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pt
          WHERE pt.project_id = '${newProjId}'
            AND wl.project_target_id = pt.project_target_id
      )
      AND NOT EXISTS (
          SELECT 123 FROM CD_PROJECT_TARGET_WB_LINK twl
          WHERE twl.project_id = '${newProjId}'
            AND twl.well_id = '${wellId}'
            AND twl.project_target_id = wl.project_target_id
      )
  `;
}

// ─── Update Project Target Design Associations ───────────────────────────────

export function insertDpProjectTargetScenarioDesign(
  newProjId: string, currProjId: string, newSiteId: string, wellId: string, newPolicyId: string
): string {
  return `
    INSERT INTO DP_PROJECT_TARGET (
        PROJECT_ID, PROJECT_TARGET_ID, DRILL_well_id, DRILL_WELLBORE_ID, DRILL_DEF_SURVEY_HEADER_ID,
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
           t.PROJECT_TARGET_ID, t.DRILL_well_id, t.DRILL_WELLBORE_ID, t.DRILL_DEF_SURVEY_HEADER_ID,
           t.COORD_TYPE, t.GEO_LATITUDE, t.GEO_LONGITUDE, t.GEO_MAP_EASTING, t.GEO_MAP_NORTHING,
           t.X_OFFSET, t.Y_OFFSET, t.AZIMUTH_START, t.AZIMUTH_END, t.DIP_ANGLE, t.DIP_DIRECTION,
           t.ALIGN_TARGET_ID, t.GEO_OFFSET_EAST_TARGET, t.GEO_OFFSET_NORTH_TARGET, t.TARGET_TYPE,
           t.TARGET_TVD, t.TARGET_DESCRIPTION, t.TARGET_HIDE, t.TARGET_INCLINATION, t.TARGET_AZIMUTH,
           t.TARGET_GEOMETRY, t.TARGET_NAME, t.TOLERANCE_HEADING, t.TOLERANCE_FORWARD, t.TOLERANCE_BACK,
           t.TOLERANCE_LEFT, t.TOLERANCE_RIGHT, t.TOLERANCE_UP, t.TOLERANCE_DOWN, t.DRILL_TOLERANCE,
           t.VERTICAL_TOLERANCE, t.IS_READONLY, t.IS_DRILLERS_TARGET, t.IS_POINT_MAP_COORD_LOCK,
           t.LAST_GOOD_CORRELATION_MD, t.PENETRATION_AZIMUTH, t.PENETRATION_INCLINATION,
           t.LOCK_PENETRATION, t.DRILL_CONFIDENCE, t.SEQUENCE_NO, t.CREATE_DATE, t.CREATE_USER_ID, t.CREATE_APP_ID,
           SYSDATE, 'McAleerA', 'DM Script'
    FROM DP_PROJECT_TARGET t
         , CD_PROJ_TARG_SCENARIO_LINK sl
         , CD_WELL w
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND sl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${newSiteId}'
      AND t.project_target_id = sl.project_target_id
      AND s.site_id = w.site_id
      AND sl.well_id = w.well_id
      AND w.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${newPolicyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function insertDpProjectTargetPointScenarioDesign(
  newProjId: string, currProjId: string, newSiteId: string, wellId: string, newPolicyId: string
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
         , CD_WELL w
         , CD_SITE s
    WHERE t.project_id = '${currProjId}'
      AND sl.project_id = '${currProjId}'
      AND s.project_id = '${newProjId}'
      AND s.site_id = '${newSiteId}'
      AND t.project_target_id = sl.project_target_id
      AND s.site_id = w.site_id
      AND sl.well_id = w.well_id
      AND w.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM CD_PROJECT pr
          WHERE pr.policy_id = '${newPolicyId}'
            AND pr.project_id = '${newProjId}'
      )
      AND NOT EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET_POINT pr
          WHERE pr.project_id = '${newProjId}'
            AND t.project_target_id = pr.project_target_id
      )
  `;
}

export function updateCdProjTargScenarioLinkDesign(newProjId: string, currProjId: string, wellId: string): string {
  return `
    UPDATE CD_PROJ_TARG_SCENARIO_LINK sl
    SET sl.project_id = '${newProjId}'
    WHERE sl.project_id = '${currProjId}'
      AND sl.well_id = '${wellId}'
      AND EXISTS (
          SELECT 123 FROM DP_PROJECT_TARGET pt
          WHERE pt.project_id = '${newProjId}'
            AND sl.project_target_id = pt.project_target_id
      )
      AND NOT EXISTS (
          SELECT 123 FROM CD_PROJ_TARG_SCENARIO_LINK tsl
          WHERE tsl.project_id = '${newProjId}'
            AND tsl.well_id = '${wellId}'
            AND tsl.project_target_id = sl.project_target_id
      )
  `;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditSqlGroups {
  generatedSql: string;
  sqlMoveWells: string;
  sqlUpdatePtWell: string;
  sqlUpdatePtWb: string;
  sqlUpdatePtDesign: string;
}

export interface AuditInsertResult {
  sql: string;
  binds: Record<string, string>;
}

export function insertWellMoveAudit(
  wellId: string, newSiteId: string, row: Record<string, unknown>,
  groups: AuditSqlGroups
): AuditInsertResult {
  const s = (key: string, maxLen = 200): string => {
    const val = String(row[key] ?? '').replace(/'/g, "''");
    return val.substring(0, maxLen);
  };
  const n = (key: string): string => {
    const val = row[key];
    return val == null ? 'NULL' : String(val);
  };

  const sql = `
    INSERT INTO WELL_MOVE_AUDIT (
        WELL_ID, NEW_SITE_ID,
        GENERATED_SQL,
        CURRENT_BUSINESS_UNIT_NAME, NEW_BUSINESS_UNIT_NAME,
        CURRENT_PROJECT_NAME, NEW_PROJECT_NAME,
        CURRENT_SITE_NAME, NEW_SITE_NAME,
        WELL_NAME, API_10, STATE, COUNTY,
        ORG_SEQ_NUMBER, ORG_SEQ_DESCRIPTION,
        CURRENT_POLICY_ID, NEW_POLICY_ID,
        CURRENT_PROJECT_ID, NEW_PROJECT_ID,
        CURRENT_SITE_ID,
        REPORTS_WITHIN_LAST_10_DAYS,
        SITES_IN_CURRENT_PROJECT, WELLS_IN_CURRENT_PROJECT, WELLS_IN_CURRENT_SITE,
        ATTACHMENT_JOURNAL, PARENT_CHANGE_HISTORY_JOURNAL, ITEM_CHANGE_HISTORY_JOURNAL,
        POLYLINE_HEADER,
        SURVEY_PROGRAM_W_POLICY_ID, SURVEY_HEADER_W_POLICY_ID,
        SURVEY_STATION_W_PROJECT_ID, VERTICAL_SECTION_W_PROJECT_ID,
        PROJECT_TARGET, TARGET_POINT,
        TARGET_SITE_LINK, TARG_WELL_LINK, TARGET_WELLBORE_LINK, TARGET_SCENARIO_LINK,
        SQL_TO_MOVE_WELLS_TO_NEW_SITES,
        SQL_TO_UPDATE_PT_WELL_ASSOC,
        SQL_TO_UPDATE_PT_WB_ASSOC,
        SQL_TO_UPDATE_PT_DESIGN_ASSOC,
        LOAD_DT
    ) VALUES (
        '${wellId}', '${newSiteId}',
        :generatedSql,
        '${s('Current Business Unit')}', '${s('New Policy Name')}',
        '${s('Current Project Name')}', '${s('New Project Name')}',
        '${s('Current Site Name')}', '${s('New Site Name')}',
        '${s('Well Name')}', '${s('API-10', 10)}', '${s('State', 100)}', '${s('County', 100)}',
        '${s('Org Seq #', 50)}', '${s('Org Seq Description')}',
        '${s('Current Policy ID', 10)}', '${s('New Policy ID', 10)}',
        '${s('Current Project ID', 10)}', '${s('New Project ID', 10)}',
        '${s('Current Site ID', 10)}',
        ${n('Reports within 10 Days')},
        ${n('Sites in Current Project')}, ${n('Wells in Current Project')}, ${n('Wells in Current Site')},
        ${n('Attachment Journal')}, ${n('Parent Change History Journal')}, ${n('Item Change History Journal')},
        ${n('Polyline Header')},
        ${n('Survey Program w Policy ID')}, ${n('Survey Header w Policy ID')},
        ${n('Survey Station w Project ID')}, ${n('Vertical Section w Project ID')},
        ${n('Project Target')}, ${n('Target Point')},
        ${n('Target Site Link')}, ${n('Targ Well Link')}, ${n('Target Wellbore Link')}, ${n('Target Scenario Link')},
        :sqlMoveWells,
        :sqlUpdatePtWell,
        :sqlUpdatePtWb,
        :sqlUpdatePtDesign,
        SYSDATE
    )
  `;

  const binds: Record<string, string> = {
    generatedSql: groups.generatedSql,
    sqlMoveWells: groups.sqlMoveWells,
    sqlUpdatePtWell: groups.sqlUpdatePtWell,
    sqlUpdatePtWb: groups.sqlUpdatePtWb,
    sqlUpdatePtDesign: groups.sqlUpdatePtDesign
  };

  return { sql, binds };
}
