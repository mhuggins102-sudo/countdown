export function WaitingOverlay({ message }: { message?: string }) {
  return (
    <div className="bg-[#1a2d50]/80 border border-[#2a4a7f] rounded-xl p-4 w-full max-w-md text-center">
      <div className="flex items-center justify-center gap-3">
        <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-blue-300">{message || 'Waiting for opponent...'}</span>
      </div>
    </div>
  );
}
