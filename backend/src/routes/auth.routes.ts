import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";
import { createIpRateLimit } from "../middlewares/rateLimit";

const router = Router();
const loginRateLimit = createIpRateLimit({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  message: "Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos."
});

router.post("/login", loginRateLimit, login);
router.get("/me", requireAuth, me);
export default router;
