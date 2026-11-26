import { LogOut } from 'lucide-react';
import type { AuthUser } from '../lib/authTypes';
import type { AppSection } from '../lib/voyaTypes';
import { ThemeToggle } from './ThemeToggle';

interface TopNavProps {
  activeSection: AppSection;
  user: AuthUser | null;
  onNavigate: (section: AppSection) => void;
  onNavigateHomeSection: (sectionId: string) => void;
  onBookSeat: () => void;
  onOpenOperator: () => void;
  onOpenDashboard: () => void;
  onSignOut: () => void;
}

export function TopNav({
  activeSection,
  user,
  onNavigate,
  onNavigateHomeSection,
  onBookSeat,
  onOpenOperator,
  onOpenDashboard,
  onSignOut,
}: TopNavProps) {
  const homeLinks = [
    { id: 'routes', label: 'Routes' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'for-operators', label: 'For Operators' },
    { id: 'faq', label: 'FAQ' },
  ];

  const isStudent = user?.role === 'student';

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#05070A]/75 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-8">
        {/* Left: VOYA bold white wordmark with emerald accent dot */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400 rounded-md px-1"
          aria-label="VOYA Home"
        >
          <span className="font-heading text-xl font-extrabold tracking-tight text-white">
            VOYA
          </span>
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.9)]"
          />
        </button>

        {/* Center: Clean single-line links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#94A3B8]"
        >
          {homeLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigateHomeSection(link.id)}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: Theme Toggle + Authenticated User Pill OR Guest CTAs */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <ThemeToggle variant="compact" />
          {user ? (
            <>
              {activeSection !== 'home' && (
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hidden md:inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                >
                  Home
                </button>
              )}

              <div
                aria-label="Authenticated User Menu"
                className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-3 pr-1 sm:pr-1.5 py-1 rounded-full bg-[#0D131F]/85 backdrop-blur-md border border-white/10 shadow-lg min-w-0 max-w-full"
              >
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  title={
                    isStudent ? 'Open Student App' : 'Open Operator Portal'
                  }
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-left cursor-pointer rounded-full py-1 px-0.5 sm:px-1 hover:bg-white/5 transition-colors min-w-0"
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isStudent
                        ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.85)]'
                        : 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.85)]'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[74px] sm:max-w-[150px]">
                    {user.fullName}
                  </span>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wide shrink-0 border ${
                      isStudent
                        ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/30'
                        : 'bg-amber-500/15 text-[#F59E0B] border-amber-500/30'
                    }`}
                  >
                    {isStudent ? 'Student' : 'Operator'}
                  </span>
                </button>

                <span aria-hidden="true" className="h-4 w-px bg-white/10 shrink-0" />

                <button
                  type="button"
                  onClick={onSignOut}
                  aria-label="Sign Out"
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 min-h-[32px]"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {activeSection !== 'home' && (
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                >
                  Home
                </button>
              )}
              <button
                type="button"
                onClick={onOpenOperator}
                aria-current={activeSection === 'operator' ? 'page' : undefined}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                  activeSection === 'operator'
                    ? 'bg-white/15 text-white border-amber-400/50 shadow-[0_0_18px_rgba(245,158,11,0.18)]'
                    : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10 hover:text-white hover:border-white/25'
                }`}
              >
                Operator Portal
              </button>
              <button
                type="button"
                onClick={onBookSeat}
                aria-current={activeSection === 'student' ? 'page' : undefined}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                  activeSection === 'student'
                    ? 'bg-[#10B981] text-[#05070A] ring-2 ring-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.45)]'
                    : 'bg-[#10B981] hover:bg-[#059669] text-[#05070A] shadow-[0_0_22px_rgba(16,185,129,0.32)] hover:shadow-[0_0_28px_rgba(16,185,129,0.48)]'
                }`}
              >
                Book a Seat
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
