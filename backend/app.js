import express from "express";
import { buscarDenuncias } from "./denuncias.js";
import { listarEquipos } from "./equipos.js";
import { asignarEquipo } from "./rescates.js";

// La app se exporta sin "escuchar" ningún puerto, para poder probarla (tarea #76).
const app = express();
app.use(express.json());

// #69 Buscar denuncias
app.get("/api/denuncias", (req, res) => {
  const { estado, tipo, q } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size) || 10, 1), 100);

  const encontradas = buscarDenuncias({ estado, tipo, texto: q });
  const inicio = (page - 1) * size;

  res.json({
    data: encontradas.slice(inicio, inicio + size),
    page,
    size,
    total: encontradas.length,
  });
});

// #70 Mostrar los equipos de rescate disponibles
app.get("/api/equipos", (req, res) => {
  const { disponible } = req.query;

  if (disponible !== undefined && disponible !== "true" && disponible !== "false") {
    return res.status(422).json({
      error: "parametro_invalido",
      mensaje: "El parámetro 'disponible' debe ser true o false.",
      status: 422,
    });
  }

  const filtro = disponible === undefined ? undefined : disponible === "true";
  const equipos = listarEquipos(filtro);
  res.json({ data: equipos, total: equipos.length });
});

// #71 a #74 Asignar un equipo de rescate a una denuncia
app.post("/api/denuncias/:id/rescates", (req, res) => {
  const resultado = asignarEquipo(Number(req.params.id), req.body);
  if (resultado.error) {
    const { status, error, mensaje } = resultado.error;
    return res.status(status).json({ error, mensaje, status });
  }
  res.status(201).json(resultado.rescate);
});

// Un JSON mal escrito responde 400 con el formato de error del contrato
// (sin esto, Express respondería con una página HTML).
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "json_invalido",
      mensaje: "El cuerpo de la solicitud no es un JSON válido.",
      status: 400,
    });
  }
  next(err);
});

export default app;
