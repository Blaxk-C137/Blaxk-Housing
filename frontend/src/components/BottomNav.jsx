// frontend/src/components/BottomNav.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, MessageCircle, BarChart3, Plus, Building2 } from 'lucide-react';

const studentNav = [
  { key: 'browse',    path: '/student-home',          icon: Search,        label: 'Browse' },
  { key: 'saved',     path: '/student-dashboard', icon: Heart,         label: 'Dashboard' },
  { key: 'messages',  path: '/messages',           icon: MessageCircle, label: 'Messages' },
];

const landlordNav = [
  { key: 'dashboard', path: '/landlord-home', icon: BarChart3,    label: 'Dashboard' },
  { key: 'add',       path: '/post-property',       icon: Plus,         label: 'Add',      isSpecial: true },
  { key: 'browse',    path: '/student-home',             icon: Building2,   label: 'Browse' },
  { key: 'messages',  path: '/messages',             icon: MessageCircle, label: 'Messages' },
];

const BottomNav = ({ userRole = 'student' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = userRole === 'landlord' ? landlordNav : studentNav;
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-line z-50 safe-area-pb">
      <div className={`flex justify-around items-center px-1 py-1 max-w-lg mx-auto`}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-2"
              >
                <div className="w-11 h-11 bg-brand shadow-warm-lg rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] text-brand font-semibold">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-0"
            >
              <div className={`w-6 h-6 flex items-center justify-center ${active ? 'text-brand' : 'text-stone'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-semibold truncate rounded-full px-2 py-0.5 ${
                  active ? 'text-brand bg-brand-tint' : 'text-stone'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
