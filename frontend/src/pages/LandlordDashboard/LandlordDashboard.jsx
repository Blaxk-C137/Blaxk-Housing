// frontend/src/pages/LandlordDashboard/LandlordDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, Plus, Edit, Trash2, Eye, MessageCircle, Star, TrendingUp,
  LogOut, MapPin, BarChart3, Phone,
  ChevronRight, RefreshCw, AlertCircle,
  Zap, Target, Heart, Share2, Users, Wallet
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';

const SELECT_CLASS =
  'rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand';

// Icon/tone pairs for funnel steps & engagement tiles (explicit classes so
// Tailwind can see them — the original's `bg-${color}` interpolation never compiled)
const FUNNEL_TONES = {
  brand: { box: 'bg-brand-tint text-brand-dark', arrow: 'text-stone/40' },
  sage: { box: 'bg-sage/10 text-sage-dark', arrow: 'text-stone/40' },
  amber: { box: 'bg-amber/10 text-amber-dark', arrow: 'text-stone/40' },
  stone: { box: 'bg-sand text-stone-dark', arrow: 'text-stone/40' },
};

const LandlordDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [listingsError, setListingsError] = useState(null);
  const [dateRange, setDateRange] = useState(30);

  // ✅ FIXED: Fetch only this landlord's analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await api.get(`/listings/landlord-analytics/?days=${dateRange}`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      if (err.response?.status === 403) {
        setError('You need to be a landlord to view analytics');
      } else {
        setError('Failed to load analytics. Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [dateRange]);

  // ✅ FIXED: Fetch only this landlord's listings
  const fetchMyListings = useCallback(async () => {
    try {
      const response = await api.get('/listings/my-listings/');
      setMyListings(response.data || []);
      setListingsError(null);
    } catch (err) {
      console.error('Error fetching listings:', err);
      // Fallback: filter from all listings if endpoint doesn't exist
      try {
        const allResponse = await api.get('/listings/');
        const filtered = (allResponse.data || []).filter(l =>
          l.landlord === currentUser?.id ||
          l.landlord?.id === currentUser?.id ||
          l.landlord_id === currentUser?.id
        );
        setMyListings(filtered);
        setListingsError(null);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setMyListings([]);
        setListingsError('Failed to load your listings. Please try again.');
      }
    }
  }, [currentUser?.id]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAnalytics(), fetchMyListings()]);
      setLoading(false);
    };

    if (currentUser) {
      loadData();
    }

    // Listen for newly created listings to add them to dashboard
    const handleNewListing = (e) => {
      if (e?.detail) {
        setMyListings(prev => {
          const exists = prev.some(l => l.id === e.detail.id);
          return exists ? prev : [e.detail, ...prev];
        });
      }
    };

    window.addEventListener('buk:newListing', handleNewListing);
    return () => window.removeEventListener('buk:newListing', handleNewListing);
  }, [fetchAnalytics, fetchMyListings, currentUser]);

  // Refresh when date range changes
  useEffect(() => {
    if (!loading && currentUser) {
      fetchAnalytics();
    }
  }, [dateRange, loading, currentUser, fetchAnalytics]);

  // Delete listing
  const deleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        await api.delete(`/listings/${listingId}/`);
        setMyListings(prev => prev.filter(l => l.id !== listingId));
        fetchAnalytics(); // Refresh analytics after delete
      } catch (err) {
        console.error('Error deleting listing:', err);
        setError('Failed to delete listing. Please try again.');
      }
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigation handlers
  const handleListProperty = () => navigate('/post-property');
  const handleViewListing = (id) => navigate(`/property/${id}`);
  const handleEditListing = (id) => {
    const listing = myListings.find(l => l.id === id);
    // Navigate to the list property form with listing in location state for editing
    navigate('/post-property', { state: { listing } });
  };

  // Get overview data with fallbacks
  const overview = analytics?.overview || {};
  const subscription = analytics?.subscription || {};
  const topListings = analytics?.top_listings || [];

  // ✅ Calculate stats from actual listings if analytics not available
  const calculatedStats = {
    totalListings: myListings.length,
    activeListings: myListings.filter(l => l.is_active !== false && l.status !== 'paused').length,
    totalViews: myListings.reduce((sum, l) => sum + (l.views || 0), 0),
    totalInquiries: myListings.reduce((sum, l) => sum + (l.inquiries || 0), 0),
    avgRating: (() => {
      const rated = myListings.filter(l => parseFloat(l.rating) > 0);
      if (rated.length === 0) return 0;
      return rated.reduce((sum, l) => sum + (parseFloat(l.rating) || 0), 0) / rated.length;
    })(),
    totalRevenue: myListings.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0),
  };

  // Use API data if available, otherwise use calculated
  const stats = {
    totalListings: overview.total_listings ?? calculatedStats.totalListings,
    activeListings: overview.active_listings ?? calculatedStats.activeListings,
    totalViews: overview.total_views ?? calculatedStats.totalViews,
    totalUniqueViews: overview.total_unique_views ?? overview.total_views ?? calculatedStats.totalViews,
    totalSaves: overview.total_saves ?? 0,
    totalInquiries: overview.total_inquiries ?? calculatedStats.totalInquiries,
    totalPhoneClicks: overview.total_phone_clicks ?? 0,
    totalMessageClicks: overview.total_message_clicks ?? 0,
    avgRating: overview.avg_rating ?? calculatedStats.avgRating,
    totalReviews: overview.total_reviews ?? 0,
    conversionRate: overview.conversion_rate ?? 0,
    totalRevenue: parseFloat(overview.total_revenue) || calculatedStats.totalRevenue,
  };

  // Listing Card Component
  const ListingCard = ({ listing }) => {
    const views = listing.views || 0;
    const inquiries = listing.inquiries || 0;
    const convRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : 0;
    const price = parseFloat(listing.price) || 0;

    return (
      <div className="bg-white rounded-card overflow-hidden border border-line hover:shadow-warm-lg transition-all group">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />

          {/* Action Buttons — always visible on touch, hover-reveal on large screens */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 lg:group-focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); handleEditListing(listing.id); }}
              aria-label="Edit listing"
              className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-ink hover:bg-brand hover:text-white transition-colors shadow-warm"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteListing(listing.id); }}
              aria-label="Delete listing"
              className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-ink hover:bg-brand hover:text-white transition-colors shadow-warm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              listing.status === 'rented' ? 'bg-espresso text-cream' :
              listing.is_active === false || listing.status === 'paused' ? 'bg-white/90 text-stone' :
              'bg-sage text-white'
            }`}>
              {listing.status === 'rented' ? 'Rented' :
               listing.is_active === false || listing.status === 'paused' ? 'Paused' : 'Active'}
            </span>
            {listing.is_featured && (
              <span className="px-2.5 py-1 bg-amber text-white rounded-full text-xs font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Featured
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title & Rating */}
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="font-bold text-ink truncate flex-1 pr-2">{listing.title}</h3>
            {listing.rating && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="w-4 h-4 fill-amber text-amber" />
                <span className="font-bold text-ink">{listing.rating}</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center text-stone text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-sand rounded-xl">
              <Eye className="w-3.5 h-3.5 text-stone mx-auto mb-0.5" />
              <div className="text-sm font-bold text-ink">{views}</div>
              <div className="text-xs text-stone">Views</div>
            </div>
            <div className="text-center p-2 bg-sand rounded-xl">
              <MessageCircle className="w-3.5 h-3.5 text-stone mx-auto mb-0.5" />
              <div className="text-sm font-bold text-ink">{inquiries}</div>
              <div className="text-xs text-stone">Inquiries</div>
            </div>
            <div className="text-center p-2 bg-sand rounded-xl">
              <Target className="w-3.5 h-3.5 text-stone mx-auto mb-0.5" />
              <div className="text-sm font-bold text-ink">{convRate}%</div>
              <div className="text-xs text-stone">Conv.</div>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-line">
            <div>
              <span className="text-xl font-bold text-ink">₦{price.toLocaleString()}</span>
              <span className="text-stone text-sm">/mo</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => handleViewListing(listing.id)}>
              View
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Top Listing Row Component
  const TopListingRow = ({ listing, rank }) => {
    const views = listing.views || 0;
    const price = parseFloat(listing.price) || 0;

    return (
      <button
        type="button"
        onClick={() => handleViewListing(listing.id)}
        className="w-full text-left flex items-center gap-3 p-3 bg-sand hover:bg-brand-tint/60 rounded-card cursor-pointer transition-colors"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          rank === 1 ? 'bg-amber/20 text-amber-dark' :
          rank === 2 ? 'bg-white text-stone-dark' :
          rank === 3 ? 'bg-brand-tint text-brand-dark' :
          'bg-white text-stone/70'
        }`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink truncate">{listing.title}</div>
          <div className="text-xs text-stone">₦{price.toLocaleString()}/mo</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-ink">{views}</div>
          <div className="text-xs text-stone">views</div>
        </div>
      </button>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-cream">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar (hidden on mobile) */}
          <aside className="w-60 bg-espresso min-h-[calc(100vh-56px)] p-4 hidden lg:block sticky top-14">
            <Skeleton className="h-20 w-full mb-6 rounded-xl !bg-white/10" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl !bg-white/10" />
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8">
            {/* Skeleton Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-card" />
              ))}
            </div>

            {/* Skeleton Panels */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-card" />
              <Skeleton className="h-64 rounded-card" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'listings', icon: Home, label: 'My Listings', badge: myListings.length },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
  ];

  const subscriptionPct = Math.min(((subscription.listings_used || myListings.length) / (subscription.listings_limit || 3)) * 100, 100);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream overflow-x-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar (desktop) */}
        <aside className="w-60 bg-espresso text-cream min-h-[calc(100vh-56px)] p-4 hidden lg:flex flex-col sticky top-14">
          {/* Subscription Card */}
          <div className={`mb-6 p-4 rounded-xl ${subscription.plan && subscription.plan !== 'free' ? 'bg-white/10 border border-white/10' : 'bg-white/5 border border-white/10'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cream/60 uppercase tracking-wide">Plan</span>
              {subscription.plan && subscription.plan !== 'free' && <Zap className="w-4 h-4 text-amber" />}
            </div>
            <div className="text-lg font-bold text-cream capitalize mb-1">
              {subscription.plan || 'Free'}
            </div>
            <div className="text-xs text-cream/70 mb-2">
              {subscription.listings_used || myListings.length} / {subscription.listings_limit || 3} listings used
            </div>
            <div className="w-full bg-white/15 rounded-full h-1.5">
              <div
                className="bg-brand h-1.5 rounded-full transition-all"
                style={{ width: `${subscriptionPct}%` }}
              />
            </div>
            {(!subscription.plan || subscription.plan === 'free') && (
              <button className="w-full mt-3 py-2 bg-brand text-white rounded-full font-semibold text-sm hover:bg-brand-dark transition-colors">
                Upgrade Plan
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-white/10 text-white'
                    : 'text-cream/70 hover:bg-white/5 hover:text-cream'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.badge > 0 && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === item.id ? 'bg-white/20 text-white' : 'bg-white/10 text-cream/70'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-2">
              <button
                onClick={handleListProperty}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Listing
              </button>
            </div>
          </nav>

          <div className="pt-4 mt-auto border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-cream/70 hover:bg-white/5 hover:text-cream transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'listings' && 'My Listings'}
                {activeTab === 'analytics' && 'Analytics'}
              </h1>
              <p className="text-stone text-sm mt-0.5">
                Welcome back, {currentUser?.first_name || currentUser?.name?.split(' ')[0] || 'Landlord'}!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className={SELECT_CLASS}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              <button
                onClick={() => { fetchAnalytics(); fetchMyListings(); }}
                disabled={refreshing}
                aria-label="Refresh data"
                className="w-10 h-10 rounded-full border border-line bg-white text-stone hover:border-ink/30 hover:text-ink transition-colors flex items-center justify-center"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <span className="lg:hidden">
                <Button size="sm" onClick={handleListProperty}>
                  <Plus className="w-4 h-4" /> Add property
                </Button>
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-brand/10 border border-brand/20 rounded-card flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-brand flex-shrink-0" />
              <span className="text-brand-dark text-sm flex-1">{error}</span>
              <button
                onClick={() => { setError(null); fetchAnalytics(); }}
                className="text-brand-dark font-semibold text-sm hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Mobile Nav — underline tabs, visually distinct from the global bottom nav */}
          <div className="flex gap-5 mb-6 lg:hidden overflow-x-auto no-scrollbar border-b border-line">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 pb-2.5 -mb-px border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                  activeTab === item.id
                    ? 'border-brand text-ink'
                    : 'border-transparent text-stone hover:text-ink'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.badge > 0 && (
                  <span className={`text-xs px-1.5 rounded-full font-bold ${
                    activeTab === item.id ? 'bg-brand-tint text-brand-dark' : 'bg-sand text-stone-dark'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Home}
                  label="Active Listings"
                  value={stats.activeListings}
                  subValue={`${stats.totalListings} total`}
                  tone="brand"
                />
                <StatCard
                  icon={Eye}
                  label="Total Views"
                  value={stats.totalViews.toLocaleString()}
                  subValue={stats.totalUniqueViews !== stats.totalViews ? `${stats.totalUniqueViews} unique` : undefined}
                  tone="stone"
                />
                <StatCard
                  icon={MessageCircle}
                  label="Inquiries"
                  value={stats.totalInquiries}
                  subValue={stats.conversionRate > 0 ? `${stats.conversionRate}% conv.` : undefined}
                  tone="sage"
                />
                <StatCard
                  icon={Star}
                  label="Avg Rating"
                  value={Number(stats.avgRating) > 0 ? Number(stats.avgRating).toFixed(1) : 'N/A'}
                  subValue={stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : 'No reviews yet'}
                  tone="amber"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Phone}
                  label="Phone Clicks"
                  value={stats.totalPhoneClicks}
                  tone="sage"
                />
                <StatCard
                  icon={MessageCircle}
                  label="Message Clicks"
                  value={stats.totalMessageClicks}
                  tone="brand"
                />
                <StatCard
                  icon={Heart}
                  label="Saves"
                  value={stats.totalSaves}
                  tone="brand"
                />
                <StatCard
                  icon={Wallet}
                  label="Est. Revenue"
                  value={`₦${stats.totalRevenue.toLocaleString()}`}
                  tone="sage"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Listings */}
                <div className="bg-white rounded-card border border-line p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-ink">Top Performing</h3>
                    <button
                      onClick={() => setActiveTab('listings')}
                      className="text-brand text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(topListings.length > 0 ? topListings : myListings.slice(0, 5)).map((listing, i) => (
                      <TopListingRow key={listing.id} listing={listing} rank={i + 1} />
                    ))}
                    {myListings.length === 0 && topListings.length === 0 && (
                      <EmptyState
                        className="py-8"
                        icon={Home}
                        title="No listings yet"
                        body="Add your first property to see how it performs."
                      />
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-card border border-line p-5">
                  <h3 className="font-bold text-ink mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {[
                      {
                        icon: Plus,
                        title: 'Add New Listing',
                        hint: 'List a new property',
                        onClick: handleListProperty,
                      },
                      {
                        icon: TrendingUp,
                        title: 'View Analytics',
                        hint: 'See detailed performance',
                        onClick: () => setActiveTab('analytics'),
                      },
                      {
                        icon: Home,
                        title: 'Manage Listings',
                        hint: 'Edit or remove properties',
                        onClick: () => setActiveTab('listings'),
                      },
                    ].map(({ icon: Icon, title, hint, onClick }) => (
                      <button
                        key={title}
                        onClick={onClick}
                        className="w-full flex items-center gap-3 p-4 bg-sand hover:bg-brand-tint/60 rounded-card transition-colors text-left"
                      >
                        <span className="w-10 h-10 bg-brand-tint text-brand-dark rounded-full flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">{title}</span>
                          <span className="block text-xs text-stone">{hint}</span>
                        </span>
                        <ChevronRight className="w-5 h-5 text-stone ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div>
              {listingsError && (
                <div className="mb-6 p-4 bg-brand/10 border border-brand/20 rounded-card flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-brand flex-shrink-0" />
                  <span className="text-brand-dark text-sm flex-1">{listingsError}</span>
                  <button
                    onClick={() => { setListingsError(null); fetchMyListings(); }}
                    className="text-brand-dark font-semibold text-sm hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <p className="text-stone">{myListings.length} {myListings.length === 1 ? 'property' : 'properties'}</p>
                <Button onClick={handleListProperty}>
                  <Plus className="w-4 h-4" /> Add New
                </Button>
              </div>

              {myListings.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="py-16 bg-white rounded-card border border-line"
                  icon={Home}
                  title="No listings yet"
                  body="Add your first property to start tracking."
                  action={<Button onClick={handleListProperty}>List your first property</Button>}
                />
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Conversion Funnel */}
              <div className="bg-white rounded-card border border-line p-5 md:p-6">
                <h3 className="font-bold text-ink mb-6">Conversion Funnel</h3>
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
                  {[
                    { label: 'Views', value: stats.totalViews, tone: 'brand', icon: Eye },
                    { label: 'Unique', value: stats.totalUniqueViews, tone: 'stone', icon: Users },
                    { label: 'Saves', value: stats.totalSaves, tone: 'brand', icon: Heart },
                    { label: 'Inquiries', value: stats.totalInquiries, tone: 'sage', icon: MessageCircle },
                  ].map((step, i, arr) => (
                    <React.Fragment key={step.label}>
                      <div className="flex-1 min-w-[100px] text-center">
                        <span className={`inline-flex w-16 h-16 items-center justify-center rounded-full mb-2 ${FUNNEL_TONES[step.tone].box}`}>
                          <step.icon className="w-7 h-7" />
                        </span>
                        <div className="text-2xl font-bold text-ink">{step.value.toLocaleString()}</div>
                        <div className="text-sm text-stone">{step.label}</div>
                        {i > 0 && arr[i-1].value > 0 && (
                          <div className="text-xs text-stone/80 mt-1">
                            {((step.value / arr[i-1].value) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <ChevronRight className={`w-6 h-6 flex-shrink-0 ${FUNNEL_TONES[step.tone].arrow}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Engagement Breakdown */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Eye, label: 'Views', value: stats.totalViews.toLocaleString(), hint: 'Total page views', tone: 'stone' },
                  { icon: Phone, label: 'Phone Clicks', value: stats.totalPhoneClicks, hint: 'Call button clicks', tone: 'sage' },
                  { icon: MessageCircle, label: 'Messages', value: stats.totalMessageClicks, hint: 'Message button clicks', tone: 'brand' },
                  { icon: Share2, label: 'Saves & Shares', value: stats.totalSaves, hint: 'Saves and shares', tone: 'amber' },
                ].map(({ icon: Icon, label, value, hint, tone }) => (
                  <div key={label} className="bg-white rounded-card border border-line p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tone === 'brand' ? 'bg-brand-tint text-brand-dark' :
                        tone === 'sage' ? 'bg-sage/10 text-sage-dark' :
                        tone === 'amber' ? 'bg-amber/10 text-amber-dark' :
                        'bg-sand text-stone-dark'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="text-sm font-medium text-stone">{label}</div>
                    </div>
                    <div className="text-2xl font-bold text-ink">{value}</div>
                    <div className="text-xs text-stone mt-1">{hint}</div>
                  </div>
                ))}
              </div>

              {/* Per-Listing Performance — desktop table */}
              <div className="bg-white rounded-card border border-line p-5 md:p-6">
                <h3 className="font-bold text-ink mb-4">Listing Performance</h3>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-stone border-b border-line">
                        <th className="pb-3 font-medium">Listing</th>
                        <th className="pb-3 font-medium text-center">Views</th>
                        <th className="pb-3 font-medium text-center">Inquiries</th>
                        <th className="pb-3 font-medium text-center">Conv. Rate</th>
                        <th className="pb-3 font-medium text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myListings.map((listing) => {
                        const views = listing.views || 0;
                        const inquiries = listing.inquiries || 0;
                        const convRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : 0;
                        const price = parseFloat(listing.price) || 0;

                        return (
                          <tr
                            key={listing.id}
                            tabIndex={0}
                            role="button"
                            aria-label={`View ${listing.title}`}
                            onClick={() => handleViewListing(listing.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleViewListing(listing.id);
                              }
                            }}
                            className="border-b border-line last:border-0 hover:bg-sand/50 focus-visible:bg-sand/50 cursor-pointer transition-colors"
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100'}
                                  alt=""
                                  className="w-10 h-10 rounded-xl object-cover"
                                />
                                <div>
                                  <div className="font-medium text-ink truncate max-w-[200px]">{listing.title}</div>
                                  <div className="text-xs text-stone truncate max-w-[200px]">{listing.location}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-center font-medium text-ink">{views}</td>
                            <td className="py-3 text-center font-medium text-ink">{inquiries}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                parseFloat(convRate) >= 5 ? 'bg-sage/10 text-sage-dark' :
                                parseFloat(convRate) >= 2 ? 'bg-amber/10 text-amber-dark' :
                                'bg-sand text-stone-dark'
                              }`}>
                                {convRate}%
                              </span>
                            </td>
                            <td className="py-3 text-right font-medium text-ink">₦{price.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {myListings.length === 0 && (
                    <div className="text-center py-8 text-stone">
                      No listings to analyze
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LandlordDashboard;
