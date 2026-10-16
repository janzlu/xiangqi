import React from 'react';
import { Position } from '../../types/chess';

interface MoveMarkerProps {
  type: 'valid-empty' | 'valid-capture' | 'last-from' | 'last-to' | 'check' | 'hint';
  pos: Position;
}

export const MoveMarker: React.FC<MoveMarkerProps> = React.memo(({ type }) => {
  switch (type) {
    case 'valid-empty':
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-4 h-4 rounded-full bg-emerald-500/80 shadow-md ring-2 ring-emerald-300 animate-pulse" />
        </div>
      );

    case 'valid-capture':
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-[88%] h-[88%] rounded-full border-4 border-red-500/80 bg-red-400/20 shadow-lg animate-pulse" />
        </div>
      );

    case 'last-from':
      return (
        <div className="absolute inset-1 border-2 border-dashed border-amber-500/70 rounded-full pointer-events-none z-10" />
      );

    case 'last-to':
      return (
        <div className="absolute inset-0 border-2 border-amber-500 rounded-full bg-amber-400/15 pointer-events-none z-10 shadow-sm" />
      );

    case 'check':
      return (
        <div className="absolute -inset-1 rounded-full bg-red-600/30 border-2 border-red-600 animate-ping pointer-events-none z-30" />
      );

    case 'hint':
      return (
        <div className="absolute inset-0 border-4 border-emerald-400 rounded-full bg-emerald-300/20 shadow-xl pointer-events-none z-25 animate-bounce" />
      );

    default:
      return null;
  }
});
