import type { RouteId } from './voyaTypes';

export type UserRole = 'student' | 'operator';

export type AuthMode = 'signin' | 'signup';

export type CampusOption =
  | 'LAUTECH, Ogbomoso'
  | 'OAU, Ile-Ife'
  | 'UI, Ibadan'
  | 'UNILORIN';

export type PreferredDestination = 'Lagos' | 'Ibadan' | 'Abuja' | 'Ilorin' | 'Osogbo';

export type FleetSizeOption = '1–5 Buses' | '6–15 Buses' | '15+ Buses';

export type BankNameOption =
  | 'GTBank'
  | 'Access'
  | 'Zenith'
  | 'FirstBank'
  | 'OPay'
  | 'Moniepoint';

export interface StudentOnboardingProfile {
  campus: CampusOption;
  phoneNumber: string;
  studentId?: string;
  preferredDestinations: PreferredDestination[];
  emergencyContactPhone: string;
}

export interface OperatorOnboardingProfile {
  parkName: string;
  primaryCorridor: string;
  fleetSize: FleetSizeOption;
  bankName: BankNameOption;
  accountNumber: string;
  accountName: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  onboardingCompleted: boolean;
  isDemo?: boolean;
  studentProfile?: StudentOnboardingProfile;
  operatorProfile?: OperatorOnboardingProfile;
}

export interface PendingBookingIntent {
  routeId: RouteId;
  travelDate: string;
  jumpToCapacity?: boolean;
}
