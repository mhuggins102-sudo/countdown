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

interface LiveRoundPicks {
  roundIndex: number;
  roundType: string;
  letters?: string[];
  numbers?: number[];
  target?: number;
}

interface LiveRoundSubmission {
  roundIndex: number;
  roundType: string;
  answer: string;
  score: number;
  steps?: { a: number; op: string; b: number; result: number }[];
  timeRemaining?: number;
}

interface LiveRoomRecord {
  seed: number;
  code: string;
  timerDuration: number;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
  p1Name: string;
  p1Id: string;
  p2Name?: string;
  p2Id?: string;
  currentRound: number;
  picks: LiveRoundPicks[];
  p1Results: (LiveRoundSubmission | null)[];
  p2Results: (LiveRoundSubmission | null)[];
  p1TotalScore: number;
  p2TotalScore: number;
  p1LastSeen: number;
  p2LastSeen: number;
}

interface ChallengeRoundResult {
  roundType: string;
  answer: string;
  score: number;
  steps?: { a: number; op: string; b: number; result: number }[];
  timeRemaining?: number;
  letters?: string[];
  numbers?: number[];
  target?: number;
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

    // Handle /api/live routes
    if (url.pathname.startsWith('/api/live')) {
      return handleLive(request, url, env);
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
        p1HeadToHeadScore?: number;
      };

      record.p2Name = body.playerName || 'Player 2';
      record.p2Results = body.results;
      record.p2TotalScore = body.totalScore;
      // P2 knows the correct head-to-head score for P1
      if (body.p1HeadToHeadScore != null) {
        record.p1TotalScore = body.p1HeadToHeadScore;
      }

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

async function handleLive(request: Request, url: URL, env: Env): Promise<Response> {
  const LIVE_TTL = 3600; // 1 hour

  // POST /api/live — Create a new live room
  if (request.method === 'POST' && url.pathname === '/api/live') {
    const body = await request.json() as {
      seed: number;
      code: string;
      timerDuration: number;
      playerName: string;
      playerId: string;
    };

    const record: LiveRoomRecord = {
      seed: body.seed,
      code: body.code,
      timerDuration: body.timerDuration,
      createdAt: Date.now(),
      status: 'waiting',
      p1Name: body.playerName || 'Player 1',
      p1Id: body.playerId,
      currentRound: 0,
      picks: [],
      p1Results: [],
      p2Results: [],
      p1TotalScore: 0,
      p2TotalScore: 0,
      p1LastSeen: Date.now(),
      p2LastSeen: 0,
    };

    await env.CHALLENGES.put(
      `live:${body.code}`,
      JSON.stringify(record),
      { expirationTtl: LIVE_TTL },
    );

    return json({ ok: true, code: body.code });
  }

  // PUT /api/live/:code/join — Join a live room
  const joinMatch = url.pathname.match(/^\/api\/live\/([A-Z0-9]{6})\/join$/);
  if (request.method === 'PUT' && joinMatch) {
    const code = joinMatch[1];
    const data = await env.CHALLENGES.get(`live:${code}`);
    if (!data) return json({ error: 'Room not found' }, 404);

    const record: LiveRoomRecord = JSON.parse(data);
    if (record.status !== 'waiting') {
      return json({ error: 'Room is not available' }, 409);
    }

    const body = await request.json() as {
      playerName: string;
      playerId: string;
    };

    record.p2Name = body.playerName || 'Player 2';
    record.p2Id = body.playerId;
    record.status = 'playing';
    record.p2LastSeen = Date.now();

    await env.CHALLENGES.put(
      `live:${code}`,
      JSON.stringify(record),
      { expirationTtl: LIVE_TTL },
    );

    return json({ ok: true, room: record });
  }

  // GET /api/live/:code — Poll room state (heartbeat via ?playerId=X)
  const getMatch = url.pathname.match(/^\/api\/live\/([A-Z0-9]{6})$/);
  if (request.method === 'GET' && getMatch) {
    const code = getMatch[1];
    const data = await env.CHALLENGES.get(`live:${code}`);
    if (!data) return json({ error: 'Room not found' }, 404);

    const record: LiveRoomRecord = JSON.parse(data);

    // Update heartbeat
    const playerId = url.searchParams.get('playerId');
    if (playerId) {
      let updated = false;
      if (playerId === record.p1Id) {
        record.p1LastSeen = Date.now();
        updated = true;
      } else if (playerId === record.p2Id) {
        record.p2LastSeen = Date.now();
        updated = true;
      }
      if (updated) {
        await env.CHALLENGES.put(
          `live:${code}`,
          JSON.stringify(record),
          { expirationTtl: LIVE_TTL },
        );
      }
    }

    return json(record);
  }

  // PUT /api/live/:code/picks — Submit picks for current round (either player, alternating)
  const picksMatch = url.pathname.match(/^\/api\/live\/([A-Z0-9]{6})\/picks$/);
  if (request.method === 'PUT' && picksMatch) {
    const code = picksMatch[1];
    const data = await env.CHALLENGES.get(`live:${code}`);
    if (!data) return json({ error: 'Room not found' }, 404);

    const record: LiveRoomRecord = JSON.parse(data);
    const body = await request.json() as {
      playerId: string;
      picks: LiveRoundPicks;
    };

    if (body.playerId !== record.p1Id && body.playerId !== record.p2Id) {
      return json({ error: 'Unknown player' }, 403);
    }

    // Add or replace picks for this round
    const existing = record.picks.findIndex((p) => p.roundIndex === body.picks.roundIndex);
    if (existing >= 0) {
      record.picks[existing] = body.picks;
    } else {
      record.picks.push(body.picks);
    }

    await env.CHALLENGES.put(
      `live:${code}`,
      JSON.stringify(record),
      { expirationTtl: LIVE_TTL },
    );

    return json({ ok: true });
  }

  // PUT /api/live/:code/submit — Submit round result (either player)
  const submitMatch = url.pathname.match(/^\/api\/live\/([A-Z0-9]{6})\/submit$/);
  if (request.method === 'PUT' && submitMatch) {
    const code = submitMatch[1];
    const data = await env.CHALLENGES.get(`live:${code}`);
    if (!data) return json({ error: 'Room not found' }, 404);

    const record: LiveRoomRecord = JSON.parse(data);
    const body = await request.json() as {
      playerId: string;
      result: LiveRoundSubmission;
    };

    const roundIdx = body.result.roundIndex;

    if (body.playerId === record.p1Id) {
      // Ensure array is big enough
      while (record.p1Results.length <= roundIdx) record.p1Results.push(null);
      record.p1Results[roundIdx] = body.result;
      record.p1TotalScore = record.p1Results
        .filter((r): r is LiveRoundSubmission => r !== null)
        .reduce((sum, r) => sum + r.score, 0);
    } else if (body.playerId === record.p2Id) {
      while (record.p2Results.length <= roundIdx) record.p2Results.push(null);
      record.p2Results[roundIdx] = body.result;
      record.p2TotalScore = record.p2Results
        .filter((r): r is LiveRoundSubmission => r !== null)
        .reduce((sum, r) => sum + r.score, 0);
    } else {
      return json({ error: 'Unknown player' }, 403);
    }

    // Check if both players submitted for this round
    const bothSubmitted = record.p1Results[roundIdx] !== null
      && record.p1Results[roundIdx] !== undefined
      && record.p2Results[roundIdx] !== null
      && record.p2Results[roundIdx] !== undefined;

    // Advance round if both submitted
    if (bothSubmitted) {
      record.currentRound = roundIdx + 1;
      // Check if game is over (15 rounds)
      if (record.currentRound >= 15) {
        record.status = 'finished';
      }
    }

    await env.CHALLENGES.put(
      `live:${code}`,
      JSON.stringify(record),
      { expirationTtl: LIVE_TTL },
    );

    return json({ ok: true, bothSubmitted });
  }

  return json({ error: 'Not found' }, 404);
}
