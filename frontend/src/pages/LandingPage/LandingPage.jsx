// frontend/src/pages/LandingPage/LandingPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useListings } from '../../hooks/useListings';
import ListingCard from '../../components/ListingCard';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import Badge, { Chip } from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const PRICE_MAX = 200000;

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80';

const CATEGORIES = [
  { label: 'All', match: () => true },
  {
    label: 'Self-contained',
    match: l => /self[- ]?contain/i.test(l.title || '') ||
      (l.property_type || l.propertyType || '').toLowerCase() === 'self-contain',
  },
  {
    label: 'Near campus',
    match: l => /campus|buk|old site/i.test(l.location || ''),
  },
  {
    label: 'Water available',
    match: l => (l.water_status || l.waterStatus || '').toLowerCase() === 'available',
  },
];

const PRICE_OPTIONS = [
  { value: PRICE_MAX, label: 'Any price' },
  { value: 50000, label: 'Under ₦50,000' },
  { value: 100000, label: 'Under ₦100,000' },
  { value: 150000, label: 'Under ₦150,000' },
];

// Marketing fallback so the landing page always shows homes,
// even before the first listings sync from the backend.
// Flagged isDemo so cards render as decoration (no dead links, no save).
const FALLBACK_FEATURED = [
  {
    id: 'demo-1',
    isDemo: true,
    title: 'Sunlit self-contained flat',
    price: 85000,
    location: 'Gwarzo Road, Kano',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    toilet_type: 'Ensuite',
    water_status: 'Available',
    views: 214,
  },
  {
    id: 'demo-2',
    isDemo: true,
    title: 'Room in shared student flat',
    price: 60000,
    location: 'Dorayi, Kano',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    toilet_type: 'Shared',
    water_status: 'Available',
    views: 168,
  },
  {
    id: 'demo-3',
    isDemo: true,
    title: 'Studio minutes from campus',
    price: 110000,
    location: 'Old Campus, BUK',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    toilet_type: 'Ensuite',
    water_status: 'Available',
    views: 342,
  },
  {
    id: 'demo-4',
    isDemo: true,
    title: 'Neat 1-bedroom apartment',
    price: 95000,
    location: 'Kabuga, Kano',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    toilet_type: 'Ensuite',
    water_status: 'Limited',
    views: 97,
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { listings, savedListings, toggleSave, loading } = useListings();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);

  const filtered = (listings || []).filter(l => {
    if (!l) return false;
    const price = parseFloat(l.price) || 0;
    const q = search.toLowerCase();
    return (
      price <= priceMax &&
      CATEGORIES[activeCategory].match(l) &&
      (q === '' ||
        l.location?.toLowerCase().includes(q) ||
        l.title?.toLowerCase().includes(q))
    );
  });

  // Only show marketing placeholders when the marketplace itself is empty —
  // never as a stand-in for a search that returned no real matches.
  const marketplaceEmpty = !loading && (listings || []).length === 0;
  const isBrowsingAll = activeCategory === 0 && search === '' && priceMax === PRICE_MAX;

  const featured = loading
    ? []
    : marketplaceEmpty && isBrowsingAll
      ? FALLBACK_FEATURED
      : filtered.slice(0, 4);

  const handleSearch = () => {
    if (currentUser) {
      navigate('/student-home', { state: { search, priceMax } });
    } else {
      navigate('/signin');
    }
  };

  const handleSeeAll = () => {
    if (currentUser) {
      navigate('/student-home');
    } else {
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* 1. Hero */}
      <section className="relative h-[70vh] md:h-[80vh]">
        <img
          src={HERO_IMAGE}
          alt="A bright, furnished apartment room"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" aria-hidden="true" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-24 text-center">
          <Badge tone="brand" className="mb-5">
            Trusted by BUK students
          </Badge>
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-cream md:text-5xl">
            Find your home at Bayero University
          </h1>
          <p className="mt-4 max-w-xl text-base text-cream/80 md:text-lg">
            Verified rooms and self-contained flats from landlords you can
            trust — no agents, no agency fees.
          </p>
        </div>
      </section>

      {/* Search card — overlaps the fold below the hero */}
      <div className="page-pad relative z-20">
        <div className="mx-auto w-full max-w-2xl -mt-12 rounded-hero bg-white p-4 shadow-warm-lg md:-mt-16 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Where do you want to live?"
                aria-label="Search by location or title"
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={priceMax}
                onChange={e => setPriceMax(Number(e.target.value))}
                options={PRICE_OPTIONS}
                aria-label="Maximum monthly price"
              />
            </div>
            <Button variant="primary" onClick={handleSearch}>
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Category chips */}
      <section className="page-pad mt-10">
        <div className="mx-auto max-w-7xl">
          <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
            {CATEGORIES.map(({ label }, i) => (
              <Chip
                key={label}
                active={activeCategory === i}
                onClick={() => setActiveCategory(i)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured listings */}
      <section className="page-pad mt-12 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-ink md:text-3xl">
              Featured homes
            </h2>
            <button
              type="button"
              onClick={handleSeeAll}
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              See all
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <EmptyState
              className="py-16"
              icon={SearchX}
              title="No homes match your search"
              body="Try a different area or widen your price range."
              action={
                <Button
                  variant="secondary"
                  onClick={() => { setSearch(''); setPriceMax(PRICE_MAX); setActiveCategory(0); }}
                >
                  Clear search
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {featured.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  savedListings={savedListings}
                  toggleSave={toggleSave}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mobile bottom actions — fixed bar for signed-out visitors */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white/95 backdrop-blur safe-area-pb md:hidden">
        <div className="flex gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/signin')}
          >
            Sign in
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/signin', { state: { mode: 'signup' } })}
          >
            Create account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
