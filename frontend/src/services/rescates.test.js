import test from "node:test";
import assert from "node:assert/strict";
import { ErrorApi, asignarEquipo, leerError } from "./rescates.js";

const datos = { equipo_id: 1, lugar: "Calle Ejemplo 123" };
const respuestaFalsa = (status, cuerpo) => async () => ({
  ok: status < 400,
  status,
  json: async () => cuerpo,
});

test("leerError acepta el formato anidado { error: { codigo, mensaje } }", () => {
  assert.deepEqual(
    leerError({ error: { codigo: "EQUIPO_NO_DISPONIBLE", mensaje: "Ocupado." } }),
    { codigo: "EQUIPO_NO_DISPONIBLE", mensaje: "Ocupado." }
  );
});

test("leerError acepta el formato plano { error, mensaje }", () => {
  assert.deepEqual(
    leerError({ error: "EQUIPO_NO_DISPONIBLE", mensaje: "Ocupado.", status: 409 }),
    { codigo: "EQUIPO_NO_DISPONIBLE", mensaje: "Ocupado." }
  );
});

test("leerError tolera una respuesta vacía", () => {
  assert.deepEqual(leerError({}), { codigo: undefined, mensaje: undefined });
});

test("asignarEquipo lanza ErrorApi con el código y el status (formato anidado)", async () => {
  globalThis.fetch = respuestaFalsa(409, { error: { codigo: "EQUIPO_NO_DISPONIBLE", mensaje: "El Equipo Alfa no está disponible." } });
  await assert.rejects(
    () => asignarEquipo(1, datos),
    (e) => e instanceof ErrorApi && e.codigo === "EQUIPO_NO_DISPONIBLE" && e.status === 409 && e.message === "El Equipo Alfa no está disponible."
  );
});

test("asignarEquipo lanza ErrorApi con el código y el status (formato plano)", async () => {
  globalThis.fetch = respuestaFalsa(409, { error: "DENUNCIA_CON_EQUIPO", mensaje: "Ya tiene equipo.", status: 409 });
  await assert.rejects(
    () => asignarEquipo(1, datos),
    (e) => e.codigo === "DENUNCIA_CON_EQUIPO" && e.status === 409
  );
});

test("una respuesta que no es JSON conserva el status", async () => {
  globalThis.fetch = async () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError("no json"); } });
  await assert.rejects(
    () => asignarEquipo(1, datos),
    (e) => e.status === 502 && e.codigo === undefined
  );
});

test("asignarEquipo devuelve el rescate y envía la cookie de sesión", async () => {
  let llamada;
  globalThis.fetch = async (url, opciones) => {
    llamada = { url, opciones };
    return { ok: true, status: 201, json: async () => ({ id: 7 }) };
  };
  const rescate = await asignarEquipo(5, { ...datos, animal_id: "SIM-000001" });
  assert.deepEqual(rescate, { id: 7 });
  assert.equal(llamada.url, "/api/denuncias/5/rescates");
  assert.equal(llamada.opciones.credentials, "include");
  assert.equal(JSON.parse(llamada.opciones.body).animal_id, "SIM-000001");
});
