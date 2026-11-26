# Tarea #76 - Pruebas de asignación de equipos (HU-05)

Historia: *Como funcionario, quiero asignar un equipo de rescate a una denuncia, para que alguien se haga cargo del caso.*

## Casos de prueba

| ID | Caso | Criterio de aceptación | Resultado esperado | Prueba automática |
|---|---|---|---|---|
| CP-01 | Asignar un equipo disponible a una denuncia sin equipo | Flujo principal | 201, rescate en estado `pendiente` | `rescates.http.test.js` |
| CP-02 | Asignar un segundo equipo a una denuncia que ya tiene uno | Una denuncia no puede tener dos equipos a la vez | 409 `DENUNCIA_CON_EQUIPO`; el segundo equipo sigue disponible | `rescates.http.test.js` |
| CP-03 | Asignar un equipo correctamente | Al asignar, el estado cambia a "Asignada" | La denuncia sale de `ingresada` y aparece en `asignada` | `rescates.http.test.js` |
| CP-04 | Asignar con error (equipo ocupado) | Al asignar, el estado cambia a "Asignada" | La denuncia conserva su estado anterior | `rescates.http.test.js` |
| CP-05 | Asignar un equipo que ya está ocupado en otro rescate | Solo se pueden asignar equipos disponibles | 409 `EQUIPO_NO_DISPONIBLE` | `rescates.http.test.js` |
| CP-06 | Dos denuncias, cada una con su propio equipo | Flujo principal | Dos 201; no quedan equipos disponibles | `rescates.http.test.js` |
| CP-07 | Denuncia inexistente | Manejo de errores | 404 `DENUNCIA_NO_ENCONTRADA` | `rescates.http.test.js`, `dominio.test.js` |
| CP-08 | Equipo inexistente | Manejo de errores | 404 `EQUIPO_NO_ENCONTRADO` | `rescates.http.test.js`, `dominio.test.js` |
| CP-09 | Lugar vacío o equipo_id inválido | Validación de datos | 422 `DATO_INVALIDO` | `rescates.http.test.js`, `dominio.test.js` |
| CP-10 | Cuerpo con JSON mal escrito | Validación de datos | 400 `JSON_INVALIDO` | `rescates.http.test.js` |
| CP-11 | Formato de los errores | Contrato de la API | El cuerpo es `{ error: { codigo, mensaje } }` | `rescates.http.test.js` |
| CP-12 | Dos solicitudes simultáneas para la misma denuncia | Una denuncia no puede tener dos equipos a la vez | Una responde 201 y la otra 409 | `rescates.http.test.js` |
| CP-13 | Dos solicitudes simultáneas por el mismo equipo | Solo se pueden asignar equipos disponibles | Una responde 201 y la otra 409 | `rescates.http.test.js` |
| CP-14 | Asignar a una denuncia `descartada`, `resuelta` o `cerrada` | Estados del diagrama | 409 `DENUNCIA_CERRADA`; el estado no cambia | `dominio.test.js` |
| CP-15 | Reintento: rescate anterior `fallido` y denuncia en `sin_ubicar` | Estados del diagrama | Se crea otro rescate; la denuncia vuelve a `asignada` y el intento anterior se conserva | `dominio.test.js` |
| CP-16 | Validación del formulario (campos obligatorios, largo del lugar, ID de animal) | Tarea #77 | Errores por campo y no se envía nada al servidor | `frontend/src/services/formularioRescate.test.js` |
| CP-17 | Mensajes de confirmación y de error en pantalla | Tareas #75 y #77 | Mensaje verde o rojo según el resultado | Textos: `frontend/src/services/mensajesRescate.test.js`; pantalla: manual (ver abajo) |

## Prueba manual del formulario (CP-17)

Reinicia el servidor antes de empezar, porque los datos están en memoria.

| Paso | Qué hacer | Resultado esperado |
|---|---|---|
| 0 | Iniciar sesión como funcionario y presionar «Asignar equipo de rescate» | Se muestra el formulario dentro de la tarjeta de inicio, con el enlace «Volver al inicio» |
| 1 | Presionar "Asignar equipo" sin completar nada | Errores bajo denuncia, equipo y lugar; no se envía nada |
| 2 | Elegir la denuncia 1 | El lugar se completa con la ubicación de la denuncia |
| 3 | Escribir "ab" en el lugar y enviar | Error: el lugar debe tener entre 3 y 200 caracteres |
| 4 | Escribir «SIM 01» (con espacio) en el ID del animal | Error: formato inválido (ejemplo: SIM-000001) |
| 5 | Denuncia 1, Equipo Alfa, lugar válido | Mensaje verde; la denuncia 1 y el Equipo Alfa desaparecen de las listas |
| 6 | Abrir el formulario en dos pestañas. En ambas, elegir denuncia 2 y Equipo Beta. Enviar en la pestaña A y luego en la B | A: mensaje verde. B: mensaje rojo (equipo ocupado) y las listas se actualizan |
| 7 | Revisar las listas después del paso 6 | Sin equipos disponibles: aviso "No hay equipos disponibles" y botón deshabilitado |
| 8 | Apagar el servidor y enviar | Mensaje rojo: no se pudo conectar |
| 10 | Asignar con el ID de animal «sim-000001» | Mensaje verde; el animal se guarda como SIM-000001 |
| 11 | Presionar «Volver al inicio» | Desaparece el formulario y se ve la pantalla de inicio |
| 12 | Iniciar sesión como vecino o comunitario | No aparece el botón «Asignar equipo de rescate» |
| 9 | Activar el modo oscuro (☾) con el formulario abierto | Los campos, el resumen y los mensajes se ven con los colores oscuros |

## Registro de resultados

Anota aquí la fecha y el resultado de la última corrida:

| Fecha | Comando | Pruebas totales | Aprobadas | Fallidas |
|---|---|---|---|---|
|  | `npm test` (carpeta `backend`) |  |  |  |

## Pruebas de acceso (integración, `backend/test/rescates.http.test.js`)

| Caso | Resultado esperado |
|---|---|
| Sin sesión | 401 `SESION_INVALIDA` |
| Vecino / comunitario | 403 `PERFIL_NO_AUTORIZADO`, no se crea nada |
| Funcionario | Lista equipos y asigna (201) |
| Animal inexistente en el núcleo | 404 `ANIMAL_NO_ENCONTRADO` |
| Sin `Origin` / `X-Requested-With` | 403 `ORIGEN_INVALIDO` |
