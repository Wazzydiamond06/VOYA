import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Bus,
  Check,
  GraduationCap,
  Landmark,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  BANK_OPTIONS,
  CAMPUS_OPTIONS,
  FLEET_SIZE_OPTIONS,
  OPERATOR_CORRIDOR_OPTIONS,
  PREFERRED_DESTINATIONS,
  routeIdToDestinationLabel,
  validateOperatorOnboardingStep1,
  validateOperatorOnboardingStep2,
  validateStudentOnboardingStep1,
  validateStudentOnboardingStep2,
} from '../lib/authEngine';
import type {
  AuthUser,
  BankNameOption,
  CampusOption,
  FleetSizeOption,
  OperatorOnboardingProfile,
  PendingBookingIntent,
  PreferredDestination,
  StudentOnboardingProfile,
} from '../lib/authTypes';
import { BusShowcasePanel, MobileBusBanner } from './BusShowcasePanel';
import { ThemeToggle } from './ThemeToggle';

interface OnboardingViewProps {
  user: AuthUser;
  pendingBooking: PendingBookingIntent | null;
  onCompleteStudent: (profile: StudentOnboardingProfile) => void;
  onCompleteOperator: (profile: OperatorOnboardingProfile) => void;
}

export function OnboardingView({
  user,
  pendingBooking,
  onCompleteStudent,
  onCompleteOperator,
}: OnboardingViewProps) {
  const isStudent = user.role === 'student';
  const [step, setStep] = useState<1 | 2>(1);

  // Student Onboarding State
  const initialDest = routeIdToDestinationLabel(pendingBooking?.routeId);
  const [campus, setCampus] = useState<CampusOption>('LAUTECH, Ogbomoso');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [preferredDestinations, setPreferredDestinations] = useState<
    PreferredDestination[]
  >(initialDest ? [initialDest] : ['Lagos']);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Operator Onboarding State
  const [parkName, setParkName] = useState('');
  const [primaryCorridor, setPrimaryCorridor] = useState<string>(
    OPERATOR_CORRIDOR_OPTIONS[0]
  );
  const [fleetSize, setFleetSize] = useState<FleetSizeOption>('6–15 Buses');
  const [bankName, setBankName] = useState<BankNameOption>('GTBank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const toggleDestination = (dest: PreferredDestination) => {
    setPreferredDestinations((prev) =>
      prev.includes(dest) ? prev.filter((d) => d !== dest) : [...prev, dest]
    );
    setErrors((prev) => ({ ...prev, preferredDestinations: undefined }));
  };

  const handleStudentStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateStudentOnboardingStep1({ campus, phoneNumber });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleStudentStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateStudentOnboardingStep2({
      preferredDestinations,
      emergencyContactPhone,
    });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    onCompleteStudent({
      campus,
      phoneNumber: phoneNumber.trim(),
      studentId: studentId.trim() || undefined,
      preferredDestinations,
      emergencyContactPhone: emergencyContactPhone.trim(),
    });
  };

  const handleOperatorStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateOperatorOnboardingStep1({
      parkName,
      primaryCorridor,
      fleetSize,
    });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleOperatorStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateOperatorOnboardingStep2({
      bankName,
      accountNumber,
      accountName,
    });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    onCompleteOperator({
      parkName: parkName.trim(),
      primaryCorridor,
      fleetSize,
      bankName,
      accountNumber: accountNumber.replace(/\D/g, ''),
      accountName: accountName.trim(),
    });
  };

  const inputFocusClass = isStudent
    ? 'focus:border-[#10B981] focus:ring-1 focus:ring-emerald-500/30'
    : 'focus:border-[#F59E0B] focus:ring-1 focus:ring-amber-500/30';

  const progressPercent = step === 1 ? 50 : 100;
  // Sync bus showcase dynamically: Step 1 -> Slide 1 (bus-2), Step 2 -> Slide 2 (bus-3)
  const activeBusSlide: 1 | 2 = step === 1 ? 1 : 2;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#05070A] text-white grid grid-cols-1 md:grid-cols-2 overflow-hidden">
      {/* ================================================================= */}
      {/* LEFT 50% VISUAL PANEL: Syncs dynamically to Step 1 / Step 2       */}
      {/* ================================================================= */}
      <BusShowcasePanel
        role={user.role}
        defaultSlideIndex={activeBusSlide}
        pendingBooking={pendingBooking}
      />

      {/* ================================================================= */}
      {/* RIGHT 50% FORM PANEL: Vertically Centered Onboarding Card         */}
      {/* ================================================================= */}
      <div className="relative flex flex-col justify-center items-center p-6 md:p-10 lg:p-12 bg-[#05070A]">
        {/* Ambient Role-Tinted Radial Glow */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-1/4 w-[420px] h-[280px] rounded-full blur-3xl ${
            isStudent ? 'bg-emerald-500/10' : 'bg-amber-500/10'
          }`}
        />

        <div className="relative w-full max-w-lg">
          <div className="flex items-center justify-between gap-3 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Account Setup · Step {step} of 2
            </p>
            <ThemeToggle variant="segmented" />
          </div>

          {/* Mobile Slim h-40 Top Banner Image synced to current step */}
          <MobileBusBanner role={user.role} slideIndex={activeBusSlide} />

          <div className="w-full rounded-2xl bg-[#0D131F]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden relative">
            <div
              aria-hidden="true"
              className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
                isStudent ? 'via-[#10B981]' : 'via-[#F59E0B]'
              } to-transparent`}
            />

            {/* Header & Role Badge */}
            <div className="flex items-center justify-between gap-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isStudent
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-[#10B981]'
                    : 'bg-amber-500/10 border-amber-500/30 text-[#F59E0B]'
                }`}
              >
                {isStudent ? (
                  <GraduationCap className="w-3.5 h-3.5" />
                ) : (
                  <Bus className="w-3.5 h-3.5" />
                )}
                <span>
                  {isStudent ? 'Student Onboarding' : 'Operator Onboarding'}
                </span>
              </div>

              <span className="text-xs font-semibold text-[#94A3B8] tabular-nums">
                Step {step} of 2
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Onboarding progress"
                className="h-2 w-full rounded-full bg-white/10 overflow-hidden"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isStudent
                      ? 'bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                      : 'bg-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span className={step === 1 ? 'text-white font-semibold' : ''}>
                  {isStudent ? '1. Campus & Alerts' : '1. Fleet & Park Details'}
                </span>
                <span className={step === 2 ? 'text-white font-semibold' : ''}>
                  {isStudent ? '2. Travel Preferences' : '2. Interswitch Payout Setup'}
                </span>
              </div>
            </div>

            {/* =============================================================== */}
            {/* STUDENT ONBOARDING (EMERALD THEME)                              */}
            {/* =============================================================== */}
            {isStudent && step === 1 && (
              <form
                onSubmit={handleStudentStep1Next}
                className="mt-7 space-y-5"
                noValidate
              >
                <div>
                  <h1 className="font-heading text-2xl font-bold text-white tracking-[-0.02em]">
                    Welcome, {user.fullName.split(' ')[0]}
                  </h1>
                  <p className="mt-1 text-sm text-[#94A3B8]">
                    Confirm your campus and WhatsApp number so VOYA can notify you before
                    departure waves lock.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="student-campus"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    University / Campus
                  </label>
                  <select
                    id="student-campus"
                    value={campus}
                    onChange={(e) => {
                      setCampus(e.target.value as CampusOption);
                      setErrors((prev) => ({ ...prev, campus: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white focus:outline-none min-h-[46px] cursor-pointer [&>option]:bg-[#0B1120] [&>option]:text-white ${inputFocusClass}`}
                  >
                    {CAMPUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.campus && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.campus}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="student-whatsapp"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="student-whatsapp"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                      }}
                      placeholder="+234 803 551 0921"
                      aria-describedby="student-whatsapp-hint"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 tabular-nums focus:outline-none min-h-[46px] ${inputFocusClass}`}
                    />
                  </div>
                  <p
                    id="student-whatsapp-hint"
                    className="mt-1.5 text-xs text-emerald-300/80"
                  >
                    Used for 20-min hostel boarding alerts
                  </p>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-400 font-medium" role="alert">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="student-matric-id"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Student ID / Matric Number{' '}
                    <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="student-matric-id"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2021/48219"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 tabular-nums focus:outline-none min-h-[46px] ${inputFocusClass}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] shadow-[0_0_24px_rgba(16,185,129,0.3)]"
                >
                  <span>Continue to Travel Preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {isStudent && step === 2 && (
              <form
                onSubmit={handleStudentStep2Submit}
                className="mt-7 space-y-5"
                noValidate
              >
                <div>
                  <h1 className="font-heading text-2xl font-bold text-white tracking-[-0.02em]">
                    Travel Preferences &amp; Safety
                  </h1>
                  <p className="mt-1 text-sm text-[#94A3B8]">
                    Pick the destinations you travel to most often so VOYA prioritizes
                    semester-break bus capacity on your routes.
                  </p>
                </div>

                <div>
                  <p className="block text-xs font-semibold text-slate-300 mb-2">
                    Frequent Destinations
                  </p>
                  <div
                    role="group"
                    aria-label="Frequent Destinations"
                    className="flex flex-wrap gap-2.5"
                  >
                    {PREFERRED_DESTINATIONS.map((dest) => {
                      const selected = preferredDestinations.includes(dest);
                      return (
                        <button
                          key={dest}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleDestination(dest)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all cursor-pointer min-h-[40px] ${
                            selected
                              ? 'bg-emerald-500/20 border-[#10B981] text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.22)]'
                              : 'bg-[#05070A]/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                          <span>{dest}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.preferredDestinations && (
                    <p className="mt-2 text-xs text-red-400 font-medium" role="alert">
                      {errors.preferredDestinations}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="student-emergency-phone"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Emergency Contact Phone Number
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="student-emergency-phone"
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => {
                        setEmergencyContactPhone(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          emergencyContactPhone: undefined,
                        }));
                      }}
                      placeholder="+234 802 910 4412 (Parent or Guardian)"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 tabular-nums focus:outline-none min-h-[46px] ${inputFocusClass}`}
                    />
                  </div>
                  {errors.emergencyContactPhone && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.emergencyContactPhone}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      setStep(1);
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-slate-200 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[48px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full flex-1 py-3 px-5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#05070A] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] shadow-[0_0_24px_rgba(16,185,129,0.3)]"
                  >
                    <span>Complete Setup &amp; Go to App</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* =============================================================== */}
            {/* TRANSPORT OPERATOR ONBOARDING (AMBER THEME)                     */}
            {/* =============================================================== */}
            {!isStudent && step === 1 && (
              <form
                onSubmit={handleOperatorStep1Next}
                className="mt-7 space-y-5"
                noValidate
              >
                <div>
                  <h1 className="font-heading text-2xl font-bold text-white tracking-[-0.02em]">
                    Fleet &amp; Park Details
                  </h1>
                  <p className="mt-1 text-sm text-[#94A3B8]">
                    Connect your park or transport union to receive real-time LAUTECH seat
                    shortage alerts and pre-filled 14-seat manifests.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="operator-park-name"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Park / Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="operator-park-name"
                      type="text"
                      value={parkName}
                      onChange={(e) => {
                        setParkName(e.target.value);
                        setErrors((prev) => ({ ...prev, parkName: undefined }));
                      }}
                      placeholder="e.g. Ojoo Express Motors / NURTW Ogbomoso"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none min-h-[46px] ${inputFocusClass}`}
                    />
                  </div>
                  {errors.parkName && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.parkName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="operator-corridor"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Primary Route Corridor
                  </label>
                  <select
                    id="operator-corridor"
                    value={primaryCorridor}
                    onChange={(e) => {
                      setPrimaryCorridor(e.target.value);
                      setErrors((prev) => ({ ...prev, primaryCorridor: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white focus:outline-none min-h-[46px] cursor-pointer [&>option]:bg-[#0B1120] [&>option]:text-white ${inputFocusClass}`}
                  >
                    {OPERATOR_CORRIDOR_OPTIONS.map((corridor) => (
                      <option key={corridor} value={corridor}>
                        {corridor}
                      </option>
                    ))}
                  </select>
                  {errors.primaryCorridor && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.primaryCorridor}
                    </p>
                  )}
                </div>

                <div>
                  <p className="block text-xs font-semibold text-slate-300 mb-2">
                    Available Fleet Size
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Available Fleet Size"
                    className="grid grid-cols-3 gap-2.5"
                  >
                    {FLEET_SIZE_OPTIONS.map((option) => {
                      const selected = fleetSize === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            setFleetSize(option);
                            setErrors((prev) => ({ ...prev, fleetSize: undefined }));
                          }}
                          className={`py-3 px-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer text-center tabular-nums min-h-[46px] ${
                            selected
                              ? 'bg-amber-500/20 border-[#F59E0B] text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.22)]'
                              : 'bg-[#05070A]/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {errors.fleetSize && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.fleetSize}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#05070A] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] shadow-[0_0_24px_rgba(245,158,11,0.3)]"
                >
                  <span>Continue to Payout Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {!isStudent && step === 2 && (
              <form
                onSubmit={handleOperatorStep2Submit}
                className="mt-7 space-y-5"
                noValidate
              >
                <div>
                  <h1 className="font-heading text-2xl font-bold text-white tracking-[-0.02em]">
                    Interswitch Payout Setup
                  </h1>
                  <p className="mt-1 text-sm text-[#94A3B8]">
                    Add the bank account where VOYA automatically releases escrowed bus
                    revenue upon QR boarding completion.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="operator-bank"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Bank Name
                  </label>
                  <div className="relative">
                    <Landmark className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="operator-bank"
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value as BankNameOption);
                        setErrors((prev) => ({ ...prev, bankName: undefined }));
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white focus:outline-none min-h-[46px] cursor-pointer [&>option]:bg-[#0B1120] [&>option]:text-white ${inputFocusClass}`}
                    >
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.bankName && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.bankName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="operator-account-number"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Account Number (10-digit NUBAN)
                  </label>
                  <input
                    id="operator-account-number"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setErrors((prev) => ({ ...prev, accountNumber: undefined }));
                    }}
                    placeholder="0148293011"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 tabular-nums focus:outline-none min-h-[46px] ${inputFocusClass}`}
                  />
                  {errors.accountNumber && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="operator-account-name"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Account Name
                  </label>
                  <input
                    id="operator-account-name"
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      setErrors((prev) => ({ ...prev, accountName: undefined }));
                    }}
                    placeholder="e.g. OJOO EXPRESS TRANSPORT LTD"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#05070A]/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none min-h-[46px] ${inputFocusClass}`}
                  />
                  {errors.accountName && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium" role="alert">
                      {errors.accountName}
                    </p>
                  )}
                </div>

                {/* Interswitch Split Payments Trust Badge */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-center gap-2.5 text-xs text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span className="font-medium">
                    Secured via Interswitch Split Payments &amp; Payouts API
                  </span>
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      setStep(1);
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-slate-200 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[48px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full flex-1 py-3 px-5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#05070A] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] shadow-[0_0_24px_rgba(245,158,11,0.3)]"
                  >
                    <span>Launch Operator Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
