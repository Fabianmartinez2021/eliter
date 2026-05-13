/* eslint-disable */
import { accountsPayableConstants, downloadConstants } from '../constants';
import { accountsPayableService } from '../services';
import { alertActions } from '.';

export const accountsPayableActions = {

    dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
        return dispatch => {
            dispatch(request());

            accountsPayableService.accountsPayableTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    data => {
                        dispatch(success(data));
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

        function request() { return { type: !isExcel ? accountsPayableConstants.ACCOUNTS_PAYABLE_TABLE_REQUEST : downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(payload) {
            if (!isExcel) {
                return { type: accountsPayableConstants.ACCOUNTS_PAYABLE_TABLE_SUCCESS, accountsPayable: payload };
            }
            return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data: payload };
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? accountsPayableConstants.ACCOUNTS_PAYABLE_TABLE_FAILURE : downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },

    createAccountsPayable(payload) {
        return dispatch => {
            dispatch(request());

            accountsPayableService.createAccountsPayable(payload)
                .then(
                    () => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Cuenta por pagar e inventario registrados correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: accountsPayableConstants.ACCOUNTS_PAYABLE_CREATE_REQUEST } }
        function success() { return { type: accountsPayableConstants.ACCOUNTS_PAYABLE_CREATE_SUCCESS } }
        function failure(error) { return { type: accountsPayableConstants.ACCOUNTS_PAYABLE_CREATE_FAILURE, error } }
    },

    payAccountsPayable(id, payload) {
        return dispatch => {
            return accountsPayableService.payAccountsPayable(id, payload)
                .then(() => {
                    dispatch(alertActions.success('Cuenta marcada como pagada (registro informativo; no se afectan las cajas).'));
                })
                .catch(err => {
                    dispatch(alertActions.error(err.toString()));
                    return Promise.reject(err);
                });
        };
    },

    editAccountsPayablePayment(id, payload) {
        return dispatch => {
            return accountsPayableService.editAccountsPayablePayment(id, payload)
                .then(() => {
                    dispatch(alertActions.success('Pago actualizado correctamente.'));
                })
                .catch(err => {
                    dispatch(alertActions.error(err.toString()));
                    return Promise.reject(err);
                });
        };
    },
};
