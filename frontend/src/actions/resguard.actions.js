/* eslint-disable */
import { resguardConstants, downloadConstants } from '../constants';
import { resguardService } from '../services';
import { alertActions } from './';

export const resguardActions = {
    
    resguardAdd(user, resguard) {
        return dispatch => {
            dispatch(request(resguard));

            resguardService.resguardAdd(user, resguard)
                .then(
                    resguard => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha agregado el dinero al resguardo correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(resguard) { return { type: resguardConstants.RESGUARD_ADD_REQUEST, resguard } }
        function success(resguard) { return { type: resguardConstants.RESGUARD_ADD_SUCCESS, resguard } }
        function failure(error) { return { type: resguardConstants.RESGUARD_ADD_FAILURE, error } }
    },

    // Realizar un retiro de resguardo por parte de un gerente
    resguardWithdrawal(user, dataResguard) {
        return dispatch => {
            dispatch(request(user));
            resguardService.resguardWithdrawal(user, dataResguard)
                .then(
                    box => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha retirado del resguardo correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(resguard) { return { type: resguardConstants.RESGUARD_WITHDRAWAL_REQUEST, resguard } }
        function success(resguard) { return { type: resguardConstants.RESGUARD_WITHDRAWAL_SUCCESS, resguard } }
        function failure(error) { return { type: resguardConstants.RESGUARD_WITHDRAWAL_FAILURE, error } }
    },

    // Confirmar un retiro que se haya realizado por un gerente, cuando el dinero llegue correctamente
    resguardConfirmWithdrawal(user, id) {
        return dispatch => {
            dispatch(request(user));
            resguardService.resguardConfirmWithdrawal(user, id)
                .then(
                    box => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha realizado la confirmacion correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(resguard) { return { type: resguardConstants.RESGUARD_CONFIRM_REQUEST, resguard } }
        function success(resguard) { return { type: resguardConstants.RESGUARD_CONFIRM_SUCCESS, resguard } }
        function failure(error) { return { type: resguardConstants.RESGUARD_CONFIRM_FAILURE, error } }
    },
    resguardConfirmMultipleWithdrawals(user, ids) {
        return dispatch => {
            dispatch(request(user));
            resguardService.resguardConfirmMultipleWithdrawals(user, ids)
                .then(
                    () => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se han confirmado los retiros correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(resguard) { return { type: resguardConstants.RESGUARD_CONFIRM_MULTIPLE_REQUEST, resguard } }
        function success(resguard) { return { type: resguardConstants.RESGUARD_CONFIRM_MULTIPLE_SUCCESS, resguard } }
        function failure(error) { return { type: resguardConstants.RESGUARD_CONFIRM_MULTIPLE_FAILURE, error } }
    },
    
    getResguardOperation(user, id) {
        return dispatch => {
            dispatch(request(user));

            resguardService.getResguardOperation(user, id)
                .then(
                    resguard => { 
                        dispatch(success(resguard));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(resguard) { return { type: resguardConstants.RESGUARD_GET_REQUEST, resguard } }
        function success(resguard) { return { type: resguardConstants.RESGUARD_GET_SUCCESS, resguard } }
        function failure(error) { return { type: resguardConstants.RESGUARD_GET_FAILURE, error } }
    },

    //Reporte 
    resguardReport(user, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            resguardService.resguardReport(user, filters, isExcel)
                .then(
                    boxes => {
                        dispatch(success(boxes))
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

        function request() { return { type: !isExcel ? resguardConstants.RESGUARD_REPORT_REQUEST : downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(resguard) { 
            if(!isExcel){
                return { type: resguardConstants.RESGUARD_REPORT_SUCCESS, resguard }
            }else{
                let data = resguard;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: resguardConstants.RESGUARD_REPORT_FAILURE, error } }
    },

    resguardDataTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            resguardService.resguardDataTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    resguard => {
                        dispatch(success(resguard))
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

        function request() { return { type: !isExcel ? resguardConstants.RESGUARD_DATATABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(resguard) { 
            if(!isExcel){
                return { type: resguardConstants.RESGUARD_DATATABLE_SUCCESS, resguard }
            }else{
                let data = resguard;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? resguardConstants.RESGUARD_DATATABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },
    
    // Funcion similar a la del historial pero para obtener unicamente los retiros
    resguardWithdrawalsTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel) {
        return dispatch => {
            dispatch(request());

            resguardService.resguardWithdrawalsTableHistory(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    resguard => {
                        dispatch(success(resguard))
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

        function request() { return { type: !isExcel ? resguardConstants.RESGUARD_DATATABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(resguard) { 
            if(!isExcel){
                return { type: resguardConstants.RESGUARD_DATATABLE_SUCCESS, resguard }
            }else{
                let data = resguard;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? resguardConstants.RESGUARD_DATATABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

};
