import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-b border-amber-500/20 py-2 px-4 text-xs md:text-sm font-medium text-amber-300 flex items-center justify-center gap-2 backdrop-blur-md">
      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
      <span className="text-center">
        <strong className="font-semibold text-amber-200">DEMO SANDBOX REWARDS:</strong> Mobile recharges, UPI transfers & bank payouts run in sandbox simulation mode.
      </span>
      <span className="hidden sm:inline-block px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
        Demo Mode Active
      </span>
    </div>
  );
};
