import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  createDemoUser,
  createSignedInUser,
  createSignedUpUser,
} from '../lib/authEngine';
import type {
  AuthMode,
  AuthUser,
  OperatorOnboardingProfile,
  PendingBookingIntent,
  StudentOnboardingProfile,
  UserRole,
} from '../lib/authTypes';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authIntentRole: UserRole;
  authInitialMode: AuthMode;
  pendingBooking: PendingBookingIntent | null;
  setAuthIntent: (role: UserRole, mode?: AuthMode) => void;
  setPendingBooking: (intent: PendingBookingIntent | null) => void;
  signIn: (params: { role: UserRole; email: string; password: string }) => AuthUser;
  signUp: (params: {
    role: UserRole;
    fullName: string;
    email: string;
    password: string;
  }) => AuthUser;
  instantDemoAccess: (role: UserRole) => AuthUser;
  completeStudentOnboarding: (profile: StudentOnboardingProfile) => AuthUser | null;
  completeOperatorOnboarding: (profile: OperatorOnboardingProfile) => AuthUser | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO: Connect Supabase/Firebase Auth here (e.g. subscribe to onAuthStateChanged / supabase.auth.onAuthStateChange)
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authIntentRole, setAuthIntentRole] = useState<UserRole>('student');
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('signin');
  const [pendingBooking, setPendingBooking] = useState<PendingBookingIntent | null>(null);

  const setAuthIntent = (role: UserRole, mode: AuthMode = 'signin') => {
    setAuthIntentRole(role);
    setAuthInitialMode(mode);
  };

  const signIn = (params: {
    role: UserRole;
    email: string;
    password: string;
  }): AuthUser => {
    // TODO: Connect Supabase/Firebase Auth here (e.g. signInWithEmailAndPassword / supabase.auth.signInWithPassword)
    const authenticatedUser = createSignedInUser({
      role: params.role,
      email: params.email,
    });
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const signUp = (params: {
    role: UserRole;
    fullName: string;
    email: string;
    password: string;
  }): AuthUser => {
    // TODO: Connect Supabase/Firebase Auth here (e.g. createUserWithEmailAndPassword / supabase.auth.signUp)
    const createdUser = createSignedUpUser({
      role: params.role,
      fullName: params.fullName,
      email: params.email,
    });
    setUser(createdUser);
    return createdUser;
  };

  const instantDemoAccess = (role: UserRole): AuthUser => {
    // TODO: Connect Supabase/Firebase Auth here (replace demo session with anonymous or seeded demo account)
    const demoUser = createDemoUser(role);
    setUser(demoUser);
    return demoUser;
  };

  const completeStudentOnboarding = (
    profile: StudentOnboardingProfile
  ): AuthUser | null => {
    if (!user) return null;
    // TODO: Connect Supabase/Firebase Auth here (persist student campus, WhatsApp alert number & preferences to DB)
    const updated: AuthUser = {
      ...user,
      role: 'student',
      onboardingCompleted: true,
      studentProfile: profile,
    };
    setUser(updated);
    return updated;
  };

  const completeOperatorOnboarding = (
    profile: OperatorOnboardingProfile
  ): AuthUser | null => {
    if (!user) return null;
    // TODO: Connect Supabase/Firebase Auth here (persist fleet profile & Interswitch settlement sub-account to DB)
    const updated: AuthUser = {
      ...user,
      role: 'operator',
      onboardingCompleted: true,
      operatorProfile: profile,
    };
    setUser(updated);
    return updated;
  };

  const signOut = () => {
    // TODO: Connect Supabase/Firebase Auth here (e.g. signOut(auth) / supabase.auth.signOut())
    setUser(null);
    setPendingBooking(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
