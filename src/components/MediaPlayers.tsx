import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Tv, Subtitles, RotateCcw, Camera, SkipForward, SkipBack, Shuffle, Repeat, ChevronDown, ChevronUp, X, Check, Sliders, Settings
} from "lucide-react";
import { MediaFile } from "../types";

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getVimeoId(url: string): string | null {
  if (!url) return null;
  const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)\s*(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

interface MediaPlayersProps {
  currentFile: MediaFile | null;
  onClose: () => void;
  playlistFiles?: MediaFile[];
  theme: "light" | "dark";
}

export default function MediaPlayers({ currentFile, onClose, playlistFiles = [], theme }: MediaPlayersProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playlist, setPlaylist] = useState<MediaFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Video state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // DOM Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const isDark = theme === "dark";

  // Build play queue
  useEffect(() => {
    if (currentFile) {
      const initialQueue = playlistFiles.length > 0 
        ? playlistFiles 
        : [currentFile];
      
      setPlaylist(initialQueue);
      const foundIdx = initialQueue.findIndex((f) => f.id === currentFile.id);
      setCurrentIndex(foundIdx !== -1 ? foundIdx : 0);
    }
  }, [currentFile, playlistFiles]);

  const activeMedia = playlist[currentIndex] || currentFile;

  const isVideo = activeMedia?.type === "video";
  const ytId = isVideo && activeMedia ? getYouTubeId(activeMedia.url) : null;
  const vimeoId = isVideo && activeMedia ? getVimeoId(activeMedia.url) : null;
  const isEmbeddedVideo = !!(ytId || vimeoId);

  // Track event handlers
  const handlePlayPause = () => {
    if (isEmbeddedVideo) {
      setIsPlaying(!isPlaying);
      return;
    }
    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = (e: any) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleLoadedMetadata = (e: any) => {
    setDuration(e.target.duration);
    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (el) {
      el.playbackRate = playbackRate;
      el.volume = isMuted ? 0 : volume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEmbeddedVideo) return;
    const seekVal = parseFloat(e.target.value);
    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (el) {
      el.currentTime = seekVal;
      setCurrentTime(seekVal);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volVal = parseFloat(e.target.value);
    setVolume(volVal);
    setIsMuted(volVal === 0);
    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (el) {
      el.volume = volVal;
    }
  };

  const toggleMute = () => {
    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (!el) return;

    const newMute = !isMuted;
    setIsMuted(newMute);
    el.volume = newMute ? 0 : volume;
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (el) {
      el.playbackRate = rate;
    }
  };

  // Next / Previous Tracks
  const handleNext = () => {
    if (playlist.length <= 1) return;
    setIsPlaying(false);

    let nextIdx = currentIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length);
    } else if (nextIdx >= playlist.length) {
      nextIdx = 0;
    }
    setCurrentIndex(nextIdx);
  };

  const handlePrev = () => {
    if (playlist.length <= 1) return;
    setIsPlaying(false);

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = playlist.length - 1;
    }
    setCurrentIndex(prevIdx);
  };

  // Video specific Fullscreen and PiP
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP não suportado", err);
    }
  };

  // Screenshot capture for Video Frame
  const handleFrameCapture = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeMedia.title}_frame.png`;
      a.click();
    }
  };

  // Format seconds to human MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Trigger autoplay on source swap
  useEffect(() => {
    setIsPlaying(false);
    if (isEmbeddedVideo) {
      setIsPlaying(true);
      return;
    }
    setTimeout(() => {
      const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
      if (el) {
        el.load();
        el.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }, 150);
  }, [currentIndex, activeMedia?.id, isEmbeddedVideo]);

  if (!activeMedia) return null;

  return (
    <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-[#0a0f1d] border-t border-slate-800/80 z-40 p-4 shadow-2xl text-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between select-none">
      
      {/* Media Metadata info */}
      <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
        <img 
          src={activeMedia.thumbnail} 
          alt={activeMedia.title} 
          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800" 
        />
        <div className="min-w-0">
          <h4 className="text-xs font-bold truncate">{activeMedia.title}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate uppercase">
            {activeMedia.format} • {activeMedia.quality} • {activeMedia.type === "video" ? "Vídeo Player" : "Áudio Player"}
          </p>
        </div>
        <button 
          onClick={onClose} 
          className="md:hidden ml-auto p-1.5 hover:bg-slate-800 rounded-lg text-slate-500"
          aria-label="Fechar player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Embedded Elements hidden or shown */}
      <div className="hidden">
        {!isVideo && (
          <audio
            ref={audioRef}
            src={activeMedia.url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleNext}
            loop={isLooping}
          />
        )}
      </div>

      {/* Main timeline slider and buttons block */}
      <div className="flex-1 w-full md:max-w-xl space-y-1.5">
        
        {/* Controls block */}
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-1.5 rounded-lg transition-all ${isShuffle ? "text-blue-500" : "text-slate-500 hover:text-white"}`}
            title="Aleatório"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button 
            onClick={handlePrev} 
            disabled={playlist.length <= 1}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-40"
            title="Anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 active:scale-90 transition-all"
            title={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button 
            onClick={handleNext}
            disabled={playlist.length <= 1}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-40"
            title="Próxima"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg transition-all ${isLooping ? "text-blue-500" : "text-slate-500 hover:text-white"}`}
            title="Repetir"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Seek timeline */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono font-bold text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={isEmbeddedVideo}
            className={`flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none ${isEmbeddedVideo ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          <span>{formatTime(duration)}</span>
        </div>

      </div>

      {/* Right control utilities: Full Volume, PiP, Fullscreen, Speed */}
      <div className="flex items-center gap-3.5 w-full md:w-1/4 justify-end">
        
        {/* Playback speed selector */}
        <div className="relative">
          <button 
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] font-extrabold rounded-lg text-slate-300 border border-slate-700/40 flex items-center gap-1"
          >
            <span>{playbackRate}x</span>
            <Settings className="w-3 h-3" />
          </button>

          {showSpeedMenu && (
            <div className={`absolute bottom-8 right-0 p-2 rounded-xl border text-xs font-semibold w-24 z-50 shadow-xl space-y-1 ${
              isDark ? "bg-[#111827] border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
            }`}>
              {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changeSpeed(rate)}
                  className="w-full text-left px-2 py-1 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-between"
                >
                  <span>{rate}x</span>
                  {playbackRate === rate && <Check className="w-3 h-3 text-blue-500 group-hover:text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume slider control */}
        <div className="flex items-center gap-1.5 group select-none">
          <button onClick={toggleMute} className="text-slate-400 hover:text-white p-1.5" title="Mudar Volume">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
          />
        </div>

        {/* Extra video utility frame captures */}
        {isVideo && (
          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <button 
              onClick={handleFrameCapture}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              title="Capturar Frame"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button 
              onClick={togglePiP}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              title="Picture-in-Picture"
            >
              <Tv className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              title="Tela Cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <button 
          onClick={onClose} 
          className="hidden md:block p-1.5 hover:bg-slate-800 rounded-lg text-slate-500"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Video Player window (Overlay if active media is Video) */}
      {isVideo && (
        <div 
          ref={videoContainerRef}
          className="fixed bottom-20 right-4 w-80 aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black z-50 flex flex-col group"
        >
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : vimeoId ? (
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={activeMedia.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleNext}
              className="w-full h-full object-contain"
            />
          )}
          
          {/* Subtitles text overlay */}
          {showCaptions && (
            <div className="absolute bottom-12 left-2 right-2 text-center pointer-events-none">
              <span className="bg-black/85 px-2 py-1 rounded text-xs text-amber-300 font-bold border border-slate-800/80">
                [Legenda MediaHub] Áudio original sendo reproduzido...
              </span>
            </div>
          )}

          {/* Floating HUD toolbar */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setShowCaptions(!showCaptions)}
              className={`p-1.5 rounded-lg mr-1.5 text-[10px] font-bold ${showCaptions ? "bg-blue-600 text-white" : "bg-black/60 text-slate-300 hover:text-white"}`}
              title="Legendas"
            >
              <Subtitles className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => {
                const el = videoRef.current;
                if (el) el.pause();
                setIsPlaying(false);
                onClose();
              }}
              className="p-1.5 bg-black/60 hover:bg-red-600 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
