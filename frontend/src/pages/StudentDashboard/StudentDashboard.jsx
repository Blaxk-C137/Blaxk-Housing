// frontend/src/pages/StudentDashboard/StudentDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { Chip } from '../../components/ui/Badge';
import { Heart, MessageCircle, Star, MapPin, Eye, Search, Trash2, AlertCircle } from 'lucide-react';

// Guard against missing/odd timestamps that would render as "Invalid Date"
const formatDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('saved');
  const [savedListings, setSavedListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const failed = [];
    try {
      // Load saved listing IDs from localStorage, then fetch their data
      const savedIds = JSON.parse(localStorage.getItem('savedListings') || '[]');
      if (savedIds.length > 0) {
        const results = await Promise.allSettled(
          savedIds.slice(0, 10).map(id => api.get(`/listings/${id}/`))
        );
        const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value.data);
        setSavedListings(fulfilled);
        if (fulfilled.length < savedIds.slice(0, 10).length) failed.push('saved listings');
      }

      // Messages & reviews
      const [msgRes, revRes] = await Promise.allSettled([
        api.get('/messages/'),
        api.get(`/reviews/?student=${currentUser?.id}`),
      ]);
      if (msgRes.status === 'fulfilled') {
        const data = msgRes.value.data;
        setMessages(Array.isArray(data) ? data : data?.results || []);
      } else {
        failed.push('messages');
      }
      if (revRes.status === 'fulfilled') {
        const data = revRes.value.data;
        setReviews(Array.isArray(data) ? data : data?.results || []);
      } else {
        failed.push('reviews');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      failed.push('your dashboard');
    } finally {
      if (failed.length > 0) {
        setFetchError(`Failed to load ${failed.join(' and ')}. Please try again.`);
      }
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const removeSaved = (listingId) => {
    setSavedListings(prev => prev.filter(l => l.id !== listingId));
    const ids = JSON.parse(localStorage.getItem('savedListings') || '[]');
    localStorage.setItem('savedListings', JSON.stringify(ids.filter(id => id !== listingId)));
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const tabs = [
    { id: 'saved', label: 'Saved', icon: Heart, count: savedListings.length },
    { id: 'messages', label: 'Messages', icon: MessageCircle, count: messages.length },
    { id: 'reviews', label: 'My Reviews', icon: Star, count: reviews.length },
  ];

  const firstName = currentUser?.first_name || 'there';
  const fullName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ');

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream">
      <div className="max-w-5xl mx-auto page-pad py-8">
        {/* Greeting header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-4"
        >
          <Avatar name={fullName || currentUser?.email} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink truncate">Hi, {firstName}</h1>
            <p className="text-stone text-sm truncate">{currentUser?.email}</p>
          </div>
          <div className="ml-auto hidden sm:block">
            <Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button>
          </div>
        </motion.div>

        {/* Stat bento */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          {loading ? (
            <>
              <Skeleton className="h-32 rounded-card" />
              <Skeleton className="h-32 rounded-card" />
              <Skeleton className="h-32 rounded-card" />
            </>
          ) : (
            <>
              <StatCard icon={Heart} label="Saved" value={savedListings.length} tone="brand" />
              <StatCard icon={MessageCircle} label="Messages" value={messages.length} tone="sage" />
              <StatCard icon={Star} label="Reviews" value={reviews.length} tone="amber" />
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-8 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <Chip
              key={id}
              active={activeTab === id}
              onClick={() => setActiveTab(id)}
              className="whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && (
                <span className={`ml-1 rounded-full px-1.5 text-xs ${activeTab === id ? 'bg-white/25' : 'bg-sand'}`}>
                  {count}
                </span>
              )}
            </Chip>
          ))}
        </div>

        {/* Fetch error retry banner */}
        {fetchError && !loading && (
          <div className="mt-6 p-4 bg-brand/10 border border-brand/20 rounded-card flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand flex-shrink-0" />
            <span className="text-brand-dark text-sm flex-1">{fetchError}</span>
            <button
              onClick={loadData}
              className="text-brand-dark font-semibold text-sm hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab content */}
        <div className="mt-6">
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-card" />
              ))}
            </div>
          ) : (
            <>
              {/* Saved listings */}
              {activeTab === 'saved' && (
                savedListings.length === 0 ? (
                  <EmptyState
                    className="py-16"
                    icon={Heart}
                    title="No saved listings yet"
                    body="Tap the heart on any home to keep it here for later."
                    action={<Button onClick={() => navigate('/student-home')}>Browse listings</Button>}
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedListings.map(listing => (
                      <div key={listing.id} className="bg-white rounded-card border border-line overflow-hidden hover:shadow-warm-lg transition-all">
                        <div className="relative h-44 cursor-pointer" onClick={() => navigate(`/property/${listing.id}`)}>
                          <img
                            src={listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-sm font-bold text-ink">
                            ₦{parseFloat(listing.price).toLocaleString()}<span className="text-stone text-xs font-normal">/mo</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-ink truncate">{listing.title}</h3>
                          <div className="flex items-center text-sm text-stone mt-1 mb-3">
                            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                            <span className="truncate">{listing.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" fullWidth onClick={() => navigate(`/property/${listing.id}`)}>
                              <Eye className="w-4 h-4" /> View
                            </Button>
                            <button
                              onClick={() => removeSaved(listing.id)}
                              aria-label="Remove from saved"
                              className="w-9 h-9 flex items-center justify-center rounded-full border border-line text-stone hover:border-brand/30 hover:bg-brand-tint hover:text-brand transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Messages */}
              {activeTab === 'messages' && (
                messages.length === 0 ? (
                  <EmptyState
                    className="py-16"
                    icon={MessageCircle}
                    title="No messages yet"
                    body="Start a conversation with a landlord from any listing."
                    action={<Button onClick={() => navigate('/student-home')}>Find a home</Button>}
                  />
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div key={msg.id ?? i} className="bg-white rounded-card border border-line p-4">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-ink text-sm">{msg.sender_name || msg.landlord_name || 'Landlord'}</span>
                          <span className="text-xs text-stone">{formatDate(msg.created_at)}</span>
                        </div>
                        <p className="text-stone text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                reviews.length === 0 ? (
                  <EmptyState
                    className="py-16"
                    icon={Star}
                    title="No reviews written yet"
                    body="Visit a listing you've stayed at to share your experience."
                    action={<Button onClick={() => navigate('/student-home')}>Browse listings</Button>}
                  />
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev, i) => (
                      <div key={rev.id ?? i} className="bg-white rounded-card border border-line p-4">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} className={`w-4 h-4 ${s < rev.rating ? 'fill-amber text-amber' : 'text-line'}`} />
                          ))}
                          <span className="text-xs text-stone ml-2">{formatDate(rev.created_at)}</span>
                        </div>
                        <p className="text-stone text-sm">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* Quick browse CTA */}
        <div className="mt-8 text-center">
          <Button variant="secondary" onClick={() => navigate('/student-home')}>
            <Search className="w-4 h-4" /> Browse more listings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
