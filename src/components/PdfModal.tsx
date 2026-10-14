import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

interface PdfModalProps {
  pdfUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const PdfModal: React.FC<PdfModalProps> = ({ pdfUrl, title = 'Class Notes & PDF', onClose }) => {
  if (!pdfUrl) return null;

  // Route through /pdf proxy if not already
  const proxiedUrl = pdfUrl.startsWith('/pdf') ? pdfUrl : `/pdf?url=${encodeURIComponent(pdfUrl)}`;

  const handleOpenNewTab = () => {
    window.open(proxiedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#121212] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-pop">
        
        {/* Header */}
        <div className="h-14 px-4 sm:px-6 bg-[#181818] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-white font-bold text-xs sm:text-sm truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Open full page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in New Tab</span>
              <span className="sm:hidden">Open</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close PDF viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Iframe or fallback */}
        <div className="flex-1 w-full bg-[#1a1a1a] relative">
          <iframe
            src={proxiedUrl}
            className="w-full h-full border-0"
            title={title}
          />
        </div>
      </div>
    </div>
  );
};
