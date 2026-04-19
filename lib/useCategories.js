'use client';
/**
 * lib/useCategories.js
 * A custom hook to fetch and cache categories across client components
 * without redundant network requests.
 */
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

// Module-level cache
let cachedCategories = null;
let fetchPromise = null;

export function useCategories() {
  const [categories, setCategories] = useState(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedCategories);

  useEffect(() => {
    if (cachedCategories) {
      setCategories(cachedCategories);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = apiClient.get('/categories').then((res) => {
        cachedCategories = res.data.categories;
        return cachedCategories;
      });
    }

    let isMounted = true;

    fetchPromise
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/categories');
      cachedCategories = res.data.categories;
      setCategories(cachedCategories);
    } catch (error) {
      console.error('Error refreshing categories:', error);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, refreshCategories };
}
