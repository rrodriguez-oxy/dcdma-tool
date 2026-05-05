export function getWaterDepth(wellId: string): string {
  return `SELECT water_depth "water_depth", is_offshore "is_offshore" FROM cd_well WHERE well_id = '${wellId}'`;
}

export function getDatumInfo(wellId: string): string {
  return `SELECT datum_name "Datum Name", datum_elevation "Datum Elevation", is_default "Default Datum" FROM cd_datum WHERE well_id = '${wellId}'`;
}
