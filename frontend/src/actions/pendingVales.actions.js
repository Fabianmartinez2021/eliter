/* eslint-disable */
import { downloadConstants } from '../constants';
import  pendingValesConstants  from '../constants/pendingVales.constants';
import pendingValesService from '../services/pendingVales.service';
import { alertActions } from '.';

const pendingValesActions = {

    //Ventas generales
    dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
        return dispatch => {
            dispatch(request());

            pendingValesService.pendingValesTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    pendingVales => {
                        dispatch(success(pendingVales))
                        if(isExcel){
                            dispatch(reset())
                        }
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: !isExcel ? pendingValesConstants.PENDING_VALES_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(pendingVales){ 
            if(!isExcel){
                return { type: pendingValesConstants.PENDING_VALES_TABLE_SUCCESS, pendingVales }
            }else{
                let data = pendingVales;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? pendingValesConstants.PENDING_VALES_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },
   
    //Registrar pending payment
    pendingValesCreate(pendingVales) {
        return dispatch => {
            dispatch(request(pendingVales));
            pendingValesService.pendingValesCreate(pendingVales)
                .then(
                    pendingVales => { 
                        dispatch(success(pendingVales));
                        dispatch(alertActions.success('¡Se ha registrado el crédito correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(pendingVales) { return { type: pendingValesConstants.PENDING_VALES_CREATE_REQUEST, pendingVales } }
        function success(pendingVales) { return { type: pendingValesConstants.PENDING_VALES_CREATE_SUCCESS, pendingVales } }
        function failure(error) { return { type: pendingValesConstants.PENDING_VALES_CREATE_FAILURE, error } }
    },

    //editar pending payment 
    pendingValesUpdate(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            pendingValesService.pendingValesUpdate(id,data)
                .then(
                    () => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado el pago correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: pendingValesConstants.PENDING_VALES_UPDATE_REQUEST, id } }
        function success() { return { type: pendingValesConstants.PENDING_VALES_UPDATE_SUCCESS } }
        function failure(error) { return { type: pendingValesConstants.PENDING_VALES_UPDATE_FAILURE, error } }
    },

};

export default pendingValesActions;