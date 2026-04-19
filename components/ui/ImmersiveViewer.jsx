'use client';
/**
 * components/ui/ImmersiveViewer.jsx
 * Dimension Lab v3.0 — Three immersive viewing modes:
 *   orbit    → CSS 3D rotation with inertia (existing, polished)
 *   360      → Canvas equirectangular panoramic projection (true 360°)
 *   anaglyph → Canvas 2D→3D stereoscopic + depth-parallax wiggle mode
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Box, Orbit, Layers, Move, Zap, Info, Maximize2 } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   MAIN SHELL
══════════════════════════════════════════════════════════════ */
export default function ImmersiveViewer({ imageUrl, mode: initialMode, onClose }) {
  const [mode, setMode] = useState(
    initialMode === '360' ? '360' : initialMode === 'anaglyph' ? 'anaglyph' : 'orbit'
  );
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 50);
    return () => clearTimeout(t);
  }, []);

  const TABS = [
    { id: 'orbit',    label: '3D Orbit', icon: Box   },
    { id: '360',      label: '360°',     icon: Orbit },
    { id: 'anaglyph', label: '2D → 3D', icon: Layers },
  ];

  return (
    <div
      className={`fixed inset-0 z-[300] bg-bg-primary flex flex-col overflow-hidden transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,0.08)_0%,transparent_65%)]" />
      </div>

      {/* ── Header HUD ── */}
      <div className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 border-b border-border bg-bg-card/40 backdrop-blur-3xl shadow-lg">
        <div className="flex items-center gap-3">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-bg-elevated border border-border backdrop-blur-xl">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-300 ${
                    active 
                      ? 'bg-purple-primary text-white shadow-xl shadow-purple-900/40' 
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>
          <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-primary/10 border border-purple-primary/20 text-[9px] font-black text-purple-primary uppercase tracking-widest shadow-sm">
            <Zap size={10} fill="currentColor" /> Dimension Lab v3.0
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center bg-bg-elevated hover:bg-bg-hover border border-border rounded-2xl text-text-primary transition-all hover:rotate-90 duration-500 shadow-xl"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Viewer Panel ── */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'orbit'    && <OrbitMode    imageUrl={imageUrl} />}
        {mode === '360'      && <PanoramaMode imageUrl={imageUrl} />}
        {mode === 'anaglyph' && <AnaglyphMode imageUrl={imageUrl} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODE 1: 3D ORBIT (CSS 3D — existing approach, polished)
══════════════════════════════════════════════════════════════ */
function OrbitMode({ imageUrl }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const animRef = useRef(null);
  const velRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function loop() {
      if (!isDragging.current) {
        setRotation(prev => ({
          x: prev.x + velRef.current.x,
          y: prev.y + velRef.current.y,
        }));
        velRef.current = {
          x: velRef.current.x * 0.94,
          y: velRef.current.y * 0.94,
        };
      }
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const sens = 0.45;
    setRotation(prev => ({ x: prev.x - dy * sens, y: prev.y + dx * sens }));
    velRef.current = { x: -dy * sens, y: dx * sens };
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', () => { isDragging.current = false; document.body.style.cursor = 'default'; });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [onMouseMove]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ perspective: '2800px', cursor: 'grab' }}
      onMouseDown={(e) => { isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; velRef.current = { x: 0, y: 0 }; document.body.style.cursor = 'grabbing'; }}
    >
      <div
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
          width: '60vmin',
          height: '75vmin',
          position: 'relative',
        }}
        className="group"
      >
        {/* Halo blur behind */}
        <div
          className="absolute inset-[-12%] opacity-25 blur-[60px] rounded-3xl pointer-events-none"
          style={{ transform: 'translateZ(-80px)', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover' }}
        />
        {/* Main card */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden border border-border shadow-2xl bg-bg-card/20 backdrop-blur-3xl">
          <div className="absolute inset-0 opacity-30 blur-2xl scale-125" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover' }} />
          <img src={imageUrl} alt="3D" className="relative z-10 w-full h-full object-contain p-4" />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-primary/10 to-transparent z-20" />
          {/* Glass glare */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30" style={{ transform: 'translateZ(30px)' }} />
        </div>
        {/* Shadow */}
        <div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[130%] h-24 bg-purple-900/20 blur-[70px] rounded-[100%] pointer-events-none"
          style={{ transform: `rotateX(90deg) translateZ(-240px) scale(${1 + Math.sin(rotation.x * 0.017) * 0.08})`, opacity: 0.7 }}
        />
      </div>

      {/* Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-2xl bg-bg-card/40 backdrop-blur-2xl border border-border text-text-muted text-[10px] font-black tracking-widest uppercase pointer-events-none shadow-2xl">
        <Move size={14} className="text-purple-primary animate-bounce" />
        Drag to orbit in 3D space
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODE 2: 360° PANORAMA — canvas equirectangular projection
   True raycasting: each pixel maps to a longitude/latitude on image.
══════════════════════════════════════════════════════════════ */
const PANO_W = 480;
const PANO_H = 270;
const DEFAULT_FOV = Math.PI / 1.25; // ~144° for a much wider view


function PanoramaMode({ imageUrl }) {
  const canvasRef   = useRef(null);
  const texRef      = useRef(null);   // { data, width, height }
  const uvCacheRef  = useRef(null);   // pre-computed direction angles
  const yawRef      = useRef(0);
  const pitchRef    = useRef(0);
  const velXRef     = useRef(0);
  const velYRef     = useRef(0);
  const dragging    = useRef(false);
  const lastPos     = useRef({ x: 0, y: 0 });
  const animRef     = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [yawDisplay, setYawDisplay] = useState(0);
  const [fov, setFov] = useState(DEFAULT_FOV);

  /* Pre-compute per-pixel direction angles in camera local space */
  useEffect(() => {
    const cache = new Float32Array(PANO_W * PANO_H * 2);
    const halfW = PANO_W / 2, halfH = PANO_H / 2;
    const f = halfW / Math.tan(fov / 2);
    for (let py = 0; py < PANO_H; py++) {
      for (let px = 0; px < PANO_W; px++) {
        const dx = px - halfW, dy = py - halfH;
        const len = Math.sqrt(dx * dx + dy * dy + f * f);
        cache[(py * PANO_W + px) * 2 + 0] = Math.atan2(dx, f); // local theta
        cache[(py * PANO_W + px) * 2 + 1] = Math.asin(dy / len); // local phi
      }
    }
    uvCacheRef.current = cache;
    renderPano();
  }, [fov]);

  /* Load texture into typed array */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const off = document.createElement('canvas');
      // Downscale source for faster sampling on large images
      const maxSrc = 2048;
      const scale = Math.min(1, maxSrc / Math.max(img.naturalWidth, img.naturalHeight));
      off.width = Math.floor(img.naturalWidth * scale);
      off.height = Math.floor(img.naturalHeight * scale);
      const ctx = off.getContext('2d');
      ctx.drawImage(img, 0, 0, off.width, off.height);
      texRef.current = {
        data: ctx.getImageData(0, 0, off.width, off.height).data,
        width: off.width,
        height: off.height,
      };
      setLoaded(true);
      renderPano();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const renderPano = useCallback(() => {
    const canvas = canvasRef.current;
    const tex = texRef.current;
    const uv = uvCacheRef.current;
    if (!canvas || !tex || !uv) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    const imgData = ctx.createImageData(PANO_W, PANO_H);
    const dst = imgData.data;
    const src = tex.data;
    const TW = tex.width, TH = tex.height;
    const yaw   = yawRef.current;
    const pitch = pitchRef.current;
    const cosY = Math.cos(yaw),   sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

    for (let i = 0; i < PANO_W * PANO_H; i++) {
      const theta = uv[i * 2 + 0]; // pixel angle from center (H)
      const phi   = uv[i * 2 + 1]; // pixel angle from center (V)

      // Build unit direction vector from angles
      const cp = Math.cos(phi), sp = Math.sin(phi);
      const ct = Math.cos(theta), st = Math.sin(theta);
      let vx = st * cp, vy = sp, vz = ct * cp;

      // Rotate by yaw (around Y axis)
      const vx2 = vx * cosY + vz * sinY;
      const vz2 = -vx * sinY + vz * cosY;
      vx = vx2; vz = vz2;

      // Rotate by pitch (around X axis)
      const vy2 = vy * cosP - vz * sinP;
      const vz3 = vy * sinP + vz * cosP;
      vy = vy2;

      // Convert to equirectangular UV
      const longitude = Math.atan2(vx, vz3 !== 0 ? vz3 : vz);
      const latitude  = Math.asin(Math.max(-1, Math.min(1, vy)));
      const u = ((longitude / (2 * Math.PI) + 0.5) % 1 + 1) % 1;
      const v = Math.max(0, Math.min(0.9999, latitude / Math.PI + 0.5));

      const tx = (Math.floor(u * TW)) % TW;
      const ty = Math.floor(v * TH);
      const si = (ty * TW + tx) * 4;
      const di = i * 4;
      dst[di]     = src[si];
      dst[di + 1] = src[si + 1];
      dst[di + 2] = src[si + 2];
      dst[di + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    // Update compass display
    setYawDisplay(Math.round(((yawRef.current * 180 / Math.PI) % 360 + 360) % 360));
  }, []);

  /* Physics + render loop */
  useEffect(() => {
    let lastRender = 0;
    function loop(now) {
      animRef.current = requestAnimationFrame(loop);
      if (!dragging.current) {
        const anyVel = Math.abs(velXRef.current) > 0.0001 || Math.abs(velYRef.current) > 0.0001;
        if (!anyVel) return;
        yawRef.current   += velXRef.current;
        pitchRef.current  = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, pitchRef.current + velYRef.current));
        velXRef.current  *= 0.91;
        velYRef.current  *= 0.91;
        if (now - lastRender > 16) { renderPano(); lastRender = now; }
      }
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [renderPano]);

  /* Pointer events */
  const onDown = (e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX ?? e.touches?.[0].clientX, y: e.clientY ?? e.touches?.[0].clientY };
    velXRef.current = 0; velYRef.current = 0;
  };
  const onMove = useCallback((e) => {
    if (!dragging.current) return;
    const cx = e.clientX ?? e.touches?.[0].clientX;
    const cy = e.clientY ?? e.touches?.[0].clientY;
    const dx = cx - lastPos.current.x;
    const dy = cy - lastPos.current.y;
    const sens = 0.005;
    yawRef.current   += dx * sens;
    pitchRef.current  = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, pitchRef.current - dy * sens));
    velXRef.current   = dx * sens;
    velYRef.current   = -dy * sens;
    lastPos.current   = { x: cx, y: cy };
    renderPano();
  }, [renderPano]);
  const onUp = () => { dragging.current = false; };

  useEffect(() => {
    const onWheel = (e) => {
      setFov(prev => {
        const next = prev + e.deltaY * 0.001;
        return Math.max(Math.PI / 4, Math.min(Math.PI / 1.1, next));
      });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[#030305]"
      onMouseDown={onDown}
      onTouchStart={onDown}
      style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
    >
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <div className="w-12 h-12 border-4 border-purple-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-xs font-black tracking-widest uppercase">Loading panorama…</p>
        </div>
      )}

      {/* Canvas — rendered at small res, scaled to fill */}
      <canvas
        ref={canvasRef}
        width={PANO_W}
        height={PANO_H}
        className="transition-opacity duration-500"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'auto',
          opacity: loaded ? 1 : 0,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%)' }}
      />

      {/* Compass HUD */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none">
        {/* Compass bar */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-bg-card/40 backdrop-blur-3xl border border-border pointer-events-auto shadow-2xl">
          <span className="text-[9px] font-black text-purple-primary uppercase tracking-widest">YAW</span>
          <span className="text-sm font-black text-text-primary font-mono w-12 text-center">{yawDisplay}°</span>
          <div className="w-28 h-1 rounded-full bg-bg-elevated relative overflow-hidden">
            <div
              className="absolute top-0 h-full w-2 rounded-full bg-purple-primary shadow-[0_0_10px_rgba(124,58,237,0.5)]"
              style={{ left: `${(yawDisplay / 360) * 100}%`, transition: 'left 0.1s' }}
            />
          </div>
        </div>

        {/* Zoom Control */}
        <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-bg-card/40 backdrop-blur-3xl border border-border mt-2 pointer-events-auto shadow-xl">
          <Maximize2 size={12} className="text-blue-500" />
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">ZOOM</span>
          <input 
            type="range" 
            min={Math.PI / 4} 
            max={Math.PI / 1.1} 
            step={0.01} 
            value={fov} 
            onChange={(e) => setFov(Number(e.target.value))}
            className="w-24 h-1 bg-bg-elevated rounded-full appearance-none accent-blue-500 cursor-pointer outline-none"
          />
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-bg-card/40 backdrop-blur-2xl border border-border text-text-muted text-[10px] font-black tracking-widest uppercase shadow-2xl">
          <Move size={12} className="text-purple-primary animate-bounce" />
          Drag to explore • Scroll to zoom (coming soon)
        </div>
      </div>

      {/* Info badge */}
      <div className="absolute top-6 right-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-bg-card/40 backdrop-blur-3xl border border-border text-[9px] font-black text-text-muted uppercase tracking-widest pointer-events-none shadow-xl">
        <Info size={10} /> Equirectangular Projection
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODE 3: 2D → 3D ANAGLYPH
   - Proper canvas red-cyan stereoscopic separation
   - Depth slider (2 – 32 px)
   - Wiggle mode: no glasses needed (alternates L/R at 8fps)
══════════════════════════════════════════════════════════════ */
function AnaglyphMode({ imageUrl }) {
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const [depth, setDepth]     = useState(10);
  const [wiggle, setWiggle]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ready, setReady]     = useState(false);
  const wiggleRef  = useRef(null);
  const wiggleStep = useRef(0);

  /* Load image once */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  /* Re-render anaglyph when depth or ready changes */
  useEffect(() => {
    if (!ready || wiggle) return;
    clearInterval(wiggleRef.current);
    renderAnaglyph(depth);
  }, [depth, ready, wiggle]);

  /* Wiggle mode: alternate L / R offset at 8 fps to create depth without glasses */
  useEffect(() => {
    if (!ready) return;
    if (wiggle) {
      let t = 0;
      wiggleRef.current = setInterval(() => {
        const off = t % 2 === 0 ? depth : -depth;
        renderParallaxShift(off);
        t++;
      }, 125); // 8fps
    } else {
      clearInterval(wiggleRef.current);
      renderAnaglyph(depth);
    }
    return () => clearInterval(wiggleRef.current);
  }, [wiggle, depth, ready]);

  function getScaledDimensions() {
    const img = imgRef.current;
    if (!img) return { w: 800, h: 450 };
    const maxW = Math.min(window.innerWidth * 0.85, 1200);
    const maxH = window.innerHeight * 0.72;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    return { w: Math.floor(img.naturalWidth * scale), h: Math.floor(img.naturalHeight * scale) };
  }

  function getPixels(w, h) {
    const img = imgRef.current;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h).data;
  }

  function renderAnaglyph(d) {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    setProcessing(true);
    requestAnimationFrame(() => {
      const { w, h } = getScaledDimensions();
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const src = getPixels(w, h);
      const result = ctx.createImageData(w, h);
      const dst = result.data;
      const half = Math.floor(d / 2);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;

          // Left eye (red): shift right — makes object appear in front
          const lx = Math.min(x + half, w - 1);
          const li = (y * w + lx) * 4;
          const lGray = src[li] * 0.299 + src[li + 1] * 0.587 + src[li + 2] * 0.114;

          // Right eye (cyan): shift left
          const rx = Math.max(x - half, 0);
          const ri = (y * w + rx) * 4;
          const rGray = src[ri] * 0.299 + src[ri + 1] * 0.587 + src[ri + 2] * 0.114;

          dst[i + 0] = lGray;          // R (left eye)
          dst[i + 1] = rGray * 0.75;   // G (right eye)
          dst[i + 2] = rGray;          // B (right eye)
          dst[i + 3] = 255;
        }
      }
      ctx.putImageData(result, 0, 0);
      setProcessing(false);
    });
  }

  function renderParallaxShift(offset) {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const { w, h } = getScaledDimensions();
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.translate(offset, 0);
    ctx.drawImage(imgRef.current, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 overflow-auto">
      {/* Mode badges */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Glasses pill */}
        {!wiggle && (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-500/90 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
            <span className="text-rose-600">■</span>
            Wear red-cyan 3D glasses
            <span className="text-cyan-500">■</span>
          </div>
        )}
        {wiggle && (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-purple-primary/30 bg-purple-primary/10 text-purple-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
            <Zap size={14} fill="currentColor" />
            Wiggle 3D — no glasses needed
          </div>
        )}
      </div>

      {/* Output */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-border bg-bg-secondary/40 backdrop-blur-3xl group">
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 backdrop-blur-md z-10">
            <div className="w-12 h-12 border-4 border-purple-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="block max-w-full"
          style={{ maxHeight: '60vh', imageRendering: 'auto' }}
        />
        {!ready && (
          <div className="w-[600px] max-w-[80vw] h-[338px] flex flex-col items-center justify-center bg-bg-elevated/40 text-text-muted gap-4">
            <div className="w-10 h-10 border-4 border-purple-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black tracking-widest uppercase">Initializing Canvas…</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-8 px-10 py-6 rounded-[2rem] bg-bg-card/40 border border-border backdrop-blur-3xl shadow-2xl">
        {/* Depth slider */}
        <div className="flex items-center gap-4 min-w-[240px]">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest w-14">Depth</span>
          <input
            type="range"
            min={2}
            max={32}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="flex-1 h-1.5 bg-bg-elevated rounded-full appearance-none cursor-pointer outline-none accent-purple-primary"
          />
          <span className="text-xs font-black text-purple-primary font-mono w-10 text-right">{depth}px</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10 hidden sm:block" />

        {/* Wiggle toggle */}
        <button
          onClick={() => setWiggle(w => !w)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border shadow-lg ${
            wiggle
              ? 'bg-purple-primary/20 border-purple-primary/40 text-purple-primary md:scale-105'
              : 'bg-bg-elevated hover:bg-bg-hover border-border text-text-muted'
          }`}
        >
          <Zap size={14} fill={wiggle ? 'currentColor' : 'none'} />
          Wiggle Mode {wiggle ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
