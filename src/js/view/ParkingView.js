import { VEHICLE_MODELS } from '../data/vehicleModels.js';

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

export class ParkingView {
  constructor() {
    this.screens = [...document.querySelectorAll('[data-screen]')];
    this.navButtons = [...document.querySelectorAll('[data-view]')];
  }

  bindNavigation(onNavigate) {
    this.navButtons.forEach((button) => {
      button.addEventListener('click', () => onNavigate(button.dataset.view));
    });

    document.querySelectorAll('[data-go]').forEach((button) => {
      button.addEventListener('click', () => onNavigate(button.dataset.go));
    });

    document.querySelectorAll('[data-back]').forEach((button) => {
      button.addEventListener('click', () => onNavigate('back'));
    });
  }

  bindReservation(onSave) {
    const modelSelect = document.querySelector('#model-select');
    const otherModelInput = document.querySelector('#model-other');
    const modelSearch = document.querySelector('#model-search');
    const modelSuggestions = document.querySelector('#model-suggestions');
    this.renderModelOptions();

    modelSearch.addEventListener('input', () => {
      modelSelect.value = '';
      otherModelInput.hidden = true;
      otherModelInput.required = false;
      otherModelInput.value = '';
      this.renderModelOptions(modelSearch.value);
      this.renderModelSuggestions(modelSearch.value);
    });

    modelSuggestions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-model-value]');
      if (!button) return;
      modelSelect.value = button.dataset.modelValue;
      modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
      modelSearch.value = button.dataset.modelValue;
      modelSuggestions.classList.add('hidden');
    });

    modelSelect.addEventListener('change', () => {
      const isOther = modelSelect.value === 'Outro';
      otherModelInput.hidden = !isOther;
      otherModelInput.required = isOther;
      modelSuggestions.classList.add('hidden');
      if (!isOther) otherModelInput.value = '';
    });

    otherModelInput.addEventListener('input', () => {
      otherModelInput.value = otherModelInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 &-]/g, '');
    });

    document.querySelector('#reservation-form').addEventListener('reset', () => {
      otherModelInput.hidden = true;
      otherModelInput.required = false;
      modelSearch.value = '';
      modelSuggestions.classList.add('hidden');
      this.renderModelOptions();
    });

    const plateInput = document.querySelector('#plate-input');
    plateInput.addEventListener('input', () => {
      const characters = plateInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let value = '';

      for (const character of characters) {
        const position = value.length;
        const validCharacter = position < 3
          ? /[A-Z]/.test(character)
          : position === 3
            ? /\d/.test(character)
            : position === 4
              ? /[A-Z0-9]/.test(character)
              : /\d/.test(character);

        if (validCharacter && position < 7) value += character;
      }

      const oldFormat = /^[A-Z]{3}\d{4}$/.test(value);
      plateInput.value = oldFormat ? `${value.slice(0, 3)}-${value.slice(3)}` : value;
    });

    const apartmentInput = document.querySelector('#apartment-input');
    apartmentInput.addEventListener('input', () => {
      apartmentInput.value = apartmentInput.value.replace(/\D/g, '').slice(0, 3);
    });

    const ownerInput = document.querySelector('[name="owner"]');
    ownerInput.addEventListener('input', () => {
      ownerInput.value = ownerInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ '\u2019-]/g, '');
    });

    const colorInput = document.querySelector('[name="color"]');
    colorInput.addEventListener('input', () => {
      colorInput.value = colorInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ -]/g, '');
    });

    document.querySelector('#reservation-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      data.spot = Number(data.spot);
      onSave(data);
    });
  }

  bindSearch(onSearch) {
    document.querySelector('#reservation-search').addEventListener('input', (event) => {
      onSearch(event.currentTarget.value);
    });
  }

  bindAvailableSpots(onSelect) {
    document.querySelector('#available-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-spot]');
      if (button) onSelect(Number(button.dataset.spot));
    });
  }

  selectSpot(spot) {
    document.querySelector('#spot-select').value = String(spot);
  }

  showError(message) {
    const error = document.querySelector('#form-error');
    error.textContent = message;
    error.classList.remove('hidden');
  }

  clearError() {
    const error = document.querySelector('#form-error');
    error.textContent = '';
    error.classList.add('hidden');
  }

  bindRemove(onRemove) {
    document.querySelector('#registered-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove]');
      if (button) onRemove(button.dataset.remove);
    });
  }

  bindConfirmation(onConfirm) {
    document.querySelector('#confirm-reservation').addEventListener('click', onConfirm);
  }

  showConfirmation(data) {
    const fields = [
      ['Placa do veículo', data.plate],
      ['Nome do proprietário', data.owner],
      ['Apartamento', data.apartment],
      ['Bloco', data.block],
      ['Modelo do veículo', data.model],
      ['Cor do veículo', data.color],
      ['Número da vaga', data.spot],
    ];

    document.querySelector('#confirmation-details').innerHTML = fields.map(([label, value]) => `
      <div class="confirmation-row"><dt>${label}</dt><dd>${escapeHTML(value)}</dd></div>`).join('');
  }

  navigate(screenName) {
    this.screens.forEach((screen) => {
      screen.classList.toggle('hidden', screen.dataset.screen !== screenName);
    });
    this.navButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.view === screenName);
    });
  }

  renderRegistered(reservations, query = '') {
    const list = document.querySelector('#registered-list');
    const emptyMessage = document.querySelector('#registered-empty');
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const filteredReservations = reservations.filter((reservation) => (
      [reservation.plate, reservation.owner, reservation.apartment, reservation.block,
        reservation.model, reservation.color, String(reservation.spot)]
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
    ));

    list.innerHTML = filteredReservations.map((reservation) => `
      <article class="reservation-card">
        <div class="reservation-card-heading">
          <div><h3>${escapeHTML(reservation.owner)}</h3><span class="plate-label">${escapeHTML(reservation.plate)}</span></div>
          <button class="remove-button" type="button" data-remove="${reservation.id}">Remover</button>
        </div>
        <dl class="reservation-info">
          <div><dt>Veículo</dt><dd>${escapeHTML(reservation.model)}</dd></div>
          <div><dt>Cor</dt><dd>${escapeHTML(reservation.color)}</dd></div>
          <div><dt>Apartamento</dt><dd>${escapeHTML(reservation.apartment)} · ${escapeHTML(reservation.block)}</dd></div>
          <div><dt>Vaga</dt><dd>${escapeHTML(reservation.spot)}</dd></div>
        </dl>
      </article>`).join('');

    list.append(emptyMessage);
    emptyMessage.textContent = normalizedQuery && reservations.length
      ? 'Nenhuma reserva encontrada.'
      : 'Nenhuma reserva cadastrada.';
    emptyMessage.classList.toggle('hidden', filteredReservations.length > 0);
  }

  renderAvailable(spots) {
    document.querySelector('#available-list').innerHTML = spots.length
      ? spots.map((spot) => `<li><button class="available-spot" type="button" data-spot="${spot}">Vaga ${spot}</button></li>`).join('')
      : '<li class="available-empty">Não há vagas disponíveis.</li>';
  }

  updateSpotOptions(spots) {
    const select = document.querySelector('#spot-select');
    select.innerHTML = '<option value="">Selecione uma vaga livre</option>'
      + spots.map((spot) => `<option value="${spot}">${spot}</option>`).join('');
  }

  renderModelOptions(query = '') {
    const select = document.querySelector('#model-select');
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const models = VEHICLE_MODELS.filter((model) => model.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
    select.innerHTML = '<option value="">Selecione um modelo</option>'
      + models.map((model) => `<option value="${escapeHTML(model)}">${escapeHTML(model)}</option>`).join('')
      + '<option value="Outro">Outro</option>';
  }

  renderModelSuggestions(query = '') {
    const container = document.querySelector('#model-suggestions');
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    const matches = VEHICLE_MODELS
      .filter((model) => model.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
      .slice(0, 12);
    container.innerHTML = [...matches, 'Outro'].map((model) => `
      <button type="button" role="option" data-model-value="${escapeHTML(model)}">${escapeHTML(model)}</button>`).join('');
    container.classList.remove('hidden');
  }

}
