import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDemoUser,
  createSignedInUser,
  createSignedUpUser,
  routeIdToDestinationLabel,
  validateAuthForm,
  validateOperatorOnboardingStep1,
  validateOperatorOnboardingStep2,
  validateStudentOnboardingStep1,
  validateStudentOnboardingStep2,
} from './authEngine';

test('validateAuthForm enforces required fields for signup and signin', () => {
  const invalidSignup = validateAuthForm({
    mode: 'signup',
    fullName: 'A',
    email: 'not-an-email',
    password: '123',
  });
  assert.equal(invalidSignup.valid, false);
  assert.ok(invalidSignup.errors.fullName);
  assert.ok(invalidSignup.errors.email);
  assert.ok(invalidSignup.errors.password);

  const validSignin = validateAuthForm({
    mode: 'signin',
    fullName: '',
    email: 'tolu.adebayo@student.lautech.edu.ng',
    password: 'password123',
  });
  assert.equal(validSignin.valid, true);
  assert.deepEqual(validSignin.errors, {});
});

test('student onboarding step 1 and step 2 validators enforce phone, destinations, and emergency contact', () => {
  const badStep1 = validateStudentOnboardingStep1({
    campus: '',
    phoneNumber: '08012',
  });
  assert.equal(badStep1.valid, false);
  assert.ok(badStep1.errors.campus);
  assert.ok(badStep1.errors.phoneNumber);

  const goodStep1 = validateStudentOnboardingStep1({
    campus: 'LAUTECH, Ogbomoso',
    phoneNumber: '+234 803 551 0921',
  });
  assert.equal(goodStep1.valid, true);

  const badStep2 = validateStudentOnboardingStep2({
    preferredDestinations: [],
    emergencyContactPhone: '1234',
  });
  assert.equal(badStep2.valid, false);
  assert.ok(badStep2.errors.preferredDestinations);
  assert.ok(badStep2.errors.emergencyContactPhone);

  const goodStep2 = validateStudentOnboardingStep2({
    preferredDestinations: ['Lagos', 'Ibadan'],
    emergencyContactPhone: '08029104412',
  });
  assert.equal(goodStep2.valid, true);
});

test('operator onboarding step 1 and step 2 validators enforce park details and 10-digit NUBAN account', () => {
  const badStep1 = validateOperatorOnboardingStep1({
    parkName: 'X',
    primaryCorridor: '',
    fleetSize: '',
  });
  assert.equal(badStep1.valid, false);
  assert.ok(badStep1.errors.parkName);
  assert.ok(badStep1.errors.primaryCorridor);
  assert.ok(badStep1.errors.fleetSize);

  const goodStep1 = validateOperatorOnboardingStep1({
    parkName: 'Ojoo Express Motors',
    primaryCorridor: 'LAUTECH → Lagos',
    fleetSize: '6–15 Buses',
  });
  assert.equal(goodStep1.valid, true);

  const badStep2 = validateOperatorOnboardingStep2({
    bankName: 'GTBank',
    accountNumber: '12345',
    accountName: 'AB',
  });
  assert.equal(badStep2.valid, false);
  assert.ok(badStep2.errors.accountNumber);
  assert.ok(badStep2.errors.accountName);

  const goodStep2 = validateOperatorOnboardingStep2({
    bankName: 'Moniepoint',
    accountNumber: '8035510921',
    accountName: 'OJOO EXPRESS LTD',
  });
  assert.equal(goodStep2.valid, true);
});

test('demo and signup/signin user factories set onboarding state and route mapping properly', () => {
  const demoStudent = createDemoUser('student');
  assert.equal(demoStudent.role, 'student');
  assert.equal(demoStudent.onboardingCompleted, true);
  assert.ok(demoStudent.studentProfile);

  const demoOperator = createDemoUser('operator');
  assert.equal(demoOperator.role, 'operator');
  assert.equal(demoOperator.onboardingCompleted, true);
  assert.ok(demoOperator.operatorProfile);

  const signedUp = createSignedUpUser({
    role: 'student',
    fullName: 'Zainab Bello',
    email: 'Zainab@LAUTECH.edu.ng',
  });
  assert.equal(signedUp.onboardingCompleted, false);
  assert.equal(signedUp.email, 'zainab@lautech.edu.ng');

  const signedIn = createSignedInUser({
    role: 'operator',
    email: 'ops.manager@gbemisola.ng',
  });
  assert.equal(signedIn.onboardingCompleted, true);
  assert.equal(signedIn.fullName, 'Ops Manager');

  assert.equal(routeIdToDestinationLabel('ibadan'), 'Ibadan');
  assert.equal(routeIdToDestinationLabel('lagos'), 'Lagos');
});
