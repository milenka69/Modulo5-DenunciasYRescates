import test from "node:test";
import assert from "node:assert/strict";
import { equipoDisponible, listarEquipos } from "./equipos.js";

const rescate = (equipo_id, estado) => ({ id: 1, equipo_id, estado });
const ids = (lista) => lista.map((e) => e.id);

test("sin rescates, todos los equipos están disponibles", () => {
  const equipos = listarEquipos(undefined, []);
  assert.equal(equipos.length, 2);
  assert.ok(equipos.every((e) => e.disponible));
});

for (const estado of ["pendiente", "en_camino", "rescatado"]) {
  test(`un rescate ${estado} deja al equipo no disponible`, () => {
    const rescates = [rescate(1, estado)];
    assert.equal(equipoDisponible(1, rescates), false);
    assert.equal(equipoDisponible(2, rescates), true);
  });
}

for (const estado of ["derivado", "fallido"]) {
  test(`un rescate ${estado} libera al equipo`, () => {
    assert.equal(equipoDisponible(1, [rescate(1, estado)]), true);
  });
}

test("filtra solo los disponibles", () => {
  const rescates = [rescate(1, "en_camino")];
  assert.deepEqual(ids(listarEquipos(true, rescates)), [2]);
});

test("filtra solo los no disponibles", () => {
  const rescates = [rescate(1, "en_camino")];
  assert.deepEqual(ids(listarEquipos(false, rescates)), [1]);
});
