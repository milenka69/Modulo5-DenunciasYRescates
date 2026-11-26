// #76 Pruebas de asignación de equipos, a través de la API real (HTTP).
// Cada criterio de aceptación de la HU-05 tiene su prueba.
import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import app from "./app.js";
import { reiniciarDenuncias } from "./denuncias.js";
import { reiniciarRescates } from "./equipos.js";

let servidor;
let base;

before(async () => {
  await new Promise((resolver) => {
    servidor = app.listen(0, resolver); // puerto libre al azar
  });
  base = `http://localhost:${servidor.address().port}`;
});

after(() => {
  servidor.closeAllConnections?.();
  servidor.close();
});

beforeEach(() => {
  reiniciarDenuncias();
  reiniciarRescates();
});

// ---------------------------------------------------------------- ayudas
const asignar = (denunciaId, cuerpo) =>
  fetch(`${base}/api/denuncias/${denunciaId}/rescates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });

const consultar = async (ruta) => (await fetch(`${base}${ruta}`)).json();
const datos = (equipo_id = 1) => ({ equipo_id, lugar: "Calle Ejemplo 123, Santiago" });
const idsDe = (lista) => lista.data.map((x) => x.id);

// ---------------------------------------------------------------- caso feliz
test("asigna un equipo disponible: 201 y rescate pendiente", async () => {
  const r = await asignar(1, datos(1));
  assert.equal(r.status, 201);

  const rescate = await r.json();
  assert.equal(rescate.denuncia_id, 1);
  assert.equal(rescate.equipo_id, 1);
  assert.equal(rescate.estado, "pendiente");
  assert.ok(rescate.fecha_asignacion);
});

// ---------------------------------------------------------------- criterio 1
test("CRITERIO: una denuncia no puede tener dos equipos asignados a la vez", async () => {
  assert.equal((await asignar(1, datos(1))).status, 201);

  const segundo = await asignar(1, datos(2));
  assert.equal(segundo.status, 409);
  assert.equal((await segundo.json()).error, "denuncia_con_equipo");

  // el segundo intento no ocupó al Equipo Beta
  assert.deepEqual(idsDe(await consultar("/api/equipos?disponible=true")), [2]);
});

// ---------------------------------------------------------------- criterio 2
test('CRITERIO: al asignar, el estado de la denuncia cambia a "asignada"', async () => {
  assert.ok(idsDe(await consultar("/api/denuncias?estado=ingresada")).includes(1));

  await asignar(1, datos(1));

  assert.ok(!idsDe(await consultar("/api/denuncias?estado=ingresada")).includes(1));
  assert.ok(idsDe(await consultar("/api/denuncias?estado=asignada")).includes(1));
});

test("si la asignación falla, el estado de la denuncia no cambia", async () => {
  await asignar(1, datos(1));
  await asignar(2, datos(1)); // equipo ocupado: se rechaza

  assert.ok(idsDe(await consultar("/api/denuncias?estado=ingresada")).includes(2));
});

// ---------------------------------------------------------------- criterio 3
test("CRITERIO: solo se pueden asignar equipos disponibles", async () => {
  await asignar(1, datos(1));
  assert.deepEqual(idsDe(await consultar("/api/equipos?disponible=true")), [2]);

  const r = await asignar(2, datos(1));
  assert.equal(r.status, 409);
  const error = await r.json();
  assert.equal(error.error, "equipo_no_disponible");
  assert.equal(error.mensaje, "El Equipo Alfa no está disponible.");
});

test("cada denuncia con su propio equipo: dos asignaciones válidas", async () => {
  assert.equal((await asignar(1, datos(1))).status, 201);
  assert.equal((await asignar(2, datos(2))).status, 201);
  assert.equal((await consultar("/api/equipos?disponible=true")).total, 0);
});

// ---------------------------------------------------------------- errores y formato
test("el error sigue el formato del contrato (error, mensaje, status)", async () => {
  await asignar(1, datos(1));
  const r = await asignar(1, datos(2));
  const cuerpo = await r.json();

  assert.deepEqual(Object.keys(cuerpo).sort(), ["error", "mensaje", "status"]);
  assert.equal(cuerpo.status, r.status);
});

test("denuncia inexistente: 404", async () => {
  const r = await asignar(999, datos(1));
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, "denuncia_no_encontrada");
});

test("equipo inexistente: 404", async () => {
  const r = await asignar(1, datos(999));
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, "equipo_no_encontrado");
});

test("lugar vacío: 422", async () => {
  const r = await asignar(1, { equipo_id: 1, lugar: "" });
  assert.equal(r.status, 422);
  assert.equal((await r.json()).error, "dato_invalido");
});

test("cuerpo con un JSON mal escrito: 400", async () => {
  const r = await fetch(`${base}/api/denuncias/1/rescates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ esto no es json",
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "json_invalido");
});

// ---------------------------------------------------------------- solicitudes simultáneas
test("dos solicitudes simultáneas para la misma denuncia: solo una crea el rescate", async () => {
  const respuestas = await Promise.all([asignar(1, datos(1)), asignar(1, datos(2))]);
  const codigos = respuestas.map((r) => r.status).sort((a, b) => a - b);
  assert.deepEqual(codigos, [201, 409]);
});

test("dos solicitudes simultáneas por el mismo equipo: solo una lo obtiene", async () => {
  const respuestas = await Promise.all([asignar(1, datos(1)), asignar(2, datos(1))]);
  const codigos = respuestas.map((r) => r.status).sort((a, b) => a - b);
  assert.deepEqual(codigos, [201, 409]);
});
