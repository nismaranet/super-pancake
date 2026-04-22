// components/ui/RankBadge.tsx
import React from 'react';

interface RankBadgeProps {
  sr: number;
  className?: string; // Opsional: jika kamu mau nambahin class tambahan dari luar
}

// Ekspor fungsinya juga kalau-kalau kamu butuh data mentahnya di tempat lain
export const getRankDetails = (sr: number) => {
  if (sr >= 10)
    return {
      label: 'ELITE',
      color: 'text-yellow-500',
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/5',
    };
  if (sr >= 7)
    return {
      label: 'PRO',
      color: 'text-[var(--accent)]',
      border: 'border-[var(--accent)]',
      bg: 'bg-[var(--accent)]/5',
    };
  if (sr >= 5)
    return {
      label: 'SEMI-PRO',
      color: 'text-blue-500',
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/5',
    };
  if (sr >= 2)
    return {
      label: 'AMATEUR',
      color: 'text-emerald-500',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/5',
    };
  return {
    label: 'ROOKIE',
    color: 'text-[var(--muted)]',
    border: 'border-[var(--card-border)]',
    bg: 'bg-[var(--card)]',
  };
};

export default function RankBadge({ sr, className = '' }: RankBadgeProps) {
  const { label, color, border, bg } = getRankDetails(sr || 0);

  return (
    <div
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md border ${color} ${border} ${bg} ${className}`}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
