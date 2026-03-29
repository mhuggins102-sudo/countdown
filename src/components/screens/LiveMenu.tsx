import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { generateSeed, seedToCode } from '../../utils/seededRng';
import { createLiveRoom, joinLiveRoom, pollLiveRoom } from '../../api/liveApi';

type View = 'menu' | 'waiting';

function generatePlayerId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function LiveMenu({ onBack, timerDuration }: { onBack: () => void; timerDuration: number }) {
  const { dispatch } = useGame();
  const [view, setView] = useState<View>('menu');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const playerIdRef = useRef(generatePlayerId());
  const seedRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCreate = async () => {
    const name = playerName.trim() || 'Player 1';
    const seed = generateSeed();
    seedRef.current = seed;
    const code = seedToCode(seed);

    setLoading(true);
    setError('');

    try {
      await createLiveRoom({
        seed,
        code,
        timerDuration,
        playerName: name,
        playerId: playerIdRef.current,
      });

      setRoomCode(code);
      setView('waiting');
      setLoading(false);

      // Store playerId for reconnect
      sessionStorage.setItem('live_playerId', playerIdRef.current);
      sessionStorage.setItem('live_code', code);

      // Start polling for opponent to join
      pollRef.current = setInterval(async () => {
        const room = await pollLiveRoom(code, playerIdRef.current);
        if (room && room.status === 'playing') {
          if (pollRef.current) clearInterval(pollRef.current);
          dispatch({
            type: 'START_LIVE_HOST',
            seed,
            code,
            timerDuration,
            playerId: playerIdRef.current,
            playerName: name,
          });
        }
      }, 2000);
    } catch (err) {
      setError(`Could not create room: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) {
      setError('Enter a 6-character code');
      return;
    }

    const name = playerName.trim() || 'Player 2';
    setLoading(true);
    setError('');

    try {
      const result = await joinLiveRoom(code, {
        playerName: name,
        playerId: playerIdRef.current,
      });

      if ('error' in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const room = result.room;

      // Store for reconnect
      sessionStorage.setItem('live_playerId', playerIdRef.current);
      sessionStorage.setItem('live_code', code);

      dispatch({
        type: 'START_LIVE_JOIN',
        seed: room.seed,
        code: room.code,
        timerDuration: room.timerDuration,
        playerId: playerIdRef.current,
        playerName: name,
        opponentName: room.p1Name || 'Player 1',
      });
    } catch {
      setError('Could not connect. Try again.');
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}?live=${roomCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Waiting room for host
  if (view === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
        <h1 className="text-3xl font-bold text-white">Waiting for Opponent</h1>

        <div className="bg-[#1a2d50] rounded-xl p-6 w-full max-w-sm text-center">
          <div className="text-sm text-blue-400 mb-2">Room Code</div>
          <div className="text-4xl font-mono font-bold text-[#fbbf24] tracking-[0.3em] mb-4">
            {roomCode}
          </div>
          <Button variant="primary" size="lg" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-300">Waiting for someone to join...</span>
        </div>

        <Button variant="secondary" onClick={() => {
          if (pollRef.current) clearInterval(pollRef.current);
          setView('menu');
        }}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <h1 className="text-4xl font-bold text-white">Live Game</h1>
      <p className="text-blue-300 text-sm -mt-4">Play simultaneously against a friend</p>

      {/* Name input */}
      <div className="w-full max-w-sm">
        <label className="text-sm text-blue-400 mb-1 block">Your Name</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value.slice(0, 15))}
          placeholder="Enter your name"
          maxLength={15}
          className="w-full bg-[#0a1628] border border-[#2a4a7f] rounded-lg px-3 py-3 text-white text-center focus:border-[#3b82f6] focus:outline-none"
        />
      </div>

      {/* Create room */}
      <div className="w-full max-w-sm">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group disabled:opacity-50"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Create Room</div>
          <div className="text-sm text-blue-300 mt-1">
            Host a game and invite a friend to join
          </div>
        </button>
      </div>

      {/* Join room */}
      <div className="w-full max-w-sm">
        <div className="bg-[#1a2d50] border border-[#2a4a7f] rounded-xl p-5">
          <div className="text-xl font-bold text-white mb-3">Join Room</div>
          <div className="text-sm text-blue-300 mb-3">
            Enter a room code to join a live game
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                setError('');
              }}
              placeholder="ABC123"
              maxLength={6}
              className="min-w-0 flex-1 bg-[#0a1628] border border-[#2a4a7f] rounded-lg px-3 py-3 text-white text-center text-xl font-mono tracking-wider placeholder:text-blue-400/30 focus:border-[#3b82f6] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <Button
              variant="primary"
              size="lg"
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || loading}
            >
              {loading ? '...' : 'Join'}
            </Button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>

      <Button variant="secondary" onClick={onBack}>
        Back to Menu
      </Button>
    </div>
  );
}
