# HU-05 Asignar equipo de rescate (feat/hu-05-asignar-equipo-rescate)

Qué cambió respecto a la versión anterior:
- Se quitó todo lo de **denuncias** (backend/denuncias.js, su test y GET /api/denuncias). HU-05 solo usa denuncias a través de
  un adaptador mínimo: `backend/src/rescates/denunciasMongo.js` (buscar por id y cambiar estado).
- Las rutas /api/equipos y POST /api/denuncias/:id/rescates ahora viven en tu servidor, con sesión del núcleo y perfil **funcionario**.
- Los rescates se guardan en MongoDB (índices únicos parciales: un equipo y una denuncia activos como máximo).
- El animal (SIM-000001) se comprueba en el núcleo. Errores: { error: { codigo, mensaje } } con códigos en MAYÚSCULAS.

## Pasos (Git Bash, desde la raíz del repo, en tu rama)
    git checkout feat/hu-05-asignar-equipo-rescate
    # 1) Quitar lo viejo de HU-05 (si existen en tu rama)
    git rm -f backend/app.js backend/index.js backend/denuncias.js backend/denuncias.test.js backend/equipos.js backend/equipos.test.js backend/rescates.js backend/rescates.test.js backend/asignacion.http.test.js
    # 2) Copiar este zip encima (misma estructura): backend/src/**, backend/test/**, frontend/src/**, docs/PRUEBAS.md
    # 3) NO sobrescribas frontend/src/components/PaginaInicio.jsx (es de tu compañera; este zip no lo trae).
    #    Solo debe importar ./FormularioRescate.jsx, mostrar el botón solo a funcionario y pasar onVolver.
    cd backend && npm test
    cd ../frontend && node --test src/services/*.test.js

## Variables de entorno (backend)
    MONGODB_URI, FRONTEND_URL, NUCLEO_URL, NODE_ENV=production, TRUST_PROXY=1 (Render)
    NUCLEO_ANIMALES_PATH  (opcional, por defecto /api/registro/animales)

## Confirmado
1. Animales: GET {NUCLEO_URL}/api/registro/animales/{animalId} (200 existe, 404 no existe), con el token de la sesión en Bearer.
2. Colección `denuncias` con `id` numérico y `estado`.
3. GET /api/denuncias?size=100 lo provee el contrato de denuncias (otro módulo).
