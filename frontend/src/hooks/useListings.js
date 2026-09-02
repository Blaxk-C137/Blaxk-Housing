// frontend/src/hooks/useListings.js

import { useState, useEffect } from 'react';
import api from '../services/api';

export const useListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedListings, setSavedListings] = useState(() => {
    try {
      const saved = localStorage.getItem('savedListings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let mounted = true;

    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Fetching listings...');
        const res = await api.get('/listings/');
        console.log('✅ Listings response:', res.data);

        if (mounted && res?.data) {
          setListings(Array.isArray(res.data) ? res.data : res.data?.results || []);
        }
      } catch (err) {
        console.error('❌ Error fetching listings:', err);
        if (mounted) {
          setError(err.message);
          setListings([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchListings();

    // Listen for newly created listings
    const handleNew = (e) => {
      if (!e?.detail) return;
      setListings(prev => {
        const exists = prev.some(item => item.id === e.detail.id);
        return exists ? prev : [e.detail, ...prev];
      });
    };

    window.addEventListener('buk:newListing', handleNew);

    return () => {
      mounted = false;
      window.removeEventListener('buk:newListing', handleNew);
    };
  }, []);

  // Persist saved listings
  useEffect(() => {
    localStorage.setItem('savedListings', JSON.stringify(savedListings));
  }, [savedListings]);

  const toggleSave = (listingId) => {
    setSavedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  return { listings, savedListings, toggleSave, setListings, loading, error };
};
