/* eslint-disable */
import { terminalConstants } from '../constants';
import { terminalService } from '../services';
import { alertActions, salesActions } from './';

export const terminalActions = {

    dataTable() {
        return dispatch => {
            dispatch(request());

            terminalService.terminalTable()
                .then(
                    terminals => {
                        dispatch(success(terminals))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: terminalConstants.TERMINAL_TABLE_REQUEST } }
        function success(terminals) { return { type: terminalConstants.TERMINAL_TABLE_SUCCESS, terminals } }
        function failure(error) { return { type: terminalConstants.TERMINAL_TABLE_FAILURE, error } }
    },

    createTerminal(terminal) {

        return dispatch => {
            dispatch(request(terminal));

            terminalService.terminalCreate(terminal)
                .then(
                    terminal => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado la terminal correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(terminal) { return { type: terminalConstants.TERMINAL_CREATE_REQUEST, terminal } }
        function success(terminal) { return { type: terminalConstants.TERMINAL_CREATE_SUCCESS, terminal } }
        function failure(error) { return { type: terminalConstants.TERMINAL_CREATE_FAILURE, error } }
    },

    //Obtenr información terminal
    getTerminal(id) {
        return dispatch => {
            dispatch(request(id));

            terminalService.terminalGet(id)
                .then(
                    terminal => {
                        dispatch(success(terminal));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: terminalConstants.TERMINAL_GET_REQUEST, id } }
        function success(terminal) { return { type: terminalConstants.TERMINAL_GET_SUCCESS, terminal } }
        function failure(error) { return { type: terminalConstants.TERMINAL_GET_FAILURE, error } }
    },

    //Actualizar información terminal
    updateTerminal(id, terminal, user) {

        return dispatch => {
            dispatch(request(terminal));

            terminalService.terminalUpdate(id,terminal)
                .then(
                    terminal => {
                        dispatch(success(terminal));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                        //Actualizar en el storage venta, monedas, productos y terminales de la sucursal 
                        dispatch(salesActions.salesDataFormUpdate( user.agency.id ));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: terminalConstants.TERMINAL_UPDATE_REQUEST, id } }
        function success(terminal) { return { type: terminalConstants.TERMINAL_UPDATE_SUCCESS, terminal } }
        function failure(error) { return { type: terminalConstants.TERMINAL_UPDATE_FAILURE, error } }
    },

    listTerminals() {
        return dispatch => {
            dispatch(request());

            terminalService.terminalList()
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

        function request() { return { type: terminalConstants.TERMINAL_SELECT_REQUEST } }
        function success(list) { return { type: terminalConstants.TERMINAL_SELECT_SUCCESS, list } }
        function failure(error) { return { type: terminalConstants.TERMINAL_SELECT_FAILURE, error } }
    },

    listUnused() {
        return dispatch => {
            dispatch(request());

            terminalService.terminalListUnused()
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

        function request() { return { type: terminalConstants.TERMINAL_SELECT_REQUEST } }
        function success(list) { return { type: terminalConstants.TERMINAL_SELECT_SUCCESS, list } }
        function failure(error) { return { type: terminalConstants.TERMINAL_SELECT_FAILURE, error } }
    },

    terminalRecordsTable(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            terminalService.terminalRecordsTable(user, pageIndex, pageSize, sortBy, filters)
                .then(
                    terminals => {
                        dispatch(success(terminals))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: terminalConstants.TERMINAL_RECORDS_REQUEST } }
        function success(records) { return { type: terminalConstants.TERMINAL_RECORDS_SUCCESS, records } }
        function failure(error) { return { type: terminalConstants.TERMINAL_RECORDS_FAILURE, error } }
    },
};
