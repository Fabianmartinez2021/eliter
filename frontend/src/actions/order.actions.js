/* eslint-disable */
import { orderConstants, downloadConstants } from '../constants';
import { orderService, offlineService, dataService } from '../services';
import { alertActions, pedingActions } from './';
import { dataActions } from './data.actions';

export const orderActions = {


    //Registrar pedido
    createOrder(user, order) {
        return dispatch => {
            dispatch(request(order));

            orderService.orderCreate(user, order)
                .then(
                    order => { 
                        dispatch(success(order));
                        dispatch(alertActions.success('¡Se ha registrado la orden correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(order) { return { type: orderConstants.ORDER_CREATE_REQUEST, order } }
        function success(order) { return { type: orderConstants.ORDER_CREATE_SUCCESS, order } }
        function failure(error) { return { type: orderConstants.ORDER_CREATE_FAILURE, error } }
    },

    //Actualizar información pedido
    updateOrder(user, id, order) {
        return dispatch => {
            dispatch(request(order));

            orderService.orderUpdate(user, id, order)
                .then(
                    order => {
                        dispatch(success(order));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: orderConstants.ORDER_UPDATE_REQUEST, id } }
        function success(order) { return { type: orderConstants.ORDER_UPDATE_SUCCESS, order } }
        function failure(error) { return { type: orderConstants.ORDER_UPDATE_FAILURE, error } }
    },

    // Tabla de los pedidos
    orderTable(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            orderService.orderTable(user, pageIndex, pageSize, sortBy, filters)
                .then(
                    order => {
                        dispatch(success(order))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: orderConstants.ORDER_TABLE_REQUEST } }
        function success(order) { return { type: orderConstants.ORDER_TABLE_SUCCESS, order } }
        function failure(error) { return { type: orderConstants.ORDER_TABLE_FAILURE, error } }
    },

    // Obtenr información de una orden
    getOrder(id) {
        return dispatch => {
            dispatch(request(id));

            orderService.orderGet(id)
                .then(
                    order => {
                        dispatch(success(order));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: orderConstants.ORDER_GET_REQUEST, id } }
        function success(order) { return { type: orderConstants.ORDER_GET_SUCCESS, order } }
        function failure(error) { return { type: orderConstants.ORDER_GET_FAILURE, error } }
    },

    
    // Obtenr información de una orden
    getOrderHelper() {
        return dispatch => {
            dispatch(request());

            orderService.getOrderHelper()
                .then(
                    order => {
                        dispatch(success(order));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: orderConstants.ORDER_HELPER_GET_REQUEST } }
        function success(order) { return { type: orderConstants.ORDER_HELPER_GET_SUCCESS, order } }
        function failure(error) { return { type: orderConstants.ORDER_HELPER_GET_FAILURE, error } }
    },
    
    // Obtenr información de una orden
    setOrderHelper(user, data) {
        return dispatch => {
            dispatch(request());

            orderService.setOrderHelper(user, data)
                .then(
                    order => {
                        dispatch(success(order));
                        dispatch(alertActions.success('¡Se ha registrado correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: orderConstants.ORDER_HELPER_SET_REQUEST } }
        function success(order) { return { type: orderConstants.ORDER_HELPER_SET_SUCCESS, order } }
        function failure(error) { return { type: orderConstants.ORDER_HELPER_SET_FAILURE, error } }
    },
};
