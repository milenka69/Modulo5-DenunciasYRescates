import express from 'express';
import { registrarDenuncia, obtenerDenuncias } from '../controllers/denunciaController.js';
import { requiereSesion } from '../server.js';

const router = express.Router();

router.get('/', requiereSesion('vecino', 'comunitario', 'funcionario'), obtenerDenuncias);
router.post('/', requiereSesion('vecino', 'comunitario'), registrarDenuncia);

export default router;