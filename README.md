# Denuncias y rescates de animales

## Preparar MongoDB y la API

1. Instala las dependencias del backend:

   ```sh
   cd backend
   npm ci
   ```

2. Copia `backend/.env.example` a `backend/.env`, configura `MONGODB_URI` y
   reemplaza `CONTACT_LOOKUP_SECRET` por una clave aleatoria privada de al
   menos 32 caracteres. El URI de ejemplo conecta a una instancia local de
   MongoDB.
3. Inicia la API desde `backend`:

   ```sh
   npm start
   ```

La API escucha en `http://localhost:3000`. El endpoint
`GET /api/denuncias` consulta MongoDB y acepta `q`, `type`, `status`, `date`,
`sector`, `page` y `limit`. La búsqueda de texto solo considera identificador,
tipo, animal, título, sector y estado; descripción, ubicación detallada y
responsable no se exponen ni se incluyen en el índice de búsqueda público.
Texto y sector ignoran mayúsculas y tildes. Las fechas se filtran por día UTC
y los resultados se ordenan del más reciente al más antiguo.

Para consultar el estado propio desde la interfaz, envía
`POST /api/denuncias/{id}/estado` con `{"email":"..."}` o `{"phone":"..."}`.
El identificador debe tener el formato `DEN-AAAA-NNNN` o `RES-AAAA-NNNN`;
la API normaliza minúsculas y espacios exteriores, y rechaza formatos inválidos
antes de consultar MongoDB.
Si envías ambos contactos, ambos deben coincidir con los registrados. La
respuesta contiene únicamente el identificador, el estado actual y el
historial de cambios de estado. El correo y el teléfono se normalizan y se
guardan como HMAC; `CONTACT_LOOKUP_SECRET` debe ser privado y mantenerse
estable. Al crear denuncias, el backend debe asignar el contacto mediante los
campos virtuales `ownerEmail` o `ownerPhone`. En producción, protege esta
consulta y el resto de la API con HTTPS.

La API pública devuelve solo registros con `visibility: "public"` y limita sus
respuestas a identificador, tipo, animal, título, sector, fecha y estado. Los
registros privados quedan fuera del listado general; la consulta de estado
verifica por separado el identificador y el contacto del denunciante, y solo
devuelve el identificador, estado e historial. Las respuestas de `/api` llevan
`Cache-Control: no-store` para evitar que navegadores o proxies almacenen datos
de consultas.

Al actualizar una base existente, ejecuta una vez `npm run migrate:public-search`
desde `backend`, con `MONGODB_URI` apuntando a esa base. La migración reconstruye
los tokens públicos y elimina los antiguos tokens de descripción, ubicación y
responsable, además de sus índices.

## Preparar la interfaz

En otra terminal, instala y ejecuta el frontend:

```sh
cd frontend
npm ci
npm run dev
```

En desarrollo, Vite reenvía `/api` a `http://localhost:3000`. Para apuntar la
interfaz a otra API, configura `VITE_API_BASE_URL`; para cambiar el destino del
proxy local, configura `API_PROXY_TARGET`.

## Validación

Ejecuta las pruebas de búsqueda y consulta de estado del backend desde `backend`:

```sh
npm test
```