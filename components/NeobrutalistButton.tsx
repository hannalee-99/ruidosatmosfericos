
import React from 'react';
import { COLORS, NEOBRUTALIST_BORDER, NEOBRUTALIST_SHADOW } from '../constants';

interface NeobrutalistButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'white' | 'matrix';
}

const NeobrutalistButton: React.FC<NeobrutalistButtonProps> = ({ 
  children, 
  onClick, 
  className = '',
  variant = 'white'
}) => {
  // Uso de variáveis CSS para adaptação automática ao tema
  const bg = variant === 'matrix' ? 'var(--accent)' : COLORS.white;
  const color = variant === 'matrix' ? 'var(--btn-text)' : COLORS.black;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-8 py-3 
        font-mono font-bold text-lg tracking-tighter
        transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        ${className}
      `}
      style={{
        backgroundColor: bg,
        border: NEOBRUTALIST_BORDER,
        boxShadow: NEOBRUTALIST_SHADOW,
        borderRadius: '30px', 
        color: color
      }}
    >
      {children}
    </button>
  );
};

export default NeobrutalistButton;
