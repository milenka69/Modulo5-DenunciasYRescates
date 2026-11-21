
const URL_NUCLEO = 'https://nucleo-tr.onrender.com/api/nucleo';

const validarToken = async (req, res, next) => {
  const autorizacion = req.headers.authorization;

  if (!autorizacion || !autorizacion.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        codigo: 'TOKEN_REQUERIDO',
        mensaje: 'Debes iniciar sesión para realizar esta acción.'
      }
    });
  }

  try {
    const respuesta = await fetch(
      `${URL_NUCLEO}/sesiones/actual`,
      {
        method: 'GET',
        headers: {
          Authorization: autorizacion
        }
      }
    );

    const usuario = await respuesta.json();

    if (!respuesta.ok) {
      return res.status(401).json({
        error: {
          codigo: 'TOKEN_INVALIDO',
          mensaje: 'Tu sesión no es válida o ha expirado.'
        }
      });
    }

    req.usuario = usuario;
    next();

  } catch (error) {
    console.error('Error al consultar el Núcleo:', error);

    return res.status(503).json({
      error: {
        codigo: 'NUCLEO_NO_DISPONIBLE',
        mensaje: 'No se pudo validar la sesión.'
      }
    });
  }
};

export default validarToken;
