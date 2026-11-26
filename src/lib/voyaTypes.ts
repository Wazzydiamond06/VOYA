export type RouteId = 'lagos' | 'ibadan' | 'abuja' | 'ilorin';

export type DepartureWave = '7:00 AM' | '9:00 AM' | '11:00 AM';

export type AppSection = 'home' | 'auth' | 'onboarding' | 'student' | 'operator';

export type StudentStep = 'search' | 'capacity' | 'checkout' | 'ticket';

export type OperatorTab = 'dashboard' | 'boarding';

export type SettlementStatus = 'in_escrow' | 'payout_released';

export type TicketStatus = 'confirmed' | 'boarded';

export interface BusUnit {
  id: string;
  routeId: RouteId;
  busNumber: number;
  plateNumber: string;
  capacity: number;
  bookedSeats: number;
  bookedSeatNumbers?: number[];
  wave: DepartureWave;
  lockedFare: number;
  settlementStatus: SettlementStatus;
  payoutReleasedAt?: string;
}

export interface RouteData {
  id: RouteId;
  origin: string;
  destination: string;
  terminal: string;
  corridorCode: string;
  durationHours: string;
  requests: number;
  confirmedSeats: number;
  availableSeats: number;
  fare: number;
  waves: DepartureWave[];
  buses: BusUnit[];
}

export interface Ticket {
  txnRef: string;
  studentName: string;
  phoneNumber: string;
  email?: string;
  nextOfKinPhone?: string;
  boardingPoint?: string;
  dropOffPoint?: string;
  routeId: RouteId;
  origin: string;
  destination: string;
  travelDate: string;
  wave: DepartureWave;
  busId: string;
  busNumber: number;
  plateNumber: string;
  seatNumber: number;
  lockedFare: number;
  demoPaidAmount: number;
  status: TicketStatus;
  createdAt: string;
}

export interface VirtualQueueReceipt {
  routeId: RouteId;
  destination: string;
  wave: DepartureWave;
  travelDate: string;
  position: number;
  registeredAt: string;
}

export interface InterswitchPaymentData {
  txnRef: string;
  studentName: string;
  phoneNumber: string;
  email: string;
  nextOfKinPhone: string;
  routeId: RouteId;
  destination: string;
  travelDate: string;
  wave: DepartureWave;
  busId: string;
  seatNumber: number;
  boardingPoint: string;
  dropOffPoint: string;
  lockedFare: number;
  demoAmountNaira: number;
  amountKobo: number;
  currency: number;
}

export interface StopOption {
  id: string;
  name: string;
  detail: string;
}

export interface DepartureBusCard {
  wave: DepartureWave;
  departureTime: string;
  arrivalTime: string;
  durationLabel: string;
  busId: string | null;
  busNumber: number;
  plateNumber: string;
  vehicleLabel: string;
  bookedSeats: number;
  capacity: number;
  seatsRemaining: number;
  fillPercent: number;
  lockedFare: number;
  isFull: boolean;
}

export interface BusSeatSlot {
  seatNumber: number;
  status: 'available' | 'booked';
}

export interface VoyaState {
  routes: RouteData[];
  tickets: Ticket[];
  queueReceipts: VirtualQueueReceipt[];
  nextTxnSequence: number;
}

export interface DashboardKpis {
  totalStudentDemand: number;
  confirmedSeats: number;
  activeSeatShortage: number;
  escrowBalance: number;
  releasedPayouts: number;
  totalBuses: number;
}

export interface WaveCapacitySnapshot {
  hasSeatsAvailable: boolean;
  seatsRemainingTotal: number;
  shortage: number;
  activeBusNumber: number;
  activeBusPlate: string;
  activeBusSeatsFilled: number;
  activeBusCapacity: number;
  seatsLeftToUnlock: number;
  fillPercent: number;
}
