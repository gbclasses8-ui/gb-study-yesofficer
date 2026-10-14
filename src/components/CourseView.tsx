import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Folder,
  Play,
  FileText,
  Clock,
  Calendar,
  Share2,
  ChevronRight,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Search,
  ImageIcon,
} from 'lucide-react';
import { Batch, FolderItem } from '../types.ts';

interface CourseViewProps {
  batch: Batch;
  onBackToBatches: () => void;
  onPlayVideo: (courseId: string, videoId: string, videoTitle: string) => void;
  onOpenPdf: (pdfUrl: string, title?: string) => void;
  onShowToast: (msg: string) => void;
}

interface Crumb {
  id: string;
  title: string;
}

export const CourseView: React.FC<CourseViewProps> = ({
  batch,
  onBackToBatches,
  onPlayVideo,
  onOpenPdf,
  onShowToast,
}) => {
  const [navigationStack, setNavigationStack] = useState<Crumb[]>([
    { id: '-1', title: batch.title || 'Course Content' },
  ]);
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentFolder = navigationStack[navigationStack.length - 1];

  const fetchFolderContents = async (folderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = `/get/folder_contentsv3?course_id=${batch.id}&parent_id=${folderId}&start=0`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load contents (Status: ${res.status})`);
      }
      const json = await res.json();
      if (json && (json.status === 200 || json.data)) {
        setItems(json.data || []);
      } else {
        throw new Error(json?.message || 'Invalid API response');
      }
    } catch (err: any) {
      console.error('Folder fetch error:', err);
      setError(err?.message || 'Could not load folder contents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderContents(currentFolder.id);
  }, [currentFolder.id, batch.id]);

  const handleNavigateToFolder = (folderId: string, folderTitle: string) => {
    setSearchQuery('');
    setNavigationStack((prev) => [...prev, { id: folderId, title: folderTitle }]);
  };

  const handleJumpToCrumb = (index: number) => {
    setSearchQuery('');
    setNavigationStack((prev) => prev.slice(0, index + 1));
  };

  const handleGoBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack((prev) => prev.slice(0, -1));
    } else {
      onBackToBatches();
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        onShowToast('Course link copied to clipboard!');
      });
    }
  };

  const formatDuration = (durationText?: string, secsStr?: string) => {
    if (secsStr && parseInt(secsStr, 10) > 0) {
      let s = parseInt(secsStr, 10);
      const h = Math.floor(s / 3600);
      s %= 3600;
      const m = Math.floor(s / 60);
      s %= 60;
      return [h, m, s]
        .map((v) => (v < 10 ? `0${v}` : `${v}`))
        .filter((v, i) => v !== '00' || i > 0)
        .join(':');
    }
    if (durationText) {
      return durationText.replace('mins', ':').replace('secs', '').replace(' ', '').trim();
    }
    return '';
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr || dateStr === '0000-00-00 00:00:00') return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const title = (item.Title || '').toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-stone-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span>{navigationStack.length > 1 ? 'Previous Folder' : 'All Batches'}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-stone-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
          title="Share Course"
        >
          <Share2 className="w-3.5 h-3.5 text-pink-400" />
          <span className="hidden sm:inline">Share Batch</span>
        </button>
      </div>

      {/* Course Hero Banner */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#1c0d18] via-[#120a11] to-[#0a0a0a] p-3.5 sm:p-5 flex items-center gap-4 sm:gap-6 shadow-[0_10px_30px_-10px_rgba(236,72,153,0.15)]">
        <div className="w-24 sm:w-44 aspect-video rounded-xl overflow-hidden relative shadow-md shrink-0 border border-white/10 bg-black">
          <img
            src={batch.thumbnail}
            alt={batch.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase text-pink-400 tracking-wider mb-1.5">
            BATCH #{batch.id}
          </div>
          <h1 className="text-sm sm:text-lg md:text-xl font-black text-white font-syne tracking-tight leading-snug line-clamp-2">
            {batch.title}
          </h1>
          <p className="text-[11px] sm:text-xs text-stone-400 font-medium mt-1">
            Free high-definition lectures, live classes, class notes, and course modules
          </p>
        </div>
      </div>

      {/* Breadcrumb path */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto pb-3 text-xs font-bold text-stone-400 whitespace-nowrap hide-scroll">
        {navigationStack.map((crumb, idx) => {
          const isLast = idx === navigationStack.length - 1;
          return (
            <React.Fragment key={crumb.id + idx}>
              <button
                onClick={() => handleJumpToCrumb(idx)}
                className={`transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-white/5 truncate max-w-[160px] sm:max-w-[240px] ${
                  isLast
                    ? 'text-pink-400 pointer-events-none drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                    : 'text-stone-400 hover:text-white'
                }`}
                title={crumb.title}
              >
                {crumb.title}
              </button>
              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Search within course */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter lectures, notes or chapters in this folder..."
          className="w-full bg-[#121212] border border-white/10 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder:text-stone-500 focus:outline-none focus:border-pink-500/50 focus:bg-[#161616] transition-all"
        />
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="flex flex-col gap-3 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 sm:h-24 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#121212] border border-red-500/20 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Could not load folder contents</h3>
          <p className="text-stone-400 text-xs mb-4 max-w-sm">{error}</p>
          <button
            onClick={() => fetchFolderContents(currentFolder.id)}
            className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-md"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#121212]/50 border border-white/5 rounded-2xl p-6">
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-3">
            <Folder className="w-7 h-7 text-stone-600" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            {searchQuery ? 'No matching items found' : 'This folder is empty'}
          </h3>
          <p className="text-stone-500 text-xs">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'No videos, PDFs or subfolders available in this chapter.'}
          </p>
        </div>
      )}

      {/* Contents List */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const rawType = (item.material_type || '').toUpperCase();
            const title = item.Title || 'Untitled';
            const id = item.id;

            // FOLDER CARD
            if (rawType === 'FOLDER') {
              const counts: string[] = [];
              const vCount = Number(item.videos_count) || 0;
              const fCount = Number(item.files_count) || 0;
              const tCount = Number(item.tests_count) || 0;

              if (vCount > 0) counts.push(`${vCount} Video${vCount > 1 ? 's' : ''}`);
              if (fCount > 0) counts.push(`${fCount} PDF${fCount > 1 ? 's' : ''}`);
              if (tCount > 0) counts.push(`${tCount} Test${tCount > 1 ? 's' : ''}`);

              const countSummary = counts.length > 0 ? counts.join(' • ') : 'Open folder';

              return (
                <div
                  key={id}
                  onClick={() => handleNavigateToFolder(id, title)}
                  className="group bg-[#121212] hover:bg-[#181818] border border-white/5 hover:border-pink-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  {/* Folder Thumbnail or Icon */}
                  {item.thumbnail ? (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0">
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.png';
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                      <Folder className="w-6 h-6 text-pink-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-stone-100 truncate group-hover:text-pink-400 transition-colors">
                      {title}
                    </h3>
                    <p className="text-[11px] sm:text-xs font-semibold text-stone-400 mt-0.5">
                      {countSummary}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-white" />
                  </div>
                </div>
              );
            }

            // VIDEO CARD
            if (rawType === 'VIDEO') {
              const published = item.date_and_time || formatDateTime(item.event_date);
              const durationStr = formatDuration(item.duration, item.duration_in_secs);
              const isUpcoming = Number(item.live_status) === 2;
              const hasPdf = Boolean(item.pdf_link || item.pdf_link2);

              return (
                <div
                  key={id}
                  className="bg-[#121212] border border-white/5 hover:border-white/15 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3.5 sm:gap-4 transition-all duration-200 group"
                >
                  {/* Thumbnail / Duration */}
                  <div
                    onClick={() => !isUpcoming && onPlayVideo(item.course_id || batch.id.toString(), id, title)}
                    className={`w-full sm:w-44 aspect-video bg-black rounded-xl relative overflow-hidden shrink-0 border border-white/5 ${
                      !isUpcoming ? 'cursor-pointer' : ''
                    }`}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.png';
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#200d1c] to-[#0a0a0a]">
                        <Play className="w-8 h-8 text-pink-400 opacity-60" />
                      </div>
                    )}

                    {/* Duration badge */}
                    {durationStr && !isUpcoming && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {durationStr}
                      </div>
                    )}

                    {/* Hover play overlay */}
                    {!isUpcoming && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title and details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-xs sm:text-sm md:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-pink-400 transition-colors">
                        {title}
                      </h3>
                      {published && (
                        <p className="text-[11px] text-stone-500 font-medium mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{published}</span>
                        </p>
                      )}
                    </div>

                    {/* Action buttons with PINK colors */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                      {isUpcoming ? (
                        <span className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Upcoming Lecture
                        </span>
                      ) : (
                        <button
                          onClick={() => onPlayVideo(item.course_id || batch.id.toString(), id, title)}
                          className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-[0_4px_15px_rgba(225,29,72,0.35)] cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Watch Lecture
                        </button>
                      )}

                      {/* Notes / PDF button if available */}
                      {hasPdf && (
                        <button
                          onClick={() => {
                            const pdfLink = item.pdf_link || item.pdf_link2 || '';
                            onOpenPdf(pdfLink, `${title} - Notes`);
                          }}
                          className="bg-pink-950/50 hover:bg-pink-900/50 text-pink-300 border border-pink-500/30 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-pink-400" />
                          <span>Notes</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // PDF OR NOTES CARD
            if (rawType === 'PDF' || rawType === 'NOTES') {
              const pdfUrl = item.file_link || item.pdf_link || item.download_link || '';
              const published = formatDateTime(item.event_date);

              return (
                <div
                  key={id}
                  className="bg-[#121212] hover:bg-[#161616] border border-white/5 hover:border-pink-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                        {title}
                      </h3>
                      {published && (
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">{published}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenPdf(pdfUrl, title)}
                    className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <span>Open PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            // IMAGE / SCHEDULE CARD
            if (rawType === 'IMAGE') {
              return (
                <div
                  key={id}
                  className="bg-[#121212] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h3>
                      <p className="text-[11px] text-stone-500">Image Asset / Schedule</p>
                    </div>
                  </div>
                  {item.thumbnail && (
                    <button
                      onClick={() => window.open(item.thumbnail, '_blank')}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
