import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bus,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Ticket as TicketIcon,
  User,
  Users,
} from 'lucide-react';
import {
  BOARDING_POINTS,
  DEFAULT_ORIGIN,
  DEMO_INTERSWITCH_AMOUNT,
  findBusById,
  formatCountdownSeconds,
  formatNaira,
  generateTxnRef,
  getDefaultTravelDate,
  getDepartureCardsForRoute,
  getDropOffPoints,
  getSeatMapForBus,
  validatePassengerCheckout,
} from '../lib/voyaEngine';
import type {
  DepartureBusCard,
  DepartureWave,
  InterswitchPaymentData,
  RouteId,
  StudentStep,
  Ticket,
  VirtualQueueReceipt,
  VoyaState,
} from '../lib/voyaTypes';
import { HiaceSeatMap } from './HiaceSeatMap';
import { QrCodeSvg } from './QrCodeSvg';
import { ThemeToggle } from './ThemeToggle';

/**
 * ============================================================================
 * ISOLATED INTERSWITCH IPG PAYMENT HOOK
 * ============================================================================
 * TODO: Replace mock with live window.webpayCheckout (MX153376)
 *
 * Production drop-in example:
 *   window.webpayCheckout({
 *     merchant_code: 'MX153376',
 *     pay_item_id: import.meta.env.VITE_INTERSWITCH_PAY_ITEM_ID,
 *     txn_ref: paymentData.txnRef,
 *     amount: paymentData.amountKobo, // 1000 Kobo = ₦10.00 Live IPG Demo
 *     currency: paymentData.currency, // 566 = NGN
 *     cust_name: paymentData.studentName,
 *     cust_email: paymentData.email,
 *     site_redirect_url: window.location.origin,
 *     onComplete: (response) => resolve({ status: 'success', reference: response.txnref }),
 *     mode: 'TEST',
 *   });
 * ============================================================================
 */
function triggerInterswitchIPG(
  paymentData: InterswitchPaymentData
): Promise<{ status: 'success'; reference: string }> {
  // TODO: Replace mock with live window.webpayCheckout (MX153376)
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({
        status: 'success',
        reference: paymentData.txnRef,
      });
    }, 650);
  });
}

interface StudentAppViewProps {
  state: VoyaState;
  initialRouteId: RouteId;
  initialTravelDate?: string;
  initialStep?: StudentStep;
  defaultStudentName?: string;
  defaultPhoneNumber?: string;
  defaultEmail?: string;
  defaultNextOfKinPhone?: string;
  activeTicketTxnRef: string | null;
  onSelectActiveTicket: (txnRef: string) => void;
  onJoinVirtualQueue: (params: {
    routeId: RouteId;
    wave: DepartureWave;
    travelDate: string;
  }) => VirtualQueueReceipt;
  onCompleteBooking: (params: {
    routeId: RouteId;
    wave: DepartureWave;
    travelDate: string;
    studentName: string;
    phoneNumber: string;
    email?: string;
    nextOfKinPhone?: string;
    busId?: string;
    seatNumber?: number;
    boardingPoint?: string;
    dropOffPoint?: string;
    txnRef: string;
  }) => Ticket | null;
  onJumpToOperatorScan: (txnRef: string) => void;
  onNotify: (message: string) => void;
}

const STEP_LIST: { id: StudentStep; num: number; label: string }[] = [
  { id: 'search', num: 1, label: 'Select Bus' },
  { id: 'capacity', num: 2, label: 'Pick Seat & Stops' },
  { id: 'checkout', num: 3, label: 'Passenger & Pay' },
  { id: 'ticket', num: 4, label: 'Boarding Pass' },
];

const STEP_ORDER: Record<StudentStep, number> = {
  search: 1,
  capacity: 2,
  checkout: 3,
  ticket: 4,
};

export function StudentAppView({
  state,
  initialRouteId,
  initialTravelDate,
  initialStep = 'search',
  defaultStudentName = '',
  defaultPhoneNumber = '',
  defaultEmail = 'student@lautech.edu.ng',
  defaultNextOfKinPhone = '',
  activeTicketTxnRef,
  onSelectActiveTicket,
  onJoinVirtualQueue,
  onCompleteBooking,
  onJumpToOperatorScan,
  onNotify,
}: StudentAppViewProps) {
  const [step, setStep] = useState<StudentStep>('search');
  const [selectedRouteId, setSelectedRouteId] = useState<RouteId>(initialRouteId);
  const [travelDate, setTravelDate] = useState<string>(
    initialTravelDate || getDefaultTravelDate()
  );

  // Selected departure wave & bus from Step 1
  const [selectedWave, setSelectedWave] = useState<DepartureWave>('7:00 AM');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  // Virtual queue receipts keyed by `${routeId}-${wave}`
  const [queuedWaves, setQueuedWaves] = useState<Record<string, VirtualQueueReceipt>>({});
  const [joiningWaveKey, setJoiningWaveKey] = useState<string | null>(null);

  // Step 2: Seat & Stops selection
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [boardingPoint, setBoardingPoint] = useState<string>(BOARDING_POINTS[0].name);
  const [dropOffPoint, setDropOffPoint] = useState<string>(
    getDropOffPoints(initialRouteId)[0].name
  );

  // Step 3: Passenger details, live countdown timer (09:59 -> 599s), and payment state
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(599);
  const [studentName, setStudentName] = useState<string>(defaultStudentName);
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultPhoneNumber);
  const [email, setEmail] = useState<string>(defaultEmail);
  const [nextOfKinPhone, setNextOfKinPhone] = useState<string>(
    defaultNextOfKinPhone || '08023491820'
  );
  const [formErrors, setFormErrors] = useState<{
    studentName?: string;
    phoneNumber?: string;
    email?: string;
    nextOfKinPhone?: string;
  }>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Step 4: Offline save feedback
  const [passSavedOffline, setPassSavedOffline] = useState(false);

  const selectedRoute =
    state.routes.find((r) => r.id === selectedRouteId) ?? state.routes[0];
  const departureCards = getDepartureCardsForRoute(selectedRoute);
  const dropOffOptions = getDropOffPoints(selectedRoute.id);

  // Sync external initial route/date/step intent
  useEffect(() => {
    setSelectedRouteId(initialRouteId);
    setDropOffPoint(getDropOffPoints(initialRouteId)[0].name);
    setSelectedSeat(null);
  }, [initialRouteId]);

  useEffect(() => {
    if (initialTravelDate) {
      setTravelDate(initialTravelDate);
    }
  }, [initialTravelDate]);

  useEffect(() => {
    if (initialStep === 'capacity') {
      const route = state.routes.find((r) => r.id === initialRouteId);
      const cards = route ? getDepartureCardsForRoute(route) : [];
      const firstOpen = cards.find((c) => !c.isFull && c.busId);
      if (firstOpen) {
        setSelectedWave(firstOpen.wave);
        setSelectedBusId(firstOpen.busId);
        setSelectedSeat(null);
        setStep('capacity');
        return;
      }
      setStep('search');
      return;
    }
    setStep(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep, initialRouteId]);

  useEffect(() => {
    if (defaultStudentName && !studentName) setStudentName(defaultStudentName);
  }, [defaultStudentName, studentName]);

  useEffect(() => {
    if (defaultPhoneNumber && !phoneNumber) setPhoneNumber(defaultPhoneNumber);
  }, [defaultPhoneNumber, phoneNumber]);

  useEffect(() => {
    if (defaultEmail && !email) setEmail(defaultEmail);
  }, [defaultEmail, email]);

  useEffect(() => {
    if (defaultNextOfKinPhone && !nextOfKinPhone) {
      setNextOfKinPhone(defaultNextOfKinPhone);
    }
  }, [defaultNextOfKinPhone, nextOfKinPhone]);

  // Live ticking countdown timer on Step 3 (starts at 09:59)
  useEffect(() => {
    if (step !== 'checkout') return;
    setHoldSecondsLeft(599);
    const interval = window.setInterval(() => {
      setHoldSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step, selectedSeat]);

  // Active Bus & Departure Card for Step 2 / Step 3
  const activeDepartureCard: DepartureBusCard =
    departureCards.find((c) => c.wave === selectedWave) ?? departureCards[0];

  const activeBus =
    (selectedBusId && selectedRoute.buses.find((b) => b.id === selectedBusId)) ||
    selectedRoute.buses.find(
      (b) => b.wave === selectedWave && b.bookedSeats < b.capacity
    ) ||
    selectedRoute.buses.find((b) => b.bookedSeats < b.capacity) ||
    selectedRoute.buses[0];

  const seatSlots = activeBus ? getSeatMapForBus(activeBus) : [];

  const activeTicket =
    state.tickets.find((t) => t.txnRef === activeTicketTxnRef) ?? state.tickets[0];
  const activeTicketBus = activeTicket
    ? findBusById(state, activeTicket.busId)
    : undefined;

  const currentStepOrder = STEP_ORDER[step];

  const handleSelectRoute = (nextRouteId: RouteId) => {
    setSelectedRouteId(nextRouteId);
    setDropOffPoint(getDropOffPoints(nextRouteId)[0].name);
    setSelectedSeat(null);
    setSelectedBusId(null);
  };

  const handleChooseDepartureCard = (card: DepartureBusCard) => {
    setSelectedWave(card.wave);
    setSelectedBusId(card.busId);
    setSelectedSeat(null);
    setStep('capacity');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinQueueForCard = (card: DepartureBusCard) => {
    const key = `${selectedRoute.id}-${card.wave}`;
    if (joiningWaveKey === key) return;
    setJoiningWaveKey(key);

    window.setTimeout(() => {
      const receipt = onJoinVirtualQueue({
        routeId: selectedRoute.id,
        wave: card.wave,
        travelDate,
      });
      setQueuedWaves((prev) => ({ ...prev, [key]: receipt }));
      setJoiningWaveKey(null);
    }, 320);
  };

  const handleContinueToCheckout = () => {
    if (!selectedSeat) return;
    setFormErrors({});
    setStep('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepperClick = (targetStep: StudentStep) => {
    const targetOrder = STEP_ORDER[targetStep];
    if (targetOrder < currentStepOrder) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (targetStep === 'ticket' && activeTicket) {
      setStep('ticket');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePayWithInterswitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingPayment || !selectedSeat || !activeBus) return;

    const validation = validatePassengerCheckout({
      studentName,
      phoneNumber,
      email,
      nextOfKinPhone,
    });

    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsProcessingPayment(true);
    const txnRef = generateTxnRef(state.nextTxnSequence);

    const paymentData: InterswitchPaymentData = {
      txnRef,
      studentName: studentName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      nextOfKinPhone: nextOfKinPhone.trim(),
      routeId: selectedRoute.id,
      destination: selectedRoute.destination,
      travelDate,
      wave: selectedWave,
      busId: activeBus.id,
      seatNumber: selectedSeat,
      boardingPoint,
      dropOffPoint,
      lockedFare: activeDepartureCard.lockedFare,
      demoAmountNaira: DEMO_INTERSWITCH_AMOUNT,
      amountKobo: DEMO_INTERSWITCH_AMOUNT * 100,
      currency: 566,
    };

    const result = await triggerInterswitchIPG(paymentData);
    setIsProcessingPayment(false);

    if (result.status === 'success') {
      const issuedTicket = onCompleteBooking({
        routeId: paymentData.routeId,
        wave: paymentData.wave,
        travelDate: paymentData.travelDate,
        studentName: paymentData.studentName,
        phoneNumber: paymentData.phoneNumber,
        email: paymentData.email,
        nextOfKinPhone: paymentData.nextOfKinPhone,
        busId: paymentData.busId,
        seatNumber: paymentData.seatNumber,
        boardingPoint: paymentData.boardingPoint,
        dropOffPoint: paymentData.dropOffPoint,
        txnRef: result.reference,
      });

      if (issuedTicket) {
        onSelectActiveTicket(issuedTicket.txnRef);
        setPassSavedOffline(false);
        setStep('ticket');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleCopyTxnRef = (refCode: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(refCode).catch(() => {});
    }
    onNotify(`Copied reference ${refCode} to clipboard.`);
  };

  const handleSavePassOffline = () => {
    if (!activeTicket) return;
    setPassSavedOffline(true);
    onNotify(
      `Boarding pass ${activeTicket.txnRef} saved offline for LAUTECH gate check-in.`
    );
  };

  const handleShareTrip = () => {
    if (!activeTicket) return;
    const summary = `VOYA Trip Confirmation: ${activeTicket.studentName} · ${activeTicket.origin} → ${activeTicket.destination} (${activeTicket.travelDate}, ${activeTicket.wave}) · Boarding: ${activeTicket.boardingPoint ?? 'LAUTECH Main Gate'} · Drop-off: ${activeTicket.dropOffPoint ?? activeTicket.destination} · Bus #${activeTicket.busNumber} (${activeTicket.plateNumber}) · Seat #${activeTicket.seatNumber} · Ref: ${activeTicket.txnRef}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    onNotify('Trip details copied — ready to share with family via WhatsApp or SMS.');
  };

  return (
    <div
      className={`relative bg-[#05070A] min-h-[calc(100vh-4rem)] overflow-x-hidden ${
        step === 'capacity' ? 'pb-28' : 'pb-14'
      }`}
    >
      {/* Subtle Ambient Emerald Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[620px] h-[300px] rounded-full bg-emerald-500/10 blur-3xl"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* ================================================================= */}
        {/* PERSISTENT 4-STEP HORIZONTAL STEPPER BAR                          */}
        {/* ================================================================= */}
        <div className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 px-4 py-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <nav
            aria-label="Booking progress"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 md:pb-0"
          >
            {STEP_LIST.map((item, idx) => {
              const isCurrent = step === item.id;
              const isCompleted = STEP_ORDER[item.id] < currentStepOrder;
              const canClick =
                isCompleted || (item.id === 'ticket' && Boolean(activeTicket));

              return (
                <div key={item.id} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!canClick && !isCurrent}
                    onClick={() => canClick && handleStepperClick(item.id)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] ${
                      isCurrent
                        ? 'bg-emerald-500/15 text-[#10B981] border border-emerald-500/45 shadow-[0_0_16px_rgba(16,185,129,0.16)]'
                        : isCompleted
                          ? 'text-slate-200 hover:bg-white/5 hover:text-white cursor-pointer'
                          : canClick
                            ? 'text-[#94A3B8] hover:text-white hover:bg-white/5 cursor-pointer'
                            : 'text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono-tabular font-bold shrink-0 ${
                        isCompleted
                          ? 'bg-[#10B981] text-[#05070A]'
                          : isCurrent
                            ? 'bg-[#10B981] text-[#05070A]'
                            : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : item.num}
                    </span>
                    <span>
                      {item.num}. {item.label}
                    </span>
                  </button>

                  {idx < STEP_LIST.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`hidden sm:inline-block w-4 h-px ${
                        isCompleted ? 'bg-emerald-500/60' : 'bg-white/15'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center justify-end shrink-0">
            <ThemeToggle variant="compact" />
          </div>
        </div>

        {/* ================================================================= */}
        {/* STEP 1 — SEARCH BAR & DEPARTURE BUS CARDS (FlixBus / Zeelo Style) */}
        {/* ================================================================= */}
        {step === 'search' && (
          <section aria-labelledby="step1-bus-heading" className="space-y-6">
            {/* Compact FlixBus-Style Top Search Bar */}
            <div className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 p-4 sm:p-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
                    LAUTECH Interstate Corridor Search
                  </p>
                  <h1
                    id="step1-bus-heading"
                    className="font-heading text-xl sm:text-2xl font-bold text-white"
                  >
                    Select Your Departure Wave
                  </h1>
                </div>
                {activeTicket && (
                  <button
                    type="button"
                    onClick={() => setStep('ticket')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer"
                  >
                    <TicketIcon className="w-3.5 h-3.5" />
                    View Active Pass ({activeTicket.txnRef})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Departure Locked to LAUTECH, Ogbomoso */}
                <div>
                  <label
                    htmlFor="booking-origin"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                  >
                    Departure (Locked)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#10B981] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="booking-origin"
                      type="text"
                      value={DEFAULT_ORIGIN}
                      readOnly
                      className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-white/10 bg-[#05070A]/80 text-sm font-semibold text-white cursor-default"
                    />
                  </div>
                </div>

                {/* Destination Selector */}
                <div>
                  <label
                    htmlFor="booking-destination"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                  >
                    Destination
                  </label>
                  <select
                    id="booking-destination"
                    value={selectedRouteId}
                    onChange={(e) => handleSelectRoute(e.target.value as RouteId)}
                    className="w-full h-12 px-3.5 rounded-xl border border-white/15 bg-[#05070A] text-sm font-semibold text-white focus:outline-none focus:border-emerald-500/60 [&>option]:bg-[#0B1120] [&>option]:text-white cursor-pointer"
                  >
                    {state.routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.destination} — {formatNaira(route.fare)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Travel Date Picker */}
                <div>
                  <label
                    htmlFor="booking-date"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                  >
                    Travel Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#10B981] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="booking-date"
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-white/15 bg-[#05070A] text-sm font-semibold text-white font-mono-tabular focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Route Quick-Switch Chips for Instant Corridor Comparison */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {state.routes.map((route) => {
                  const active = route.id === selectedRouteId;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleSelectRoute(route.id)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                        active
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-[#10B981]'
                          : 'bg-[#0D131F]/80 border-white/10 text-[#94A3B8] hover:text-white hover:border-white/25'
                      }`}
                    >
                      {route.destination}{' '}
                      <span className="font-mono-tabular opacity-80">
                        · {formatNaira(route.fare)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[#94A3B8] font-mono-tabular">
                {departureCards.length} Scheduled Waves · {selectedRoute.requests} Total Requests
              </p>
            </div>

            {/* Departure Bus Cards (7:00 AM, 9:00 AM, 11:00 AM) */}
            <div className="space-y-4">
              {departureCards.map((card) => {
                const waveKey = `${selectedRoute.id}-${card.wave}`;
                const queueReceipt = queuedWaves[waveKey];
                const isJoining = joiningWaveKey === waveKey;

                return (
                  <article
                    key={card.wave}
                    className={`rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border transition-all duration-300 p-5 sm:p-6 shadow-xl ${
                      card.isFull
                        ? 'border-white/10 hover:border-amber-500/40'
                        : 'border-white/10 hover:border-emerald-500/45 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Left & Center: Visual Route Timeline + Vehicle & Zeelo Progress */}
                      <div className="flex-1 space-y-4">
                        {/* FlixBus Visual Route Timeline */}
                        <div className="flex items-center gap-3 sm:gap-5">
                          <div className="shrink-0">
                            <p className="font-mono-tabular text-lg sm:text-xl font-bold text-white leading-tight">
                              {card.departureTime}
                            </p>
                            <p className="text-xs text-[#94A3B8]">Ogbomoso</p>
                          </div>

                          <div className="flex-1 flex flex-col items-center px-1 min-w-[110px]">
                            <span className="font-mono-tabular text-[11px] font-semibold text-[#94A3B8] mb-1">
                              {card.durationLabel}
                            </span>
                            <div className="w-full flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                              <div className="flex-1 border-t-2 border-dotted border-white/25" />
                              <Bus className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                              <div className="flex-1 border-t-2 border-dotted border-white/25" />
                              <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1">
                              Direct · Verified Hub
                            </span>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-mono-tabular text-lg sm:text-xl font-bold text-white leading-tight">
                              {card.arrivalTime}
                            </p>
                            <p className="text-xs text-[#94A3B8]">
                              {selectedRoute.destination}
                            </p>
                          </div>
                        </div>

                        {/* Bus Metadata & Zeelo-Style Mini Progress Bar */}
                        <div className="pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                            <span className="font-semibold text-white">
                              {card.vehicleLabel}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono-tabular text-[#94A3B8]">
                              Bus #{card.busNumber} ({card.plateNumber})
                            </span>
                          </div>

                          {/* Mini Seat-Fill Progress Bar */}
                          <div className="sm:w-64 shrink-0 space-y-1">
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular whitespace-nowrap">
                              <span
                                className={
                                  card.isFull
                                    ? 'text-[#F59E0B] font-semibold'
                                    : 'text-[#10B981] font-semibold'
                                }
                              >
                                {card.bookedSeats}/{card.capacity} Seats Filled
                              </span>
                              <span className="text-[#94A3B8]">
                                {card.isFull
                                  ? 'Full · Queue'
                                  : `${card.seatsRemaining} left`}
                              </span>
                            </div>
                            <div
                              className="h-2 w-full rounded-full bg-white/10 overflow-hidden"
                              role="progressbar"
                              aria-valuenow={card.bookedSeats}
                              aria-valuemin={0}
                              aria-valuemax={card.capacity}
                              aria-label={`${card.wave} bus occupancy`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  card.isFull
                                    ? 'bg-gradient-to-r from-[#F59E0B] to-amber-300'
                                    : 'bg-gradient-to-r from-[#059669] to-[#10B981]'
                                }`}
                                style={{ width: `${card.fillPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Locked Fare + Primary Action CTA */}
                      <div className="lg:w-56 lg:pl-5 lg:border-l border-white/10 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0">
                        <div className="text-left lg:text-right">
                          <p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">
                            Locked Fare
                          </p>
                          <p className="font-mono-tabular text-2xl font-bold text-white">
                            {formatNaira(card.lockedFare)}
                          </p>
                        </div>

                        {!card.isFull ? (
                          <button
                            type="button"
                            onClick={() => handleChooseDepartureCard(card)}
                            className="px-5 h-11 lg:w-full rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-[0_0_22px_rgba(16,185,129,0.28)] whitespace-nowrap"
                          >
                            Select Seat
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : queueReceipt ? (
                          <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono-tabular font-bold text-center lg:w-full">
                            Queued · #{queueReceipt.position} on Waitlist
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isJoining}
                            onClick={() => handleJoinQueueForCard(card)}
                            className="px-4 h-11 lg:w-full rounded-xl bg-[#F59E0B] hover:bg-amber-400 disabled:opacity-75 text-[#05070A] font-bold text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.24)] whitespace-nowrap"
                          >
                            {isJoining ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Queueing...
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4" />
                                Join Virtual Queue
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* STEP 2 — INTERACTIVE 14-SEATER SEAT MAP & STOPS (redBus/BuuPass)  */}
        {/* ================================================================= */}
        {step === 'capacity' && activeBus && (
          <section aria-labelledby="step2-seat-heading" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors cursor-pointer mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Departures
                </button>
                <h1
                  id="step2-seat-heading"
                  className="font-heading text-xl sm:text-2xl font-bold text-white"
                >
                  Ogbomoso → {selectedRoute.destination} ·{' '}
                  <span className="font-mono-tabular text-[#10B981]">
                    {activeDepartureCard.departureTime}
                  </span>
                </h1>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-[#0D131F]/80 border border-white/10 font-mono-tabular text-xs text-slate-300">
                {travelDate} · {activeDepartureCard.durationLabel}
              </span>
            </div>

            {/* 2-Column Layout on Desktop (Stacked on Mobile) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive 14-Seater Hiace Seat Map */}
              <div className="lg:col-span-7">
                <HiaceSeatMap
                  busNumber={activeBus.busNumber}
                  plateNumber={activeBus.plateNumber}
                  seats={seatSlots}
                  selectedSeat={selectedSeat}
                  onSelectSeat={(seatNum) => setSelectedSeat(seatNum)}
                />
              </div>

              {/* Right Column: Boarding & Drop-Off Point Radio Cards */}
              <div className="lg:col-span-5 space-y-5">
                {/* Boarding Point Card */}
                <fieldset className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 p-5 space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Boarding Point (Ogbomoso)
                  </legend>

                  <div className="space-y-2.5">
                    {BOARDING_POINTS.map((stop) => {
                      const checked = boardingPoint === stop.name;
                      return (
                        <label
                          key={stop.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            checked
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_18px_rgba(16,185,129,0.14)]'
                              : 'bg-[#05070A]/65 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <input
                            type="radio"
                            name="boarding-point"
                            value={stop.name}
                            checked={checked}
                            onChange={() => setBoardingPoint(stop.name)}
                            className="mt-1 accent-[#10B981]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">
                              {stop.name}
                            </p>
                            <p className="text-xs text-[#94A3B8]">{stop.detail}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Dynamic Drop-Off Point Card */}
                <fieldset className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 p-5 space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Drop-Off Point ({selectedRoute.destination})
                  </legend>

                  <div className="space-y-2.5">
                    {dropOffOptions.map((stop) => {
                      const checked = dropOffPoint === stop.name;
                      return (
                        <label
                          key={stop.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            checked
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_18px_rgba(16,185,129,0.14)]'
                              : 'bg-[#05070A]/65 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <input
                            type="radio"
                            name="dropoff-point"
                            value={stop.name}
                            checked={checked}
                            onChange={() => setDropOffPoint(stop.name)}
                            className="mt-1 accent-[#10B981]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">
                              {stop.name}
                            </p>
                            <p className="text-xs text-[#94A3B8]">{stop.detail}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-[#05070A]/90 backdrop-blur-xl border-t border-white/10 px-4 py-3.5 z-40">
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">
                      Seat Selection
                    </p>
                    <p className="font-mono-tabular text-sm sm:text-base font-bold text-white">
                      {selectedSeat ? (
                        <>
                          Selected:{' '}
                          <span className="text-[#10B981]">
                            Seat #{selectedSeat}
                          </span>{' '}
                          • {formatNaira(activeDepartureCard.lockedFare)}
                        </>
                      ) : (
                        <span className="text-[#94A3B8] font-sans font-medium">
                          Tap an available seat on the map to continue
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedSeat}
                  onClick={handleContinueToCheckout}
                  className={`w-full sm:w-auto px-6 h-12 rounded-xl font-bold text-sm sm:text-base transition-all inline-flex items-center justify-center gap-2 ${
                    selectedSeat
                      ? 'bg-[#10B981] hover:bg-[#059669] text-[#05070A] cursor-pointer shadow-[0_0_24px_rgba(16,185,129,0.3)]'
                      : 'bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  Continue to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* STEP 3 — 2-COLUMN CHECKOUT & PAYMENT (FlixBus / BuuPass Style)    */}
        {/* ================================================================= */}
        {step === 'checkout' && activeBus && selectedSeat && (
          <section aria-labelledby="step3-checkout-heading" className="space-y-5">
            {/* Top Urgency Strip with Live Ticking Countdown */}
            <div
              role="status"
              className="rounded-2xl bg-amber-500/10 border border-amber-500/35 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-amber-200">
                <Clock className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>
                  Seat #{selectedSeat} is temporarily held for you —{' '}
                  <strong className="font-mono-tabular text-white">
                    {formatCountdownSeconds(holdSecondsLeft)} remaining
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep('capacity')}
                className="text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                ← Change Seat or Stops
              </button>
            </div>

            <form
              onSubmit={handlePayWithInterswitch}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              noValidate
            >
              {/* Left Column: Passenger Details & Interswitch IPG Payment Method */}
              <div className="lg:col-span-7 space-y-5">
                <div className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 p-5 sm:p-6 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
                      Passenger Manifest Details
                    </p>
                    <h1
                      id="step3-checkout-heading"
                      className="mt-0.5 font-heading text-xl font-bold text-white"
                    >
                      Who&apos;s Travelling?
                    </h1>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="checkout-full-name"
                      className="block text-xs font-semibold text-slate-200 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="checkout-full-name"
                        type="text"
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          setFormErrors((p) => ({ ...p, studentName: undefined }));
                        }}
                        placeholder="e.g. Adebayo Toluwanimi"
                        className={`w-full h-12 pl-10 pr-4 rounded-xl border text-sm bg-[#05070A] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 ${
                          formErrors.studentName
                            ? 'border-red-500'
                            : 'border-white/15'
                        }`}
                        required
                      />
                    </div>
                    {formErrors.studentName && (
                      <p className="mt-1 text-xs text-red-400" role="alert">
                        {formErrors.studentName}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp Phone Number */}
                  <div>
                    <label
                      htmlFor="checkout-whatsapp"
                      className="block text-xs font-semibold text-slate-200 mb-1.5"
                    >
                      WhatsApp Phone Number{' '}
                      <span className="font-normal text-[#94A3B8]">
                        (for 20-min hostel boarding alert)
                      </span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="checkout-whatsapp"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setFormErrors((p) => ({ ...p, phoneNumber: undefined }));
                        }}
                        placeholder="e.g. 08035510921"
                        className={`w-full h-12 pl-10 pr-4 rounded-xl border font-mono-tabular text-sm bg-[#05070A] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 ${
                          formErrors.phoneNumber
                            ? 'border-red-500'
                            : 'border-white/15'
                        }`}
                        required
                      />
                    </div>
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-400" role="alert">
                        {formErrors.phoneNumber}
                      </p>
                    )}
                  </div>

                  {/* Email Address & Next of Kin Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="checkout-email"
                        className="block text-xs font-semibold text-slate-200 mb-1.5"
                      >
                        Email Address{' '}
                        <span className="font-normal text-[#94A3B8]">
                          (for receipt)
                        </span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="checkout-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setFormErrors((p) => ({ ...p, email: undefined }));
                          }}
                          placeholder="student@lautech.edu.ng"
                          className={`w-full h-12 pl-10 pr-3.5 rounded-xl border text-sm bg-[#05070A] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 ${
                            formErrors.email ? 'border-red-500' : 'border-white/15'
                          }`}
                          required
                        />
                      </div>
                      {formErrors.email && (
                        <p className="mt-1 text-xs text-red-400" role="alert">
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-nok-phone"
                        className="block text-xs font-semibold text-slate-200 mb-1.5"
                      >
                        Next of Kin Phone
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="checkout-nok-phone"
                          type="tel"
                          value={nextOfKinPhone}
                          onChange={(e) => {
                            setNextOfKinPhone(e.target.value);
                            setFormErrors((p) => ({
                              ...p,
                              nextOfKinPhone: undefined,
                            }));
                          }}
                          placeholder="e.g. 08023491820"
                          className={`w-full h-12 pl-10 pr-3.5 rounded-xl border font-mono-tabular text-sm bg-[#05070A] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 ${
                            formErrors.nextOfKinPhone
                              ? 'border-red-500'
                              : 'border-white/15'
                          }`}
                          required
                        />
                      </div>
                      {formErrors.nextOfKinPhone && (
                        <p className="mt-1 text-xs text-red-400" role="alert">
                          {formErrors.nextOfKinPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Highlighted Payment Method Card: Interswitch IPG */}
                <div className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 p-5 sm:p-6 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Payment Method
                  </p>
                  <label className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.14)] cursor-pointer">
                    <input
                      type="radio"
                      name="payment-method"
                      value="interswitch-ipg"
                      checked
                      readOnly
                      className="mt-1 accent-[#10B981]"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#10B981]" />
                          Interswitch Payment Gateway (IPG)
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Escrow Protected
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Card • Bank Transfer • USSD • Verve / Mastercard / Visa
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Funds stay safely in VOYA escrow until your QR boarding
                        pass is scanned at departure. Auto-refund if bus does not
                        dispatch.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Right Column: Sticky Trip Summary Card */}
              <aside className="lg:col-span-5 lg:sticky lg:top-24">
                <div className="rounded-2xl bg-[#0D131F]/85 backdrop-blur-md border border-white/15 p-5 sm:p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <h2 className="font-heading text-base font-bold text-white">
                      Trip Summary
                    </h2>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[#10B981] font-mono-tabular text-xs font-bold">
                      Seat #{selectedSeat}
                    </span>
                  </div>

                  {/* Route Timeline */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-mono-tabular text-sm font-bold text-white">
                        {activeDepartureCard.departureTime}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">Ogbomoso</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <span className="font-mono-tabular text-[10px] text-[#94A3B8]">
                        {activeDepartureCard.durationLabel}
                      </span>
                      <div className="w-full border-t border-dotted border-white/30 my-1" />
                    </div>
                    <div className="text-right">
                      <p className="font-mono-tabular text-sm font-bold text-white">
                        {activeDepartureCard.arrivalTime}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {selectedRoute.destination}
                      </p>
                    </div>
                  </div>

                  {/* Trip Metadata */}
                  <div className="p-3.5 rounded-xl bg-[#05070A]/75 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#94A3B8]">Date &amp; Wave</span>
                      <span className="font-mono-tabular font-semibold text-white">
                        {travelDate} · {selectedWave}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#94A3B8]">Boarding Point</span>
                      <span className="font-semibold text-white text-right">
                        {boardingPoint}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#94A3B8]">Drop-Off Point</span>
                      <span className="font-semibold text-white text-right">
                        {dropOffPoint}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#94A3B8]">Vehicle</span>
                      <span className="font-mono-tabular font-semibold text-white">
                        Bus #{activeBus.busNumber} ({activeBus.plateNumber})
                      </span>
                    </div>
                  </div>

                  {/* Itemized Fare Breakdown */}
                  <div className="space-y-2.5 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Base Fare (Locked)</span>
                      <span className="font-mono-tabular font-semibold text-white">
                        {formatNaira(activeDepartureCard.lockedFare)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">
                        VOYA Escrow &amp; Service Fee
                      </span>
                      <span className="font-mono-tabular font-semibold text-[#10B981]">
                        ₦0
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-sm">
                      <span className="font-bold text-white">Total Fare</span>
                      <span className="font-mono-tabular font-bold text-white">
                        {formatNaira(activeDepartureCard.lockedFare)}
                      </span>
                    </div>

                    {/* Subtle Hackathon Demo Notice */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-amber-200">
                        Hackathon Demo · Live IPG Charge
                      </span>
                      <span className="font-mono-tabular text-sm font-bold text-[#F59E0B]">
                        ₦{DEMO_INTERSWITCH_AMOUNT}.00
                      </span>
                    </div>
                  </div>

                  {/* Primary Emerald CTA */}
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full h-12 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-75 text-[#05070A] font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_26px_rgba(16,185,129,0.3)]"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting Interswitch IPG...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay ₦{DEMO_INTERSWITCH_AMOUNT}.00 with Interswitch IPG
                      </>
                    )}
                  </button>
                </div>
              </aside>
            </form>
          </section>
        )}

        {/* ================================================================= */}
        {/* STEP 4 — CONFIRMED QR BOARDING PASS (BuuPass Style)               */}
        {/* ================================================================= */}
        {step === 'ticket' && activeTicket && (
          <section
            aria-labelledby="step4-pass-heading"
            className="max-w-xl mx-auto space-y-5"
          >
            {/* Success Celebration Header */}
            <div
              role="status"
              className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/45 shadow-[0_0_32px_rgba(16,185,129,0.2)] flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-full bg-[#10B981] text-[#05070A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h1
                  id="step4-pass-heading"
                  className="font-heading text-base sm:text-lg font-bold text-white leading-snug"
                >
                  {activeTicket.status === 'boarded'
                    ? `Seat #${activeTicket.seatNumber} Boarded — Pass Verified at Gate!`
                    : `Seat #${activeTicket.seatNumber} Confirmed! Stay in your hostel until boarding.`}
                </h1>
                <p className="text-xs text-emerald-300 font-mono-tabular mt-0.5">
                  {activeTicket.travelDate} · {activeTicket.wave} Wave · 20-min
                  WhatsApp alert active
                </p>
              </div>
            </div>

            {/* Perforated High-Contrast Boarding Pass Card */}
            <div className="relative rounded-2xl bg-[#0D131F]/90 backdrop-blur-md border border-white/15 shadow-2xl overflow-hidden">
              {/* Top Route & Seat Summary */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
                      VOYA Digital Boarding Pass
                    </p>
                    <p className="mt-1 font-heading text-xl sm:text-2xl font-bold text-white">
                      LAUTECH, Ogbomoso → {activeTicket.destination}
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Passenger:{' '}
                      <strong className="text-white">
                        {activeTicket.studentName}
                      </strong>{' '}
                      · <span className="font-mono-tabular">{activeTicket.phoneNumber}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono-tabular text-xs font-bold uppercase shrink-0">
                    {activeTicket.status === 'boarded' ? 'Boarded' : 'Confirmed'}
                  </span>
                </div>

                {/* Boarding Point, Drop-Off, Vehicle, Seat Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#05070A]/75 border border-white/10">
                    <p className="text-[11px] text-[#94A3B8]">Boarding Point</p>
                    <p className="mt-0.5 font-bold text-white">
                      {activeTicket.boardingPoint ?? 'LAUTECH Main Gate'}
                    </p>
                    <p className="font-mono-tabular text-[11px] text-[#94A3B8]">
                      {activeTicket.wave} · {activeTicket.travelDate}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#05070A]/75 border border-emerald-500/30">
                    <p className="text-[11px] text-[#94A3B8]">Seat Number</p>
                    <p className="mt-0.5 font-mono-tabular text-xl font-bold text-[#10B981]">
                      Seat #{activeTicket.seatNumber}
                    </p>
                    <p className="font-mono-tabular text-[11px] text-[#94A3B8]">
                      Bus #{activeTicket.busNumber} · {activeTicket.plateNumber}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#05070A]/75 border border-white/10">
                    <p className="text-[11px] text-[#94A3B8]">Drop-Off Point</p>
                    <p className="mt-0.5 font-bold text-white">
                      {activeTicket.dropOffPoint ?? activeTicket.destination}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#05070A]/75 border border-white/10">
                    <p className="text-[11px] text-[#94A3B8]">
                      Locked Fare &amp; Escrow
                    </p>
                    <p className="mt-0.5 font-mono-tabular font-bold text-white">
                      {formatNaira(activeTicket.lockedFare)}
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${
                        activeTicketBus?.settlementStatus === 'payout_released'
                          ? 'text-[#10B981]'
                          : 'text-[#F59E0B]'
                      }`}
                    >
                      {activeTicketBus?.settlementStatus === 'payout_released'
                        ? 'Payout Released'
                        : 'Escrow Protected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Perforated Ticket Notches + Dashed Tear Line */}
              <div className="relative flex items-center my-1" aria-hidden="true">
                <span className="w-5 h-10 -ml-2.5 rounded-r-full bg-[#05070A] border-r border-y border-white/15 shrink-0" />
                <div className="flex-1 border-t border-dashed border-white/20 mx-2" />
                <span className="w-5 h-10 -mr-2.5 rounded-l-full bg-[#05070A] border-l border-y border-white/15 shrink-0" />
              </div>

              {/* Pure White Scannable QR Container */}
              <div className="p-5 sm:p-6 pt-3 flex flex-col items-center text-center">
                <div className="bg-white p-4 rounded-xl shadow-lg inline-flex flex-col items-center">
                  <QrCodeSvg value={activeTicket.txnRef} size={176} compact />
                  <p className="mt-2 font-mono-tabular text-[11px] font-bold tracking-wider text-slate-900">
                    {activeTicket.txnRef}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="font-mono-tabular text-xs text-[#94A3B8]">
                    TXN_REF:{' '}
                    <strong className="text-white">{activeTicket.txnRef}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyTxnRef(activeTicket.txnRef)}
                    aria-label={`Copy transaction reference ${activeTicket.txnRef}`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pass Actions: Save Pass Offline & Share Trip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSavePassOffline}
                className="h-12 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#10B981]" />
                {passSavedOffline ? 'Saved Offline' : 'Save Pass Offline'}
              </button>

              <button
                type="button"
                onClick={handleShareTrip}
                className="h-12 px-5 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-slate-200 hover:text-white font-semibold text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Trip
              </button>
            </div>

            {/* Footer Utility Links */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="text-[#94A3B8] hover:text-white font-medium transition-colors cursor-pointer"
              >
                ← Book Another Departure
              </button>
              <button
                type="button"
                onClick={() => onJumpToOperatorScan(activeTicket.txnRef)}
                className="text-[#10B981] hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
              >
                Verify Pass in Operator Portal →
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
