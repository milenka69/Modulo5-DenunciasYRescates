# Módulo 5 — Denuncias y Rescates

Frontend con React y Vite; backend con Node.js y Express. La autenticación utiliza la API externa del núcleo en https://nucleo-tr.onrender.com.

Los usuarios, sus claves y perfiles los administra exclusivamente el núcleo. Este módulo no contiene una base de usuarios ni configura claves de acceso. Para ingresar, usar las cuentas y credenciales proporcionadas por el responsable del núcleo, incluidas sus cuentas de prueba.

## Instalación

Requisitos: Node.js 24 y npm (incluido con Node.js). No se necesita MongoDB para ejecutar el acceso y la página de inicio. Se necesita conexión a Internet para consultar el núcleo.

Clonar o descargar el repositorio y abrir una terminal en su carpeta raíz, donde está este README. Instalar las dependencias de los dos servicios:

```powershell
npm ci --prefix frontend
npm ci --prefix backend
```

## Ejecutar en desarrollo

Abrir dos terminales en la raíz y mantenerlas ejecutándose:

```powershell
# Terminal 1 — backend del módulo, puerto 4000
npm run dev --prefix backend
```

```powershell
# Terminal 2 — frontend, puerto 5173
npm run dev --prefix frontend
```

Abrir http://localhost:5173. La salud del módulo se consulta en http://localhost:4000/api/denuncias/salud; esa ruta no comprueba la disponibilidad del núcleo.

Ingresar con un usuario del núcleo. Los perfiles admitidos son vecino, comunitario y funcionario. Al autenticarse se abre la página de inicio correspondiente al perfil. El menú de usuario permite cerrar sesión.

El botón «Registrar denuncia» está deshabilitado e indica «Próximamente disponible»: el formulario y la API de denuncias todavía no están implementados.

Para detener los servicios, presionar Ctrl+C en cada terminal.

## Configuración

Los valores predeterminados permiten ejecutar sin archivos .env. Para cambiarlos, copiar las plantillas solo si todavía no existe una configuración privada:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

| Variable | Uso |
| --- | --- |
| NUCLEO_URL | URL base del núcleo externo. Por defecto https://nucleo-tr.onrender.com. |
| FRONTEND_URL | Origen autorizado del frontend. Por defecto http://localhost:5173. |
| PORT | Puerto del backend. Por defecto 4000. |
| VITE_API_URL | Base de la API del módulo. Por defecto /api; Vite redirige al backend en el puerto 4000. |
| MONGODB_URI | Opcional; reservar para la futura persistencia de denuncias y rescates. |
| NODE_ENV | development localmente y production en despliegue. |
| TRUST_PROXY | Mantener 0 localmente. Ver condiciones de despliegue más abajo. |

Nunca subir .env, credenciales ni cadenas privadas de conexión a GitHub. Las variables VITE_ son públicas en el navegador: no colocar secretos en ellas. Reiniciar el servicio después de cambiar su configuración.

## Flujo de autenticación

1. El frontend envía RUT y clave al backend mediante POST /api/auth/sesiones.
2. El backend consulta POST /api/nucleo/sesiones en el núcleo externo. El núcleo comprueba las credenciales y emite el token.
3. El backend conserva ese token y entrega al navegador una cookie de sesión. No guarda la clave.
4. Para validar la sesión, el backend consulta GET /api/nucleo/sesiones/actual con el token del núcleo.
5. DELETE /api/auth/sesiones/actual invalida la sesión del módulo y elimina su cookie.

«Recordar sesión» conserva la cookie hasta la expiración comunicada por el núcleo. Sin marcarlo se usa una cookie de sesión del navegador; algunos navegadores pueden restaurarla al recuperar ventanas.

## Solución de problemas

- Si faltan dependencias, ejecutar los dos comandos npm ci y comprobar node --version.
- Si un puerto está ocupado, detener la otra instancia antes de iniciar.
- Usar localhost:5173: el origen debe coincidir con FRONTEND_URL. 127.0.0.1 representa otro origen.
- Si falla la conexión, comprobar que ambos servicios estén activos, que haya Internet y que la URL del núcleo sea accesible. El servicio externo puede tardar en responder al activarse; reintentar después.
- Si las credenciales se rechazan, verificar la cuenta con el responsable del núcleo. No hay usuarios ni claves alternativos en este módulo.
- Si se configura MONGODB_URI, MongoDB debe estar disponible para iniciar. Dejarla vacía para trabajar solo en el acceso.

## Organización del frontend

| Archivo en frontend/src/components/ | Responsabilidad |
| --- | --- |
| InicioSesion.jsx y .css | Formulario de acceso, validación visual y comprobación de sesión. |
| PaginaInicio.jsx y .css | Inicio autenticado y punto de entrada para nuevas funcionalidades. |
| UsuarioPerfil.jsx y .css | Menú de cuenta y cierre de sesión. |
| EstructuraAplicacion.jsx y .css | Encabezado, tema, fondo y pie compartidos. |
| FondoAmbiental.jsx | Fondo decorativo compartido. |

App.jsx coordina la sesión y muestra InicioSesion o PaginaInicio según la validación del backend. Para implementar el registro de denuncias, crear RegistrarDenuncia, conectar el botón indicado en PaginaInicio y agregar las rutas protegidas del backend. Mantener formularios, listados y gestión de rescates en componentes separados.

## Seguridad y despliegue

- Límite de 30 intentos por IP y 10 por RUT en 15 minutos; respuesta 429 con Retry-After al excederlos.
- Mensajes genéricos para credenciales rechazadas, sin revelar si existe una cuenta. El módulo no controla las diferencias de tiempo de respuesta del núcleo externo.
- Token conservado en el servidor; identificador aleatorio de sesión en cookie HttpOnly, SameSite=Strict y, en producción, Secure con prefijo __Host-.
- Comprobación de Origin y encabezado propio en operaciones que modifican la sesión para proteger contra CSRF. CORS autoriza un único origen.
- El middleware requiereSesion valida el token con el núcleo y comprueba perfiles en el backend. Aplicarlo a cada futura ruta protegida y comprobar permisos sobre cada recurso.
- Producción exige HTTPS para el frontend, el núcleo y las peticiones de autenticación. Las respuestas de autenticación incluyen Cache-Control: no-store y, en producción, HSTS.

Para desplegar, servir frontend y /api bajo el mismo origen HTTPS mediante un proxy TLS. Configurar FRONTEND_URL, NUCLEO_URL y NODE_ENV=production. Activar TRUST_PROXY=1 únicamente detrás de exactamente un proxy controlado que sobrescriba X-Forwarded-Proto y bloquee el acceso directo al backend. El certificado TLS se configura en la infraestructura.

Las sesiones y contadores están en memoria, con un máximo de 10.000 entradas cada uno. Reiniciar el backend cierra las sesiones y reinicia los límites. Para múltiples instancias se requiere un almacén compartido con expiración y operaciones atómicas. Cerrar sesión en el módulo no revoca otras sesiones ni tokens del núcleo; esa capacidad depende de su API.

## MongoDB y próximas funcionalidades

Mongoose está instalado y la conexión es opcional mediante MONGODB_URI. Todavía no hay modelos ni operaciones de denuncias y rescates. La futura base del módulo almacenará esos registros y referencias a los usuarios del núcleo; no deberá duplicar claves ni administrar sus cuentas.

## Verificación

```powershell
npm test --prefix backend
node --test frontend/src/services/auth.test.js frontend/src/services/rut.test.js
npm run build --prefix frontend
npm run lint --prefix frontend
```

Las pruebas automatizadas simulan respuestas HTTP del núcleo de forma aislada. No crean cuentas ni consultan credenciales reales. Para comprobar el acceso completo, iniciar ambos servicios e ingresar con una cuenta proporcionada por el núcleo externo.

