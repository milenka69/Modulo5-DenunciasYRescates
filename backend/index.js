import app from "./app.js";

// El proxy de Vite (frontend/vite.config.js) envía /api al puerto 4000.
const puerto = process.env.PORT || 4000;
app.listen(puerto, () => console.log(`API en http://localhost:${puerto}`));
