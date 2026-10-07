(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EquipmentBooking = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const SUCCESS_MESSAGE = '预约成功';
  const INVALID_MESSAGE = '请选择完整的器材、日期和时间段。';
  const CONFLICT_MESSAGE = '该器材在所选日期和时间段已被预约，请选择其他时间。';

  function isValidBooking(booking) {
    return booking
      && typeof booking.equipmentId === 'string'
      && booking.equipmentId.trim()
      && typeof booking.date === 'string'
      && booking.date.trim()
      && typeof booking.timeSlot === 'string'
      && booking.timeSlot.trim();
  }

  function readBookings(rawValue) {
    if (!rawValue) return [];

    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed.filter(isValidBooking) : [];
    } catch {
      return [];
    }
  }

  function isSlotBooked(bookings, equipmentId, date, timeSlot) {
    return bookings.some((booking) => (
      booking.equipmentId === equipmentId
      && booking.date === date
      && booking.timeSlot === timeSlot
    ));
  }

  function createBooking(bookings, input) {
    const existingBookings = Array.isArray(bookings) ? [...bookings] : [];

    if (!isValidBooking(input)) {
      return { ok: false, bookings: existingBookings, message: INVALID_MESSAGE };
    }

    if (isSlotBooked(existingBookings, input.equipmentId, input.date, input.timeSlot)) {
      return { ok: false, bookings: existingBookings, message: CONFLICT_MESSAGE };
    }

    return {
      ok: true,
      bookings: [...existingBookings, {
        equipmentId: input.equipmentId.trim(),
        date: input.date.trim(),
        timeSlot: input.timeSlot.trim(),
      }],
      message: SUCCESS_MESSAGE,
    };
  }

  return {
    readBookings,
    isSlotBooked,
    createBooking,
  };
});
