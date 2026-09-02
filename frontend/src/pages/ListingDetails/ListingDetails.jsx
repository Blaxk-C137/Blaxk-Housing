// frontend/src/pages/ListingDetails/ListingDetails.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import {
  MapPin, Droplet, Bath, Zap, Wifi, Car, ShieldCheck, Star, Heart,
  MessageCircle, ChevronLeft, ChevronRight, Share2, BedDouble, Phone,
  CheckCircle, Calendar, Eye, Home, AlertCircle,
} from 'lucide-react';

const amenityIcon = (a = '') => {
  const s = String(a).toLowerCase();
  if (s.includes('park')) return Car;
  if (s.includes('furnish')) return BedDouble;
  if (s.includes('water') || s.includes('borehole')) return Droplet;
  if (s.includes('power') || s.includes('electric') || s.includes('prepaid') || s.includes('meter')) return Zap;
  if (s.includes('toilet') || s.includes('bath')) return Bath;
  return Wifi;
};

const ListingDetails = ({ listings = [], savedListings = [], toggleSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef(null);
  const messageSectionRef = useRef(null);

  const isSaved = (savedListings || []).some((s) => Number(s) === Number(id));
  const isLandlord = currentUser?.role === 'landlord';

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setFetchError(false);
      try {
        // Try from props first (avoid extra fetch)
        const found = listings.find(l => String(l.id) === String(id));
        if (found) {
          setListing(found);
        } else {
          const res = await api.get(`/listings/${id}/`);
          setListing(res.data);
        }
        // Track view
        await api.post(`/listings/${id}/track-view/`).catch(() => {});
        // Fetch reviews
        const revRes = await api.get(`/reviews/?listing=${id}`);
        setReviews(Array.isArray(revRes.data) ? revRes.data : revRes.data?.results || []);
      } catch (err) {
        console.error('Error loading listing:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const openMessageBox = () => {
    setShowMessageBox(true);
    // The form lives in the landlord card above the fold — bring it into view
    setTimeout(() => {
      messageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setMessageSending(true);
    try {
      await api.post('/messages/', {
        listing: id,
        receiver: listing?.landlord,
        content: message,
      });
      setMessageSent(true);
      setMessage('');
      setTimeout(() => setShowMessageBox(false), 2000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setToast({ type: 'error', text: 'Failed to send message. Please try again.' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setMessageSending(false);
    }
  };

  const handleShare = async () => {
    const shareData = { title: listing.title, url: window.location.href };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToast({ type: 'info', text: 'Link copied to clipboard.' });
      } catch {
        setToast({ type: 'error', text: 'Could not copy the link.' });
      }
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handlePhoneClick = async () => {
    await api.post(`/listings/${id}/track-action/`, { action: 'phone_click' }).catch(() => {});
  };

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) return;
    setReviewSubmitting(true);
    try {
      const res = await api.post('/reviews/', {
        listing: id,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setReviews(prev => [res.data, ...prev]);
      setNewReview({ rating: 5, comment: '' });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      console.error('Review error:', err);
      // show user-friendly popup for duplicate review or other validation errors
      const resp = err?.response;
      let serverMsg = 'Failed to submit review.';
      if (resp) {
        if (resp.status === 400) {
          // DRF often sends {"detail": "..."} or validation dicts
          serverMsg = resp.data?.detail || (Array.isArray(resp.data?.non_field_errors) && resp.data.non_field_errors[0]) || (typeof resp.data === 'string' && resp.data) || 'You have already reviewed this listing.';
        } else if (resp.data && typeof resp.data === 'string') {
          serverMsg = resp.data;
        }
      }
      setToast({ type: 'error', text: serverMsg });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-cream">
        <div className="page-pad pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-64 md:h-72 w-full rounded-card" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-cream flex items-center justify-center page-pad">
        <EmptyState
          icon={fetchError ? AlertCircle : Home}
          title={fetchError ? 'Could not load this listing' : 'Listing not found'}
          body={
            fetchError
              ? 'Something went wrong fetching this home. Check your connection and try again.'
              : 'This listing may have been removed or is no longer available.'
          }
          action={
            fetchError ? (
              <Button onClick={() => window.location.reload()}>Try again</Button>
            ) : (
              <Button onClick={() => navigate('/student-home')}>
                Back to listings
              </Button>
            )
          }
        />
      </div>
    );
  }

  const price = parseFloat(listing.price) || 0;
  const toiletType = listing.toilet_type || listing.toiletType || '';
  const waterStatus = listing.water_status || listing.waterStatus || '';
  const imageUrl = listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200';
  const galleryImages = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : [imageUrl];
  const avgRating = listing.avg_rating || 0;
  const amenities = listing.amenities || [];
  const landlordName = listing.landlord_name || 'Landlord';
  const isOwner = (() => {
    if (!currentUser || !listing) return false;
    const owner = listing.landlord;
    const ownerId = owner && typeof owner === 'object' ? (owner.id || owner.pk) : owner;
    const userId = currentUser.id ?? currentUser.pk ?? currentUser.user_id;
    return Number(ownerId) === Number(userId);
  })();

  const handleGalleryScroll = (e) => {
    const el = e.currentTarget;
    const item = el.querySelector('img');
    if (!item) return;
    const step = item.offsetWidth + 8; // gap-2
    if (step <= 0) return;
    setActiveImage(Math.min(galleryImages.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  const desktopImages = galleryImages.slice(0, 4);

  // Layout classes for the desktop mosaic so the grid never has empty cells:
  // 1 image -> full bleed; 2 -> two halves; 3 -> hero + two stacked wide; 4 -> hero + column + two quarters
  const desktopImageClass = (i) => {
    const n = desktopImages.length;
    if (n === 1) return 'col-span-4 row-span-2 rounded-card';
    if (i === 0) return 'col-span-2 row-span-2 rounded-l-card';
    if (n === 2) return 'col-span-2 row-span-2 rounded-r-card';
    if (n === 3) return 'col-span-2 rounded-r-card';
    if (i === 1) return 'row-span-2';
    return i === 3 ? 'rounded-r-card' : '';
  };

  const featureItems = [
    toiletType && { icon: Bath, label: 'Toilet', value: toiletType },
    waterStatus && { icon: Droplet, label: 'Water', value: waterStatus },
    listing.power_status && { icon: Zap, label: 'Power', value: listing.power_status },
    listing.lease_type && { icon: Calendar, label: 'Lease', value: listing.lease_type },
    listing.distance && { icon: MapPin, label: 'From BUK', value: listing.distance },
  ].filter(Boolean);

  const messageBox = (
    <div>
      {messageSent ? (
        <div className="p-4 bg-sage/10 text-sage rounded-card flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-5 h-5" /> Message sent!
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full border border-line rounded-card p-3 text-sm text-ink bg-white resize-none focus:ring-2 focus:ring-brand/40 focus:border-brand focus:outline-none"
            rows={4}
            aria-label="Message to landlord"
            placeholder="Hi, I'm interested in this property..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => setShowMessageBox(false)}>
              Cancel
            </Button>
            <Button size="sm" fullWidth onClick={handleSendMessage} loading={messageSending}>
              Send <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-semibold shadow-warm ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-sage text-white'}`}
        >
          {toast.text}
        </div>
      )}

      {/* Back nav */}
      <div className="page-pad pt-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-brand font-semibold text-sm hover:text-brand-dark transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSave?.(listing.id)}
            aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${isSaved ? 'border-brand/30 bg-brand-tint text-brand' : 'border-line bg-white text-stone hover:border-ink/30 hover:text-ink'}`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-brand' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            aria-label="Share listing"
            className="w-10 h-10 rounded-full border border-line bg-white text-stone hover:border-ink/30 hover:text-ink flex items-center justify-center transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gallery — mobile swipeable carousel */}
      <div className="md:hidden page-pad mt-4">
        <div
          ref={galleryRef}
          onScroll={handleGalleryScroll}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4"
        >
          {galleryImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${listing.title} — view ${i + 1}`}
              className="w-full sm:w-[85%] flex-shrink-0 snap-center aspect-[4/3] object-cover rounded-card"
            />
          ))}
        </div>
        {galleryImages.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {galleryImages.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all ${i === activeImage ? 'w-4 h-1.5 bg-brand' : 'w-1.5 h-1.5 bg-line'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Gallery — desktop grid */}
      <div className="hidden md:block page-pad mt-4">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
          {desktopImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${listing.title} — view ${i + 1}`}
              className={`h-full w-full object-cover ${desktopImageClass(i)}`}
            />
          ))}
        </div>
      </div>

      {/* Title block */}
      <div className="page-pad mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink">{listing.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center text-stone text-sm">
              <MapPin className="w-4 h-4 mr-1" />{listing.location}
            </span>
            {listing.property_type && (
              <Badge tone="stone">{listing.property_type}</Badge>
            )}
            <span className="flex items-center text-stone text-sm">
              <Eye className="w-4 h-4 mr-1" />{listing.views || 0} views
            </span>
            {avgRating > 0 && (
              <span className="flex items-center text-stone text-sm">
                <Star className="w-4 h-4 fill-amber text-amber mr-1" />
                {avgRating.toFixed(1)} ({reviews.length})
              </span>
            )}
          </div>
        </div>
        <div className="text-brand font-extrabold text-2xl md:text-3xl lg:hidden">
          ₦{price.toLocaleString()}<span className="text-stone text-sm font-normal">/month</span>
        </div>
      </div>

      {/* Layout */}
      <div className="page-pad grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6 pb-40 md:pb-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Amenities & features */}
          {(featureItems.length > 0 || amenities.length > 0) && (
            <section>
              <h2 className="text-lg font-bold text-ink">Amenities &amp; features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {featureItems.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-line rounded-card p-3 text-sm font-medium text-ink">
                    <f.icon className="w-4 h-4 text-brand shrink-0" />
                    <span><span className="text-stone font-normal">{f.label}: </span>{f.value}</span>
                  </div>
                ))}
                {amenities.map((a, i) => {
                  const Icon = amenityIcon(a);
                  return (
                    <div key={`am-${i}`} className="flex items-center gap-2 bg-white border border-line rounded-card p-3 text-sm font-medium text-ink">
                      <Icon className="w-4 h-4 text-brand shrink-0" />
                      <span className="capitalize">{a}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Description */}
          {listing.description && (
            <section>
              <h2 className="text-lg font-bold text-ink">About this home</h2>
              <p className="text-stone text-sm leading-relaxed whitespace-pre-line mt-3">{listing.description}</p>
            </section>
          )}

          {/* Landlord trust card + message box */}
          {!isLandlord && (
            <section className="space-y-3" ref={messageSectionRef}>
              <div className="bg-sand rounded-card p-4 flex items-center gap-4">
                <Avatar name={landlordName} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink truncate">{landlordName}</p>
                  <p className="text-xs text-sage font-semibold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified landlord
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={openMessageBox}>
                  <MessageCircle className="w-4 h-4" /> Message
                </Button>
              </div>
              {showMessageBox && messageBox}
              {listing.landlord_phone && (
                <a
                  href={`tel:${listing.landlord_phone}`}
                  onClick={handlePhoneClick}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-line bg-white text-ink text-sm font-semibold hover:border-ink/30 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call {listing.landlord_phone}
                </a>
              )}
            </section>
          )}

          {/* Role-specific content: student reviews, landlord-owner dashboard, or landlord preview */}
          {(!isLandlord) ? (
            // Student view
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Reviews</h2>
                {avgRating > 0 && (
                  <span className="flex items-center gap-1 bg-white border border-line rounded-full px-3 py-1 text-sm font-semibold text-ink">
                    <Star className="w-4 h-4 fill-amber text-amber" />
                    {avgRating.toFixed(1)} · {reviews.length}
                  </span>
                )}
              </div>

              {/* Write a review */}
              {currentUser?.role === 'student' && (
                <div className="mt-4 p-4 bg-white border border-line rounded-card">
                  <p className="font-semibold text-sm text-ink mb-3">Leave a Review</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setNewReview(r => ({ ...r, rating: star }))}
                        aria-label={`Rate ${star} stars`}
                        className="text-2xl leading-none"
                      >
                        <Star className={`w-7 h-7 ${star <= newReview.rating ? 'fill-amber text-amber' : 'text-stone/30'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full border border-line rounded-card p-3 text-sm text-ink resize-none focus:ring-2 focus:ring-brand/40 focus:border-brand focus:outline-none"
                    rows={3}
                    aria-label="Your review"
                    placeholder="Share your experience..."
                    value={newReview.comment}
                    onChange={e => setNewReview(r => ({ ...r, comment: e.target.value }))}
                  />
                  {reviewSuccess && (
                    <p className="text-sage text-sm mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Review submitted!
                    </p>
                  )}
                  <Button
                    className="mt-3"
                    size="sm"
                    loading={reviewSubmitting}
                    disabled={!newReview.comment.trim()}
                    onClick={handleSubmitReview}
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-stone text-sm mt-4">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4 mt-4">
                  {reviews.map((rev, i) => (
                    <div key={i} className="bg-white border border-line rounded-card p-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={rev.student_name || 'Anonymous'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink text-sm truncate">{rev.student_name || 'Anonymous'}</p>
                          {rev.created_at && (
                            <p className="text-xs text-stone">
                              {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s < rev.rating ? 'fill-amber text-amber' : 'text-stone/30'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-stone mt-2">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            (isOwner) ? (
              // Owner dashboard
              <section className="bg-white border border-line rounded-card p-6">
                <h2 className="text-lg font-bold text-ink mb-4">Owner Dashboard</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-sand rounded-card text-center">
                    <div className="text-sm text-stone">Views</div>
                    <div className="font-bold text-xl text-ink">{listing.views || 0}</div>
                  </div>
                  <div className="p-4 bg-sand rounded-card text-center">
                    <div className="text-sm text-stone">Reviews</div>
                    <div className="font-bold text-xl text-ink">{reviews.length}</div>
                  </div>
                  <div className="p-4 bg-sand rounded-card text-center">
                    <div className="text-sm text-stone">Saved</div>
                    <div className="font-bold text-xl text-ink">{listing.saved_count || 0}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button size="sm" onClick={() => navigate(`/post-property`, { state: { listing } })}>
                    Edit Listing
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/landlord-home')}>
                    Analytics
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setToast({ type: 'info', text: 'Boost feature coming soon.' })}>
                    Boost
                  </Button>
                </div>
              </section>
            ) : (
              // Landlord preview (not owner) — no contact or reviews
              <section className="bg-white border border-line rounded-card p-6">
                <h2 className="text-lg font-bold text-ink mb-4">Landlord Preview</h2>
                <p className="text-sm text-stone mb-4">You are viewing this listing as a landlord. Contact details and review actions are hidden.</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="sm" onClick={() => navigate('/landlord-home')}>
                    Go to My Listings
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setToast({ type: 'info', text: 'If you believe this is your property, request a claim.' })}>
                    Request Claim
                  </Button>
                </div>
              </section>
            )
          )}
        </div>

        {/* Sidebar: sticky booking card */}
        {!isLandlord && (
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-20 bg-white border border-line rounded-card shadow-warm p-6 space-y-4">
              <div>
                <span className="font-extrabold text-2xl text-ink">
                  ₦{price.toLocaleString()}
                </span>
                <span className="text-stone text-sm font-normal">/month</span>
              </div>

              <div className="border-t border-line" />

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-ink">
                  <MapPin className="w-4 h-4 text-brand shrink-0" />
                  <span>{listing.location}</span>
                </li>
                {listing.property_type && (
                  <li className="flex items-center gap-2 text-ink">
                    <BedDouble className="w-4 h-4 text-brand shrink-0" />
                    <span className="capitalize">{listing.property_type}</span>
                  </li>
                )}
                {waterStatus && (
                  <li className="flex items-center gap-2 text-ink">
                    <Droplet className="w-4 h-4 text-brand shrink-0" />
                    <span className="capitalize">{waterStatus} water</span>
                  </li>
                )}
              </ul>

              <div className="border-t border-line" />

              {!showMessageBox ? (
                <Button fullWidth onClick={() => setShowMessageBox(true)}>
                  <MessageCircle className="w-4 h-4" /> Message landlord
                </Button>
              ) : messageBox}

              <Button
                variant="secondary"
                fullWidth
                onClick={() => toggleSave?.(listing.id)}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-brand text-brand' : ''}`} />
                {isSaved ? 'Saved' : 'Save listing'}
              </Button>

              <p className="text-xs text-stone flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sage shrink-0" />
                This listing has been verified by BlaXk Housing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky action bar (above BottomNav) */}
      {!isLandlord && (
        <div className="fixed bottom-16 md:hidden left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-line p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="font-extrabold text-lg text-ink">₦{price.toLocaleString()}</span>
            <span className="text-stone text-xs font-normal">/month</span>
          </div>
          <Button size="sm" onClick={openMessageBox}>
            <MessageCircle className="w-4 h-4" /> Message landlord
          </Button>
          <button
            onClick={() => toggleSave?.(listing.id)}
            aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSaved ? 'border-brand/30 bg-brand-tint text-brand' : 'border-line bg-white text-stone'}`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-brand text-brand' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
