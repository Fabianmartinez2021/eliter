/* eslint-disable */
import { orderMiscellaneousConstants } from '../constants/orderMiscellaneous.constants';
import {offlineService, dataService } from '../services';
import { alertActions, pedingActions } from './';
import { orderMiscellaneousService } from '../services/orderMiscellaneous.service';
import { dataActions } from './data.actions';

export const orderMiscellaneousActions = {


    //Registrar pedido
    createOrder(user, order) {
        return dispatch => {
            dispatch(request(order));


            orderMiscellaneousService.orderCreate(user, order)
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

        function request(order) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_CREATE_REQUEST, order } }
        function success(order) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_CREATE_SUCCESS, order } }
        function failure(error) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_CREATE_FAILURE, error } }
    },

    //Actualizar información pedido
    updateOrder(user, id, order) {
        return dispatch => {
            dispatch(request(order));

            orderMiscellaneousService.orderUpdate(user, id, order)
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

        function request(id) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_UPDATE_REQUEST, id } }
        function success(order) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_UPDATE_SUCCESS, order } }
        function failure(error) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_UPDATE_FAILURE, error } }
    },

    // Tabla de los pedidos
    orderTable(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            orderMiscellaneousService.orderTable(user, pageIndex, pageSize, sortBy, filters)
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

        function request() { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_TABLE_REQUEST } }
        function success(order) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_TABLE_SUCCESS, order } }
        function failure(error) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_TABLE_FAILURE, error } }
    },

    // Obtenr información de una orden
    getOrder(id) {
        return dispatch => {
            dispatch(request(id));

            orderMiscellaneousService.orderGet(id)
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

        function request(id) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_GET_REQUEST, id } }
        function success(order) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_GET_SUCCESS, order } }
        function failure(error) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_GET_FAILURE, error } }
    },

    
    // Obtenr información de una orden
    getOrderHelper() {
        return dispatch => {
            dispatch(request());

            orderMiscellaneousService.getOrderHelper()
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

        function request() { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_GET_REQUEST } }
        function success(order) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_GET_SUCCESS, order } }
        function failure(error) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_GET_FAILURE, error } }
    },
    
    // Obtenr información de una orden
    setOrderHelper(user, data) {
        return dispatch => {
            dispatch(request());

            orderMiscellaneousService.setOrderHelper(user, data)
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

        function request() { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_SET_REQUEST } }
        function success(order) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_SET_SUCCESS, order } }
        function failure(error) { return { type: orderMiscellaneousConstants.ORDER_MISCELLANEOUS_HELPER_SET_FAILURE, error } }
    },
};
