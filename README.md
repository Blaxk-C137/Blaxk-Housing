<<<<<<< HEAD
# didactic-sniffle
N?A 
=======
# BUK Housing Platform

A student housing platform for Bayero University Kano (BUK) students.
Built with React (frontend) + Django REST Framework (backend).

---

## Project Structure

```
buk-housing/
├── frontend/                          # React app
│   └── src/
│       ├── App.js                     # Main router with role-based routing
│       ├── components/
│       │   └── ListingCard.jsx        # Reusable listing card (grid + list modes)
│       ├── hooks/
│       │   └── useListings.js         # Listings fetch + savedListings state
│       ├── pages/
│       │   ├── AuthPage/
│       │   │   └── AuthPage.jsx       # Login + Signup with role selection
│       │   ├── StudentLanding/
│       │   │   └── StudentLanding.jsx # Student home page with recent listings
│       │   ├── LandlordLanding/
│       │   │   └── LandlordLanding.jsx # Landlord welcome page with quick stats
│       │   ├── LandlordDashboard/
│       │   │   └── LandlordDashboard.jsx # Full analytics dashboard (sidebar layout)
│       │   └── ListingsPage/
│       │       └── ListingsPage.jsx   # Browse all listings with filters + sort
│       └── services/
│           └── api.js                 # Axios instance (create this yourself - see below)
│
└── backend/                           # Django project
    ├── core/
    │   └── urls.py                    # Main URL routing (includes analytics routes)
    ├── listings/
    │   ├── models.py                  # Listing, ListingView, ListingInquiry models
    │   ├── views.py                   # ListingViewSet with track_view/track_action
    │   ├── serializers.py             # ListingSerializer with avg_rating
    │   └── analytics.py              # Analytics API endpoints
    └── users/
        └── models.py                  # Extended User model with role + subscription
```

---

## Key Design Decisions

### Role-Based Routing
- After login/signup, users are redirected based on `user.role`:
  - `student` → `/student-landing`
  - `landlord` → `/landlord-landing`
- Cross-role access is blocked via `<Navigate>` redirects inside each route
- `RoleBasedRedirect` component in App.js handles the catch-all

### Listings Data Flow
- `useListings()` hook fetches from `/api/listings/` and is called at the top level in `AppContent`
- The hook returns `{ listings, savedListings, toggleSave, loading, error }`
- Props are passed down to `StudentLanding`, `ListingsPage`, etc.
- `ListingsPage` also has a local fetch fallback if props are empty

### Analytics
- Backend has separate analytics endpoints (not inside the DRF router) at:
  - `POST /api/listings/<id>/track-view/` — rate-limited (60s cache)
  - `GET /api/listings/landlord-analytics/?days=30` — landlord-only aggregate stats
  - `GET /api/listings/my-listings/` — landlord's own listings only
  - `POST /api/listings/<id>/track-action/` — save/share/click tracking

---

## Setup

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install django djangorestframework djangorestframework-simplejwt Pillow django-cors-headers
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### api.js (create this if missing)
```js
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

---

## Common Issues Fixed

| Issue | Fix |
|-------|-----|
| All users landing on student page after signup | `navigateBasedOnRole()` in AuthPage reads role from response |
| Listings not showing on StudentLanding | Props passed from App.js via `useListings()` at top level |
| Filters not matching backend field names | ListingsPage handles both `snake_case` and `camelCase` |
| Dashboard pulling all landlords' data | Analytics endpoints filter by `landlord=request.user` |
| Mobile content bleeding | Overflow hidden + responsive grid classes on ListingsPage |
>>>>>>> 39cba213 (Accommodation site (working))
