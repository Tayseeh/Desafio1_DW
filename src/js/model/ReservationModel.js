const TOTAL_SPOTS = 20;
const OWNER_NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\u2019-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const COLOR_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const VEHICLE_MODEL_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ0-9]+| & [A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*$/;

export class ReservationModel {
  constructor() {
    this.reservations = [
      { id: 1, plate: 'ABC-1234', owner: 'Mariana Oliveira', apartment: '302', block: 'Bloco A', model: 'Honda Civic', color: 'Prata', spot: 1 },
      { id: 2, plate: 'DEF-5678', owner: 'Rafael Costa', apartment: '104', block: 'Bloco B', model: 'Toyota Corolla', color: 'Preto', spot: 2 },
      { id: 3, plate: 'GHI-9012', owner: 'Camila Santos', apartment: '501', block: 'Bloco A', model: 'Hyundai HB20', color: 'Branco', spot: 4 },
    ];
    this.nextId = 4;
  }

  list() {
    return [...this.reservations];
  }

  listAvailableSpots() {
    const occupiedSpots = this.reservations.map((reservation) => Number(reservation.spot));
    return Array.from({ length: TOTAL_SPOTS }, (_, index) => index + 1)
      .filter((spot) => !occupiedSpots.includes(spot));
  }

  save(data) {
    const spot = Number(data.spot);
    if (data.owner.length < 3 || data.owner.length > 30 || !OWNER_NAME_PATTERN.test(data.owner)) {
      throw new Error('Informe um nome válido para o proprietário, com até 30 caracteres.');
    }

    if (data.color.length < 2 || data.color.length > 30 || !COLOR_PATTERN.test(data.color)) {
      throw new Error('Informe uma cor válida para o veículo, com até 30 caracteres.');
    }

    if (data.model.length > 50 || !VEHICLE_MODEL_PATTERN.test(data.model)) {
      throw new Error('Informe um modelo de veículo válido, com até 50 caracteres.');
    }

    const normalizedPlate = data.plate.toUpperCase();
    const plateKey = normalizedPlate.replace(/-/g, '');
    if (!/^(?:[A-Z]{3}-\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/.test(normalizedPlate)) {
      throw new Error('A placa deve seguir o formato ABC-1234 (modelo antigo) ou ABC1D23 (Mercosul).');
    }

    if (!/^\d{1,3}$/.test(data.apartment) || Number(data.apartment) < 1) {
      throw new Error('O número do apartamento deve ter até 3 dígitos e ser maior que zero.');
    }

    if (!['Bloco A', 'Bloco B', 'Bloco C'].includes(data.block)) {
      throw new Error('Selecione um bloco válido.');
    }

    if (this.reservations.some((reservation) => reservation.plate.replace(/-/g, '').toUpperCase() === plateKey)) {
      throw new Error('Já existe uma reserva com essa placa.');
    }

    if (!this.listAvailableSpots().includes(spot)) {
      throw new Error('Selecione uma vaga que esteja disponível.');
    }

    const reservation = { ...data, spot, id: this.nextId++ };
    this.reservations.push(reservation);
    return reservation;
  }

  remove(id) {
    this.reservations = this.reservations.filter((reservation) => reservation.id !== Number(id));
  }
}
