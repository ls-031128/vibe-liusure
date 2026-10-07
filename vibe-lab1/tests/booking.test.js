const test = require('node:test');
const assert = require('node:assert/strict');

const {
  readBookings,
  isSlotBooked,
  createBooking,
} = require('../booking.js');

const baseBooking = {
  equipmentId: 'projector',
  date: '2026-10-12',
  timeSlot: '09:00-11:00',
};

test('readBookings returns an empty list for malformed JSON', () => {
  assert.deepEqual(readBookings('{bad json'), []);
});

test('createBooking accepts a new valid booking', () => {
  const result = createBooking([], baseBooking);

  assert.equal(result.ok, true);
  assert.equal(result.message, '预约成功');
  assert.deepEqual(result.bookings, [baseBooking]);
});

test('createBooking rejects the same equipment date and slot', () => {
  const first = createBooking([], baseBooking);
  const result = createBooking(first.bookings, baseBooking);

  assert.equal(result.ok, false);
  assert.match(result.message, /已被预约/);
  assert.equal(result.bookings.length, 1);
});

test('createBooking allows a different equipment on the same slot', () => {
  const result = createBooking([], {
    ...baseBooking,
    equipmentId: 'camera',
  });

  assert.equal(result.ok, true);
});

test('createBooking allows a different date or slot', () => {
  const first = createBooking([], baseBooking);
  const differentDate = createBooking(first.bookings, {
    ...baseBooking,
    date: '2026-10-13',
  });
  const differentSlot = createBooking(differentDate.bookings, {
    ...baseBooking,
    timeSlot: '14:00-16:00',
  });

  assert.equal(differentDate.ok, true);
  assert.equal(differentSlot.ok, true);
  assert.equal(differentSlot.bookings.length, 3);
});

test('createBooking rejects missing booking fields', () => {
  const result = createBooking([], {
    ...baseBooking,
    timeSlot: ' ',
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, '请选择完整的器材、日期和时间段。');
  assert.deepEqual(result.bookings, []);
});

test('isSlotBooked only matches all three booking fields', () => {
  assert.equal(isSlotBooked([baseBooking], baseBooking.equipmentId, baseBooking.date, baseBooking.timeSlot), true);
  assert.equal(isSlotBooked([baseBooking], 'camera', baseBooking.date, baseBooking.timeSlot), false);
});
