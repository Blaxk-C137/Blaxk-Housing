// frontend/src/pages/AuthPage/AuthPage.jsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Building2, ArrowRight, Home, CheckCircle, ChevronLeft } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'student',
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasUppercase = (value) => /[A-Z]/.test(value);
  const hasNumber = (value) => /[0-9]/.test(value);
  const hasSymbol = (value) => /[^A-Za-z0-9]/.test(value);
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'Weak', color: 'bg-brand', textColor: 'text-brand-dark' };
    if (password.length < 6) {
      return { score: 1, label: 'Weak', color: 'bg-brand', textColor: 'text-brand-dark' };
    }
    const upper = hasUppercase(password);
    const number = hasNumber(password);
    const symbol = hasSymbol(password);
    const typeCount = [upper, number, symbol].filter(Boolean).length;
    if (password.length >= 8 && upper && (number || symbol)) {
      return { score: 4, label: 'Strong', color: 'bg-sage', textColor: 'text-sage-dark' };
    }
    if (password.length >= 8 && typeCount >= 2) {
      return { score: 3, label: 'Good', color: 'bg-sage/60', textColor: 'text-sage-dark' };
    }
    return { score: 2, label: 'Fair', color: 'bg-amber', textColor: 'text-amber-dark' };
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        return !value.trim() ? 'First name is required' : '';
      case 'lastName':
        return !value.trim() ? 'Last name is required' : '';
      case 'email':
        return !emailRegex.test(value) ? 'Enter a valid email address' : '';
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters' : '';
      case 'confirmPassword':
        return value !== form.password ? 'Passwords do not match' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const navigateByRole = (user) => {
    navigate(user.role === 'landlord' ? '/landlord-home' : '/student-home');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError('');

    const validationErrors = {};
    if (!isLogin) {
      validationErrors.firstName = validateField('firstName', form.firstName);
      validationErrors.lastName = validateField('lastName', form.lastName);
    }
    validationErrors.email = validateField('email', form.email);
    validationErrors.password = validateField('password', form.password);
    if (!isLogin) {
      validationErrors.confirmPassword = validateField('confirmPassword', form.confirmPassword);
    }

    const fieldErrors = Object.fromEntries(Object.entries(validationErrors).filter(([, v]) => v));
    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(fieldErrors);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const userData = await login(form.email, form.password);
        navigateByRole(userData);
      } else {
        await api.post('/users/register/', {
          email: form.email,
          password: form.password,
          first_name: form.firstName,
          last_name: form.lastName,
          role: form.role,
        });

        const userData = await login(form.email, form.password);
        navigateByRole(userData);
      }
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) {
        setSubmitError('Could not connect. Check your internet connection.');
      } else if (data) {
        const nextErrors = {};
        if (data.email) {
          nextErrors.email = data.email[0] === 'already exists' || data.email[0]?.toLowerCase().includes('already exists')
            ? 'An account with this email already exists'
            : data.email[0];
        }
        if (data.password) {
          nextErrors.password = data.password[0] === 'too short' || data.password[0]?.toLowerCase().includes('too short')
            ? 'Password is too short'
            : data.password[0];
        }
        if (data.non_field_errors) {
          const message = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
          if (message?.toLowerCase().includes('no active account')) {
            nextErrors.email = 'Incorrect email or password';
          } else {
            setSubmitError(message || 'Incorrect email or password');
          }
        }
        if (Object.keys(nextErrors).length > 0) {
          setFormErrors(nextErrors);
        } else {
          setSubmitError('Invalid credentials');
        }
      } else {
        setSubmitError('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Left panel — brand and testimonial (desktop only) */}
      <div className="hidden md:flex md:w-2/5 bg-espresso relative">
        <img
          src={AUTH_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-espresso/60" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10">
          <span className="font-extrabold text-xl text-cream">BUK Housing</span>
          <div>
            <blockquote className="text-xl font-medium leading-relaxed text-cream">
              “I found my self-contain near campus in two days.”
            </blockquote>
            <p className="mt-3 text-sm text-cream/70">— Amina, 300-level student</p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center bg-cream p-6 md:p-12">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate('/');
            }}
            className="mb-6 -ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-semibold text-stone transition-colors hover:bg-sand hover:text-ink"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
          <p className="mb-8 font-extrabold text-xl text-ink md:hidden">BUK Housing</p>

          <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h1>
          <p className="text-sm text-stone mt-2">
            {isLogin
              ? 'Welcome back — pick up right where you left off.'
              : 'Set up your account to browse verified homes near BUK.'}
          </p>

          {submitError && (
            <div className="bg-brand/10 text-brand-dark rounded-xl p-3 text-sm mb-4 mt-4" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Role picker — signup only */}
            {!isLogin && (
              <div>
                <p className="block text-sm font-medium text-ink mb-2">I am a</p>
                <div className="flex gap-3" role="group" aria-label="Account type">
                  {[
                    { value: 'student', label: 'Resident', Icon: Home },
                    { value: 'landlord', label: 'Landlord', Icon: Building2 },
                  ].map(({ value, label, Icon }) => {
                    const selected = form.role === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setForm(p => ({ ...p, role: value }))}
                        className={`flex-1 p-4 rounded-card border-2 cursor-pointer transition-all text-left ${
                          selected
                            ? 'border-brand bg-brand-tint'
                            : 'border-line bg-white hover:border-ink/30'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${selected ? 'text-brand' : 'text-stone'}`} aria-hidden="true" />
                        <span className={`block font-bold text-sm mt-2 ${selected ? 'text-brand-dark' : 'text-ink'}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name fields — signup only */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'firstName', label: 'First name', placeholder: 'Aminu', autoComplete: 'given-name' },
                  { name: 'lastName', label: 'Last name', placeholder: 'Musa', autoComplete: 'family-name' },
                ].map(({ name, label, placeholder, autoComplete }) => (
                  <Input
                    key={name}
                    type="text"
                    name={name}
                    label={label}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    value={form[name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={formErrors[name]}
                  />
                ))}
              </div>
            )}

            {/* Email */}
            <Input
              type="email"
              name="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={formErrors.email}
            />

            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  label="Password"
                  placeholder="Min. 6 characters"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={formErrors.password}
                  className="pr-12"
                />
                {/* 49px = label block (26px) + half the input height (23px), so the
                    toggle centers on the input whether or not an error row renders */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-[49px] -translate-y-1/2 p-2 rounded-full text-stone hover:text-ink hover:bg-sand transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(!isLogin && form.password.length > 0) && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= getPasswordStrength(form.password).score
                            ? getPasswordStrength(form.password).color
                            : 'bg-line'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${getPasswordStrength(form.password).textColor}`}>
                    {getPasswordStrength(form.password).label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password — signup only */}
            {!isLogin && (
              <div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  label="Confirm password"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={formErrors.confirmPassword}
                />
                {form.confirmPassword && form.password === form.confirmPassword && !formErrors.confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-sage-dark">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Passwords match
                  </p>
                )}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              {isLogin ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="text-sm text-stone mt-6 text-center">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setFormErrors({}); setSubmitError(''); }}
              className="text-brand font-semibold hover:text-brand-dark"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p className="text-xs text-stone/70 text-center mt-6">
            By continuing, you agree to BUK Housing's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
