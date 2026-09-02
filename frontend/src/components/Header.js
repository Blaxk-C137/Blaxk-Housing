// frontend/src/components/Header.js

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Search, LogOut, User, Bell, Plus } from 'lucide-react';
import Avatar from './ui/Avatar';
import Button from './ui/Button';

const Header = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  const isLandlord = currentUser?.role === 'landlord';
  const homeRoute = isLandlord ? '/landlord-home' : '/student-home';
  const roleLink = isLandlord
    ? { path: '/landlord-home', label: 'Dashboard' }
    : { path: '/student-dashboard', label: 'Saved' };
  // Desktop nav — the header is the only desktop navigation (BottomNav is mobile-only)
  const navLinks = [
    { path: '/student-home', label: 'Browse' },
    { path: '/messages', label: 'Messages' },
    roleLink,
  ];
  const displayName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ');

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center bg-cream/80 backdrop-blur-md border-b border-line">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6 max-w-7xl mx-auto">

        {/* Wordmark */}
        <button
          onClick={() => navigate(homeRoute)}
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="BUK Housing home"
        >
          <span className="font-extrabold text-lg text-ink tracking-tight">
            BUK<span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-brand mx-1" />Housing
          </span>
        </button>

        {/* Desktop search pill */}
        <div className="hidden md:flex flex-1 justify-center max-w-md">
          <div className="flex items-center gap-2.5 w-full rounded-full border border-line bg-white px-4 py-2">
            <Search className="w-4 h-4 text-stone flex-shrink-0" />
            <input
              type="search"
              placeholder="Search homes, areas, campuses…"
              aria-label="Search listings"
              className="w-full bg-transparent text-sm text-ink placeholder:text-stone focus:outline-none"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {navLinks.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'text-brand font-semibold'
                    : 'text-ink hover:text-brand'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Landlord: list property (desktop) */}
          {isLandlord && (
            <Button
              variant="primary"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => navigate('/post-property')}
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> List property
            </Button>
          )}

          {/* Notification bell (mobile, decorative) */}
          <span
            aria-hidden="true"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-ink"
          >
            <Bell className="w-5 h-5" />
          </span>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(v => !v)}
              aria-haspopup="menu"
              aria-expanded={showDropdown}
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Avatar name={displayName || currentUser?.email || 'U'} size="sm" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-card shadow-warm border border-line py-1 z-50">
                <div className="px-4 py-2.5 border-b border-line">
                  <p className="font-semibold text-ink text-sm truncate">
                    {currentUser?.first_name} {currentUser?.last_name}
                  </p>
                  <p className="text-stone text-xs truncate mt-0.5">{currentUser?.email}</p>
                </div>
                <button onClick={() => { setShowDropdown(false); navigate('/account'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-cream text-sm transition-colors"
                >
                  <User className="w-4 h-4 text-stone" /> My account
                </button>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
