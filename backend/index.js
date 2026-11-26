
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import rescatesRoutes from './routes/rescates.js';

const app = express();
const PORT = 3000;

// Conexión a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/tenencia_rescates')
  .then(() => {
    console.log('Conectado a MongoDB correctamente');
  })
  .catch((error) => {
    console.error('Error al conectar con MongoDB:', error);
  });

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api/rescates', rescatesRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del módulo de Denuncias y Rescates funcionando'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
