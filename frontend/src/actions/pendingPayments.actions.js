/* eslint-disable */
import { pendingPaymentsConstants, downloadConstants } from '../constants';
import { pendingPaymentsService } from '../services';
import { alertActions } from '.';

/** Mensaje legible desde reject (fetch/handleResponse suele ser string; en prod a veces objeto). */
function parseErrorMessage(err) {
    if (err == null) return '';
    if (typeof err === 'string') return err.trim();
    if (typeof err.message === 'string' && err.message) return err.message.trim();
    if (typeof err.response?.data?.message === 'string') return err.response.data.message.trim();
    try {
        const s = JSON.stringify(err);
        if (s && s !== '{}') return s;
    } catch (e) { /* noop */ }
    return String(err);
}

/** Respuesta típica del API cuando aún valida combos al mayor en un flujo de detalle. */
function isWholesaleComboValidationMessage(msg) {
    const m = (msg || '').toLowerCase();
    if (!m) return false;
    return /no existen combos/.test(m)
        || (/por los momentos/.test(m) && /combo/.test(m))
        || (/combos al mayor/.test(m) && /no existen|no hay|ningún|ningun/i.test(m));
}

export const pendingPaymentsActions = {

    //Ventas generales
    dataTable(user, pageIndex, pageSize, sortBy, filters, isExcel = false) {
        return dispatch => {
            dispatch(request());

            pendingPaymentsService.pendingPaymentsTable(user, pageIndex, pageSize, sortBy, filters, isExcel)
                .then(
                    pendingPayments => {
                        dispatch(success(pendingPayments))
                        if(isExcel){
                            dispatch(reset())
                        }
                    },
                    error => {
                        const msg = parseErrorMessage(error);
                        dispatch(failure(msg));
                        dispatch(alertActions.error(msg));
                    }
                );
        };

        function request() { return { type: !isExcel ? pendingPaymentsConstants.PENDING_PAYMENTS_TABLE_REQUEST: downloadConstants.EXCEL_TABLE_REQUEST } }
        function success(pendingPayments){ 
            if(!isExcel){
                return { type: pendingPaymentsConstants.PENDING_PAYMENTS_TABLE_SUCCESS, pendingPayments }
            }else{
                let data = pendingPayments;
                return { type: downloadConstants.EXCEL_TABLE_SUCCESS, data }
            }
        }
        function reset() { return { type: downloadConstants.EXCEL_TABLE_RESET } }
        function failure(error) { return { type: !isExcel ? pendingPaymentsConstants.PENDING_PAYMENTS_TABLE_FAILURE: downloadConstants.EXCEL_TABLE_FAILURE, error } }
    },
   
    //Registrar pending payment
    pendingPaymentsCreate(pendingPayment) {
        return dispatch => {
            dispatch(request(pendingPayment));
            pendingPaymentsService.pendingPaymentsCreate(pendingPayment)
                .then(
                    pendingPayments => { 
                        dispatch(success(pendingPayments));
                        dispatch(alertActions.success('¡Se ha registrado el crédito correctamente!'));
                    },
                    error => {
                        const msg = parseErrorMessage(error);
                        dispatch(failure(msg));
                        if (isWholesaleComboValidationMessage(msg)) {
                            dispatch(alertActions.error(
                                'Crédito no registrado: el API aplica una regla de combos al mayor; esta pantalla es venta al detalle (isWholesale: false). ' +
                                'Corrija en el backend create-pending-payments. Mensaje del servidor: ' + msg
                            ));
                        } else {
                            dispatch(alertActions.error(msg));
                        }
                    }
                );
        };

        function request(pendingPayments) { return { type: pendingPaymentsConstants.PENDING_PAYMENTS_CREATE_REQUEST, pendingPayments } }
        function success(pendingPayments) { return { type: pendingPaymentsConstants.PENDING_PAYMENTS_CREATE_SUCCESS, pendingPayments } }
        function failure(error) { return { type: pendingPaymentsConstants.PENDING_PAYMENTS_CREATE_FAILURE, error } }
    },

    //editar pending payment 
    pendingPaymentsUpdate(id, data) {
        return dispatch => {
            dispatch(request(id));
    
            pendingPaymentsService.pendingPaymentsUpdate(id,data)
                .then(
                    () => {
                        dispatch(success());
                        if (data.extendCreditItems === true || data.extendCreditItems === 'true') {
                            dispatch(alertActions.success('Productos registrados en la deuda correctamente.'));
                        } else {
                            dispatch(alertActions.success('¡Se ha registrado el pago correctamente!'));
                        }
                    },
                    error => {
                        const msg = parseErrorMessage(error);
                        dispatch(failure(msg));
                        dispatch(alertActions.error(msg));
                    }
                );
        };
    
        function request(id) { return { type: pendingPaymentsConstants.PENDING_PAYMENTS_UPDATE_REQUEST, id } }
        function success() { return { type: pendingPaymentsConstants.PENDING_PAYMENTS_UPDATE_SUCCESS } }
        function failure(error) { return { type: pendingPaymentsConstants.PENDING_PAYMENTS_UPDATE_FAILURE, error } }
    },

};
