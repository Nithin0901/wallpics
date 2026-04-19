'use client';
/**
 * app/(main)/page.jsx — Homepage
 * Hero banner + Trending + Categories + Latest (infinite scroll)
 */
import FeaturedSection from '@/components/home/FeaturedSection';
import TrendingSection from '@/components/home/TrendingSection';
import CategorySection from '@/components/home/CategorySection';
import LatestSection from '@/components/home/LatestSection';

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      <FeaturedSection />
      <TrendingSection />
      <CategorySection />
      <LatestSection />
    </div>
  );
}
