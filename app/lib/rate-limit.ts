type RateLimitOptions = {
  limit: number;
  namespace: string;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function clientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "unknown";
}

function sweepExpired(now: number) {
  if (now - lastSweep < 60_000) {
    return;
  }
  lastSweep = now;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(request: Request, { limit, namespace, windowMs }: RateLimitOptions) {
  const now = Date.now();
  sweepExpired(now);

  const key = `${namespace}:${clientKey(request)}`;
  const existing = buckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + windowMs
        };

  bucket.count += 1;
  buckets.set(key, bucket);

  const retryAfter = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);
  const headers = {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(limit - bucket.count, 0)),
    "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000))
  };

  return {
    headers,
    limited: bucket.count > limit
  };
}

export function envInt(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
