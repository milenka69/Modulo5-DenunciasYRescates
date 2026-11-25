import express from 'express';
import { registrarDenuncia, obtenerDenuncias } from '../controllers/denunciaController.js';

const router = express.Router();
router.get('/', obtenerDenuncias);
router.post('/', registrarDenuncia);

export default router;