(function () {
  const STORAGE_KEY = 'equipmentBookings';
  const equipment = [
    {
      id: 'projector',
      icon: '▣',
      name: '高清投影仪',
      description: '适合课堂讲解、课程汇报和小型研讨会，支持高清画面输出。',
    },
    {
      id: 'camera',
      icon: '◉',
      name: '教学摄像机',
      description: '便携式高清摄像设备，适合实验记录、课程拍摄和活动直播。',
    },
    {
      id: 'microphone',
      icon: '♩',
      name: '无线麦克风',
      description: '清晰稳定的无线收音设备，适合课堂互动和演讲展示。',
    },
  ];

  const booking = window.EquipmentBooking;
  const list = document.querySelector('#equipment-list');
  const dialog = document.querySelector('#booking-dialog');
  const form = document.querySelector('#booking-form');
  const equipmentIdInput = document.querySelector('#equipment-id');
  const selectedEquipment = document.querySelector('#selected-equipment');
  const bookingDate = document.querySelector('#booking-date');
  const timeSlot = document.querySelector('#time-slot');
  const bookingMessage = document.querySelector('#booking-message');
  const pageMessage = document.querySelector('#page-message');

  function getStoredBookings() {
    return booking.readBookings(window.localStorage.getItem(STORAGE_KEY));
  }

  function saveBookings(bookings) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }

  function formatToday() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function renderEquipment() {
    list.innerHTML = equipment.map((item) => `
      <article class="equipment-card">
        <div class="equipment-icon" aria-hidden="true">${item.icon}</div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <button class="button button-primary" type="button" data-equipment-id="${item.id}">预约</button>
      </article>
    `).join('');
  }

  function clearFormMessage() {
    bookingMessage.textContent = '';
    bookingMessage.className = 'form-message';
  }

  function openBookingDialog(equipmentItem) {
    equipmentIdInput.value = equipmentItem.id;
    selectedEquipment.textContent = `当前器材：${equipmentItem.name}`;
    clearFormMessage();
    bookingDate.min = formatToday();
    dialog.showModal();
  }

  function closeBookingDialog() {
    dialog.close();
    form.reset();
    clearFormMessage();
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-equipment-id]');
    if (!button) return;

    const selected = equipment.find((item) => item.id === button.dataset.equipmentId);
    if (selected) openBookingDialog(selected);
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', closeBookingDialog);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const result = booking.createBooking(getStoredBookings(), {
      equipmentId: equipmentIdInput.value,
      date: bookingDate.value,
      timeSlot: timeSlot.value,
    });

    if (!result.ok) {
      bookingMessage.textContent = result.message;
      bookingMessage.className = 'form-message form-message-error';
      return;
    }

    saveBookings(result.bookings);
    pageMessage.textContent = `${result.message}：${selectedEquipment.textContent.replace('当前器材：', '')}，${bookingDate.value}，${timeSlot.options[timeSlot.selectedIndex].text}。`;
    closeBookingDialog();
  });

  renderEquipment();
})();
