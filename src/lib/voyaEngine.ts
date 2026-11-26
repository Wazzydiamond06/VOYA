import type {
  BusSeatSlot,
  BusUnit,
  DashboardKpis,
  DepartureBusCard,
  DepartureWave,
  RouteData,
  RouteId,
  StopOption,
  Ticket,
  VoyaState,
  WaveCapacitySnapshot,
} from './voyaTypes';

export const STANDARD_BUS_CAPACITY = 14;
export const DEMO_INTERSWITCH_AMOUNT = 10;
export const DEFAULT_ORIGIN = 'LAUTECH, Ogbomoso';

export const DEPARTURE_WAVES: DepartureWave[] = ['7:00 AM', '9:00 AM', '11:00 AM'];

export const BOARDING_POINTS: StopOption[] = [
  {
    id: 'lautech-main-gate',
    name: 'LAUTECH Main Gate',
    detail: 'Main Campus Arch · 20 mins before wave',
  },
  {
    id: 'under-g-park',
    name: 'Under-G Park',
    detail: 'Hostel Shuttle Bay · 10 mins before wave',
  },
  {
    id: 'takie-park',
    name: 'Takie Park',
    detail: 'Ogbomoso Dispatch Hub · Final boarding',
  },
];

export const DROP_OFF_POINTS_BY_ROUTE: Record<RouteId, StopOption[]> = {
  lagos: [
    { id: 'berger', name: 'Berger', detail: 'Lagos-Ibadan Expressway Entry' },
    { id: 'ojota', name: 'Ojota', detail: 'New Garage Interstate Terminal' },
    { id: 'jibowu', name: 'Jibowu', detail: 'Mainland Central Transit Hub' },
  ],
  ibadan: [
    { id: 'ojoo', name: 'Ojoo Terminal', detail: 'Modern Oyo State Bus Terminal' },
    { id: 'iwo-road', name: 'Iwo Road', detail: 'Express Interchange Stop' },
    { id: 'challenge', name: 'Challenge', detail: 'South Ibadan Motor Hub' },
  ],
  abuja: [
    { id: 'gwagwalada', name: 'Gwagwalada', detail: 'UniAbuja Corridor Drop-off' },
    { id: 'zuba', name: 'Zuba', detail: 'FCT North Gate Interchange' },
    { id: 'utako', name: 'Utako Terminal', detail: 'Central Abuja Interstate Hub' },
  ],
  ilorin: [
    { id: 'oja-oba', name: 'Oja Oba', detail: 'Central Ilorin Drop-off' },
    { id: 'tanke', name: 'Tanke', detail: 'University Road Junction' },
    { id: 'maraba', name: 'Maraba Hub', detail: 'Main Interstate Park' },
  ],
};

const ROUTE_DURATION_META: Record<RouteId, { minutes: number; label: string }> = {
  lagos: { minutes: 225, label: '~3h 45m' },
  ibadan: { minutes: 110, label: '~1h 50m' },
  abuja: { minutes: 450, label: '~7h 30m' },
  ilorin: { minutes: 75, label: '~1h 15m' },
};

export function createInitialVoyaState(): VoyaState {
  const routes: RouteData[] = [
    {
      id: 'lagos',
      origin: DEFAULT_ORIGIN,
      destination: 'Lagos',
      terminal: 'Ojota / Berger Park',
      corridorCode: 'OGB-LOS',
      durationHours: '3h 45m',
      requests: 42,
      confirmedSeats: 28,
      availableSeats: 28,
      fare: 12500,
      waves: [...DEPARTURE_WAVES],
      buses: [
        {
          id: 'bus-lagos-1',
          routeId: 'lagos',
          busNumber: 1,
          plateNumber: 'OYO-419-LA',
          capacity: STANDARD_BUS_CAPACITY,
          bookedSeats: 14,
          wave: '7:00 AM',
          lockedFare: 12500,
          settlementStatus: 'in_escrow',
        },
        {
          id: 'bus-lagos-2',
          routeId: 'lagos',
          busNumber: 2,
          plateNumber: 'KJA-782-XV',
          capacity: STANDARD_BUS_CAPACITY,
          bookedSeats: 14,
          wave: '9:00 AM',
          lockedFare: 12500,
          settlementStatus: 'in_escrow',
        },
      ],
    },
    {
      id: 'ibadan',
      origin: DEFAULT_ORIGIN,
      destination: 'Ibadan',
      terminal: 'Iwo Road / Challenge',
      corridorCode: 'OGB-IBD',
      durationHours: '1h 50m',
      requests: 13,
      confirmedSeats: 13,
      availableSeats: 14,
      fare: 4500,
      waves: [...DEPARTURE_WAVES],
      buses: [
        {
          id: 'bus-ibadan-1',
          routeId: 'ibadan',
          busNumber: 1,
          plateNumber: 'OYO-204-OG',
          capacity: STANDARD_BUS_CAPACITY,
          bookedSeats: 13,
          wave: '7:00 AM',
          lockedFare: 4500,
          settlementStatus: 'in_escrow',
        },
      ],
    },
    {
      id: 'abuja',
      origin: DEFAULT_ORIGIN,
      destination: 'Abuja',
      terminal: 'Utako / Zuba Terminal',
      corridorCode: 'OGB-ABJ',
      durationHours: '7h 30m',
      requests: 35,
      confirmedSeats: 14,
      availableSeats: 14,
      fare: 24000,
      waves: [...DEPARTURE_WAVES],
      buses: [
        {
          id: 'bus-abuja-1',
          routeId: 'abuja',
          busNumber: 1,
          plateNumber: 'ABJ-901-KU',
          capacity: STANDARD_BUS_CAPACITY,
          bookedSeats: 14,
          wave: '7:00 AM',
          lockedFare: 24000,
          settlementStatus: 'in_escrow',
        },
      ],
    },
    {
      id: 'ilorin',
      origin: DEFAULT_ORIGIN,
      destination: 'Ilorin',
      terminal: 'Tanke / Maraba Hub',
      corridorCode: 'OGB-ILR',
      durationHours: '1h 15m',
      requests: 22,
      confirmedSeats: 22,
      availableSeats: 28,
      fare: 3500,
      waves: [...DEPARTURE_WAVES],
      buses: [
        {
          id: 'bus-ilorin-1',
          routeId: 'ilorin',
          busNumber: 1,
          plateNumber: 'KWR-311-IL',
          capacity: STANDARD_BUS_CAPACITY,
          bookedSeats: 14,
          wave: '7:00 AM',
          lockedFare: 3500,
          settlementStatus: 'payout_released',
          payoutReleasedAt: '06:05 WAT',
        },
        {
          id: 'bus-ilorin-2',
          routeId: 'ilorin',
          busNumber: 2,
          plateNumber: 'OYO-655-LA',
          capacity: STANDARD_BUS_CAPACITY,
          bookedSeats: 8,
          wave: '9:00 AM',
          lockedFare: 3500,
          settlementStatus: 'in_escrow',
        },
      ],
    },
  ];

  const tickets: Ticket[] = [
    {
      txnRef: 'VOYA-TRN-849201',
      studentName: 'Adebayo Oluwaseun',
      phoneNumber: '08034192840',
      routeId: 'lagos',
      origin: DEFAULT_ORIGIN,
      destination: 'Lagos',
      travelDate: getDefaultTravelDate(),
      wave: '7:00 AM',
      busId: 'bus-lagos-1',
      busNumber: 1,
      plateNumber: 'OYO-419-LA',
      seatNumber: 4,
      lockedFare: 12500,
      demoPaidAmount: DEMO_INTERSWITCH_AMOUNT,
      status: 'confirmed',
      boardingPoint: 'LAUTECH Main Gate',
      dropOffPoint: 'Ojota',
      createdAt: '06:12 WAT',
    },
    {
      txnRef: 'VOYA-TRN-849202',
      studentName: 'Zainab Abdullahi',
      phoneNumber: '08169024415',
      routeId: 'ibadan',
      origin: DEFAULT_ORIGIN,
      destination: 'Ibadan',
      travelDate: getDefaultTravelDate(),
      wave: '7:00 AM',
      busId: 'bus-ibadan-1',
      busNumber: 1,
      plateNumber: 'OYO-204-OG',
      seatNumber: 13,
      lockedFare: 4500,
      demoPaidAmount: DEMO_INTERSWITCH_AMOUNT,
      status: 'confirmed',
      boardingPoint: 'Under-G Park',
      dropOffPoint: 'Ojoo Terminal',
      createdAt: '06:24 WAT',
    },
    {
      txnRef: 'VOYA-TRN-849203',
      studentName: 'Chinedu Okafor',
      phoneNumber: '09025517830',
      routeId: 'abuja',
      origin: DEFAULT_ORIGIN,
      destination: 'Abuja',
      travelDate: getDefaultTravelDate(),
      wave: '7:00 AM',
      busId: 'bus-abuja-1',
      busNumber: 1,
      plateNumber: 'ABJ-901-KU',
      seatNumber: 9,
      lockedFare: 24000,
      demoPaidAmount: DEMO_INTERSWITCH_AMOUNT,
      status: 'confirmed',
      boardingPoint: 'LAUTECH Main Gate',
      dropOffPoint: 'Utako Terminal',
      createdAt: '06:31 WAT',
    },
  ];

  return {
    routes,
    tickets,
    queueReceipts: [],
    nextTxnSequence: 849204,
  };
}

export function getDefaultTravelDate(): string {
  const now = new Date();
  now.setDate(now.getDate() + 2);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateRouteShortage(route: Pick<RouteData, 'requests' | 'availableSeats'>): number {
  return Math.max(0, route.requests - route.availableSeats);
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function getWaveCapacitySnapshot(route: RouteData): WaveCapacitySnapshot {
  const shortage = calculateRouteShortage(route);
  const seatsRemainingTotal = Math.max(0, route.availableSeats - route.confirmedSeats);

  // Find the first bus with open capacity, or fallback to the latest bus
  const openBus = route.buses.find((b) => b.bookedSeats < b.capacity);
  const targetBus = openBus ?? route.buses[route.buses.length - 1];

  const activeBusCapacity = targetBus ? targetBus.capacity : STANDARD_BUS_CAPACITY;
  const activeBusSeatsFilled = targetBus ? targetBus.bookedSeats : 0;
  const seatsLeftToUnlock = Math.max(0, activeBusCapacity - activeBusSeatsFilled);
  const fillPercent = Math.min(100, Math.round((activeBusSeatsFilled / activeBusCapacity) * 100));

  return {
    hasSeatsAvailable: seatsRemainingTotal > 0 && Boolean(openBus),
    seatsRemainingTotal,
    shortage,
    activeBusNumber: targetBus ? targetBus.busNumber : 1,
    activeBusPlate: targetBus ? targetBus.plateNumber : 'PENDING',
    activeBusSeatsFilled,
    activeBusCapacity,
    seatsLeftToUnlock,
    fillPercent,
  };
}

export function calculateDashboardKpis(routes: RouteData[]): DashboardKpis {
  let totalStudentDemand = 0;
  let confirmedSeats = 0;
  let activeSeatShortage = 0;
  let escrowBalance = 0;
  let releasedPayouts = 0;
  let totalBuses = 0;

  for (const route of routes) {
    totalStudentDemand += route.requests;
    confirmedSeats += route.confirmedSeats;
    activeSeatShortage += calculateRouteShortage(route);
    totalBuses += route.buses.length;

    for (const bus of route.buses) {
      const busValue = bus.bookedSeats * bus.lockedFare;
      if (bus.settlementStatus === 'in_escrow') {
        escrowBalance += busValue;
      } else {
        releasedPayouts += busValue;
      }
    }
  }

  return {
    totalStudentDemand,
    confirmedSeats,
    activeSeatShortage,
    escrowBalance,
    releasedPayouts,
    totalBuses,
  };
}

export function getHighestShortageRoute(routes: RouteData[]): {
  route: RouteData;
  shortage: number;
  busesNeeded: number;
} | null {
  let topRoute: RouteData | null = null;
  let topShortage = 0;

  for (const route of routes) {
    const shortage = calculateRouteShortage(route);
    if (shortage > topShortage) {
      topShortage = shortage;
      topRoute = route;
    }
  }

  if (!topRoute || topShortage <= 0) return null;

  return {
    route: topRoute,
    shortage: topShortage,
    busesNeeded: Math.ceil(topShortage / STANDARD_BUS_CAPACITY),
  };
}

export function generateTxnRef(sequence: number): string {
  return `VOYA-TRN-${String(sequence).padStart(6, '0')}`;
}

export function formatWaveDepartureTime(wave: DepartureWave): string {
  const [timePart, meridiem] = wave.split(' ');
  const [hStr, mStr] = timePart.split(':');
  return `${hStr.padStart(2, '0')}:${mStr} ${meridiem}`;
}

export function computeArrivalTime(wave: DepartureWave, durationMinutes: number): string {
  const [timePart, meridiem] = wave.split(' ');
  const [rawHour, rawMinute] = timePart.split(':').map(Number);
  let startMinutes = (rawHour % 12) * 60 + rawMinute;
  if (meridiem === 'PM') startMinutes += 12 * 60;

  const arrivalTotal = (startMinutes + durationMinutes) % (24 * 60);
  const arrivalHour24 = Math.floor(arrivalTotal / 60);
  const arrivalMin = arrivalTotal % 60;
  const arrivalMeridiem = arrivalHour24 >= 12 ? 'PM' : 'AM';
  const arrivalHour12 = arrivalHour24 % 12 === 0 ? 12 : arrivalHour24 % 12;

  return `${String(arrivalHour12).padStart(2, '0')}:${String(arrivalMin).padStart(
    2,
    '0'
  )} ${arrivalMeridiem}`;
}

export function getDropOffPoints(routeId: RouteId): StopOption[] {
  return DROP_OFF_POINTS_BY_ROUTE[routeId];
}

export function getDepartureCardsForRoute(route: RouteData): DepartureBusCard[] {
  const durationMeta = ROUTE_DURATION_META[route.id];

  return route.waves.map((wave, waveIndex) => {
    const waveBuses = route.buses.filter((b) => b.wave === wave);
    const openWaveBus = waveBuses.find((b) => b.bookedSeats < b.capacity);
    const displayBus = openWaveBus ?? waveBuses[waveBuses.length - 1] ?? null;

    const capacity = displayBus ? displayBus.capacity : STANDARD_BUS_CAPACITY;
    const bookedSeats = displayBus ? displayBus.bookedSeats : STANDARD_BUS_CAPACITY;
    const seatsRemaining = Math.max(0, capacity - bookedSeats);
    const fillPercent = Math.min(100, Math.round((bookedSeats / capacity) * 100));

    return {
      wave,
      departureTime: formatWaveDepartureTime(wave),
      arrivalTime: computeArrivalTime(wave, durationMeta.minutes),
      durationLabel: durationMeta.label,
      busId: displayBus ? displayBus.id : null,
      busNumber: displayBus ? displayBus.busNumber : route.buses.length + waveIndex + 1,
      plateNumber: displayBus ? displayBus.plateNumber : 'AWAITING DISPATCH',
      vehicleLabel: 'VOYA Express • 14-Seater AC Hiace',
      bookedSeats,
      capacity,
      seatsRemaining,
      fillPercent,
      lockedFare: displayBus ? displayBus.lockedFare : route.fare,
      isFull: !displayBus || seatsRemaining === 0,
    };
  });
}

export function getBookedSeatNumbers(bus: Pick<BusUnit, 'bookedSeats' | 'capacity' | 'bookedSeatNumbers'>): number[] {
  if (bus.bookedSeatNumbers && bus.bookedSeatNumbers.length >= bus.bookedSeats) {
    return [...bus.bookedSeatNumbers].sort((a, b) => a - b);
  }
  const booked: number[] = [];
  const count = Math.min(bus.bookedSeats, bus.capacity);
  for (let seat = 1; seat <= count; seat++) {
    booked.push(seat);
  }
  return booked;
}

export function getSeatMapForBus(
  bus: Pick<BusUnit, 'bookedSeats' | 'capacity' | 'bookedSeatNumbers'>
): BusSeatSlot[] {
  const bookedSet = new Set(getBookedSeatNumbers(bus));
  const slots: BusSeatSlot[] = [];
  for (let seatNumber = 1; seatNumber <= bus.capacity; seatNumber++) {
    slots.push({
      seatNumber,
      status: bookedSet.has(seatNumber) ? 'booked' : 'available',
    });
  }
  return slots;
}

export function formatCountdownSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function validateStudentCheckout(
  studentName: string,
  phoneNumber: string
): { valid: boolean; errors: { studentName?: string; phoneNumber?: string } } {
  const errors: { studentName?: string; phoneNumber?: string } = {};
  const trimmedName = studentName.trim();
  const digitsOnly = phoneNumber.replace(/[\s\-+()]/g, '');

  if (trimmedName.length < 3) {
    errors.studentName = 'Enter student full name (min 3 chars).';
  }
  if (!/^\d{10,14}$/.test(digitsOnly)) {
    errors.phoneNumber = 'Enter a valid 10–14 digit Nigerian phone number (e.g. 08031234567).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePassengerCheckout(fields: {
  studentName: string;
  phoneNumber: string;
  email: string;
  nextOfKinPhone: string;
}): {
  valid: boolean;
  errors: {
    studentName?: string;
    phoneNumber?: string;
    email?: string;
    nextOfKinPhone?: string;
  };
} {
  const base = validateStudentCheckout(fields.studentName, fields.phoneNumber);
  const errors: {
    studentName?: string;
    phoneNumber?: string;
    email?: string;
    nextOfKinPhone?: string;
  } = { ...base.errors };

  const cleanEmail = fields.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.email = 'Enter a valid email address for your digital receipt.';
  }

  const nokDigits = fields.nextOfKinPhone.replace(/[\s\-+()]/g, '');
  if (!/^\d{10,14}$/.test(nokDigits)) {
    errors.nextOfKinPhone = 'Enter a valid 10–14 digit Next of Kin phone number.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateDeployBusForm(
  plateNumber: string,
  lockedFare: number
): { valid: boolean; errors: { plateNumber?: string; lockedFare?: string } } {
  const errors: { plateNumber?: string; lockedFare?: string } = {};
  const normalizedPlate = plateNumber.trim().toUpperCase();

  if (normalizedPlate.length < 5) {
    errors.plateNumber = 'Enter a valid vehicle plate number (e.g. OYO-482-LA).';
  }
  if (!Number.isFinite(lockedFare) || lockedFare < 500) {
    errors.lockedFare = 'Locked fare must be at least ₦500.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function joinVirtualQueueAction(
  state: VoyaState,
  params: { routeId: RouteId; wave: DepartureWave; travelDate: string }
): { state: VoyaState; position: number } {
  let assignedPosition = 1;

  const updatedRoutes = state.routes.map((route) => {
    if (route.id !== params.routeId) return route;
    const nextRequests = route.requests + 1;
    assignedPosition = Math.max(1, nextRequests - route.confirmedSeats);
    return {
      ...route,
      requests: nextRequests,
    };
  });

  const targetRoute = updatedRoutes.find((r) => r.id === params.routeId);
  const receipt = {
    routeId: params.routeId,
    destination: targetRoute?.destination ?? params.routeId,
    wave: params.wave,
    travelDate: params.travelDate,
    position: assignedPosition,
    registeredAt: new Date().toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return {
    position: assignedPosition,
    state: {
      ...state,
      routes: updatedRoutes,
      queueReceipts: [receipt, ...state.queueReceipts],
    },
  };
}

export function bookSeatAction(
  state: VoyaState,
  params: {
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
    txnRef?: string;
  }
): { state: VoyaState; ticket: Ticket | null; error?: string } {
  const route = state.routes.find((r) => r.id === params.routeId);
  if (!route) {
    return { state, ticket: null, error: 'Route node not found.' };
  }

  let openBusIndex = -1;
  if (params.busId) {
    openBusIndex = route.buses.findIndex(
      (b) => b.id === params.busId && b.bookedSeats < b.capacity
    );
  }
  if (openBusIndex === -1) {
    openBusIndex = route.buses.findIndex(
      (b) => b.wave === params.wave && b.bookedSeats < b.capacity
    );
  }
  if (openBusIndex === -1) {
    openBusIndex = route.buses.findIndex((b) => b.bookedSeats < b.capacity);
  }
  if (openBusIndex === -1) {
    return {
      state,
      ticket: null,
      error: 'All active chassis on this corridor are full. Join Virtual Queue instead.',
    };
  }

  const targetBus = route.buses[openBusIndex];
  const existingBookedSeats = getBookedSeatNumbers(targetBus);
  const existingSet = new Set(existingBookedSeats);

  let assignedSeatNumber = targetBus.bookedSeats + 1;
  if (
    params.seatNumber &&
    params.seatNumber >= 1 &&
    params.seatNumber <= targetBus.capacity &&
    !existingSet.has(params.seatNumber)
  ) {
    assignedSeatNumber = params.seatNumber;
  } else {
    for (let s = 1; s <= targetBus.capacity; s++) {
      if (!existingSet.has(s)) {
        assignedSeatNumber = s;
        break;
      }
    }
  }

  const updatedBookedSeatNumbers = [...existingBookedSeats, assignedSeatNumber].sort(
    (a, b) => a - b
  );
  const txnRef = params.txnRef ?? generateTxnRef(state.nextTxnSequence);

  const updatedBus: BusUnit = {
    ...targetBus,
    bookedSeats: targetBus.bookedSeats + 1,
    bookedSeatNumbers: updatedBookedSeatNumbers,
  };

  const updatedBuses = route.buses.map((b, idx) => (idx === openBusIndex ? updatedBus : b));

  // If confirmedSeats + 1 exceeds current requests, requests rises with confirmed booking;
  // otherwise booking converts an existing demand signal into a confirmed seat.
  const nextConfirmedSeats = route.confirmedSeats + 1;
  const nextRequests = Math.max(route.requests, nextConfirmedSeats);

  const updatedRoutes = state.routes.map((r) =>
    r.id === params.routeId
      ? {
          ...r,
          requests: nextRequests,
          confirmedSeats: nextConfirmedSeats,
          buses: updatedBuses,
        }
      : r
  );

  const defaultDropOff = getDropOffPoints(route.id)[0]?.name ?? route.terminal;

  const ticket: Ticket = {
    txnRef,
    studentName: params.studentName.trim(),
    phoneNumber: params.phoneNumber.trim(),
    email: params.email?.trim(),
    nextOfKinPhone: params.nextOfKinPhone?.trim(),
    boardingPoint: params.boardingPoint || BOARDING_POINTS[0].name,
    dropOffPoint: params.dropOffPoint || defaultDropOff,
    routeId: route.id,
    origin: route.origin,
    destination: route.destination,
    travelDate: params.travelDate,
    wave: params.wave,
    busId: updatedBus.id,
    busNumber: updatedBus.busNumber,
    plateNumber: updatedBus.plateNumber,
    seatNumber: assignedSeatNumber,
    lockedFare: updatedBus.lockedFare,
    demoPaidAmount: DEMO_INTERSWITCH_AMOUNT,
    status: 'confirmed',
    createdAt: new Date().toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return {
    ticket,
    state: {
      ...state,
      routes: updatedRoutes,
      tickets: [ticket, ...state.tickets],
      nextTxnSequence: state.nextTxnSequence + 1,
    },
  };
}

export function deployBusAction(
  state: VoyaState,
  params: {
    routeId: RouteId;
    plateNumber: string;
    lockedFare: number;
    wave: DepartureWave;
  }
): { state: VoyaState; newBus: BusUnit | null } {
  let createdBus: BusUnit | null = null;
  const cleanPlate = params.plateNumber.trim().toUpperCase();

  const updatedRoutes = state.routes.map((route) => {
    if (route.id !== params.routeId) return route;
    const nextBusNumber = route.buses.length + 1;
    createdBus = {
      id: `bus-${route.id}-${nextBusNumber}-${Date.now()}`,
      routeId: route.id,
      busNumber: nextBusNumber,
      plateNumber: cleanPlate,
      capacity: STANDARD_BUS_CAPACITY,
      bookedSeats: 0,
      wave: params.wave,
      lockedFare: params.lockedFare,
      settlementStatus: 'in_escrow',
    };
    return {
      ...route,
      fare: params.lockedFare,
      availableSeats: route.availableSeats + STANDARD_BUS_CAPACITY,
      buses: [...route.buses, createdBus],
    };
  });

  return {
    newBus: createdBus,
    state: {
      ...state,
      routes: updatedRoutes,
    },
  };
}

export function markTicketBoardedAction(
  state: VoyaState,
  txnRef: string
): { state: VoyaState; ticket: Ticket | null } {
  const normalized = txnRef.trim().toUpperCase();
  let matched: Ticket | null = null;

  const updatedTickets = state.tickets.map((t) => {
    if (t.txnRef.toUpperCase() !== normalized) return t;
    matched = { ...t, status: 'boarded' };
    return matched;
  });

  if (!matched) {
    return { state, ticket: null };
  }

  return {
    ticket: matched,
    state: {
      ...state,
      tickets: updatedTickets,
    },
  };
}

export function formatWatTimestamp(date = new Date()): string {
  return `${date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} WAT`;
}

export function verifyBoardingAndReleasePayoutAction(
  state: VoyaState,
  txnRef: string
): { state: VoyaState; ticket: Ticket | null; updatedBus: BusUnit | null; timestamp: string } {
  const normalized = txnRef.trim().toUpperCase();
  const timestamp = formatWatTimestamp();
  let matchedTicket: Ticket | null = null;

  const updatedTickets = state.tickets.map((t) => {
    if (t.txnRef.toUpperCase() !== normalized) return t;
    matchedTicket = { ...t, status: 'boarded' };
    return matchedTicket;
  });

  if (!matchedTicket) {
    return { state, ticket: null, updatedBus: null, timestamp };
  }

  const targetBusId = (matchedTicket as Ticket).busId;
  let releasedBus: BusUnit | null = null;

  const updatedRoutes = state.routes.map((route) => {
    const hasBus = route.buses.some((b) => b.id === targetBusId);
    if (!hasBus) return route;
    return {
      ...route,
      buses: route.buses.map((bus) => {
        if (bus.id !== targetBusId) return bus;
        releasedBus = {
          ...bus,
          settlementStatus: 'payout_released',
          payoutReleasedAt: bus.payoutReleasedAt ?? timestamp,
        };
        return releasedBus;
      }),
    };
  });

  return {
    ticket: matchedTicket,
    updatedBus: releasedBus,
    timestamp,
    state: {
      ...state,
      routes: updatedRoutes,
      tickets: updatedTickets,
    },
  };
}

export function toggleBusSettlementAction(
  state: VoyaState,
  busId: string
): { state: VoyaState; updatedBus: BusUnit | null } {
  let changedBus: BusUnit | null = null;
  const timestamp = formatWatTimestamp();

  const updatedRoutes = state.routes.map((route) => {
    const hasBus = route.buses.some((b) => b.id === busId);
    if (!hasBus) return route;
    return {
      ...route,
      buses: route.buses.map((bus) => {
        if (bus.id !== busId) return bus;
        const nextStatus =
          bus.settlementStatus === 'in_escrow' ? 'payout_released' : 'in_escrow';
        changedBus = {
          ...bus,
          settlementStatus: nextStatus,
          payoutReleasedAt:
            nextStatus === 'payout_released' ? timestamp : undefined,
        };
        return changedBus;
      }),
    };
  });

  return {
    updatedBus: changedBus,
    state: {
      ...state,
      routes: updatedRoutes,
    },
  };
}

export function findTicketByRef(state: VoyaState, txnRef: string): Ticket | undefined {
  const normalized = txnRef.trim().toUpperCase();
  if (!normalized) return undefined;
  return state.tickets.find((t) => t.txnRef.toUpperCase() === normalized);
}

export function findBusById(state: VoyaState, busId: string): BusUnit | undefined {
  for (const route of state.routes) {
    const found = route.buses.find((b) => b.id === busId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Generates a deterministic 21x21 QR-style boolean matrix with authentic
 * 3-corner finder patterns, timing strips, and hashed payload modules.
 */
export function generateQrMatrix(payload: string, size = 21): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = top + r;
        const cc = left + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rr][cc] = inOuter && (isBorder || isCenter);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic PRNG seeded from payload string (FNV-1a 32-bit)
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  let seed = hash >>> 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      matrix[r][c] = ((seed >>> 24) & 1) === 1;
    }
  }

  return matrix;
}
