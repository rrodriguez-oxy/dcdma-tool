interface UpdateConfig {
  table: string;
  fields: string[];
  joinType?: 'polyline' | 'afe';
}

const updateConfigs: UpdateConfig[] = [
  { table: 'CD_ASSEMBLY', fields: ['md_assembly_base'] },
  { table: 'CD_CASE_TEMP_GRADIENT', fields: ['md', 'tvd'] },
  { table: 'CD_CEMENT_FLUID', fields: ['slurry_base_tvd', 'slurry_top_tvd'] },
  { table: 'CD_CEMENT_FLUID_SCHEDULE', fields: ['md_base', 'md_top', 'top_of_fluid', 'top_of_fluid_tvd'] },
  { table: 'CD_CEMENT_JOB', fields: ['md_float', 'packer_md', 'packer_tvd', 'plug_md_base', 'plug_md_top', 'plug_tvd_base', 'plug_tvd_top', 'shoetrack_drill_md', 'shoetrack_drill_tvd', 'shoetrack_top_md', 'shoetrack_top_tvd', 'squeeze_depth', 'squeeze_tvd', 'test_section_md_base', 'test_section_md_top', 'test_section_tvd_base', 'test_section_tvd_top', 'toc_md', 'toc_tvd', 'tvd_float'] },
  { table: 'CD_CEMENT_PLUG_STATUS', fields: ['md_base', 'md_top', 'tvd_base', 'tvd_top'] },
  { table: 'CD_CEMENT_STAGE', fields: ['md_base', 'md_cement_tool', 'md_ctu', 'md_plug_circ', 'md_stage_tool', 'md_top', 'squeeze_tool_md', 'squeeze_tool_tvd', 'squeeze_workstring_depth', 'squeeze_workstring_tvd', 'tvd_base', 'tvd_cement_tool', 'tvd_ctu', 'tvd_plug_circ', 'tvd_stage_tool', 'tvd_top'] },
  { table: 'CD_COMPLETION', fields: ['bottom_md', 'bottom_tvd', 'mpp', 'top_md', 'top_tvd'] },
  { table: 'CD_DEFINITIVE_SURVEY_HEADER', fields: ['acscan_md_max', 'acscan_md_min', 'bh_md', 'bh_tvd', 'ko_md', 'ko_tvd', 'maximum_dls_depth'] },
  { table: 'CD_DEFINITIVE_SURVEY_STATION', fields: ['md', 'tvd'] },
  { table: 'CD_EXTERNAL_COMP_ACC', fields: ['md_base', 'md_top'] },
  { table: 'CD_EXTERNAL_COMP_UMB', fields: ['cut_md'] },
  { table: 'CD_FLUID', fields: ['md_mud_sample', 'md_oil_cuttings', 'tvd_mud_sample', 'tvd_oil_cuttings'] },
  { table: 'CD_FRAC_GRADIENT', fields: ['tvd'] },
  { table: 'CD_HOLE_SECT', fields: ['md_shoe'] },
  { table: 'CD_HOLE_SECT_GROUP', fields: ['md_casing_bottom', 'md_casing_top', 'md_hole_sect_base', 'md_hole_sect_top', 'next_casing_set_md', 'next_casing_set_tvd', 'plan_md', 'plan_tvd', 'tvd_casing_bottom', 'tvd_hole_sect_base', 'tvd_hole_sect_top'] },
  { table: 'CD_LESSON', fields: ['wellbore_md', 'wellbore_tvd'] },
  { table: 'CD_NBK_LEAK_OFF_TEST', fields: ['tvd'] },
  { table: 'CD_NBK_STRING_ANALYSIS', fields: ['drill_block_from', 'drill_block_to', 'lag_end_position', 'lag_start_position', 'md', 'pill_bottom', 'volhgt_end_position', 'volhgt_start_position'] },
  { table: 'CD_OPENING_STATUS', fields: ['md_base', 'md_top'] },
  { table: 'CD_PERF_INTERVAL', fields: ['md_bottom_shot', 'md_ref_casing_collar', 'md_top_shot'] },
  { table: 'CD_PERFORATE', fields: ['formation_depth', 'md_bottom_shot', 'md_top_shot', 'tvd_fluid_top', 'tvd_reservoir'] },
  { table: 'CD_POLYLINE_POINT', fields: ['z'], joinType: 'polyline' },
  { table: 'CD_PORE_PRESSURE', fields: ['tvd'] },
  { table: 'CD_SURVEY_HEADER', fields: ['maximum_dls_depth', 'md_max', 'md_min', 'tie_on_depth'] },
  { table: 'CD_SURVEY_PROGRAM', fields: ['md_base', 'md_top'] },
  { table: 'CD_SURVEY_STATION', fields: ['md', 'tvd'] },
  { table: 'CD_TEMP_GRADIENT', fields: ['tvd'] },
  { table: 'CD_TEST', fields: ['avg_reservoir_pressure_tvd', 'interval_base_md', 'interval_base_tvd', 'interval_top_md', 'interval_top_tvd', 'mpp', 'packer_tmd', 'pump_md', 'tubing_set_md'] },
  { table: 'CD_VERTICAL_SECTION', fields: ['md_start', 'tvd_start'] },
  { table: 'CD_WELLBORE', fields: ['authorized_md', 'authorized_tvd', 'bh_md', 'bh_tvd', 'budgeted_md', 'budgeted_tvd', 'ko_tvd', 'plugback_md', 'plugback_tvd', 'sub_salt_base_tvd', 'sub_salt_top_tvd'] },
  { table: 'CD_WELLBORE_FORMATION', fields: ['prognosed_base_md', 'prognosed_base_tvd', 'prognosed_md', 'prognosed_tvd', 'prognosed_tvd_end'] },
  { table: 'CD_WELLBORE_INTEREST', fields: ['md_from', 'md_to'] },
  { table: 'CD_WELLBORE_OPENING', fields: ['md_base', 'md_top'] },
  { table: 'CD_WELLBORE_STATUS', fields: ['md_current', 'md_max_hole_angle', 'md_plugback', 'tvd_current', 'tvd_plugback'] },
  { table: 'CD_WELLBORE_ZONE', fields: ['md_base', 'md_top', 'pay_base', 'pay_top', 'tvd_base', 'tvd_top'] },
  { table: 'CD_WEQP_GAS_LIFT_MANDREL', fields: ['tvd', 'tvd_subsea'] },
  { table: 'CD_WEQP_GRAVEL_PACK_SCREEN', fields: ['perf_shroud_base_md', 'perf_shroud_top_md'] },
  { table: 'CD_WEQP_PACKER', fields: ['expansion_joint_depth', 'packer_base', 'packer_depth', 'plug_depth', 'seal_assembly_center'] },
  { table: 'DM_ACTIVITY', fields: ['md_from', 'md_to'] },
  { table: 'DM_ACTIVITY_DETAIL', fields: ['md_from', 'md_to'] },
  { table: 'DM_AFE', fields: ['authorized_md', 'authorized_tvd'], joinType: 'afe' },
  { table: 'DM_BHA_OP', fields: ['md_op', 'tvd'] },
  { table: 'DM_BHA_RUN', fields: ['md_in', 'md_out'] },
  { table: 'DM_BIT_OP', fields: ['md_base', 'md_op', 'md_top'] },
  { table: 'DM_CASING', fields: ['md_tag'] },
  { table: 'DM_CENTRIFUGE_OP', fields: ['md_op'] },
  { table: 'DM_CORE', fields: ['interval_base', 'interval_top'] },
  { table: 'DM_CORE_TIME', fields: ['depth'] },
  { table: 'DM_DAILY', fields: ['fill_depth', 'formation_top', 'liner_top', 'md_current', 'md_fill', 'mud_loss_md_base', 'mud_loss_md_top', 'packer_depth', 'plugback_md', 'plugback_tvd', 'tubing_depth', 'tvd_current'] },
  { table: 'DM_DAILY_FLARING', fields: ['md_base', 'md_top'] },
  { table: 'DM_DAILY_UBD', fields: ['md_base', 'md_top'] },
  { table: 'DM_ESP', fields: ['install_csg_md', 'install_liner_md', 'liner_top_md', 'pump_set_depth'] },
  { table: 'DM_EVENT', fields: ['tvd_current', 'tvd_plugback'] },
  { table: 'DM_FLUID_LOSS', fields: ['mud_lost_depth_from', 'mud_lost_depth_to'] },
  { table: 'DM_GAS_LIFT', fields: ['packer_md', 'perf_md_base', 'perf_md_top'] },
  { table: 'DM_GEOLOGY_DAILY', fields: ['md', 'tvd'] },
  { table: 'DM_HYDROCLONE_OP', fields: ['md_op'] },
  { table: 'DM_INTERVAL', fields: ['interval_base', 'interval_top', 'tvd_base', 'tvd_top'] },
  { table: 'DM_KICK', fields: ['bit_md', 'casing_shoe_md', 'casing_shoe_tvd', 'md', 'tvd'] },
  { table: 'DM_LOG', fields: ['current_log_plugback'] },
  { table: 'DM_LOG_FORM_TEST', fields: ['md', 'tvd'] },
  { table: 'DM_LOG_INTERVAL', fields: ['md_base', 'md_top'] },
  { table: 'DM_LOG_SERVICE', fields: ['md_base', 'md_top'] },
  { table: 'DM_OPER_EQUIP_FAIL', fields: ['failure_depth'] },
  { table: 'DM_PIPE_DATA', fields: ['md_top'] },
  { table: 'DM_PIPE_RUN', fields: ['set_length_estimate'] },
  { table: 'DM_PROD_EQUIP_FAIL', fields: ['failure_md', 'failure_md_base', 'tagged_md', 'tagged_pbtd'] },
  { table: 'DM_PUMP_OP', fields: ['md_op'] },
  { table: 'DM_SHAKER_OP', fields: ['md_op'] },
  { table: 'DM_STIM_STAGE', fields: ['ctu_depth', 'packer_depth', 'stage_interval_base', 'stage_interval_top', 'tubing_depth'] },
  { table: 'DM_STIM_TREATMENT', fields: ['bridge_plug_depth', 'interval_base', 'interval_top', 'packer_depth', 'string_depth', 'tvd_base', 'tvd_top'] },
  { table: 'DM_WB_OBSTRUCTION_CONTENT', fields: ['md_base', 'md_top'] },
  { table: 'DM_WB_OBSTRUCTION_STATUS', fields: ['md_base', 'md_top', 'md_top_fill'] },
  { table: 'DM_WELL_PLAN_CEMENT', fields: ['md_toc'] },
  { table: 'DM_WELL_PLAN_CORING', fields: ['md_start'] },
  { table: 'DM_WELL_PLAN_HOLE_SECT', fields: ['md_base', 'md_top', 'tvd_base', 'tvd_top'] },
  { table: 'DM_WELL_PLAN_LOGGING', fields: ['md_from', 'md_to'] },
  { table: 'DM_WELL_PLAN_MUD', fields: ['md_from', 'md_to', 'tvd_from', 'tvd_to'] },
  { table: 'DM_WELL_PLAN_OP', fields: ['md_from', 'md_to'] },
  { table: 'DM_WELLBORE_INTEG', fields: ['lot_md', 'lot_tvd', 'md_water'] },
  { table: 'DM_WELLBORE_OBSTRUCTION', fields: ['wellbore_base_md', 'wellbore_top_md'] },
  { table: 'DP_ANNOTATION', fields: ['prognosed_md', 'prognosed_tvd'] },
  { table: 'DP_WALK', fields: ['start_tvd'] },
  { table: 'EDMOCV_PARENT_WELLBORE', fields: ['sub_salt_base_tvd', 'sub_salt_top_tvd'] },
  { table: 'EDMOCV_TIEON_WELLBORE', fields: ['sub_salt_base_tvd', 'sub_salt_top_tvd'] },
  { table: 'EDMOCV_WELLBORE_FORMATION', fields: ['prognosed_tvd_end'] },
  { table: 'KA_RESULTS', fields: ['md_from', 'md_to'] },
  { table: 'PR_VISUAL_TRAJECTORY', fields: ['bh_md', 'ko_md', 'top_md'] },
  { table: 'CD_COMP_SPEC_FEATURE', fields: ['md_base', 'md_top'] },
  { table: 'CD_COMPLETION_FLUID', fields: ['md_base', 'md_top', 'tvd_bottom', 'tvd_top'] },
  { table: 'CD_COMPLETION_RETRIEVABLE', fields: ['md_set'] },
  { table: 'CD_COMPLETION_TREATMENT', fields: ['injection_md'] },
  { table: 'CD_DEPTH_INTERVAL_HISTORY', fields: ['md_base', 'md_top'] },
  { table: 'CD_FORMATION_PICK', fields: ['md_base', 'md_top', 'tvd_base', 'tvd_top'] },
  { table: 'CD_HOLE_SECT_STATUS', fields: ['md_base', 'md_top'] },
  { table: 'CD_PRESSURE_SURVEY', fields: ['bottom_gauge_md', 'end_fluid_level_md', 'gauges_midpoint_md', 'interval_base_md', 'interval_base_tvd', 'interval_top_md', 'interval_top_tvd', 'packer_set_md', 'packer_set_tvd', 'run_md', 'start_fluid_level_md', 'top_gauge_md', 'whipstock_tvd'] },
  { table: 'CD_ROD_GUIDE', fields: ['md_base', 'md_top'] },
  { table: 'CD_TEST_BEAM', fields: ['fluid_level'] },
  { table: 'CD_WELLBORE_MARKER', fields: ['drl_md_base', 'drl_md_top', 'wrl_md_base', 'wrl_md_top'] },
  { table: 'CD_WELLBORE_ZONE_PROP', fields: ['md_pore_pressure', 'tvd_pore_pressure'] },
  { table: 'CD_WEQP_GAS_LIFT_VALVE', fields: ['md_valve', 'tvd_valve'] },
  { table: 'CD_WEQP_PROGRESSIVE_CAVITY', fields: ['md_tag_bar'] },
  { table: 'DM_ASSEMBLY_COMP_OP', fields: ['md_base', 'md_top'] },
  { table: 'DM_CEMENT_INTERMEDIATE_CIRC', fields: ['md'] },
  { table: 'DM_CHROMATOGRAPHY', fields: ['interval_base', 'interval_top'] },
  { table: 'DM_CR_CONSTRUCTION', fields: ['top_gravel_md', 'water_table_md'] },
  { table: 'DM_CR_WATER_WELL', fields: ['casing_depth'] },
  { table: 'DM_CR_WATER_WELL_ABANDON', fields: ['plug_md_base', 'plug_md_top'] },
  { table: 'DM_DAILY_COMPLETION', fields: ['md_base', 'md_top'] },
  { table: 'DM_DAILY_DITCH_MAGNET', fields: ['md'] },
  { table: 'DM_DEGASSER_OP', fields: ['md_op'] },
  { table: 'DM_DST', fields: ['gauge_stop_md', 'md_base', 'md_top', 'tvd_interval_base', 'tvd_interval_top'] },
  { table: 'DM_DST_RECORDER', fields: ['gauge_md', 'gauge_tvd'] },
  { table: 'DM_ESP_CABLE_INSPECTION_DET', fields: ['inspection_detail_depth'] },
  { table: 'DM_ESP_DESIGN', fields: ['casing_shoe_md', 'casing_shoe_tvd', 'current_dyn_fluid_level', 'design_md', 'future_dynamic_fluid_level', 'inflow_reference_md', 'max_dogleg_md', 'midpoint_prod_depth', 'pump_md', 'pump_tvd', 'tubing_base_md', 'tubing_base_tvd'] },
  { table: 'DM_ESP_DETAILS', fields: ['kop', 'proposed_depth'] },
  { table: 'DM_FAILURE_CLEANOUT', fields: ['base_perforation', 'md_fill_tagged', 'md_final'] },
  { table: 'DM_FAILURE_CONV_PUMP', fields: ['md_base', 'md_top'] },
  { table: 'DM_FAILURE_ESP', fields: ['md_base', 'md_top'] },
  { table: 'DM_FAILURE_ROD', fields: ['top_md'] },
  { table: 'DM_FAILURE_ROD_BREAK', fields: ['md_break'] },
  { table: 'DM_FAILURE_TUBING_LEAK', fields: ['md_leak'] },
  { table: 'DM_FAILURE_TUBING_STRING', fields: ['top_md'] },
  { table: 'DM_FISHING_FREE_POINT', fields: ['free_point_md'] },
  { table: 'DM_FISHING_STRING_SHOT', fields: ['string_shot_md'] },
  { table: 'DM_GAS_PEAK', fields: ['gas_depth', 'md_base', 'md_top'] },
  { table: 'DM_GRAVEL_PACK', fields: ['casing_shoe_md', 'formation_frac_pressure_tvd', 'formation_pore_pressure_tvd', 'gravel_pack_interval_base_md', 'gravel_pack_interval_top_md', 'md_top_of_sand', 'open_hole_td_md', 'open_hole_td_tvd'] },
  { table: 'DM_GRAVEL_PACK_PERF_INTERVAL', fields: ['perf_interval_end_md', 'perf_interval_start_md'] },
  { table: 'DM_GRAVEL_PACK_SAND', fields: ['md_top_of_sand'] },
  { table: 'DM_GRAVEL_PACK_WASHOUT', fields: ['md_base', 'md_top'] },
  { table: 'DM_HOTNOTE', fields: ['md_base', 'md_top'] },
  { table: 'DM_INTERMEDIATE_CIRC', fields: ['md'] },
  { table: 'DM_ISOLATED_INTERVAL', fields: ['md_base', 'md_top'] },
  { table: 'DM_KO_WINDOW', fields: ['md_ko_base', 'md_ko_top'] },
  { table: 'DM_LOG_CASING_COLLAR', fields: ['casing_collar_depth'] },
  { table: 'DM_LOG_DESC', fields: ['md_base', 'md_top'] },
  { table: 'DM_LOG_INTERVAL_HUD', fields: ['holdup_md'] },
  { table: 'DM_MUDGAS', fields: ['interval_base', 'interval_top'] },
  { table: 'DM_PCP', fields: ['land_md', 'land_tvd', 'perf_int_base_md', 'perf_int_base_tvd', 'perf_int_top_md', 'perf_int_top_tvd', 'pump_tdh', 'pump_tsh', 'tag_bar_md'] },
  { table: 'DM_PLUNGER_ACC', fields: ['user_depth1', 'user_depth2'] },
  { table: 'DM_PLUNGER_LIFT', fields: ['collar_stop_depth', 'end_of_tubing', 'seat_nipple_depth', 'stage_tool_depth', 'user_depth1', 'user_depth2'] },
  { table: 'DM_PLUNGER_LIFT_STAGE_SYSTEM', fields: ['user_depth1', 'user_depth2'] },
  { table: 'DM_RUSHMORE_DPR', fields: ['ko_depth', 'tvd_to_base_of_salt', 'tvd_to_top_of_salt', 'wellbore_md', 'wellbore_tvd'] },
  { table: 'DM_SLICKLINE', fields: ['pbtd', 'seat_nipple_md', 'td'] },
  { table: 'DM_SLICKLINE_DAILY', fields: ['md_tagged_fill_end', 'md_tagged_fill_start', 'md_tool_pulled'] },
  { table: 'DM_SLICKLINE_SOLID', fields: ['md_speculated_solid'] },
  { table: 'DM_SOLID_DETAIL', fields: ['speculated_sample_depth'] },
  { table: 'DM_STIM_PUMPING_DIAG', fields: ['bottom_hole_md', 'mid_perforations_md', 'mid_perforations_tvd', 'surface_md'] },
  { table: 'DM_STIM_RES_INTERVAL', fields: ['lith_bottom_md', 'lith_top_md', 'net_pay_bottom_md', 'net_pay_top_md'] },
  { table: 'DM_VENT_FLOW_TEST', fields: ['tvd_aquifer', 'tvd_cement_top', 'tvd_flow_source'] },
  { table: 'DM_WEATHER_CURRENT', fields: ['current_depth'] },
  { table: 'DM_WELL_PLAN_TEST', fields: ['interval_base_md', 'interval_top_md'] },
  { table: 'DM_WELLBORE_ZONE_ACTIVITY', fields: ['md_base', 'md_top'] },
  { table: 'DM_WORK_DETAIL', fields: ['md_base', 'md_top'] },
  { table: 'DP_DEF_SURVEY_ANNOTATION', fields: ['prognosed_md', 'prognosed_tvd'] },
  { table: 'DP_SURVEY_STN_SENT_ALERTS', fields: ['md'] },
  { table: 'DP_TCOLOR', fields: ['depth_to'] },
  { table: 'RT_LOG_HEADER', fields: ['end_depth', 'start_depth'] },
];

export interface UpdateStatement {
  sql: string;
  label: string;
}

export function getWellUpdateQueries(wellId: string, ftToAdd: number, updateAllDatums: boolean): UpdateStatement[] {
  const statements: UpdateStatement[] = [];

  // CD_WELL: water_depth and wellhead_depth use addition
  statements.push({
    sql: `UPDATE CD_WELL SET water_depth = water_depth + ${ftToAdd} WHERE well_id = '${wellId}'`,
    label: 'CD_WELL (water_depth)'
  });
  statements.push({
    sql: `UPDATE CD_WELL SET wellhead_depth = wellhead_depth + ${ftToAdd} WHERE well_id = '${wellId}'`,
    label: 'CD_WELL (wellhead_depth)'
  });
  statements.push({
    sql: `UPDATE CD_WELL SET remarks = remarks || chr(13) || chr(10) || 'SHL and GE have been verifed by Geomatics ' || sysdate WHERE well_id = '${wellId}'`,
    label: 'CD_WELL (remarks)'
  });

  // CD_DATUM: datum_elevation uses addition; is_default filter depends on updateAllDatums
  if (updateAllDatums) {
    statements.push({
      sql: `UPDATE CD_DATUM SET datum_elevation = datum_elevation + ${ftToAdd} WHERE well_id = '${wellId}'`,
      label: 'CD_DATUM (all datums)'
    });
  } else {
    statements.push({
      sql: `UPDATE CD_DATUM SET datum_elevation = datum_elevation + ${ftToAdd} WHERE is_default = 'Y' AND well_id = '${wellId}'`,
      label: 'CD_DATUM (default datum)'
    });
  }

  // All other tables: fields use subtraction
  for (const cfg of updateConfigs) {
    const setClause = cfg.fields.map(f => `${f} = ${f} - ${ftToAdd}`).join(', ');
    const notNullCondition = cfg.fields.map(f => `${f} IS NOT NULL`).join(' OR ');

    let sql: string;
    switch (cfg.joinType) {
      case 'polyline':
        sql = `UPDATE CD_POLYLINE_POINT SET z = z - ${ftToAdd} WHERE z IS NOT NULL AND header_id IN (SELECT header_id FROM cd_polyline_header WHERE attachment_locator LIKE '%well_id=(${wellId})%')`;
        break;
      case 'afe':
        sql = `UPDATE DM_AFE a SET ${cfg.fields.map(f => `a.${f} = a.${f} - ${ftToAdd}`).join(', ')} WHERE (${cfg.fields.map(f => `a.${f} IS NOT NULL`).join(' OR ')}) AND a.afe_id IN (SELECT l.afe_id FROM dm_afe_event_link l WHERE l.well_id = '${wellId}')`;
        break;
      default:
        sql = `UPDATE ${cfg.table} SET ${setClause} WHERE well_id = '${wellId}' AND (${notNullCondition})`;
        break;
    }

    statements.push({ sql, label: cfg.table });
  }

  return statements;
}
