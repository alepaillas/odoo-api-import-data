// src/services/regionMapper.ts
export function mapRegionToStateId(region: string): number | boolean{
  switch (region) {
    case "Arica y Parinacota":
      return 1188;
    case "Tarapacá":
      return 1174;
    case "Antofagasta":
      return 1175;
    case "Atacama":
      return 1176;
    case "Coquimbo":
      return 1177;
    case "Valparaíso":
      return 1178;
    case "Región del Libertador Gral. Bernardo O'Higgins":
      return 1179;
    case "Región del Maule":
      return 1180;
    case "Región del Biobío":
      return 1181;
    case "Región del Ñuble":
      return 1189;
    case "Región de la Araucanía":
      return 1182;
    case "Región de los Ríos":
      return 1187;
    case "Región de los Lagos":
      return 1183;
    case "Región Aisén del Gral. Carlos Ibañez del Campo":
      return 1184;
    case "Región de Magallanes y de la Antártica Chilena":
      return 1185;
    case "Región Metropolitana de Santiago":
      return 1186;
    default:
      return false;
  }
}
