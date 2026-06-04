import { logger } from "./logger";

// Mapeia erros técnicos para mensagens amigáveis ao usuário
function sanitizePixError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("json") || lower.includes("syntaxerror") ||
    lower.includes("unexpected end") || lower.includes("unexpected token") ||
    lower.includes("timeout") || lower.includes("econnreset") ||
    lower.includes("econnrefused") || lower.includes("enotfound") ||
    lower.includes("network") || lower.includes("fetch") ||
    lower.includes("html") || lower.includes("sobrecarregado") ||
    lower.includes("instável") || lower.includes("incompleta")
  ) {
    return "Serviço de pagamento temporariamente indisponível. Aguarde alguns instantes e tente novamente.";
  }
  return raw;
}

const MAX_CONCURRENT  = 5;
const IDEMPOTENCY_TTL = 5 * 60_000;   // 5 min — cache de resultado final
const JOB_TTL         = 15 * 60_000;  // 15 min — job fica na memória

// ── Tipos ─────────────────────────────────────────────────────────────────

interface Waiter { resolve: () => void; }

interface CacheEntry { result: unknown; expiresAt: number; }

export interface JobEntry<T = unknown> {
  status:    "pending" | "done" | "error";
  result?:   T;
  error?:    string;
  createdAt: number;
}

// ── Classe principal ───────────────────────────────────────────────────────

class PixQueue {
  private running = 0;
  private readonly waiters: Waiter[]                  = [];
  private readonly cache   = new Map<string, CacheEntry>();
  private readonly jobs    = new Map<string, JobEntry>();
  private readonly pending = new Map<string, string>(); // idempotencyKey → jobId

  // ── Concorrência ──────────────────────────────────────────────────────────

  private acquire(): Promise<void> {
    if (this.running < MAX_CONCURRENT) {
      this.running++;
      return Promise.resolve();
    }
    // Sem timeout — background jobs esperam indefinidamente por um slot
    return new Promise<void>((resolve) => {
      this.waiters.push({ resolve });
      logger.info(
        { running: this.running, queued: this.waiters.length },
        "PIX enfileirado — aguardando slot"
      );
    });
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) {
      next.resolve(); // running não muda — slot passou direto pro próximo
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

  // ── Idempotência — resultado final ─────────────────────────────────────────

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.cache.delete(key); return null; }
    return entry.result as T;
  }

  setCache(key: string, result: unknown): void {
    this.cache.set(key, { result, expiresAt: Date.now() + IDEMPOTENCY_TTL });
    setTimeout(() => this.cache.delete(key), IDEMPOTENCY_TTL + 1_000);
  }

  // ── Idempotência — job pendente (evita criar 2 PIX no retry) ──────────────

  setPending(key: string, jobId: string): void { this.pending.set(key, jobId); }
  getPending(key: string): string | null        { return this.pending.get(key) ?? null; }
  clearPending(key: string): void               { this.pending.delete(key); }

  // ── Background jobs ────────────────────────────────────────────────────────

  submitJob<T>(fn: () => Promise<T>, onDone?: (result: T) => void): string {
    const jobId = `pjob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.jobs.set(jobId, { status: "pending", createdAt: Date.now() });
    setTimeout(() => this.jobs.delete(jobId), JOB_TTL);

    // Executa em background — HTTP response já foi enviado com o job_id
    this.run(fn)
      .then((result) => {
        const e = this.jobs.get(jobId);
        if (e) { e.status = "done"; e.result = result; }
        onDone?.(result);
        logger.info({ jobId }, "PIX background job concluído");
      })
      .catch((err) => {
        const e = this.jobs.get(jobId);
        const raw = err instanceof Error ? err.message : String(err);
        // Loga o erro técnico COMPLETO no Railway antes de sanitizar
        logger.error({ jobId, rawError: raw }, "PIX background job falhou — erro técnico completo");
        if (e) {
          e.status = "error";
          e.error = sanitizePixError(raw);
        }
      });

    logger.info({ jobId, running: this.running, queued: this.waiters.length }, "PIX job submetido em background");
    return jobId;
  }

  getJob<T>(jobId: string): JobEntry<T> | null {
    return (this.jobs.get(jobId) as JobEntry<T>) ?? null;
  }

  get stats() {
    return { running: this.running, queued: this.waiters.length, cached: this.cache.size, jobs: this.jobs.size };
  }
}

export const pixQueue = new PixQueue();
