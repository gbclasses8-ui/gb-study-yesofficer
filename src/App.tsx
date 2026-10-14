import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Bookmark,
  FolderOpen,
  Send,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Batch } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { BatchCard } from './components/BatchCard.tsx';
import { CourseView } from './components/CourseView.tsx';
import { VideoPlayerView } from './components/VideoPlayerView.tsx';
import { PdfModal } from './components/PdfModal.tsx';
import { TelegramModal } from './components/TelegramModal.tsx';
import { Footer } from './components/Footer.tsx';

const ITEMS_PER_PAGE = 12;

export default function App() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<'batches' | 'enrolled'>('batches');
  const [displayedCount, setDisplayedCount] = useState<number>(ITEMS_PER_PAGE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active views
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [activeVideo, setActiveVideo] = useState<{
    courseId: string;
    videoId: string;
    videoTitle: string;
  } | null>(null);
  const [activePdf, setActivePdf] = useState<{ url: string; title?: string } | null>(null);

  // Telegram popup - opens on website launch as requested
  const [showTelegramModal, setShowTelegramModal] = useState<boolean>(true);

  // Enrolled list in localStorage
  const [enrolledIds, setEnrolledIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gbstudy_enrolled') || localStorage.getItem('studybee_wishlist');
      return saved ? JSON.parse(saved).map(String) : [];
    } catch {
      return [];
    }
  });

  // Save enrollments
  useEffect(() => {
    try {
      localStorage.setItem('gbstudy_enrolled', JSON.stringify(enrolledIds));
    } catch (e) {
      console.error('Error saving enrollments:', e);
    }
  }, [enrolledIds]);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Fetch batches.json
  useEffect(() => {
    async function fetchBatchesData() {
      setLoading(true);
      try {
        const res = await fetch('/batches.json');
        if (!res.ok) throw new Error('Failed to load batches');
        const data = await res.json();
        const all = [...(data.new || []), ...(data.old || [])];
        setBatches(all);

        // Check URL parameters for direct deep linking
        const params = new URLSearchParams(window.location.search);
        const urlCourseId = params.get('course_id') || params.get('id');
        const urlVideoId = params.get('video_id');

        if (urlCourseId) {
          const matched = all.find((b: Batch) => String(b.id) === String(urlCourseId));
          if (matched) {
            setSelectedBatch(matched);
            if (urlVideoId) {
              setActiveVideo({
                courseId: String(urlCourseId),
                videoId: String(urlVideoId),
                videoTitle: 'Lecture Video',
              });
            }
          }
        }
      } catch (err) {
        console.error('Error loading batches.json:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBatchesData();
  }, []);

  // Listen to browser Back button (PopState)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlCourseId = params.get('course_id') || params.get('id');
      const urlVideoId = params.get('video_id');

      if (!urlCourseId) {
        setSelectedBatch(null);
        setActiveVideo(null);
      } else if (!urlVideoId) {
        setActiveVideo(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toggle enroll batch
  const handleToggleEnroll = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const batchId = String(id);
    if (enrolledIds.includes(batchId)) {
      setEnrolledIds((prev) => prev.filter((i) => i !== batchId));
      showToast('Removed from My Enrollments');
    } else {
      setEnrolledIds((prev) => [...prev, batchId]);
      showToast('Enrolled in Batch successfully!');
    }
  };

  // Open Batch details
  const handleOpenBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setActiveVideo(null);
    const newUrl = `?course_id=${batch.id}`;
    window.history.pushState({ courseId: batch.id }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to home / all batches
  const handleGoHome = () => {
    setSelectedBatch(null);
    setActiveVideo(null);
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Video Player (Single Unified Player)
  const handlePlayVideo = (courseId: string, videoId: string, videoTitle: string) => {
    setActiveVideo({ courseId, videoId, videoTitle });
    const newUrl = `?course_id=${courseId}&video_id=${videoId}`;
    window.history.pushState({ courseId, videoId }, '', newUrl);
  };

  // Back from Video Player to Course View
  const handleBackFromVideo = () => {
    setActiveVideo(null);
    if (selectedBatch) {
      window.history.pushState({ courseId: selectedBatch.id }, '', `?course_id=${selectedBatch.id}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  // Filter batches based on tab and search
  const filteredBatches = useMemo(() => {
    let list = batches;
    if (currentTab === 'enrolled') {
      list = batches.filter((b) => enrolledIds.includes(String(b.id)));
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((b) => {
      const titleMatch = (b.title || '').toLowerCase().includes(query);
      const idMatch = String(b.id).includes(query);
      return titleMatch || idMatch;
    });
  }, [batches, currentTab, enrolledIds, searchQuery]);

  const visibleBatches = filteredBatches.slice(0, displayedCount);
  const hasMore = displayedCount < filteredBatches.length;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-pink-950/90 border border-pink-700 text-pink-200 text-xs sm:text-sm font-semibold shadow-2xl animate-pop">
          <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Telegram Modal */}
      <TelegramModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
      />

      {/* PDF Notes Modal */}
      {activePdf && (
        <PdfModal
          pdfUrl={activePdf.url}
          title={activePdf.title}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* Single Unified Video Player View */}
      {activeVideo && (
        <VideoPlayerView
          courseId={activeVideo.courseId}
          videoId={activeVideo.videoId}
          videoTitle={activeVideo.videoTitle}
          onBack={handleBackFromVideo}
          onOpenPdf={(url, title) => setActivePdf({ url, title })}
        />
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setDisplayedCount(ITEMS_PER_PAGE);
          setSelectedBatch(null);
          setActiveVideo(null);
        }}
        enrolledCount={enrolledIds.length}
        onOpenTelegram={() => setShowTelegramModal(true)}
        activeBatchTitle={selectedBatch ? selectedBatch.title : null}
        onGoHome={handleGoHome}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16">
        {selectedBatch ? (
          /* Course Chapters & Lectures View */
          <CourseView
            batch={selectedBatch}
            onBackToBatches={handleGoHome}
            onPlayVideo={handlePlayVideo}
            onOpenPdf={(url, title) => setActivePdf({ url, title })}
            onShowToast={showToast}
          />
        ) : (
          /* Homepage: Batches Catalog */
          <>
            {/* Top Controls: Tabs and Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
              
              {/* DARK Styled Tabs UI for Latest Batch & My Enrolled */}
              <div className="flex items-center gap-1.5 p-1 bg-[#121212] rounded-2xl border border-white/10 shadow-inner self-start">
                <button
                  onClick={() => {
                    setCurrentTab('batches');
                    setDisplayedCount(ITEMS_PER_PAGE);
                  }}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    currentTab === 'batches'
                      ? 'bg-[#222222] text-white border border-white/20 shadow-md'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                  <span>Latest Batches</span>
                  <span className="text-[10px] bg-black/60 text-stone-300 px-1.5 py-0.5 rounded ml-0.5">
                    {batches.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('enrolled');
                    setDisplayedCount(ITEMS_PER_PAGE);
                  }}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    currentTab === 'enrolled'
                      ? 'bg-[#222222] text-white border border-white/20 shadow-md'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                  <span>My Enrolled</span>
                  {enrolledIds.length > 0 && (
                    <span className="bg-pink-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                      {enrolledIds.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDisplayedCount(ITEMS_PER_PAGE);
                  }}
                  placeholder="Search batches, exams, teachers..."
                  className="w-full bg-[#121212] border border-white/10 text-white text-xs sm:text-sm rounded-xl pl-10 pr-9 py-2.5 placeholder:text-stone-500 focus:outline-none focus:border-pink-500/50 focus:bg-[#161616] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-white transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Telegram Community Banner with user icon */}
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#141414] via-[#1a0f18] to-[#121212] border border-pink-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-white/20 bg-black shrink-0 shadow-md">
                  <img
                    src="/logo.png"
                    alt="GB STUDY"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Official GB STUDY Community</span>
                    <span className="text-[10px] bg-pink-600 text-white font-black px-1.5 py-0.2 rounded uppercase">
                      TELEGRAM
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Join over thousands of aspirants for daily class updates, PDFs, and exam strategies on <strong>@GBFreestudy</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTelegramModal(true)}
                className="px-4 py-2 bg-[#0088cc] hover:bg-[#007cb8] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0 self-stretch sm:self-auto text-center"
              >
                Join @GBFreestudy
              </button>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 className="w-9 h-9 text-pink-500 animate-spin mb-3" />
                <p className="text-stone-400 text-sm font-medium">Loading GB STUDY batches...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredBatches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-[#121212]/50 border border-white/5 rounded-3xl p-8">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-stone-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {currentTab === 'enrolled' ? 'No Enrolled Batches' : 'No Batches Found'}
                </h3>
                <p className="text-stone-500 text-xs sm:text-sm max-w-sm mb-5">
                  {currentTab === 'enrolled'
                    ? 'You have not enrolled in any batches yet. Click "Enroll" on any course to bookmark it here.'
                    : 'Try checking your spelling or search for different keywords.'}
                </p>
                {currentTab === 'enrolled' && (
                  <button
                    onClick={() => setCurrentTab('batches')}
                    className="px-4 py-2 bg-pink-600 text-white text-xs font-bold rounded-xl hover:bg-pink-500 transition-colors cursor-pointer shadow-md"
                  >
                    Browse All Batches
                  </button>
                )}
              </div>
            )}

            {/* Batches Grid */}
            {!loading && visibleBatches.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  {visibleBatches.map((batch) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      isEnrolled={enrolledIds.includes(String(batch.id))}
                      onToggleEnroll={handleToggleEnroll}
                      onOpenBatch={handleOpenBatch}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-12 mb-4">
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3 bg-[#141414] hover:bg-[#1c1c1c] border border-white/10 hover:border-pink-500/40 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Load More Batches</span>
                      <ChevronDown className="w-4 h-4 text-pink-400" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Floating Telegram Badge with user icon */}
      <aside aria-label="Telegram Channel" className="fixed bottom-5 right-5 z-30">
        <button
          onClick={() => setShowTelegramModal(true)}
          className="p-2 sm:px-4 sm:py-2.5 bg-[#0088cc] hover:bg-[#007cb8] text-white rounded-full sm:rounded-2xl shadow-[0_8px_25px_rgba(0,136,204,0.4)] flex items-center gap-2.5 transition-all active:scale-90 cursor-pointer border border-white/20 group"
          title="Join GB STUDY on Telegram"
        >
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/20 shrink-0">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="hidden sm:inline text-xs font-bold">Join @GBFreestudy</span>
          <Send className="w-4 h-4 fill-white shrink-0 sm:hidden" />
        </button>
      </aside>

      {/* Footer */}
      <Footer
        onOpenTelegram={() => setShowTelegramModal(true)}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
