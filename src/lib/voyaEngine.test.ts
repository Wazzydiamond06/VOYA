import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bookSeatAction,
  calculateDashboardKpis,
  calculateRouteShortage,
  computeArrivalTime,
  createInitialVoyaState,
  deployBusAction,
  findBusById,
  findTicketByRef,
  formatCountdownSeconds,
  generateQrMatrix,
  getDepartureCardsForRoute,
  getDropOffPoints,
  getHighestShortageRoute,
  getSeatMapForBus,
  getWaveCapacitySnapshot,
  joinVirtualQueueAction,
  markTicketBoardedAction,
  toggleBusSettlementAction,
  validateDeployBusForm,
  validatePassengerCheckout,
  validateStudentCheckout,
  verifyBoardingAndReleasePayoutAction,
} from './voyaEngine';

test('initial seed data satisfies LAUTECH corridor constraints and shortages', () => {
  const state = createInitialVoyaState();
  assert.equal(state.routes.length, 4);

  const lagos = state.routes.find((r) => r.id === 'lagos')!;
  const ibadan = state.routes.find((r) => r.id === 'ibadan')!;
  const abuja = state.routes.find((r) => r.id === 'abuja')!;
  const ilorin = state.routes.find((r) => r.id === 'ilorin')!;

  assert.equal(calculateRouteShortage(lagos), 14);
  assert.equal(calculateRouteShortage(ibadan), 0);
  assert.equal(calculateRouteShortage(abuja), 21);
  assert.equal(calculateRouteShortage(ilorin), 0);

  const ibadanSnap = getWaveCapacitySnapshot(ibadan);
  assert.equal(ibadanSnap.hasSeatsAvailable, true);
  assert.equal(ibadanSnap.activeBusSeatsFilled, 13);
  assert.equal(ibadanSnap.activeBusCapacity, 14);
  assert.equal(ibadanSnap.seatsLeftToUnlock, 1);

  const lagosSnap = getWaveCapacitySnapshot(lagos);
  assert.equal(lagosSnap.hasSeatsAvailable, false);
  assert.equal(lagosSnap.shortage, 14);
});

test('joinVirtualQueueAction increments route requests and returns virtual queue position', () => {
  const initial = createInitialVoyaState();
  const { state, position } = joinVirtualQueueAction(initial, {
    routeId: 'lagos',
    wave: '7:00 AM',
    travelDate: '2026-12-01',
  });

  const lagos = state.routes.find((r) => r.id === 'lagos')!;
  assert.equal(lagos.requests, 43);
  assert.equal(calculateRouteShortage(lagos), 15);
  assert.equal(position, 15);
  assert.equal(state.queueReceipts.length, 1);
});

test('deployBusAction adds +14 seats, recalculates shortage live, and unlocks booking', () => {
  const initial = createInitialVoyaState();
  const { state: deployedState, newBus } = deployBusAction(initial, {
    routeId: 'lagos',
    plateNumber: 'oyo-482-la',
    lockedFare: 12500,
    wave: '11:00 AM',
  });

  assert.ok(newBus);
  assert.equal(newBus.plateNumber, 'OYO-482-LA');
  assert.equal(newBus.capacity, 14);
  assert.equal(newBus.busNumber, 3);

  const lagos = deployedState.routes.find((r) => r.id === 'lagos')!;
  assert.equal(lagos.availableSeats, 42);
  assert.equal(calculateRouteShortage(lagos), 0);

  const snap = getWaveCapacitySnapshot(lagos);
  assert.equal(snap.hasSeatsAvailable, true);
  assert.equal(snap.activeBusNumber, 3);
  assert.equal(snap.seatsLeftToUnlock, 14);
});

test('bookSeatAction books seat on open bus, generates unique txn_ref, and updates escrow KPI', () => {
  const initial = createInitialVoyaState();
  const kpisBefore = calculateDashboardKpis(initial.routes);

  const { state: bookedState, ticket, error } = bookSeatAction(initial, {
    routeId: 'ibadan',
    wave: '7:00 AM',
    travelDate: '2026-12-01',
    studentName: 'Tunde Bakare',
    phoneNumber: '08031234567',
  });

  assert.equal(error, undefined);
  assert.ok(ticket);
  assert.equal(ticket.txnRef, 'VOYA-TRN-849204');
  assert.equal(ticket.seatNumber, 14);
  assert.equal(ticket.busNumber, 1);
  assert.equal(ticket.status, 'confirmed');

  const ibadan = bookedState.routes.find((r) => r.id === 'ibadan')!;
  assert.equal(ibadan.confirmedSeats, 14);
  assert.equal(ibadan.requests, 14);
  assert.equal(getWaveCapacitySnapshot(ibadan).hasSeatsAvailable, false);

  const kpisAfter = calculateDashboardKpis(bookedState.routes);
  assert.equal(kpisAfter.confirmedSeats, kpisBefore.confirmedSeats + 1);
  assert.equal(kpisAfter.escrowBalance, kpisBefore.escrowBalance + 4500);
});

test('boarding verification and escrow settlement toggle update ticket and bus state', () => {
  const initial = createInitialVoyaState();
  const found = findTicketByRef(initial, 'voya-trn-849201');
  assert.ok(found);
  assert.equal(found.status, 'confirmed');

  const { state: boardedState, ticket } = markTicketBoardedAction(initial, 'VOYA-TRN-849201');
  assert.ok(ticket);
  assert.equal(ticket.status, 'boarded');

  const kpisBeforeRelease = calculateDashboardKpis(boardedState.routes);
  const { state: settledState, updatedBus } = toggleBusSettlementAction(
    boardedState,
    ticket.busId
  );
  assert.ok(updatedBus);
  assert.equal(updatedBus.settlementStatus, 'payout_released');

  const busAfter = findBusById(settledState, ticket.busId)!;
  assert.equal(busAfter.settlementStatus, 'payout_released');

  const kpisAfterRelease = calculateDashboardKpis(settledState.routes);
  assert.equal(
    kpisAfterRelease.escrowBalance,
    kpisBeforeRelease.escrowBalance - 14 * 12500
  );
  assert.equal(
    kpisAfterRelease.releasedPayouts,
    kpisBeforeRelease.releasedPayouts + 14 * 12500
  );
});

test('form validations reject empty/invalid inputs and accept valid data', () => {
  assert.equal(validateStudentCheckout('', '123').valid, false);
  assert.equal(validateStudentCheckout('Ada Obi', '08035551234').valid, true);

  assert.equal(validateDeployBusForm('AB', 100).valid, false);
  assert.equal(validateDeployBusForm('OYO-482-LA', 12500).valid, true);
});

test('generateQrMatrix creates deterministic 21x21 matrix with finder patterns', () => {
  const m1 = generateQrMatrix('VOYA-TRN-849201');
  const m2 = generateQrMatrix('VOYA-TRN-849201');
  const m3 = generateQrMatrix('VOYA-TRN-999999');

  assert.equal(m1.length, 21);
  assert.equal(m1[0].length, 21);
  assert.deepEqual(m1, m2);
  assert.notDeepEqual(m1, m3);
  // Top-left finder corner
  assert.equal(m1[0][0], true);
  assert.equal(m1[3][3], true);
});

test('getHighestShortageRoute identifies top shortage corridor and buses needed', () => {
  const state = createInitialVoyaState();
  const top = getHighestShortageRoute(state.routes);
  assert.ok(top);
  assert.equal(top.route.id, 'abuja');
  assert.equal(top.shortage, 21);
  assert.equal(top.busesNeeded, 2);
});

test('verifyBoardingAndReleasePayoutAction marks ticket boarded and releases bus payout with timestamp', () => {
  const initial = createInitialVoyaState();
  const result = verifyBoardingAndReleasePayoutAction(initial, 'VOYA-TRN-849201');
  assert.ok(result.ticket);
  assert.equal(result.ticket.status, 'boarded');
  assert.ok(result.updatedBus);
  assert.equal(result.updatedBus.settlementStatus, 'payout_released');
  assert.ok(result.updatedBus.payoutReleasedAt);
});

test('getDepartureCardsForRoute builds 3 wave cards with accurate arrival timelines and availability', () => {
  const state = createInitialVoyaState();
  const lagos = state.routes.find((r) => r.id === 'lagos')!;
  const ibadan = state.routes.find((r) => r.id === 'ibadan')!;

  const lagosCards = getDepartureCardsForRoute(lagos);
  assert.equal(lagosCards.length, 3);
  assert.equal(lagosCards[0].departureTime, '07:00 AM');
  assert.equal(lagosCards[0].arrivalTime, '10:45 AM');
  assert.equal(lagosCards[0].durationLabel, '~3h 45m');
  assert.equal(lagosCards[0].isFull, true);

  const ibadanCards = getDepartureCardsForRoute(ibadan);
  assert.equal(ibadanCards[0].isFull, false);
  assert.equal(ibadanCards[0].bookedSeats, 13);
  assert.equal(ibadanCards[0].seatsRemaining, 1);
  assert.equal(computeArrivalTime('11:00 AM', 225), '02:45 PM');
});

test('getSeatMapForBus marks 13 seats booked on demo bus leaving Seat 14 open and persists specific seat bookings', () => {
  const state = createInitialVoyaState();
  const ibadanBus = state.routes.find((r) => r.id === 'ibadan')!.buses[0];
  const seats = getSeatMapForBus(ibadanBus);

  assert.equal(seats.length, 14);
  assert.equal(seats.filter((s) => s.status === 'booked').length, 13);
  assert.equal(seats[13].seatNumber, 14);
  assert.equal(seats[13].status, 'available');

  const booked = bookSeatAction(state, {
    routeId: 'ibadan',
    wave: '7:00 AM',
    travelDate: '2026-12-01',
    studentName: 'Seyi Ogunleye',
    phoneNumber: '08091234567',
    email: 'seyi@lautech.edu.ng',
    nextOfKinPhone: '08023456789',
    busId: ibadanBus.id,
    seatNumber: 14,
    boardingPoint: 'Under-G Park',
    dropOffPoint: 'Ojoo Terminal',
  });

  assert.ok(booked.ticket);
  assert.equal(booked.ticket.seatNumber, 14);
  assert.equal(booked.ticket.boardingPoint, 'Under-G Park');
  assert.equal(booked.ticket.dropOffPoint, 'Ojoo Terminal');
  assert.equal(getDropOffPoints('lagos').map((s) => s.name).join(','), 'Berger,Ojota,Jibowu');
  assert.equal(formatCountdownSeconds(599), '09:59');
});

test('validatePassengerCheckout validates full name, WhatsApp phone, email, and Next of Kin phone', () => {
  const invalid = validatePassengerCheckout({
    studentName: 'Al',
    phoneNumber: '123',
    email: 'bad-email',
    nextOfKinPhone: '456',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.studentName);
  assert.ok(invalid.errors.phoneNumber);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.nextOfKinPhone);

  const valid = validatePassengerCheckout({
    studentName: 'Adebayo Toluwanimi',
    phoneNumber: '08035510921',
    email: 'adebayo@lautech.edu.ng',
    nextOfKinPhone: '08029918822',
  });
  assert.equal(valid.valid, true);
});

