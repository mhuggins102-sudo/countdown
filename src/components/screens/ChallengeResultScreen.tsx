import { Button } from '../shared/Button';

interface ChallengeResultProps {
  code: string;
  p1Name: string;
  p1Score: number;
  p2Name: string;
  p2Score: number;
  onBack: () => void;
}

export function ChallengeResultScreen({ code, p1Name, p1Score, p2Name, p2Score, onBack }: ChallengeResultProps) {
  const p1Won = p1Score > p2Score;
  const tied = p1Score === p2Score;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      <div className="text-sm text-blue-400 font-mono tracking-wider">{code}</div>

      <div className="text-center">
        <h1 className={`text-4xl md:text-5xl font-extrabold ${
          tied ? 'text-[#fbbf24]' : 'text-white'
        }`}>
          {tied ? 'Draw!' : `${p1Won ? p1Name : p2Name} Wins!`}
        </h1>
      </div>

      <div className="flex gap-8 items-center">
        <div className="text-center">
          <div className="text-sm text-blue-300 uppercase">{p1Name}</div>
          <div className={`text-5xl font-bold tabular-nums ${
            !tied && p1Won ? 'text-green-400' : 'text-white'
          }`}>{p1Score}</div>
        </div>
        <div className="text-2xl text-blue-400">vs</div>
        <div className="text-center">
          <div className="text-sm text-blue-300 uppercase">{p2Name}</div>
          <div className={`text-5xl font-bold tabular-nums ${
            !tied && !p1Won ? 'text-green-400' : 'text-white'
          }`}>{p2Score}</div>
        </div>
      </div>

      <div className="mt-4">
        <Button variant="gold" size="lg" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
