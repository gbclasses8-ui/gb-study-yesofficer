import React from 'react';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { Batch } from '../types.ts';

interface BatchCardProps {
  batch: Batch;
  isEnrolled: boolean;
  onToggleEnroll: (e: React.MouseEvent, id: string) => void;
  onOpenBatch: (batch: Batch) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  isEnrolled,
  onToggleEnroll,
  onOpenBatch,
}) => {
  const batchId = String(batch.id);

  return (
    <div
      onClick={() => onOpenBatch(batch)}
      className="group relative bg-[#121212] border border-white/5 hover:border-pink-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_-10px_rgba(0,0,0,0.8),0_0_20px_rgba(236,72,153,0.15)] flex flex-col cursor-pointer select-none"
    >
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#0a0a0a] border-b border-white/5">
        <img
          src={batch.thumbnail}
          alt={batch.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = '/logo.png';
          }}
          referrerPolicy="no-referrer"
        />

        {/* Gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />

        {/* FREE Badge */}
        <div className="absolute top-3 right-3 bg-pink-600/30 backdrop-blur-md border border-pink-500/40 px-2.5 py-0.5 rounded-md flex items-center justify-center z-10 shadow-sm">
          <span className="text-pink-300 text-[10px] font-black tracking-widest uppercase">
            FREE
          </span>
        </div>

        {/* Batch ID tag */}
        <div className="absolute bottom-2.5 left-3 text-[10px] font-mono font-bold text-stone-400 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
          ID: {batchId}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <h3 className="text-stone-200 font-bold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-pink-400 transition-colors">
            {batch.title}
          </h3>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          {/* Enroll / Enrolled Button in PINK */}
          <button
            onClick={(e) => onToggleEnroll(e, batchId)}
            className={`px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              isEnrolled
                ? 'bg-pink-950/70 text-pink-300 border border-pink-500/40 hover:bg-pink-900/70 shadow-sm'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_4px_16px_rgba(219,39,119,0.35)]'
            }`}
            title={isEnrolled ? 'Enrolled' : 'Enroll in this batch'}
          >
            {isEnrolled ? (
              <>
                <Check className="w-3.5 h-3.5 text-pink-400" />
                ENROLLED
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                ENROLL
              </>
            )}
          </button>

          {/* Let's Study Button in PINK */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenBatch(batch);
            }}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(225,29,72,0.35)] active:scale-95 cursor-pointer"
          >
            Let's Study
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
