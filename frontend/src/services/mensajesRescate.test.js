import test from "node:test";
import assert from "node:assert/strict";
import { mensajeDeConfirmacion, mensajeDeError } from "./mensajesRescate.js";

test("confirmación con el nombre del equipo", () => {
  const texto = mensajeDeConfirmacion({
    rescate: { id: 3, denuncia_id: 1, equipo_id: 1, estado: "pendiente" },
    equipo: { id: 1, nombre: "Equipo Alfa" },
  });
  assert.equal(
    texto,
    'Equipo Alfa fue asignado a la denuncia #1. Se creó el rescate N° 3 en estado "pendiente".'
  );
});

test("confirmación sin el objeto equipo usa su id", () => {
  const texto = mensajeDeConfirmacion({
    rescate: { id: 3, denuncia_id: 1, equipo_id: 2, estado: "pendiente" },
  });
  assert.ok(texto.startsWith("El equipo 2 fue asignado"));
});

test("EQUIPO_NO_DISPONIBLE", () => {
  const error = { status: 409, codigo: "EQUIPO_NO_DISPONIBLE", message: "El Equipo Alfa no está disponible." };
  assert.equal(mensajeDeError(error), "Ese equipo está ocupado en otro rescate. Elige otro equipo.");
});

test("DENUNCIA_CON_EQUIPO", () => {
  const error = { status: 409, codigo: "DENUNCIA_CON_EQUIPO", message: "x" };
  assert.equal(mensajeDeError(error), "Esta denuncia ya tiene un equipo asignado.");
});

test("DENUNCIA_CERRADA", () => {
  const error = { status: 409, codigo: "DENUNCIA_CERRADA", message: "x" };
  assert.equal(mensajeDeError(error), "Esta denuncia ya está cerrada y no admite nuevos rescates.");
});

test("dato inválido muestra el mensaje específico de la API", () => {
  const error = { status: 422, codigo: "DATO_INVALIDO", message: "El campo 'lugar' es obligatorio y debe tener entre 3 y 200 caracteres." };
  assert.equal(mensajeDeError(error), error.message);
});

test("error sin status se interpreta como falta de conexión", () => {
  assert.equal(
    mensajeDeError(new TypeError("Failed to fetch")),
    "No se pudo conectar con el servidor. Intenta nuevamente."
  );
});

test("error del servidor sin mensaje usa un texto genérico con el status", () => {
  assert.equal(
    mensajeDeError({ status: 500 }),
    "No se pudo completar la operación (error 500)."
  );
});

test("sesión expirada (401)", () => {
  assert.equal(mensajeDeError({ status: 401 }), "Tu sesión expiró. Ingresa nuevamente.");
});

test("sin permisos (403)", () => {
  assert.equal(
    mensajeDeError({ status: 403, codigo: "otro" }),
    "No tienes permisos para realizar esta acción."
  );
});

test("ANIMAL_NO_ENCONTRADO", () => {
  const error = { status: 404, codigo: "ANIMAL_NO_ENCONTRADO", message: "x" };
  assert.equal(mensajeDeError(error), "El animal indicado no existe en el registro de animales.");
});
