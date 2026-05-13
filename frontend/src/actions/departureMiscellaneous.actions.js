/* eslint-disable */
import { departureMiscellaneousConstants } from '../constants/departuresMiscellaneous.constans';
import { departureMiscellaneousService } from '../services/departureMiscellaneous.service';
import { alertActions } from './';

export const departureMiscellaneousActions = {

    dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            departureMiscellaneousService.departureTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    departure => {
                        dispatch(success(departure))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_TABLE_REQUEST } }
        function success(departure) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_TABLE_SUCCESS, departure } }
        function failure(error) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_TABLE_FAILURE, error } }
    },

    //Registrar salida
    createDeparture(departure) {
        return dispatch => {
            dispatch(request(departure));

            departureMiscellaneousService.departureCreate(departure)
                .then(
                    sale => { 
                        dispatch(success(sale));
                        dispatch(alertActions.success('¡Se ha registrado la salida correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(departure) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_CREATE_REQUEST, departure } }
        function success(sale) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_CREATE_SUCCESS, sale } }
        function failure(error) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_CREATE_FAILURE, error } }
    },

    //Obtenr información salida
    getDeparture(id) {
        return dispatch => {
            dispatch(request(id));

            departureMiscellaneousService.departureGet(id)
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

        function request(id) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_GET_REQUEST, id } }
        function success(departure) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_GET_SUCCESS, departure } }
        function failure(error) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_GET_FAILURE, error } }
    },

    listDeparture() {
        return dispatch => {
            dispatch(request());

            departureMiscellaneousService.departureList()
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

        function request() { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_SELECT_REQUEST } }
        function success(list) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_SELECT_SUCCESS, list } }
        function failure(error) { return { type: departureMiscellaneousConstants.DEPARTURE_MISCELLANEOUS_SELECT_FAILURE, error } }
    },

};
