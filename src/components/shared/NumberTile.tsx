interface NumberTileProps {
  number: number;
  isLarge?: boolean;
  animate?: boolean;
  index?: number;
}

export function NumberTile({ number, isLarge = false, animate = false, index = 0 }: NumberTileProps) {
  return (
    <div
      className={`
        w-16 h-16 rounded-lg font-bold text-2xl
        flex items-center justify-center
        border-2 shadow-lg
        ${isLarge
          ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-[#0a1628] border-[#fbbf24]/60'
          : 'bg-gradient-to-b from-[#2a4a7f] to-[#1a2d50] text-white border-[#3b82f6]/40'
        }
        ${animate ? 'animate-tile-flip' : ''}
      `}
      style={animate ? { animationDelay: `${index * 100}ms` } : undefined}
    >
      {number}
    </div>
  );
}
