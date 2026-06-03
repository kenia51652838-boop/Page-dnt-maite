import { logger } from "./logger";

const MAX_CONCURRENT    = 5;               // chamadas simultâneas máximas à Lumina
const QUEUE_TIMEOUT_MS  = 30_000;          // tempo máximo na fila (30s)
const IDEMPOTENCY_TTL   = 5 * 60_000;      // cache de resultado: 5 minutos

interface Waiter {
  resolve: () => void;
  reject:  (err: Error) => void;
  timer:   ReturnType<typeof setTimeout>;
}

interface CacheEntry {
  result:    unknown;
  expiresAt: number;
}

class PixQueue {
  private running = 0;
  private readonly waiters: Waiter[] = [];
  private readonly cache   = new Map<string, CacheEntry>();

  // ── Limiter de concorrência ──────────────────────────────────────────────

  private acquire(): Promise<void> {
    if (this.running < MAX_CONCURRENT) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.findIndex(w => w.resolve === resolve);
        if (idx !== -1) this.waiters.splice(idx, 1);
        reject(new Error(
          "Servidor ocupado com muitas solicitações simultâneas. " +
          "Aguarde alguns segundos e tente novamente."
        ));
      }, QUEUE_TIMEOUT_MS);
      this.waiters.push({ resolve, reject, timer });
      logger.info({ running: this.running, queued: this.waiters.length }, "PIX enfileirado");
    });
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) {
      clearTimeout(next.timer);
      next.resolve();
      // running não muda — passou direto pro próximo
    } else {
      this.running--;
    }
    logger.info({ running: this.running, queued: this.waiters.length }, "PIX slot liberado");
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  // ── Cache de idempotência ────────────────────────────────────────────────

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.result as T;
  }

  setCache(key: string, result: unknown): void {
    this.cache.set(key, { result, expiresAt: Date.now() + IDEMPOTENCY_TTL });
    setTimeout(() => this.cache.delete(key), IDEMPOTENCY_TTL + 1_000);
  }

  get stats() {
    return { running: this.running, queued: this.waiters.length, cached: this.cache.size };
  }
}

export const pixQueue = new PixQueue();
