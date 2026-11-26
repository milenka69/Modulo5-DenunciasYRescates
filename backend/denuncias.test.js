import test from "node:test";
import assert from "node:assert/strict";
import { buscarDenuncias } from "./denuncias.js";

const ids = (lista) => lista.map((d) => d.id);

test("sin filtros devuelve todas", () => {
  assert.equal(buscarDenuncias().length, 3);
});

test("filtra por estado", () => {
  assert.deepEqual(ids(buscarDenuncias({ estado: "ingresada" })), [1, 2]);
});

test("filtra por tipo", () => {
  assert.deepEqual(ids(buscarDenuncias({ tipo: "abandono" })), [2]);
});

test("busca por texto sin importar mayúsculas", () => {
  assert.deepEqual(ids(buscarDenuncias({ texto: "GATO" })), [2]);
});

test("combina filtros", () => {
  assert.deepEqual(ids(buscarDenuncias({ estado: "ingresada", tipo: "maltrato" })), [1]);
});

test("sin resultados devuelve lista vacía", () => {
  assert.deepEqual(buscarDenuncias({ texto: "elefante" }), []);
});
