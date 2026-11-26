import type {
  AuthMode,
  AuthUser,
  BankNameOption,
  CampusOption,
  FleetSizeOption,
  PreferredDestination,
  UserRole,
} from './authTypes';
import type { RouteId } from './voyaTypes';

export const CAMPUS_OPTIONS: CampusOption[] = [
  'LAUTECH, Ogbomoso',
  'OAU, Ile-Ife',
  'UI, Ibadan',
  'UNILORIN',
];

export const PREFERRED_DESTINATIONS: PreferredDestination[] = [
  'Lagos',
  'Ibadan',
  'Abuja',
  'Ilorin',
  'Osogbo',
];

export const OPERATOR_CORRIDOR_OPTIONS: string[] = [
  'LAUTECH → Lagos',
  'LAUTECH → Ibadan',
  'LAUTECH → Abuja',
  'LAUTECH → Ilorin',
  'Multi-Corridor (Oyo / Kwara)',
];

export const FLEET_SIZE_OPTIONS: FleetSizeOption[] = [
  '1–5 Buses',
  '6–15 Buses',
  '15+ Buses',
];

export const BANK_OPTIONS: BankNameOption[] = [
  'GTBank',
  'Access',
  'Zenith',
  'FirstBank',
  'OPay',
  'Moniepoint',
];

export function routeIdToDestinationLabel(routeId?: RouteId): PreferredDestination | null {
  switch (routeId) {
    case 'lagos':
      return 'Lagos';
    case 'ibadan':
      return 'Ibadan';
    case 'abuja':
      return 'Abuja';
    case 'ilorin':
      return 'Ilorin';
    default:
      return null;
  }
}

export function validateAuthForm(input: {
  mode: AuthMode;
  fullName: string;
  email: string;
  password: string;
}): {
  valid: boolean;
  errors: { fullName?: string; email?: string; password?: string };
} {
  const errors: { fullName?: string; email?: string; password?: string } = {};

  if (input.mode === 'signup' && input.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name (at least 2 characters).';
  }

  const trimmedEmail = input.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStudentOnboardingStep1(input: {
  campus: string;
  phoneNumber: string;
}): {
  valid: boolean;
  errors: { campus?: string; phoneNumber?: string };
} {
  const errors: { campus?: string; phoneNumber?: string } = {};

  if (!input.campus.trim()) {
    errors.campus = 'Select your campus.';
  }

  const digits = input.phoneNumber.replace(/\D/g, '');
  if (digits.length < 10) {
    errors.phoneNumber = 'Enter a valid Nigerian phone or WhatsApp number (min. 10 digits).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStudentOnboardingStep2(input: {
  preferredDestinations: PreferredDestination[];
  emergencyContactPhone: string;
}): {
  valid: boolean;
  errors: { preferredDestinations?: string; emergencyContactPhone?: string };
} {
  const errors: { preferredDestinations?: string; emergencyContactPhone?: string } = {};

  if (input.preferredDestinations.length === 0) {
    errors.preferredDestinations = 'Select at least one frequent travel destination.';
  }

  const digits = input.emergencyContactPhone.replace(/\D/g, '');
  if (digits.length < 10) {
    errors.emergencyContactPhone = 'Enter a valid emergency contact phone number (min. 10 digits).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateOperatorOnboardingStep1(input: {
  parkName: string;
  primaryCorridor: string;
  fleetSize: string;
}): {
  valid: boolean;
  errors: { parkName?: string; primaryCorridor?: string; fleetSize?: string };
} {
  const errors: { parkName?: string; primaryCorridor?: string; fleetSize?: string } = {};

  if (input.parkName.trim().length < 2) {
    errors.parkName = 'Enter your park, union, or fleet company name.';
  }

  if (!input.primaryCorridor.trim()) {
    errors.primaryCorridor = 'Select your primary route corridor.';
  }

  if (!input.fleetSize.trim()) {
    errors.fleetSize = 'Select your available fleet size.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateOperatorOnboardingStep2(input: {
  bankName: string;
  accountNumber: string;
  accountName: string;
}): {
  valid: boolean;
  errors: { bankName?: string; accountNumber?: string; accountName?: string };
} {
  const errors: { bankName?: string; accountNumber?: string; accountName?: string } = {};

  if (!input.bankName.trim()) {
    errors.bankName = 'Select a settlement bank.';
  }

  const digits = input.accountNumber.replace(/\D/g, '');
  if (digits.length !== 10) {
    errors.accountNumber = 'Enter a valid 10-digit NUBAN account number.';
  }

  if (input.accountName.trim().length < 3) {
    errors.accountName = 'Enter the registered settlement account name.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function deriveDisplayNameFromEmail(email: string, role: UserRole): string {
  const localPart = email.split('@')[0]?.trim() ?? '';
  if (!localPart) {
    return role === 'student' ? 'LAUTECH Student' : 'VOYA Fleet Partner';
  }
  const formatted = localPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return formatted || (role === 'student' ? 'LAUTECH Student' : 'VOYA Fleet Partner');
}

export function createDemoUser(role: UserRole): AuthUser {
  if (role === 'student') {
    return {
      id: 'demo-student-lautech',
      fullName: 'Adebayo Toluwanimi',
      email: 'tolu.adebayo@student.lautech.edu.ng',
      role: 'student',
      onboardingCompleted: true,
      isDemo: true,
      studentProfile: {
        campus: 'LAUTECH, Ogbomoso',
        phoneNumber: '+234 803 551 0921',
        studentId: '2021/48219',
        preferredDestinations: ['Lagos', 'Ibadan'],
        emergencyContactPhone: '+234 802 910 4412',
      },
    };
  }

  return {
    id: 'demo-operator-ojoo',
    fullName: 'Ojoo Express Motors',
    email: 'dispatch@ojooexpress.ng',
    role: 'operator',
    onboardingCompleted: true,
    isDemo: true,
    operatorProfile: {
      parkName: 'Ojoo Express Motors · Ogbomoso',
      primaryCorridor: 'LAUTECH → Lagos',
      fleetSize: '6–15 Buses',
      bankName: 'GTBank',
      accountNumber: '0148293011',
      accountName: 'OJOO EXPRESS TRANSPORT LTD',
    },
  };
}

export function createSignedInUser(params: {
  role: UserRole;
  email: string;
}): AuthUser {
  const baseDemo = createDemoUser(params.role);
  const cleanEmail = params.email.trim().toLowerCase();
  return {
    ...baseDemo,
    id: `user-${params.role}-${Date.now()}`,
    fullName: deriveDisplayNameFromEmail(cleanEmail, params.role),
    email: cleanEmail,
    onboardingCompleted: true,
    isDemo: false,
  };
}

export function createSignedUpUser(params: {
  role: UserRole;
  fullName: string;
  email: string;
}): AuthUser {
  return {
    id: `user-${params.role}-${Date.now()}`,
    fullName: params.fullName.trim(),
    email: params.email.trim().toLowerCase(),
    role: params.role,
    onboardingCompleted: false,
    isDemo: false,
  };
}
