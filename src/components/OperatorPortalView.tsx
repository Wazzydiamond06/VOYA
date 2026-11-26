import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  STANDARD_BUS_CAPACITY,
  calculateDashboardKpis,
  calculateRouteShortage,
  findBusById,
  findTicketByRef,
  formatNaira,
  getHighestShortageRoute,
} from '../lib/voyaEngine';
import type { DepartureWave, OperatorTab, RouteData, VoyaState } from '../lib/voyaTypes';
import { DeployBusModal } from './DeployBusModal';
import { ThemeToggle } from './ThemeToggle';

interface OperatorPortalViewProps {
  state: VoyaState;
  initialTab: OperatorTab;
  prefilledTxnRef: string;
  onDeployBus: (payload: {
    routeId: RouteData['id'];
    plateNumber: string;
    lockedFare: number;
    wave: DepartureWave;
  }) => void;
  onMarkBoarded: (txnRef: string) => boolean;
  onToggleBusSettlement: (busId: string) => void;
}

export function OperatorPortalView({
  state,
  initialTab,
  prefilledTxnRef,
  onDeployBus,
  onMarkBoarded,
  onToggleBusSettlement,
}: OperatorPortalViewProps) {
  const [activeTab, setActiveTab] = useState<OperatorTab>(initialTab);
  const [deployModalRoute, setDeployModalRoute] = useState<RouteData | null>(null);

  // Tab 2 — Mobile Boarding Check-In states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanInput, setScanInput] = useState(prefilledTxnRef || '');
  const [verifiedRef, setVerifiedRef] = useState<string>(prefilledTxnRef || '');
  const [scanError, setScanError] = useState<string | null>(null);
  const [flashNonce, setFlashNonce] = useState(0);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (prefilledTxnRef) {
      setScanInput(prefilledTxnRef);
      setVerifiedRef(prefilledTxnRef);
      setScanError(null);
    }
  }, [prefilledTxnRef]);

  const kpis = calculateDashboardKpis(state.routes);
  const topShortage = getHighestShortageRoute(state.routes);
  const verifiedTicket = verifiedRef ? findTicketByRef(state, verifiedRef) : undefined;
  const verifiedBus = verifiedTicket ? findBusById(state, verifiedTicket.busId) : undefined;

  const verifyAndBoardTicket = (rawRef: string) => {
    const cleaned = rawRef.trim().toUpperCase();
    if (!cleaned) {
      setScanError(
        'Enter a valid VOYA transaction reference (e.g. VOYA-TRN-849201).'
      );
      setVerifiedRef('');
      return;
    }

    const found = findTicketByRef(state, cleaned);
    if (!found) {
      setScanError(
        `No passenger pass found for "${cleaned}". Check manifest reference and retry.`
      );
      setVerifiedRef('');
      return;
    }

    setScanError(null);
    setScanInput(found.txnRef);
    setVerifiedRef(found.txnRef);
    setIsScannerOpen(false);

    // Mark ticket Boarded + automatically release bus escrow payout with timestamp
    const verified = onMarkBoarded(found.txnRef);
    if (verified) {
      setFlashNonce((n) => n + 1);
    }
  };

  const handleManualLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAndBoardTicket(scanInput);
  };

  return (
    <div className="relative bg-[#05070A] min-h-[calc(100vh-4rem)] overflow-x-hidden pb-14">
      {/* Subtle Ambient Amber Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 w-[540px] h-[300px] rounded-full bg-amber-500/10 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-6">
        {/* Portal Header & Operator Amber Tab Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
              Fleet Operations · LAUTECH Dispatch &amp; Escrow
            </p>
            <h1 className="mt-1 font-heading text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-white">
              Operator Portal
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <div
              className="inline-flex items-center gap-1 p-1 bg-[#0D131F]/80 backdrop-blur-md border border-white/10 rounded-xl"
              role="tablist"
              aria-label="Operator Portal views"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[40px] ${
                  activeTab === 'dashboard'
                    ? 'bg-[#F59E0B] text-[#05070A] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Capacity &amp; Shortage
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'boarding'}
                onClick={() => setActiveTab('boarding')}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[40px] ${
                  activeTab === 'boarding'
                    ? 'bg-[#F59E0B] text-[#05070A] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Mobile Check-In
              </button>
            </div>
            <ThemeToggle variant="segmented" />
          </div>
        </div>

        {/* ================================================================= */}
        {/* TOP PRIORITY OPPORTUNITY BANNER                                   */}
        {/* ================================================================= */}
        {topShortage ? (
          <div
            role="region"
            aria-label="Priority dispatch opportunity"
            className="rounded-2xl bg-amber-500/10 backdrop-blur-md border border-amber-500/40 shadow-[0_0_32px_rgba(245,158,11,0.16)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                  Top Priority Opportunity · Live Queue Demand
                </p>
                <h2 className="mt-0.5 font-heading text-base sm:text-lg font-bold text-white">
                  {topShortage.route.destination} Corridor:{' '}
                  <span className="font-mono-tabular text-[#F59E0B]">
                    {topShortage.shortage}-Seat Shortage
                  </span>{' '}
                  —{' '}
                  <span className="font-mono-tabular">
                    {topShortage.busesNeeded}{' '}
                    {topShortage.busesNeeded === 1 ? 'Full Bus' : 'Full Buses'}
                  </span>{' '}
                  Ready to Dispatch
                </h2>
                <p className="mt-0.5 text-xs text-slate-300 font-mono-tabular">
                  Locked Fare {formatNaira(topShortage.route.fare)} · Est.
                  Manifest Revenue{' '}
                  {formatNaira(
                    Math.min(topShortage.shortage, STANDARD_BUS_CAPACITY) *
                      topShortage.route.fare
                  )}{' '}
                  per +14 bus
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDeployModalRoute(topShortage.route)}
              className="px-4 h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-amber-400/45 text-amber-200 hover:text-white font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              Dispatch {topShortage.route.destination} Bus
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-500/10 backdrop-blur-md border border-emerald-500/35 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
            <p className="text-sm font-semibold text-white">
              All LAUTECH Corridors Balanced — Zero Active Student Seat
              Shortages.
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1 — CAPACITY & SHORTAGE DASHBOARD                             */}
        {/* ================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 4 Dark Glass KPI Cards */}
            <section
              aria-label="Fleet Key Performance Indicators"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              <div className="framer-card p-4 sm:p-5">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                    Total Student Demand
                  </span>
                  <Users className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
                <p className="mt-2 font-mono-tabular text-2xl sm:text-3xl font-bold text-white">
                  {kpis.totalStudentDemand}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  4 LAUTECH corridors live
                </p>
              </div>

              <div className="framer-card p-4 sm:p-5">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                    Confirmed Seats
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                </div>
                <p className="mt-2 font-mono-tabular text-2xl sm:text-3xl font-bold text-[#10B981]">
                  {kpis.confirmedSeats}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  {kpis.totalBuses} active 14-seat buses
                </p>
              </div>

              <div className="framer-card p-4 sm:p-5">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                    Active Shortage
                  </span>
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                </div>
                <p
                  className={`mt-2 font-mono-tabular text-2xl sm:text-3xl font-bold ${
                    kpis.activeSeatShortage > 0
                      ? 'text-red-400'
                      : 'text-[#10B981]'
                  }`}
                >
                  {kpis.activeSeatShortage}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  {kpis.activeSeatShortage > 0
                    ? 'Students queued for buses'
                    : 'All corridors balanced'}
                </p>
              </div>

              <div className="framer-card-amber p-4 sm:p-5 border-amber-500/30">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                    Escrow Ready for Payout
                  </span>
                  <Wallet className="w-4 h-4 text-[#F59E0B] shrink-0" />
                </div>
                <p className="mt-2 font-mono-tabular text-2xl sm:text-3xl font-bold text-white">
                  {formatNaira(kpis.escrowBalance)}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-emerald-400 font-mono-tabular">
                  Released: {formatNaira(kpis.releasedPayouts)}
                </p>
              </div>
            </section>

            {/* Corridor Demand & Shortage Matrix (Desktop Table + Mobile Cards) */}
            <section
              aria-labelledby="corridor-table-heading"
              className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/[0.02]">
                <div>
                  <h2
                    id="corridor-table-heading"
                    className="font-heading text-base sm:text-lg font-bold text-white"
                  >
                    Corridor Capacity &amp; Shortage Matrix
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Deploy a +14 seat bus on any shortage row to unlock queued
                    students immediately.
                  </p>
                </div>
                <span className="font-mono-tabular text-xs text-[#94A3B8]">
                  ORIGIN: LAUTECH, OGBOMOSO
                </span>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                      <th className="py-3.5 px-6">Route</th>
                      <th className="py-3.5 px-4 text-right">Requests</th>
                      <th className="py-3.5 px-4 text-right">
                        Confirmed Seats
                      </th>
                      <th className="py-3.5 px-4 text-right">Shortage</th>
                      <th className="py-3.5 px-4 text-right">Locked Fare</th>
                      <th className="py-3.5 px-6 text-right">Fleet Dispatch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {state.routes.map((route) => {
                      const shortage = calculateRouteShortage(route);
                      const hasShortage = shortage > 0;
                      return (
                        <tr
                          key={route.id}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="font-bold text-white">
                              LAUTECH → {route.destination}
                            </div>
                            <div className="text-xs text-[#94A3B8]">
                              {route.terminal} · {route.buses.length}{' '}
                              {route.buses.length === 1 ? 'bus' : 'buses'}{' '}
                              deployed
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono-tabular font-semibold text-white">
                            {route.requests}
                          </td>
                          <td className="py-4 px-4 text-right font-mono-tabular font-semibold text-slate-300">
                            {route.confirmedSeats}/{route.availableSeats}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {hasShortage ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 font-mono-tabular text-xs font-bold shadow-[0_0_16px_rgba(239,68,68,0.22)]">
                                <AlertTriangle className="w-3 h-3" />+
                                {shortage} Shortage
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono-tabular text-xs font-semibold">
                                0 Balanced
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right font-mono-tabular font-semibold text-slate-200">
                            {formatNaira(route.fare)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => setDeployModalRoute(route)}
                              className={`inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                                hasShortage
                                  ? 'bg-[#F59E0B] hover:bg-amber-400 text-[#05070A] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                                  : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Deploy +{STANDARD_BUS_CAPACITY} Seat Bus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Route Cards */}
              <div className="md:hidden divide-y divide-white/10">
                {state.routes.map((route) => {
                  const shortage = calculateRouteShortage(route);
                  const hasShortage = shortage > 0;
                  return (
                    <div key={route.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-heading font-bold text-white">
                            LAUTECH → {route.destination}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            {route.terminal} · {formatNaira(route.fare)}
                          </p>
                        </div>
                        {hasShortage ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 font-mono-tabular text-[11px] font-bold">
                            +{shortage} Shortage
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono-tabular text-[11px] font-semibold">
                            0 Balanced
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-mono-tabular">
                        <div className="p-2 rounded-lg bg-[#05070A]/70 border border-white/10">
                          <span className="text-[10px] text-[#94A3B8] block">
                            Requests
                          </span>
                          <strong className="text-white">
                            {route.requests}
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#05070A]/70 border border-white/10">
                          <span className="text-[10px] text-[#94A3B8] block">
                            Confirmed
                          </span>
                          <strong className="text-white">
                            {route.confirmedSeats}/{route.availableSeats}
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#05070A]/70 border border-white/10">
                          <span className="text-[10px] text-[#94A3B8] block">
                            Buses
                          </span>
                          <strong className="text-white">
                            {route.buses.length} active
                          </strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeployModalRoute(route)}
                        className={`w-full h-11 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          hasShortage
                            ? 'bg-[#F59E0B] hover:bg-amber-400 text-[#05070A] shadow-[0_0_20px_rgba(245,158,11,0.22)]'
                            : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Deploy +{STANDARD_BUS_CAPACITY} Seat Bus
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Deployed Fleet Units & Interswitch Settlement Ledger */}
            <section
              aria-labelledby="fleet-settlement-heading"
              className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 overflow-hidden"
            >
              <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
                <div>
                  <h2
                    id="fleet-settlement-heading"
                    className="font-heading text-base font-bold text-white"
                  >
                    Deployed Fleet Units &amp; Interswitch Escrow Ledger
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Escrow automatically flips to Payout Released upon mobile
                    boarding scan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('boarding')}
                  className="text-xs font-semibold text-[#F59E0B] hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Open Mobile Check-In →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 sm:p-6">
                {state.routes.flatMap((route) =>
                  route.buses.map((bus) => {
                    const isReleased = bus.settlementStatus === 'payout_released';
                    return (
                      <div
                        key={bus.id}
                        className="p-4 rounded-xl border border-white/10 bg-[#05070A]/70 flex flex-col justify-between gap-3 hover:border-amber-500/35 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono-tabular text-xs font-bold text-white">
                              {route.destination} · Bus #{bus.busNumber}
                            </p>
                            <p className="text-xs text-[#94A3B8] font-mono-tabular">
                              {bus.plateNumber} · {bus.wave}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                              isReleased
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                            }`}
                          >
                            {isReleased
                              ? 'Payout Released to Bank'
                              : 'In Escrow (Interswitch)'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono-tabular pt-2.5 border-t border-white/10">
                          <span className="text-[#94A3B8]">
                            Seats:{' '}
                            <strong className="text-white">
                              {bus.bookedSeats}/{bus.capacity}
                            </strong>
                            {isReleased && bus.payoutReleasedAt && (
                              <span className="ml-2 text-emerald-400">
                                · {bus.payoutReleasedAt}
                              </span>
                            )}
                          </span>
                          <span className="font-bold text-white">
                            {formatNaira(bus.bookedSeats * bus.lockedFare)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2 — ONE-HANDED MOBILE BOARDING VERIFICATION (CHECK-IN)        */}
        {/* ================================================================= */}
        {activeTab === 'boarding' && (
          <div className="max-w-xl mx-auto space-y-5">
            {/* Primary One-Handed Park Scanner Card */}
            <section
              aria-labelledby="mobile-checkin-heading"
              className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-semibold uppercase tracking-wider">
                  <ScanLine className="w-3.5 h-3.5" />
                  LAUTECH Gate Check-In Ready
                </span>
                <h2
                  id="mobile-checkin-heading"
                  className="font-heading text-xl sm:text-2xl font-bold text-white"
                >
                  Mobile Boarding Verification
                </h2>
                <p className="text-xs sm:text-sm text-[#94A3B8]">
                  Scan a student&apos;s QR boarding pass to confirm seat
                  occupancy and release Interswitch bus escrow immediately.
                </p>
              </div>

              {/* Sole Primary Solid Amber CTA (Centered h-14) */}
              <button
                type="button"
                onClick={() => setIsScannerOpen((prev) => !prev)}
                className="w-full h-14 px-6 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#05070A] font-bold text-base transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_0_28px_rgba(245,158,11,0.3)]"
              >
                <QrCode className="w-5 h-5" />
                {isScannerOpen ? 'Close Simulated QR Scanner' : 'Scan Student QR'}
              </button>

              {/* Simulated QR Camera Viewfinder & Booked Ticket Quick-Select */}
              {isScannerOpen && (
                <div className="rounded-2xl bg-[#05070A] border border-amber-500/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                      Simulated Gate Camera Active — Tap a Pass to Scan
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(false)}
                      aria-label="Close scanner"
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Viewfinder Frame */}
                  <div className="py-5 rounded-xl bg-[#0D131F]/80 border border-dashed border-amber-500/45 flex flex-col items-center justify-center text-center">
                    <div className="relative w-20 h-20 rounded-xl border border-amber-500/50 flex items-center justify-center bg-[#05070A]">
                      <QrCode className="w-10 h-10 text-[#F59E0B]" />
                      <ScanLine className="w-16 h-16 text-emerald-400/80 absolute" />
                    </div>
                    <p className="mt-2.5 text-[11px] font-mono-tabular text-[#94A3B8]">
                      POINT AT STUDENT QR OR SELECT BOOKED PASS BELOW
                    </p>
                  </div>

                  {/* Quick-Select Booked Manifest Tickets */}
                  <div className="space-y-2">
                    {state.tickets.map((t) => (
                      <button
                        key={t.txnRef}
                        type="button"
                        onClick={() => verifyAndBoardTicket(t.txnRef)}
                        className="w-full p-3.5 rounded-xl bg-[#0D131F] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/45 text-left flex items-center justify-between gap-3 transition-all cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-mono-tabular text-xs font-bold text-white">
                            {t.txnRef} · Seat #{t.seatNumber}
                          </p>
                          <p className="text-xs text-[#94A3B8] truncate">
                            {t.studentName} · LAUTECH → {t.destination} (Bus #
                            {t.busNumber})
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono-tabular shrink-0 ${
                            t.status === 'boarded'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {t.status === 'boarded' ? 'Boarded' : 'Tap to Scan'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual txn_ref Input (Secondary Glass Outline Action) */}
              <form
                onSubmit={handleManualLookupSubmit}
                className="pt-4 border-t border-white/10 space-y-2.5"
                noValidate
              >
                <label
                  htmlFor="operator-txn-ref"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]"
                >
                  Or Enter Manual Reference (txn_ref)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="operator-txn-ref"
                    type="text"
                    value={scanInput}
                    onChange={(e) => {
                      setScanInput(e.target.value.toUpperCase());
                      setScanError(null);
                    }}
                    placeholder="e.g. VOYA-TRN-849201"
                    className="flex-1 h-12 px-3.5 rounded-xl border border-white/15 font-mono-tabular text-sm bg-[#05070A] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                  <button
                    type="submit"
                    className="h-12 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Verify &amp; Board
                  </button>
                </div>
                {scanError && (
                  <p className="text-xs text-red-400 font-medium" role="alert">
                    {scanError}
                  </p>
                )}
              </form>
            </section>

            {/* Flashing Green Boarding Verification & Automatic Bank Payout Release Card */}
            {verifiedTicket && verifiedBus && (
              <section
                key={`${verifiedTicket.txnRef}-${flashNonce}`}
                aria-live="polite"
                className={`rounded-2xl backdrop-blur-md border p-5 sm:p-6 space-y-5 ${
                  verifiedTicket.status === 'boarded'
                    ? 'bg-emerald-500/10 border-emerald-500/50 voya-verify-flash'
                    : 'bg-[#0D131F]/80 border-white/15'
                }`}
              >
                {/* Confirmation Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        verifiedTicket.status === 'boarded'
                          ? 'bg-[#10B981] text-[#05070A]'
                          : 'bg-amber-500/20 text-[#F59E0B]'
                      }`}
                    >
                      {verifiedTicket.status === 'boarded' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <ShieldCheck className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-heading text-lg sm:text-xl font-bold text-white">
                        {verifiedTicket.status === 'boarded'
                          ? `Seat #${verifiedTicket.seatNumber} Verified — Boarded`
                          : `Seat #${verifiedTicket.seatNumber} Found — Ready to Board`}
                      </p>
                      <p className="font-mono-tabular text-xs text-emerald-300 mt-0.5">
                        {verifiedTicket.txnRef} · {verifiedTicket.studentName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passenger & Vehicle Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#05070A]/80 border border-white/10">
                    <p className="text-[#94A3B8]">Route &amp; Wave</p>
                    <p className="mt-0.5 font-bold text-white">
                      LAUTECH → {verifiedTicket.destination}
                    </p>
                    <p className="font-mono-tabular text-[11px] text-[#94A3B8]">
                      {verifiedTicket.wave} · {verifiedTicket.travelDate}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#05070A]/80 border border-white/10">
                    <p className="text-[#94A3B8]">Assigned Vehicle</p>
                    <p className="mt-0.5 font-mono-tabular font-bold text-white">
                      Bus #{verifiedBus.busNumber} ({verifiedBus.plateNumber})
                    </p>
                    <p className="font-mono-tabular text-[11px] text-[#94A3B8]">
                      Fare: {formatNaira(verifiedTicket.lockedFare)}
                    </p>
                  </div>
                </div>

                {/* If pre-filled ticket wasn't boarded yet, offer secondary confirm */}
                {verifiedTicket.status !== 'boarded' && (
                  <button
                    type="button"
                    onClick={() => verifyAndBoardTicket(verifiedTicket.txnRef)}
                    className="w-full h-12 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Seat #{verifiedTicket.seatNumber} Boarding &amp;
                    Release Payout
                  </button>
                )}

                {/* Automatic Interswitch Settlement Status Card */}
                <div className="p-4 rounded-xl bg-[#05070A]/85 border border-white/15 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-xs font-bold text-white font-mono-tabular">
                        Bus #{verifiedBus.busNumber} ({verifiedBus.plateNumber})
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono-tabular ${
                        verifiedBus.settlementStatus === 'payout_released'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {verifiedBus.settlementStatus === 'payout_released'
                        ? 'Payout Released to Bank'
                        : 'In Escrow (Interswitch)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8] font-mono-tabular">
                    <span>
                      Manifest ({verifiedBus.bookedSeats}/{verifiedBus.capacity}
                      ):{' '}
                      <strong className="text-white">
                        {formatNaira(
                          verifiedBus.bookedSeats * verifiedBus.lockedFare
                        )}
                      </strong>
                    </span>
                    {verifiedBus.settlementStatus === 'payout_released' &&
                      verifiedBus.payoutReleasedAt && (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <Clock className="w-3.5 h-3.5" />
                          Released at {verifiedBus.payoutReleasedAt}
                        </span>
                      )}
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onToggleBusSettlement(verifiedBus.id)}
                      className="text-[11px] font-medium text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      {verifiedBus.settlementStatus === 'payout_released'
                        ? 'Toggle back to In Escrow (Demo)'
                        : 'Release Escrow Payout Now'}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        <DeployBusModal
          route={deployModalRoute}
          onClose={() => setDeployModalRoute(null)}
          onConfirmDeploy={(payload) => {
            onDeployBus(payload);
            setDeployModalRoute(null);
          }}
        />
      </div>
    </div>
  );
}
