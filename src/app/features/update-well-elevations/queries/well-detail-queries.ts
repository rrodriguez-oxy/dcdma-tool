interface TableDetailConfig {
  table: string;
  fields: string[];
  joinType?: 'none' | 'polyline' | 'afe';
  noKb?: boolean;
  extraWhere?: string;
}

const tableConfigs: TableDetailConfig[] = [
  { table: 'CD_WELL', fields: ['Water_Depth', 'Wellhead_Depth'], joinType: 'none', noKb: true },
  { table: 'CD_DATUM', fields: ['Datum_Elevation'], joinType: 'none', noKb: true, extraWhere: "t.is_default = 'Y'" },
  { table: 'CD_ASSEMBLY', fields: ['Md_Assembly_Base'] },
  { table: 'CD_CASE_TEMP_GRADIENT', fields: ['Md', 'Tvd'] },
  { table: 'CD_CEMENT_FLUID', fields: ['Slurry_Base_Tvd', 'Slurry_Top_Tvd'] },
  { table: 'CD_CEMENT_FLUID_SCHEDULE', fields: ['Md_Base', 'Md_Top', 'Top_Of_Fluid', 'Top_Of_Fluid_Tvd'] },
  { table: 'CD_CEMENT_JOB', fields: ['Md_Float', 'Packer_Md', 'Packer_Tvd', 'Plug_Md_Base', 'Plug_Md_Top', 'Plug_Tvd_Base', 'Plug_Tvd_Top', 'Shoetrack_Drill_Md', 'Shoetrack_Drill_Tvd', 'Shoetrack_Top_Md', 'Shoetrack_Top_Tvd', 'Squeeze_Depth', 'Squeeze_Tvd', 'Test_Section_Md_Base', 'Test_Section_Md_Top', 'Test_Section_Tvd_Base', 'Test_Section_Tvd_Top', 'Toc_Md', 'Toc_Tvd', 'Tvd_Float'] },
  { table: 'CD_CEMENT_PLUG_STATUS', fields: ['Md_Base', 'Md_Top', 'Tvd_Base', 'Tvd_Top'] },
  { table: 'CD_CEMENT_STAGE', fields: ['Md_Base', 'Md_Cement_Tool', 'Md_Ctu', 'Md_Plug_Circ', 'Md_Stage_Tool', 'Md_Top', 'Squeeze_Tool_Md', 'Squeeze_Tool_Tvd', 'Squeeze_Workstring_Depth', 'Squeeze_Workstring_Tvd', 'Tvd_Base', 'Tvd_Cement_Tool', 'Tvd_Ctu', 'Tvd_Plug_Circ', 'Tvd_Stage_Tool', 'Tvd_Top'] },
  { table: 'CD_COMPLETION', fields: ['Bottom_Md', 'Bottom_Tvd', 'Mpp', 'Top_Md', 'Top_Tvd'] },
  { table: 'CD_DEFINITIVE_SURVEY_HEADER', fields: ['Acscan_Md_Max', 'Acscan_Md_Min', 'Bh_Md', 'Bh_Tvd', 'Ko_Md', 'Ko_Tvd', 'Maximum_Dls_Depth'] },
  { table: 'CD_DEFINITIVE_SURVEY_STATION', fields: ['Md', 'Tvd'] },
  { table: 'CD_EXTERNAL_COMP_ACC', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_EXTERNAL_COMP_UMB', fields: ['Cut_Md'] },
  { table: 'CD_FLUID', fields: ['Md_Mud_Sample', 'Tvd_Mud_Sample', 'Tvd_Oil_Cuttings'] },
  { table: 'CD_FRAC_GRADIENT', fields: ['Tvd'] },
  { table: 'CD_HOLE_SECT', fields: ['Md_Shoe'] },
  { table: 'CD_HOLE_SECT_GROUP', fields: ['Md_Casing_Bottom', 'Md_Casing_Top', 'Md_Hole_Sect_Base', 'Md_Hole_Sect_Top', 'Next_Casing_Set_Md', 'Next_Casing_Set_Tvd', 'Plan_Md', 'Plan_Tvd', 'Tvd_Casing_Bottom', 'Tvd_Hole_Sect_Base', 'Tvd_Hole_Sect_Top'] },
  { table: 'CD_LESSON', fields: ['Wellbore_Md', 'Wellbore_Tvd'] },
  { table: 'CD_NBK_LEAK_OFF_TEST', fields: ['Tvd'] },
  { table: 'CD_NBK_STRING_ANALYSIS', fields: ['Drill_Block_From', 'Drill_Block_To', 'Lag_End_Position', 'Lag_Start_Position', 'Md', 'Pill_Bottom', 'Volhgt_End_Position', 'Volhgt_Start_Position'] },
  { table: 'CD_OPENING_STATUS', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_PERF_INTERVAL', fields: ['Md_Bottom_Shot', 'Md_Ref_Casing_Collar', 'Md_Top_Shot'] },
  { table: 'CD_PERFORATE', fields: ['Formation_Depth', 'Md_Bottom_Shot', 'Md_Top_Shot', 'Tvd_Fluid_Top', 'Tvd_Reservoir'] },
  { table: 'CD_POLYLINE_POINT', fields: ['Z'], joinType: 'polyline' },
  { table: 'CD_PORE_PRESSURE', fields: ['Tvd'] },
  { table: 'CD_SURVEY_HEADER', fields: ['Maximum_Dls_Depth', 'Md_Max', 'Md_Min', 'Tie_On_Depth'] },
  { table: 'CD_SURVEY_PROGRAM', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_SURVEY_STATION', fields: ['Md', 'Tvd'] },
  { table: 'CD_TEMP_GRADIENT', fields: ['Tvd'] },
  { table: 'CD_TEST', fields: ['Avg_Reservoir_Pressure_Tvd', 'Interval_Base_Md', 'Interval_Base_Tvd', 'Interval_Top_Md', 'Interval_Top_Tvd', 'Mpp', 'Packer_Tmd', 'Pump_Md', 'Tubing_Set_Md'] },
  { table: 'CD_VERTICAL_SECTION', fields: ['Md_Start', 'Tvd_Start'] },
  { table: 'CD_WELLBORE', fields: ['Authorized_Md', 'Authorized_Tvd', 'Bh_Md', 'Bh_Tvd', 'Budgeted_Md', 'Budgeted_Tvd', 'Ko_Md', 'Ko_Tvd', 'Plugback_Md', 'Plugback_Tvd', 'Sub_Salt_Base_Tvd', 'Sub_Salt_Top_Tvd'] },
  { table: 'CD_WELLBORE_FORMATION', fields: ['Prognosed_Base_Md', 'Prognosed_Base_Tvd', 'Prognosed_Md', 'Prognosed_Tvd', 'Prognosed_Tvd_End'] },
  { table: 'CD_WELLBORE_INTEREST', fields: ['Md_From', 'Md_To'] },
  { table: 'CD_WELLBORE_OPENING', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_WELLBORE_STATUS', fields: ['Md_Current', 'Md_Max_Hole_Angle', 'Md_Plugback', 'Tvd_Current', 'Tvd_Plugback'] },
  { table: 'CD_WELLBORE_ZONE', fields: ['Md_Base', 'Md_Top', 'Pay_Base', 'Pay_Top', 'Tvd_Base', 'Tvd_Top'] },
  { table: 'CD_WEQP_GAS_LIFT_MANDREL', fields: ['Tvd', 'Tvd_Subsea'] },
  { table: 'CD_WEQP_GRAVEL_PACK_SCREEN', fields: ['Perf_Shroud_Base_Md', 'Perf_Shroud_Top_Md'] },
  { table: 'CD_WEQP_PACKER', fields: ['Expansion_Joint_Depth', 'Packer_Base', 'Packer_Depth', 'Plug_Depth', 'Seal_Assembly_Center'] },
  { table: 'DM_ACTIVITY', fields: ['Md_From', 'Md_To'] },
  { table: 'DM_ACTIVITY_DETAIL', fields: ['Md_From', 'Md_To'] },
  { table: 'DM_AFE', fields: ['Authorized_Md', 'Authorized_Tvd'], joinType: 'afe' },
  { table: 'DM_BHA_OP', fields: ['Md_Op', 'Tvd'] },
  { table: 'DM_BHA_RUN', fields: ['Md_In', 'Md_Out'] },
  { table: 'DM_BIT_OP', fields: ['Md_Base', 'Md_Op', 'Md_Top'] },
  { table: 'DM_CASING', fields: ['Md_Tag'] },
  { table: 'DM_CENTRIFUGE_OP', fields: ['Md_Op'] },
  { table: 'DM_CORE', fields: ['Interval_Base', 'Interval_Top'] },
  { table: 'DM_CORE_TIME', fields: ['Depth'] },
  { table: 'DM_DAILY', fields: ['Fill_Depth', 'Formation_Top', 'Liner_Top', 'Md_Current', 'Md_Fill', 'Mud_Loss_Md_Base', 'Mud_Loss_Md_Top', 'Packer_Depth', 'Plugback_Md', 'Plugback_Tvd', 'Tubing_Depth', 'Tvd_Current'] },
  { table: 'DM_DAILY_FLARING', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_DAILY_UBD', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_ESP', fields: ['Install_Csg_Md', 'Install_Liner_Md', 'Liner_Top_Md', 'Pump_Set_Depth'] },
  { table: 'DM_EVENT', fields: ['Tvd_Current', 'Tvd_Plugback'] },
  { table: 'DM_FLUID_LOSS', fields: ['Mud_Lost_Depth_From', 'Mud_Lost_Depth_To'] },
  { table: 'DM_GAS_LIFT', fields: ['Perf_Md_Base', 'Perf_Md_Top'] },
  { table: 'DM_GEOLOGY_DAILY', fields: ['Md', 'Tvd'] },
  { table: 'DM_HYDROCLONE_OP', fields: ['Md_Op'] },
  { table: 'DM_INTERVAL', fields: ['Interval_Base', 'Interval_Top', 'Tvd_Base', 'Tvd_Top'] },
  { table: 'DM_KICK', fields: ['Bit_Md', 'Casing_Shoe_Md', 'Casing_Shoe_Tvd', 'Md', 'Tvd'] },
  { table: 'DM_LOG', fields: ['Current_Log_Plugback'] },
  { table: 'DM_LOG_FORM_TEST', fields: ['Md', 'Tvd'] },
  { table: 'DM_LOG_INTERVAL', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_LOG_SERVICE', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_OPER_EQUIP_FAIL', fields: ['Failure_Depth'] },
  { table: 'DM_PIPE_DATA', fields: ['Md_Top'] },
  { table: 'DM_PIPE_RUN', fields: ['Set_Length_Estimate'] },
  { table: 'DM_PROD_EQUIP_FAIL', fields: ['Failure_Md', 'Failure_Md_Base', 'Tagged_Md', 'Tagged_Pbtd'] },
  { table: 'DM_PUMP_OP', fields: ['Md_Op'] },
  { table: 'DM_SHAKER_OP', fields: ['Md_Op'] },
  { table: 'DM_STIM_STAGE', fields: ['Ctu_Depth', 'Packer_Depth', 'Stage_Interval_Base', 'Stage_Interval_Top', 'Tubing_Depth'] },
  { table: 'DM_STIM_TREATMENT', fields: ['Bridge_Plug_Depth', 'Interval_Base', 'Interval_Top', 'Packer_Depth', 'String_Depth', 'Tvd_Base', 'Tvd_Top'] },
  { table: 'DM_WB_OBSTRUCTION_CONTENT', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_WB_OBSTRUCTION_STATUS', fields: ['Md_Base', 'Md_Top_Fill', 'Md_Top'] },
  { table: 'DM_WELL_PLAN_CEMENT', fields: ['Md_Toc'] },
  { table: 'DM_WELL_PLAN_CORING', fields: ['Md_Start'] },
  { table: 'DM_WELL_PLAN_HOLE_SECT', fields: ['Md_Base', 'Md_Top', 'Tvd_Base', 'Tvd_Top'] },
  { table: 'DM_WELL_PLAN_LOGGING', fields: ['Md_From', 'Md_To'] },
  { table: 'DM_WELL_PLAN_MUD', fields: ['Md_From', 'Md_To', 'Tvd_From', 'Tvd_To'] },
  { table: 'DM_WELL_PLAN_OP', fields: ['Md_From', 'Md_To'] },
  { table: 'DM_WELLBORE_INTEG', fields: ['Lot_Md', 'Lot_Tvd', 'Md_Water'] },
  { table: 'DM_WELLBORE_OBSTRUCTION', fields: ['Wellbore_Base_Md', 'Wellbore_Top_Md'] },
  { table: 'DP_ANNOTATION', fields: ['Prognosed_Md', 'Prognosed_Tvd'] },
  { table: 'DP_WALK', fields: ['Start_Tvd'] },
  { table: 'EDMOCV_PARENT_WELLBORE', fields: ['Sub_Salt_Base_Tvd', 'Sub_Salt_Top_Tvd'] },
  { table: 'EDMOCV_TIEON_WELLBORE', fields: ['Sub_Salt_Base_Tvd', 'Sub_Salt_Top_Tvd'] },
  { table: 'EDMOCV_WELLBORE_FORMATION', fields: ['Prognosed_Tvd_End'] },
  { table: 'KA_RESULTS', fields: ['Md_From', 'Md_To'] },
  { table: 'PR_VISUAL_TRAJECTORY', fields: ['Bh_Md', 'Ko_Md', 'Top_Md'] },
  { table: 'CD_COMP_SPEC_FEATURE', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_COMPLETION_FLUID', fields: ['Md_Base', 'Md_Top', 'Tvd_Bottom', 'Tvd_Top'] },
  { table: 'CD_COMPLETION_RETRIEVABLE', fields: ['Md_Set'] },
  { table: 'CD_COMPLETION_TREATMENT', fields: ['Injection_Md'] },
  { table: 'CD_DEPTH_INTERVAL_HISTORY', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_FORMATION_PICK', fields: ['Md_Base', 'Md_Top', 'Tvd_Base', 'Tvd_Top'] },
  { table: 'CD_HOLE_SECT_STATUS', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_PRESSURE_SURVEY', fields: ['Bottom_Gauge_Md', 'End_Fluid_Level_Md', 'Gauges_Midpoint_Md', 'Interval_Base_Md', 'Interval_Base_Tvd', 'Interval_Top_Md', 'Interval_Top_Tvd', 'Packer_Set_Md', 'Packer_Set_Tvd', 'Run_Md', 'Start_Fluid_Level_Md', 'Top_Gauge_Md', 'Whipstock_Tvd'] },
  { table: 'CD_ROD_GUIDE', fields: ['Md_Base', 'Md_Top'] },
  { table: 'CD_TEST_BEAM', fields: ['Fluid_Level'] },
  { table: 'CD_WELLBORE_MARKER', fields: ['Drl_Md_Base', 'Drl_Md_Top', 'Wrl_Md_Base', 'Wrl_Md_Top'] },
  { table: 'CD_WELLBORE_ZONE_PROP', fields: ['Md_Pore_Pressure', 'Tvd_Pore_Pressure'] },
  { table: 'CD_WEQP_GAS_LIFT_VALVE', fields: ['Md_Valve', 'Tvd_Valve'] },
  { table: 'CD_WEQP_PROGRESSIVE_CAVITY', fields: ['Md_Tag_Bar'] },
  { table: 'DM_ASSEMBLY_COMP_OP', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_CEMENT_INTERMEDIATE_CIRC', fields: ['Md'] },
  { table: 'DM_CHROMATOGRAPHY', fields: ['Interval_Base', 'Interval_Top'] },
  { table: 'DM_CR_CONSTRUCTION', fields: ['Top_Gravel_Md', 'Water_Table_Md'] },
  { table: 'DM_CR_WATER_WELL', fields: ['Casing_Depth'] },
  { table: 'DM_CR_WATER_WELL_ABANDON', fields: ['Plug_Md_Base', 'Plug_Md_Top'] },
  { table: 'DM_DAILY_COMPLETION', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_DAILY_DITCH_MAGNET', fields: ['Md'] },
  { table: 'DM_DEGASSER_OP', fields: ['Md_Op'] },
  { table: 'DM_DST', fields: ['Gauge_Stop_Md', 'Md_Base', 'Md_Top', 'Tvd_Interval_Base', 'Tvd_Interval_Top'] },
  { table: 'DM_DST_RECORDER', fields: ['Gauge_Md', 'Gauge_Tvd'] },
  { table: 'DM_ESP_CABLE_INSPECTION_DET', fields: ['Inspection_Detail_Depth'] },
  { table: 'DM_ESP_DESIGN', fields: ['Casing_Shoe_Md', 'Casing_Shoe_Tvd', 'Current_Dyn_Fluid_Level', 'Design_Md', 'Future_Dynamic_Fluid_Level', 'Inflow_Reference_Md', 'Max_Dogleg_Md', 'Midpoint_Prod_Depth', 'Pump_Md', 'Pump_Tvd', 'Tubing_Base_Md', 'Tubing_Base_Tvd'] },
  { table: 'DM_ESP_DETAILS', fields: ['Kop', 'Proposed_Depth'] },
  { table: 'DM_FAILURE_CLEANOUT', fields: ['Base_Perforation', 'Md_Fill_Tagged', 'Md_Final'] },
  { table: 'DM_FAILURE_CONV_PUMP', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_FAILURE_ESP', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_FAILURE_ROD', fields: ['Top_Md'] },
  { table: 'DM_FAILURE_ROD_BREAK', fields: ['Md_Break'] },
  { table: 'DM_FAILURE_TUBING_LEAK', fields: ['Md_Leak'] },
  { table: 'DM_FAILURE_TUBING_STRING', fields: ['Top_Md'] },
  { table: 'DM_FISHING_FREE_POINT', fields: ['Free_Point_Md'] },
  { table: 'DM_FISHING_STRING_SHOT', fields: ['String_Shot_Md'] },
  { table: 'DM_GAS_PEAK', fields: ['Gas_Depth', 'Md_Base', 'Md_Top'] },
  { table: 'DM_GRAVEL_PACK', fields: ['Casing_Shoe_Md', 'Formation_Frac_Pressure_Tvd', 'Formation_Pore_Pressure_Tvd', 'Gravel_Pack_Interval_Base_Md', 'Gravel_Pack_Interval_Top_Md', 'Md_Top_Of_Sand', 'Open_Hole_Td_Md', 'Open_Hole_Td_Tvd'] },
  { table: 'DM_GRAVEL_PACK_PERF_INTERVAL', fields: ['Perf_Interval_End_Md', 'Perf_Interval_Start_Md'] },
  { table: 'DM_GRAVEL_PACK_SAND', fields: ['Md_Top_Of_Sand'] },
  { table: 'DM_GRAVEL_PACK_WASHOUT', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_HOTNOTE', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_INTERMEDIATE_CIRC', fields: ['Md'] },
  { table: 'DM_ISOLATED_INTERVAL', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_KO_WINDOW', fields: ['Md_Ko_Base', 'Md_Ko_Top'] },
  { table: 'DM_LOG_CASING_COLLAR', fields: ['Casing_Collar_Depth'] },
  { table: 'DM_LOG_DESC', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_LOG_INTERVAL_HUD', fields: ['Holdup_Md'] },
  { table: 'DM_MUDGAS', fields: ['Interval_Base', 'Interval_Top'] },
  { table: 'DM_PCP', fields: ['Land_Md', 'Land_Tvd', 'Perf_Int_Base_Md', 'Perf_Int_Base_Tvd', 'Perf_Int_Top_Md', 'Perf_Int_Top_Tvd', 'Pump_Tdh', 'Pump_Tsh', 'Tag_Bar_Md'] },
  { table: 'DM_PLUNGER_ACC', fields: ['User_Depth1', 'User_Depth2'] },
  { table: 'DM_PLUNGER_LIFT', fields: ['Collar_Stop_Depth', 'End_Of_Tubing', 'Seat_Nipple_Depth', 'Stage_Tool_Depth', 'User_Depth1', 'User_Depth2'] },
  { table: 'DM_PLUNGER_LIFT_STAGE_SYSTEM', fields: ['User_Depth1', 'User_Depth2'] },
  { table: 'DM_RUSHMORE_DPR', fields: ['Ko_Depth', 'Tvd_To_Base_Of_Salt', 'Tvd_To_Top_Of_Salt', 'Wellbore_Md', 'Wellbore_Tvd'] },
  { table: 'DM_SLICKLINE', fields: ['Pbtd', 'Seat_Nipple_Md', 'Td'] },
  { table: 'DM_SLICKLINE_DAILY', fields: ['Md_Tagged_Fill_End', 'Md_Tagged_Fill_Start', 'Md_Tool_Pulled'] },
  { table: 'DM_SLICKLINE_SOLID', fields: ['Md_Speculated_Solid'] },
  { table: 'DM_SOLID_DETAIL', fields: ['Speculated_Sample_Depth'] },
  { table: 'DM_STIM_PUMPING_DIAG', fields: ['Bottom_Hole_Md', 'Mid_Perforations_Md', 'Mid_Perforations_Tvd', 'Surface_Md'] },
  { table: 'DM_STIM_RES_INTERVAL', fields: ['Lith_Bottom_Md', 'Lith_Top_Md', 'Net_Pay_Bottom_Md', 'Net_Pay_Top_Md'] },
  { table: 'DM_VENT_FLOW_TEST', fields: ['Tvd_Aquifer', 'Tvd_Flow_Source', 'Tvd_Cement_Top'] },
  { table: 'DM_WEATHER_CURRENT', fields: ['Current_Depth'] },
  { table: 'DM_WELL_PLAN_TEST', fields: ['Interval_Base_Md', 'Interval_Top_Md'] },
  { table: 'DM_WELLBORE_ZONE_ACTIVITY', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DM_WORK_DETAIL', fields: ['Md_Base', 'Md_Top'] },
  { table: 'DP_DEF_SURVEY_ANNOTATION', fields: ['Prognosed_Md', 'Prognosed_Tvd'] },
  { table: 'DP_SURVEY_STN_SENT_ALERTS', fields: ['Md'] },
  { table: 'DP_TCOLOR', fields: ['Depth_To'] },
  { table: 'RT_LOG_HEADER', fields: ['End_Depth', 'Start_Depth'] },
];

const configMap = new Map<string, TableDetailConfig>();
for (const cfg of tableConfigs) {
  configMap.set(cfg.table.toUpperCase(), cfg);
}

export function getTableDetailQuery(tableName: string, wellId: string, options?: { skipExtraWhere?: boolean }): string | null {
  const key = tableName.toUpperCase().replace(/ /g, '_');
  const cfg = configMap.get(key);
  if (!cfg) {
    return null;
  }

  const fieldSelects = cfg.fields.map(f => {
    if (cfg.noKb) {
      return `t.${f} "${f}"`;
    }
    return `t.${f} "${f}", t.${f} + d.datum_elevation "${f}_KB"`;
  }).join(', ');

  let fromClause: string;
  let whereClause: string;
  let wellIdSelect: string;

  switch (cfg.joinType) {
    case 'none':
      fromClause = `${cfg.table} T`;
      whereClause = `t.well_id = '${wellId}'`;
      wellIdSelect = 't.well_id';
      break;
    case 'polyline':
      fromClause = `CD_POLYLINE_POINT T, CD_POLYLINE_HEADER L, CD_DATUM D`;
      whereClause = `l.attachment_locator LIKE '%${wellId}%' AND l.header_id = t.header_id AND d.well_id = '${wellId}' AND d.is_default = 'Y'`;
      wellIdSelect = `'${wellId}'`;
      break;
    case 'afe':
      fromClause = `DM_AFE T, DM_AFE_EVENT_LINK L, CD_DATUM D`;
      whereClause = `t.afe_id = l.afe_id AND l.well_id = '${wellId}' AND d.well_id = '${wellId}' AND d.is_default = 'Y'`;
      wellIdSelect = 'l.well_id';
      break;
    default:
      fromClause = `${cfg.table} T, CD_DATUM D`;
      whereClause = `t.well_id = '${wellId}' AND d.well_id = '${wellId}' AND d.is_default = 'Y'`;
      wellIdSelect = 't.well_id';
      break;
  }

  if (cfg.extraWhere && !options?.skipExtraWhere) {
    whereClause += ` AND ${cfg.extraWhere}`;
  }

  return `SELECT '${cfg.table}' "TABLE_NAME", ${wellIdSelect} "WELL_ID", ${fieldSelects} FROM ${fromClause} WHERE ${whereClause}`;
}

export function getAvailableDetailTables(): string[] {
  return tableConfigs.map(c => c.table);
}
