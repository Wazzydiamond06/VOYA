import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { AuthView } from './components/AuthView';
import { LandingView } from './components/LandingView';
import { OnboardingView } from './components/OnboardingView';
import { OperatorPortalView } from './components/OperatorPortalView';
import { StudentAppView } from './components/StudentAppView';
import { TopNav } from './components/TopNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import type {
  AuthMode,
  OperatorOnboardingProfile,
  StudentOnboardingProfile,
  UserRole,
} from './lib/authTypes';
import {
  STANDARD_BUS_CAPACITY,
  bookSeatAction,
  createInitialVoyaState,
  deployBusAction,
  getDefaultTravelDate,
  joinVirtualQueueAction,
  toggleBusSettlementAction,
  verifyBoardingAndReleasePayoutAction,
} from './lib/voyaEngine';
import type {
  AppSection,
  DepartureWave,
  OperatorTab,
  RouteId,
  StudentStep,
  Ticket,
  VirtualQueueReceipt,
  VoyaState,
} from './lib/voyaTypes';

function VoyaAppShell() {
  const {
    user,
    authIntentRole,
    authInitialMode,
    pendingBooking,
    setAuthIntent,
    setPendingBooking,
    signIn,
    signUp,
    instantDemoAccess,
    completeStudentOnboarding,
    completeOperatorOnboarding,
    signOut,
  } = useAuth();

  const [voyaState, setVoyaState] = useState<VoyaState>(() => createInitialVoyaState());
  const [activeSection, setActiveSection] = useState<AppSection>('home');

  const [studentInitialRoute, setStudentInitialRoute] = useState<RouteId>('ibadan');
  const [studentInitialDate, setStudentInitialDate] = useState<string>(getDefaultTravelDate);
  const [studentInitialStep, setStudentInitialStep] = useState<StudentStep>('search');
  const [activeTicketTxnRef, setActiveTicketTxnRef] = useState<string | null>(
    'VOYA-TRN-849201'
  );
  const [operatorInitialTab, setOperatorInitialTab] = useState<OperatorTab>('dashboard');
  const [operatorPrefillRef, setOperatorPrefillRef] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHomeSection = (sectionId: string) => {
    if (activeSection !== 'home') {
      setActiveSection('home');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openAuthForRole = (role: UserRole, mode: AuthMode = 'signin') => {
    setAuthIntent(role, mode);
    setActiveSection('auth');
    scrollToTop();
  };

  const routeToStudentAppWithPending = (override?: {
    routeId: RouteId;
    travelDate: string;
    jumpToCapacity?: boolean;
  }) => {
    const intent = override ?? pendingBooking;
    if (intent) {
      setStudentInitialRoute(intent.routeId);
      setStudentInitialDate(intent.travelDate);
      setStudentInitialStep(intent.jumpToCapacity ? 'capacity' : 'search');
      setPendingBooking(null);
    } else {
      setStudentInitialStep('search');
    }
    setActiveSection('student');
    scrollToTop();
  };

  const handleQuickSearchBook = (params: {
    routeId: RouteId;
    travelDate: string;
    jumpToCapacity?: boolean;
  }) => {
    // Save selected route/date in state so Auth & Onboarding preserve it
    setPendingBooking(params);
    setStudentInitialRoute(params.routeId);
    setStudentInitialDate(params.travelDate);
    setStudentInitialStep(params.jumpToCapacity ? 'capacity' : 'search');

    if (user?.role === 'student') {
      if (!user.onboardingCompleted) {
        setActiveSection('onboarding');
        scrollToTop();
        return;
      }
      routeToStudentAppWithPending(params);
      return;
    }

    openAuthForRole('student', 'signin');
  };

  const handleOpenStudentEntry = () => {
    if (user?.role === 'student') {
      if (!user.onboardingCompleted) {
        setActiveSection('onboarding');
        scrollToTop();
        return;
      }
      routeToStudentAppWithPending();
      return;
    }

    openAuthForRole('student', 'signin');
  };

  const handleOpenOperatorEntry = (
    tab: OperatorTab = 'dashboard',
    prefillRef = '',
    bypassAuthForQrDemo = false
  ) => {
    setOperatorInitialTab(tab);
    setOperatorPrefillRef(prefillRef);

    if (bypassAuthForQrDemo) {
      setActiveSection('operator');
      scrollToTop();
      return;
    }

    if (user?.role === 'operator') {
      if (!user.onboardingCompleted) {
        setActiveSection('onboarding');
        scrollToTop();
        return;
      }
      setActiveSection('operator');
      scrollToTop();
      return;
    }

    openAuthForRole('operator', 'signin');
  };

  const handleOpenUserDashboard = () => {
    if (!user) {
      openAuthForRole('student', 'signin');
      return;
    }
    if (!user.onboardingCompleted) {
      setActiveSection('onboarding');
      scrollToTop();
      return;
    }
    if (user.role === 'student') {
      routeToStudentAppWithPending();
    } else {
      setActiveSection('operator');
      scrollToTop();
    }
  };

  const handleSignInSubmit = (params: {
    role: UserRole;
    email: string;
    password: string;
  }) => {
    const signedIn = signIn(params);
    showToast(
      `Signed in as ${signedIn.fullName} (${
        signedIn.role === 'student' ? 'Student' : 'Transport Operator'
      }).`
    );
    if (signedIn.role === 'student') {
      routeToStudentAppWithPending();
    } else {
      setActiveSection('operator');
      scrollToTop();
    }
  };

  const handleSignUpSubmit = (params: {
    role: UserRole;
    fullName: string;
    email: string;
    password: string;
  }) => {
    const created = signUp(params);
    showToast(
      `Account created for ${created.fullName}. Complete 2 quick steps to finish setup.`
    );
    setActiveSection('onboarding');
    scrollToTop();
  };

  const handleInstantDemo = (role: UserRole) => {
    const demoUser = instantDemoAccess(role);
    showToast(
      `Instant Demo Access active: ${demoUser.fullName} (${
        role === 'student' ? 'Student' : 'Operator'
      }).`
    );
    if (role === 'student') {
      routeToStudentAppWithPending();
    } else {
      setActiveSection('operator');
      scrollToTop();
    }
  };

  const handleCompleteStudentOnboarding = (profile: StudentOnboardingProfile) => {
    completeStudentOnboarding(profile);
    showToast(
      `Profile ready (${profile.campus}). Hostel boarding alerts linked to ${profile.phoneNumber}.`
    );
    routeToStudentAppWithPending();
  };

  const handleCompleteOperatorOnboarding = (profile: OperatorOnboardingProfile) => {
    completeOperatorOnboarding(profile);
    showToast(
      `${profile.parkName} connected. Interswitch payouts linked to ${profile.bankName}.`
    );
    setActiveSection('operator');
    scrollToTop();
  };

  const handleSignOut = () => {
    signOut();
    setActiveSection('home');
    scrollToTop();
    showToast('Signed out of VOYA.');
  };

  const handleJoinVirtualQueue = (params: {
    routeId: RouteId;
    wave: DepartureWave;
    travelDate: string;
  }): VirtualQueueReceipt => {
    const result = joinVirtualQueueAction(voyaState, params);
    setVoyaState(result.state);
    const route = result.state.routes.find((r) => r.id === params.routeId);
    showToast(
      `Virtual queue confirmed: ${route?.destination ?? params.routeId} position #${result.position}.`
    );
    return result.state.queueReceipts[0];
  };

  const handleCompleteBooking = (params: {
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
  }): Ticket | null => {
    const result = bookSeatAction(voyaState, params);
    if (!result.ticket) {
      showToast(result.error ?? 'Unable to allocate seat.');
      return null;
    }
    setVoyaState(result.state);
    setActiveTicketTxnRef(result.ticket.txnRef);
    showToast(
      `Escrow confirmed: ${result.ticket.txnRef} issued for Bus #${result.ticket.busNumber}, Seat #${result.ticket.seatNumber}.`
    );
    return result.ticket;
  };

  const handleDeployBus = (payload: {
    routeId: RouteId;
    plateNumber: string;
    lockedFare: number;
    wave: DepartureWave;
  }) => {
    const result = deployBusAction(voyaState, payload);
    setVoyaState(result.state);
    const route = result.state.routes.find((r) => r.id === payload.routeId);
    showToast(
      `+${STANDARD_BUS_CAPACITY} seat bus deployed: ${payload.plateNumber} added to ${route?.destination ?? payload.routeId}.`
    );
  };

  const handleMarkBoarded = (txnRef: string): boolean => {
    const result = verifyBoardingAndReleasePayoutAction(voyaState, txnRef);
    if (!result.ticket) return false;
    setVoyaState(result.state);
    const busSuffix = result.updatedBus
      ? ` · Bus #${result.updatedBus.busNumber} payout released to bank (${result.updatedBus.payoutReleasedAt ?? result.timestamp}).`
      : '.';
    showToast(
      `Seat #${result.ticket.seatNumber} Verified — Boarded (${result.ticket.studentName})${busSuffix}`
    );
    return true;
  };

  const handleToggleBusSettlement = (busId: string) => {
    const result = toggleBusSettlementAction(voyaState, busId);
    if (!result.updatedBus) return;
    setVoyaState(result.state);
    const label =
      result.updatedBus.settlementStatus === 'payout_released'
        ? 'Payout Released'
        : 'In Escrow';
    showToast(
      `Settlement updated: Bus #${result.updatedBus.busNumber} (${result.updatedBus.plateNumber}) → ${label}.`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05070A] text-white">
      <TopNav
        activeSection={activeSection}
        user={user}
        onNavigate={(section) => {
          setActiveSection(section);
          scrollToTop();
        }}
        onNavigateHomeSection={handleNavigateHomeSection}
        onBookSeat={handleOpenStudentEntry}
        onOpenOperator={() => handleOpenOperatorEntry('dashboard')}
        onOpenDashboard={handleOpenUserDashboard}
        onSignOut={handleSignOut}
      />

      {/* Global Live Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 sm:top-auto sm:bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-[#0D131F]/95 backdrop-blur-xl text-white px-4 py-3 rounded-xl border border-emerald-500/35 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 bg-[#05070A]">
        {activeSection === 'home' && (
          <LandingView
            routes={voyaState.routes}
            onQuickSearchBook={handleQuickSearchBook}
            onBookStudent={handleOpenStudentEntry}
            onOpenOperatorPortal={() => handleOpenOperatorEntry('dashboard')}
            onNavigateSection={handleNavigateHomeSection}
            onNotify={showToast}
          />
        )}

        {activeSection === 'auth' && (
          <AuthView
            initialRole={authIntentRole}
            initialMode={authInitialMode}
            pendingBooking={pendingBooking}
            onSignIn={handleSignInSubmit}
            onSignUp={handleSignUpSubmit}
            onInstantDemo={handleInstantDemo}
            onBackHome={() => {
              setActiveSection('home');
              scrollToTop();
            }}
          />
        )}

        {activeSection === 'onboarding' && user && (
          <OnboardingView
            user={user}
            pendingBooking={pendingBooking}
            onCompleteStudent={handleCompleteStudentOnboarding}
            onCompleteOperator={handleCompleteOperatorOnboarding}
          />
        )}

        {activeSection === 'student' && (
          <StudentAppView
            state={voyaState}
            initialRouteId={studentInitialRoute}
            initialTravelDate={studentInitialDate}
            initialStep={studentInitialStep}
            defaultStudentName={user?.role === 'student' ? user.fullName : ''}
            defaultPhoneNumber={
              user?.role === 'student' ? user.studentProfile?.phoneNumber ?? '' : ''
            }
            defaultEmail={user?.email ?? 'student@lautech.edu.ng'}
            defaultNextOfKinPhone={
              user?.role === 'student'
                ? user.studentProfile?.emergencyContactPhone ?? ''
                : ''
            }
            activeTicketTxnRef={activeTicketTxnRef}
            onSelectActiveTicket={(txnRef) => setActiveTicketTxnRef(txnRef)}
            onJoinVirtualQueue={handleJoinVirtualQueue}
            onCompleteBooking={handleCompleteBooking}
            onJumpToOperatorScan={(txnRef) =>
              handleOpenOperatorEntry('boarding', txnRef, true)
            }
            onNotify={showToast}
          />
        )}

        {activeSection === 'operator' && (
          <OperatorPortalView
            state={voyaState}
            initialTab={operatorInitialTab}
            prefilledTxnRef={operatorPrefillRef}
            onDeployBus={handleDeployBus}
            onMarkBoarded={handleMarkBoarded}
            onToggleBusSettlement={handleToggleBusSettlement}
          />
        )}
      </main>

      {activeSection !== 'home' && (
        <footer className="bg-[#0A0F18] border-t border-white/10 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-extrabold text-white">VOYA</span>
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
              />
              <span>· LAUTECH Pilot, Ogbomoso, Nigeria</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveSection('home');
                  scrollToTop();
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={handleOpenStudentEntry}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Student App
              </button>
              <button
                type="button"
                onClick={() => handleOpenOperatorEntry('dashboard')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Operator Portal
              </button>
              <span>Secured by Interswitch IPG</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VoyaAppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
