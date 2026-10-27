import { ReservationModel } from './model/ReservationModel.js';
import { ParkingView } from './view/ParkingView.js';
import { ParkingController } from './controller/ParkingController.js';

const model = new ReservationModel();
const view = new ParkingView();
const controller = new ParkingController(model, view);
controller.init();
