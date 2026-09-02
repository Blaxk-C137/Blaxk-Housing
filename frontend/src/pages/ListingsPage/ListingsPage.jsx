// frontend/src/pages/ListingsPage/ListingsPage.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X, Search, SlidersHorizontal,
  LayoutGrid, List, RefreshCw, AlertCircle, Building2, Loader2, SearchX,
} from 'lucide-react';
import ListingCard from '../../components/ListingCard';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Chip } from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Sheet from '../../components/ui/Sheet';
import api from '../../services/api';

const TOILET_CHIPS = [
  { value: 'all', label: 'All toilets' },
  { value: 'ensuite', label: 'Ensuite' },
  { value: 'shared', label: 'Shared' },
];

const WATER_CHIPS = [
  { value: 'all', label: 'Any water' },
  { value: 'available', label: 'Water on' },
  { value: 'limited', label: 'Limited water' },
  { value: 'unavailable', label: 'No water' },
];

const ListingsPage = ({
  filteredListings: propListings,
  savedListings,
  toggleSave
}) => {
  // navigation not required here
  const location = useLocation();

  // Local state for better control
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    priceRange: [0, 500000],
    toiletType: 'all',
    leaseType: 'all',
    waterStatus: 'all',
    propertyType: 'all',
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const filterTimerRef = useRef(null);

  const startFiltering = useCallback(() => {
    setIsFiltering(true);
    if (filterTimerRef.current) {
      clearTimeout(filterTimerRef.current);
    }
    filterTimerRef.current = setTimeout(() => {
      setIsFiltering(false);
      filterTimerRef.current = null;
    }, 250);
  }, []);

  // Adopt search criteria handed over from the landing page hero search
  useEffect(() => {
    const { search, priceMax } = location.state || {};
    if (typeof search === 'string' && search) {
      setSearchQuery(search);
    }
    if (typeof priceMax === 'number' && priceMax > 0 && priceMax < filters.priceRange[1]) {
      setFilters(prev => ({ ...prev, priceRange: [0, priceMax] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Fetch listings directly if not passed as props
  useEffect(() => {
    const fetchListings = async () => {
      // If listings are passed as props and have data, use them
      if (propListings && propListings.length > 0) {
        setListings(propListings);
        setLoading(false);
        return;
      }

      // Otherwise fetch from API
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/listings/');

        // Handle both array and paginated responses
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

        setListings(data);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [propListings]);

  // Filter and sort listings
  const processedListings = useMemo(() => {
    let result = [...listings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(listing =>
        listing.title?.toLowerCase().includes(query) ||
        listing.location?.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query)
      );
    }

    // Price filter
    result = result.filter(listing => {
      const price = parseFloat(listing.price) || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Toilet type filter - handle both snake_case and camelCase
    if (filters.toiletType !== 'all') {
      result = result.filter(listing => {
        const toiletType = (listing.toilet_type || listing.toiletType || '').toLowerCase();
        return toiletType === filters.toiletType.toLowerCase();
      });
    }

    // Lease type filter
    if (filters.leaseType !== 'all') {
      result = result.filter(listing => {
        const leaseType = (listing.lease_type || listing.leaseType || '').toLowerCase();
        return leaseType === filters.leaseType.toLowerCase();
      });
    }

    // Water status filter
    if (filters.waterStatus !== 'all') {
      result = result.filter(listing => {
        const waterStatus = (listing.water_status || listing.waterStatus || '').toLowerCase();
        return waterStatus === filters.waterStatus.toLowerCase();
      });
    }

    // Property type filter
    if (filters.propertyType !== 'all') {
      result = result.filter(listing => {
        const propertyType = (listing.property_type || listing.propertyType || '').toLowerCase();
        return propertyType === filters.propertyType.toLowerCase();
      });
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        break;
      case 'price-low':
        result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        break;
    }

    return result;
  }, [listings, searchQuery, filters, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      priceRange: [0, 500000],
      toiletType: 'all',
      leaseType: 'all',
      waterStatus: 'all',
      propertyType: 'all',
    });
    setSearchQuery('');
    setSortBy('newest');
    startFiltering();
  };

  // Refresh listings
  const refreshListings = async () => {
    try {
      setIsRefreshing(true);
      const response = await api.get('/listings/');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      setListings(data);
      setError(null);
    } catch (err) {
      setError('Failed to refresh listings.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.toiletType !== 'all' ||
    filters.leaseType !== 'all' ||
    filters.waterStatus !== 'all' ||
    filters.propertyType !== 'all' ||
    filters.priceRange[1] < 500000 ||
    searchQuery.trim() !== '';

  const isEmptyDatabase = !loading && !error && listings.length === 0;
  const isNoMatches = !loading && !error && listings.length > 0 && processedListings.length === 0;

  // Quick chip toggles — same setFilters logic as the selects, tapping the
  // active chip drops that filter back to 'all'
  const toggleToiletChip = (value) => {
    setFilters({ ...filters, toiletType: filters.toiletType === value ? 'all' : value });
    startFiltering();
  };

  const toggleWaterChip = (value) => {
    setFilters({ ...filters, waterStatus: filters.waterStatus === value ? 'all' : value });
    startFiltering();
  };

  // Shared filter fields, used both in the desktop inline row and the mobile sheet
  const renderFilterFields = (variant) => {
    const compact = variant === 'compact';
    return (
      <>
        <div className={compact ? 'w-44' : 'w-full'}>
          <label
            htmlFor={`max-price-${variant}`}
            className="label-caps mb-1.5 block"
          >
            Max price
          </label>
          <input
            id={`max-price-${variant}`}
            type="range"
            min="0"
            max="500000"
            step="10000"
            value={filters.priceRange[1]}
            onChange={(e) => {
              setFilters({
                ...filters,
                priceRange: [0, parseInt(e.target.value, 10)]
              });
              startFiltering();
            }}
            className="w-full cursor-pointer accent-brand"
          />
          <p className="mt-1 text-xs text-stone">
            Up to ₦{filters.priceRange[1].toLocaleString()}
          </p>
        </div>

        <div className={compact ? 'w-40' : 'w-full'}>
          <Select
            label="Toilet type"
            value={filters.toiletType}
            onChange={(e) => { setFilters({ ...filters, toiletType: e.target.value }); startFiltering(); }}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'ensuite', label: 'Ensuite' },
              { value: 'shared', label: 'Shared' },
            ]}
          />
        </div>

        <div className={compact ? 'w-40' : 'w-full'}>
          <Select
            label="Lease type"
            value={filters.leaseType}
            onChange={(e) => { setFilters({ ...filters, leaseType: e.target.value }); startFiltering(); }}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'short-term', label: 'Short-term' },
              { value: 'long-term', label: 'Long-term' },
            ]}
          />
        </div>

        <div className={compact ? 'w-40' : 'w-full'}>
          <Select
            label="Water status"
            value={filters.waterStatus}
            onChange={(e) => { setFilters({ ...filters, waterStatus: e.target.value }); startFiltering(); }}
            options={[
              { value: 'all', label: 'All status' },
              { value: 'available', label: 'Available' },
              { value: 'limited', label: 'Limited' },
              { value: 'unavailable', label: 'Unavailable' },
            ]}
          />
        </div>

        <div className={compact ? 'w-44' : 'w-full'}>
          <Select
            label="Property type"
            value={filters.propertyType}
            onChange={(e) => { setFilters({ ...filters, propertyType: e.target.value }); startFiltering(); }}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'self-contain', label: 'Self contain' },
              { value: 'single-room', label: 'Single room' },
              { value: 'shared', label: 'Shared apartment' },
              { value: 'flat', label: 'Flat' },
            ]}
          />
        </div>
      </>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-cream">
        <div className="page-pad pt-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-36" />
        </div>
        <div className="page-pad pb-24 pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-card border border-line overflow-hidden"
            >
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream">
      {/* Page header */}
      <header className="page-pad pt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
            Browse homes
          </h1>
          <p className="text-stone text-sm mt-1">
            {processedListings.length} {processedListings.length === 1 ? 'home' : 'homes'} available
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={refreshListings}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 mt-4 border-b border-line bg-cream/90 backdrop-blur page-pad py-3">
        {/* Quick filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TOILET_CHIPS.map((chip) => (
            <Chip
              key={`toilet-${chip.value}`}
              active={filters.toiletType === chip.value}
              onClick={() => toggleToiletChip(chip.value)}
              className="shrink-0"
            >
              {chip.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" aria-hidden="true" />
          {WATER_CHIPS.map((chip) => (
            <Chip
              key={`water-${chip.value}`}
              active={filters.waterStatus === chip.value}
              onClick={() => toggleWaterChip(chip.value)}
              className="shrink-0"
            >
              {chip.label}
            </Chip>
          ))}
        </div>

        {/* Mobile: filters trigger */}
        <div className="mt-3 flex justify-end md:hidden">
          <Button variant="secondary" size="sm" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Desktop: inline filter controls */}
        <div className="hidden md:flex gap-3 flex-wrap items-end">
          {renderFilterFields('compact')}
        </div>
      </div>

      {/* Search, sort and view row */}
      <div className="page-pad mt-4 flex items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder="Search by location, title..."
            aria-label="Search listings"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); startFiltering(); }}
            className="pl-10 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); startFiltering(); }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isFiltering && (
            <Loader2 className="h-4 w-4 text-stone animate-spin" aria-hidden="true" />
          )}
          <div className="w-36 sm:w-48">
            <Select
              aria-label="Sort listings"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); startFiltering(); }}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'price-low', label: 'Price: low to high' },
                { value: 'price-high', label: 'Price: high to low' },
                { value: 'popular', label: 'Most popular' },
              ]}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-brand-tint text-brand'
                  : 'text-stone hover:bg-sand hover:text-ink'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-tint text-brand'
                  : 'text-stone hover:bg-sand hover:text-ink'
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Listings content */}
      <div className="page-pad pt-6 pb-8">
        {error ? (
          <EmptyState
            className="py-16"
            icon={AlertCircle}
            title="Something went wrong loading listings"
            body="Check your connection or try again."
            action={<Button variant="danger" onClick={refreshListings}>Try again</Button>}
          />
        ) : isNoMatches ? (
          <EmptyState
            className="py-16"
            icon={SearchX}
            title="No homes match those filters"
            body="Try removing a filter or widening your price range."
            action={<Button variant="secondary" onClick={resetFilters}>Clear filters</Button>}
          />
        ) : isEmptyDatabase ? (
          <EmptyState
            className="py-16"
            icon={Building2}
            title="No listings yet"
            body="Check back soon — landlords are adding properties."
          />
        ) : (
          <div
            className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
                : 'flex flex-col gap-4'
            } ${isFiltering ? 'opacity-50 transition-opacity' : ''}`}
          >
            {processedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                savedListings={savedListings}
                toggleSave={toggleSave}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter sheet (mobile) */}
      <Sheet open={showFilters} onClose={() => setShowFilters(false)} title="Filters">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderFilterFields('sheet')}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
          <Button variant="ghost" onClick={resetFilters}>Clear</Button>
          <Button onClick={() => setShowFilters(false)}>Apply</Button>
        </div>
      </Sheet>
    </div>
  );
};

export default ListingsPage;
