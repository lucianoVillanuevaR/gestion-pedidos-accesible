import { NextFunction, Request, Response } from "express";

type RateLimitEntry = { count: number; resetAt: number };

type FailedLoginRateLimitOptions = {
  maxFailures: number;
  message: string;
  now?: () => number;
  windowMs: number;
};

export function createFailedLoginRateLimit({
  maxFailures,
  message,
  now = Date.now,
  windowMs
}: FailedLoginRateLimitOptions) {
  const attempts = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const currentTime = now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const current = attempts.get(ip);

    if (current?.resetAt && current.resetAt <= currentTime) attempts.delete(ip);
    const active = attempts.get(ip);
    if (active && active.count >= maxFailures) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((active.resetAt - currentTime) / 1000))));
      return res.status(429).json({ error: message });
    }

    res.once("finish", () => {
      if (res.statusCode === 401) {
        const previous = attempts.get(ip);
        attempts.set(ip, {
          count: (previous?.count ?? 0) + 1,
          resetAt: previous?.resetAt ?? now() + windowMs
        });
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        attempts.delete(ip);
      }
    });

    return next();
  };
}
