import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";
import { createFailedLoginRateLimit } from "../middlewares/rateLimit";

const router = Router();
const loginRateLimit = createFailedLoginRateLimit({
  maxFailures: 10,
  windowMs: 15 * 60 * 1000,
  message: "Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos."
});

router.post("/login", loginRateLimit, asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
export default router;
