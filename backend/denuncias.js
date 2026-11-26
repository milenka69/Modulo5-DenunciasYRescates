// Datos ficticios. Más adelante podrían venir de una base de datos.
export const DENUNCIAS = [
  { id: 1, tipo: "maltrato", descripcion: "Perro desnutrido atado en un patio.",
    estado: "ingresada", ubicacion: "Calle Ejemplo 123, Santiago" },
  { id: 2, tipo: "abandono", descripcion: "Gato abandonado en una plaza.",
    estado: "ingresada", ubicacion: "Plaza de Prueba, Providencia" },
  { id: 3, tipo: "maltrato", descripcion: "Perro encerrado sin agua en un balcón.",
    estado: "asignada", ubicacion: "Av. Ficticia 456, Ñuñoa" },
];

// Devuelve las denuncias que cumplen todos los filtros. Un filtro vacío se ignora.
export function buscarDenuncias({ estado, tipo, texto } = {}) {
  return DENUNCIAS.filter(
    (d) =>
      (!estado || d.estado === estado) &&
      (!tipo || d.tipo === tipo) &&
      (!texto || d.descripcion.toLowerCase().includes(texto.toLowerCase()))
  );
}

// Solo para pruebas: devuelve las denuncias a su estado inicial.
const ESTADOS_INICIALES = DENUNCIAS.map((d) => d.estado);
export function reiniciarDenuncias() {
  DENUNCIAS.forEach((d, i) => { d.estado = ESTADOS_INICIALES[i]; });
}
