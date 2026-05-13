/* eslint-disable */
import { downloadConstants } from '../constants';
import { pendingPaymentsFiscalConstants } from '../constants/pendingPaymentsFiscal.constants';
import { pendingPaymentsFiscalService } from '../services/pendingPaymentsFiscal.service';
import { alertActions } from '.';

export const pendingPaymentsFiscalActions = {

    //Ventas generales
    dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
        return dispatch => {
            dispatch(request());

            pendingPaymentsFiscalService.pendingPaymentsTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    pendingPayments => {
                        dispatch(success(pendingPayments))
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

        function request() { return { type: !isExcel ? pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(pendingPayments){ 
            if(!isExcel){
                return { type: pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_TABLE_SUCCESS, pendingPayments }
            }else{
                let data = pendingPayments;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },
   
    //Registrar pending payment
    pendingPaymentsCreate(pendingPayment) {
        return dispatch => {
            dispatch(request(pendingPayment));
            pendingPaymentsFiscalService.pendingPaymentsCreate(pendingPayment)
                .then(
                    pendingPayments => { 
                        dispatch(success(pendingPayments));
                        dispatch(alertActions.success('¡Se ha registrado el crédito correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(pendingPayments) { return { type: pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_CREATE_REQUEST, pendingPayments } }
        function success(pendingPayments) { return { type: pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_CREATE_SUCCESS, pendingPayments } }
        function failure(error) { return { type: pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_CREATE_FAILURE, error } }
    },

    //editar pending payment 
    pendingPaymentsUpdate(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            pendingPaymentsFiscalService.pendingPaymentsUpdate(id,data)
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
    
        function request(id) { return { type: pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_UPDATE_REQUEST, id } }
        function success() { return { type: pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_UPDATE_SUCCESS } }
        function failure(error) { return { type: pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_UPDATE_FAILURE, error } }
    },

};
