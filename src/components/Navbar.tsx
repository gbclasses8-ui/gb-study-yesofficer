import React from 'react';
import { BookOpen, Bookmark, Send, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  currentTab: 'batches' | 'enrolled';
  onSelectTab: (tab: 'batches' | 'enrolled') => void;
  enrolledCount: number;
  onOpenTelegram: () => void;
  activeBatchTitle?: string | null;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  enrolledCount,
  onOpenTelegram,
  activeBatchTitle,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between gap-3">
        
        {/* Left: Logo or Back Button */}
        <div className="flex items-center gap-3">
          {activeBatchTitle ? (
            <button
              onClick={onGoHome}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/5 border border-white/10 text-stone-300 hover:text-white hover:bg-white/10 hover:border-pink-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title="Back to Batches"
            >
              <ArrowLeft className="w-5 h-5 text-pink-400" />
            </button>
          ) : null}

          <div
            onClick={onGoHome}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            {/* User's specified icon */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/15 bg-black shadow-[0_0_15px_rgba(236,72,153,0.2)] group-hover:border-pink-500/50 transition-all shrink-0">
              <img
                src="/logo.png"
                alt="GB STUDY"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-syne font-black text-lg sm:text-xl tracking-wider text-white leading-none">
                GB <span className="text-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.4)]">STUDY</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mt-0.5">
                Free Education Portal
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Nav items */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!activeBatchTitle && (
            <nav className="hidden md:flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onSelectTab('batches')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === 'batches'
                    ? 'bg-[#222222] text-white border border-white/15 shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-stone-300" />
                Latest Batches
              </button>
              
              <button
                onClick={() => onSelectTab('enrolled')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === 'enrolled'
                    ? 'bg-[#222222] text-white border border-white/15 shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-stone-300" />
                My Enrollments
                {enrolledCount > 0 && (
                  <span className="bg-pink-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {enrolledCount}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* Telegram Action Button */}
          <button
            onClick={onOpenTelegram}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#0088cc] to-[#2aa6df] hover:from-[#007cb8] hover:to-[#2297cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_4px_15px_rgba(0,136,204,0.3)] transition-all cursor-pointer active:scale-95"
            title="Join Official Telegram"
          >
            <Send className="w-3.5 h-3.5 fill-white shrink-0" />
            <span className="hidden sm:inline">Join Telegram</span>
            <span className="sm:hidden text-xs">Telegram</span>
          </button>
        </div>
      </div>
    </header>
  );
};
