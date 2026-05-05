export function apiLookWellId(apiNo: string): string {
  return `
    SELECT d.well_id "well_id",
           d.api_no "api_no",
           d.well_common_name "Well Common Name",
           c.site_name "Site Name",
           b.project_name "Field Name",
           a.customer_name "Business Unit"
    FROM cd_policy a, cd_project b, cd_site c, cd_well d
    WHERE a.policy_id = b.policy_id
      AND b.project_id = c.project_id
      AND c.site_id = d.site_id
      AND (d.api_no LIKE '${apiNo}' OR upper(d.well_common_name) LIKE upper('${apiNo}'))
  `;
}
