import "server-only";

/**
 * Minimal IGDB API client (https://api-docs.igdb.com).
 *
 * SERVER-ONLY: uses the Twitch Client Secret. Never import from client
 * components. Kept free of Next.js imports so scripts can use it too.
 *
 * - App access token via Twitch client-credentials, cached until expiry.
 * - Respects IGDB's limit of 4 requests/second (and backs off on 429).
 */

export interface IgdbCredentials {
  clientId: string;
  clientSecret: string;
}

export class IgdbError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const API_URL = "https://api.igdb.com/v4";
const MAX_PER_SECOND = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class IgdbClient {
  private token: { value: string; expiresAt: number } | null = null;
  private tokenPromise: Promise<string> | null = null;
  private recent: number[] = [];
  private readonly creds: IgdbCredentials;

  constructor(creds: IgdbCredentials) {
    if (!creds.clientId || !creds.clientSecret) throw new IgdbError("IGDB credentials are missing.");
    this.creds = creds;
  }

  private async getToken(force = false): Promise<string> {
    if (!force && this.token && Date.now() < this.token.expiresAt) return this.token.value;
    if (!force && this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = (async () => {
      const body = new URLSearchParams({
        client_id: this.creds.clientId,
        client_secret: this.creds.clientSecret,
        grant_type: "client_credentials",
      });
      const res = await fetch(TOKEN_URL, { method: "POST", body });
      if (!res.ok) throw new IgdbError(`Twitch token request failed (${res.status}).`, res.status);
      const json = (await res.json()) as { access_token: string; expires_in: number };
      // Refresh a day early.
      this.token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 86_400) * 1000 };
      return json.access_token;
    })().finally(() => {
      this.tokenPromise = null;
    });
    return this.tokenPromise;
  }

  /** Simple sliding-window limiter: at most 4 requests started per second. */
  private async throttle() {
    for (;;) {
      const now = Date.now();
      this.recent = this.recent.filter((t) => now - t < 1000);
      if (this.recent.length < MAX_PER_SECOND) {
        this.recent.push(now);
        return;
      }
      await sleep(1000 - (now - this.recent[0]) + 5);
    }
  }

  /** Run an Apicalypse query, e.g. query("games", "fields name; limit 10;"). */
  async query<T>(endpoint: string, body: string, attempt = 0): Promise<T[]> {
    await this.throttle();
    const token = await this.getToken(attempt > 0 && attempt % 2 === 1);
    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Client-ID": this.creds.clientId,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body,
    });
    if (res.status === 401 && attempt < 1) return this.query<T>(endpoint, body, attempt + 1);
    if (res.status === 429 && attempt < 5) {
      await sleep(500 * 2 ** attempt);
      return this.query<T>(endpoint, body, attempt + 2);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new IgdbError(`IGDB ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`, res.status);
    }
    return (await res.json()) as T[];
  }
}

let shared: IgdbClient | null = null;

/** Client from IGDB_CLIENT_ID / IGDB_CLIENT_SECRET, or null when not configured. */
export function getIgdbClient(): IgdbClient | null {
  const clientId = process.env.IGDB_CLIENT_ID ?? "";
  const clientSecret = process.env.IGDB_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) return null;
  shared ??= new IgdbClient({ clientId, clientSecret });
  return shared;
}
