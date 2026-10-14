import React from 'react';
import { Send, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const telegramUrl = 'https://t.me/GBFreestudy';

  const handleJoin = () => {
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#121212] border border-pink-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(236,72,153,0.15)] text-center animate-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="telegram-popup-title"
      >
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User's specified icon + Telegram Badge */}
        <div className="mx-auto flex items-center justify-center gap-3 mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-pink-500/40 bg-black shadow-[0_8px_25px_rgba(236,72,153,0.3)]">
            <img
              src="/logo.png"
              alt="GB STUDY"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#0088cc] flex items-center justify-center shadow-[0_8px_20px_rgba(0,136,204,0.4)]">
            <Send className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Header Text */}
        <h2 id="telegram-popup-title" className="text-xl sm:text-2xl font-black text-white font-syne tracking-tight mb-2">
          Join GB STUDY Telegram Channel
        </h2>

        <p className="text-stone-300 text-xs sm:text-sm mb-5 leading-relaxed font-normal">
          Get instant access to free classes, lecture notes, PDFs, latest batch updates, and exam preparation resources directly on Telegram!
        </p>

        {/* Key Highlights */}
        <div className="bg-black/50 border border-white/5 rounded-2xl p-3.5 mb-6 text-left space-y-2 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Daily Free Lecture Videos & Class Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Direct PDF downloads for all Batches</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Official <strong>@GBFreestudy</strong> community</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleJoin}
            className="w-full py-3 px-5 bg-gradient-to-r from-[#0088cc] to-[#25a3df] hover:from-[#0077b3] hover:to-[#1e96d1] text-white font-bold text-sm rounded-xl shadow-[0_8px_25px_rgba(0,136,204,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 fill-white" />
            Join Telegram
          </button>
          
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-6 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 font-semibold text-sm rounded-xl active:scale-95 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
