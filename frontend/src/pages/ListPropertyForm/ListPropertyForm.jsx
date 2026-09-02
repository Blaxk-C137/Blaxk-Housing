// frontend/src/pages/ListPropertyForm/ListPropertyForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import { Chip } from '../../components/ui/Badge';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, MapPin, Check, X } from 'lucide-react';

const AMENITY_OPTIONS = [
  'WiFi', 'NEPA Light', 'Generator', 'Borehole Water', 'Parking', 'Security',
  'Furnished', 'Kitchen', 'AC', 'Ceiling Fan', 'Wardrobe', 'Tiled Floor',
];

const INITIAL_FORM = {
  title: '',
  description: '',
  price: '',
  location: '',
  toilet_type: 'shared',
  lease_type: 'long-term',
  water_status: 'available',
  power_status: 'NEPA + Generator',
  property_type: 'Self-contain',
  distance: '',
  amenities: [],
};

const STEP_TITLES = ['Details', 'Photos & amenities', 'Pricing'];
const TOTAL_STEPS = STEP_TITLES.length;
const STEP_FIELDS = { 1: ['title', 'location'], 2: [], 3: ['price'] };

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const ListPropertyForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdListing, setCreatedListing] = useState(null);
  const [countdown, setCountdown] = useState(4);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [step, setStep] = useState(1);

  const [form, setForm] = useState(INITIAL_FORM);

  const location = useLocation();
  const editingListing = location.state?.listing;

  useEffect(() => {
    if (editingListing) {
      setForm(prev => ({
        ...prev,
        title: editingListing.title || prev.title,
        description: editingListing.description || prev.description,
        price: editingListing.price || prev.price,
        location: editingListing.location || prev.location,
        toilet_type: editingListing.toilet_type || prev.toilet_type,
        lease_type: editingListing.lease_type || prev.lease_type,
        water_status: editingListing.water_status || prev.water_status,
        power_status: editingListing.power_status || prev.power_status,
        property_type: editingListing.property_type || prev.property_type,
        distance: editingListing.distance || prev.distance,
        amenities: editingListing.amenities || prev.amenities,
      }));
      if (editingListing.image) setImagePreview(editingListing.image);
    }
  }, [editingListing]);

  const validateField = (name, value) => {
    if (name === 'title') {
      return !value.trim() ? 'Title is required' : '';
    }
    if (name === 'location') {
      return !value.trim() ? 'Location is required' : '';
    }
    if (name === 'price') {
      const priceValue = Number(value);
      return !value || priceValue <= 0 ? 'Price is required' : '';
    }
    return '';
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setImageFile(null);
    setImagePreview('');
    setImageError('');
    setFormErrors({});
    setError('');
    setSuccess(false);
    setCreatedListing(null);
    setCountdown(4);
    setStep(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPG and PNG photos are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Photo must be 10MB or smaller.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageError('');
  };

  const goNext = () => {
    const fields = STEP_FIELDS[step] || [];
    const errs = {};
    fields.forEach((f) => {
      const msg = validateField(f, form[f]);
      if (msg) errs[f] = msg;
    });
    if (Object.keys(errs).length) {
      setFormErrors(prev => ({ ...prev, ...errs }));
      return;
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

  useEffect(() => {
    if (success && createdListing) {
      const interval = setInterval(() => setCountdown(prev => Math.max(prev - 1, 0)), 1000);
      const timeout = setTimeout(() => navigate('/landlord-dashboard'), 4000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
    return undefined;
  }, [success, createdListing, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});

    const validationErrors = {
      title: validateField('title', form.title),
      location: validateField('location', form.location),
      price: validateField('price', form.price),
    };

    const fieldErrors = Object.fromEntries(Object.entries(validationErrors).filter(([, v]) => v));
    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(fieldErrors);
      // Jump back to the step that holds the first invalid field
      if (fieldErrors.title || fieldErrors.location) setStep(1);
      else if (fieldErrors.price) setStep(3);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'amenities') {
          formData.append('amenities', JSON.stringify(val));
        } else {
          formData.append(key, val);
        }
      });
      if (imageFile) formData.append('image', imageFile);

      let res;
      if (editingListing) {
        res = await api.patch(`/listings/${editingListing.id}/`, formData);
      } else {
        res = await api.post('/listings/', formData);
      }

      window.dispatchEvent(new CustomEvent('buk:newListing', { detail: res.data }));
      setCreatedListing(res.data);
      setSuccess(true);
      setCountdown(4);
    } catch (err) {
      console.error('Submit error:', err);
      const data = err.response?.data;
      // Prefer explicit error messages from backend
      if (data) {
        if (data.error) {
          setError(data.error);
        } else if (data.detail) {
          setError(data.detail);
        } else if (typeof data === 'object') {
          // Map field errors to inline form errors when possible
          const fieldErrs = {};
          Object.keys(data).forEach(key => {
            const val = data[key];
            if (Array.isArray(val)) fieldErrs[key] = val[0];
          });
          if (Object.keys(fieldErrs).length > 0) {
            setFormErrors(prev => ({ ...prev, ...fieldErrs }));
          } else {
            setError('Failed to create listing. Please check your input.');
          }
        } else {
          setError('Failed to create listing. Please try again.');
        }
      } else {
        setError('Failed to create listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-cream page-pad py-8">
        <div className="max-w-md w-full text-center bg-white border border-line rounded-card p-8 shadow-warm">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage/10 text-sage-dark">
            <CheckCircle className="w-8 h-8" />
          </span>
          <h2 className="text-2xl font-extrabold text-ink mb-2">{editingListing ? 'Listing updated' : 'Listing created'}</h2>
          <p className="text-stone mb-4">Your property is now live and visible to students.</p>
          <p className="text-sm text-stone">Redirecting in {countdown}…</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button fullWidth onClick={() => navigate(`/property/${createdListing?.id}`)}>
              View listing
            </Button>
            <Button variant="secondary" fullWidth onClick={resetForm}>
              Add another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream py-8">
      <div className="max-w-2xl mx-auto page-pad">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-line bg-white text-stone hover:border-ink/30 hover:text-ink transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{editingListing ? 'Edit property' : 'List a property'}</h1>
            <p className="text-stone text-sm">Step {step} of {TOTAL_STEPS} · {STEP_TITLES[step - 1]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-6">
          {STEP_TITLES.map((t, i) => {
            const n = i + 1;
            const done = step > n;
            const current = step === n;
            return (
              <React.Fragment key={t}>
                <div className="flex items-center gap-2">
                  <span className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${done ? 'bg-brand text-white border-brand' : current ? 'border-brand text-brand bg-brand-tint' : 'border-line text-stone bg-white'}`}>
                    {done ? <Check className="w-4 h-4" /> : n}
                  </span>
                  <span className={`hidden sm:block text-sm font-semibold ${current || done ? 'text-ink' : 'text-stone'}`}>{t}</span>
                </div>
                {n < TOTAL_STEPS && <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-brand' : 'bg-line'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-brand/10 border border-brand/20 rounded-card flex items-center gap-3 text-brand-dark text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && step < TOTAL_STEPS && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
          className="space-y-5"
        >
          {/* STEP 1 — Details */}
          {step === 1 && (
            <div className="bg-white rounded-card border border-line p-5 md:p-8 space-y-4">
              <Field.Input
                label="Title"
                required
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={formErrors.title}
                placeholder="e.g. Spacious Self-Contain Near BUK Gate"
              />

              <div>
                <label htmlFor="listing-location" className="text-sm font-medium text-ink mb-1.5 block">Location <span className="text-brand">*</span></label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" aria-hidden="true" />
                  <input
                    id="listing-location"
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={formErrors.location ? true : undefined}
                    placeholder="e.g. Kabuga, Kano"
                    className={`w-full rounded-xl px-4 py-3 pl-10 text-sm bg-white text-ink placeholder:text-stone/70 focus:outline-none focus:ring-2 transition-colors border ${
                      formErrors.location
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-line focus:border-brand focus:ring-brand/30'
                    }`}
                  />
                </div>
                {formErrors.location && <p className="text-red-700 text-xs font-medium mt-1.5">{formErrors.location}</p>}
              </div>

              <Field.Input
                label="Distance from BUK"
                type="text"
                name="distance"
                value={form.distance}
                onChange={handleChange}
                placeholder="e.g. 5 mins walk, 2km"
              />

              <Field.Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the property — size, condition, rules, etc."
              />

              <div className="border-t border-line pt-4">
                <h2 className="font-bold text-ink mb-3">Property details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field.Select
                    label="Property type"
                    name="property_type"
                    value={form.property_type}
                    onChange={handleChange}
                    options={['Self-contain', 'Room & Parlour', 'Flat', 'Room Only', 'Mini Flat'].map(t => ({ value: t, label: t }))}
                  />
                  <Field.Select
                    label="Toilet"
                    name="toilet_type"
                    value={form.toilet_type}
                    onChange={handleChange}
                    options={[
                      { value: 'ensuite', label: 'Ensuite' },
                      { value: 'shared', label: 'Shared' },
                    ]}
                  />
                  <Field.Select
                    label="Water"
                    name="water_status"
                    value={form.water_status}
                    onChange={handleChange}
                    options={[
                      { value: 'available', label: 'Available' },
                      { value: 'limited', label: 'Limited' },
                      { value: 'unavailable', label: 'Unavailable' },
                    ]}
                  />
                  <Field.Select
                    label="Lease type"
                    name="lease_type"
                    value={form.lease_type}
                    onChange={handleChange}
                    options={[
                      { value: 'long-term', label: 'Long-term' },
                      { value: 'short-term', label: 'Short-term' },
                    ]}
                  />
                  <Field.Select
                    label="Power"
                    name="power_status"
                    value={form.power_status}
                    onChange={handleChange}
                    options={['NEPA Only', 'NEPA + Generator', 'Solar', 'Generator Only', 'No Power'].map(p => ({ value: p, label: p }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Photos & amenities */}
          {step === 2 && (
            <div className="bg-white rounded-card border border-line p-5 md:p-8 space-y-6">
              <div>
                <h2 className="font-bold text-ink mb-3">Property photo</h2>
                {imagePreview ? (
                  <div>
                    <div className="relative">
                      <img src={imagePreview} alt="Preview of your property" className="w-full h-56 object-cover rounded-card" />
                      <button
                        type="button" onClick={removeImage} aria-label="Remove photo"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-ink flex items-center justify-center shadow-warm hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30 hover:bg-sand/60 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        Change photo
                        <input type="file" accept="image/jpeg,image/png" onChange={handleImageChange} className="hidden" />
                      </label>
                      <button
                        type="button" onClick={removeImage}
                        className="text-sm font-semibold text-stone hover:text-ink underline underline-offset-2 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="h-56 border-2 border-dashed border-line rounded-card flex flex-col items-center justify-center gap-2 hover:border-brand hover:bg-brand-tint/40 transition-colors">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand">
                        <Upload className="w-6 h-6" />
                      </span>
                      <p className="text-ink font-semibold">Click to upload a photo</p>
                      <p className="text-stone text-sm">JPG, PNG up to 10MB</p>
                    </div>
                    <input type="file" accept="image/jpeg,image/png" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
                {imageError && (
                  <p className="mt-2 text-xs font-medium text-red-700 flex items-center gap-1.5" role="alert">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {imageError}
                  </p>
                )}
              </div>

              <div>
                <h2 className="font-bold text-ink mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map(amenity => (
                    <Chip
                      key={amenity}
                      active={form.amenities.includes(amenity)}
                      onClick={() => toggleAmenity(amenity)}
                    >
                      {form.amenities.includes(amenity) && <Check className="w-3.5 h-3.5" />}
                      {amenity}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Pricing */}
          {step === 3 && (
            <div className="bg-white rounded-card border border-line p-5 md:p-8 space-y-4">
              <div>
                <label htmlFor="listing-price" className="text-sm font-medium text-ink mb-1.5 block">Monthly rent <span className="text-brand">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone text-sm font-semibold" aria-hidden="true">₦</span>
                  <input
                    id="listing-price"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    min="0"
                    aria-invalid={formErrors.price ? true : undefined}
                    placeholder="e.g. 25000"
                    className={`w-full rounded-xl px-4 py-3 pl-8 text-sm bg-white text-ink placeholder:text-stone/70 focus:outline-none focus:ring-2 transition-colors border ${
                      formErrors.price
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-line focus:border-brand focus:ring-brand/30'
                    }`}
                  />
                </div>
                {formErrors.price && <p className="text-red-700 text-xs font-medium mt-1.5">{formErrors.price}</p>}
              </div>

              {/* Review summary */}
              <div className="rounded-card bg-sand p-4 space-y-2 text-sm">
                <p className="label-caps text-stone">Review</p>
                <div className="flex justify-between gap-3">
                  <span className="text-stone">Title</span>
                  <span className="text-ink font-semibold text-right truncate">{form.title || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-stone">Location</span>
                  <span className="text-ink font-semibold text-right truncate">{form.location || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-stone">Type</span>
                  <span className="text-ink font-semibold text-right">{form.property_type}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-stone">Amenities</span>
                  <span className="text-ink font-semibold text-right">{form.amenities.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button type="button" fullWidth onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" fullWidth loading={loading}>
                {editingListing ? 'Update listing' : 'Create listing'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListPropertyForm;
