'use client';
/**
 * components/home/LatestSection.jsx
 * Infinite-scroll grid of latest approved wallpapers.
 * Uses IntersectionObserver to auto-load next page.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';
import WallpaperCard from '@/components/ui/WallpaperCard';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LatestSection() {
  const [wallpapers, setWallpapers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());
  const observerRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch a page of wallpapers
  const fetchPage = useCallback(async (pageNum) => {
    try {
      const { data } = await apiClient.get(`/wallpapers?sort=latest&page=${pageNum}&limit=16`);
      return data;
    } catch {
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPage(1).then((data) => {
      if (data) {
        setWallpapers(data.wallpapers);
        setHasMore(data.pagination.hasMore);
      }
      setLoading(false);
    });

    // Load user's liked wallpapers
    if (isAuthenticated) {
      apiClient.get('/users/my-likes').then((r) => {
        const ids = new Set(r.data.wallpapers.map((w) => w._id));
        setLikedIds(ids);
      }).catch(() => {});
    }
  }, [fetchPage, isAuthenticated]);

  // Infinite scroll sentinel
  const sentinelRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            setLoadingMore(true);
            const nextPage = page + 1;
            fetchPage(nextPage).then((data) => {
              if (data) {
                setWallpapers((prev) => [...prev, ...data.wallpapers]);
                setHasMore(data.pagination.hasMore);
                setPage(nextPage);
              }
              setLoadingMore(false);
            });
          }
        },
        { rootMargin: '200px' }
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, page, fetchPage]
  );

  // Like / unlike handler
  async function handleLike(wallpaperId) {
    if (!isAuthenticated) {
      toast.error('Please sign in to like wallpapers');
      return;
    }
    try {
      const { data } = await apiClient.put(`/wallpapers/${wallpaperId}/like`);
      setLikedIds((prev) => {
        const next = new Set(prev);
        data.liked ? next.add(wallpaperId) : next.delete(wallpaperId);
        return next;
      });
      setWallpapers((prev) =>
        prev.map((w) =>
          w._id === wallpaperId ? { ...w, likes: data.likes } : w
        )
      );
    } catch {
      toast.error('Failed to update like');
    }
  }

  return (
    <section className="mb-8">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Clock size={20} className="text-blue-400" />
            Latest Uploads
          </h2>
          <p className="section-sub">Check out the newest additions</p>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={12} />
      ) : wallpapers.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-lg font-medium">No wallpapers yet</p>
          <p className="text-sm mt-1">Be the first to upload!</p>
        </div>
      ) : (
        <>
          <div className="columns-2 md:columns-3 xl:columns-4 gap-4">
            {wallpapers.map((w) => (
              <WallpaperCard
                key={w._id}
                wallpaper={w}
                liked={likedIds.has(w._id)}
                onLike={handleLike}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <div
                  className="w-4 h-4 rounded-full border-2 border-purple-primary border-t-transparent animate-spin"
                />
                Loading more...
              </div>
            )}
            {!hasMore && wallpapers.length > 0 && (
              <p className="text-text-muted text-sm">You've seen all wallpapers ✨</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
