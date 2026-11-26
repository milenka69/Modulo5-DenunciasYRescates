import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorApi, asignarEquipo } from "../services/rescates";
import Mensaje from "./Mensaje";
import { ESTADOS_ASIGNABLES, LONGITUD_LUGAR, armarSolicitud, validarFormulario } from "../services/formularioRescate";
import "./FormularioRescate.css";
import { mensajeDeConfirmacion, mensajeDeError } from "../services/mensajesRescate";

const VACIO = { denunciaId: "", equipoId: "", lugar: "", animalId: "" };

const apiUrl = (import.meta.env?.VITE_API_URL || "/api").replace(/\/$/, "");

async function pedirJson(ruta) {
  const url = apiUrl + ruta;
  const respuesta = await fetch(url, { credentials: "include" }); // la sesión va en una cookie
  if (!respuesta.ok) throw new ErrorApi(undefined, { status: respuesta.status });
  return respuesta.json();
}

// #77 Formulario de registro de rescate: asigna un equipo disponible a una denuncia.
export default function FormularioRescate({ onVolver }) {
  const [denuncias, setDenuncias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null); // { tipo: "exito" | "error", texto }
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Trae las denuncias que admiten un equipo y los equipos disponibles (#69 y #70).
  const cargar = useCallback(async () => {
    const [d, e] = await Promise.all([
      pedirJson("/denuncias?size=100"),
      pedirJson("/equipos?disponible=true"),
    ]);
    setDenuncias(d.data.filter((x) => ESTADOS_ASIGNABLES.includes(x.estado)));
    setEquipos(e.data);
  }, []);

  useEffect(() => {
    cargar()
      .catch((error) => setMensaje({ tipo: "error", texto: mensajeDeError(error) }))
      .finally(() => setCargando(false));
  }, [cargar]);

  const denunciaElegida = useMemo(
    () => denuncias.find((d) => String(d.id) === valores.denunciaId),
    [denuncias, valores.denunciaId]
  );

  function cambiar(campo) {
    return (evento) => {
      const valor = evento.target.value;
      setValores((v) => ({ ...v, [campo]: valor }));
      setErrores((e) => ({ ...e, [campo]: undefined }));
    };
  }

  // Al elegir una denuncia, el lugar se completa con su ubicación (si el usuario no escribió otro).
  function elegirDenuncia(evento) {
    const id = evento.target.value;
    const nueva = denuncias.find((d) => String(d.id) === id);
    setValores((v) => {
      const sinEditar = v.lugar === "" || v.lugar === denunciaElegida?.ubicacion;
      return { ...v, denunciaId: id, lugar: nueva && sinEditar ? nueva.ubicacion : v.lugar };
    });
    setErrores((e) => ({ ...e, denunciaId: undefined }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensaje(null);

    const erroresNuevos = validarFormulario(valores);
    setErrores(erroresNuevos);
    if (Object.keys(erroresNuevos).length > 0) return; // no se envía nada al servidor

    setEnviando(true);
    try {
      const { denunciaId, cuerpo } = armarSolicitud(valores);
      const rescate = await asignarEquipo(denunciaId, cuerpo);
      const equipo = equipos.find((e) => e.id === rescate.equipo_id);
      setMensaje({ tipo: "exito", texto: mensajeDeConfirmacion({ rescate, equipo }) });
      setValores(VACIO);
    } catch (error) {
      setMensaje({ tipo: "error", texto: mensajeDeError(error) });
      // La lista que el usuario veía quedó desactualizada: se limpia la elección que falló.
      if (error.codigo === "EQUIPO_NO_DISPONIBLE") {
        setValores((v) => ({ ...v, equipoId: "" }));
      }
      if (["DENUNCIA_CON_EQUIPO", "DENUNCIA_CERRADA"].includes(error.codigo)) {
        setValores((v) => ({ ...v, denunciaId: "" }));
      }
    } finally {
      setEnviando(false);
    }
    await cargar().catch(() => {}); // refresca las listas (la denuncia y el equipo ya cambiaron)
  }

  const sinOpciones = !cargando && (denuncias.length === 0 || equipos.length === 0);

  return (
    <form className="formulario-rescate" onSubmit={enviar} noValidate>
      {onVolver && (
        <button type="button" className="volver-inicio" onClick={onVolver}>
          ← Volver al inicio
        </button>
      )}

      <h2>Registrar rescate</h2>

      <label htmlFor="denuncia">Denuncia</label>
      <select
        id="denuncia"
        value={valores.denunciaId}
        onChange={elegirDenuncia}
        aria-invalid={Boolean(errores.denunciaId)}
        aria-describedby={errores.denunciaId ? "error-denuncia" : undefined}
      >
        <option value="">Selecciona una denuncia</option>
        {denuncias.map((d) => (
          <option key={d.id} value={d.id}>
            #{d.id} · {d.tipo} · {d.estado}
          </option>
        ))}
      </select>
      {errores.denunciaId && (
        <span id="error-denuncia" className="error-campo" role="alert">{errores.denunciaId}</span>
      )}
      {denunciaElegida && (
        <div className="resumen">
          {denunciaElegida.descripcion}
          <br />
          <small>{denunciaElegida.ubicacion}</small>
        </div>
      )}

      <label htmlFor="equipo">Equipo disponible</label>
      <select
        id="equipo"
        value={valores.equipoId}
        onChange={cambiar("equipoId")}
        aria-invalid={Boolean(errores.equipoId)}
        aria-describedby={errores.equipoId ? "error-equipo" : undefined}
      >
        <option value="">Selecciona un equipo</option>
        {equipos.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre} ({e.integrantes} personas)
          </option>
        ))}
      </select>
      {errores.equipoId && (
        <span id="error-equipo" className="error-campo" role="alert">{errores.equipoId}</span>
      )}

      <label htmlFor="lugar">Lugar del rescate</label>
      <input
        id="lugar"
        value={valores.lugar}
        onChange={cambiar("lugar")}
        maxLength={LONGITUD_LUGAR.max}
        placeholder="Ej: Calle Ejemplo 123, Santiago"
        aria-invalid={Boolean(errores.lugar)}
        aria-describedby={errores.lugar ? "error-lugar" : "ayuda-lugar"}
      />
      {errores.lugar ? (
        <span id="error-lugar" className="error-campo" role="alert">{errores.lugar}</span>
      ) : (
        <span id="ayuda-lugar" className="ayuda">
          {valores.lugar.length}/{LONGITUD_LUGAR.max} caracteres
        </span>
      )}

      <label htmlFor="animal">ID del animal (opcional)</label>
      <input
        id="animal"
        maxLength={40}
        placeholder="Ej: SIM-000001"
        autoComplete="off"
        spellCheck="false"
        value={valores.animalId}
        onChange={cambiar("animalId")}
        aria-invalid={Boolean(errores.animalId)}
        aria-describedby={errores.animalId ? "error-animal" : "ayuda-animal"}
      />
      {errores.animalId ? (
        <span id="error-animal" className="error-campo" role="alert">{errores.animalId}</span>
      ) : (
        <span id="ayuda-animal" className="ayuda">
          Identificador del animal en el módulo de Registro de animales. Déjalo vacío si aún no está registrado.
        </span>
      )}

      {sinOpciones && (
        <p className="aviso">
          {denuncias.length === 0
            ? "No hay denuncias pendientes de asignación."
            : "No hay equipos disponibles en este momento."}
        </p>
      )}

      <button type="submit" disabled={enviando || cargando || sinOpciones}>
        {enviando ? "Asignando..." : "Asignar equipo"}
      </button>

      <Mensaje tipo={mensaje?.tipo} texto={mensaje?.texto} onCerrar={() => setMensaje(null)} />
    </form>
  );
}
