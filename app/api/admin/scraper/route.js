import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import axios from 'axios';
import { load } from 'cheerio';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin' && authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      },
    });

    const $ = load(response.data);
    const imageUrls = [];

    // Select all images
    $('img').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        try {
          // Resolve relative URLs using base URL
          const absoluteUrl = new URL(src, url).href;
          // Filter out svgs, base64 (too noisy usually) - but include clean image ends
          if (!absoluteUrl.startsWith('data:') && !absoluteUrl.includes('.svg')) {
            imageUrls.push(absoluteUrl);
          }
        } catch (e) {
          // invalid URL, ignore
        }
      }
    });

    // Option: also get og:image or high-res anchors
    $('meta[property="og:image"]').each((i, el) => {
      let content = $(el).attr('content');
      if (content && content.startsWith('http')) {
        imageUrls.push(content);
      }
    });

    $('a').each((i, el) => {
      let href = $(el).attr('href');
      if (href && (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png') || href.endsWith('.webp'))) {
        try {
          imageUrls.push(new URL(href, url).href);
        } catch (e) {}
      }
    });

    // Extract Context for auto-filling
    let pageTitle = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
    pageTitle = pageTitle.trim().replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s\s+/g, ' '); // Clean title

    const keywordsContent = $('meta[name="keywords"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    let keywords = [];
    if (keywordsContent) {
      keywords = keywordsContent.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0).slice(0, 5);
    }

    // Deduplicate array
    const sortedImages = [...new Set(imageUrls)];

    return NextResponse.json({ images: sortedImages, pageTitle, keywords });
  } catch (error) {
    console.error('Scraper error:', error.message);
    return NextResponse.json({ error: 'Failed to scrape URL. It might be blocking automated requests.' }, { status: 500 });
  }
}
