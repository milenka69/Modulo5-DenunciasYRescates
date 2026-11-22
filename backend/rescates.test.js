import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { asignarEquipo } from "./rescates.js";
import { DENUNCIAS } from "./denuncias.js";
import { equipoDisponible } from "./equipos.js";

// #74 cambia el estado de las denuncias: se restauran antes de cada prueba.
const estadosOriginales = DENUNCIAS.map((d) => d.estado);
beforeEach(() => DENUNCIAS.forEach((d, i) => { d.estado = estadosOriginales[i]; }));

const datosValidos = { equipo_id: 1, lugar: "Calle Ejemplo 123, Santiago" };

test("asigna un equipo y crea un rescate pendiente", () => {
  const rescates = [];
  const { rescate } = asignarEquipo(1, datosValidos, { rescates });

  assert.equal(rescate.id, 1);
  assert.equal(rescate.denuncia_id, 1);
  assert.equal(rescate.equipo_id, 1);
  assert.equal(rescate.estado, "pendiente");
  assert.equal(rescate.animal_id, null);
  assert.ok(rescate.fecha_asignacion);
  assert.equal(rescates.length, 1);
});

test("los ids de los rescates son incrementales", () => {
  const rescates = [];
  asignarEquipo(1, datosValidos, { rescates });
  const { rescate } = asignarEquipo(2, { ...datosValidos, equipo_id: 2 }, { rescates });
  assert.equal(rescate.id, 2);
});

test("el equipo asignado deja de estar disponible", () => {
  const rescates = [];
  assert.equal(equipoDisponible(1, rescates), true);
  asignarEquipo(1, datosValidos, { rescates });
  assert.equal(equipoDisponible(1, rescates), false);
});

test("acepta animal_id opcional", () => {
  const { rescate } = asignarEquipo(1, { ...datosValidos, animal_id: 5521 }, { rescates: [] });
  assert.equal(rescate.animal_id, 5521);
});

test("denuncia inexistente da 404", () => {
  const { error } = asignarEquipo(999, datosValidos, { rescates: [] });
  assert.equal(error.status, 404);
  assert.equal(error.error, "denuncia_no_encontrada");
});

test("equipo inexistente da 404", () => {
  const { error } = asignarEquipo(1, { ...datosValidos, equipo_id: 999 }, { rescates: [] });
  assert.equal(error.status, 404);
  assert.equal(error.error, "equipo_no_encontrado");
});

test("equipo_id que no es entero da 422", () => {
  const { error } = asignarEquipo(1, { ...datosValidos, equipo_id: "uno" }, { rescates: [] });
  assert.equal(error.status, 422);
});

test("lugar vacío da 422", () => {
  const { error } = asignarEquipo(1, { ...datosValidos, lugar: "  " }, { rescates: [] });
  assert.equal(error.status, 422);
});

test("sin cuerpo da 422 y no crea rescates", () => {
  const rescates = [];
  const { error } = asignarEquipo(1, undefined, { rescates });
  assert.equal(error.status, 422);
  assert.equal(rescates.length, 0);
});

// ---------------------------------------------------------------- #72 disponibilidad
const rescateExistente = (equipo_id, estado) => ({
  id: 1, denuncia_id: 3, equipo_id, estado,
});

for (const estado of ["pendiente", "en_camino", "rescatado"]) {
  test(`rechaza un equipo con un rescate ${estado} (409)`, () => {
    const rescates = [rescateExistente(1, estado)];
    const { error } = asignarEquipo(1, datosValidos, { rescates });
    assert.equal(error.status, 409);
    assert.equal(error.error, "equipo_no_disponible");
    assert.equal(error.mensaje, "El Equipo Alfa no está disponible.");
  });
}

for (const estado of ["derivado", "fallido"]) {
  test(`permite asignar un equipo cuyo rescate quedó ${estado}`, () => {
    const rescates = [rescateExistente(1, estado)];
    const { rescate, error } = asignarEquipo(1, datosValidos, { rescates });
    assert.equal(error, undefined);
    assert.equal(rescate.estado, "pendiente");
  });
}

test("un equipo ocupado no impide asignar otro equipo", () => {
  const rescates = [rescateExistente(1, "en_camino")];
  const { rescate } = asignarEquipo(1, { ...datosValidos, equipo_id: 2 }, { rescates });
  assert.equal(rescate.equipo_id, 2);
});

test("al rechazar por equipo ocupado no se crea ningún rescate", () => {
  const rescates = [rescateExistente(1, "pendiente")];
  asignarEquipo(1, datosValidos, { rescates });
  assert.equal(rescates.length, 1);
});

test("asignar dos veces seguidas el mismo equipo: la segunda falla", () => {
  const rescates = [];
  assert.ok(asignarEquipo(1, datosValidos, { rescates }).rescate);
  const { error } = asignarEquipo(2, datosValidos, { rescates });
  assert.equal(error.error, "equipo_no_disponible");
});

// ---------------------------------------------------------------- #73 un equipo por denuncia
const rescateDeDenuncia = (denuncia_id, equipo_id, estado, id = 7) => ({
  id, denuncia_id, equipo_id, estado,
});

for (const estado of ["pendiente", "en_camino", "rescatado"]) {
  test(`rechaza un segundo equipo si la denuncia ya tiene un rescate ${estado} (409)`, () => {
    const rescates = [rescateDeDenuncia(1, 1, estado)];
    const { error } = asignarEquipo(1, { ...datosValidos, equipo_id: 2 }, { rescates });
    assert.equal(error.status, 409);
    assert.equal(error.error, "denuncia_con_equipo");
    assert.equal(error.mensaje, "La denuncia ya tiene un equipo asignado (rescate 7).");
  });
}

for (const estado of ["fallido", "derivado"]) {
  test(`permite asignar un equipo si el rescate anterior de la denuncia quedó ${estado}`, () => {
    const rescates = [rescateDeDenuncia(1, 1, estado)];
    const { rescate, error } = asignarEquipo(1, { ...datosValidos, equipo_id: 2 }, { rescates });
    assert.equal(error, undefined);
    assert.equal(rescate.id, 8);
    assert.equal(rescates.length, 2); // el intento anterior se conserva
  });
}

test("el rescate activo de otra denuncia no bloquea esta denuncia", () => {
  const rescates = [rescateDeDenuncia(2, 1, "en_camino")];
  const { rescate } = asignarEquipo(1, { ...datosValidos, equipo_id: 2 }, { rescates });
  assert.equal(rescate.denuncia_id, 1);
});

test("al rechazar por denuncia con equipo no se crea ningún rescate", () => {
  const rescates = [rescateDeDenuncia(1, 1, "pendiente")];
  asignarEquipo(1, { ...datosValidos, equipo_id: 2 }, { rescates });
  assert.equal(rescates.length, 1);
});

test("si además el equipo está ocupado, gana equipo_no_disponible (orden del diagrama)", () => {
  const rescates = [rescateDeDenuncia(1, 1, "pendiente")];
  const { error } = asignarEquipo(1, datosValidos, { rescates });
  assert.equal(error.error, "equipo_no_disponible");
});

// ---------------------------------------------------------------- #74 estado de la denuncia
const denunciaEn = (estado) => [{ id: 10, estado }];
const datos10 = { equipo_id: 1, lugar: "Calle Ejemplo 123, Santiago" };

test("al asignar, la denuncia pasa de ingresada a asignada", () => {
  const denuncia = DENUNCIAS.find((d) => d.id === 1);
  assert.equal(denuncia.estado, "ingresada");
  asignarEquipo(1, datosValidos, { rescates: [] });
  assert.equal(denuncia.estado, "asignada");
});

test("al asignar, la denuncia pasa de en_evaluacion a asignada", () => {
  const denuncias = denunciaEn("en_evaluacion");
  asignarEquipo(10, datos10, { denuncias, rescates: [] });
  assert.equal(denuncias[0].estado, "asignada");
});

test("reintento: desde sin_ubicar la denuncia vuelve a asignada", () => {
  const denuncias = denunciaEn("sin_ubicar");
  const rescates = [{ id: 1, denuncia_id: 10, equipo_id: 1, estado: "fallido" }];
  const { rescate } = asignarEquipo(10, { ...datos10, equipo_id: 2 }, { denuncias, rescates });
  assert.equal(rescate.id, 2);
  assert.equal(denuncias[0].estado, "asignada");
});

test("si la asignación se rechaza, el estado de la denuncia no cambia", () => {
  const denuncias = denunciaEn("en_evaluacion");
  asignarEquipo(10, { ...datos10, equipo_id: 999 }, { denuncias, rescates: [] }); // equipo inexistente
  assert.equal(denuncias[0].estado, "en_evaluacion");

  const ocupado = [{ id: 1, denuncia_id: 99, equipo_id: 1, estado: "pendiente" }];
  asignarEquipo(10, datos10, { denuncias, rescates: ocupado }); // equipo ocupado
  assert.equal(denuncias[0].estado, "en_evaluacion");
});

for (const estado of ["descartada", "resuelta", "cerrada"]) {
  test(`una denuncia ${estado} no admite rescates (409) y no cambia de estado`, () => {
    const denuncias = denunciaEn(estado);
    const rescates = [];
    const { error } = asignarEquipo(10, datos10, { denuncias, rescates });
    assert.equal(error.status, 409);
    assert.equal(error.error, "denuncia_cerrada");
    assert.equal(denuncias[0].estado, estado);
    assert.equal(rescates.length, 0);
  });
}
