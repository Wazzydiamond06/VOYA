import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Bus,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import {
  DEFAULT_ORIGIN,
  calculateRouteShortage,
  formatNaira,
  getDefaultTravelDate,
  getWaveCapacitySnapshot,
} from '../lib/voyaEngine';
import type { RouteData, RouteId } from '../lib/voyaTypes';
import { ThemeToggle } from './ThemeToggle';

const HERO_TERMINAL_IMAGE = '/assets/aistudio/Ojoo-Bus-Terminal-930x540_b5fba2e5.jpg';

interface LandingViewProps {
  routes: RouteData[];
  onQuickSearchBook: (params: {
    routeId: RouteId;
    travelDate: string;
    jumpToCapacity?: boolean;
  }) => void;
  onBookStudent: () => void;
  onOpenOperatorPortal: () => void;
  onNavigateSection: (sectionId: string) => void;
  onNotify: (message: string) => void;
}

const FAQ_ITEMS = [
  {
    id: 'faq-show-up',
    question: 'How do I know a bus will actually show up?',
    answer:
      'Every VOYA bus is dispatched by vetted interstate park partners and transport unions operating out of verified hubs like Ojoo Bus Terminal and Ogbomoso parks. Once your wave unlocks, you receive the vehicle plate number, bus number, and departure time directly on your QR pass before leaving your hostel.',
  },
  {
    id: 'faq-escrow-refund',
    question: "What if my bus doesn't fill up?",
    answer:
      'All student fares are protected in Interswitch IPG escrow and never released upfront to an unconfirmed vehicle. If a departure wave does not meet minimum dispatch capacity before cutoff, you can transfer to the next confirmed bus or receive an automatic 100% escrow refund.',
  },
  {
    id: 'faq-driver-payouts',
    question: 'How do drivers and transport operators get paid?',
    answer:
      'Operators use the VOYA mobile check-in scanner at the campus boarding point to verify each student’s QR pass (txn_ref). Once boarding completes, the full bus manifest flips from In Escrow to Payout Released via Interswitch settlement.',
  },
  {
    id: 'faq-virtual-queue',
    question: 'How does the hostel virtual queue work when buses are full?',
    answer:
      'Instead of hitting a dead-end "Sold Out" wall or standing for hours at the motor park, VOYA registers your travel demand in the virtual queue. Partner operators see live seat shortages across Lagos, Ibadan, Abuja, and Ilorin and inject +14 seat buses ahead of break day.',
  },
];

export function LandingView({
  routes,
  onQuickSearchBook,
  onBookStudent,
  onOpenOperatorPortal,
  onNavigateSection,
  onNotify,
}: LandingViewProps) {
  const [quickRouteId, setQuickRouteId] = useState<RouteId>('lagos');
  const [quickDate, setQuickDate] = useState<string>(getDefaultTravelDate);
  const [openFaqId, setOpenFaqId] = useState<string>('faq-show-up');

  // Interactive "Request Your Campus" inline drawer
  const [showCampusForm, setShowCampusForm] = useState(false);
  const [campusName, setCampusName] = useState('');
  const [campusContact, setCampusContact] = useState('');
  const [campusError, setCampusError] = useState<string | null>(null);
  const [campusSubmitted, setCampusSubmitted] = useState<string | null>(null);

  const handleQuickRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearchBook({
      routeId: quickRouteId,
      travelDate: quickDate,
      jumpToCapacity: true,
    });
  };

  const handleCampusRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (campusName.trim().length < 2 || campusContact.trim().length < 5) {
      setCampusError('Enter your university name and a valid email or WhatsApp contact.');
      return;
    }
    const submittedName = campusName.trim();
    setCampusError(null);
    setCampusSubmitted(submittedName);
    setCampusName('');
    setCampusContact('');
    onNotify(`Campus expansion request logged for ${submittedName}.`);
  };

  return (
    <div className="bg-[#05070A] text-white">
      {/* ================================================================= */}
      {/* 1. FULL-BLEED CENTERED HERO (Ojoo Bus Terminal Background)        */}
      {/* ================================================================= */}
      <section className="voya-hero relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#05070A]">
        {/* Full-bleed Ojoo Bus Terminal Background */}
        <img
          src={HERO_TERMINAL_IMAGE}
          alt="Aerial view of Ojoo Bus Terminal interstate transport hub in Oyo State, Nigeria"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.01]"
        />

        {/* Rich Multi-Stop Dark Gradient Overlay Melting into #05070A */}
        <div
          aria-hidden="true"
          className="voya-hero-scrim absolute inset-0 bg-gradient-to-b from-[#05070A]/80 via-[#05070A]/65 to-[#05070A]"
        />

        {/* Ambient Emerald & Amber Radial Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[380px] rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-10 right-1/4 w-[420px] h-[260px] rounded-full bg-amber-500/5 blur-3xl"
        />

        {/* Strictly Centrally Aligned Foreground Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
          {/* Centered Display H1 with Emerald-to-Amber Gradient on "Voya." */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-[68px] font-extrabold text-white leading-[1.06] tracking-[-0.03em] [text-wrap:balance]">
            Every Journey Begins With{' '}
            <span className="bg-gradient-to-r from-[#10B981] via-emerald-300 to-[#F59E0B] bg-clip-text text-transparent">
              Voya.
            </span>
          </h1>

          {/* Centered Subheadline */}
          <p className="voya-hero-subcopy mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Zero queues. Guaranteed buses. We aggregate student travel demand before
            semester breaks so transport operators deploy enough buses on time.
          </p>

          {/* Centered Glassmorphic Quick Route Search Bar */}
          <form
            onSubmit={handleQuickRouteSubmit}
            aria-label="Quick Route Search"
            className="voya-hero-search mt-10 bg-[#0B1120]/85 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2 text-left"
          >
            {/* From */}
            <div className="voya-hero-field sm:col-span-3 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <label
                htmlFor="hero-from"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                From
              </label>
              <div className="mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <input
                  id="hero-from"
                  type="text"
                  value={DEFAULT_ORIGIN}
                  readOnly
                  className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none truncate"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="voya-hero-field sm:col-span-3 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/5 focus-within:border-emerald-500/50 transition-colors">
              <label
                htmlFor="hero-destination"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Destination
              </label>
              <select
                id="hero-destination"
                value={quickRouteId}
                onChange={(e) => setQuickRouteId(e.target.value as RouteId)}
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer [&>option]:bg-[#0B1120] [&>option]:text-white"
              >
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.destination}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date */}
            <div className="voya-hero-field sm:col-span-3 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/5 focus-within:border-emerald-500/50 transition-colors">
              <label
                htmlFor="hero-date"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Date
              </label>
              <input
                id="hero-date"
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                required
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-white tabular-nums focus:outline-none"
              />
            </div>

            {/* Emerald CTA */}
            <div className="sm:col-span-3 flex">
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm transition-all cursor-pointer whitespace-nowrap min-h-[48px] flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)]"
              >
                Find Available Buses
              </button>
            </div>
          </form>

          {/* Secondary Operator Link right below */}
          <div className="voya-hero-subcopy mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-300">
            <span>Are you a transport operator?</span>
            <button
              type="button"
              onClick={onOpenOperatorPortal}
              className="voya-hero-operator-link inline-flex items-center gap-1.5 font-semibold text-[#10B981] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Open Operator Portal
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. TRUST STRIP (Subtle Monochrome Dark Bar)                       */}
      {/* ================================================================= */}
      <section
        aria-label="Platform Trust and Security Guarantees"
        className="bg-[#0A0F18]/85 border-y border-white/5 py-5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-300 shrink-0" />
              <span>Interswitch IPG Live Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-300 shrink-0" />
              <span>Escrow-Protected Fares</span>
            </div>
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-slate-300 shrink-0" />
              <span>Verified Park Partners</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
              <span>Zero Touting</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. LIVE CORRIDOR DEMAND BOARD (Dark Interactive Glass Cards/Table)*/}
      {/* ================================================================= */}
      <section
        id="routes"
        aria-labelledby="corridor-board-heading"
        className="relative bg-[#05070A] py-20 sm:py-24 scroll-mt-16 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/4 w-[520px] h-[320px] rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                Live Corridor Demand Board
              </p>
              <h2
                id="corridor-board-heading"
                className="mt-2 font-heading text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em]"
              >
                Real-Time Demand From LAUTECH, Ogbomoso
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-[42ch]">
                Live requests, confirmed seats, and shortage alerts synced directly with the
                Student App and Operator Dispatch Portal.
              </p>
              <ThemeToggle variant="segmented" className="self-start sm:self-auto" />
            </div>
          </div>

          {/* Desktop Dark Glass Interactive Table */}
          <div className="hidden md:block rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  <th className="py-4 px-6">Route</th>
                  <th className="py-4 px-4 text-right">Requests</th>
                  <th className="py-4 px-4 text-right">Confirmed Seats</th>
                  <th className="py-4 px-4">Shortage Status</th>
                  <th className="py-4 px-4 text-right">Locked Fare</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {routes.map((route) => {
                  const shortage = calculateRouteShortage(route);
                  const snap = getWaveCapacitySnapshot(route);
                  return (
                    <tr
                      key={route.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-semibold text-white">
                          Ogbomoso → {route.destination}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {route.terminal} · {route.durationHours}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-white tabular-nums">
                        {route.requests}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-slate-300 tabular-nums">
                        {route.confirmedSeats} / {route.availableSeats}
                      </td>
                      <td className="py-4 px-4">
                        {shortage > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/15 border border-red-500/35 px-3 py-1 rounded-full tabular-nums shadow-[0_0_16px_rgba(239,68,68,0.18)]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            +{shortage} Seat Shortage
                          </span>
                        ) : snap.hasSeatsAvailable ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full tabular-nums">
                            <span
                              aria-hidden="true"
                              className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
                            />
                            {snap.seatsRemainingTotal}{' '}
                            {snap.seatsRemainingTotal === 1 ? 'Seat' : 'Seats'} Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            Virtual Queue Open
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-white tabular-nums">
                        {formatNaira(route.fare)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onQuickSearchBook({
                              routeId: route.id,
                              travelDate: quickDate,
                              jumpToCapacity: true,
                            })
                          }
                          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
                            snap.hasSeatsAvailable
                              ? 'bg-[#10B981] hover:bg-[#059669] text-[#05070A] shadow-[0_0_18px_rgba(16,185,129,0.25)]'
                              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35'
                          }`}
                        >
                          {snap.hasSeatsAvailable ? 'Lock Seat' : 'Join Queue'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Dark Interactive Cards */}
          <div className="md:hidden space-y-4">
            {routes.map((route) => {
              const shortage = calculateRouteShortage(route);
              const snap = getWaveCapacitySnapshot(route);
              return (
                <article key={route.id} className="framer-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-base font-bold text-white">
                        Ogbomoso → {route.destination}
                      </p>
                      <p className="text-xs text-[#94A3B8]">{route.terminal}</p>
                    </div>
                    <span className="font-bold text-white tabular-nums">
                      {formatNaira(route.fare)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-xs tabular-nums">
                    <div>
                      <p className="text-[#94A3B8]">Requests</p>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {route.requests}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8]">Confirmed</p>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {route.confirmedSeats}/{route.availableSeats}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8]">Shortage</p>
                      <p
                        className={`mt-0.5 text-sm font-bold ${
                          shortage > 0 ? 'text-red-400' : 'text-[#10B981]'
                        }`}
                      >
                        {shortage > 0 ? `+${shortage}` : '0'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onQuickSearchBook({
                        routeId: route.id,
                        travelDate: quickDate,
                        jumpToCapacity: true,
                      })
                    }
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
                      snap.hasSeatsAvailable
                        ? 'bg-[#10B981] hover:bg-[#059669] text-[#05070A]'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35'
                    }`}
                  >
                    {snap.hasSeatsAvailable ? 'Lock Seat' : 'Join Queue'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. BEFORE VS. AFTER (2-Column Dark Bento on Rich Charcoal)        */}
      {/* ================================================================= */}
      <section
        aria-labelledby="comparison-heading"
        className="relative bg-[#0A0F18] border-y border-white/5 py-20 sm:py-24 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-1/4 w-[480px] h-[300px] rounded-full bg-amber-500/5 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              System Upgrade
            </p>
            <h2
              id="comparison-heading"
              className="mt-2 font-heading text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em]"
            >
              The Old Motor Park vs. The VOYA Standard
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* The Old Motor Park (Muted dark red-tinted border) */}
            <div className="p-7 sm:p-9 rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-red-500/25 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/45 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-xs font-semibold text-red-400">
                  The Old Motor Park
                </span>
                <h3 className="mt-4 font-heading text-2xl font-bold text-white">
                  Unpredictable Park Chaos
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8] max-w-[52ch]">
                  Every semester break forces students into roadside queues with zero
                  certainty on fares or when the next vehicle will load.
                </p>

                <ul className="mt-7 space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">4-hour sun queues</strong> waiting
                      outside Under-G hoping interstate vehicles arrive.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Sudden 100% surge hikes</strong>{' '}
                      imposed at the park gate once break rush peaks.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Cash disputes & touting</strong> with
                      no verified manifest or refund guarantee.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Blind fleet dispatch</strong> leaving
                      operators guessing where student demand is surging.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* The VOYA Standard (Emerald-tinted glowing border) */}
            <div className="p-7 sm:p-9 rounded-2xl bg-[#0D131F]/90 backdrop-blur-md border border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-[0_0_40px_rgba(16,185,129,0.18)] flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-xs font-semibold text-emerald-400">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
                  />
                  The VOYA Standard
                </span>
                <h3 className="mt-4 font-heading text-2xl font-bold text-white">
                  Synchronized Campus Mobility
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8] max-w-[52ch]">
                  Demand-led dispatch paired with verified terminal partners and
                  Interswitch IPG escrow rails.
                </p>

                <ul className="mt-7 space-y-4 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Hostel virtual queues</strong> — stay
                      in your room until boarding begins in 45 minutes.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Locked upfront fares</strong> with
                      zero last-minute park hikes once reserved.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Interswitch IPG escrow</strong>{' '}
                      protecting students with instant automated refunds if waves cancel.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">QR boarding verification</strong> at
                      modern partner hubs like Ojoo Bus Terminal.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. HOW IT WORKS (3-Column Interactive Dark Cards)                 */}
      {/* ================================================================= */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="relative bg-[#05070A] py-20 sm:py-24 scroll-mt-16 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[280px] rounded-full bg-emerald-500/8 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
                How VOYA Works
              </p>
              <h2
                id="how-it-works-heading"
                className="mt-2 font-heading text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em]"
              >
                From Travel Demand to QR Boarding in 3 Steps
              </h2>
            </div>
            <button
              type="button"
              onClick={onBookStudent}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#10B981] hover:text-emerald-300 transition-colors cursor-pointer self-start md:self-auto"
            >
              Reserve Your Next Trip
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <article className="framer-card relative overflow-hidden p-6 flex flex-col justify-between gap-6">
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] via-emerald-400/40 to-transparent"
              />
              <div>
                <span className="font-mono-tabular text-xs font-bold text-[#10B981]">
                  01
                </span>
                <h3 className="mt-3 font-heading text-xl font-bold text-white">
                  Register Demand
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                  Select your corridor and wave (7:00 AM, 9:00 AM, 11:00 AM). If active
                  seats are filled, join the virtual queue instead of waiting at the park.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#05070A]/80 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span>Wave Selector</span>
                  <span className="font-semibold text-white">LAUTECH → Lagos</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 tabular-nums">
                  <span className="py-1 text-center rounded-lg bg-[#10B981] text-[#05070A] font-bold">
                    7:00 AM
                  </span>
                  <span className="py-1 text-center rounded-lg bg-white/5 text-slate-300">
                    9:00 AM
                  </span>
                  <span className="py-1 text-center rounded-lg bg-white/5 text-slate-300">
                    11:00 AM
                  </span>
                </div>
              </div>
            </article>

            {/* Step 02 */}
            <article className="framer-card relative overflow-hidden p-6 flex flex-col justify-between gap-6">
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F59E0B] via-amber-400/40 to-transparent"
              />
              <div>
                <span className="font-mono-tabular text-xs font-bold text-[#F59E0B]">
                  02
                </span>
                <h3 className="mt-3 font-heading text-xl font-bold text-white">
                  Auto-Dispatch Buses
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                  Real-time seat shortages alert verified transport operators to inject
                  +14 seat vehicles ahead of semester break surges.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#05070A]/80 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-400 tabular-nums">
                    +14 Shortage Alert
                  </span>
                  <span className="font-semibold text-[#10B981]">Bus #3 Deployed</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-[#10B981] to-[#F59E0B] rounded-full" />
                </div>
                <p className="text-[11px] text-[#94A3B8] font-mono-tabular">
                  Plate: OYO-482-LA · +14 seats unlocked
                </p>
              </div>
            </article>

            {/* Step 03 */}
            <article className="framer-card relative overflow-hidden p-6 flex flex-col justify-between gap-6">
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] via-emerald-300/60 to-[#F59E0B]"
              />
              <div>
                <span className="font-mono-tabular text-xs font-bold text-[#10B981]">
                  03
                </span>
                <h3 className="mt-3 font-heading text-xl font-bold text-white">
                  Pay via Interswitch & Board with QR
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                  Lock your fare safely via Interswitch IPG escrow and receive a digital
                  QR pass. Scan at the boarding point for instant verification.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#05070A]/80 border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-white">QR Pass Active</p>
                  <p className="font-mono-tabular text-[11px] text-[#94A3B8]">
                    VOYA-TRN-849201 · Seat #14
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#10B981] shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. TWO-SIDED PLATFORM SPLIT (Emerald vs. Amber Hover Glow Bento)  */}
      {/* ================================================================= */}
      <section
        id="for-operators"
        aria-labelledby="two-sided-heading"
        className="relative bg-[#0A0F18] border-y border-white/5 py-20 sm:py-24 scroll-mt-16 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 w-[440px] h-[340px] rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-[440px] h-[340px] rounded-full bg-amber-500/8 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
              Two-Sided Platform
            </p>
            <h2
              id="two-sided-heading"
              className="mt-2 font-heading text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em]"
            >
              Built for Students and Transport Operators
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Bento Card: For Students (Emerald Hover Glow) */}
            <div className="framer-card p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
                  For Students
                </span>
                <h3 className="mt-4 font-heading text-2xl sm:text-3xl font-bold text-white">
                  Wait in your hostel, board on time
                </h3>
                <p className="mt-3 text-sm sm:text-base text-[#94A3B8] max-w-[50ch]">
                  Skip Under-G motor-park stress with transparent locked fares and live
                  wave tracking.
                </p>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Hostel Virtual Queue
                      </p>
                      <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                        Register travel demand in seconds and track your live queue
                        position.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">Locked Fares</p>
                      <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                        Zero semester-break surge hikes once your seat is confirmed.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Escrow Protection
                      </p>
                      <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                        Interswitch IPG holds fares securely until QR boarding verification.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onBookStudent}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm transition-all cursor-pointer min-h-[44px] shadow-[0_0_20px_rgba(16,185,129,0.28)]"
                >
                  Book as a Student
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Bento Card: For Transport Operators & Unions (Amber/Gold Hover Glow) */}
            <div className="framer-card-amber p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400">
                  For Transport Operators & Unions
                </span>
                <h3 className="mt-4 font-heading text-2xl sm:text-3xl font-bold text-white">
                  Guaranteed full manifests, instant settlement
                </h3>
                <p className="mt-3 text-sm sm:text-base text-[#94A3B8] max-w-[50ch]">
                  Deploy 14-seat vehicles strictly where verified campus demand exists
                  with zero idle park loading.
                </p>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Real-Time Shortage Alerts
                      </p>
                      <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                        See live passenger shortages across Lagos, Ibadan, Abuja, and
                        Ilorin before dispatching.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Bus className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Zero Idle Loading Time
                      </p>
                      <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                        Fill 14/14 seats digitally before your vehicle arrives at LAUTECH
                        gate.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Instant Interswitch Payouts
                      </p>
                      <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                        Scan student QR passes on mobile check-in to release escrowed bus
                        revenue immediately.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onOpenOperatorPortal}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#05070A] font-bold text-sm transition-all cursor-pointer min-h-[44px] shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  Deploy a Bus
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. EXPANSION ROADMAP (3-Phase Campus Rollout)                     */}
      {/* ================================================================= */}
      <section aria-labelledby="roadmap-heading" className="bg-[#05070A] py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Built to Scale
              </p>
              <h2
                id="roadmap-heading"
                className="mt-2 font-heading text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em]"
              >
                Campus Expansion Roadmap
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#94A3B8] max-w-[54ch]">
                Starting with LAUTECH and expanding across Nigeria&apos;s highest-density
                residential universities.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCampusForm((prev) => !prev);
                setCampusError(null);
              }}
              aria-expanded={showCampusForm}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-semibold text-white transition-colors cursor-pointer self-start md:self-auto min-h-[44px]"
            >
              <Building2 className="w-4 h-4 text-[#10B981]" />
              Request Your Campus
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="framer-card p-6 border-emerald-500/35">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="text-[#10B981]">Phase 1 · Live Pilot</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-[#10B981]"
                  />
                  Active Now
                </span>
              </div>
              <h3 className="mt-3 font-heading text-xl font-bold text-white">
                LAUTECH (Ogbomoso)
              </h3>
              <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                Demand aggregation, Interswitch IPG escrow checkout, and verified partner
                dispatch across Lagos, Ibadan, Abuja, and Ilorin corridors.
              </p>
            </div>

            <div className="framer-card p-6">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#94A3B8]">
                <span>Phase 2 · Next Rollout</span>
                <span className="tabular-nums text-amber-400">4 Campuses</span>
              </div>
              <h3 className="mt-3 font-heading text-xl font-bold text-white">
                OAU, UI, UNILORIN, EKSU
              </h3>
              <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                Expanding the South-West and North-Central corridor matrix with shared
                interstate fleet routing and union terminal integrations.
              </p>
            </div>

            <div className="framer-card p-6">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#94A3B8]">
                <span>Phase 3 · Scale</span>
                <span>Continental</span>
              </div>
              <h3 className="mt-3 font-heading text-xl font-bold text-white">
                Pan-African Network
              </h3>
              <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                Standardized demand-led intercity mobility, fleet telemetry, and automated
                escrow settlement for university corridors across Africa.
              </p>
            </div>
          </div>

          {showCampusForm && (
            <div className="mt-6 p-6 rounded-2xl bg-[#0D131F]/90 backdrop-blur-md border border-white/10">
              {campusSubmitted ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                    <p className="text-sm font-medium text-white">
                      Logged <strong>{campusSubmitted}</strong> for Phase 2 campus
                      corridor onboarding.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCampusSubmitted(null)}
                    className="text-xs font-semibold text-[#10B981] hover:underline cursor-pointer"
                  >
                    Nominate another
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleCampusRequestSubmit}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                  noValidate
                >
                  <div className="md:col-span-5">
                    <label
                      htmlFor="campus-name-input"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      University / Campus Name
                    </label>
                    <input
                      id="campus-name-input"
                      type="text"
                      value={campusName}
                      onChange={(e) => {
                        setCampusName(e.target.value);
                        setCampusError(null);
                      }}
                      placeholder="e.g. Obafemi Awolowo University (OAU)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#05070A] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 min-h-[44px]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label
                      htmlFor="campus-contact-input"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Student Union Email or WhatsApp
                    </label>
                    <input
                      id="campus-contact-input"
                      type="text"
                      value={campusContact}
                      onChange={(e) => {
                        setCampusContact(e.target.value);
                        setCampusError(null);
                      }}
                      placeholder="e.g. transport@oau.edu.ng"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#05070A] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 min-h-[44px]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm transition-colors cursor-pointer min-h-[44px]"
                    >
                      Submit Request
                    </button>
                  </div>
                  {campusError && (
                    <p
                      className="md:col-span-12 text-xs text-red-400 font-medium"
                      role="alert"
                    >
                      {campusError}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. FAQ ACCORDION (Rich Charcoal Dark Accordion)                   */}
      {/* ================================================================= */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="bg-[#0A0F18] border-t border-white/5 py-20 sm:py-24 scroll-mt-16"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
              Trust & Operations FAQ
            </p>
            <h2
              id="faq-heading"
              className="mt-2 font-heading text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em]"
            >
              Common Questions
            </h2>
          </div>

          <div className="divide-y divide-white/10 rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 overflow-hidden">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${item.id}-panel`}
                    onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <span className="font-heading text-base font-semibold text-white">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#94A3B8] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#10B981]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={`${item.id}-panel`}
                      className="px-6 pb-5 text-sm text-[#94A3B8] leading-relaxed"
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 9. CLOSING GLOW CTA CARD + MINIMAL 4-COLUMN DARK FOOTER           */}
      {/* ================================================================= */}
      <section className="relative bg-[#05070A] pt-20 pb-14 border-t border-white/5 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[620px] h-[280px] rounded-full bg-emerald-500/12 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          {/* Centered Emerald-Glow Closing CTA Card */}
          <div className="relative rounded-2xl bg-[#0D131F]/85 backdrop-blur-xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.12)] px-6 py-12 sm:px-12 sm:py-16 text-center overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent"
            />
            <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
              LAUTECH Semester Break Dispatch
            </p>
            <h2 className="mt-3 font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-[-0.03em] [text-wrap:balance] max-w-2xl mx-auto">
              Skip the park chaos this semester break.
            </h2>
            <p className="mt-4 text-base text-[#94A3B8] max-w-xl mx-auto">
              Reserve your locked seat ahead of departure day or connect your fleet to
              real-time LAUTECH corridor demand.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={onBookStudent}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm transition-all cursor-pointer min-h-[48px] shadow-[0_0_26px_rgba(16,185,129,0.35)]"
              >
                Reserve Your Seat Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenOperatorPortal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 font-semibold text-sm transition-colors cursor-pointer min-h-[48px]"
              >
                Register as an Operator
              </button>
            </div>
          </div>

          {/* Minimal 4-Column Dark Footer */}
          <footer className="mt-16 pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="inline-flex items-center gap-1.5">
                <span className="font-heading text-lg font-extrabold tracking-tight text-white">
                  VOYA
                </span>
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-[#10B981]"
                />
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed max-w-[28ch]">
                Smart campus interstate travel demand and capacity management piloting at{' '}
                {DEFAULT_ORIGIN}.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Secured by Interswitch IPG</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Product
              </p>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('routes')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Live Route Demand
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onBookStudent}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Student Booking App
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenOperatorPortal}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Operator Dispatch Portal
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Company
              </p>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('how-it-works')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('for-operators')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Park & Union Partners
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('faq')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Escrow & FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact
              </p>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li>LAUTECH Pilot Desk, Ogbomoso</li>
                <li>Oyo State, Nigeria</li>
                <li>support@voya.ng</li>
              </ul>
            </div>
          </footer>

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} VOYA Mobility Technologies. All rights reserved.</p>
            <p>Every journey begins with Voya.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
