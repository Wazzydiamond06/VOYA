import { useEffect, useState } from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { routeIdToDestinationLabel } from '../lib/authEngine';
import type { PendingBookingIntent, UserRole } from '../lib/authTypes';
import { DEFAULT_ORIGIN } from '../lib/voyaEngine';

export interface BusShowcaseSlide {
  src: string;
  alt: string;
  label: string;
}

export const BUS_SHOWCASE_SLIDES: BusShowcaseSlide[] = [
  {
    src: '/assets/aistudio/images__9__1c431c15.jpg',
    alt: 'Modern blue and white Nigerian interstate passenger coach parked at terminal',
    label: 'Interstate Fleet',
  },
  {
    src: '/assets/aistudio/images__8__5cc17f0d.jpg',
    alt: 'Commercial Nigerian interstate buses loading passengers at motor park',
    label: 'Campus Corridors',
  },
  {
    src: '/assets/aistudio/images__7__a23c8f88.jpg',
    alt: 'Verified white Toyota Coaster interstate shuttle bus on expressway',
    label: 'Verified Dispatch',
  },
];

interface SlideCopy {
  title: string;
  subtitle: string;
}

function getSlideCopy(role: UserRole, slideIndex: number): SlideCopy {
  if (role === 'student') {
    if (slideIndex === 1) {
      return {
        title: 'Skip the 4-hour park queue',
        subtitle:
          'Get WhatsApp alerts 20 mins before your bus loads at LAUTECH.',
      };
    }
    if (slideIndex === 2) {
      return {
        title: 'Locked fares. Zero touting.',
        subtitle: 'Every seat is escrow-protected via Interswitch IPG.',
      };
    }
    return {
      title: 'Every journey begins with Voya.',
      subtitle:
        'Skip 4-hour park queues with hostel virtual boarding and locked semester-break fares.',
    };
  }

  if (slideIndex === 1) {
    return {
      title: 'Fill 14 seats before you arrive',
      subtitle: 'See live student shortages across Ogbomoso corridors.',
    };
  }
  if (slideIndex === 2) {
    return {
      title: 'Instant verified payouts',
      subtitle:
        'Scan student QR passes at boarding to release funds directly to your bank.',
    };
  }
  return {
    title: 'Every journey begins with Voya.',
    subtitle:
      'Guaranteed 14-seat manifests and automated Interswitch payouts across LAUTECH corridors.',
  };
}

interface BusShowcasePanelProps {
  role: UserRole;
  defaultSlideIndex: 0 | 1 | 2;
  pendingBooking?: PendingBookingIntent | null;
}

export function BusShowcasePanel({
  role,
  defaultSlideIndex,
  pendingBooking,
}: BusShowcasePanelProps) {
  const [activeSlide, setActiveSlide] = useState<number>(defaultSlideIndex);

  useEffect(() => {
    setActiveSlide(defaultSlideIndex);
  }, [defaultSlideIndex]);

  const isStudent = role === 'student';
  const copy = getSlideCopy(role, activeSlide);
  const savedDestination = routeIdToDestinationLabel(pendingBooking?.routeId);

  return (
    <aside
      aria-label="VOYA Interstate Fleet Showcase"
      className="voya-bus-showcase hidden md:flex flex-col justify-between relative overflow-hidden rounded-3xl m-4 border border-white/10 min-h-[600px] bg-[#05070A] select-none"
    >
      {/* Full-Bleed Crossfading Bus Photography Layers */}
      {BUS_SHOWCASE_SLIDES.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out ${
            activeSlide === index ? 'opacity-100 scale-[1.01]' : 'opacity-0'
          }`}
        />
      ))}

      {/* Moody Dark Gradient Scrim & Color Grading */}
      <div
        aria-hidden="true"
        className="voya-bus-scrim absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-[#05070A]/30"
      />

      {/* Subtle Role-Aware Atmospheric Tint */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl transition-colors duration-500 ${
          isStudent ? 'bg-emerald-500/20' : 'bg-amber-500/20'
        }`}
      />

      {/* Top-Left Overlay: VOYA Wordmark + Glass Role Pill */}
      <div className="relative z-10 p-6 lg:p-8 flex flex-col items-start gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#05070A]/65 backdrop-blur-md border border-white/15">
            <span className="voya-showcase-text-white font-heading text-lg font-extrabold tracking-tight text-white">
              VOYA
            </span>
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full transition-colors ${
                isStudent
                  ? 'bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.9)]'
                  : 'bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.9)]'
              }`}
            />
          </div>

          <div className="voya-showcase-glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D131F]/75 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full shrink-0 ${
                isStudent ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
              }`}
            />
            <span>{isStudent ? 'Student Corridor' : 'Operator Network'}</span>
          </div>
        </div>

        {/* Preserved Route Pill if Student came from Landing Quick Search */}
        {isStudent && pendingBooking && savedDestination && (
          <div className="voya-showcase-glass-pill inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0D131F]/80 backdrop-blur-md border border-emerald-500/35 text-xs text-white shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span className="font-semibold">
              Selected Route Saved: {DEFAULT_ORIGIN} → {savedDestination}
            </span>
            <span className="tabular-nums text-emerald-300 font-medium">
              · {pendingBooking.travelDate}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Floating Glassmorphic Card + Interactive 3-Bar Progress Switcher */}
      <div className="relative z-10 p-6 lg:p-8 space-y-4">
        <div className="voya-showcase-card rounded-2xl bg-[#0D131F]/80 backdrop-blur-xl border border-white/15 p-5 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider">
            <span
              className={
                isStudent
                  ? 'voya-showcase-emerald text-[#10B981]'
                  : 'voya-showcase-amber text-[#F59E0B]'
              }
            >
              {BUS_SHOWCASE_SLIDES[activeSlide].label} · LAUTECH Pilot
            </span>
            <span className="voya-showcase-muted text-slate-300 tabular-nums">
              0{activeSlide + 1} / 03
            </span>
          </div>

          <h2 className="voya-showcase-text-white font-heading text-xl lg:text-2xl font-extrabold text-white tracking-[-0.02em] leading-snug">
            {copy.title}
          </h2>
          <p className="voya-showcase-muted text-sm text-slate-200 leading-relaxed">
            {copy.subtitle}
          </p>

          <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-300 voya-showcase-muted">
            <ShieldCheck
              className={`w-3.5 h-3.5 shrink-0 ${
                isStudent
                  ? 'voya-showcase-emerald text-[#10B981]'
                  : 'voya-showcase-amber text-[#F59E0B]'
              }`}
            />
            <span>Secured by Interswitch IPG · Verified Interstate Fleet</span>
          </div>
        </div>

        {/* 3 Interactive Horizontal Progress Bars */}
        <div
          role="group"
          aria-label="Bus Showcase Slides"
          className="grid grid-cols-3 gap-2.5"
        >
          {BUS_SHOWCASE_SLIDES.map((slide, index) => {
            const isActive = activeSlide === index;
            return (
              <button
                key={slide.src}
                type="button"
                aria-label={`Show ${slide.label} preview`}
                aria-pressed={isActive}
                onClick={() => setActiveSlide(index)}
                className="group py-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400 rounded-md"
              >
                <span
                  className={`block h-1.5 w-full rounded-full transition-all duration-300 ${
                    isActive
                      ? isStudent
                        ? 'bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.75)]'
                        : 'bg-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.75)]'
                      : 'bg-white/25 group-hover:bg-white/50'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

interface MobileBusBannerProps {
  role: UserRole;
  slideIndex: 0 | 1 | 2;
}

export function MobileBusBanner({ role, slideIndex }: MobileBusBannerProps) {
  const isStudent = role === 'student';
  const slide = BUS_SHOWCASE_SLIDES[slideIndex];
  const copy = getSlideCopy(role, slideIndex);

  return (
    <div className="voya-bus-showcase md:hidden relative h-40 w-full rounded-2xl overflow-hidden border border-white/10 mb-5 bg-[#05070A]">
      <img
        src={slide.src}
        alt={slide.alt}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="voya-bus-scrim absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/55 to-[#05070A]/25"
      />
      <div className="relative z-10 h-full p-4 flex flex-col justify-between">
        <div className="voya-showcase-glass-pill self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D131F]/80 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white">
          <span
            aria-hidden="true"
            className={`w-2 h-2 rounded-full ${
              isStudent ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
            }`}
          />
          <span>{isStudent ? 'Student Corridor' : 'Operator Network'}</span>
        </div>
        <div>
          <p className="voya-showcase-text-white font-heading text-base font-bold text-white leading-snug">
            {copy.title}
          </p>
          <p className="voya-showcase-muted text-xs text-slate-200 line-clamp-1 mt-0.5">
            {copy.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
