import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import {
  User, Mail, Shield, LogOut, Building2, GraduationCap, CreditCard,
  Search, MessageCircle, ChevronRight, CheckCircle,
} from 'lucide-react';

const AccountPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const fullName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.username || 'Account User';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLandlord = currentUser?.role === 'landlord';

  const profileRows = [
    { icon: User, label: 'Full name', value: fullName },
    { icon: Mail, label: 'Email', value: currentUser?.email || 'Not provided' },
    { icon: isLandlord ? Building2 : GraduationCap, label: 'Role', value: currentUser?.role || 'resident' },
    { icon: CreditCard, label: 'Member since', value: currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Unknown' },
    { icon: Shield, label: 'Security', value: 'Password protected' },
  ];

  const actionRows = [
    { icon: MessageCircle, label: 'View messages', hint: 'Your conversations with landlords', onClick: () => navigate('/messages') },
    { icon: isLandlord ? Building2 : GraduationCap, label: 'Go to dashboard', hint: isLandlord ? 'Manage your listings and analytics' : 'Saved homes, messages and reviews', onClick: () => navigate(isLandlord ? '/landlord-home' : '/student-dashboard') },
    { icon: Search, label: 'Browse properties', hint: 'Explore homes near campus', onClick: () => navigate('/student-home') },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream py-8">
      <div className="max-w-4xl mx-auto page-pad space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-card border border-line shadow-warm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar name={fullName} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-ink truncate">{fullName}</h1>
              <p className="text-stone text-sm truncate">{currentUser?.email || 'No email on file'}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <Badge tone="brand" className="capitalize">{currentUser?.role || 'resident'}</Badge>
                {currentUser?.is_active && <Badge tone="sage" icon={CheckCircle}>Active</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Profile information */}
        <section>
          <h2 className="label-caps text-stone mb-2">Profile information</h2>
          <div className="bg-white rounded-card border border-line divide-y divide-line overflow-hidden">
            {profileRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-stone shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-stone">{label}</span>
                  <span className={`block text-sm font-semibold text-ink truncate ${label === 'Role' ? 'capitalize' : ''}`}>{value}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="label-caps text-stone mb-2">Quick actions</h2>
          <div className="bg-white rounded-card border border-line divide-y divide-line overflow-hidden">
            {actionRows.map(({ icon: Icon, label, hint, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-sand/60 transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-tint text-brand shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block text-xs text-stone truncate">{hint}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-stone shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="label-caps text-stone mb-2">Danger zone</h2>
          <div className="bg-white rounded-card border border-line p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Sign out of your account</p>
              <p className="text-xs text-stone">You'll need to sign back in to access your dashboard.</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AccountPage;
