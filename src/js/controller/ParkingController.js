export class ParkingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.currentScreen = 'registered';
    this.previousScreens = [];
    this.pendingReservation = null;
    this.searchQuery = '';
  }

  init() {
    this.view.bindNavigation((screen) => {
      if (screen === 'back') {
        this.goBack();
      } else {
        this.navigateTo(screen);
      }
    });
    this.view.bindReservation((data) => this.prepareReservation(data));
    this.view.bindRemove((id) => this.removeReservation(id));
    this.view.bindSearch((query) => {
      this.searchQuery = query;
      this.view.renderRegistered(this.model.list(), this.searchQuery);
    });
    this.view.bindAvailableSpots((spot) => {
      this.navigateTo('reservation');
      this.view.selectSpot(spot);
    });
    this.view.bindConfirmation(() => this.confirmReservation());
    this.render();
  }

  navigateTo(screen) {
    if (screen !== this.currentScreen) this.previousScreens.push(this.currentScreen);
    this.currentScreen = screen;
    this.view.navigate(screen);
  }

  goBack() {
    this.currentScreen = this.previousScreens.pop() || 'registered';
    this.view.navigate(this.currentScreen);
  }

  prepareReservation(data) {
    this.view.clearError();
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'string') data[key] = data[key].trim();
    });

    const isOtherModel = data.modelChoice === 'Outro';
    data.model = isOtherModel ? data.model : data.modelChoice;
    delete data.modelChoice;

    if (Object.entries(data).some(([key, value]) => key !== 'spot' && !value)) {
      this.view.showError('Preencha todos os campos antes de salvar.');
      return;
    }

    if (data.owner.length < 3 || data.owner.length > 30
      || !/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\u2019-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(data.owner)) {
      this.view.showError('Informe um nome válido com até 30 caracteres, usando apenas letras, espaços, hífen ou apóstrofo.');
      document.querySelector('[name="owner"]').focus();
      return;
    }

    if (data.color.length < 2 || data.color.length > 30
      || !/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(data.color)) {
      this.view.showError('Informe uma cor válida com até 30 caracteres, usando apenas letras, espaços ou hífen.');
      document.querySelector('[name="color"]').focus();
      return;
    }

    if (isOtherModel && (data.model.length > 50
      || !/^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ0-9]+| & [A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*$/.test(data.model))) {
      this.view.showError('Informe um modelo usando apenas letras, números, espaços, hífen ou &.');
      document.querySelector('#model-other').focus();
      return;
    }

    const plateKey = data.plate.toUpperCase().replace(/-/g, '');
    if (!/^[A-Z]{3}(?:\d{4}|\d[A-Z]\d{2})$/.test(plateKey)) {
      this.view.showError('Informe uma placa válida: ABC-1234 (modelo antigo) ou ABC1D23 (Mercosul).');
      document.querySelector('#plate-input').focus();
      return;
    }
    data.plate = /^\w{3}\d{4}$/.test(plateKey)
      ? `${plateKey.slice(0, 3)}-${plateKey.slice(3)}`
      : plateKey;

    if (!['Bloco A', 'Bloco B', 'Bloco C'].includes(data.block)) {
      this.view.showError('Selecione o bloco do apartamento.');
      document.querySelector('[name="block"]').focus();
      return;
    }

    if (!/^\d{1,3}$/.test(data.apartment) || Number(data.apartment) < 1) {
      this.view.showError('Informe um número de apartamento entre 1 e 3 dígitos.');
      document.querySelector('#apartment-input').focus();
      return;
    }

    const plateAlreadyUsed = this.model.list().some((reservation) => (
      reservation.plate.replace(/-/g, '').toUpperCase() === plateKey
    ));
    if (plateAlreadyUsed) {
      this.view.showError('Já existe uma reserva com essa placa.');
      document.querySelector('#plate-input').focus();
      return;
    }

    if (!this.model.listAvailableSpots().includes(data.spot)) {
      this.view.showError('Selecione uma vaga que esteja disponível.');
      return;
    }

    this.pendingReservation = data;
    this.view.showConfirmation(data);
    this.navigateTo('confirmation');
  }

  confirmReservation() {
    if (!this.pendingReservation) return;
    try {
      const reservation = this.model.save(this.pendingReservation);
      console.log('Dados da reserva:', reservation);
      this.pendingReservation = null;
      document.querySelector('#reservation-form').reset();
      this.render();
      this.previousScreens = [];
      this.currentScreen = 'registered';
      this.view.navigate('registered');
    } catch (error) {
      this.pendingReservation = null;
      this.navigateTo('reservation');
      this.view.showError(error.message);
    }
  }

  removeReservation(id) {
    if (!window.confirm('Confirma a remoção desta reserva?')) return;
    this.model.remove(id);
    this.render();
  }

  render() {
    this.view.renderRegistered(this.model.list(), this.searchQuery);
    const availableSpots = this.model.listAvailableSpots();
    this.view.renderAvailable(availableSpots);
    this.view.updateSpotOptions(availableSpots);
  }
}
