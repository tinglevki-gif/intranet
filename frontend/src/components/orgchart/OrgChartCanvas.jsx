import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Focus, 
  Hand, 
  Sparkles,
  Layers,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function OrgChartCanvas({
  children,
  minZoom = 0.15,
  maxZoom = 2.5,
  defaultZoom = 1,
  isFullscreen = false,
  onToggleFullscreen,
  className = '',
  contentKey = ''
}) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Transform state: position (x, y) and zoom scale
  const [scale, setScale] = useState(defaultZoom);
  const [position, setPosition] = useState({ x: 0, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 30 });
  const hasMovedRef = useRef(false);

  // Touch gesture state
  const touchStartRef = useRef({ x: 0, y: 0, dist: 0, scale: 1 });

  // Clamp helper
  const clampZoom = useCallback((z) => {
    return Math.min(Math.max(z, minZoom), maxZoom);
  }, [minZoom, maxZoom]);

  // Handle Zoom In / Out
  const zoomIn = () => {
    setScale((prev) => clampZoom(prev * 1.2));
  };

  const zoomOut = () => {
    setScale((prev) => clampZoom(prev / 1.2));
  };

  // Reset to default center & scale
  const resetView = useCallback(() => {
    setScale(defaultZoom);
    setPosition({ x: 0, y: 30 });
  }, [defaultZoom]);

  // Fit content to screen
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    // Natural content size without current scale
    const contentW = contentRect.width / scale;
    const contentH = contentRect.height / scale;

    const availableW = containerRect.width - 60;
    const availableH = containerRect.height - 80;

    if (contentW <= 0 || contentH <= 0) return;

    const scaleW = availableW / contentW;
    const scaleH = availableH / contentH;
    const targetScale = clampZoom(Math.min(scaleW, scaleH, 1.1) * 0.95);

    setScale(targetScale);
    // Center horizontally and place slightly below top
    setPosition({ x: 0, y: 30 });
  }, [scale, clampZoom]);

  // Auto-fit on content layout switch
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
    }, 150);
    return () => clearTimeout(timer);
  }, [contentKey]);

  // Mouse Wheel Zoom centered on cursor
  const handleWheel = (e) => {
    // Only intercept if within container
    e.preventDefault();
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - containerRect.left - containerRect.width / 2;
    const cursorY = e.clientY - containerRect.top;

    // Zoom delta factor
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = clampZoom(scale * zoomFactor);

    if (newScale === scale) return;

    // Adjust position so point under cursor remains invariant
    const newX = cursorX - (cursorX - position.x) * (newScale / scale);
    const newY = cursorY - (cursorY - position.y) * (newScale / scale);

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  // Drag Pan handlers
  const handleMouseDown = (e) => {
    // Left or Middle mouse button
    if (e.button !== 0 && e.button !== 1) return;

    // Ignore drag start if clicking on interactive button / input / link directly
    const target = e.target;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }

    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    setPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pinch & pan handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      positionStartRef.current = { ...position };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.hypot(dx, dy),
        scale: scale
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy
      });
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scaleFactor = newDist / (touchStartRef.current.dist || 1);
      const newScale = clampZoom(touchStartRef.current.scale * scaleFactor);
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Keyboard navigation (+, -, 0, Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetView();
      } else if (e.key === 'f' || e.key === 'F') {
        fitToScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitToScreen, resetView]);

  return (
    <div 
      className={`relative w-full overflow-hidden select-none bg-slate-50/60 dark:bg-slate-950/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen bg-slate-900 border-none' : 'min-h-[640px] h-[78vh]'
      } ${className}`}
    >
      {/* Background Dot Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${position.x}px ${position.y}px`
        }}
      />

      {/* Interactive Infinite Canvas Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full relative flex items-start justify-center overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Transformable Content Wrapper */}
        <div
          ref={contentRef}
          className="transition-transform duration-75 origin-top inline-block"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            willChange: 'transform'
          }}
        >
          {children}
        </div>
      </div>

      {/* Floating Canvas HUD Controls (Bottom-Right) */}
      <div className="absolute bottom-5 right-5 flex items-center space-x-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xl z-30">
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          title={t('org_chart.zoom_out')}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="px-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 min-w-[48px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={zoomIn}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          title={t('org_chart.zoom_in')}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <button
          onClick={fitToScreen}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          title={t('org_chart.fit_screen')}
        >
          <Focus className="w-4 h-4" />
        </button>

        <button
          onClick={resetView}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          title={t('org_chart.center_view')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {onToggleFullscreen && (
          <>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button
              onClick={onToggleFullscreen}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
              title={isFullscreen ? t('org_chart.exit_fullscreen') : t('org_chart.fullscreen')}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>

      {/* Subtle Pan & Zoom Instruction Badge (Bottom-Left) */}
      <div className="absolute bottom-5 left-5 hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-sm pointer-events-none z-30">
        <Hand className="w-3.5 h-3.5 text-indigo-500" />
        <span>{t('org_chart.drag_hint')}</span>
      </div>
    </div>
  );
}
