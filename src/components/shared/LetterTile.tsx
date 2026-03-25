interface LetterTileProps {
  letter: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  index?: number;
}

export function LetterTile({
  letter,
  onClick,
  selected = false,
  disabled = false,
  size = 'md',
  animate = false,
  index = 0,
}: LetterTileProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        ${sizeClasses[size]}
        font-bold uppercase rounded-lg
        flex items-center justify-center
        transition-all duration-200
        ${selected
          ? 'bg-[#1a2d50]/50 text-[#1a2d50]/30 border-2 border-[#2a4a7f]/30 scale-95'
          : 'bg-gradient-to-b from-[#2a4a7f] to-[#1a2d50] text-white border-2 border-[#3b82f6]/40 shadow-lg hover:shadow-xl hover:border-[#3b82f6]/70'
        }
        ${disabled && !selected ? 'opacity-50 cursor-not-allowed' : ''}
        ${onClick && !disabled && !selected ? 'cursor-pointer active:scale-95' : ''}
        ${animate ? 'animate-tile-flip' : ''}
      `}
      style={animate ? { animationDelay: `${index * 100}ms` } : undefined}
    >
      {letter}
    </button>
  );
}
