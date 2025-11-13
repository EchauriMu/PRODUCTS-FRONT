/**
 * Lista centralizada de unidades de medida permitidas en el sistema.
 * Esta lista debe estar sincronizada con el enum del modelo de Mongoose `ztproducts.js`.
 */
export const unidadesDeMedida = [
  // Unidades de Conteo
  { value: "PZA", text: "PZA - Pieza" },
  { value: "UN", text: "UN - Unidad" },
  { value: "PAR", text: "PAR - Par" },
  { value: "JGO", text: "JGO - Juego" },
  { value: "KIT", text: "KIT - Kit" },
  { value: "PACK", text: "PACK - Paquete" },
  { value: "CAJA", text: "CAJA - Caja" },
  { value: "DOC", text: "DOC - Docena" },
  // Unidades de Peso
  { value: "GR", text: "GR - Gramo" },
  { value: "KG", text: "KG - Kilogramo" },
  { value: "LB", text: "LB - Libra" },
  { value: "OZ", text: "OZ - Onza" },
  { value: "TON", text: "TON - Tonelada" },
  // Unidades de Volumen
  { value: "ML", text: "ML - Mililitro" },
  { value: "L", text: "L - Litro" },
  { value: "GAL", text: "GAL - Galón" },
  { value: "M3", text: "M3 - Metro Cúbico" },
  { value: "CM3", text: "CM3 - Centímetro Cúbico" },
  // Unidades de Longitud
  { value: "MM", text: "MM - Milímetro" },
  { value: "CM", text: "CM - Centímetro" },
  { value: "M", text: "M - Metro" },
  { value: "IN", text: "IN - Pulgada" },
  { value: "FT", text: "FT - Pie" },
  { value: "YD", text: "YD - Yarda" },
  // Unidades de Área
  { value: "M2", text: "M2 - Metro Cuadrado" },
  { value: "CM2", text: "CM2 - Centímetro Cuadrado" },
  { value: "FT2", text: "FT2 - Pie Cuadrado" },
  // Otros
  { value: "SRV", text: "SRV - Servicio" },
  { value: "HR", text: "HR - Hora" },
];