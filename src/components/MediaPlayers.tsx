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

  // Synthesizer / Audio visualizer fallbacks for robust sandboxed reproduction
  const [useSynthesizerFallback, setUseSynthesizerFallback] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const isDark = theme === "dark";

  const activeMedia = playlist[currentIndex] || currentFile;
  const isVideo = activeMedia?.type === "video";
  const ytId = isVideo && activeMedia ? getYouTubeId(activeMedia.url) : null;
  const vimeoId = isVideo && activeMedia ? getVimeoId(activeMedia.url) : null;
  const isEmbeddedVideo = !!(ytId || vimeoId);

  // Web Audio Synthesizer sound engine
  const playSynthNote = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5 (Pentatonic, always sounds nice)
      const freq = notes[Math.floor(Math.random() * notes.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Beautiful soft volume envelope: quick attack, slow decay
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch (err) {
      console.warn("Synth failed to play note:", err);
    }
  };

  // Synthesizer playback loop and progress simulator
  useEffect(() => {
    let synthTimer: any = null;
    let progressTimer: any = null;

    if (useSynthesizerFallback && isPlaying) {
      // Play initial note
      playSynthNote();
      
      // Play notes periodically
      synthTimer = setInterval(() => {
        playSynthNote();
      }, 1800);

      // Advance currentTime
      progressTimer = setInterval(() => {
        setCurrentTime((prev) => {
          const maxDur = duration || 180; // 3 minutes default fallback
          if (prev >= maxDur) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (synthTimer) clearInterval(synthTimer);
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [useSynthesizerFallback, isPlaying, duration, volume, isMuted]);

  // Clean audio context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Canvas visualizer animation loop
  useEffect(() => {
    if (!useSynthesizerFallback || !isVideo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || 320);
    let height = (canvas.height = canvas.offsetHeight || 180);

    // Handle resizing
    const resizeObserver = new ResizeObserver(() => {
      if (canvas) {
        width = canvas.width = canvas.offsetWidth || 320;
        height = canvas.height = canvas.offsetHeight || 180;
      }
    });
    resizeObserver.observe(canvas);

    let frame = 0;
    const particles: { x: number; y: number; size: number; speedY: number; speedX: number; alpha: number }[] = [];
    for (let i = 0; i < 30; i++) {
       particles.push({
         x: Math.random() * width,
         y: Math.random() * height,
         size: Math.random() * 3 + 1,
         speedY: -(Math.random() * 0.4 + 0.1),
         speedX: (Math.random() - 0.5) * 0.3,
         alpha: Math.random() * 0.5 + 0.2,
       });
    }

    const render = () => {
       frame++;
       // Draw subtle space background gradient
       const grad = ctx.createLinearGradient(0, 0, width, height);
       grad.addColorStop(0, "#080710");
       grad.addColorStop(1, "#0d1b3e");
       ctx.fillStyle = grad;
       ctx.fillRect(0, 0, width, height);

       // Draw audio wave paths
       ctx.lineWidth = 2.5;
       const waveCount = 3;
       for (let w = 0; w < waveCount; w++) {
         ctx.beginPath();
         const offset = w * (Math.PI / 3);
         const amplitude = isPlaying ? (25 - w * 4) * (0.8 + Math.sin(frame * 0.05) * 0.2) : 2;
         const frequency = 0.015 + w * 0.005;

         for (let x = 0; x < width; x++) {
           const y =
             height / 2 +
             Math.sin(x * frequency + frame * 0.04 + offset) * amplitude +
             Math.cos(x * 0.005 - frame * 0.02) * (amplitude * 0.3);
           if (x === 0) {
             ctx.moveTo(x, y);
           } else {
             ctx.lineTo(x, y);
           }
         }
         
         const colors = ["rgba(99, 102, 241, 0.65)", "rgba(6, 182, 212, 0.5)", "rgba(168, 85, 247, 0.45)"];
         ctx.strokeStyle = colors[w % colors.length];
         ctx.shadowColor = colors[w % colors.length];
         ctx.shadowBlur = isPlaying ? 10 : 0;
         ctx.stroke();
       }
       ctx.shadowBlur = 0; // Reset

       // Update and draw glowing particles
       particles.forEach((p) => {
         if (isPlaying) {
           p.y += p.speedY;
           p.x += p.speedX;
         }
         if (p.y < 0) p.y = height;
         if (p.x < 0) p.x = width;
         if (p.x > width) p.x = 0;

         ctx.beginPath();
         ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
         ctx.fillStyle = `rgba(147, 197, 253, ${p.alpha * (0.8 + Math.sin(frame * 0.08 + p.x) * 0.2)})`;
         ctx.fill();
       });

       // Draw labels
       ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
       ctx.font = "bold 13px Inter, sans-serif";
       ctx.textAlign = "center";
       ctx.fillText("MediaHub SafePlayer", width / 2, height / 2 - 35);

       ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
       ctx.font = "10px JetBrains Mono, monospace";
       ctx.fillText(isPlaying ? "✦ TRANSMISSÃO ATIVA ✦" : "⏸ PAUSADO", width / 2, height / 2 - 15);

       const circleRadius = 24 + (isPlaying ? Math.sin(frame * 0.1) * 3 : 0);
       const circleGrad = ctx.createRadialGradient(width / 2, height / 2 + 15, 0, width / 2, height / 2 + 15, circleRadius);
       circleGrad.addColorStop(0, "rgba(59, 130, 246, 0.4)");
       circleGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
       ctx.fillStyle = circleGrad;
       ctx.beginPath();
       ctx.arc(width / 2, height / 2 + 15, circleRadius, 0, Math.PI * 2);
       ctx.fill();

       ctx.fillStyle = "#3b82f6";
       ctx.beginPath();
       ctx.arc(width / 2, height / 2 + 15, 4, 0, Math.PI * 2);
       ctx.fill();

       animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
       cancelAnimationFrame(animationFrameId);
       resizeObserver.disconnect();
    };
  }, [useSynthesizerFallback, isVideo, isPlaying]);

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

  // Track event handlers
  const handlePlayPause = () => {
    if (isEmbeddedVideo) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (useSynthesizerFallback) {
      setIsPlaying(!isPlaying);
      return;
    }

    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (!el) {
      setUseSynthesizerFallback(true);
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch((err) => {
        console.warn("Play failed, switching to synthesizer", err);
        setUseSynthesizerFallback(true);
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = (e: any) => {
    if (!useSynthesizerFallback) {
      setCurrentTime(e.target.currentTime);
    }
  };

  const handleLoadedMetadata = (e: any) => {
    if (!useSynthesizerFallback) {
      setDuration(e.target.duration);
    }
    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (el) {
      el.playbackRate = playbackRate;
      el.volume = isMuted ? 0 : volume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEmbeddedVideo) return;
    const seekVal = parseFloat(e.target.value);
    
    if (useSynthesizerFallback) {
      setCurrentTime(seekVal);
      return;
    }

    const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
    if (el) {
      el.currentTime = seekVal;
      setCurrentTime(seekVal);
    } else {
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
    setUseSynthesizerFallback(false);
    setIsPlaying(false);
    if (isEmbeddedVideo) {
      setIsPlaying(true);
      return;
    }
    const timer = setTimeout(() => {
      const el = activeMedia?.type === "video" ? videoRef.current : audioRef.current;
      if (el) {
        el.load();
        el.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("Standard play failed, enabling synthesizer fallback", err);
            setUseSynthesizerFallback(true);
            setIsPlaying(true);
          });
      } else {
        setUseSynthesizerFallback(true);
        setIsPlaying(true);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentIndex, activeMedia?.id, isEmbeddedVideo]);

  if (!activeMedia) return null;

  return (
    <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-[#0a0f1d] border-t border-slate-800/80 z-40 p-4 shadow-2xl text-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between select-none">
      
      <style>{`
        @keyframes mediahub-bar-1 { 0%, 100% { height: 4px; } 50% { height: 16px; } }
        @keyframes mediahub-bar-2 { 0%, 100% { height: 6px; } 50% { height: 20px; } }
        @keyframes mediahub-bar-3 { 0%, 100% { height: 3px; } 50% { height: 12px; } }
        .mh-animate-bar-1 { animation: mediahub-bar-1 0.8s ease-in-out infinite; }
        .mh-animate-bar-2 { animation: mediahub-bar-2 0.6s ease-in-out infinite; }
        .mh-animate-bar-3 { animation: mediahub-bar-3 0.9s ease-in-out infinite; }
      `}</style>

      {/* Media Metadata info */}
      <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
        <div className="relative shrink-0">
          <img 
            src={activeMedia.thumbnail} 
            alt={activeMedia.title} 
            className={`w-12 h-12 rounded-xl object-cover border border-slate-800 ${isPlaying ? "animate-pulse" : ""}`} 
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-blue-600/35 rounded-xl flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-5">
                <span className="w-0.5 bg-white rounded-full mh-animate-bar-1 h-3"></span>
                <span className="w-0.5 bg-white rounded-full mh-animate-bar-2 h-4"></span>
                <span className="w-0.5 bg-white rounded-full mh-animate-bar-3 h-2.5"></span>
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold truncate">{activeMedia.title}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate uppercase">
            {activeMedia.format} • {activeMedia.quality} • {activeMedia.type === "video" ? "Vídeo Player" : "Áudio Player"}
            {useSynthesizerFallback && " • FALLBACK"}
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
            onError={() => setUseSynthesizerFallback(true)}
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
          ) : useSynthesizerFallback ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full bg-[#0a0f1d]"
            />
          ) : (
            <video
              ref={videoRef}
              src={activeMedia.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleNext}
              onError={() => setUseSynthesizerFallback(true)}
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
