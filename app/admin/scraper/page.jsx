'use client';
import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { Search, Image as ImageIcon, CheckCircle, DownloadCloud, AlertCircle } from 'lucide-react';
import { useCategories } from '@/lib/useCategories';

export default function AdminScraperPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [scrapedTags, setScrapedTags] = useState([]);
  const { categories } = useCategories();
  
  const [importState, setImportState] = useState({});
  const [bulkConfig, setBulkConfig] = useState({ titlePrefix: 'Scraped Image', mainCategory: '', subCategory: '' });
  const [bulkImporting, setBulkImporting] = useState(false);

  const mainCategories = categories.filter((c) => c.type === 'main');
  const subCategories = categories.filter((c) => c.type === 'sub');

  const handleScrape = async (e) => {
    e?.preventDefault();
    if (!url) return toast.error('Please enter a URL');

    setLoading(true);
    setImages([]);
    setImportState({});
    
    try {
      const { data } = await apiClient.post('/admin/scraper', { url });
      if (data.images?.length > 0) {
        setImages(data.images);
        setScrapedTags(data.keywords || []);
        
        const autoTitle = data.pageTitle ? data.pageTitle.substring(0, 30) : 'Scraped Image';
        
        let autoMain = mainCategories.length > 0 ? mainCategories[0].name : '';
        let autoSub = subCategories.length > 0 ? subCategories[0].name : '';

        // Smart Semantic Mapping for Categories
        const searchContext = (autoTitle + ' ' + (data.keywords || []).join(' ')).toLowerCase();
        
        const matchedMain = mainCategories.find(c => searchContext.includes(c.name.toLowerCase()));
        if (matchedMain) autoMain = matchedMain.name;
        
        const matchedSub = subCategories.find(c => searchContext.includes(c.name.toLowerCase()));
        if (matchedSub) autoSub = matchedSub.name;

        setBulkConfig({
          titlePrefix: autoTitle,
          mainCategory: autoMain,
          subCategory: autoSub
        });

        // Pre-fill individual input states as well
        const presetState = {};
        data.images.forEach((_, i) => {
          presetState[i] = {
            title: `${autoTitle} ${i + 1}`,
            mainCategory: autoMain,
            subCategory: autoSub
          };
        });
        setImportState(presetState);

        toast.success(`Found ${data.images.length} images automatically configured`);
      } else {
        toast.error('No valid images found at that URL');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to scrape website');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (imageUrl, index) => {
    const state = importState[index] || {};
    if (!state.title || !state.mainCategory || !state.subCategory) {
      return toast.error('Please fill in Title, Main Category, and Sub Category to import');
    }

    setImportState(prev => ({ ...prev, [index]: { ...prev[index], importing: true } }));

    try {
      const { data } = await apiClient.post('/admin/scraper/import', {
        imageUrl,
        title: state.title,
        mainCategory: state.mainCategory,
        subCategory: state.subCategory,
        tags: scrapedTags
      });
      toast.success(data.message);
      setImportState(prev => ({ ...prev, [index]: { ...prev[index], importing: false, done: true } }));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to import image');
      setImportState(prev => ({ ...prev, [index]: { ...prev[index], importing: false } }));
    }
  };

  const handleBulkImport = async () => {
    if (!bulkConfig.titlePrefix || !bulkConfig.mainCategory || !bulkConfig.subCategory) {
      return toast.error("Please configure bulk settings (Title Prefix, Main & Sub Category) first.");
    }
    
    setBulkImporting(true);
    let successCount = 0;
    
    for (let i = 0; i < images.length; i++) {
        if (importState[i]?.done) continue;
        
        const state = importState[i] || {};
        const titleToUse = state.title || `${bulkConfig.titlePrefix} ${i + 1}`;
        const mainCatToUse = state.mainCategory || bulkConfig.mainCategory;
        const subCatToUse = state.subCategory || bulkConfig.subCategory;
        
        setImportState(prev => ({ ...prev, [i]: { ...prev[i], importing: true } }));
        
        try {
          await apiClient.post('/admin/scraper/import', {
            imageUrl: images[i],
            title: titleToUse,
            mainCategory: mainCatToUse,
            subCategory: subCatToUse,
            tags: scrapedTags
          });
          setImportState(prev => ({ ...prev, [i]: { ...prev[i], importing: false, done: true } }));
          successCount++;
        } catch (error) {
          setImportState(prev => ({ ...prev, [i]: { ...prev[i], importing: false } }));
        }
    }
    
    setBulkImporting(false);
    toast.success(`Successfully batch imported ${successCount} images!`);
  };

  const updateState = (index, field, value) => {
    setImportState(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-purple-primary/10 flex items-center justify-center text-purple-primary">
          <DownloadCloud size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase italic">Web Scraper</h1>
          <p className="text-sm font-medium text-text-muted">Extract images from external sites for pending review</p>
        </div>
      </div>

      <div className="bg-bg-elevated p-6 rounded-2xl border border-border mb-8 shadow-sm">
        <form onSubmit={handleScrape} className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="url"
              placeholder="https://example.com/beautiful-wallpapers"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-12 pr-4 h-12 bg-bg-card border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:border-purple-primary transition-colors"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="h-12 px-8 rounded-xl bg-purple-primary text-white text-sm font-bold tracking-widest uppercase hover:bg-purple-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scraping...' : 'Scrape URL'}
          </button>
        </form>
        <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
          <AlertCircle size={14} /> Only valid URLs are parsed. Protected websites mapping images via canvas/tokens may fall back to low-quality images.
        </div>
      </div>

      {images.length > 0 && (
        <>
        <div className="bg-purple-primary/10 border border-purple-primary/20 p-5 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 text-sm font-black tracking-widest uppercase text-purple-primary flex items-center gap-2">
               Bulk Import
            </div>
            <input 
              type="text" placeholder="Title Prefix" value={bulkConfig.titlePrefix} onChange={e => setBulkConfig({...bulkConfig, titlePrefix: e.target.value})} 
              className="h-10 px-3 bg-bg-card border border-purple-primary/20 rounded-lg text-sm font-semibold text-text-primary focus:border-purple-primary w-full md:w-auto"
            />
            <select 
               value={bulkConfig.mainCategory} onChange={e => setBulkConfig({...bulkConfig, mainCategory: e.target.value})} 
               className="h-10 px-3 bg-bg-card border border-purple-primary/20 rounded-lg text-sm text-text-primary appearance-none focus:border-purple-primary w-full md:w-auto"
            >
               <option value="" disabled>Main Category</option>
               {mainCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
            <select 
               value={bulkConfig.subCategory} onChange={e => setBulkConfig({...bulkConfig, subCategory: e.target.value})} 
               className="h-10 px-3 bg-bg-card border border-purple-primary/20 rounded-lg text-sm text-text-primary appearance-none focus:border-purple-primary w-full md:w-auto"
            >
               <option value="" disabled>Sub Category</option>
               {subCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
            <button 
               onClick={handleBulkImport} 
               disabled={bulkImporting} 
               className="h-10 px-6 rounded-lg bg-purple-primary hover:bg-purple-primary/90 text-white text-[11px] tracking-[0.2em] font-black uppercase transition-all whitespace-nowrap disabled:opacity-50 w-full md:w-auto"
            >
               {bulkImporting ? 'IMPORTING...' : 'IMPORT ALL PENDING'}
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 tracking-tight">
          {images.map((imgUrl, index) => {
            const state = importState[index] || {};
            const isDone = state.done;
            return (
              <div key={index} className="bg-bg-elevated rounded-2xl border border-border overflow-hidden flex flex-col group relative">
                <div className="aspect-[4/3] bg-bg-card relative">
                  <img src={imgUrl} alt="Scraped" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white font-mono break-all line-clamp-1 max-w-[90%]">
                    {new URL(imgUrl).hostname}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1 relative z-10 bg-bg-elevated">
                  {isDone ? (
                     <div className="flex-1 flex flex-col items-center justify-center py-6 text-accent-green">
                        <CheckCircle size={32} className="mb-2" />
                        <span className="text-sm font-bold uppercase tracking-widest">Added to Pending</span>
                     </div>
                  ) : (
                    <>
                      <input 
                        type="text"
                        placeholder="Wallpaper Title"
                        value={state.title || ''}
                        onChange={(e) => updateState(index, 'title', e.target.value)}
                        className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:border-purple-primary transition-colors"
                      />
                      <select
                        value={state.mainCategory || ''}
                        onChange={(e) => updateState(index, 'mainCategory', e.target.value)}
                        className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary appearance-none focus:border-purple-primary transition-colors"
                      >
                        <option value="" disabled>Select Main Category</option>
                        {mainCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                      <select
                        value={state.subCategory || ''}
                        onChange={(e) => updateState(index, 'subCategory', e.target.value)}
                        className="w-full h-10 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary appearance-none focus:border-purple-primary transition-colors"
                      >
                        <option value="" disabled>Select Sub Category</option>
                        {subCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                      
                      <button 
                        onClick={() => handleImport(imgUrl, index)}
                        disabled={state.importing}
                        className="w-full h-10 mt-auto rounded-lg bg-bg-card border border-border hover:border-purple-primary hover:text-purple-primary text-text-primary text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {state.importing ? 'Importing...' : 'Import'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
