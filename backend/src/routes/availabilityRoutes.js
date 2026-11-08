import { Router } from 'express';
import { checkAvailability } from '../controllers/availabilityController.js';

const router = Router();

// Availability check (public / authenticated)
router.get('/', checkAvailability);

export default router;
