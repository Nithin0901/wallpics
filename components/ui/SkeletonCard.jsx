/**
 * components/ui/SkeletonCard.jsx
 * Shimmer skeleton loader for wallpaper cards.
 */
export default function SkeletonCard({ index = 0 }) {
  const aspectRatio = index % 3 === 0 ? '10/14' : '16/9';
  
  return (
    <div className="card overflow-hidden break-inside-avoid-column mb-4">
      {/* Image skeleton */}
      <div className="skeleton" style={{ aspectRatio }} />
      {/* Footer skeleton */}
      <div className="px-3 py-3 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="columns-2 md:columns-3 xl:columns-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}
