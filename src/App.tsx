import { GameProvider } from './state/GameContext';
import { GameApp } from './GameApp';
import { useDictionary } from './hooks/useDictionary';

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-4xl font-bold">
        <span className="text-[#3b82f6]">COUNT</span>
        <span className="text-[#fbbf24]">DOWN</span>
      </div>
      <div className="w-12 h-12 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
      <p className="text-blue-300">Loading dictionary...</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold text-red-400">Error Loading Dictionary</h1>
      <p className="text-blue-300">{message}</p>
      <p className="text-blue-400 text-sm">Make sure dictionary.txt is in the public folder.</p>
    </div>
  );
}

function AppContent() {
  const { loaded, error } = useDictionary();

  if (error) return <ErrorScreen message={error} />;
  if (!loaded) return <LoadingScreen />;

  return <GameApp />;
}

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-screen">
        <AppContent />
      </div>
    </GameProvider>
  );
}
