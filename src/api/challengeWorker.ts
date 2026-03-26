/**
 * Cloudflare Worker API for challenge mode.
 * Handles creating, fetching, and completing challenge games.
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  CHALLENGES: KVNamespace;
}

interface ChallengeRoundResult {
  roundType: string;
  answer: string;
  score: number;
  steps?: { a: number; op: string; b: number; result: number }[];
  timeRemaining?: number;
}

interface ChallengeRecord {
  seed: number;
  code: string;
  timerDuration: number;
  createdAt: number;
  p1Name: string;
  p1Results: ChallengeRoundResult[];
  p1TotalScore: number;
  p2Name?: string;
  p2Results?: ChallengeRoundResult[];
  p2TotalScore?: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only handle /api/challenge routes
    if (!url.pathname.startsWith('/api/challenge')) {
      return new Response(null, { status: 404 });
    }

    // POST /api/challenge — Create a new challenge
    if (request.method === 'POST' && url.pathname === '/api/challenge') {
      const body = await request.json() as {
        seed: number;
        code: string;
        timerDuration: number;
        playerName: string;
        results: ChallengeRoundResult[];
        totalScore: number;
      };

      const record: ChallengeRecord = {
        seed: body.seed,
        code: body.code,
        timerDuration: body.timerDuration,
        createdAt: Date.now(),
        p1Name: body.playerName || 'Player 1',
        p1Results: body.results,
        p1TotalScore: body.totalScore,
      };

      // Store with 7-day TTL
      await env.CHALLENGES.put(
        `challenge:${body.code}`,
        JSON.stringify(record),
        { expirationTtl: 7 * 24 * 60 * 60 },
      );

      return json({ ok: true, code: body.code });
    }

    // GET /api/challenge/:code — Fetch a challenge
    const getMatch = url.pathname.match(/^\/api\/challenge\/([A-Z0-9]{6})$/);
    if (request.method === 'GET' && getMatch) {
      const code = getMatch[1];
      const data = await env.CHALLENGES.get(`challenge:${code}`);
      if (!data) {
        return json({ error: 'Challenge not found' }, 404);
      }
      return json(JSON.parse(data));
    }

    // PUT /api/challenge/:code — Complete a challenge (P2 submits results)
    const putMatch = url.pathname.match(/^\/api\/challenge\/([A-Z0-9]{6})$/);
    if (request.method === 'PUT' && putMatch) {
      const code = putMatch[1];
      const existing = await env.CHALLENGES.get(`challenge:${code}`);
      if (!existing) {
        return json({ error: 'Challenge not found' }, 404);
      }

      const record: ChallengeRecord = JSON.parse(existing);
      if (record.p2Results) {
        return json({ error: 'Challenge already completed' }, 409);
      }

      const body = await request.json() as {
        playerName: string;
        results: ChallengeRoundResult[];
        totalScore: number;
      };

      record.p2Name = body.playerName || 'Player 2';
      record.p2Results = body.results;
      record.p2TotalScore = body.totalScore;

      await env.CHALLENGES.put(
        `challenge:${code}`,
        JSON.stringify(record),
        { expirationTtl: 7 * 24 * 60 * 60 },
      );

      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  },
};
