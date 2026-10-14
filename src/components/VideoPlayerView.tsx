import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  Download,
  Eye,
  Radio,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { VideoDetails, VideoQuality } from '../types.ts';

interface VideoPlayerViewProps {
  courseId: string;
  videoId: string;
  videoTitle: string;
  onBack: () => void;
  onOpenPdf: (pdfUrl: string, title?: string) => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  courseId,
  videoId,
  videoTitle,
  onBack,
  onOpenPdf,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoDetails | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'notes'>('player');
  const [embeddedPdfUrl, setEmbeddedPdfUrl] = useState<string | null>(null);
  const [skipNotice, setSkipNotice] = useState<{ text: string; side: 'left' | 'right' } | null>(null);

  // 1. Fetch video details
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setEmbeddedPdfUrl(null);

    async function loadData() {
      try {
        const url = `/get/fetchVideoDetailsById?course_id=${encodeURIComponent(courseId)}&video_id=${encodeURIComponent(videoId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const data = await res.json();

        if (isCancelled) return;

        if (data && data.success) {
          setVideoData(data);
          if (data.qualities && data.qualities.length > 0) {
            setSelectedQuality(data.qualities[0].quality);
          }
        } else {
          throw new Error(data?.error || 'Could not load video source');
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching video details:', err);
          setError(err?.message || 'Failed to load video information');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [courseId, videoId]);

  // 2. Load and Play Stream using ONE unified player
  const loadStream = useCallback(
    (rawStreamUrl: string, startPos: number = 0) => {
      const videoEl = videoRef.current;
      if (!videoEl || !rawStreamUrl) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const streamUrl = `/video?url=${encodeURIComponent(rawStreamUrl)}`;

      if (Hls.isSupported()) {
        const hls = new Hls({
          startPosition: startPos > 0 ? startPos : -1,
          enableWorker: true,
          lowLatencyMode: true,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 8,
          maxLiveSyncPlaybackRate: 1.5,
          backBufferLength: 90,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 4,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 4,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().then(() => setIsPlaying(true)).catch(() => {});
        });

        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          if (data.details && data.details.live) {
            setIsLive(true);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('Network issue encountered, auto-recovering stream...', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('Media glitch encountered, auto-recovering stream...', data);
                hls.recoverMediaError();
                break;
              default:
                console.warn('HLS fatal error, re-attaching media...', data);
                hls.destroy();
                // Direct fallback to video element
                videoEl.src = streamUrl;
                videoEl.play().catch(() => {});
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari / iOS Native HLS
        videoEl.src = streamUrl;
        videoEl.addEventListener(
          'loadedmetadata',
          function onMeta() {
            if (startPos > 0) videoEl.currentTime = startPos;
            videoEl.play().catch(() => {});
            videoEl.removeEventListener('loadedmetadata', onMeta);
          },
          { once: true }
        );
      } else {
        videoEl.src = streamUrl;
        videoEl.play().catch(() => {});
      }
    },
    []
  );

  useEffect(() => {
    if (!videoData) return;

    let defaultUrl = videoData.decoded_video_link;
    if (videoData.qualities && videoData.qualities.length > 0) {
      defaultUrl = videoData.qualities[0].url || defaultUrl;
    }

    if (defaultUrl) {
      loadStream(defaultUrl, 0);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoData, loadStream]);

  // Controls auto-hide
  const triggerControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettingsMenu(false);
      }, 3500);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerControls();
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    setSkipNotice({
      text: seconds > 0 ? `+${seconds}s` : `${seconds}s`,
      side: seconds > 0 ? 'right' : 'left',
    });
    setTimeout(() => setSkipNotice(null), 650);
    triggerControls();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const pct = parseFloat(e.target.value);
    const targetTime = (pct / 100) * duration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    triggerControls();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
    triggerControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    triggerControls();
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettingsMenu(false);
    triggerControls();
  };

  const handleQualityChange = (q: VideoQuality) => {
    const video = videoRef.current;
    if (!video) return;
    const savedTime = video.currentTime;
    setSelectedQuality(q.quality);
    loadStream(q.url, savedTime);
    setShowSettingsMenu(false);
    triggerControls();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, duration]);

  // Notes data collection
  const pdf1 = videoData?.pdf_viewer || videoData?.decoded_pdf_link;
  const pdf2 = videoData?.pdf_viewer2 || videoData?.decoded_pdf_link2;
  const hasAnyNotes = Boolean(pdf1 || pdf2);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#070707] flex flex-col text-white select-none overflow-y-auto"
    >
      {/* Top Bar with GB STUDY branding and Back Button */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[#0e0e0e] border-b border-white/10 flex items-center justify-between gap-3 shrink-0 z-50 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-stone-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            title="Back to Course"
          >
            <ArrowLeft className="w-5 h-5 text-pink-400" />
          </button>

          {/* User's specified logo icon */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-white/15 bg-black shrink-0">
            <img
              src="/logo.png"
              alt="GB STUDY"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-white font-bold text-xs sm:text-sm md:text-base truncate">
              {videoData?.title || videoTitle}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-pink-400 font-syne">
                GB STUDY UNIFIED PLAYER
              </span>
              {isLive ? (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-1 animate-pulse">
                  <Radio className="w-2.5 h-2.5" /> LIVE
                </span>
              ) : (
                <span className="bg-white/10 text-stone-400 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  RECORDED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Tab Toggle (Video / Notes) */}
        {hasAnyNotes && (
          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setActiveTab('player');
                setEmbeddedPdfUrl(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'player' && !embeddedPdfUrl
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lecture Video</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('notes');
                if (pdf1) setEmbeddedPdfUrl(pdf1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'notes' || embeddedPdfUrl
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-pink-300" />
              <span>Notes & PDFs</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 gap-4">
        
        {/* Left Side: Video Viewport & Controls */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          
          {/* Responsive Video Screen Container */}
          <div
            onMouseMove={triggerControls}
            onClick={triggerControls}
            className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group"
          >
            {/* Loading Indicator */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-3" />
                <p className="text-stone-300 text-xs font-semibold">Connecting to high-speed lecture stream...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                <p className="text-white font-bold text-base mb-1">Lecture stream error</p>
                <p className="text-stone-400 text-xs mb-4 max-w-sm">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    if (videoData?.decoded_video_link) {
                      loadStream(videoData.decoded_video_link, 0);
                    }
                  }}
                  className="px-5 py-2 bg-pink-600 text-white font-bold text-xs rounded-xl hover:bg-pink-500 transition-all cursor-pointer shadow-lg"
                >
                  Retry Stream
                </button>
              </div>
            )}

            {/* HTML5 Video element */}
            <video
              ref={videoRef}
              playsInline
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Tap Gestures Overlay for Mobile (+10s / -10s) */}
            <div
              onDoubleClick={() => handleSkip(-10)}
              className="absolute left-0 inset-y-0 w-1/3 z-20"
            />
            <div
              onClick={togglePlay}
              className="absolute inset-x-1/3 inset-y-0 z-20"
            />
            <div
              onDoubleClick={() => handleSkip(10)}
              className="absolute right-0 inset-y-0 w-1/3 z-20"
            />

            {/* Skip animation notice */}
            {skipNotice && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 z-40 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-pink-500/30 text-white font-black text-sm flex items-center gap-1.5 shadow-2xl animate-pop ${
                  skipNotice.side === 'left' ? 'left-10' : 'right-10'
                }`}
              >
                {skipNotice.side === 'left' ? (
                  <RotateCcw className="w-5 h-5 text-pink-400" />
                ) : (
                  <RotateCw className="w-5 h-5 text-pink-400" />
                )}
                <span>{skipNotice.text}</span>
              </div>
            )}

            {/* In-Video Overlay Controls */}
            <div
              className={`absolute bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 pointer-events-auto ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Scrub Bar (only for recorded or seekable live) */}
              {!isLive && (
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-stone-300 font-mono text-[11px] sm:text-xs w-11 text-right">
                    {formatTime(currentTime)}
                  </span>

                  <div className="flex-1 relative group flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={duration ? (currentTime / duration) * 100 : 0}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>

                  <span className="text-stone-300 font-mono text-[11px] sm:text-xs w-11">
                    {formatTime(duration)}
                  </span>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-3">
                
                {/* Left: Play, Skip, Volume */}
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-500 transition-all cursor-pointer shadow-lg active:scale-95"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  {!isLive && (
                    <>
                      <button
                        onClick={() => handleSkip(-10)}
                        className="text-stone-300 hover:text-white transition-colors cursor-pointer"
                        title="Rewind 10s"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleSkip(10)}
                        className="text-stone-300 hover:text-white transition-colors cursor-pointer"
                        title="Forward 10s"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Volume */}
                  <div className="hidden sm:flex items-center gap-2 ml-1">
                    <button
                      onClick={toggleMute}
                      className="text-stone-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>

                {/* Right: Quality, Speed, Fullscreen */}
                <div className="flex items-center gap-2.5 relative">
                  {/* Settings Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSettingsMenu(!showSettingsMenu);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Settings"
                    >
                      <Settings className="w-3.5 h-3.5 text-pink-400" />
                      <span className="text-[11px] font-mono">{playbackSpeed}x • {selectedQuality}</span>
                    </button>

                    {showSettingsMenu && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 bottom-11 w-52 bg-[#181818] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-3 text-xs"
                      >
                        {/* Speed */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                            Playback Speed
                          </span>
                          <div className="grid grid-cols-4 gap-1 mt-1.5">
                            {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleSpeedChange(s)}
                                className={`py-1 rounded text-center font-bold cursor-pointer transition-colors ${
                                  playbackSpeed === s
                                    ? 'bg-pink-600 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-stone-300'
                                }`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quality */}
                        {videoData?.qualities && videoData.qualities.length > 0 && (
                          <div className="pt-2 border-t border-white/10">
                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                              Quality
                            </span>
                            <div className="flex flex-col gap-1 mt-1.5 max-h-32 overflow-y-auto hide-scroll">
                              {videoData.qualities.map((q) => (
                                <button
                                  key={q.quality}
                                  onClick={() => handleQualityChange(q)}
                                  className={`w-full py-1.5 px-2.5 rounded-lg text-left font-bold cursor-pointer transition-colors text-xs ${
                                    selectedQuality === q.quality
                                      ? 'bg-pink-600 text-white'
                                      : 'hover:bg-white/10 text-stone-300'
                                  }`}
                                >
                                  {q.quality}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-stone-300 hover:text-white transition-colors cursor-pointer p-1"
                    title="Fullscreen"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lecture Metadata Card */}
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {videoData?.title || videoTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-1.5 font-medium">
                {videoData?.date && <span>📅 {videoData.date}</span>}
                {videoData?.duration && <span>⏱️ {videoData.duration}</span>}
                <span className="text-pink-400 font-bold">Batch ID: {courseId}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            {hasAnyNotes && (
              <div className="flex items-center gap-2 shrink-0">
                {pdf1 && (
                  <button
                    onClick={() => {
                      setEmbeddedPdfUrl(pdf1);
                      setActiveTab('notes');
                    }}
                    className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Class Notes</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: ALL Notes & PDFs for this lecture in ONE place */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500" />
                <h3 className="text-sm font-bold text-white font-syne">
                  Lecture Notes & PDFs
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded">
                STUDY MATERIAL
              </span>
            </div>

            {hasAnyNotes ? (
              <div className="flex flex-col gap-2.5">
                {pdf1 && (
                  <div className="p-3 bg-[#181818] border border-white/5 hover:border-pink-500/30 rounded-xl flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">Class Notes PDF</p>
                        <p className="text-[10px] text-stone-400">Official Lecture Handwritten Notes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEmbeddedPdfUrl(pdf1);
                          setActiveTab('notes');
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                        title="Preview Here"
                      >
                        <Eye className="w-4 h-4 text-pink-400" />
                      </button>
                      <button
                        onClick={() => onOpenPdf(pdf1, `${videoTitle} - Class Notes`)}
                        className="p-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white transition-colors cursor-pointer shadow-sm"
                        title="Open Fullscreen / Download"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {pdf2 && (
                  <div className="p-3 bg-[#181818] border border-white/5 hover:border-pink-500/30 rounded-xl flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">Practice Sheet PDF</p>
                        <p className="text-[10px] text-stone-400">Classwork & Assignment Questions</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEmbeddedPdfUrl(pdf2);
                          setActiveTab('notes');
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                        title="Preview Here"
                      >
                        <Eye className="w-4 h-4 text-purple-400" />
                      </button>
                      <button
                        onClick={() => onOpenPdf(pdf2, `${videoTitle} - Practice Sheet`)}
                        className="p-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white transition-colors cursor-pointer shadow-sm"
                        title="Open Fullscreen / Download"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-stone-500 text-xs">
                <BookOpen className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                No PDF attached for this lecture
              </div>
            )}
          </div>

          {/* In-Player Embedded PDF Reader (if student clicks Preview) */}
          {embeddedPdfUrl && (
            <div className="bg-[#121212] border border-pink-500/30 rounded-2xl overflow-hidden flex flex-col h-96 shadow-xl animate-pop">
              <div className="px-3.5 py-2 bg-[#181818] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> PDF Document Preview
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenPdf(embeddedPdfUrl, `${videoTitle} - Notes`)}
                    className="text-[10px] bg-pink-600 text-white px-2 py-1 rounded font-bold hover:bg-pink-500 transition-colors cursor-pointer"
                  >
                    Open New Tab
                  </button>
                  <button
                    onClick={() => setEmbeddedPdfUrl(null)}
                    className="text-stone-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <iframe
                src={embeddedPdfUrl.startsWith('/pdf') ? embeddedPdfUrl : `/pdf?url=${encodeURIComponent(embeddedPdfUrl)}`}
                className="w-full h-full border-0 bg-white"
                title="Notes Preview"
              />
            </div>
          )}

          {/* Telegram Channel Card */}
          <div className="bg-gradient-to-br from-[#0088cc]/10 to-[#141414] border border-[#0088cc]/25 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">Join GB STUDY Telegram</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Daily Free Batches & Live Updates</p>
            </div>
            <a
              href="https://t.me/GBFreestudy"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#0088cc] hover:bg-[#007cb8] text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
            >
              Join
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
