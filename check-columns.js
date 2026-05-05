const http = require('http');
const tables = [
  'DM_STIM_FLUID_ADD','DM_STIM_FLUID_SCHEDULE',
  'DM_STIM_STAGE_SUPPLEMENT',
  'DM_STIM_TREATMENT_AC_COMP',
  'DM_STIM_FLOWPATH_STAGE',
  'DM_STIM_FET_TEST','DM_STIM_PUMP_FB_TEST','DM_STIM_STEP_TEST',
  'DM_STIM_FLOWPATH','DM_STIM_PUMPING_DIAG','DM_STIM_RES_INTERVAL',
  'DM_STIM_TREATMENT_ADDITIVE','DM_STIM_TREATMENT_FLUID','DM_STIM_TREATMENT_PROPPANT',
  'DM_STIM_TREATMENT','DM_STIM_FLOWBACK','DM_STIM_FLUID','DM_STIM_STAGE',
  'DM_TRANSFER_SUMMARY','DM_TRANSFER_DETAIL',
  'DM_UNDERWATER_DETAIL','DM_UNDERWATER_EQUIPMENT','DM_UNDERWATER_MATERIAL_TRAN',
  'DM_WEATHER_CURRENT','DM_WELL_PLAN_OFFSET',
  'DM_PROD_EQUIP_FAIL',
  'DM_FLUID_INPUT','DM_FLUID_HAUL_DETAIL',
  'DM_FISHING_FREE_POINT','DM_FISHING_RESPONSIBLE','DM_FISHING_RESULTS','DM_FISHING_STRING_SHOT',
  'DM_INCIDENT_COST','DM_INCIDENT_DETAIL',
  'DM_BULK_TRAN',
  'DM_PUMP_JACK','DM_COUNTER_WEIGHT','DM_PRIME_MOVER',
  'DM_PIPE_TALLY',
  'DM_PLUNGER_ACC','DM_PLUNGER_LIFT_STAGE_SYSTEM',
  'DM_OPER_EQUIP_FAIL_STATUS',
  'DM_MUD_PRODUCT_TRAN',
  'DM_RIG_DECKLOG_REMARKS',
  'CD_ASSEMBLY_COMP','CD_WELLHEAD_COMP','CD_WELLHEAD_COMPLETION_LINK','CD_WELLHEAD_TEST',
  'CD_WELLHEAD_COMP_OUTLET','CD_WELLHEAD_HANGER','CD_WELLHEAD_HANGER_CONTROL',
  'CD_WEQP_CONV_PUMP'
];
const inList = tables.map(t => "'" + t + "'").join(',');
const q = "SELECT table_name, column_name FROM all_tab_columns WHERE table_name IN (" + inList + ") AND column_name LIKE '%_ID' ORDER BY table_name, column_id";
const body = JSON.stringify({sql: q});
const req = http.request({hostname:'localhost',port:3000,path:'/api/query',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, res => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    const parsed = JSON.parse(d);
    const rows = parsed.rows || parsed;
    rows.forEach(r => console.log(r.TABLE_NAME + ' | ' + r.COLUMN_NAME));
  });
});
req.write(body); req.end();
