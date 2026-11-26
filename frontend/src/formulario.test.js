import test from "node:test";
import assert from "node:assert/strict";
import { armarSolicitud, validarFormulario } from "./formulario.js";

const valido = { denunciaId: "1", equipoId: "2", lugar: "Calle Ejemplo 123", animalId: "" };

test("un formulario completo no tiene errores", () => {
  assert.deepEqual(validarFormulario(valido), {});
});

test("un formulario vacío marca los tres campos obligatorios", () => {
  const errores = validarFormulario({ denunciaId: "", equipoId: "", lugar: "", animalId: "" });
  assert.deepEqual(Object.keys(errores).sort(), ["denunciaId", "equipoId", "lugar"]);
});

test("el ID del animal es opcional", () => {
  assert.equal(validarFormulario({ ...valido, animalId: "" }).animalId, undefined);
  assert.equal(validarFormulario({ ...valido, animalId: "   " }).animalId, undefined);
});

test("un ID de animal válido no da error", () => {
  assert.equal(validarFormulario({ ...valido, animalId: "5521" }).animalId, undefined);
});

for (const malo of ["0", "-3", "1.5", "abc"]) {
  test(`el ID de animal "${malo}" da error`, () => {
    assert.ok(validarFormulario({ ...valido, animalId: malo }).animalId);
  });
}

test("el lugar de solo espacios cuenta como vacío", () => {
  assert.equal(validarFormulario({ ...valido, lugar: "    " }).lugar, "Indica el lugar del rescate.");
});

test("el lugar muy corto da error", () => {
  assert.match(validarFormulario({ ...valido, lugar: "ab" }).lugar, /entre 3 y 200/);
});

test("el lugar de 200 caracteres es válido y de 201 no", () => {
  assert.equal(validarFormulario({ ...valido, lugar: "a".repeat(200) }).lugar, undefined);
  assert.ok(validarFormulario({ ...valido, lugar: "a".repeat(201) }).lugar);
});

test("armarSolicitud convierte a números y limpia el lugar", () => {
  assert.deepEqual(armarSolicitud({ ...valido, lugar: "  Calle Ejemplo 123  ", animalId: "5521" }), {
    denunciaId: 1,
    cuerpo: { equipo_id: 2, lugar: "Calle Ejemplo 123", animal_id: 5521 },
  });
});

test("armarSolicitud deja animal_id sin definir cuando está vacío", () => {
  assert.equal(armarSolicitud(valido).cuerpo.animal_id, undefined);
});
