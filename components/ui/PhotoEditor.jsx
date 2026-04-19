'use client';
/**
 * components/ui/PhotoEditor.jsx
 * Immersive Image Editor Studio v5.1 (Dimension Lab + Integrator Edition).
 * Handles: Color filters, Rotation, Custom Resizing, Border Radius, Color Tinting, 3D Anaglyph, and Parent Integration.
 */
import { useState, useRef, useEffect } from 'react';
import { 
  X, Download, Sun, Contrast, Droplets, 
  Wind, Ghost, Palette, Monitor, Smartphone, 
  RotateCcw, Check, Sparkles, Image as ImageIcon,
  Maximize2, Move, Paintbrush, Zap, Box, Orbit, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PhotoEditor({ imageUrl, wallpaperTitle, onClose, onOpen360, onOpen3D, onExport }) {
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
  });

  const [rotation, setRotation] = useState(0); 
  const [resolution, setResolution] = useState('original');
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [radius, setRadius] = useState(0);
  const [tintColor, setTintColor] = useState('#7c3aed');
  const [tintOpacity, setTintOpacity] = useState(0);
  const [anaglyphMode, setAnaglyphMode] = useState(false);
  const [upscale, setUpscale] = useState(1); // 1x, 2x, 4x
  const [sharpen, setSharpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const RESOLUTIONS = [
    { id: 'original', label: 'Original', icon: ImageIcon, desc: 'Highest Quality' },
    { id: '4k', label: '4K Cinema', icon: Monitor, desc: '3840 × 2160', w: 3840, h: 2160 },
    { id: '2k', label: '2K QHD', icon: Monitor, desc: '2560 × 1440', w: 2560, h: 1440 },
    { id: '1080p', label: '1080p FHD', icon: Monitor, desc: '1920 × 1080', w: 1920, h: 1080 },
    { id: '720p', label: '720p HD', icon: Monitor, desc: '1280 × 720', w: 1280, h: 720 },
    { id: 'mobile', label: 'Mobile Pro', icon: Smartphone, desc: '1440 × 3120', w: 1440, h: 3120 },
    { id: 'custom', label: 'Custom Size', icon: Maximize2, desc: 'Define Pixels' },
  ];

  useEffect(() => {
    if (imageRef.current) {
       imageRef.current.onload = () => {
         // Prevent overwriting custom sizes if already set
         if (resolution === 'original') {
            setCustomW(imageRef.current.naturalWidth);
            setCustomH(imageRef.current.naturalHeight);
         }
       };
    }
  }, [imageUrl, resolution]);

  const handleReset = () => {
    setFilters({ brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0, grayscale: 0 });
    setRotation(0);
    setRadius(0);
    setTintOpacity(0);
    setAnaglyphMode(false);
    setResolution('original');
    toast.success('Studio reset');
  };

  const getFilterString = () => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%)`;
  };

  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  };

  const downloadEditedImage = async () => {
    setLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    try {
      const isVertical = rotation === 90 || rotation === 270;
      let targetW, targetH;
      const resObj = RESOLUTIONS.find(r => r.id === resolution);
      
      if (resObj?.id === 'custom') {
        targetW = customW; targetH = customH;
      } else if (resObj?.w) {
        targetW = resObj.w; targetH = resObj.h;
      } else {
        targetW = isVertical ? image.naturalHeight : image.naturalWidth;
        targetH = isVertical ? image.naturalWidth : image.naturalHeight;
      }

      // Apply Upscale factor
      // Apply Upscale factor — ONLY to original/auto resolutions to avoid 16K crashes
      if (resolution === 'original' || resolution === 'custom') {
        targetW *= upscale;
        targetH *= upscale;
      }

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);
      
      if (radius > 0) {
        drawRoundedRect(ctx, 0, 0, targetW, targetH, radius);
        ctx.clip();
      }

      const renderPass = () => {
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        
        let filterStr = getFilterString();
        if (sharpen) {
          filterStr += ' contrast(110%) brightness(102%) saturate(108%)';
        }
        ctx.filter = filterStr;
        
        const drawW = isVertical ? targetH : targetW;
        const drawH = isVertical ? targetW : targetH;
        const scale = Math.max(drawW / image.naturalWidth, drawH / image.naturalHeight);
        
        ctx.drawImage(image, -image.naturalWidth / 2 * scale, -image.naturalHeight / 2 * scale, image.naturalWidth * scale, image.naturalHeight * scale);
        
        if (tintOpacity > 0) {
           ctx.globalCompositeOperation = 'color';
           ctx.globalAlpha = tintOpacity / 100;
           ctx.fillStyle = tintColor;
           const size = Math.max(targetW, targetH) * 2;
           ctx.fillRect(-size/2, -size/2, size, size);
        }
        ctx.restore();
      };

      if (anaglyphMode) {
         ctx.save();
         ctx.translate(-5, 0); renderPass();
         ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, targetW, targetH);
         ctx.restore();
         ctx.save();
         ctx.globalCompositeOperation = 'screen'; ctx.translate(5, 0); renderPass();
         ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#00ffff'; ctx.fillRect(0, 0, targetW, targetH);
         ctx.restore();
      } else {
         renderPass();
      }

      const format = radius > 0 || anaglyphMode ? 'image/png' : 'image/jpeg';
      const upscaleSuffix = upscale > 1 ? `-${upscale}x` : '';
      const finalName = `${wallpaperTitle.replace(/\s+/g, '-')}${upscaleSuffix}-fused.${format === 'image/png' ? 'png' : 'jpg'}`;
      
      if (onExport) {
         canvas.toBlob((blob) => {
            onExport(blob, finalName);
            toast.success('Edits applied to upload!');
            onClose();
         }, format, 0.95);
      } else {
         const dataUrl = canvas.toDataURL(format, 0.95);
         const link = document.createElement('a');
         link.download = finalName;
         link.href = dataUrl;
         link.click();
         toast.success('Dimension Lab Asset Saved!');
         onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('Export Failed');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewAspect = () => {
    const isVertical = rotation === 90 || rotation === 270;
    const resObj = RESOLUTIONS.find(r => r.id === resolution);
    if (resObj?.id === 'custom') return `${customW} / ${customH}`;
    if (resObj?.w) return `${resObj.w} / ${resObj.h}`;
    if (imageRef.current) {
      const w = isVertical ? imageRef.current.naturalHeight : imageRef.current.naturalWidth;
      const h = isVertical ? imageRef.current.naturalWidth : imageRef.current.naturalHeight;
      return `${w} / ${h}`;
    }
    return '16 / 9';
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0f] lg:left-64 flex flex-col md:flex-row animate-fade-in overflow-hidden shadow-2xl">
      {/* ── Left Sidebar ── */}
      <aside className="w-full md:w-80 h-full bg-[#0d0d14] border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-white/5 hidden md:flex items-center justify-between sticky top-0 bg-[#0d0d14] z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xs font-black tracking-widest text-white uppercase italic">Dimension Lab</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Section: Geometry */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Geometry Suite</h3>
                <button onClick={handleReset} className="text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase transition-colors">Reset Lab</button>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setRotation((r) => (r + 90) % 360)} className="h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-[10px] font-black text-text-secondary transition-all">
                  <RotateCcw size={12} className="text-purple-400" /> ROTATE 90°
                </button>
                <div className="flex items-center justify-center h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase italic px-2 truncate">Framing Active</div>
             </div>
             <div className="pt-2">
               <ControlSlider icon={Move} label="Border Radius" value={radius} min={0} max={200} onChange={setRadius} />
             </div>
          </section>

          {/* Section: Dimensions */}
          <section className="space-y-4 pt-5 border-t border-white/5">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Physical Dimensions</h3>
             <div className="grid grid-cols-2 gap-2">
               {RESOLUTIONS.map((res) => (
                 <button key={res.id} onClick={() => setResolution(res.id)} className={`p-3 rounded-xl border text-left transition-all ${resolution === res.id ? 'bg-purple-primary/10 border-purple-primary/40 text-white' : 'bg-white/5 border-transparent text-text-muted hover:bg-white/[0.08]'}`}>
                   <res.icon size={13} className={resolution === res.id ? 'text-purple-400' : ''} />
                   <p className="text-[10px] font-black mt-2 uppercase tracking-tighter leading-none">{res.label}</p>
                   <p className="text-[8px] font-bold opacity-60 mt-1">{res.desc}</p>
                 </button>
               ))}
             </div>
             {resolution === 'custom' && (
               <div className="grid grid-cols-2 gap-3 mt-3 animate-slide-up">
                 <DimensionInput label="Width" value={customW} onChange={setCustomW} />
                 <DimensionInput label="Height" value={customH} onChange={setCustomH} />
               </div>
             )}
          </section>

          {/* Section: Immerse triggers */}
          {(onOpen3D || onOpen360) && (
            <section className="space-y-4 pt-5 border-t border-white/5">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Dimension Lab (IMMERSE)</h3>
               <div className="grid grid-cols-2 gap-2">
                  {onOpen3D && (
                    <button onClick={onOpen3D} className="h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 hover:bg-purple-500/20 transition-all flex flex-col items-center justify-center gap-1">
                       <Box size={14} /> 3D SPACE
                    </button>
                  )}
                  {onOpen360 && (
                    <button onClick={onOpen360} className="h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 hover:bg-blue-500/20 transition-all flex flex-col items-center justify-center gap-1">
                       <Orbit size={14} /> 360 VIEW
                    </button>
                  )}
               </div>
            </section>
          )}

          {/* Section: 2D to 3D */}
          <section className="space-y-4 pt-5 border-t border-white/5">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">3D Lab (2D Conversion)</h3>
             <button 
               onClick={() => setAnaglyphMode(!anaglyphMode)}
               className={`w-full h-12 rounded-2xl flex items-center justify-center gap-3 transition-all border-2 ${
                 anaglyphMode 
                   ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                   : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10'
               }`}
             >
                <Zap size={16} fill={anaglyphMode ? "currentColor" : "none"} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cinema 3D Mode</span>
                {anaglyphMode && <Check size={14} />}
             </button>
          </section>

          {/* Section: Upscale */}
          <section className="space-y-4 pt-5 border-t border-white/5">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">High-Res Synthesis (UPSCALE)</h3>
             <div className="grid grid-cols-3 gap-2">
                {[1, 2, 4].map((factor) => (
                  <button 
                    key={factor}
                    onClick={() => setUpscale(factor)}
                    className={`h-10 rounded-xl border flex items-center justify-center text-[10px] font-black transition-all ${upscale === factor ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10'}`}
                  >
                     {factor}X
                  </button>
                ))}
             </div>
             <button 
               onClick={() => setSharpen(!sharpen)}
               className={`w-full h-10 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black transition-all ${sharpen ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10'}`}
             >
                <Zap size={12} fill={sharpen ? "currentColor" : "none"} /> SMART ENHANCE {sharpen ? 'ON' : 'OFF'}
             </button>
          </section>

          {/* Section: Tinting */}
          <section className="space-y-4 pt-5 border-t border-white/5">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Atmospheric Tinting</h3>
             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <input type="color" value={tintColor} onChange={(e) => setTintColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 outline-none p-0 overflow-hidden" />
                <div className="flex-1 space-y-2">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase text-text-secondary">
                      <span>Intensity</span> <span>{tintOpacity}%</span>
                   </div>
                   <input type="range" min="0" max="100" value={tintOpacity} onChange={(e) => setTintOpacity(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none accent-purple-primary cursor-pointer outline-none" />
                </div>
             </div>
          </section>

          {/* Section: Master Filters */}
          <section className="space-y-5 pt-5 border-t border-white/5 pb-20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Visual Alchemy</h3>
            <div className="space-y-4">
              <ControlSlider icon={Sun} label="Brightness" value={filters.brightness} min={0} max={200} onChange={(v) => setFilters({...filters, brightness: v})} />
              <ControlSlider icon={Contrast} label="Contrast" value={filters.contrast} min={0} max={200} onChange={(v) => setFilters({...filters, contrast: v})} />
              <ControlSlider icon={Droplets} label="Saturation" value={filters.saturation} min={0} max={200} onChange={(v) => setFilters({...filters, saturation: v})} />
              <ControlSlider icon={Wind} label="Soft Blur" value={filters.blur} min={0} max={20} onChange={(v) => setFilters({...filters, blur: v})} />
            </div>
          </section>
        </div>

        <div className="p-6 mt-auto border-t border-white/5 bg-black/40 backdrop-blur-3xl sticky bottom-0 z-20">
           <button onClick={downloadEditedImage} disabled={loading} className="w-full h-12 rounded-xl bg-purple-primary hover:bg-purple-600 text-white font-black text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-900/30 disabled:opacity-50">
             {loading ? <LoadingCircle /> : (onExport ? <Save size={16} /> : <Download size={16} />)}
             {onExport ? 'APPLY MASTER EDITS' : 'EXPORT MASTER LAB'}
           </button>
        </div>
      </aside>

      {/* ── Visual Viewport ── */}
      <main className="flex-1 relative bg-[#050508] flex items-center justify-center p-4 md:p-12 overflow-hidden select-none">
        <div className="absolute top-8 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl text-[10px] font-black text-text-muted tracking-[0.3em] z-20 shadow-2xl">
           PRODUCTION VIEWPORT • {anaglyphMode ? 'STEREOSCOPIC' : resolution.toUpperCase()}
        </div>

        <div className="relative group transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden" 
          style={{ 
            borderRadius: `${radius}px`, 
            aspectRatio: getPreviewAspect(), 
            width: '100%', maxWidth: '100%', maxHeight: '85vh', 
            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' 
          }}
        >
           {/* Layer 0: Adaptive Blurred Mirror Background */}
           <div className="absolute inset-0 opacity-40 blur-3xl scale-125 pointer-events-none">
              <img src={imageUrl} className="w-full h-full object-cover" />
           </div>

           {/* Layer 1: Focused Image (Smart Contain) */}
           <img 
              ref={imageRef} src={imageUrl} alt="Studio Preview" 
              style={{ filter: getFilterString(), transform: `rotate(${rotation}deg)`, width: '100%', height: '100%', objectFit: 'contain' }} 
              className={`relative z-10 pointer-events-none transition-transform duration-700 ${anaglyphMode ? 'opacity-0' : 'opacity-100'}`} 
              crossOrigin="anonymous" 
           />
           
           {/* Layer 2: 3D Anaglyph Rendering */}
           {anaglyphMode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                 <div style={{ backgroundImage: `url(${imageUrl})`, filter: 'sepia(1) hue-rotate(-50deg) brightness(1.2)', mixBlendMode: 'screen', transform: 'translateX(-4px)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} className="absolute inset-0 opacity-80" />
                 <div style={{ backgroundImage: `url(${imageUrl})`, filter: 'sepia(1) hue-rotate(150deg) brightness(1.2)', mixBlendMode: 'screen', transform: 'translateX(4px)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} className="absolute inset-0 opacity-80" />
              </div>
           )}
           <div className="absolute inset-0 pointer-events-none transition-all duration-300 z-30" style={{ backgroundColor: tintColor, opacity: tintOpacity / 100, mixBlendMode: 'color' }} />
        </div>

        {loading && <RenderingOverlay />}
        <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
}

function ControlSlider({ icon: Icon, label, value, min, max, onChange }) {
  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between text-[11px] font-black uppercase text-text-secondary">
        <div className="flex items-center gap-2"><Icon size={12} className="text-purple-400" /> <span>{label}</span></div>
        <span className="text-purple-400 font-mono">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none accent-purple-primary cursor-pointer outline-none" />
    </div>
  );
}

function DimensionInput({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-black text-text-muted uppercase px-1">{label}</p>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-purple-500 outline-none transition-all" />
    </div>
  );
}

function RenderingOverlay() {
  return (
    <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-2xl flex flex-col items-center justify-center z-[50]">
      <div className="w-72 space-y-6 text-center">
         <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
         <p className="text-sm font-black tracking-widest text-white uppercase italic">Finalizing Synthesis...</p>
      </div>
    </div>
  );
}

function LoadingCircle() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />;
}
