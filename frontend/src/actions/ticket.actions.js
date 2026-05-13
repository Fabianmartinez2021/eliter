/* eslint-disable */
import { ticketConstants } from '../constants';
import { ticketService } from '../services';
import { alertActions } from './';

export const ticketActions = {

    dataTable(agency) {
        return dispatch => {
            dispatch(request());

            ticketService.ticketTable(agency)
                .then(
                    ticket => {
                        dispatch(success(ticket))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: ticketConstants.TICKET_TABLE_REQUEST } }
        function success(ticket) { return { type: ticketConstants.TICKET_TABLE_SUCCESS, ticket } }
        function failure(error) { return { type: ticketConstants.TICKET_TABLE_FAILURE, error } }
    },

    dataTableWholesale(agency) {
        return dispatch => {
            dispatch(request());

            ticketService.ticketTableWholesale(agency)
                .then(
                    ticket => {
                        dispatch(success(ticket))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: ticketConstants.TICKET_TABLE_REQUEST } }
        function success(ticket) { return { type: ticketConstants.TICKET_TABLE_SUCCESS, ticket } }
        function failure(error) { return { type: ticketConstants.TICKET_TABLE_FAILURE, error } }
    },

    //Registrar ticket
    createTicket(ticket) {
        return dispatch => {
            dispatch(request(ticket));

            ticketService.ticketCreate(ticket)
                .then(
                    ticket => { 
                        dispatch(success(ticket));
                        dispatch(alertActions.success('¡Se ha registrado venta en espera correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(ticket) { return { type: ticketConstants.TICKET_CREATE_REQUEST, ticket } }
        function success(ticket) { return { type: ticketConstants.TICKET_CREATE_SUCCESS, ticket } }
        function failure(error) { return { type: ticketConstants.TICKET_CREATE_FAILURE, error } }
    },

    //editar ticket
    updateTicket(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            ticketService.updateTicketData(id,data)
                .then(
                    () => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha actualizado la venta en espera correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: ticketConstants.TICKET_UPDATE_REQUEST, id } }
        function success() { return { type: ticketConstants.TICKET_UPDATE_SUCCESS } }
        function failure(error) { return { type: ticketConstants.TICKET_UPDATE_FAILURE, error } }
    },

    //eliminar ticket
    removeTicket(id, agency) {
        return dispatch => {
            dispatch(request(id));
    
            ticketService.removeTicket(id, agency)
                .then(
                    ticket => {
                        dispatch(success(ticket));
                        //actualizar data en el reducer de la tabla
                        dispatch(updateData(ticket));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: ticketConstants.TICKET_DELETE_REQUEST, id } }
        function success(ticket) { return { type: ticketConstants.TICKET_DELETE_SUCCESS, ticket } }
        function updateData(ticket) { return { type: ticketConstants.TICKET_TABLE_SUCCESS, ticket } }
        function failure(error) { return { type: ticketConstants.TICKET_DELETE_FAILURE, error } }
    },



};
