// frontend/src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useListings } from './hooks/useListings';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import ScrollToTop from './components/ScrollToTop';
import LandingPage from './pages/LandingPage/LandingPage';
import AuthPage from './pages/AuthPage/AuthPage';
// HomePage removed — using role-based redirects instead
import ListingsPage from './pages/ListingsPage/ListingsPage';
import ListPropertyForm from './pages/ListPropertyForm/ListPropertyForm';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import LandlordDashboard from './pages/LandlordDashboard/LandlordDashboard';
import AccountPage from './pages/AccountPage/AccountPage';
import ListingDetails from './pages/ListingDetails/ListingDetails';
import MessagesPage from './pages/MessagesPage/MessagesPage';
import { AnimatePresence, motion } from 'framer-motion';

// Page variants for transitions
const pageVariants = {
initial: { opacity: 0, y: 20 },
animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' } },
};

// Main App content wrapper
const AppContent = () => {
const location = useLocation();
const { currentUser, isLoadingAuth } = useAuth();
const { listings, savedListings, toggleSave } = useListings();
const [filters, setFilters] = useState({
priceRange: [0, 500000],
toiletType: 'all',
leaseType: 'all',
waterStatus: 'all'
});
const [showFilters, setShowFilters] = useState(false);
const [searchQuery] = useState('');

// Filter listings safely
const filteredListings = (listings || []).filter(listing => {
  if (!listing) return false;

  const price = parseFloat(listing.price) || 0;
  const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];

const toiletType = (listing.toilet_type || listing.toiletType || '').toLowerCase();
const matchesToilet = filters.toiletType === 'all' || toiletType === filters.toiletType.toLowerCase();

const leaseType = (listing.lease_type || listing.leaseType || '').toLowerCase();
const matchesLease = filters.leaseType === 'all' || leaseType === filters.leaseType.toLowerCase();

const waterStatus = (listing.water_status || listing.waterStatus || '').toLowerCase();
const matchesWater = filters.waterStatus === 'all' || waterStatus === filters.waterStatus.toLowerCase();

const matchesSearch = searchQuery === '' ||
  listing.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  listing.title?.toLowerCase().includes(searchQuery.toLowerCase());

return matchesPrice && matchesToilet && matchesLease && matchesWater && matchesSearch;
});

// Show loading while checking auth
if (isLoadingAuth) {
return (
<div className="min-h-screen bg-cream flex items-center justify-center">
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
</div>
);
}

return (
<div className="min-h-screen bg-cream flex flex-col">
{/* Header - only show when authenticated */}
{currentUser && (
<Header currentUser={currentUser} />
)}

  {/* Reserve space for the fixed mobile BottomNav (desktop has none;
      public pages never show the nav, so they get no extra padding) */}
  <main className={`flex-1 ${currentUser ? 'pb-24 md:pb-0' : ''}`}>
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={
          <PublicRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <LandingPage />
            </motion.div>
          </PublicRoute>
        } />

        <Route path="/signin" element={
          <PublicRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <AuthPage />
            </motion.div>
          </PublicRoute>
        } />

        {/* Private routes */}
        <Route path="/home" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              {currentUser?.role === 'landlord' ? (
                <Navigate to="/landlord-home" replace />
              ) : (
                <Navigate to="/student-home" replace />
              )}
            </motion.div>
          </PrivateRoute>
        } />

        <Route path="/student-home" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ListingsPage
                filteredListings={filteredListings}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filters={filters}
                setFilters={setFilters}
                savedListings={savedListings}
                toggleSave={toggleSave}
              />
            </motion.div>
          </PrivateRoute>
        } />

        <Route path="/post-property" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ListPropertyForm currentUser={currentUser} />
            </motion.div>
          </PrivateRoute>
        } />

        {/* Student Dashboard */}
        <Route path="/student-dashboard" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <StudentDashboard />
            </motion.div>
          </PrivateRoute>
        } />

        <Route path="/account" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <AccountPage />
            </motion.div>
          </PrivateRoute>
        } />

        {/* Landlord Dashboard */}
        <Route path="/landlord-home" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <LandlordDashboard />
            </motion.div>
          </PrivateRoute>
        } />

        {/* Student Landing → Student Home */}
        <Route path="/student-landing" element={<Navigate to="/student-home" replace />} />

        {/* Landlord Landing → Landlord Home */}
        <Route path="/landlord-landing" element={<Navigate to="/landlord-home" replace />} />

        {/* Legacy redirects */}
        <Route path="/listings" element={<Navigate to="/student-home" replace />} />
        <Route path="/landlord-dashboard" element={<Navigate to="/landlord-home" replace />} />
        <Route path="/list-property" element={<Navigate to="/post-property" replace />} />
        <Route path="/auth" element={<Navigate to="/signin" replace />} />
        <Route path="/listing/:id" element={<LegacyListingRedirect />} />

        {/* Property Details */}
        <Route path="/property/:id" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ListingDetails
                listings={listings}
                savedListings={savedListings}
                toggleSave={toggleSave}
              />
            </motion.div>
          </PrivateRoute>
        } />

        {/* Messages */}
        <Route path="/messages" element={
          <PrivateRoute>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <MessagesPage />
            </motion.div>
          </PrivateRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to={currentUser ? "/home" : "/"} replace />} />
      </Routes>
    </AnimatePresence>
  </main>

  {/* Global Bottom Nav - Mobile only, fixed across authenticated pages */}
  {currentUser && (
    <div className="md:hidden">
      <BottomNav userRole={currentUser?.role || 'resident'} />
    </div>
  )}
</div>
);
};

// Small helper to redirect legacy listing routes with params to the new path
const LegacyListingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/property/${id}`} replace />;
};

function App() {
return (
<AuthProvider>
<Router>
<ScrollToTop />
<AppContent />
</Router>
</AuthProvider>
);
}

export default App;