import React from 'react';
import { Send, BookOpen, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenTelegram: () => void;
  onGoHome: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTelegram, onGoHome }) => {
  return (
    <footer className="w-full bg-[#0d0d0d] border-t border-white/5 mt-auto pt-10 pb-8 text-stone-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Info with user icon */}
          <div>
            <div
              onClick={onGoHome}
              className="flex items-center gap-2.5 cursor-pointer select-none mb-3"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 bg-black shrink-0">
                <img
                  src="/logo.png"
                  alt="GB STUDY"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-syne font-black text-lg text-white">
                GB <span className="text-pink-500">STUDY</span>
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
              Your free online educational portal offering premium batches, high-definition video lectures, live classes, and practice PDF notes for Banking, SSC, and Government examinations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 font-syne">
              Quick Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onGoHome}
                  className="hover:text-pink-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> All Available Batches
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTelegram}
                  className="hover:text-pink-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#0088cc]" /> Telegram Channel (@GBFreestudy)
                </button>
              </li>
            </ul>
          </div>

          {/* Telegram Channel CTA */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-white font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-pink-400" />
                <span>Join Official Channel</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Stay updated with lecture notes, class schedules, and daily revision material.
              </p>
            </div>
            <a
              href="https://t.me/GBFreestudy"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0088cc] to-[#2aa6df] hover:from-[#007cb8] hover:to-[#2297cc] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5 fill-white" />
              Join @GBFreestudy
            </a>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <div>
            © {new Date().getFullYear()} GB STUDY. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Built for students with dedication</span>
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
