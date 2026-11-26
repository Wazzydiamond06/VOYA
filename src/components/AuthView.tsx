import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';
import { routeIdToDestinationLabel, validateAuthForm } from '../lib/authEngine';
import type { AuthMode, PendingBookingIntent, UserRole } from '../lib/authTypes';
import { BusShowcasePanel, MobileBusBanner } from './BusShowcasePanel';
import { ThemeToggle } from './ThemeToggle';

interface AuthViewProps {
  initialRole: UserRole;
  initialMode: AuthMode;
  pendingBooking: PendingBookingIntent | null;
  onSignIn: (params: { role: UserRole; email: string; password: string }) => void;
  onSignUp: (params: {
    role: UserRole;
    fullName: string;
    email: string;
    password: string;
  }) => void;
  onInstantDemo: (role: UserRole) => void;
  onBackHome: () => void;
}

export function AuthView({
  initialRole,
  initialMode,
  pendingBooking,
  onSignIn,
  onSignUp,
  onInstantDemo,
  onBackHome,
}: AuthViewProps) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const isStudent = role === 'student';
  const savedDestination = routeIdToDestinationLabel(pendingBooking?.routeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAuthForm({ mode, fullName, email, password });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    if (mode === 'signin') {
      onSignIn({ role, email, password });
    } else {
      onSignUp({ role, fullName, email, password });
    }
  };

  const primaryCtaLabel = isStudent
    ? mode === 'signup'
      ? 'Create Student Account'
      : 'Sign In to Student App'
    : mode === 'signup'
      ? 'Create Operator Account'
      : 'Sign In to Operator Portal';

  const inputFocusClass = isStudent
    ? 'focus:border-[#10B981] focus:ring-1 focus:ring-emerald-500/30'
    : 'focus:border-[#F59E0B] focus:ring-1 focus:ring-amber-500/30';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#05070A] text-white grid grid-cols-1 md:grid-cols-2 overflow-hidden">
      {/* ================================================================= */}
      {/* LEFT 50% VISUAL PANEL (Tablet & Desktop): Bus Showcase (bus-1)    */}
      {/* ================================================================= */}
      <BusShowcasePanel
        role={role}
        defaultSlideIndex={0}
        pendingBooking={pendingBooking}
      />

      {/* ================================================================= */}
      {/* RIGHT 50% FORM PANEL: Vertically Centered Auth Card               */}
      {/* ================================================================= */}
      <div className="relative flex flex-col justify-center items-center p-6 md:p-10 lg:p-12 bg-[#05070A]">
        {/* Subtle Ambient Glow behind form */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-1/4 w-[420px] h-[280px] rounded-full blur-3xl transition-colors duration-500 ${
            isStudent ? 'bg-emerald-500/10' : 'bg-amber-500/10'
          }`}
        />

        <div className="relative w-full max-w-lg">
          {/* Top Utility Bar: Back to Home + Light/Dark Toggle */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Landing Page
            </button>
            <ThemeToggle variant="segmented" />
          </div>

          {/* Mobile Slim h-40 Top Banner Image */}
          <MobileBusBanner role={role} slideIndex={0} />

          {/* Mobile Saved Route Pill */}
          {isStudent && pendingBooking && savedDestination && (
            <div className="md:hidden mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-white">
                Saved: LAUTECH → {savedDestination}
              </span>
              <span className="tabular-nums text-emerald-300 font-medium">
                {pendingBooking.travelDate}
              </span>
            </div>
          )}

          {/* Auth Glass Card */}
          <div className="w-full rounded-2xl bg-[#0D131F]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div
              aria-hidden="true"
              className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
                isStudent ? 'via-[#10B981]' : 'via-[#F59E0B]'
              } to-transparent`}
            />

            {/* Segmented Role Switcher */}
            <div
              role="tablist"
              aria-label="Select Account Role"
              className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#05070A]/80 border border-white/10"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isStudent}
                onClick={() => {
                  setRole('student');
                  setErrors({});
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
                  isStudent
                    ? 'bg-[#10B981] text-[#05070A] shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Student</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isStudent}
                onClick={() => {
                  setRole('operator');
                  setErrors({});
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
                  !isStudent
                    ? 'bg-[#F59E0B] text-[#05070A] shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bus className="w-4 h-4 shrink-0" />
                <span>Transport Operator</span>
              </button>
            </div>

            {/* Heading */}
            <div className="mt-6">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {mode === 'signin'
                  ? isStudent
                    ? 'Sign in to reserve locked seats and access your QR passes.'
                    : 'Sign in to monitor corridor shortages and dispatch buses.'
                  : isStudent
                    ? 'Set up your campus profile for hostel virtual boarding alerts.'
                    : 'Register your park fleet and Interswitch settlement account.'}
              </p>
            </div>

            {/* Mode Toggle: Sign In | Create Account */}
            <div
              role="tablist"
              aria-label="Authentication Mode"
              className="mt-5 grid grid-cols-2 border-b border-white/10"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setErrors({});
                }}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? isStudent
                      ? 'border-[#10B981] text-white'
                      : 'border-[#F59E0B] text-white'
                    : 'border-transparent text-[#94A3B8] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => {
                  setMode('signup');
                  setErrors({});
                }}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? isStudent
                      ? 'border-[#10B981] text-white'
                      : 'border-[#F59E0B] text-white'
                    : 'border-transparent text-[#94A3B8] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-full-name"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      placeholder={
                        isStudent ? 'e.g. Adebayo Toluwanimi' : 'e.g. Chief Kunle Adeyemi'
                      }
                      autoComplete="name"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors min-h-[46px] ${inputFocusClass}`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder={
                      isStudent
                        ? 'tolu.adebayo@student.lautech.edu.ng'
                        : 'dispatch@ojooexpress.ng'
                    }
                    autoComplete="email"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors min-h-[46px] ${inputFocusClass}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Minimum 6 characters"
                    autoComplete={
                      mode === 'signup' ? 'new-password' : 'current-password'
                    }
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors min-h-[46px] ${inputFocusClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className={`w-full mt-2 py-3 px-5 rounded-xl font-bold text-sm text-[#05070A] inline-flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] ${
                  isStudent
                    ? 'bg-[#10B981] hover:bg-[#059669] shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)]'
                    : 'bg-[#F59E0B] hover:bg-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)]'
                }`}
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                or
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* 1-Click Instant Demo Access */}
            <button
              type="button"
              onClick={() => onInstantDemo(role)}
              className={`w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px] ${
                isStudent
                  ? 'hover:border-emerald-500/40'
                  : 'hover:border-amber-500/40'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 shrink-0 ${
                  isStudent ? 'text-[#10B981]' : 'text-[#F59E0B]'
                }`}
              />
              <span>Instant Demo Access (1-Click)</span>
            </button>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              Preview the live{' '}
              <span className={isStudent ? 'text-emerald-300' : 'text-amber-300'}>
                {isStudent ? 'Student Booking App' : 'Operator Dispatch Portal'}
              </span>{' '}
              instantly with pre-configured demo credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
