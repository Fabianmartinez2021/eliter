/* eslint-disable */
import { departureConstants, downloadConstants } from '../constants';
import { departureService } from '../services';
import { alertActions } from './';
import Swal from 'sweetalert2';

export const departureActions = {

    dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            departureService.departureTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    departure => {
                        dispatch(success(departure));
                        if (isExcel) {
                            dispatch(reset());
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() {
            return {
                type: !isExcel
                    ? departureConstants.DEPARTURE_TABLE_REQUEST
                    : downloadConstants.EXCEL_TABLE_REQUEST
            };
        }
        function success(departure) {
            if (!isExcel) {
                return { type: departureConstants.DEPARTURE_TABLE_SUCCESS, departure };
            } else {
                let data = departure;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data };
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET }; }
        function failure(error) {
            return {
                type: !isExcel
                    ? departureConstants.DEPARTURE_TABLE_FAILURE
                    : downloadConstants.EXCEL_TABLE_FAILURE,
                error
            };
        }
    },

    //Registrar salida
    createDeparture(departure) {
        return dispatch => {
            dispatch(request(departure));

            departureService.departureCreate(departure)
                .then(
                    sale => { 
                        dispatch(success(sale));
                        dispatch(alertActions.success('¡Se ha registrado la salida correctamente!'));
                    },
                    error => {
                        const msg = error && error.message ? error.message : error.toString();
                        dispatch(failure(msg));
                        // Detectar mensajes de stock insuficiente
                        const isStockError = msg && (msg.includes('No hay suficiente stock') || msg.includes('suficiente stock'));
                        if (error && (error.status === 400 || isStockError)) {
                            Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonText: 'Cerrar', confirmButtonColor: '#d33', allowOutsideClick: false });
                        } else {
                            dispatch(alertActions.error(msg));
                        }
                    }
                );
        };

        function request(departure) { return { type: departureConstants.DEPARTURE_CREATE_REQUEST, departure } }
        function success(sale) { return { type: departureConstants.DEPARTURE_CREATE_SUCCESS, sale } }
        function failure(error) { return { type: departureConstants.DEPARTURE_CREATE_FAILURE, error } }
    },

    //Obtenr información salida
    getDeparture(id) {
        return dispatch => {
            dispatch(request(id));

            departureService.departureGet(id)
                .then(
                    departure => {
                        dispatch(success(departure));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: departureConstants.DEPARTURE_GET_REQUEST, id } }
        function success(departure) { return { type: departureConstants.DEPARTURE_GET_SUCCESS, departure } }
        function failure(error) { return { type: departureConstants.DEPARTURE_GET_FAILURE, error } }
    },

    listDeparture() {
        return dispatch => {
            dispatch(request());

            departureService.departureList()
                .then(
                    list => {
                        dispatch(success(list));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: departureConstants.DEPARTURE_SELECT_REQUEST } }
        function success(list) { return { type: departureConstants.DEPARTURE_SELECT_SUCCESS, list } }
        function failure(error) { return { type: departureConstants.DEPARTURE_SELECT_FAILURE, error } }
    },

};
