import express from 'express';
import { registrarDenuncia } from '../controllers/denunciaController.js';

const router = express.Router();
router.post('/', registrarDenuncia);

export default router;