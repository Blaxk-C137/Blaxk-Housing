// frontend/src/components/ListingCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Eye, Star, Droplet, Bath } from 'lucide-react';

const isSavedListing = (savedListings, id) =>
  (savedListings || []).some((s) => Number(s) === Number(id));

const ListingCard = ({ listing, savedListings = [], toggleSave, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const price = parseFloat(listing.price) || 0;
  const views = listing.views || 0;
  const rating = listing.rating || listing.avg_rating || 0;
  const toiletType = listing.toilet_type || listing.toiletType || '';
  const waterStatus = listing.water_status || listing.waterStatus || '';
  const imageUrl = listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';
  const isSaved = isSavedListing(savedListings, listing.id);
  const isDemo = Boolean(listing.isDemo);

  const handleCardClick = () => {
    if (isDemo) return; // marketing placeholders have no detail page
    navigate(`/property/${listing.id}`);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };
  const handleSaveClick = (e) => { e.stopPropagation(); toggleSave?.(listing.id); };

  const cardProps = {
    onClick: handleCardClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: 0,
    'aria-label': `${listing.title} in ${listing.location}, ₦${price.toLocaleString()} per month`,
  };

  const cardClass =
    'bg-white rounded-card border border-line overflow-hidden hover:shadow-warm-lg transition-all cursor-pointer group focus-visible:outline-none';

  const saveButton = isDemo ? null : (
    <button
      onClick={handleSaveClick}
      aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
      className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full hover:bg-sand transition-colors"
    >
      <Heart className={`w-5 h-5 ${isSaved ? 'fill-brand text-brand' : 'text-ink/60'}`} />
    </button>
  );

  if (viewMode === 'list') {
    return (
      <div {...cardProps} className={cardClass}>
        <div className="flex">
          <img src={imageUrl} alt={listing.title} className="w-32 sm:w-48 h-32 sm:h-auto flex-shrink-0 object-cover" />
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-ink truncate group-hover:text-brand-dark transition-colors">{listing.title}</h3>
                {saveButton}
              </div>
              <div className="flex items-center text-stone text-sm mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-ink">
                ₦{price.toLocaleString()}<span className="text-stone text-sm font-normal">/mo</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone">
                {views > 0 && <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{views}</span>}
                {rating > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber text-amber" />{rating.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div {...cardProps} className={cardClass}>
      <div className="relative h-48 sm:h-52 overflow-hidden">
        <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        {!isDemo && (
          <button
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-warm hover:bg-white transition-colors"
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-brand text-brand' : 'text-ink/60'}`} />
          </button>
        )}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-sm font-bold text-ink">
          ₦{price.toLocaleString()}<span className="text-stone text-xs font-normal">/mo</span>
        </div>
        {views > 0 && (
          <div className="absolute bottom-3 right-3 px-1.5 py-1 bg-ink/50 backdrop-blur rounded-lg flex items-center gap-1">
            <Eye className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-medium">{views}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-ink truncate mb-1 group-hover:text-brand-dark transition-colors">{listing.title}</h3>
        <div className="flex items-center text-stone text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {toiletType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-sand text-ink rounded-md text-xs font-medium">
              <Bath className="w-3 h-3" />{toiletType}
            </span>
          )}
          {waterStatus && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${waterStatus.toLowerCase() === 'available' ? 'bg-sage/10 text-sage-dark' : waterStatus.toLowerCase() === 'limited' ? 'bg-amber/10 text-amber-dark' : 'bg-brand/10 text-brand-dark'}`}>
              <Droplet className="w-3 h-3" />{waterStatus}
            </span>
          )}
          {rating > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber/10 text-amber-dark rounded-md text-xs font-medium">
              <Star className="w-3 h-3 fill-amber text-amber" />{rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
